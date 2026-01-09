from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, Union
from datetime import datetime
import uuid

class CustomAssetBase(BaseModel):
    name: str
    type: str
    content: Optional[str] = None
    url: Optional[str] = None
    size: Optional[int] = None
    is_global: bool = False
    metadata: Optional[Dict[str, Any]] = None

class CustomAssetCreate(CustomAssetBase):
    page_id: Optional[str] = None
    
    @validator('type')
    def validate_type(cls, v):
        allowed_types = ['html', 'css', 'js', 'image', 'video', 'audio']
        if v not in allowed_types:
            raise ValueError(f'Type must be one of: {", ".join(allowed_types)}')
        return v
    
    @validator('content')
    def validate_content(cls, v, values):
        asset_type = values.get('type')
        if asset_type in ['html', 'css', 'js'] and not v:
            raise ValueError('Content is required for code assets')
        return v

class CustomAssetUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    is_global: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None

class CustomAssetResponse(CustomAssetBase):
    id: str
    app_id: str
    page_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, obj):
        # Handle metadata properly - it might be None or a dict
        metadata_value = {}
        if hasattr(obj, 'metadata') and obj.metadata is not None:
            if isinstance(obj.metadata, dict):
                metadata_value = obj.metadata
            else:
                # If it's not a dict, try to convert or use empty dict
                metadata_value = {}
        
        return cls(
            id=str(obj.id),
            app_id=str(obj.app_id),
            page_id=str(obj.page_id) if obj.page_id else None,
            name=obj.name,
            type=obj.type,
            content=obj.content,
            url=obj.url,
            size=obj.size,
            is_global=obj.is_global,
            metadata=metadata_value,
            created_at=obj.created_at,
            updated_at=obj.updated_at
        )