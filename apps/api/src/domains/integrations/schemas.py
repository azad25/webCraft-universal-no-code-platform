"""Integrations domain schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class IntegrationConnect(BaseModel):
    provider: str
    credentials: Dict[str, Any] = {}
    config: Dict[str, Any] = {}


class IntegrationUpdate(BaseModel):
    config: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None


class IntegrationResponse(BaseModel):
    id: str
    app_id: str
    provider: str
    name: str
    category: str
    icon: str
    is_connected: bool
    is_enabled: bool
    config: Dict[str, Any]
    last_sync: Optional[str]
    created_at: str
    updated_at: str


class IntegrationProvider(BaseModel):
    id: str
    name: str
    category: str
    description: str
    auth_type: str
    fields: Optional[List[str]] = None
    scopes: Optional[List[str]] = None
    icon: str


class IntegrationCategory(BaseModel):
    id: str
    name: str


class SyncResult(BaseModel):
    message: str
    last_sync: str
    records_synced: int


class TestResult(BaseModel):
    status: str
    message: str
    latency_ms: int


class OAuthUrl(BaseModel):
    authorization_url: str
    state: str
