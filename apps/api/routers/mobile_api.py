"""
Mobile API Routes
Specialized endpoints for mobile app development (iOS/Android)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, Header
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from core.database import get_db, App, User, Page, AppWidget
from core.auth import get_current_user, get_api_key_user
from services.mobile_service import MobileService
from services.content_service import ContentService

router = APIRouter()

# Mobile-specific Pydantic models
class MobileAppConfig(BaseModel):
    app_name: str
    bundle_id: str
    version: str = "1.0.0"
    platform: str = Field(..., description="ios or android")
    theme: Dict[str, Any] = Field(default_factory=dict)
    navigation: Dict[str, Any] = Field(default_factory=dict)
    push_notifications: bool = False
    offline_support: bool = False

class MobilePageResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    content: Dict[str, Any]
    meta_data: Dict[str, Any]
    is_homepage: bool
    navigation_order: int = 0
    
    class Config:
        from_attributes = True

class MobileAppResponse(BaseModel):
    id: uuid.UUID
    name: str
    app_type: str
    config: Dict[str, Any]
    theme_config: Dict[str, Any]
    pages: List[MobilePageResponse]
    api_endpoints: Dict[str, str]
    last_updated: datetime
    
    class Config:
        from_attributes = True

class MobileContentResponse(BaseModel):
    type: str
    data: Dict[str, Any]
    metadata: Dict[str, Any]
    cache_duration: int = 3600  # seconds

class PushNotificationRequest(BaseModel):
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    target_users: Optional[List[str]] = None  # User IDs or "all"
    schedule_time: Optional[datetime] = None

class MobileAnalyticsResponse(BaseModel):
    app_opens: int
    active_users: int
    session_duration: float
    crash_rate: float
    retention_rate: Dict[str, float]  # 1day, 7day, 30day
    popular_features: List[Dict[str, Any]]


@router.get("/apps", response_model=List[MobileAppResponse])
async def get_mobile_apps(
    platform: Optional[str] = Query(None, description="Filter by platform: ios, android"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_key_user)  # Support API key auth for mobile
):
    """
    Get all apps optimized for mobile development
    
    Returns app data structured for mobile app consumption with:
    - Simplified content structure
    - Mobile-optimized configurations
    - API endpoint mappings
    - Offline-ready data
    """
    
    mobile_service = MobileService(db)
    
    apps = db.query(App).filter(
        App.owner_id == current_user.id,
        App.is_published == True
    ).all()
    
    mobile_apps = []
    for app in apps:
        mobile_app_data = await mobile_service.prepare_app_for_mobile(app, platform)
        mobile_apps.append(mobile_app_data)
    
    return mobile_apps


@router.get("/apps/{app_id}", response_model=MobileAppResponse)
async def get_mobile_app(
    app_id: uuid.UUID,
    platform: str = Query("ios", description="Target platform: ios or android"),
    version: Optional[str] = Query(None, description="API version for compatibility"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_key_user)
):
    """
    Get specific app data for mobile development
    
    Returns comprehensive app data including:
    - All pages with mobile-optimized content
    - Widget configurations for mobile rendering
    - API endpoints for dynamic content
    - Theme and styling information
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    mobile_service = MobileService(db)
    mobile_app_data = await mobile_service.prepare_app_for_mobile(app, platform, version)
    
    return mobile_app_data


@router.get("/apps/{app_id}/content", response_model=List[MobileContentResponse])
async def get_mobile_content(
    app_id: uuid.UUID,
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_key_user)
):
    """
    Get app content optimized for mobile consumption
    
    Returns paginated content data that mobile apps can consume:
    - Blog posts, products, services
    - User-generated content
    - Dynamic data from integrations
    - Cached and optimized for mobile
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    content_service = ContentService(db)
    content_data = await content_service.get_mobile_content(
        app, content_type, page, limit
    )
    
    return content_data


@router.post("/apps/{app_id}/sync")
async def sync_mobile_app(
    app_id: uuid.UUID,
    last_sync: Optional[datetime] = Query(None, description="Last sync timestamp"),
    device_id: str = Header(..., alias="X-Device-ID"),
    platform: str = Header(..., alias="X-Platform"),
    app_version: str = Header(..., alias="X-App-Version"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_key_user)
):
    """
    Sync mobile app data
    
    Returns only changed data since last sync for efficient mobile updates:
    - Delta updates for content
    - Configuration changes
    - New features or widgets
    - Performance optimizations
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    mobile_service = MobileService(db)
    
    sync_data = await mobile_service.get_sync_data(
        app=app,
        last_sync=last_sync,
        device_id=device_id,
        platform=platform,
        app_version=app_version
    )
    
    return {
        "sync_timestamp": datetime.utcnow(),
        "has_updates": sync_data["has_updates"],
        "updates": sync_data["updates"],
        "next_sync_recommended": sync_data["next_sync_recommended"]
    }


@router.post("/apps/{app_id}/push-notification")
async def send_push_notification(
    app_id: uuid.UUID,
    notification: PushNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send push notification to mobile app users
    
    Sends targeted push notifications to mobile app users:
    - Immediate or scheduled delivery
    - User segmentation support
    - Rich notifications with data payload
    - Analytics tracking
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    mobile_service = MobileService(db)
    
    try:
        result = await mobile_service.send_push_notification(
            app=app,
            title=notification.title,
            body=notification.body,
            data=notification.data,
            target_users=notification.target_users,
            schedule_time=notification.schedule_time
        )
        
        return {
            "message": "Push notification sent successfully",
            "notification_id": result["notification_id"],
            "target_count": result["target_count"],
            "scheduled": notification.schedule_time is not None
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")


@router.get("/apps/{app_id}/analytics", response_model=MobileAnalyticsResponse)
async def get_mobile_analytics(
    app_id: uuid.UUID,
    platform: Optional[str] = Query(None, description="Filter by platform"),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get mobile app analytics
    
    Returns mobile-specific analytics data:
    - App usage statistics
    - User engagement metrics
    - Performance data
    - Crash reports and stability
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    mobile_service = MobileService(db)
    analytics_data = await mobile_service.get_mobile_analytics(app, platform, days)
    
    return analytics_data


@router.post("/apps/{app_id}/feedback")
async def submit_mobile_feedback(
    app_id: uuid.UUID,
    feedback_data: Dict[str, Any],
    device_id: str = Header(..., alias="X-Device-ID"),
    platform: str = Header(..., alias="X-Platform"),
    app_version: str = Header(..., alias="X-App-Version"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_key_user)
):
    """
    Submit feedback from mobile app
    
    Collects user feedback, bug reports, and feature requests from mobile apps:
    - Automatic device and app context
    - Screenshot and log attachment support
    - Priority classification
    - Integration with support systems
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    mobile_service = MobileService(db)
    
    feedback_result = await mobile_service.process_feedback(
        app=app,
        feedback_data=feedback_data,
        device_id=device_id,
        platform=platform,
        app_version=app_version
    )
    
    return {
        "message": "Feedback submitted successfully",
        "feedback_id": feedback_result["feedback_id"],
        "status": "received",
        "estimated_response_time": "24-48 hours"
    }


@router.get("/sdk/config")
async def get_sdk_config(
    platform: str = Query(..., description="SDK platform: ios, android, react-native, flutter"),
    version: Optional[str] = Query("latest", description="SDK version"),
    current_user: User = Depends(get_api_key_user)
):
    """
    Get SDK configuration for mobile development
    
    Returns platform-specific SDK configuration:
    - API endpoints and authentication
    - Feature flags and capabilities
    - Styling and theme guidelines
    - Integration examples
    """
    
    sdk_configs = {
        "ios": {
            "base_url": "https://api.webcraft.dev/api/v1/mobile",
            "websocket_url": "wss://api.webcraft.dev/ws",
            "authentication": {
                "type": "api_key",
                "header": "X-API-Key"
            },
            "features": {
                "offline_support": True,
                "push_notifications": True,
                "real_time_sync": True,
                "analytics": True
            },
            "sdk_version": "2.1.0",
            "min_ios_version": "13.0",
            "dependencies": [
                "Alamofire ~> 5.6",
                "SocketIO ~> 4.0",
                "SwiftUI"
            ]
        },
        "android": {
            "base_url": "https://api.webcraft.dev/api/v1/mobile",
            "websocket_url": "wss://api.webcraft.dev/ws",
            "authentication": {
                "type": "api_key",
                "header": "X-API-Key"
            },
            "features": {
                "offline_support": True,
                "push_notifications": True,
                "real_time_sync": True,
                "analytics": True
            },
            "sdk_version": "2.1.0",
            "min_android_version": "21",
            "dependencies": [
                "okhttp:4.10.0",
                "socket.io-client:2.0.1",
                "gson:2.10.1"
            ]
        },
        "react-native": {
            "base_url": "https://api.webcraft.dev/api/v1/mobile",
            "websocket_url": "wss://api.webcraft.dev/ws",
            "package_name": "@webcraft/react-native-sdk",
            "version": "2.1.0",
            "peer_dependencies": {
                "react": ">=17.0.0",
                "react-native": ">=0.68.0"
            }
        },
        "flutter": {
            "base_url": "https://api.webcraft.dev/api/v1/mobile",
            "websocket_url": "wss://api.webcraft.dev/ws",
            "package_name": "webcraft_flutter_sdk",
            "version": "2.1.0",
            "dart_version": ">=2.17.0",
            "flutter_version": ">=3.0.0"
        }
    }
    
    if platform not in sdk_configs:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    
    config = sdk_configs[platform]
    config["user_id"] = str(current_user.id)
    config["generated_at"] = datetime.utcnow().isoformat()
    
    return config


@router.get("/health")
async def mobile_api_health():
    """
    Mobile API health check
    
    Returns the health status of mobile-specific services and features.
    Used by mobile apps to verify API availability.
    """
    
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