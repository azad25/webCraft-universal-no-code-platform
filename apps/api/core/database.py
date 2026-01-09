"""
Database configuration and models for WebCraft platform
Multi-tenant architecture with isolated data per user/organization
"""

from sqlalchemy import create_engine, MetaData, Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
import os

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://webcraft:password@localhost:5432/webcraft_db")

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Alias for backward compatibility
Session = SessionLocal

Base = declarative_base()

# Multi-tenant base model
class BaseModel(Base):
    __abstract__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255))
    hashed_password = Column(String(255))
    is_verified = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)
    avatar_url = Column(String(500))
    
    # OAuth fields
    google_id = Column(String(100), unique=True, nullable=True)
    github_id = Column(String(100), unique=True, nullable=True)
    microsoft_id = Column(String(100), unique=True, nullable=True)
    
    # Subscription info
    subscription_tier = Column(String(50), default="free")  # free, pro, enterprise
    subscription_expires = Column(DateTime, nullable=True)
    
    # Relationships
    organizations = relationship("Organization", back_populates="owner")
    apps = relationship("App", back_populates="owner")
    api_keys = relationship("APIKey", back_populates="user")


class Organization(BaseModel):
    __tablename__ = "organizations"
    
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    logo_url = Column(String(500))
    website = Column(String(500))
    
    # Owner
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="organizations")
    
    # Settings
    settings = Column(JSONB, default={})
    
    # Relationships
    apps = relationship("App", back_populates="organization")
    members = relationship("OrganizationMember", back_populates="organization")


class OrganizationMember(BaseModel):
    __tablename__ = "organization_members"
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String(50), default="member")  # owner, admin, member, viewer
    
    organization = relationship("Organization", back_populates="members")
    user = relationship("User")


class App(BaseModel):
    __tablename__ = "apps"
    
    name = Column(String(255), nullable=False)
    slug = Column(String(100), index=True, nullable=False)
    description = Column(Text)
    app_type = Column(String(100), nullable=False)  # website, ecommerce, crm, erp, etc.
    
    # Owner info
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    
    # App configuration
    config = Column(JSONB, default={})
    theme_config = Column(JSONB, default={})
    seo_config = Column(JSONB, default={})
    
    # Deployment info
    is_published = Column(Boolean, default=False)
    custom_domain = Column(String(255), nullable=True)
    subdomain = Column(String(100), unique=True, nullable=True)
    
    # Template info
    template_id = Column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="apps")
    organization = relationship("Organization", back_populates="apps")
    template = relationship("Template", back_populates="apps")
    pages = relationship("Page", back_populates="app")
    widgets = relationship("AppWidget", back_populates="app")
    custom_assets = relationship("CustomAsset", back_populates="app")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_app_owner_slug', 'owner_id', 'slug'),
        Index('idx_app_subdomain', 'subdomain'),
        Index('idx_app_custom_domain', 'custom_domain'),
    )


class Template(BaseModel):
    __tablename__ = "templates"
    
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    category = Column(String(100), nullable=False)  # business, ecommerce, portfolio, etc.
    
    # Template data
    preview_image = Column(String(500))
    demo_url = Column(String(500))
    config = Column(JSONB, default={})
    pages_config = Column(JSONB, default={})
    
    # Metadata
    is_premium = Column(Boolean, default=False)
    price = Column(Integer, default=0)  # Price in cents
    downloads = Column(Integer, default=0)
    rating = Column(Integer, default=0)
    
    # Creator info
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    creator = relationship("User")
    
    # Relationships
    apps = relationship("App", back_populates="template")
    template_pages = relationship("TemplatePage", back_populates="template", cascade="all, delete-orphan")


class TemplatePage(BaseModel):
    __tablename__ = "template_pages"
    
    title = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)
    content = Column(JSONB, default={})  # Page structure and elements
    
    # SEO fields
    meta_title = Column(String(255))
    meta_description = Column(Text)
    meta_keywords = Column(String(500))
    og_image = Column(String(500))
    
    # Page settings
    is_homepage = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    
    # Template relationship
    template_id = Column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=False)
    template = relationship("Template", back_populates="template_pages")
    
    # Indexes
    __table_args__ = (
        Index('idx_template_page_template_slug', 'template_id', 'slug'),
    )


class Page(BaseModel):
    __tablename__ = "pages"
    
    title = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)
    content = Column(JSONB, default={})  # Page structure and widgets
    
    # SEO fields
    meta_title = Column(String(255))
    meta_description = Column(Text)
    meta_keywords = Column(String(500))
    og_image = Column(String(500))
    
    # Page settings
    is_homepage = Column(Boolean, default=False)
    is_published = Column(Boolean, default=True)
    password_protected = Column(Boolean, default=False)
    password_hash = Column(String(255), nullable=True)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="pages")
    custom_assets = relationship("CustomAsset", back_populates="page")
    
    # Indexes
    __table_args__ = (
        Index('idx_page_app_slug', 'app_id', 'slug'),
    )


class Widget(BaseModel):
    __tablename__ = "widgets"
    
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    category = Column(String(100), nullable=False)  # layout, content, form, ecommerce, etc.
    
    # Widget configuration
    config_schema = Column(JSONB, default={})  # JSON schema for widget configuration
    default_config = Column(JSONB, default={})
    component_code = Column(Text)  # React component code
    
    # Metadata
    is_premium = Column(Boolean, default=False)
    price = Column(Integer, default=0)
    downloads = Column(Integer, default=0)
    rating = Column(Integer, default=0)
    
    # Creator info
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    creator = relationship("User")
    
    # Relationships
    app_widgets = relationship("AppWidget", back_populates="widget")


class AppWidget(BaseModel):
    __tablename__ = "app_widgets"
    
    # Widget instance configuration
    config = Column(JSONB, default={})
    position = Column(JSONB, default={})  # x, y, width, height
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    widget_id = Column(UUID(as_uuid=True), ForeignKey("widgets.id"), nullable=False)
    page_id = Column(UUID(as_uuid=True), ForeignKey("pages.id"), nullable=True)
    
    app = relationship("App", back_populates="widgets")
    widget = relationship("Widget", back_populates="app_widgets")
    page = relationship("Page")


class APIKey(BaseModel):
    __tablename__ = "api_keys"
    
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), unique=True, index=True, nullable=False)
    key_prefix = Column(String(20), nullable=False)  # First few chars for identification
    
    # Permissions
    scopes = Column(JSONB, default=[])  # List of allowed scopes
    rate_limit = Column(Integer, default=1000)  # Requests per hour
    
    # Usage tracking
    last_used = Column(DateTime, nullable=True)
    usage_count = Column(Integer, default=0)
    
    # Expiration
    expires_at = Column(DateTime, nullable=True)
    
    # User relationship
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="api_keys")


class Integration(BaseModel):
    __tablename__ = "integrations"
    
    name = Column(String(255), nullable=False)
    provider = Column(String(100), nullable=False)  # stripe, google, mailchimp, etc.
    
    # Configuration
    config = Column(JSONB, default={})
    credentials = Column(JSONB, default={})  # Encrypted
    
    # Status
    is_connected = Column(Boolean, default=False)
    last_sync = Column(DateTime, nullable=True)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")


class SEOData(BaseModel):
    __tablename__ = "seo_data"
    
    # SEO metrics
    page_speed_score = Column(Integer, default=0)
    seo_score = Column(Integer, default=0)
    accessibility_score = Column(Integer, default=0)
    
    # Structured data
    structured_data = Column(JSONB, default={})
    meta_tags = Column(JSONB, default={})
    
    # Analytics
    organic_traffic = Column(Integer, default=0)
    search_impressions = Column(Integer, default=0)
    click_through_rate = Column(Integer, default=0)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")


class DataSource(BaseModel):
    """External API data sources"""
    __tablename__ = "data_sources"
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    base_url = Column(String(500), nullable=False)
    
    # Authentication
    auth_type = Column(String(50), default="none")  # none, api_key, bearer_token, basic_auth, oauth2, custom_header
    auth_config = Column(JSONB, default={})  # Encrypted credentials
    
    # Request configuration
    default_headers = Column(JSONB, default={})
    rate_limit = Column(Integer, default=60)  # requests per minute
    timeout = Column(Integer, default=30)  # seconds
    retry_count = Column(Integer, default=3)
    cache_ttl = Column(Integer, default=300)  # seconds
    
    # Status
    is_connected = Column(Boolean, default=False)
    last_tested = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    # Relationships
    endpoints = relationship("DataSourceEndpoint", back_populates="data_source", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_datasource_app', 'app_id'),
    )


class DataSourceEndpoint(BaseModel):
    """Endpoints for data sources"""
    __tablename__ = "data_source_endpoints"
    
    name = Column(String(255), nullable=False)
    path = Column(String(500), nullable=False)
    method = Column(String(10), default="GET")  # GET, POST, PUT, PATCH, DELETE
    
    # Request configuration
    query_params = Column(JSONB, default={})
    body_template = Column(JSONB, nullable=True)
    headers = Column(JSONB, default={})
    
    # Response handling
    response_mapping = Column(JSONB, nullable=True)  # Map response fields to widget-friendly format
    
    # Pagination
    pagination_config = Column(JSONB, nullable=True)
    
    # Data source relationship
    data_source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id"), nullable=False)
    data_source = relationship("DataSource", back_populates="endpoints")
    
    __table_args__ = (
        Index('idx_endpoint_datasource', 'data_source_id'),
    )


class DataSourceCache(BaseModel):
    """Cached responses from data sources"""
    __tablename__ = "data_source_cache"
    
    cache_key = Column(String(64), unique=True, index=True, nullable=False)
    endpoint_id = Column(UUID(as_uuid=True), ForeignKey("data_source_endpoints.id"), nullable=False)
    
    # Cached data
    response_data = Column(JSONB, nullable=False)
    request_params = Column(JSONB, default={})
    
    # Cache metadata
    expires_at = Column(DateTime, nullable=False)
    hit_count = Column(Integer, default=0)
    
    endpoint = relationship("DataSourceEndpoint")


class WebScraper(BaseModel):
    """Web scraper configurations"""
    __tablename__ = "web_scrapers"
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    url = Column(String(500), nullable=False)
    
    # Scraper configuration
    fields = Column(JSONB, nullable=False)  # List of field extractors
    pagination_config = Column(JSONB, nullable=True)
    
    # Request settings
    headers = Column(JSONB, default={})
    cookies = Column(JSONB, default={})
    delay_ms = Column(Integer, default=1000)
    max_pages = Column(Integer, default=10)
    timeout = Column(Integer, default=30)
    user_agent = Column(String(500), default="WebCraft-Scraper/1.0")
    respect_robots = Column(Boolean, default=True)
    cache_ttl = Column(Integer, default=3600)
    
    # Scheduling
    schedule = Column(String(100), nullable=True)  # Cron expression
    is_scheduled = Column(Boolean, default=False)
    
    # Status
    status = Column(String(20), default="idle")  # idle, running, completed, failed, scheduled
    last_run = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    run_count = Column(Integer, default=0)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    # Relationships
    results = relationship("ScraperResult", back_populates="scraper", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_scraper_app', 'app_id'),
        Index('idx_scraper_status', 'status'),
    )


class ScraperResult(BaseModel):
    """Results from web scraper runs"""
    __tablename__ = "scraper_results"
    
    # Scraper relationship
    scraper_id = Column(UUID(as_uuid=True), ForeignKey("web_scrapers.id"), nullable=False)
    scraper = relationship("WebScraper", back_populates="results")
    
    # Result data
    data = Column(JSONB, nullable=False)
    url = Column(String(500), nullable=False)
    
    # Metrics
    page_count = Column(Integer, default=0)
    item_count = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    
    # Status
    status = Column(String(20), default="completed")  # completed, partial, failed
    error_message = Column(Text, nullable=True)
    
    # Cache
    expires_at = Column(DateTime, nullable=True)
    
    __table_args__ = (
        Index('idx_result_scraper', 'scraper_id'),
        Index('idx_result_created', 'created_at'),
    )


class WidgetDataBinding(BaseModel):
    """Binds widgets to data sources or scrapers"""
    __tablename__ = "widget_data_bindings"
    
    # Widget relationship
    app_widget_id = Column(UUID(as_uuid=True), ForeignKey("app_widgets.id"), nullable=False)
    app_widget = relationship("AppWidget")
    
    # Data source binding (one of these will be set)
    data_source_endpoint_id = Column(UUID(as_uuid=True), ForeignKey("data_source_endpoints.id"), nullable=True)
    scraper_id = Column(UUID(as_uuid=True), ForeignKey("web_scrapers.id"), nullable=True)
    
    # Binding configuration
    binding_type = Column(String(20), nullable=False)  # 'api' or 'scraper'
    field_mappings = Column(JSONB, default={})  # Map data fields to widget props
    refresh_interval = Column(Integer, default=0)  # Auto-refresh in seconds (0 = manual)
    transform_script = Column(Text, nullable=True)  # Optional JS transform
    
    # Relationships
    data_source_endpoint = relationship("DataSourceEndpoint")
    scraper = relationship("WebScraper")
    
    __table_args__ = (
        Index('idx_binding_widget', 'app_widget_id'),
    )


class Automation(BaseModel):
    """Automation workflows for apps"""
    __tablename__ = "automations"
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Trigger configuration
    trigger_type = Column(String(50), nullable=False)  # form_submit, order_created, schedule, webhook, etc.
    trigger_config = Column(JSONB, default={})
    
    # Workflow steps
    workflow_steps = Column(JSONB, default=[])  # List of workflow step objects
    
    # Status
    is_enabled = Column(Boolean, default=True)
    last_executed_at = Column(DateTime, nullable=True)
    execution_count = Column(Integer, default=0)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    # Relationships
    logs = relationship("AutomationLog", back_populates="automation", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_automation_app', 'app_id'),
        Index('idx_automation_enabled', 'is_enabled'),
        Index('idx_automation_trigger', 'trigger_type'),
    )


class AutomationLog(BaseModel):
    """Execution logs for automations"""
    __tablename__ = "automation_logs"
    
    # Automation relationship
    automation_id = Column(UUID(as_uuid=True), ForeignKey("automations.id"), nullable=False)
    automation = relationship("Automation", back_populates="logs")
    
    # Execution details
    status = Column(String(20), nullable=False)  # pending, running, completed, failed
    trigger_data = Column(JSONB, default={})
    execution_result = Column(JSONB, default={})
    error_message = Column(Text, nullable=True)
    
    # Metrics
    duration_ms = Column(Integer, default=0)
    steps_executed = Column(Integer, default=0)
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    __table_args__ = (
        Index('idx_log_automation', 'automation_id'),
        Index('idx_log_status', 'status'),
        Index('idx_log_created', 'created_at'),
    )


class StaticExport(BaseModel):
    """Static site export jobs"""
    __tablename__ = "static_exports"
    
    # Export configuration
    format = Column(String(20), nullable=False)  # zip, github, netlify, vercel, s3
    options = Column(JSONB, default={})
    
    # Status
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    progress = Column(Integer, default=0)  # 0-100
    error_message = Column(Text, nullable=True)
    
    # Output
    file_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    download_url = Column(String(500), nullable=True)
    
    # Metrics
    pages_count = Column(Integer, default=0)
    assets_count = Column(Integer, default=0)
    lighthouse_score = Column(JSONB, nullable=True)
    
    # Expiration
    expires_at = Column(DateTime, nullable=True)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    __table_args__ = (
        Index('idx_export_app', 'app_id'),
        Index('idx_export_status', 'status'),
    )


class PreviewSession(BaseModel):
    """Preview sessions for app testing"""
    __tablename__ = "preview_sessions"
    
    # Preview token
    token = Column(String(36), unique=True, index=True, nullable=False)
    
    # Device type for preview
    device_type = Column(String(20), default="desktop")  # desktop, tablet, mobile
    
    # Expiration
    expires_at = Column(DateTime, nullable=False)
    
    # Usage tracking
    access_count = Column(Integer, default=0)
    last_accessed = Column(DateTime, nullable=True)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    __table_args__ = (
        Index('idx_preview_app', 'app_id'),
        Index('idx_preview_token', 'token'),
        Index('idx_preview_expires', 'expires_at'),
    )


# ============================================
# DYNAMIC USER DATABASE SYSTEM
# Allows users to create custom collections/tables
# ============================================

class AppCollection(BaseModel):
    """User-defined collections/tables for their apps (like Airtable/Notion databases)"""
    __tablename__ = "app_collections"
    
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(50), default="database")  # Icon identifier
    color = Column(String(20), default="#6366f1")  # Color for UI
    
    # Schema definition - defines the fields/columns
    schema = Column(JSONB, default=[])  # List of field definitions
    # Example schema:
    # [
    #   {"name": "title", "type": "text", "required": true, "unique": false},
    #   {"name": "price", "type": "number", "required": false, "default": 0},
    #   {"name": "category", "type": "select", "options": ["A", "B", "C"]},
    #   {"name": "image", "type": "file", "accept": "image/*"},
    #   {"name": "author", "type": "relation", "collection_id": "uuid", "multiple": false}
    # ]
    
    # Settings
    settings = Column(JSONB, default={})
    # Example settings:
    # {
    #   "primary_field": "title",
    #   "display_fields": ["title", "price"],
    #   "sort_field": "created_at",
    #   "sort_order": "desc",
    #   "enable_api": true,
    #   "api_permissions": {"read": "public", "write": "authenticated"}
    # }
    
    # Indexes for the collection
    indexes = Column(JSONB, default=[])  # List of field names to index
    
    # Validation rules
    validation_rules = Column(JSONB, default={})
    
    # Webhooks for this collection
    webhooks = Column(JSONB, default=[])
    # Example: [{"event": "record.created", "url": "https://..."}]
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    # Relationships
    records = relationship("AppRecord", back_populates="collection", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_collection_app', 'app_id'),
        Index('idx_collection_slug', 'app_id', 'slug'),
    )


class AppRecord(BaseModel):
    """Records/rows in user-defined collections"""
    __tablename__ = "app_records"
    
    # The actual data stored as JSON
    data = Column(JSONB, default={})
    # Example: {"title": "My Product", "price": 99.99, "category": "A"}
    
    # Computed/cached fields for search and filtering
    search_text = Column(Text)  # Concatenated searchable text
    
    # Record metadata
    sort_order = Column(Integer, default=0)  # For manual ordering
    
    # Collection relationship
    collection_id = Column(UUID(as_uuid=True), ForeignKey("app_collections.id"), nullable=False)
    collection = relationship("AppCollection", back_populates="records")
    
    # Created/updated by user tracking
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    
    __table_args__ = (
        Index('idx_record_collection', 'collection_id'),
        Index('idx_record_created', 'created_at'),
        Index('idx_record_data', 'data', postgresql_using='gin'),  # GIN index for JSONB queries
    )


class AppRelation(BaseModel):
    """Relationships between records in different collections"""
    __tablename__ = "app_relations"
    
    # Source record
    source_collection_id = Column(UUID(as_uuid=True), ForeignKey("app_collections.id"), nullable=False)
    source_record_id = Column(UUID(as_uuid=True), ForeignKey("app_records.id"), nullable=False)
    source_field = Column(String(100), nullable=False)  # Field name in source schema
    
    # Target record
    target_collection_id = Column(UUID(as_uuid=True), ForeignKey("app_collections.id"), nullable=False)
    target_record_id = Column(UUID(as_uuid=True), ForeignKey("app_records.id"), nullable=False)
    
    # Relation metadata
    relation_type = Column(String(20), default="link")  # link, embed
    sort_order = Column(Integer, default=0)
    
    source_collection = relationship("AppCollection", foreign_keys=[source_collection_id])
    target_collection = relationship("AppCollection", foreign_keys=[target_collection_id])
    source_record = relationship("AppRecord", foreign_keys=[source_record_id])
    target_record = relationship("AppRecord", foreign_keys=[target_record_id])
    
    __table_args__ = (
        Index('idx_relation_source', 'source_collection_id', 'source_record_id'),
        Index('idx_relation_target', 'target_collection_id', 'target_record_id'),
    )


class AppFile(BaseModel):
    """Files uploaded by users for their apps"""
    __tablename__ = "app_files"
    
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    
    # Storage location
    storage_provider = Column(String(50), default="local")  # local, s3, gcs
    storage_path = Column(String(500), nullable=False)
    public_url = Column(String(500), nullable=True)
    
    # Image-specific metadata
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    
    # File metadata
    file_metadata = Column(JSONB, default={})
    
    # Folder organization
    folder = Column(String(255), default="/")
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    # Uploaded by
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    uploaded_by = relationship("User")
    
    __table_args__ = (
        Index('idx_file_app', 'app_id'),
        Index('idx_file_folder', 'app_id', 'folder'),
    )


class AppForm(BaseModel):
    """Form definitions for collecting data"""
    __tablename__ = "app_forms"
    
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)
    description = Column(Text)
    
    # Form fields configuration
    fields = Column(JSONB, default=[])
    # Example:
    # [
    #   {"name": "email", "type": "email", "label": "Email", "required": true},
    #   {"name": "message", "type": "textarea", "label": "Message", "required": true},
    #   {"name": "subscribe", "type": "checkbox", "label": "Subscribe to newsletter"}
    # ]
    
    # Form settings
    settings = Column(JSONB, default={})
    # Example:
    # {
    #   "submit_button_text": "Send",
    #   "success_message": "Thank you!",
    #   "redirect_url": "/thank-you",
    #   "notification_email": "admin@example.com",
    #   "save_to_collection": "uuid-of-collection",
    #   "enable_captcha": true
    # }
    
    # Styling
    style = Column(JSONB, default={})
    
    # Status
    is_active = Column(Boolean, default=True)
    submission_count = Column(Integer, default=0)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    # Relationships
    submissions = relationship("AppFormSubmission", back_populates="form", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_form_app', 'app_id'),
        Index('idx_form_slug', 'app_id', 'slug'),
    )


class AppFormSubmission(BaseModel):
    """Form submissions"""
    __tablename__ = "app_form_submissions"
    
    # Submission data
    data = Column(JSONB, nullable=False)
    
    # Metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    referrer = Column(String(500), nullable=True)
    
    # Status
    status = Column(String(20), default="new")  # new, read, archived, spam
    
    # Form relationship
    form_id = Column(UUID(as_uuid=True), ForeignKey("app_forms.id"), nullable=False)
    form = relationship("AppForm", back_populates="submissions")
    
    # If submitted by authenticated user
    submitted_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    submitted_by = relationship("User")
    
    __table_args__ = (
        Index('idx_submission_form', 'form_id'),
        Index('idx_submission_status', 'status'),
        Index('idx_submission_created', 'created_at'),
    )


class CustomAsset(Base):
    """Custom assets for apps (HTML, CSS, JS, images, videos, audio)"""
    __tablename__ = "custom_assets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    app_id = Column(UUID(as_uuid=True), ForeignKey('apps.id'), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)  # 'html', 'css', 'js', 'image', 'video', 'audio'
    
    # For code assets (HTML, CSS, JS)
    content = Column(Text, nullable=True)
    
    # For media assets (images, videos, audio)
    url = Column(String(500), nullable=True)
    size = Column(Integer, nullable=True)  # File size in bytes
    
    # Asset metadata (renamed from metadata to avoid SQLAlchemy conflict)
    asset_metadata = Column(JSON, nullable=True, default={})
    
    # Asset settings
    is_global = Column(Boolean, default=False)  # Global assets apply to all pages
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Page relationship (NULL for global assets)
    page_id = Column(UUID(as_uuid=True), ForeignKey("pages.id"), nullable=True)
    
    # Relationships
    app = relationship("App", back_populates="custom_assets")
    page = relationship("Page", back_populates="custom_assets")
    
    __table_args__ = (
        Index('idx_custom_asset_app', 'app_id'),
        Index('idx_custom_asset_type', 'type'),
        Index('idx_custom_asset_page', 'page_id'),
    )


# Database initialization
async def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


# ============================================
# CROSS-APP COMMUNICATION MODELS
# ============================================

class SharedCollection(BaseModel):
    """Collections that can be shared across apps"""
    __tablename__ = "shared_collections"
    
    collection_id = Column(UUID(as_uuid=True), ForeignKey("app_collections.id"), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    visibility = Column(String(50), default="private")  # private, shared, public
    allowed_apps = Column(JSON, default=list)  # List of app IDs with access
    permissions = Column(JSON, default=dict)  # Permissions per app: {app_id: [read, write, delete]}
    
    # Relationships
    collection = relationship("AppCollection", backref="shared_config")
    owner = relationship("User")
    
    __table_args__ = (
        Index('idx_shared_collection_owner', 'owner_id'),
        Index('idx_shared_collection_visibility', 'visibility'),
    )


class AppConnection(BaseModel):
    """Connections between apps for communication"""
    __tablename__ = "app_connections"
    
    source_app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    target_app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    connection_type = Column(String(50), nullable=False)  # webhook, data_sync, event_trigger
    config = Column(JSON, default=dict)
    
    # Relationships
    source_app = relationship("App", foreign_keys=[source_app_id])
    target_app = relationship("App", foreign_keys=[target_app_id])
    
    __table_args__ = (
        Index('idx_app_connection_source', 'source_app_id'),
        Index('idx_app_connection_target', 'target_app_id'),
        Index('idx_app_connection_type', 'connection_type'),
    )


class CrossAppEvent(BaseModel):
    """Events that can be triggered across apps"""
    __tablename__ = "cross_app_events"
    
    source_app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    target_app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=True)  # Null for broadcast
    event_type = Column(String(100), nullable=False)
    event_data = Column(JSON, default=dict)
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    processed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    source_app = relationship("App", foreign_keys=[source_app_id])
    target_app = relationship("App", foreign_keys=[target_app_id])
    
    __table_args__ = (
        Index('idx_cross_app_event_source', 'source_app_id'),
        Index('idx_cross_app_event_target', 'target_app_id'),
        Index('idx_cross_app_event_type', 'event_type'),
        Index('idx_cross_app_event_status', 'status'),
    )


class AppMessage(BaseModel):
    """Messages between apps"""
    __tablename__ = "app_messages"
    
    from_app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    to_app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    message_type = Column(String(100), nullable=False)
    subject = Column(String(255), nullable=True)
    payload = Column(JSON, default=dict)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    
    # Relationships
    from_app = relationship("App", foreign_keys=[from_app_id])
    to_app = relationship("App", foreign_keys=[to_app_id])
    
    __table_args__ = (
        Index('idx_app_message_from', 'from_app_id'),
        Index('idx_app_message_to', 'to_app_id'),
        Index('idx_app_message_type', 'message_type'),
        Index('idx_app_message_read', 'is_read'),
    )


class DataSyncJob(BaseModel):
    """Data synchronization jobs between apps"""
    __tablename__ = "data_sync_jobs"
    
    source_app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    target_app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    source_collection_id = Column(UUID(as_uuid=True), ForeignKey("app_collections.id"), nullable=False)
    target_collection_id = Column(UUID(as_uuid=True), ForeignKey("app_collections.id"), nullable=False)
    sync_type = Column(String(50), default="one_way")  # one_way, two_way, real_time
    field_mappings = Column(JSON, default=dict)  # Field mapping between collections
    sync_frequency = Column(String(50), default="manual")  # manual, hourly, daily, real_time
    last_sync_at = Column(DateTime, nullable=True)
    next_sync_at = Column(DateTime, nullable=True)
    sync_status = Column(String(50), default="active")  # active, paused, error
    error_message = Column(Text, nullable=True)
    
    # Relationships
    source_app = relationship("App", foreign_keys=[source_app_id])
    target_app = relationship("App", foreign_keys=[target_app_id])
    source_collection = relationship("AppCollection", foreign_keys=[source_collection_id])
    target_collection = relationship("AppCollection", foreign_keys=[target_collection_id])
    
    __table_args__ = (
        Index('idx_data_sync_source', 'source_app_id'),
        Index('idx_data_sync_target', 'target_app_id'),
        Index('idx_data_sync_status', 'sync_status'),
    )


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()