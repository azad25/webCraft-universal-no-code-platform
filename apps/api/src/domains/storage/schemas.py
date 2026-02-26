"""Storage schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class StorageFileResponse(BaseModel):
    id: uuid.UUID
    filename: str
    original_filename: str
    mime_type: str
    size_bytes: int
    storage_provider: str
    public_url: Optional[str]
    cdn_url: Optional[str]
    file_hash: Optional[str]
    metadata: Dict[str, Any]
    width: Optional[int]
    height: Optional[int]
    thumbnail_url: Optional[str]
    folder_path: str
    tags: List[str]
    is_public: bool
    upload_status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class StorageFileUpdate(BaseModel):
    filename: Optional[str] = Field(None, min_length=1, max_length=255)
    folder_path: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class StorageFolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    path: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    is_public: bool = False


class StorageFolderResponse(BaseModel):
    id: uuid.UUID
    name: str
    path: str
    description: Optional[str]
    parent_id: Optional[uuid.UUID]
    is_public: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class StorageQuotaResponse(BaseModel):
    user_id: uuid.UUID
    max_storage_bytes: int
    max_files: int
    max_file_size_bytes: int
    used_storage_bytes: int
    used_files: int
    storage_percentage: float
    files_percentage: float
    
    class Config:
        from_attributes = True


class StorageStatsResponse(BaseModel):
    total_files: int
    total_size_bytes: int
    files_by_type: Dict[str, int]
    size_by_type: Dict[str, int]
    recent_uploads: List[StorageFileResponse]
    quota: StorageQuotaResponse


class UploadUrlRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    mime_type: str = Field(..., min_length=1, max_length=100)
    size_bytes: int = Field(..., gt=0)
    folder_path: str = Field(default="/", max_length=500)
    is_public: bool = False


class UploadUrlResponse(BaseModel):
    upload_url: str
    file_id: uuid.UUID
    expires_at: datetime
    fields: Dict[str, str] = Field(default_factory=dict)


class BulkDeleteRequest(BaseModel):
    file_ids: List[uuid.UUID] = Field(..., min_items=1)


class BulkMoveRequest(BaseModel):
    file_ids: List[uuid.UUID] = Field(..., min_items=1)
    target_folder: str = Field(..., max_length=500)