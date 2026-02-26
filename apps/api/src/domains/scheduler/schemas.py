"""Scheduler schemas"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid


class ScheduledJobCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    job_type: str = Field(..., min_length=1, max_length=50)
    schedule_type: str = Field(..., pattern="^(cron|interval|once)$")
    cron_expression: Optional[str] = Field(None, max_length=100)
    interval_seconds: Optional[int] = Field(None, gt=0)
    scheduled_at: Optional[datetime] = None
    job_config: Dict[str, Any] = Field(default_factory=dict)
    max_retries: int = Field(default=3, ge=0, le=10)
    retry_delay_seconds: int = Field(default=60, gt=0)
    timeout_seconds: int = Field(default=300, gt=0, le=3600)
    
    @validator('cron_expression')
    def validate_cron_expression(cls, v, values):
        if values.get('schedule_type') == 'cron' and not v:
            raise ValueError('cron_expression is required for cron schedule type')
        return v
    
    @validator('interval_seconds')
    def validate_interval_seconds(cls, v, values):
        if values.get('schedule_type') == 'interval' and not v:
            raise ValueError('interval_seconds is required for interval schedule type')
        return v
    
    @validator('scheduled_at')
    def validate_scheduled_at(cls, v, values):
        if values.get('schedule_type') == 'once' and not v:
            raise ValueError('scheduled_at is required for once schedule type')
        return v


class ScheduledJobUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    schedule_type: Optional[str] = Field(None, pattern="^(cron|interval|once)$")
    cron_expression: Optional[str] = Field(None, max_length=100)
    interval_seconds: Optional[int] = Field(None, gt=0)
    scheduled_at: Optional[datetime] = None
    job_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    max_retries: Optional[int] = Field(None, ge=0, le=10)
    retry_delay_seconds: Optional[int] = Field(None, gt=0)
    timeout_seconds: Optional[int] = Field(None, gt=0, le=3600)


class JobExecutionResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    duration_ms: Optional[int]
    result_data: Dict[str, Any]
    error_message: Optional[str]
    retry_attempt: int
    
    class Config:
        from_attributes = True


class ScheduledJobResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    job_type: str
    schedule_type: str
    cron_expression: Optional[str]
    interval_seconds: Optional[int]
    scheduled_at: Optional[datetime]
    job_config: Dict[str, Any]
    is_active: bool
    last_run_at: Optional[datetime]
    next_run_at: Optional[datetime]
    run_count: int
    last_status: Optional[str]
    last_error: Optional[str]
    last_duration_ms: Optional[int]
    max_retries: int
    retry_count: int
    retry_delay_seconds: int
    timeout_seconds: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class JobStatsResponse(BaseModel):
    total_jobs: int
    active_jobs: int
    jobs_by_type: Dict[str, int]
    jobs_by_status: Dict[str, int]
    executions_today: int
    executions_this_week: int
    executions_this_month: int
    success_rate: float
    average_duration_ms: float


class JobExecuteRequest(BaseModel):
    override_config: Optional[Dict[str, Any]] = None