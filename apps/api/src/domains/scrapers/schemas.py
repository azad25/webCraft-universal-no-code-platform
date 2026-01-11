"""
Scrapers domain schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class FieldExtractorCreate(BaseModel):
    name: str
    selector: str
    selector_type: str = "css"  # css, xpath, regex
    attribute: Optional[str] = None  # None for text content, or attr name
    multiple: bool = False
    transform: Optional[str] = None  # trim, lowercase, uppercase, number, date
    default: Optional[Any] = None


class PaginationConfig(BaseModel):
    type: str = "none"  # none, next_button, page_param, infinite_scroll
    next_selector: Optional[str] = None
    page_param: Optional[str] = None
    max_pages: int = 10


class ScraperCreate(BaseModel):
    name: str
    description: Optional[str] = None
    url: str
    fields: List[FieldExtractorCreate]
    item_selector: Optional[str] = None  # Selector for repeating items
    pagination_config: Optional[PaginationConfig] = None
    headers: Dict[str, str] = Field(default_factory=dict)
    cookies: Dict[str, str] = Field(default_factory=dict)
    delay_ms: int = 1000
    max_pages: int = 10
    timeout: int = 30
    user_agent: str = "WebCraft-Scraper/1.0 (compatible; +https://webcraft.dev/bot)"
    respect_robots: bool = True
    cache_ttl: int = 3600
    schedule: Optional[str] = None


class ScraperUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    fields: Optional[List[FieldExtractorCreate]] = None
    item_selector: Optional[str] = None
    pagination_config: Optional[PaginationConfig] = None
    headers: Optional[Dict[str, str]] = None
    delay_ms: Optional[int] = None
    max_pages: Optional[int] = None
    timeout: Optional[int] = None
    cache_ttl: Optional[int] = None
    schedule: Optional[str] = None
    is_scheduled: Optional[bool] = None


class ScraperResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    url: str
    status: str
    last_run: Optional[datetime]
    run_count: int
    schedule: Optional[str]
    is_scheduled: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}


class ScraperResultResponse(BaseModel):
    id: uuid.UUID
    url: str
    page_count: int
    item_count: int
    duration_ms: int
    status: str
    error_message: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}


class ScraperDataResponse(BaseModel):
    data: List[Dict[str, Any]]
    cached: bool
    item_count: int
    page_count: int
    scraped_at: str
    expires_at: Optional[str] = None


class ScraperPreviewResponse(BaseModel):
    success: bool
    data: List[Dict[str, Any]]
    total_found: Optional[int] = None
    page_title: Optional[str] = None
    error: Optional[str] = None