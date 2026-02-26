"""
Collections domain models
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from src.common.base_model import BaseModel


class Collection(BaseModel):
    """User-defined database collection"""
    __tablename__ = "app_collections"
    
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="database")
    color = Column(String(20), default="#6366f1")
    schema = Column(JSON, default=list)  # Field definitions
    settings = Column(JSON, default=dict)
    indexes = Column(JSON, default=list)
    validation_rules = Column(JSON, default=dict)
    webhooks = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    
    # Relationships (properly configured)
    app = relationship("App", back_populates="collections")
    records = relationship("CollectionRecord", back_populates="collection", cascade="all, delete-orphan")


class CollectionRecord(BaseModel):
    """Record in a collection"""
    __tablename__ = "app_records"
    
    collection_id = Column(UUID(as_uuid=True), ForeignKey("app_collections.id"), nullable=False, index=True)
    data = Column(JSON, nullable=False, default=dict)
    search_text = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships (properly configured)
    collection = relationship("Collection", back_populates="records")


class CollectionRelation(BaseModel):
    """Relation between records"""
    __tablename__ = "app_relations"
    
    source_collection_id = Column(UUID(as_uuid=True), ForeignKey("app_collections.id"), nullable=False)
    source_record_id = Column(UUID(as_uuid=True), ForeignKey("app_records.id"), nullable=False)
    source_field = Column(String(255), nullable=False)
    target_collection_id = Column(UUID(as_uuid=True), ForeignKey("app_collections.id"), nullable=False)
    target_record_id = Column(UUID(as_uuid=True), ForeignKey("app_records.id"), nullable=False)
