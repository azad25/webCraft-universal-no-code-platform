"""Scheduler router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.schemas import UserResponse
from .service import SchedulerService
from .schemas import (
    ScheduledJobCreate, ScheduledJobUpdate, ScheduledJobResponse,
    JobExecutionResponse, JobStatsResponse, JobExecuteRequest
)

router = APIRouter(prefix="/scheduler")


# Job CRUD endpoints
@router.get("/jobs")
async def list_jobs(
    job_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List scheduled jobs"""
    service = SchedulerService(db)
    
    return await service.list_jobs(
        str(current_user.id),
        job_type=job_type,
        is_active=is_active,
        page=page,
        per_page=per_page
    )


@router.post("/jobs", response_model=ScheduledJobResponse)
async def create_job(
    job_data: ScheduledJobCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a scheduled job"""
    service = SchedulerService(db)
    
    try:
        return await service.create_job(str(current_user.id), job_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/jobs/{job_id}", response_model=ScheduledJobResponse)
async def get_job(
    job_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific job"""
    service = SchedulerService(db)
    
    job = await service.get_job(str(job_id), str(current_user.id))
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job


@router.put("/jobs/{job_id}", response_model=ScheduledJobResponse)
async def update_job(
    job_id: uuid.UUID = Path(...),
    updates: ScheduledJobUpdate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a scheduled job"""
    service = SchedulerService(db)
    
    job = await service.update_job(str(job_id), str(current_user.id), updates)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a scheduled job"""
    service = SchedulerService(db)
    
    success = await service.delete_job(str(job_id), str(current_user.id))
    
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {"message": "Job deleted successfully"}


# Job execution endpoints
@router.post("/jobs/{job_id}/execute")
async def execute_job(
    job_id: uuid.UUID = Path(...),
    request: Optional[JobExecuteRequest] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute a job manually"""
    service = SchedulerService(db)
    
    try:
        return await service.execute_job(str(job_id), str(current_user.id), request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/jobs/{job_id}/executions")
async def list_job_executions(
    job_id: uuid.UUID = Path(...),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List executions for a job"""
    service = SchedulerService(db)
    
    try:
        return await service.list_job_executions(
            str(job_id), str(current_user.id),
            status=status, page=page, per_page=per_page
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Statistics endpoints
@router.get("/stats", response_model=JobStatsResponse)
async def get_job_stats(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get job statistics"""
    service = SchedulerService(db)
    
    return await service.get_job_stats(str(current_user.id))