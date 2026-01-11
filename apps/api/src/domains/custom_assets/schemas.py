"""Custom Assets domain schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class CustomAssetCreate(BaseModel):
    name: str
    type: str  # html, css, js
    content: str
    page_id: Optional[str] = None
    is_global: bool = False
    metadata: Dict[str, Any] = {}


class CustomAssetUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    page_id: Optional[str] = None
    is_global: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class CustomAssetResponse(BaseModel):
    id: str
    app_id: str
    page_id: Optional[str]
    name: str
    type: str
    content: Optional[str]
    url: Optional[str]
    size: int
    is_global: bool
    metadata: Dict[str, Any]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
