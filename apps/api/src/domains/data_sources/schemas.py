"""
Data Sources domain schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class AuthConfigCreate(BaseModel):
    api_key: Optional[str] = None
    api_key_header: Optional[str] = "X-API-Key"
    api_key_prefix: Optional[str] = None
    token: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    custom_headers: Optional[Dict[str, str]] = None


class DataSourceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    base_url: str
    auth_type: str = "none"  # none, api_key, bearer_token, basic_auth, custom_header
    auth_config: Optional[AuthConfigCreate] = None
    default_headers: Dict[str, str] = Field(default_factory=dict)
    rate_limit: int = 60
    timeout: int = 30
    retry_count: int = 3
    cache_ttl: int = 300


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_url: Optional[str] = None
    auth_type: Optional[str] = None
    auth_config: Optional[AuthConfigCreate] = None
    default_headers: Optional[Dict[str, str]] = None
    rate_limit: Optional[int] = None
    timeout: Optional[int] = None
    cache_ttl: Optional[int] = None


class DataSourceResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    base_url: str
    auth_type: str
    is_connected: bool
    last_tested: Optional[datetime]
    last_error: Optional[str]
    endpoint_count: int = 0
    created_at: datetime
    
    model_config = {"from_attributes": True}


class EndpointCreate(BaseModel):
    name: str
    path: str
    method: str = "GET"
    query_params: Dict[str, Any] = Field(default_factory=dict)
    body_template: Optional[Dict[str, Any]] = None
    headers: Dict[str, str] = Field(default_factory=dict)
    response_mapping: Optional[Dict[str, str]] = None
    pagination_config: Optional[Dict[str, Any]] = None


class EndpointUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[str] = None
    method: Optional[str] = None
    query_params: Optional[Dict[str, Any]] = None
    body_template: Optional[Dict[str, Any]] = None
    headers: Optional[Dict[str, str]] = None
    response_mapping: Optional[Dict[str, str]] = None
    pagination_config: Optional[Dict[str, Any]] = None


class EndpointResponse(BaseModel):
    id: uuid.UUID
    name: str
    path: str
    method: str
    query_params: Dict[str, Any]
    response_mapping: Optional[Dict[str, str]]
    created_at: datetime
    
    model_config = {"from_attributes": True}


class WidgetBindingCreate(BaseModel):
    widget_id: str
    widget_type: str
    data_source_type: str  # 'api', 'collection', 'scraper'
    data_source_endpoint_id: Optional[str] = None
    collection_id: Optional[str] = None
    scraper_id: Optional[str] = None
    field_mappings: Dict[str, str] = Field(default_factory=dict)
    filters: Dict[str, Any] = Field(default_factory=dict)
    sorting: Dict[str, Any] = Field(default_factory=dict)
    pagination: Dict[str, Any] = Field(default_factory=dict)
    refresh_interval: int = 0
    cache_duration: int = 300
    transform_script: Optional[str] = None


class WidgetBindingUpdate(BaseModel):
    field_mappings: Optional[Dict[str, str]] = None
    filters: Optional[Dict[str, Any]] = None
    sorting: Optional[Dict[str, Any]] = None
    pagination: Optional[Dict[str, Any]] = None
    refresh_interval: Optional[int] = None
    cache_duration: Optional[int] = None
    transform_script: Optional[str] = None


class TestConnectionResponse(BaseModel):
    success: bool
    status_code: Optional[int] = None
    response_time_ms: Optional[int] = None
    message: str


class FetchDataResponse(BaseModel):
    data: Any
    cached: bool
    cache_hit_count: Optional[int] = None
