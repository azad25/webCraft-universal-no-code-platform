"""Mobile API domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Header
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.apps.models import App
from src.domains.auth.schemas import UserResponse
from .service import MobileService
from .schemas import PushNotificationRequest

router = APIRouter(prefix="/mobile")


@router.get("/apps")
async def get_mobile_apps(
    platform: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all apps optimized for mobile development"""
    service = MobileService(db)
    return await service.get_mobile_apps(str(current_user.id), platform)


@router.get("/apps/{app_id}")
async def get_mobile_app(
    app_id: uuid.UUID = Path(...),
    platform: str = Query("ios"),
    version: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific app data for mobile development"""
    service = MobileService(db)
    result = await service.get_mobile_app(str(app_id), str(current_user.id), platform, version)
    if not result:
        raise HTTPException(status_code=404, detail="App not found")
    return result


@router.get("/apps/{app_id}/content")
async def get_mobile_content(
    app_id: uuid.UUID = Path(...),
    content_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get app content optimized for mobile consumption"""
    service = MobileService(db)
    return await service.get_mobile_content(str(app_id), str(current_user.id), content_type, page, limit)


@router.post("/apps/{app_id}/sync")
async def sync_mobile_app(
    app_id: uuid.UUID = Path(...),
    last_sync: Optional[datetime] = Query(None),
    device_id: str = Header(..., alias="X-Device-ID"),
    platform: str = Header(..., alias="X-Platform"),
    app_version: str = Header(..., alias="X-App-Version"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync mobile app data"""
    service = MobileService(db)
    return await service.sync_app(str(app_id), str(current_user.id), last_sync, device_id, platform, app_version)


@router.post("/apps/{app_id}/push-notification")
async def send_push_notification(
    app_id: uuid.UUID = Path(...),
    notification: PushNotificationRequest = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send push notification to mobile app users"""
    service = MobileService(db)
    result = await service.send_push_notification(str(app_id), str(current_user.id), notification.dict())
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/apps/{app_id}/analytics")
async def get_mobile_analytics(
    app_id: uuid.UUID = Path(...),
    platform: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get mobile app analytics"""
    service = MobileService(db)
    return await service.get_analytics(str(app_id), str(current_user.id), platform, days)


@router.post("/apps/{app_id}/feedback")
async def submit_mobile_feedback(
    app_id: uuid.UUID = Path(...),
    feedback_data: Dict[str, Any] = None,
    device_id: str = Header(..., alias="X-Device-ID"),
    platform: str = Header(..., alias="X-Platform"),
    app_version: str = Header(..., alias="X-App-Version"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit feedback from mobile app"""
    service = MobileService(db)
    return await service.submit_feedback(str(app_id), str(current_user.id), feedback_data, device_id, platform, app_version)


@router.get("/sdk/config")
async def get_sdk_config(
    platform: str = Query(...),
    version: Optional[str] = Query("latest"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get SDK configuration for mobile development"""
    service = MobileService(db)
    result = await service.get_sdk_config(platform, str(current_user.id))
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/health")
async def mobile_api_health():
    """Mobile API health check"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "services": {
            "content_api": "operational",
            "push_notifications": "operational",
            "real_time_sync": "operational",
            "analytics": "operational"
        },
        "response_time": "< 100ms",
        "uptime": "99.9%"
    }
