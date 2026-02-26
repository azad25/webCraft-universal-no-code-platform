"""Storage service"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any, BinaryIO
from datetime import datetime, timedelta
import uuid
import os
import hashlib
import mimetypes
from pathlib import Path
import shutil

from .models import StorageFile, StorageFolder, StorageQuota, StorageAccess
from .schemas import (
    StorageFileResponse, StorageFileUpdate,
    StorageFolderCreate, StorageFolderResponse,
    StorageQuotaResponse, StorageStatsResponse,
    UploadUrlRequest, UploadUrlResponse,
    BulkDeleteRequest, BulkMoveRequest
)
from src.domains.auth.models import User
from src.core.config import settings


class StorageService:
    def __init__(self, db: Session):
        self.db = db
        self.storage_root = getattr(settings, 'STORAGE_ROOT', './storage')
        Path(self.storage_root).mkdir(parents=True, exist_ok=True)
    
    # File operations
    async def upload_file(
        self,
        user_id: str,
        file_data: BinaryIO,
        filename: str,
        mime_type: Optional[str] = None,
        folder_path: str = "/",
        is_public: bool = False
    ) -> StorageFileResponse:
        """Upload a file"""
        # Check quota
        await self._check_quota(user_id, len(file_data.read()))
        file_data.seek(0)  # Reset file pointer
        
        # Generate file info
        file_id = uuid.uuid4()
        file_hash = hashlib.sha256(file_data.read()).hexdigest()
        file_data.seek(0)  # Reset file pointer again
        
        if not mime_type:
            mime_type, _ = mimetypes.guess_type(filename)
            mime_type = mime_type or 'application/octet-stream'
        
        # Generate storage path
        storage_path = self._generate_storage_path(str(file_id), filename)
        full_path = Path(self.storage_root) / storage_path
        
        # Create directory if needed
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save file
        with open(full_path, 'wb') as f:
            shutil.copyfileobj(file_data, f)
        
        # Get file size
        size_bytes = full_path.stat().st_size
        
        # Create database record
        storage_file = StorageFile(
            id=file_id,
            filename=filename,
            original_filename=filename,
            mime_type=mime_type,
            size_bytes=size_bytes,
            storage_path=storage_path,
            file_hash=file_hash,
            folder_path=folder_path,
            is_public=is_public,
            uploaded_by_id=user_id
        )
        
        # Generate URLs
        if is_public:
            storage_file.public_url = f"/storage/files/{file_id}"
        
        # Handle image metadata
        if mime_type.startswith('image/'):
            try:
                from PIL import Image
                with Image.open(full_path) as img:
                    storage_file.width = img.width
                    storage_file.height = img.height
                    
                    # Generate thumbnail for images
                    thumbnail_path = self._generate_thumbnail(full_path, str(file_id))
                    if thumbnail_path:
                        storage_file.thumbnail_url = f"/storage/thumbnails/{file_id}"
            except ImportError:
                pass  # PIL not available
            except Exception:
                pass  # Thumbnail generation failed
        
        self.db.add(storage_file)
        
        # Update quota
        await self._update_quota_usage(user_id, size_bytes, 1)
        
        self.db.commit()
        self.db.refresh(storage_file)
        
        return StorageFileResponse.from_orm(storage_file)
    
    async def get_file(self, file_id: str, user_id: Optional[str] = None) -> Optional[StorageFileResponse]:
        """Get file information"""
        query = self.db.query(StorageFile).filter(StorageFile.id == file_id)
        
        # If user_id provided, check ownership or public access
        if user_id:
            query = query.filter(
                or_(
                    StorageFile.uploaded_by_id == user_id,
                    StorageFile.is_public == True
                )
            )
        else:
            # Public access only
            query = query.filter(StorageFile.is_public == True)
        
        file = query.first()
        
        if not file:
            return None
        
        return StorageFileResponse.from_orm(file)
    
    async def list_files(
        self,
        user_id: str,
        folder_path: Optional[str] = None,
        mime_type_filter: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        per_page: int = 50
    ) -> Dict[str, Any]:
        """List user's files"""
        query = self.db.query(StorageFile).filter(
            StorageFile.uploaded_by_id == user_id,
            StorageFile.is_active == True
        )
        
        # Apply filters
        if folder_path:
            query = query.filter(StorageFile.folder_path == folder_path)
        
        if mime_type_filter:
            query = query.filter(StorageFile.mime_type.like(f"{mime_type_filter}%"))
        
        if search:
            query = query.filter(
                or_(
                    StorageFile.filename.ilike(f"%{search}%"),
                    StorageFile.original_filename.ilike(f"%{search}%")
                )
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        files = query.order_by(desc(StorageFile.created_at)).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        return {
            "files": [StorageFileResponse.from_orm(file) for file in files],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    
    async def update_file(self, file_id: str, user_id: str, data: StorageFileUpdate) -> Optional[StorageFileResponse]:
        """Update file metadata"""
        file = self.db.query(StorageFile).filter(
            StorageFile.id == file_id,
            StorageFile.uploaded_by_id == user_id
        ).first()
        
        if not file:
            return None
        
        # Update fields
        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(file, field, value)
        
        file.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(file)
        
        return StorageFileResponse.from_orm(file)
    
    async def delete_file(self, file_id: str, user_id: str) -> bool:
        """Delete a file"""
        file = self.db.query(StorageFile).filter(
            StorageFile.id == file_id,
            StorageFile.uploaded_by_id == user_id
        ).first()
        
        if not file:
            return False
        
        # Delete physical file
        try:
            full_path = Path(self.storage_root) / file.storage_path
            if full_path.exists():
                full_path.unlink()
            
            # Delete thumbnail if exists
            if file.thumbnail_url:
                thumbnail_path = Path(self.storage_root) / "thumbnails" / f"{file_id}.jpg"
                if thumbnail_path.exists():
                    thumbnail_path.unlink()
        except Exception:
            pass  # Continue even if file deletion fails
        
        # Update quota
        await self._update_quota_usage(user_id, -file.size_bytes, -1)
        
        # Delete database record
        self.db.delete(file)
        self.db.commit()
        
        return True
    
    # Folder operations
    async def create_folder(self, user_id: str, data: StorageFolderCreate) -> StorageFolderResponse:
        """Create a folder"""
        # Check if folder already exists
        existing = self.db.query(StorageFolder).filter(
            StorageFolder.path == data.path
        ).first()
        
        if existing:
            raise ValueError("Folder already exists")
        
        folder = StorageFolder(
            created_by_id=user_id,
            **data.dict()
        )
        
        self.db.add(folder)
        self.db.commit()
        self.db.refresh(folder)
        
        return StorageFolderResponse.from_orm(folder)
    
    async def list_folders(self, user_id: str, parent_id: Optional[str] = None) -> List[StorageFolderResponse]:
        """List folders"""
        query = self.db.query(StorageFolder).filter(
            or_(
                StorageFolder.created_by_id == user_id,
                StorageFolder.is_public == True
            )
        )
        
        if parent_id:
            query = query.filter(StorageFolder.parent_id == parent_id)
        else:
            query = query.filter(StorageFolder.parent_id.is_(None))
        
        folders = query.order_by(StorageFolder.name).all()
        
        return [StorageFolderResponse.from_orm(folder) for folder in folders]
    
    # Quota management
    async def get_quota(self, user_id: str) -> StorageQuotaResponse:
        """Get user's storage quota"""
        quota = self.db.query(StorageQuota).filter(StorageQuota.user_id == user_id).first()
        
        if not quota:
            # Create default quota
            quota = StorageQuota(user_id=user_id)
            self.db.add(quota)
            self.db.commit()
            self.db.refresh(quota)
        
        # Calculate percentages
        storage_percentage = (quota.used_storage_bytes / quota.max_storage_bytes * 100) if quota.max_storage_bytes > 0 else 0
        files_percentage = (quota.used_files / quota.max_files * 100) if quota.max_files > 0 else 0
        
        response = StorageQuotaResponse.from_orm(quota)
        response.storage_percentage = round(storage_percentage, 2)
        response.files_percentage = round(files_percentage, 2)
        
        return response
    
    async def get_storage_stats(self, user_id: str) -> StorageStatsResponse:
        """Get storage statistics"""
        # Basic stats
        total_files = self.db.query(StorageFile).filter(
            StorageFile.uploaded_by_id == user_id,
            StorageFile.is_active == True
        ).count()
        
        total_size = self.db.query(func.sum(StorageFile.size_bytes)).filter(
            StorageFile.uploaded_by_id == user_id,
            StorageFile.is_active == True
        ).scalar() or 0
        
        # Files by type
        files_by_type = {}
        size_by_type = {}
        
        type_stats = self.db.query(
            func.split_part(StorageFile.mime_type, '/', 1).label('type'),
            func.count(StorageFile.id).label('count'),
            func.sum(StorageFile.size_bytes).label('size')
        ).filter(
            StorageFile.uploaded_by_id == user_id,
            StorageFile.is_active == True
        ).group_by('type').all()
        
        for stat in type_stats:
            files_by_type[stat.type] = stat.count
            size_by_type[stat.type] = stat.size or 0
        
        # Recent uploads
        recent_files = self.db.query(StorageFile).filter(
            StorageFile.uploaded_by_id == user_id,
            StorageFile.is_active == True
        ).order_by(desc(StorageFile.created_at)).limit(10).all()
        
        # Get quota
        quota = await self.get_quota(user_id)
        
        return StorageStatsResponse(
            total_files=total_files,
            total_size_bytes=total_size,
            files_by_type=files_by_type,
            size_by_type=size_by_type,
            recent_uploads=[StorageFileResponse.from_orm(f) for f in recent_files],
            quota=quota
        )
    
    # Bulk operations
    async def bulk_delete(self, user_id: str, data: BulkDeleteRequest) -> Dict[str, Any]:
        """Delete multiple files"""
        deleted_count = 0
        total_size_freed = 0
        
        for file_id in data.file_ids:
            if await self.delete_file(str(file_id), user_id):
                deleted_count += 1
        
        return {
            "deleted_count": deleted_count,
            "total_requested": len(data.file_ids)
        }
    
    async def bulk_move(self, user_id: str, data: BulkMoveRequest) -> Dict[str, Any]:
        """Move multiple files to a folder"""
        moved_count = 0
        
        files = self.db.query(StorageFile).filter(
            StorageFile.id.in_(data.file_ids),
            StorageFile.uploaded_by_id == user_id
        ).all()
        
        for file in files:
            file.folder_path = data.target_folder
            file.updated_at = datetime.utcnow()
            moved_count += 1
        
        self.db.commit()
        
        return {
            "moved_count": moved_count,
            "total_requested": len(data.file_ids)
        }
    
    # Helper methods
    def _generate_storage_path(self, file_id: str, filename: str) -> str:
        """Generate storage path for file"""
        # Use first 2 chars of file_id for directory structure
        dir1 = file_id[:2]
        dir2 = file_id[2:4]
        
        # Keep original extension
        _, ext = os.path.splitext(filename)
        
        return f"{dir1}/{dir2}/{file_id}{ext}"
    
    def _generate_thumbnail(self, image_path: Path, file_id: str) -> Optional[str]:
        """Generate thumbnail for image"""
        try:
            from PIL import Image
            
            thumbnail_dir = Path(self.storage_root) / "thumbnails"
            thumbnail_dir.mkdir(parents=True, exist_ok=True)
            
            thumbnail_path = thumbnail_dir / f"{file_id}.jpg"
            
            with Image.open(image_path) as img:
                img.thumbnail((300, 300), Image.Resampling.LANCZOS)
                img.convert('RGB').save(thumbnail_path, 'JPEG', quality=85)
            
            return str(thumbnail_path.relative_to(self.storage_root))
        
        except Exception:
            return None
    
    async def _check_quota(self, user_id: str, file_size: int):
        """Check if user has enough quota"""
        quota = await self.get_quota(user_id)
        
        if quota.used_storage_bytes + file_size > quota.max_storage_bytes:
            raise ValueError("Storage quota exceeded")
        
        if quota.used_files + 1 > quota.max_files:
            raise ValueError("File count quota exceeded")
    
    async def _update_quota_usage(self, user_id: str, size_delta: int, files_delta: int):
        """Update quota usage"""
        quota = self.db.query(StorageQuota).filter(StorageQuota.user_id == user_id).first()
        
        if not quota:
            quota = StorageQuota(user_id=user_id)
            self.db.add(quota)
        
        quota.used_storage_bytes = max(0, quota.used_storage_bytes + size_delta)
        quota.used_files = max(0, quota.used_files + files_delta)
        quota.updated_at = datetime.utcnow()
        
        self.db.commit()