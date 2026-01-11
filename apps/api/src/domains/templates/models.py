"""
Templates domain models for V2
"""

from sqlalchemy import Column, String, Boolean, Text, Integer, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.common.base_model import BaseModel


class Template(BaseModel):
    """Template model for V2"""
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
    
    # Creator info (reference to V2 users)
    creator_id = Column(UUID(as_uuid=True), nullable=False)
    
    __table_args__ = (
        Index('idx_template_category', 'category'),
        Index('idx_template_creator', 'creator_id'),
    )


class TemplatePage(BaseModel):
    """Template page model for V2"""
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
    template_id = Column(UUID(as_uuid=True), nullable=False)
    
    __table_args__ = (
        Index('idx_template_page_template_slug', 'template_id', 'slug'),
    )