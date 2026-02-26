"""Link management schemas"""
from pydantic import BaseModel, Field, HttpUrl, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class LinkBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., min_length=1, max_length=2000)
    description: Optional[str] = None
    link_type: str = Field(default="external", pattern="^(internal|external|email|phone|download|anchor)$")
    category: Optional[str] = None
    target: str = Field(default="_self", pattern="^(_self|_blank|_parent|_top)$")
    rel: Optional[str] = None
    css_class: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int = Field(default=0, ge=0)
    is_active: bool = True


class LinkCreate(LinkBase):
    page_id: Optional[uuid.UUID] = None
    
    @validator('url')
    def validate_url(cls, v, values):
        link_type = values.get('link_type', 'external')
        
        if link_type == 'email' and not v.startswith('mailto:'):
            return f'mailto:{v}'
        elif link_type == 'phone' and not v.startswith('tel:'):
            return f'tel:{v}'
        elif link_type == 'anchor' and not v.startswith('#'):
            return f'#{v}'
        
        return v


class LinkUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[str] = Field(None, min_length=1, max_length=2000)
    description: Optional[str] = None
    link_type: Optional[str] = Field(None, pattern="^(internal|external|email|phone|download|anchor)$")
    category: Optional[str] = None
    target: Optional[str] = Field(None, pattern="^(_self|_blank|_parent|_top)$")
    rel: Optional[str] = None
    css_class: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    page_id: Optional[uuid.UUID] = None


class LinkResponse(LinkBase):
    id: uuid.UUID
    app_id: uuid.UUID
    page_id: Optional[uuid.UUID]
    is_validated: bool
    last_checked: Optional[datetime]
    status_code: Optional[int]
    error_message: Optional[str]
    click_count: int
    last_clicked: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LinkGroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    display_type: str = Field(default="list", pattern="^(list|grid|dropdown|tabs)$")
    max_items: Optional[int] = Field(None, gt=0)
    sort_order: int = Field(default=0, ge=0)
    css_class: Optional[str] = None
    style_config: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True


class LinkGroupCreate(LinkGroupBase):
    pass


class LinkGroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    display_type: Optional[str] = Field(None, pattern="^(list|grid|dropdown|tabs)$")
    max_items: Optional[int] = Field(None, gt=0)
    sort_order: Optional[int] = Field(None, ge=0)
    css_class: Optional[str] = None
    style_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class LinkGroupItemResponse(BaseModel):
    id: uuid.UUID
    link_id: uuid.UUID
    sort_order: int
    custom_title: Optional[str]
    custom_icon: Optional[str]
    is_featured: bool
    link: LinkResponse
    
    class Config:
        from_attributes = True


class LinkGroupResponse(LinkGroupBase):
    id: uuid.UUID
    app_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    links: List[LinkGroupItemResponse] = []
    
    class Config:
        from_attributes = True


class LinkRedirectBase(BaseModel):
    from_path: str = Field(..., min_length=1, max_length=500)
    to_url: str = Field(..., min_length=1, max_length=2000)
    redirect_type: int = Field(default=301, pattern="^(301|302|307|308)$")
    is_active: bool = True
    expires_at: Optional[datetime] = None


class LinkRedirectCreate(LinkRedirectBase):
    pass


class LinkRedirectUpdate(BaseModel):
    from_path: Optional[str] = Field(None, min_length=1, max_length=500)
    to_url: Optional[str] = Field(None, min_length=1, max_length=2000)
    redirect_type: Optional[int] = Field(None, pattern="^(301|302|307|308)$")
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class LinkRedirectResponse(LinkRedirectBase):
    id: uuid.UUID
    app_id: uuid.UUID
    redirect_count: int
    last_used: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LinkAnalyticsResponse(BaseModel):
    id: uuid.UUID
    link_id: uuid.UUID
    clicked_at: datetime
    ip_address: Optional[str]
    user_agent: Optional[str]
    referrer: Optional[str]
    country: Optional[str]
    region: Optional[str]
    city: Optional[str]
    device_type: Optional[str]
    browser: Optional[str]
    os: Optional[str]
    
    class Config:
        from_attributes = True


class LinkStatsResponse(BaseModel):
    total_links: int
    active_links: int
    total_clicks: int
    clicks_today: int
    clicks_this_week: int
    clicks_this_month: int
    top_links: List[Dict[str, Any]]
    recent_clicks: List[LinkAnalyticsResponse]


class BulkLinkOperation(BaseModel):
    operation: str = Field(..., pattern="^(activate|deactivate|delete|validate)$")
    link_ids: List[uuid.UUID] = Field(..., min_items=1)


class LinkValidationResult(BaseModel):
    link_id: uuid.UUID
    url: str
    is_valid: bool
    status_code: Optional[int]
    error_message: Optional[str]
    response_time_ms: Optional[int]
    checked_at: datetime


class BulkValidationResponse(BaseModel):
    total_checked: int
    valid_links: int
    invalid_links: int
    results: List[LinkValidationResult]