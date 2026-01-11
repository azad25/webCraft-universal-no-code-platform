"""
Templates schemas for V2
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid


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