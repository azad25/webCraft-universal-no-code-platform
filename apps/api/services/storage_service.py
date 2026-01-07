"""
Storage Service - Multi-provider file storage with S3, GCS, Azure, and local support
"""

from typing import Dict, List, Any, Optional, BinaryIO
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
import uuid
import os
import hashlib
import mimetypes
from pathlib import Path


class StorageProvider(str, Enum):
    LOCAL = "local"
    S3 = "s3"
    GCS = "gcs"
    AZURE = "azure"
    CLOUDFLARE_R2 = "cloudflare_r2"


@dataclass
class StorageConfig:
    provider: StorageProvider
    bucket: Optional[str] = None
    region: Optional[str] = None
    access_key: Optional[str] = None
    secret_key: Optional[str] = None
    endpoint_url: Optional[str] = None
    local_path: str = "./uploads"
    cdn_url: Optional[str] = None
    max_file_size: int = 100 * 1024 * 1024  # 100MB default


@dataclass
class StoredFile:
    id: str
    filename: str
    original_filename: str
    path: str
    url: str
    cdn_url: Optional[str]
    mime_type: str
    size: int
    checksum: str
    metadata: Dict[str, Any]
    created_at: datetime


class StorageService:
    """Multi-provider storage service"""
    
    def __init__(self, config: StorageConfig):
        self.config = config
        self._files: Dict[str, StoredFile] = {}
        self._init_provider()
    
    def _init_provider(self):
        """Initialize the storage provider"""
        if self.config.provider == StorageProvider.LOCAL:
            Path(self.config.local_path).mkdir(parents=True, exist_ok=True)
        elif self.config.provider == StorageProvider.S3:
            # Would initialize boto3 client here
            pass
        elif self.config.provider == StorageProvider.GCS:
            # Would initialize google-cloud-storage client here
            pass
    
    def _generate_file_id(self) -> str:
        return str(uuid.uuid4())
    
    def _generate_path(self, app_id: str, filename: str, folder: Optional[str] = None) -> str:
        """Generate storage path with organization"""
        date_prefix = datetime.utcnow().strftime("%Y/%m")
        file_id = self._generate_file_id()
        ext = Path(filename).suffix
        
        if folder:
            return f"{app_id}/{folder}/{date_prefix}/{file_id}{ext}"
        return f"{app_id}/{date_prefix}/{file_id}{ext}"
    
    def _calculate_checksum(self, content: bytes) -> str:
        return hashlib.md5(content).hexdigest()
    
    async def upload(
        self,
        content: bytes,
        filename: str,
        app_id: str,
        folder: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> StoredFile:
        """Upload a file to storage"""
        
        if len(content) > self.config.max_file_size:
            raise ValueError(f"File size exceeds maximum of {self.config.max_file_size} bytes")
        
        file_id = self._generate_file_id()
        path = self._generate_path(app_id, filename, folder)
        mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        checksum = self._calculate_checksum(content)
        
        # Store based on provider
        if self.config.provider == StorageProvider.LOCAL:
            full_path = Path(self.config.local_path) / path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_bytes(content)
            url = f"/api/v1/storage/files/{file_id}"
        else:
            # S3/GCS/Azure upload would go here
            url = f"https://{self.config.bucket}.s3.{self.config.region}.amazonaws.com/{path}"
        
        cdn_url = None
        if self.config.cdn_url:
            cdn_url = f"{self.config.cdn_url}/{path}"
        
        stored_file = StoredFile(
            id=file_id,
            filename=Path(path).name,
            original_filename=filename,
            path=path,
            url=url,
            cdn_url=cdn_url,
            mime_type=mime_type,
            size=len(content),
            checksum=checksum,
            metadata=metadata or {},
            created_at=datetime.utcnow()
        )
        
        self._files[file_id] = stored_file
        return stored_file
    
    async def download(self, file_id: str) -> Optional[bytes]:
        """Download a file from storage"""
        if file_id not in self._files:
            return None
        
        stored_file = self._files[file_id]
        
        if self.config.provider == StorageProvider.LOCAL:
            full_path = Path(self.config.local_path) / stored_file.path
            if full_path.exists():
                return full_path.read_bytes()
        
        return None
    
    async def delete(self, file_id: str) -> bool:
        """Delete a file from storage"""
        if file_id not in self._files:
            return False
        
        stored_file = self._files[file_id]
        
        if self.config.provider == StorageProvider.LOCAL:
            full_path = Path(self.config.local_path) / stored_file.path
            if full_path.exists():
                full_path.unlink()
        
        del self._files[file_id]
        return True
    
    async def get_file(self, file_id: str) -> Optional[StoredFile]:
        """Get file metadata"""
        return self._files.get(file_id)
    
    async def list_files(
        self,
        app_id: str,
        folder: Optional[str] = None,
        mime_type_prefix: Optional[str] = None
    ) -> List[StoredFile]:
        """List files with optional filtering"""
        files = [f for f in self._files.values() if f.path.startswith(app_id)]
        
        if folder:
            files = [f for f in files if f"/{folder}/" in f.path]
        
        if mime_type_prefix:
            files = [f for f in files if f.mime_type.startswith(mime_type_prefix)]
        
        return sorted(files, key=lambda x: x.created_at, reverse=True)
    
    async def get_signed_url(self, file_id: str, expires_in: int = 3600) -> Optional[str]:
        """Generate a signed URL for temporary access"""
        if file_id not in self._files:
            return None
        
        stored_file = self._files[file_id]
        
        if self.config.provider == StorageProvider.LOCAL:
            # For local, just return the regular URL
            return stored_file.url
        
        # For cloud providers, would generate signed URL here
        return stored_file.url
    
    async def copy(self, file_id: str, new_app_id: str) -> Optional[StoredFile]:
        """Copy a file to another app"""
        if file_id not in self._files:
            return None
        
        original = self._files[file_id]
        content = await self.download(file_id)
        
        if content:
            return await self.upload(
                content,
                original.original_filename,
                new_app_id,
                metadata=original.metadata
            )
        
        return None


# Global storage service instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get or create the storage service instance"""
    global _storage_service
    
    if _storage_service is None:
        # Load config from environment
        provider = os.getenv("STORAGE_PROVIDER", "local")
        
        config = StorageConfig(
            provider=StorageProvider(provider),
            bucket=os.getenv("STORAGE_BUCKET"),
            region=os.getenv("STORAGE_REGION", "us-east-1"),
            access_key=os.getenv("STORAGE_ACCESS_KEY"),
            secret_key=os.getenv("STORAGE_SECRET_KEY"),
            endpoint_url=os.getenv("STORAGE_ENDPOINT_URL"),
            local_path=os.getenv("STORAGE_LOCAL_PATH", "./uploads"),
            cdn_url=os.getenv("STORAGE_CDN_URL"),
            max_file_size=int(os.getenv("STORAGE_MAX_FILE_SIZE", 100 * 1024 * 1024))
        )
        
        _storage_service = StorageService(config)
    
    return _storage_service
