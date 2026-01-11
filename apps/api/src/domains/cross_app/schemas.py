"""Cross-App Communication schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class ShareCollectionRequest(BaseModel):
    collection_id: str
    visibility: str = Field(..., pattern="^(private|shared|public)$")
    allowed_apps: List[str] = Field(default_factory=list)
    permissions: Dict[str, List[str]] = Field(default_factory=dict)


class CreateConnectionRequest(BaseModel):
    target_app_id: str
    connection_type: str = Field(..., pattern="^(webhook|data_sync|event_trigger)$")
    config: Dict[str, Any] = Field(default_factory=dict)


class TriggerEventRequest(BaseModel):
    event_type: str
    event_data: Dict[str, Any] = Field(default_factory=dict)
    target_app_id: Optional[str] = None


class SendMessageRequest(BaseModel):
    to_app_id: str
    message_type: str
    subject: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class CreateSyncJobRequest(BaseModel):
    target_app_id: str
    source_collection_id: str
    target_collection_id: str
    sync_type: str = Field(default="one_way", pattern="^(one_way|two_way|real_time)$")
    field_mappings: Dict[str, str] = Field(default_factory=dict)
    sync_frequency: str = Field(default="manual", pattern="^(manual|hourly|daily|real_time)$")
