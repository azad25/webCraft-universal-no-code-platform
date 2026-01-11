"""
Preview domain schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class PreviewCreate(BaseModel):
    device: Optional[str] = "desktop"  # mobile, tablet, desktop


class PreviewResponse(BaseModel):
    token: str
    url: str
    mobile_url: str
    qr_code_url: str
    expires_at: datetime
    device: str


class PreviewDataResponse(BaseModel):
    app: Dict[str, Any]
    preview: Dict[str, Any]
    pages: List[Dict[str, Any]]


class IframeCodeResponse(BaseModel):
    iframe_code: str
    preview_url: str
    width: str
    height: str


class PreviewSessionResponse(BaseModel):
    token: str
    device: str
    created_at: datetime
    expires_at: datetime
    is_active: bool
