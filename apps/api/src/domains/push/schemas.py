"""Push notification schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class PushSubscriptionCreate(BaseModel):
    endpoint: str = Field(..., min_length=1, max_length=500)
    p256dh_key: str = Field(..., min_length=1, max_length=255)
    auth_key: str = Field(..., min_length=1, max_length=255)


class PushSubscriptionResponse(BaseModel):
    id: uuid.UUID
    endpoint: str
    is_active: bool
    last_used: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PushNotificationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    icon: Optional[str] = Field(None, max_length=500)
    badge: Optional[str] = Field(None, max_length=500)
    image: Optional[str] = Field(None, max_length=500)
    tag: Optional[str] = Field(None, max_length=100)
    url: Optional[str] = Field(None, max_length=500)
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    ttl: int = Field(default=86400, ge=0, le=2419200)  # Max 28 days
    urgency: str = Field(default="normal", pattern="^(low|normal|high)$")


class PushNotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    body: str
    icon: Optional[str]
    badge: Optional[str]
    image: Optional[str]
    tag: Optional[str]
    url: Optional[str]
    actions: List[Dict[str, Any]]
    ttl: int
    urgency: str
    status: str
    sent_at: Optional[datetime]
    sent_count: int
    delivered_count: int
    clicked_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class BroadcastRequest(BaseModel):
    notification: PushNotificationCreate
    target_all: bool = True
    target_subscriptions: List[uuid.UUID] = Field(default_factory=list)


class PushStatsResponse(BaseModel):
    total_subscriptions: int
    active_subscriptions: int
    total_notifications: int
    notifications_sent_today: int
    notifications_sent_this_week: int
    notifications_sent_this_month: int
    average_delivery_rate: float
    average_click_rate: float