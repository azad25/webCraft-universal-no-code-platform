"""
Media domain models
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from src.common.base_model import BaseModel


class MediaType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    URL = "url"
    CODE = "code"
    EMBED = "embed"


class MediaItem(BaseModel):
    __tablename__ = "media_items"

    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False, index=True)
    type = Column(SQLEnum(MediaType), nullable=False)
    name = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    thumbnail_url = Column(Text, nullable=True)
    mime_type = Column(String(100), nullable=True)
    size = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True)  # in seconds
    alt_text = Column(Text, nullable=True)
    caption = Column(Text, nullable=True)
    extra_data = Column(JSON, default={})  # Renamed from 'metadata' which is reserved
    folder_id = Column(UUID(as_uuid=True), ForeignKey("media_folders.id"), nullable=True, index=True)
    tags = Column(JSON, default=[])
    
    # Relationships
    app = relationship("App", back_populates="media_items")
    folder = relationship("MediaFolder", back_populates="media_items")


class MediaFolder(BaseModel):
    __tablename__ = "media_folders"

    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("media_folders.id"), nullable=True, index=True)
    
    # Relationships
    app = relationship("App", back_populates="media_folders")
    parent = relationship("MediaFolder", remote_side="MediaFolder.id", back_populates="children")
    children = relationship("MediaFolder", back_populates="parent")
    media_items = relationship("MediaItem", back_populates="folder")