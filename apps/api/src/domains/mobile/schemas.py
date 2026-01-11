"""Mobile API domain schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class PushNotificationRequest(BaseModel):
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    target_users: Optional[List[str]] = None
    schedule_time: Optional[datetime] = None


class MobileAppConfig(BaseModel):
    app_name: str
    bundle_id: str
    version: str = "1.0.0"
    platform: str
    theme: Dict[str, Any] = {}
    navigation: Dict[str, Any] = {}
    push_notifications: bool = False
    offline_support: bool = False


class MobilePageResponse(BaseModel):
    id: str
    title: str
    slug: str
    content: Dict[str, Any]
    meta_data: Dict[str, Any]
    is_homepage: bool
    navigation_order: int = 0


class MobileAppResponse(BaseModel):
    id: str
    name: str
    app_type: str
    config: Dict[str, Any]
    theme_config: Dict[str, Any]
    pages: List[MobilePageResponse]
    api_endpoints: Dict[str, str]
    last_updated: str


class MobileContentResponse(BaseModel):
    type: str
    data: Dict[str, Any]
    metadata: Dict[str, Any]
    cache_duration: int = 3600


class MobileAnalyticsResponse(BaseModel):
    app_opens: int
    active_users: int
    session_duration: float
    crash_rate: float
    retention_rate: Dict[str, float]
    popular_features: List[Dict[str, Any]]


class SyncResponse(BaseModel):
    sync_timestamp: str
    has_updates: bool
    updates: Dict[str, Any]
    next_sync_recommended: int


class FeedbackResponse(BaseModel):
    message: str
    feedback_id: str
    status: str
    estimated_response_time: str
