"""
Media domain service
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import UploadFile
import uuid
import mimetypes

from src.common.base_service import BaseService
from .models import MediaItem, MediaFolder, MediaType
from .schemas import (
    MediaItemCreate, MediaItemUpdate, MediaItemResponse,
    MediaFolderCreate, MediaFolderResponse, MediaListParams,
    EmbedRequest, CodeSnippetRequest, UrlMediaRequest
)
from src.domains.storage.service import StorageService


class MediaService(BaseService[MediaItem, MediaItemCreate, MediaItemUpdate]):
    def __init__(self, db: Session):
        super().__init__(MediaItem, db)
        self.db = db
        self.storage_service = StorageService(db)

    def get_media_type(self, mime_type: str) -> MediaType:
        """Determine media type from MIME type"""
        if mime_type.startswith("image/"):
            return MediaType.IMAGE
        elif mime_type.startswith("video/"):
            return MediaType.VIDEO
        elif mime_type.startswith("audio/"):
            return MediaType.VIDEO  # Treat audio as video for simplicity
        else:
            return MediaType.DOCUMENT

    def extract_embed_info(self, url: str) -> Dict[str, Any]:
        """Extract embed info from YouTube, Vimeo, etc."""
        info = {"provider": "unknown", "embed_url": url}
        
        if "youtube.com" in url or "youtu.be" in url:
            info["provider"] = "youtube"
            # Extract video ID
            if "youtu.be/" in url:
                video_id = url.split("youtu.be/")[1].split("?")[0]
            elif "v=" in url:
                video_id = url.split("v=")[1].split("&")[0]
            else:
                video_id = url.split("/")[-1]
            info["video_id"] = video_id
            info["embed_url"] = f"https://www.youtube.com/embed/{video_id}"
            info["thumbnail_url"] = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
        
        elif "vimeo.com" in url:
            info["provider"] = "vimeo"
            video_id = url.split("/")[-1]
            info["video_id"] = video_id
            info["embed_url"] = f"https://player.vimeo.com/video/{video_id}"
        
        elif "drive.google.com" in url:
            info["provider"] = "google_drive"
            if "/d/" in url:
                file_id = url.split("/d/")[1].split("/")[0]
                info["file_id"] = file_id
                info["embed_url"] = f"https://drive.google.com/file/d/{file_id}/preview"
        
        elif "docs.google.com" in url:
            info["provider"] = "google_docs"
            info["embed_url"] = url.replace("/edit", "/preview")
        
        return info

    async def upload_file(
        self, 
        app_id: str, 
        file: UploadFile, 
        folder_id: Optional[str] = None,
        alt_text: Optional[str] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None
    ) -> MediaItemResponse:
        """Upload a file and create media item (integrated with Storage)"""
        
        # First upload to Storage system
        if user_id:
            storage_file = await self.storage_service.upload_file(
                user_id=user_id,
                file_data=file.file,
                filename=file.filename,
                mime_type=file.content_type,
                folder_path=f"/apps/{app_id}/media",
                is_public=True  # Media files are typically public
            )
            
            # Use storage URLs
            file_url = storage_file.public_url or storage_file.cdn_url
            thumbnail_url = storage_file.thumbnail_url
            file_size = storage_file.size_bytes
            width = storage_file.width
            height = storage_file.height
        else:
            # Fallback to old method if no user_id provided
            content = await file.read()
            file_url = f"/api/media/file/{str(uuid.uuid4())}"
            thumbnail_url = None
            file_size = len(content)
            width = None
            height = None
        
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        media_type = self.get_media_type(mime_type)
        
        # Generate thumbnail URL for images/videos if not from storage
        if not thumbnail_url and media_type == MediaType.IMAGE:
            thumbnail_url = f"/api/media/thumbnail/{str(uuid.uuid4())}"
        
        media_data = MediaItemCreate(
            app_id=app_id,
            type=media_type,
            name=file.filename,
            url=file_url,
            thumbnail_url=thumbnail_url,
            mime_type=mime_type,
            size=file_size,
            width=width,
            height=height,
            alt_text=alt_text,
            folder_id=folder_id,
            tags=tags or [],
            extra_data={
                "original_filename": file.filename,
                "storage_file_id": storage_file.id if user_id else None
            }
        )
        
        media_item = self.create(media_data)
        return MediaItemResponse.model_validate(media_item)

    async def import_from_storage(
        self,
        app_id: str,
        storage_file_id: str,
        user_id: str,
        folder_id: Optional[str] = None,
        alt_text: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> MediaItemResponse:
        """Import a file from Storage into Media library"""
        
        # Get storage file
        storage_file = await self.storage_service.get_file(storage_file_id, user_id)
        if not storage_file:
            raise ValueError("Storage file not found")
        
        # Determine media type
        media_type = self.get_media_type(storage_file.mime_type)
        
        media_data = MediaItemCreate(
            app_id=app_id,
            type=media_type,
            name=storage_file.filename,
            url=storage_file.public_url or storage_file.cdn_url or f"/storage/files/{storage_file_id}",
            thumbnail_url=storage_file.thumbnail_url,
            mime_type=storage_file.mime_type,
            size=storage_file.size_bytes,
            width=storage_file.width,
            height=storage_file.height,
            alt_text=alt_text,
            folder_id=folder_id,
            tags=tags or [],
            extra_data={
                "storage_file_id": storage_file_id,
                "imported_from_storage": True,
                "original_filename": storage_file.original_filename
            }
        )
        
        media_item = self.create(media_data)
        return MediaItemResponse.model_validate(media_item)

    async def list_storage_files(
        self,
        user_id: str,
        mime_type_filter: Optional[str] = None,
        page: int = 1,
        per_page: int = 50
    ) -> Dict[str, Any]:
        """List available storage files for import"""
        return await self.storage_service.list_files(
            user_id=user_id,
            mime_type_filter=mime_type_filter,
            page=page,
            per_page=per_page
        )

    def add_embed(self, request: EmbedRequest) -> MediaItemResponse:
        """Add an embed (YouTube, Vimeo, Google Drive, etc.)"""
        embed_info = self.extract_embed_info(request.url)
        
        media_data = MediaItemCreate(
            app_id=request.app_id,
            type=MediaType.EMBED,
            name=f"{embed_info['provider'].title()} Embed",
            url=request.url,
            thumbnail_url=embed_info.get("thumbnail_url"),
            folder_id=request.folder_id,
            extra_data=embed_info
        )
        
        media_item = self.create(media_data)
        return MediaItemResponse.model_validate(media_item)

    def add_url_media(self, request: UrlMediaRequest) -> MediaItemResponse:
        """Add media from external URL"""
        mime_type = mimetypes.guess_type(request.url)[0] or "application/octet-stream"
        media_type = self.get_media_type(mime_type)
        
        media_data = MediaItemCreate(
            app_id=request.app_id,
            type=media_type,
            name=request.name or request.url.split("/")[-1],
            url=request.url,
            thumbnail_url=request.url if media_type == MediaType.IMAGE else None,
            mime_type=mime_type,
            folder_id=request.folder_id,
            extra_data={"source": "external_url"}
        )
        
        media_item = self.create(media_data)
        return MediaItemResponse.model_validate(media_item)

    def add_code_snippet(self, request: CodeSnippetRequest) -> MediaItemResponse:
        """Add a code snippet"""
        media_data = MediaItemCreate(
            app_id=request.app_id,
            type=MediaType.CODE,
            name=request.name,
            url=f"/api/media/code/{str(uuid.uuid4())}",
            extra_data={
                "code": request.code,
                "language": request.language
            },
            folder_id=request.folder_id
        )
        
        media_item = self.create(media_data)
        return MediaItemResponse.model_validate(media_item)

    def list_media(self, app_id: str, params: MediaListParams) -> List[MediaItemResponse]:
        """List media items with filtering"""
        query = self.db.query(MediaItem).filter(MediaItem.app_id == app_id)
        
        if params.type:
            query = query.filter(MediaItem.type == params.type)
        
        if params.folder_id:
            query = query.filter(MediaItem.folder_id == params.folder_id)
        elif params.folder_id is None:
            query = query.filter(MediaItem.folder_id.is_(None))
        
        if params.search:
            query = query.filter(MediaItem.name.ilike(f"%{params.search}%"))
        
        if params.tags:
            tag_list = params.tags.split(",")
            # JSON contains any of the tags
            for tag in tag_list:
                query = query.filter(MediaItem.tags.contains([tag]))
        
        # Sort by created_at descending
        query = query.order_by(MediaItem.created_at.desc())
        
        # Pagination
        offset = (params.page - 1) * params.limit
        items = query.offset(offset).limit(params.limit).all()
        
        return [MediaItemResponse.model_validate(item) for item in items]

    def get_by_app_id(self, app_id: str, media_id: str) -> Optional[MediaItemResponse]:
        """Get media item by app_id and media_id"""
        item = self.db.query(MediaItem).filter(
            MediaItem.id == media_id,
            MediaItem.app_id == app_id
        ).first()
        
        if item:
            return MediaItemResponse.model_validate(item)
        return None


class MediaFolderService(BaseService[MediaFolder, MediaFolderCreate, None]):
    def __init__(self, db: Session):
        super().__init__(MediaFolder, db)
        self.db = db

    def list_folders(self, app_id: str, parent_id: Optional[str] = None) -> List[MediaFolderResponse]:
        """List folders"""
        query = self.db.query(MediaFolder).filter(MediaFolder.app_id == app_id)
        
        if parent_id:
            query = query.filter(MediaFolder.parent_id == parent_id)
        else:
            query = query.filter(MediaFolder.parent_id.is_(None))
        
        folders = query.all()
        return [MediaFolderResponse.model_validate(folder) for folder in folders]

    def delete_folder(self, folder_id: str) -> bool:
        """Delete a folder (moves contents to parent)"""
        folder = self.get(folder_id)
        if not folder:
            return False
        
        # Move media to parent folder
        self.db.query(MediaItem).filter(
            MediaItem.folder_id == folder_id
        ).update({"folder_id": folder.parent_id})
        
        # Move child folders to parent
        self.db.query(MediaFolder).filter(
            MediaFolder.parent_id == folder_id
        ).update({"parent_id": folder.parent_id})
        
        self.delete(folder_id)
        return True