"""
Widgets domain schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class WidgetResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    category: str
    icon: Optional[str] = None
    config_schema: Dict[str, Any] = {}
    default_config: Dict[str, Any] = {}
    is_premium: bool = False
    price: int = 0
    downloads: int = 0
    rating: float = 0.0
    
    class Config:
        from_attributes = True


class WidgetCategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    widget_count: int = 0


class WidgetConfigSchema(BaseModel):
    widget_slug: str
    schema: Dict[str, Any]
    default_values: Dict[str, Any]
