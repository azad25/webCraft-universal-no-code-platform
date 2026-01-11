"""
Apps domain schemas
"""

from pydantic import Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

from src.common.base_schema import BaseSchema, PaginatedResponse


# Request schemas
class AppCreate(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    app_type: str = Field(..., description="Type: website, ecommerce, crm, erp, etc.")
    template_id: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    theme_config: Dict[str, Any] = Field(default_factory=dict)


class AppUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    theme_config: Optional[Dict[str, Any]] = None
    seo_config: Optional[Dict[str, Any]] = None


class PublishRequest(BaseSchema):
    custom_domain: Optional[str] = None
    subdomain: Optional[str] = None


class PageCreate(BaseSchema):
    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    content: Dict[str, Any] = Field(default_factory=dict)
    is_homepage: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class PageUpdate(BaseSchema):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    is_homepage: Optional[bool] = None
    is_published: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


# Response schemas
class AppResponse(BaseSchema):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    app_type: str
    is_published: bool
    custom_domain: Optional[str]
    subdomain: Optional[str]
    config: Dict[str, Any]
    theme_config: Dict[str, Any]
    seo_config: Dict[str, Any]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AppListResponse(PaginatedResponse[AppResponse]):
    """Paginated list of apps"""
    pass


class PageResponse(BaseSchema):
    id: uuid.UUID
    title: str
    slug: str
    content: Dict[str, Any]
    is_homepage: bool
    is_published: bool
    meta_title: Optional[str]
    meta_description: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DeploymentStatusResponse(BaseSchema):
    status: str
    live_url: Optional[str] = None
    subdomain_url: Optional[str] = None
    custom_domain: Optional[str] = None
    ssl_enabled: bool = True
    deployed_at: Optional[str] = None
    error: Optional[str] = None


class PreviewResponse(BaseSchema):
    preview_url: str
    token: str
    expires_at: str
    qr_code_url: Optional[str] = None
