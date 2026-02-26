"""Scheduler models"""
from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from src.core.database import Base


class ScheduledJob(Base):
    """Scheduled jobs"""
    __tablename__ = "scheduled_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Job info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    job_type = Column(String(50), nullable=False)  # automation, data_sync, backup, etc.
    
    # Schedule configuration
    schedule_type = Column(String(20), nullable=False)  # cron, interval, once
    cron_expression = Column(String(100), nullable=True)  # For cron jobs
    interval_seconds = Column(Integer, nullable=True)  # For interval jobs
    scheduled_at = Column(DateTime, nullable=True)  # For one-time jobs
    
    # Job configuration
    job_config = Column(JSONB, default={})
    
    # Status
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    run_count = Column(Integer, default=0)
    
    # Results
    last_status = Column(String(20), nullable=True)  # success, failed, running
    last_error = Column(Text, nullable=True)
    last_duration_ms = Column(Integer, nullable=True)
    
    # Retry configuration
    max_retries = Column(Integer, default=3)
    retry_count = Column(Integer, default=0)
    retry_delay_seconds = Column(Integer, default=60)
    
    # Timeout
    timeout_seconds = Column(Integer, default=300)  # 5 minutes default
    
    # User relationship
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_by = relationship("User")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    executions = relationship("JobExecution", back_populates="job", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_scheduled_job_creator', 'created_by_id'),
        Index('idx_scheduled_job_type', 'job_type'),
        Index('idx_scheduled_job_active', 'is_active'),
        Index('idx_scheduled_job_next_run', 'next_run_at'),
    )


class JobExecution(Base):
    """Job execution history"""
    __tablename__ = "job_executions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Job relationship
    job_id = Column(UUID(as_uuid=True), ForeignKey("scheduled_jobs.id"), nullable=False)
    job = relationship("ScheduledJob", back_populates="executions")
    
    # Execution info
    status = Column(String(20), nullable=False)  # running, success, failed, timeout, cancelled
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    
    # Results
    result_data = Column(JSONB, default={})
    error_message = Column(Text, nullable=True)
    error_traceback = Column(Text, nullable=True)
    
    # Retry info
    retry_attempt = Column(Integer, default=0)
    
    # Logs
    logs = Column(Text, nullable=True)
    
    # Indexes
    __table_args__ = (
        Index('idx_job_execution_job', 'job_id'),
        Index('idx_job_execution_status', 'status'),
        Index('idx_job_execution_started', 'started_at'),
    )