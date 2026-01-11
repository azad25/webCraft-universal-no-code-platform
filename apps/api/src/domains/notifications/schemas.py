"""Notifications domain schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"
    IN_APP = "in_app"
    SLACK = "slack"
    WEBHOOK = "webhook"


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationCreate(BaseModel):
    type: NotificationType
    title: str
    message: str
    recipient: str
    priority: NotificationPriority = NotificationPriority.NORMAL
    data: Dict[str, Any] = {}
    scheduled_at: Optional[datetime] = None


class NotificationTemplateCreate(BaseModel):
    name: str
    type: NotificationType
    subject: Optional[str] = None
    body: str
    variables: List[str] = []


class PushSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]
    user_agent: Optional[str] = None


class NotificationResponse(BaseModel):
    id: str
    app_id: str
    type: str
    title: str
    message: str
    recipient: str
    priority: str
    data: Dict[str, Any]
    status: str
    scheduled_at: Optional[str]
    sent_at: Optional[str]
    created_at: str


class NotificationTemplateResponse(BaseModel):
    id: str
    app_id: str
    name: str
    type: str
    subject: Optional[str]
    body: str
    variables: List[str]
    created_at: str


class UserNotification(BaseModel):
    id: str
    type: str
    title: str
    message: str
    link: Optional[str]
    is_read: bool
    created_at: str
    metadata: Dict[str, Any]
