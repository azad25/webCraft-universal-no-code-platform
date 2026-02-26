"""Scheduler service"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import asyncio
try:
    from croniter import croniter
    HAS_CRONITER = True
except ImportError:
    HAS_CRONITER = False

from .models import ScheduledJob, JobExecution
from .schemas import (
    ScheduledJobCreate, ScheduledJobUpdate, ScheduledJobResponse,
    JobExecutionResponse, JobStatsResponse, JobExecuteRequest
)
from src.domains.auth.models import User


class SchedulerService:
    def __init__(self, db: Session):
        self.db = db
    
    # Job CRUD operations
    async def create_job(self, user_id: str, data: ScheduledJobCreate) -> ScheduledJobResponse:
        """Create a scheduled job"""
        job = ScheduledJob(
            created_by_id=user_id,
            **data.dict()
        )
        
        # Calculate next run time
        job.next_run_at = self._calculate_next_run(job)
        
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        
        return ScheduledJobResponse.from_orm(job)
    
    async def get_job(self, job_id: str, user_id: str) -> Optional[ScheduledJobResponse]:
        """Get a specific job"""
        job = self.db.query(ScheduledJob).filter(
            ScheduledJob.id == job_id,
            ScheduledJob.created_by_id == user_id
        ).first()
        
        if not job:
            return None
        
        return ScheduledJobResponse.from_orm(job)
    
    async def list_jobs(
        self,
        user_id: str,
        job_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        per_page: int = 50
    ) -> Dict[str, Any]:
        """List user's scheduled jobs"""
        query = self.db.query(ScheduledJob).filter(
            ScheduledJob.created_by_id == user_id
        )
        
        # Apply filters
        if job_type:
            query = query.filter(ScheduledJob.job_type == job_type)
        
        if is_active is not None:
            query = query.filter(ScheduledJob.is_active == is_active)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        jobs = query.order_by(desc(ScheduledJob.created_at)).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        return {
            "jobs": [ScheduledJobResponse.from_orm(job) for job in jobs],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    
    async def update_job(self, job_id: str, user_id: str, data: ScheduledJobUpdate) -> Optional[ScheduledJobResponse]:
        """Update a scheduled job"""
        job = self.db.query(ScheduledJob).filter(
            ScheduledJob.id == job_id,
            ScheduledJob.created_by_id == user_id
        ).first()
        
        if not job:
            return None
        
        # Update fields
        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(job, field, value)
        
        # Recalculate next run time if schedule changed
        if any(field in update_data for field in ['schedule_type', 'cron_expression', 'interval_seconds', 'scheduled_at']):
            job.next_run_at = self._calculate_next_run(job)
        
        job.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(job)
        
        return ScheduledJobResponse.from_orm(job)
    
    async def delete_job(self, job_id: str, user_id: str) -> bool:
        """Delete a scheduled job"""
        job = self.db.query(ScheduledJob).filter(
            ScheduledJob.id == job_id,
            ScheduledJob.created_by_id == user_id
        ).first()
        
        if not job:
            return False
        
        # Delete executions
        self.db.query(JobExecution).filter(JobExecution.job_id == job_id).delete()
        
        # Delete job
        self.db.delete(job)
        self.db.commit()
        
        return True
    
    # Job execution
    async def execute_job(self, job_id: str, user_id: str, request: Optional[JobExecuteRequest] = None) -> Dict[str, Any]:
        """Execute a job manually"""
        job = self.db.query(ScheduledJob).filter(
            ScheduledJob.id == job_id,
            ScheduledJob.created_by_id == user_id
        ).first()
        
        if not job:
            raise ValueError("Job not found")
        
        # Create execution record
        execution = JobExecution(
            job_id=job.id,
            status="running"
        )
        
        self.db.add(execution)
        self.db.commit()
        self.db.refresh(execution)
        
        # Execute job asynchronously
        asyncio.create_task(self._execute_job_async(job, execution, request))
        
        return {
            "execution_id": str(execution.id),
            "message": "Job execution started",
            "status": "running"
        }
    
    async def _execute_job_async(self, job: ScheduledJob, execution: JobExecution, request: Optional[JobExecuteRequest] = None):
        """Execute job asynchronously"""
        try:
            start_time = datetime.utcnow()
            
            # Merge job config with override config
            job_config = job.job_config.copy()
            if request and request.override_config:
                job_config.update(request.override_config)
            
            # Execute based on job type
            result = await self._execute_job_by_type(job.job_type, job_config)
            
            # Update execution record
            end_time = datetime.utcnow()
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            execution.status = "success"
            execution.completed_at = end_time
            execution.duration_ms = duration_ms
            execution.result_data = result
            
            # Update job record
            job.last_run_at = start_time
            job.last_status = "success"
            job.last_duration_ms = duration_ms
            job.last_error = None
            job.run_count += 1
            job.retry_count = 0
            
            # Calculate next run time
            if job.is_active:
                job.next_run_at = self._calculate_next_run(job)
            
        except Exception as e:
            # Update execution record with error
            execution.status = "failed"
            execution.completed_at = datetime.utcnow()
            execution.error_message = str(e)
            
            # Update job record
            job.last_status = "failed"
            job.last_error = str(e)
            job.retry_count += 1
            
            # Schedule retry if within retry limit
            if job.retry_count < job.max_retries:
                job.next_run_at = datetime.utcnow() + timedelta(seconds=job.retry_delay_seconds)
        
        finally:
            self.db.commit()
    
    async def _execute_job_by_type(self, job_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute job based on its type"""
        if job_type == "automation":
            return await self._execute_automation_job(config)
        elif job_type == "data_sync":
            return await self._execute_data_sync_job(config)
        elif job_type == "backup":
            return await self._execute_backup_job(config)
        elif job_type == "cleanup":
            return await self._execute_cleanup_job(config)
        else:
            raise ValueError(f"Unknown job type: {job_type}")
    
    async def _execute_automation_job(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute automation job"""
        # Placeholder for automation execution
        return {"message": "Automation executed", "config": config}
    
    async def _execute_data_sync_job(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute data sync job"""
        # Placeholder for data sync execution
        return {"message": "Data sync executed", "config": config}
    
    async def _execute_backup_job(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute backup job"""
        # Placeholder for backup execution
        return {"message": "Backup executed", "config": config}
    
    async def _execute_cleanup_job(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute cleanup job"""
        # Placeholder for cleanup execution
        return {"message": "Cleanup executed", "config": config}
    
    # Job executions
    async def list_job_executions(
        self,
        job_id: str,
        user_id: str,
        status: Optional[str] = None,
        page: int = 1,
        per_page: int = 50
    ) -> Dict[str, Any]:
        """List executions for a job"""
        # Verify job ownership
        job = self.db.query(ScheduledJob).filter(
            ScheduledJob.id == job_id,
            ScheduledJob.created_by_id == user_id
        ).first()
        
        if not job:
            raise ValueError("Job not found")
        
        query = self.db.query(JobExecution).filter(
            JobExecution.job_id == job_id
        )
        
        if status:
            query = query.filter(JobExecution.status == status)
        
        total = query.count()
        
        executions = query.order_by(desc(JobExecution.started_at)).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        return {
            "executions": [JobExecutionResponse.from_orm(exec) for exec in executions],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    
    # Statistics
    async def get_job_stats(self, user_id: str) -> JobStatsResponse:
        """Get job statistics"""
        # Basic stats
        total_jobs = self.db.query(ScheduledJob).filter(
            ScheduledJob.created_by_id == user_id
        ).count()
        
        active_jobs = self.db.query(ScheduledJob).filter(
            ScheduledJob.created_by_id == user_id,
            ScheduledJob.is_active == True
        ).count()
        
        # Jobs by type
        jobs_by_type = {}
        type_stats = self.db.query(
            ScheduledJob.job_type,
            func.count(ScheduledJob.id)
        ).filter(
            ScheduledJob.created_by_id == user_id
        ).group_by(ScheduledJob.job_type).all()
        
        for job_type, count in type_stats:
            jobs_by_type[job_type] = count
        
        # Jobs by status
        jobs_by_status = {}
        status_stats = self.db.query(
            ScheduledJob.last_status,
            func.count(ScheduledJob.id)
        ).filter(
            ScheduledJob.created_by_id == user_id
        ).group_by(ScheduledJob.last_status).all()
        
        for status, count in status_stats:
            jobs_by_status[status or "never_run"] = count
        
        # Execution stats
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        executions_today = self.db.query(JobExecution).join(ScheduledJob).filter(
            ScheduledJob.created_by_id == user_id,
            JobExecution.started_at >= today
        ).count()
        
        executions_week = self.db.query(JobExecution).join(ScheduledJob).filter(
            ScheduledJob.created_by_id == user_id,
            JobExecution.started_at >= week_ago
        ).count()
        
        executions_month = self.db.query(JobExecution).join(ScheduledJob).filter(
            ScheduledJob.created_by_id == user_id,
            JobExecution.started_at >= month_ago
        ).count()
        
        # Success rate
        total_executions = self.db.query(JobExecution).join(ScheduledJob).filter(
            ScheduledJob.created_by_id == user_id
        ).count()
        
        successful_executions = self.db.query(JobExecution).join(ScheduledJob).filter(
            ScheduledJob.created_by_id == user_id,
            JobExecution.status == "success"
        ).count()
        
        success_rate = (successful_executions / total_executions * 100) if total_executions > 0 else 0
        
        # Average duration
        avg_duration = self.db.query(func.avg(JobExecution.duration_ms)).join(ScheduledJob).filter(
            ScheduledJob.created_by_id == user_id,
            JobExecution.status == "success"
        ).scalar() or 0
        
        return JobStatsResponse(
            total_jobs=total_jobs,
            active_jobs=active_jobs,
            jobs_by_type=jobs_by_type,
            jobs_by_status=jobs_by_status,
            executions_today=executions_today,
            executions_this_week=executions_week,
            executions_this_month=executions_month,
            success_rate=round(success_rate, 2),
            average_duration_ms=round(avg_duration, 2)
        )
    
    # Helper methods
    def _calculate_next_run(self, job: ScheduledJob) -> Optional[datetime]:
        """Calculate next run time for a job"""
        if not job.is_active:
            return None
        
        now = datetime.utcnow()
        
        if job.schedule_type == "once":
            return job.scheduled_at if job.scheduled_at and job.scheduled_at > now else None
        
        elif job.schedule_type == "interval":
            if job.last_run_at:
                return job.last_run_at + timedelta(seconds=job.interval_seconds)
            else:
                return now + timedelta(seconds=job.interval_seconds)
        
        elif job.schedule_type == "cron":
            if not HAS_CRONITER:
                return None
            try:
                cron = croniter(job.cron_expression, now)
                return cron.get_next(datetime)
            except Exception:
                return None
        
        return None