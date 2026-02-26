"""
Data Sources domain models
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from src.common.base_model import BaseModel


class DataSource(BaseModel):
    """External data source configuration"""
    __tablename__ = "data_sources"
    
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    base_url = Column(String(500), nullable=False)
    auth_type = Column(String(50), default="none")  # none, api_key, bearer_token, basic_auth, custom_header
    auth_config = Column(JSON, default=dict)
    default_headers = Column(JSON, default=dict)
    rate_limit = Column(Integer, default=60)
    timeout = Column(Integer, default=30)
    retry_count = Column(Integer, default=3)
    cache_ttl = Column(Integer, default=300)
    is_connected = Column(Boolean, default=False)
    last_tested = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships (properly configured)
    app = relationship("App", back_populates="data_sources")
    endpoints = relationship("DataSourceEndpoint", back_populates="data_source", cascade="all, delete-orphan")


class DataSourceEndpoint(BaseModel):
    """Endpoint configuration for a data source"""
    __tablename__ = "data_source_endpoints"
    
    data_source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    path = Column(String(500), nullable=False)
    method = Column(String(10), default="GET")
    query_params = Column(JSON, default=dict)
    body_template = Column(JSON, nullable=True)
    headers = Column(JSON, default=dict)
    response_mapping = Column(JSON, nullable=True)
    pagination_config = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    data_source = relationship("DataSource", back_populates="endpoints")


class DataSourceCache(BaseModel):
    """Cache for data source responses"""
    __tablename__ = "data_source_cache"
    
    cache_key = Column(String(64), unique=True, nullable=False, index=True)
    endpoint_id = Column(UUID(as_uuid=True), ForeignKey("data_source_endpoints.id"), nullable=False)
    response_data = Column(JSON, nullable=False)
    request_params = Column(JSON, default=dict)
    expires_at = Column(DateTime, nullable=False)
    hit_count = Column(Integer, default=0)


class WidgetDataBinding(BaseModel):
    """Binding between widgets and data sources"""
    __tablename__ = "widget_data_bindings"
    
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False, index=True)
    widget_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # Widget instance ID
    widget_type = Column(String(50), nullable=False)  # Widget type (table, list, card, etc.)
    
    # Data source configuration
    data_source_type = Column(String(20), nullable=False)  # 'api', 'collection', 'scraper'
    data_source_endpoint_id = Column(UUID(as_uuid=True), ForeignKey("data_source_endpoints.id"), nullable=True)
    collection_id = Column(UUID(as_uuid=True), nullable=True)  # Reference to app collection
    scraper_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Data binding configuration
    field_mappings = Column(JSON, default=dict)  # Maps widget fields to data fields
    filters = Column(JSON, default=dict)  # Data filtering rules
    sorting = Column(JSON, default=dict)  # Sorting configuration
    pagination = Column(JSON, default=dict)  # Pagination settings
    
    # Refresh and caching
    refresh_interval = Column(Integer, default=0)  # Auto-refresh in seconds (0 = manual)
    cache_duration = Column(Integer, default=300)  # Cache duration in seconds
    
    # Data transformation
    transform_script = Column(Text, nullable=True)  # JavaScript transformation code
    
    # Status
    is_active = Column(Boolean, default=True)
    last_sync = Column(DateTime, nullable=True)
    sync_status = Column(String(20), default="pending")  # pending, success, error
    sync_error = Column(Text, nullable=True)
