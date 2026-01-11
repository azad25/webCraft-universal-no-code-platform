"""Webhooks domain schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class WebhookCreate(BaseModel):
    name: str
    url: str
    events: List[str]
    secret: Optional[str] = None
    headers: Dict[str, str] = {}
    is_active: bool = True


class WebhookUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    events: Optional[List[str]] = None
    headers: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None


class WebhookResponse(BaseModel):
    id: str
    app_id: str
    name: str
    url: str
    events: List[str]
    secret: str
    headers: Dict[str, str]
    is_active: bool
    created_at: str
    updated_at: str


class WebhookLogEntry(BaseModel):
    id: str
    webhook_id: str
    event: str
    url: str
    request_headers: Dict[str, str]
    request_body: Dict[str, Any]
    response_status: Optional[int]
    response_body: Optional[str]
    success: bool
    error: Optional[str]
    timestamp: str


class WebhookEvent(BaseModel):
    name: str
    description: str


class IncomingWebhookResponse(BaseModel):
    received: bool
    webhook_id: str
    automations_triggered: List[str]
