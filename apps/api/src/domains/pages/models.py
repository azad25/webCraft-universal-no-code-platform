"""
Pages domain models for V2 - Uses V2 database with same table names as V1
"""

from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Index, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from src.core.database import Base


class Page(Base):
    """Page model for V2 - uses pages table in V2 database"""
    __tablename__ = "pages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)
    content = Column(JSONB, default={})
    
    # SEO
    meta_title = Column(String(255))
    meta_description = Column(Text)
    meta_keywords = Column(String(500))
    og_image = Column(String(500))
    
    # Settings
    is_homepage = Column(Boolean, default=False)
    is_published = Column(Boolean, default=True)
    password_protected = Column(Boolean, default=False)
    password_hash = Column(String(255), nullable=True)
    
    # App relationship - references apps table in V2 database
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="pages")
    
    # Custom assets relationship
    custom_assets = relationship("CustomAsset", back_populates="page", lazy="dynamic")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_page_app_slug', 'app_id', 'slug'),
    )