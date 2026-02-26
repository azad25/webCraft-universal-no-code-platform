"""Link management models"""
from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from src.core.database import Base


class AppLink(Base):
    """Links within apps for navigation and external references"""
    __tablename__ = "app_links"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic link info
    title = Column(String(255), nullable=False)
    url = Column(String(2000), nullable=False)
    description = Column(Text, nullable=True)
    
    # Link type and category
    link_type = Column(String(50), nullable=False, default="external")  # internal, external, email, phone, download, anchor
    category = Column(String(100), nullable=True)  # navigation, footer, social, etc.
    
    # Link properties
    target = Column(String(20), default="_self")  # _self, _blank, _parent, _top
    rel = Column(String(100), nullable=True)  # nofollow, noopener, noreferrer, etc.
    css_class = Column(String(255), nullable=True)
    
    # Link metadata
    icon = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    sort_order = Column(Integer, default=0)
    
    # Status and validation
    is_active = Column(Boolean, default=True)
    is_validated = Column(Boolean, default=False)
    last_checked = Column(DateTime, nullable=True)
    status_code = Column(Integer, nullable=True)  # HTTP status from last check
    error_message = Column(Text, nullable=True)
    
    # Analytics
    click_count = Column(Integer, default=0)
    last_clicked = Column(DateTime, nullable=True)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    # Page relationship (for page-specific links)
    page_id = Column(UUID(as_uuid=True), ForeignKey("pages.id"), nullable=True)
    page = relationship("Page")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_app_link_app', 'app_id'),
        Index('idx_app_link_page', 'page_id'),
        Index('idx_app_link_type', 'link_type'),
        Index('idx_app_link_category', 'category'),
        Index('idx_app_link_active', 'is_active'),
    )


class LinkGroup(Base):
    """Groups of links for organization (e.g., main nav, footer links, social links)"""
    __tablename__ = "link_groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Group info
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Group settings
    display_type = Column(String(50), default="list")  # list, grid, dropdown, tabs
    max_items = Column(Integer, nullable=True)
    sort_order = Column(Integer, default=0)
    
    # Styling
    css_class = Column(String(255), nullable=True)
    style_config = Column(JSONB, default={})
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    links = relationship("LinkGroupItem", back_populates="group", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_link_group_app', 'app_id'),
        Index('idx_link_group_slug', 'app_id', 'slug'),
    )


class LinkGroupItem(Base):
    """Links within a group"""
    __tablename__ = "link_group_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relationships
    group_id = Column(UUID(as_uuid=True), ForeignKey("link_groups.id"), nullable=False)
    link_id = Column(UUID(as_uuid=True), ForeignKey("app_links.id"), nullable=False)
    
    # Position in group
    sort_order = Column(Integer, default=0)
    
    # Item-specific overrides
    custom_title = Column(String(255), nullable=True)  # Override link title for this group
    custom_icon = Column(String(100), nullable=True)   # Override link icon for this group
    is_featured = Column(Boolean, default=False)       # Featured item in group
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group = relationship("LinkGroup", back_populates="links")
    link = relationship("AppLink")
    
    # Indexes
    __table_args__ = (
        Index('idx_link_group_item_group', 'group_id'),
        Index('idx_link_group_item_link', 'link_id'),
        Index('idx_link_group_item_order', 'group_id', 'sort_order'),
    )


class LinkRedirect(Base):
    """URL redirects for links"""
    __tablename__ = "link_redirects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Redirect info
    from_path = Column(String(500), nullable=False)
    to_url = Column(String(2000), nullable=False)
    redirect_type = Column(Integer, default=301)  # 301, 302, 307, 308
    
    # Conditions
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Analytics
    redirect_count = Column(Integer, default=0)
    last_used = Column(DateTime, nullable=True)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_link_redirect_app', 'app_id'),
        Index('idx_link_redirect_from', 'from_path'),
        Index('idx_link_redirect_active', 'is_active'),
    )


class LinkAnalytics(Base):
    """Analytics for link clicks"""
    __tablename__ = "link_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Link relationship
    link_id = Column(UUID(as_uuid=True), ForeignKey("app_links.id"), nullable=False)
    link = relationship("AppLink")
    
    # Click data
    clicked_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    referrer = Column(String(500), nullable=True)
    
    # Location data
    country = Column(String(2), nullable=True)
    region = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Device data
    device_type = Column(String(20), nullable=True)  # desktop, mobile, tablet
    browser = Column(String(50), nullable=True)
    os = Column(String(50), nullable=True)
    
    # Indexes
    __table_args__ = (
        Index('idx_link_analytics_link', 'link_id'),
        Index('idx_link_analytics_date', 'clicked_at'),
    )