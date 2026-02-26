"""
Templates schemas for V2
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid


class TemplateCreateRequest(BaseModel):
    """Template creation request schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., min_length=1, max_length=100)
    preview_image: Optional[str] = None
    demo_url: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    pages_config: Dict[str, Any] = Field(default_factory=dict)
    is_premium: bool = False
    price: int = Field(default=0, ge=0)


class TemplateUpdateRequest(BaseModel):
    """Template update request schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    preview_image: Optional[str] = None
    demo_url: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    pages_config: Optional[Dict[str, Any]] = None
    is_premium: Optional[bool] = None
    price: Optional[int] = Field(None, ge=0)


class TemplatePageCreateRequest(BaseModel):
    """Template page creation request schema"""
    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    content: Dict[str, Any] = Field(default_factory=dict)
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = Field(None, max_length=500)
    og_image: Optional[str] = Field(None, max_length=500)
    is_homepage: bool = False
    sort_order: int = Field(default=0, ge=0)


class TemplatePageUpdateRequest(BaseModel):
    """Template page update request schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[Dict[str, Any]] = None
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = Field(None, max_length=500)
    og_image: Optional[str] = Field(None, max_length=500)
    is_homepage: Optional[bool] = None
    sort_order: Optional[int] = Field(None, ge=0)


class TemplateResponse(BaseModel):
    """Template response schema"""
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    category: str
    preview_image: Optional[str] = None
    demo_url: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    pages_config: Dict[str, Any] = Field(default_factory=dict)
    is_premium: bool = False
    price: int = 0
    downloads: int = 0
    rating: int = 0
    creator_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    """Template list response schema"""
    templates: List[TemplateResponse]
    total: int
    page: int
    per_page: int
    pages: int


class TemplatePageResponse(BaseModel):
    """Template page response schema"""
    id: uuid.UUID
    title: str
    slug: str
    content: Dict[str, Any] = Field(default_factory=dict)
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_image: Optional[str] = None
    is_homepage: bool = False
    sort_order: int = 0
    template_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}