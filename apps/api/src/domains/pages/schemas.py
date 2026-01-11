"""Pages domain schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class PageCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    content: Dict[str, Any] = Field(default_factory=dict)
    is_homepage: bool = False
    is_published: bool = True
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_image: Optional[str] = None


class PageUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    is_homepage: Optional[bool] = None
    is_published: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_image: Optional[str] = None


class PageResponse(BaseModel):
    id: str
    app_id: str
    title: str
    slug: str
    content: Dict[str, Any]
    is_homepage: bool
    is_published: bool
    meta_title: Optional[str]
    meta_description: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
