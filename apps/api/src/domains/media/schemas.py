"""
Media domain schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from src.common.base_schema import BaseSchema


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    URL = "url"
    CODE = "code"
    EMBED = "embed"


class MediaItemBase(BaseModel):
    type: MediaType
    name: str
    url: str
    thumbnail_url: Optional[str] = None
    mime_type: Optional[str] = None
    size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    extra_data: Dict[str, Any] = Field(default_factory=dict)  # Renamed from metadata
    folder_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class MediaItemCreate(MediaItemBase):
    app_id: str


class MediaItemUpdate(BaseModel):
    name: Optional[str] = None
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    folder_id: Optional[str] = None
    tags: Optional[List[str]] = None


class MediaItemResponse(BaseSchema, MediaItemBase):
    app_id: str


class MediaFolderBase(BaseModel):
    name: str
    parent_id: Optional[str] = None


class MediaFolderCreate(MediaFolderBase):
    app_id: str


class MediaFolderResponse(BaseSchema, MediaFolderBase):
    app_id: str


class UploadResponse(BaseModel):
    success: bool
    media: Optional[MediaItemResponse] = None
    error: Optional[str] = None


class EmbedRequest(BaseModel):
    url: str
    app_id: str
    folder_id: Optional[str] = None


class CodeSnippetRequest(BaseModel):
    app_id: str
    name: str
    code: str
    language: str
    folder_id: Optional[str] = None


class UrlMediaRequest(BaseModel):
    app_id: str
    url: str
    name: Optional[str] = None
    folder_id: Optional[str] = None


class MediaListParams(BaseModel):
    type: Optional[MediaType] = None
    folder_id: Optional[str] = None
    search: Optional[str] = None
    tags: Optional[str] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=50, ge=1, le=100)