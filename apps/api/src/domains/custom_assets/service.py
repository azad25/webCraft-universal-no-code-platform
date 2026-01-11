"""Custom Assets domain service"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import UploadFile
import uuid
import os
import mimetypes


ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'}
ALLOWED_VIDEO_TYPES = {'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'}
ALLOWED_AUDIO_TYPES = {'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'}

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MAX_AUDIO_SIZE = 50 * 1024 * 1024   # 50MB

# In-memory storage
assets_store: Dict[str, Dict] = {}


class CustomAssetsService:
    def __init__(self, db: Session):
        self.db = db
    
    async def list_assets(
        self, app_id: str, asset_type: Optional[str] = None, is_global: Optional[bool] = None
    ) -> Dict[str, Any]:
        assets = [a for a in assets_store.values() if a["app_id"] == app_id]
        
        if asset_type:
            assets = [a for a in assets if a["type"] == asset_type]
        if is_global is not None:
            assets = [a for a in assets if a["is_global"] == is_global]
        
        assets.sort(key=lambda x: x["created_at"], reverse=True)
        return {"assets": assets, "total": len(assets)}
    
    async def create_asset(self, app_id: str, asset_data: Dict[str, Any]) -> Dict[str, Any]:
        asset_id = str(uuid.uuid4())
        asset = {
            "id": asset_id,
            "app_id": app_id,
            "page_id": asset_data.get("page_id"),
            "name": asset_data.get("name"),
            "type": asset_data.get("type"),
            "content": asset_data.get("content"),
            "url": None,
            "size": len(asset_data.get("content", "").encode()),
            "is_global": asset_data.get("is_global", False),
            "metadata": asset_data.get("metadata", {}),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        assets_store[asset_id] = asset
        return asset
    
    async def get_asset(self, app_id: str, asset_id: str) -> Optional[Dict[str, Any]]:
        asset = assets_store.get(asset_id)
        if asset and asset["app_id"] == app_id:
            return asset
        return None
    
    async def update_asset(
        self, app_id: str, asset_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        asset = assets_store.get(asset_id)
        if not asset or asset["app_id"] != app_id:
            return None
        
        for key, value in updates.items():
            if value is not None:
                asset[key] = value
        asset["updated_at"] = datetime.utcnow().isoformat()
        return asset
    
    async def delete_asset(self, app_id: str, asset_id: str) -> bool:
        asset = assets_store.get(asset_id)
        if not asset or asset["app_id"] != app_id:
            return False
        
        # Delete file if it exists
        if asset.get("url") and asset["type"] in ['image', 'video', 'audio']:
            try:
                filename = asset["url"].split('/')[-1]
                file_path = f"uploads/{app_id}/{filename}"
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
        
        del assets_store[asset_id]
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
        
        asset_id = str(uuid.uuid4())
        asset = {
            "id": asset_id,
            "app_id": app_id,
            "page_id": page_id,
            "name": os.path.splitext(file.filename)[0],
            "type": asset_type,
            "content": None,
            "url": f"/uploads/{app_id}/{unique_filename}",
            "size": len(file_content),
            "is_global": is_global,
            "metadata": metadata,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        assets_store[asset_id] = asset
        return asset
