"""
Apps domain models for V2 - Uses V2 database with v2_ prefixed tables
"""

from sqlalchemy import Column, String, Boolean, Text, Integer, ForeignKey, Index, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from src.core.database import Base


class App(Base):
    """Application model for V2 - uses apps table in V2 database"""
    __tablename__ = "apps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), index=True, nullable=False)
    description = Column(Text)
    app_type = Column(String(100), nullable=False)
    
    # Owner
    owner_id = Column(UUID(as_uuid=True), nullable=False)  # Reference to V1 users table
    organization_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Configuration
    config = Column(JSONB, default={})
    theme_config = Column(JSONB, default={})
    seo_config = Column(JSONB, default={})
    
    # Deployment
    is_published = Column(Boolean, default=False)
    custom_domain = Column(String(255), nullable=True)
    subdomain = Column(String(100), unique=True, nullable=True)
    
    # Template (reference only, no relationship)
    template_id = Column(UUID(as_uuid=True), nullable=True)  # Reference to V1 templates table
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships (properly configured with all domain models)
    pages = relationship("Page", back_populates="app", lazy="dynamic")
    collections = relationship("Collection", back_populates="app", lazy="dynamic")
    # TODO: Re-enable AI relationships once circular imports are fixed
    # ai_requests = relationship("AIRequest", back_populates="app", lazy="dynamic")
    media_items = relationship("MediaItem", back_populates="app", lazy="dynamic")
    media_folders = relationship("MediaFolder", back_populates="app", lazy="dynamic")
    data_sources = relationship("DataSource", back_populates="app", lazy="dynamic")
    # TODO: Re-enable scrapers relationship once circular imports are fixed
    # scrapers = relationship("WebScraper", back_populates="app", lazy="dynamic")
    # TODO: Re-enable automations relationship once circular imports are fixed
    # automations = relationship("Automation", back_populates="app", lazy="dynamic")
    app_widgets = relationship("AppWidget", lazy="dynamic")
    custom_assets = relationship("CustomAsset", back_populates="app", lazy="dynamic")
    
    # Relationships without back_populates (to avoid circular reference issues)
    links = relationship("AppLink", lazy="dynamic")
    link_groups = relationship("LinkGroup", lazy="dynamic")
    link_redirects = relationship("LinkRedirect", lazy="dynamic")
    push_subscriptions = relationship("PushSubscription", lazy="dynamic")
    push_notifications = relationship("PushNotification", lazy="dynamic")
    
    __table_args__ = (
        Index('idx_app_owner_slug', 'owner_id', 'slug'),
        Index('idx_app_subdomain', 'subdomain'),
        Index('idx_app_custom_domain', 'custom_domain'),
    )


class PreviewSession(Base):
    """Preview session model for V2 - uses preview_sessions table in V2 database"""
    __tablename__ = "preview_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token = Column(String(255), nullable=False, unique=True)
    device = Column(String(50), default="desktop")
    expires_at = Column(String(50), nullable=False)
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

