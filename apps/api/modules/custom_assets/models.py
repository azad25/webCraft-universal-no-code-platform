from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class CustomAsset(Base):
    __tablename__ = "custom_assets"
    
    id = Column(String, primary_key=True)
    app_id = Column(String, ForeignKey("apps.id", ondelete="CASCADE"), nullable=False)
    page_id = Column(String, ForeignKey("pages.id", ondelete="CASCADE"), nullable=True)  # NULL for global assets
    
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'html', 'css', 'js', 'image', 'video', 'audio'
    
    # For code assets (HTML, CSS, JS)
    content = Column(Text, nullable=True)
    
    # For media assets (images, videos, audio)
    url = Column(String, nullable=True)
    size = Column(Integer, nullable=True)  # File size in bytes
    
    # Asset settings
    is_global = Column(Boolean, default=False)  # Global assets apply to all pages
    metadata = Column(JSON, default=dict)  # Additional metadata (dimensions, duration, etc.)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    app = relationship("App", back_populates="custom_assets")
    page = relationship("Page", back_populates="custom_assets")