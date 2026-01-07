"""
Scheduler Service for WebCraft Platform
Handles scheduled automation execution using APScheduler
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor
import logging
import os

from core.database import SessionLocal, Automation, AutomationLog
from core.redis_client import redis_client

logger = logging.getLogger(__name__)

# Database URL for job store
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://webcraft:password@localhost:5432/webcraft_db")


class SchedulerService:
    """Service for managing scheduled automations"""
    
    _instance = None
    _scheduler: Optional[AsyncIOScheduler] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._scheduler is None:
            self._initialize_scheduler()
    
    def _initialize_scheduler(self):
        """Initialize the APScheduler instance"""
        jobstores = {
            'default': SQLAlchemyJobStore(url=DATABASE_URL, tablename='apscheduler_jobs')
        }
        
        executors = {
            'default': AsyncIOExecutor()
        }
        
        job_defaults = {
            'coalesce': True,  # Combine multiple missed executions into one
            'max_instances': 3,  # Max concurrent instances of same job
            'misfire_grace_time': 60 * 5  # 5 minutes grace period for missed jobs
        }
        
        self._scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone='UTC'
        )
        
        logger.info("Scheduler initialized")
    
    async def start(self):
        """Start the scheduler"""
        if self._scheduler and not self._scheduler.running:
            self._scheduler.start()
            logger.info("Scheduler started")
            
            # Load existing scheduled automations
            await self._load_scheduled_automations()
    
    async def stop(self):
        """Stop the scheduler"""
        if self._scheduler and self._scheduler.running:
            self._scheduler.shutdown(wait=True)
            logger.info("Scheduler stopped")
    
    async def _load_scheduled_automations(self):
        """Load all scheduled automations from database"""
        db = SessionLocal()
        try:
            automations = db.query(Automation).filter(
                Automation.trigger_type == "schedule",
                Automation.is_enabled == True,
                Automation.is_active == True
            ).all()
            
            for automation in automations:
                await self.schedule_automation(automation)
            
            logger.info(f"Loaded {len(automations)} scheduled automations")
        finally:
            db.close()
    
    async def schedule_automation(self, automation: Automation) -> bool:
        """Schedule an automation based on its trigger config"""
        if not self._scheduler:
            return False
        
        trigger_config = automation.trigger_config or {}
        schedule_type = trigger_config.get("schedule_type", "cron")
        job_id = f"automation_{automation.id}"
        
        # Remove existing job if any
        try:
            self._scheduler.remove_job(job_id)
        except:
            pass
        
        try:
            if schedule_type == "cron":
                # Cron expression: "0 9 * * *" (9 AM daily)
                cron_expr = trigger_config.get("cron", "0 * * * *")
                trigger = CronTrigger.from_crontab(cron_expr)
            
            elif schedule_type == "interval":
                # Interval: every X minutes/hours/days
                interval_value = trigger_config.get("interval_value", 1)
                interval_unit = trigger_config.get("interval_unit", "hours")
                
                if interval_unit == "minutes":
                    trigger = IntervalTrigger(minutes=interval_value)
                elif interval_unit == "hours":
                    trigger = IntervalTrigger(hours=interval_value)
                elif interval_unit == "days":
                    trigger = IntervalTrigger(days=interval_value)
                else:
                    trigger = IntervalTrigger(hours=1)
            
            elif schedule_type == "once":
                # One-time execution at specific datetime
                run_at = trigger_config.get("run_at")
                if run_at:
                    trigger = DateTrigger(run_date=datetime.fromisoformat(run_at))
                else:
                    return False
            
            else:
                logger.warning(f"Unknown schedule type: {schedule_type}")
                return False
            
            # Add job
            self._scheduler.add_job(
                self._execute_automation,
                trigger=trigger,
                id=job_id,
                args=[str(automation.id)],
                name=f"Automation: {automation.name}",
                replace_existing=True
            )
            
            logger.info(f"Scheduled automation {automation.id}: {automation.name}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to schedule automation {automation.id}: {e}")
            return False
    
    async def unschedule_automation(self, automation_id: str) -> bool:
        """Remove an automation from the schedule"""
        if not self._scheduler:
            return False
        
        job_id = f"automation_{automation_id}"
        try:
            self._scheduler.remove_job(job_id)
            logger.info(f"Unscheduled automation {automation_id}")
            return True
        except:
            return False
    
    async def _execute_automation(self, automation_id: str):
        """Execute a scheduled automation"""
        from routers.automations import execute_automation_workflow
        
        db = SessionLocal()
        try:
            automation = db.query(Automation).filter(
                Automation.id == automation_id,
                Automation.is_enabled == True,
                Automation.is_active == True
            ).first()
            
            if not automation:
                logger.warning(f"Automation {automation_id} not found or disabled")
                return
            
            logger.info(f"Executing scheduled automation: {automation.name}")
            
            # Execute the workflow
            trigger_data = {
                "trigger_type": "schedule",
                "scheduled_at": datetime.utcnow().isoformat(),
                "automation_id": automation_id
            }
            
            await execute_automation_workflow(automation.id, trigger_data, db)
            
        except Exception as e:
            logger.error(f"Error executing automation {automation_id}: {e}")
            
            # Log the error
            log = AutomationLog(
                automation_id=automation_id,
                status="failed",
                trigger_data={"trigger_type": "schedule"},
                error_message=str(e),
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow()
            )
            db.add(log)
            db.commit()
        finally:
            db.close()
    
    def get_scheduled_jobs(self) -> List[Dict[str, Any]]:
        """Get all scheduled jobs"""
        if not self._scheduler:
            return []
        
        jobs = []
        for job in self._scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        
        return jobs
    
    def get_job_info(self, automation_id: str) -> Optional[Dict[str, Any]]:
        """Get info about a specific scheduled job"""
        if not self._scheduler:
            return None
        
        job_id = f"automation_{automation_id}"
        job = self._scheduler.get_job(job_id)
        
        if not job:
            return None
        
        return {
            "id": job.id,
            "name": job.name,
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger)
        }
    
    async def trigger_now(self, automation_id: str) -> bool:
        """Trigger an automation immediately"""
        if not self._scheduler:
            return False
        
        job_id = f"automation_{automation_id}"
        job = self._scheduler.get_job(job_id)
        
        if job:
            # Run immediately
            self._scheduler.modify_job(job_id, next_run_time=datetime.utcnow())
            return True
        
        return False


# Global scheduler instance
scheduler_service = SchedulerService()


async def init_scheduler():
    """Initialize and start the scheduler"""
    await scheduler_service.start()


async def shutdown_scheduler():
    """Shutdown the scheduler"""
    await scheduler_service.stop()
