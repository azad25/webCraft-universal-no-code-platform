"""Storage models"""
from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from src.core.database import Base


class StorageFile(Base):
    """Files stored in the system"""
    __tablename__ = "storage_files"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # File info
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    
    # Storage location
    storage_provider = Column(String(50), default="local")  # local, s3, gcs, azure
    storage_path = Column(String(500), nullable=False)
    storage_bucket = Column(String(100), nullable=True)
    
    # URLs
    public_url = Column(String(500), nullable=True)
    cdn_url = Column(String(500), nullable=True)
    
    # File metadata
    file_hash = Column(String(64), nullable=True)  # SHA-256 hash
    file_metadata = Column(JSONB, default={})
    
    # Image-specific metadata
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Organization
    folder_path = Column(String(500), default="/")
    tags = Column(JSONB, default=[])
    
    # Access control
    is_public = Column(Boolean, default=False)
    access_permissions = Column(JSONB, default={})
    
    # Status
    is_active = Column(Boolean, default=True)
    upload_status = Column(String(20), default="completed")  # uploading, completed, failed
    
    # User relationship
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    uploaded_by = relationship("User")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_storage_file_uploader', 'uploaded_by_id'),
        Index('idx_storage_file_folder', 'folder_path'),
        Index('idx_storage_file_mime', 'mime_type'),
        Index('idx_storage_file_hash', 'file_hash'),
        Index('idx_storage_file_public', 'is_public'),
    )


class StorageFolder(Base):
    """Folders for organizing files"""
    __tablename__ = "storage_folders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Folder info
    name = Column(String(255), nullable=False)
    path = Column(String(500), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    # Hierarchy
    parent_id = Column(UUID(as_uuid=True), ForeignKey("storage_folders.id"), nullable=True)
    parent = relationship("StorageFolder", remote_side=[id])
    
    # Settings
    is_public = Column(Boolean, default=False)
    access_permissions = Column(JSONB, default={})
    
    # User relationship
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by = relationship("User")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_storage_folder_path', 'path'),
        Index('idx_storage_folder_parent', 'parent_id'),
        Index('idx_storage_folder_creator', 'created_by_id'),
    )


class StorageQuota(Base):
    """Storage quotas for users"""
    __tablename__ = "storage_quotas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User relationship
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    user = relationship("User")
    
    # Quota limits
    max_storage_bytes = Column(Integer, default=1073741824)  # 1GB default
    max_files = Column(Integer, default=10000)
    max_file_size_bytes = Column(Integer, default=104857600)  # 100MB default
    
    # Current usage
    used_storage_bytes = Column(Integer, default=0)
    used_files = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_storage_quota_user', 'user_id'),
    )


class StorageAccess(Base):
    """File access logs"""
    __tablename__ = "storage_access"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # File relationship
    file_id = Column(UUID(as_uuid=True), ForeignKey("storage_files.id"), nullable=False)
    file = relationship("StorageFile")
    
    # Access info
    access_type = Column(String(20), nullable=False)  # view, download, delete
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    referrer = Column(String(500), nullable=True)
    
    # User (if authenticated)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    user = relationship("User")
    
    # Timestamp
    accessed_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_storage_access_file', 'file_id'),
        Index('idx_storage_access_user', 'user_id'),
        Index('idx_storage_access_date', 'accessed_at'),
        Index('idx_storage_access_type', 'access_type'),
    )