"""
Widgets domain models
"""

from sqlalchemy import Column, String, Boolean, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.common.base_model import BaseModel


class Widget(BaseModel):
    """Widget definition model"""
    __tablename__ = "widgets"
    
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    category = Column(String(100), nullable=False)
    
    # Widget configuration
    config_schema = Column(JSONB, default={})
    default_config = Column(JSONB, default={})
    component_code = Column(Text)
    
    # Metadata
    is_premium = Column(Boolean, default=False)
    price = Column(Integer, default=0)
    downloads = Column(Integer, default=0)
    rating = Column(Integer, default=0)
    
    # Creator
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    creator = relationship("User")
    
    # Relationships
    app_widgets = relationship("AppWidget", back_populates="widget")
