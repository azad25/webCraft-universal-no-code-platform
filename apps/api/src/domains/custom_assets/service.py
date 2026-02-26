"""Custom Assets domain service"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import UploadFile
import uuid
import os
import mimetypes

from .models import CustomAsset


ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'}
ALLOWED_VIDEO_TYPES = {'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'}
ALLOWED_AUDIO_TYPES = {'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'}

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MAX_AUDIO_SIZE = 50 * 1024 * 1024   # 50MB


class CustomAssetsService:
    def __init__(self, db: Session):
        self.db = db
    
    async def list_assets(
        self, app_id: str, asset_type: Optional[str] = None, is_global: Optional[bool] = None
    ) -> Dict[str, Any]:
        query = self.db.query(CustomAsset).filter(CustomAsset.app_id == app_id)
        
        if asset_type:
            query = query.filter(CustomAsset.type == asset_type)
        if is_global is not None:
            query = query.filter(CustomAsset.is_global == is_global)
        
        assets = query.order_by(CustomAsset.created_at.desc()).all()
        
        return {
            "assets": [self._asset_to_dict(asset) for asset in assets],
            "total": len(assets)
        }
    
    async def create_asset(self, app_id: str, asset_data: Dict[str, Any]) -> Dict[str, Any]:
        asset = CustomAsset(
            id=str(uuid.uuid4()),
            app_id=app_id,
            page_id=asset_data.get("page_id"),
            name=asset_data.get("name"),
            type=asset_data.get("type"),
            content=asset_data.get("content"),
            is_global=asset_data.get("is_global", False),
            asset_metadata=asset_data.get("metadata", {}),
            size=len(asset_data.get("content", "").encode()) if asset_data.get("content") else 0
        )
        
        self.db.add(asset)
        self.db.commit()
        self.db.refresh(asset)
        
        return self._asset_to_dict(asset)
    
    async def get_asset(self, app_id: str, asset_id: str) -> Optional[Dict[str, Any]]:
        asset = self.db.query(CustomAsset).filter(
            CustomAsset.id == asset_id,
            CustomAsset.app_id == app_id
        ).first()
        
        if asset:
            return self._asset_to_dict(asset)
        return None
    
    async def update_asset(
        self, app_id: str, asset_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        asset = self.db.query(CustomAsset).filter(
            CustomAsset.id == asset_id,
            CustomAsset.app_id == app_id
        ).first()
        
        if not asset:
            return None
        
        for key, value in updates.items():
            if value is not None and hasattr(asset, key):
                if key == "metadata":
                    setattr(asset, "asset_metadata", value)
                else:
                    setattr(asset, key, value)
        
        asset.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(asset)
        
        return self._asset_to_dict(asset)
    
    async def delete_asset(self, app_id: str, asset_id: str) -> bool:
        asset = self.db.query(CustomAsset).filter(
            CustomAsset.id == asset_id,
            CustomAsset.app_id == app_id
        ).first()
        
        if not asset:
            return False
        
        # Delete file if it exists
        if asset.url and asset.type in ['image', 'video', 'audio']:
            try:
                filename = asset.url.split('/')[-1]
                file_path = f"uploads/{app_id}/{filename}"
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
        
        self.db.delete(asset)
        self.db.commit()
        return True
    
    async def upload_media(
        self, app_id: str, file: UploadFile, asset_type: str,
        page_id: Optional[str] = None, is_global: bool = False
    ) -> Dict[str, Any]:
        content_type = file.content_type or mimetypes.guess_type(file.filename)[0]
        
        if asset_type == 'image':
            if content_type not in ALLOWED_IMAGE_TYPES:
                return {"error": "Invalid image file type"}
            max_size = MAX_IMAGE_SIZE
        elif asset_type == 'video':
            if content_type not in ALLOWED_VIDEO_TYPES:
                return {"error": "Invalid video file type"}
            max_size = MAX_VIDEO_SIZE
        elif asset_type == 'audio':
            if content_type not in ALLOWED_AUDIO_TYPES:
                return {"error": "Invalid audio file type"}
            max_size = MAX_AUDIO_SIZE
        else:
            return {"error": "Invalid asset type"}
        
        file_content = await file.read()
        if len(file_content) > max_size:
            return {"error": f"File too large. Maximum size: {max_size // 1024 // 1024}MB"}
        
        upload_dir = f"uploads/{app_id}"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        metadata = {
            'format': content_type,
            'size': len(file_content),
            'original_filename': file.filename
        }
        
        # For images, try to get dimensions
        if asset_type == 'image':
            try:
                from PIL import Image
                with Image.open(file_path) as img:
                    metadata['width'] = img.width
                    metadata['height'] = img.height
            except Exception:
                pass
        
        asset = CustomAsset(
            id=str(uuid.uuid4()),
            app_id=app_id,
            page_id=page_id,
            name=os.path.splitext(file.filename)[0],
            type=asset_type,
            url=f"/uploads/{app_id}/{unique_filename}",
            size=len(file_content),
            is_global=is_global,
            asset_metadata=metadata
        )
        
        self.db.add(asset)
        self.db.commit()
        self.db.refresh(asset)
        
        return self._asset_to_dict(asset)
    
    def _asset_to_dict(self, asset: CustomAsset) -> Dict[str, Any]:
        """Convert CustomAsset model to dictionary"""
        return {
            "id": asset.id,
            "app_id": asset.app_id,
            "page_id": asset.page_id,
            "name": asset.name,
            "type": asset.type,
            "content": asset.content,
            "url": asset.url,
            "size": asset.size or 0,
            "is_global": asset.is_global,
            "metadata": asset.asset_metadata or {},
            "created_at": asset.created_at.isoformat() if asset.created_at else None,
            "updated_at": asset.updated_at.isoformat() if asset.updated_at else None
        }
