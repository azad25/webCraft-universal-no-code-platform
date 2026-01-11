"""Setup domain router"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import os
import platform
import psutil

from .service import SetupService

router = APIRouter(prefix="/setup")


class AdminUserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=255)
    company_name: Optional[str] = None
    send_welcome_email: bool = True


class DatabaseConfig(BaseModel):
    host: str = "localhost"
    port: int = 5432
    database: str = "webcraft_db"
    username: str = "webcraft"
    password: str = "password"
    use_docker: bool = True


class SetupConfig(BaseModel):
    admin_user: AdminUserCreate
    database: DatabaseConfig
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    from_email: Optional[str] = None
    openai_api_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    enable_analytics: bool = True
    enable_ai_features: bool = True


@router.get("/status")
async def get_setup_status():
    """Check if setup has been completed"""
    service = SetupService()
    return await service.get_setup_status()


@router.get("/requirements")
async def check_system_requirements():
    """Check system requirements for running WebCraft"""
    service = SetupService()
    return await service.check_system_requirements()


@router.post("/initialize")
async def initialize_setup(
    config: SetupConfig,
    background_tasks: BackgroundTasks
):
    """Initialize the platform with provided configuration"""
    if not config.admin_user.email or not config.admin_user.password:
        raise HTTPException(status_code=400, detail="Admin email and password are required")
    
    service = SetupService()
    background_tasks.add_task(service.run_setup_process, config.dict())
    
    return {
        "status": "initializing",
        "message": "Setup process started. This may take a few minutes.",
        "next_step": "monitor_progress"
    }


@router.get("/progress")
async def get_setup_progress():
    """Get current setup progress"""
    service = SetupService()
    return await service.get_setup_progress()


@router.post("/test-email")
async def test_email_configuration(
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    test_email: EmailStr
):
    """Test email configuration"""
    service = SetupService()
    return await service.test_email_configuration(smtp_host, smtp_port, smtp_user, smtp_password, test_email)


@router.post("/test-database")
async def test_database_connection(config: DatabaseConfig):
    """Test database connection"""
    service = SetupService()
    return await service.test_database_connection(config.dict())


@router.post("/skip")
async def skip_setup():
    """Skip setup wizard (for development)"""
    service = SetupService()
    return await service.skip_setup()
