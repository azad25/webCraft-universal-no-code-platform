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


class MediaService(BaseService[MediaItem, MediaItemCreate, MediaItemUpdate]):
    def __init__(self, db: Session):
        super().__init__(MediaItem, db)
        self.db = db

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
        tags: Optional[List[str]] = None
    ) -> MediaItemResponse:
        """Upload a file and create media item"""
        content = await file.read()
        
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        media_type = self.get_media_type(mime_type)
        
        # Generate thumbnail URL for images/videos (placeholder)
        thumbnail_url = None
        if media_type == MediaType.IMAGE:
            thumbnail_url = f"/api/media/thumbnail/{str(uuid.uuid4())}"
        
        media_data = MediaItemCreate(
            app_id=app_id,
            type=media_type,
            name=file.filename,
            url=f"/api/media/file/{str(uuid.uuid4())}",
            thumbnail_url=thumbnail_url,
            mime_type=mime_type,
            size=len(content),
            alt_text=alt_text,
            folder_id=folder_id,
            tags=tags or [],
            extra_data={"original_filename": file.filename}
        )
        
        media_item = self.create(media_data)
        return MediaItemResponse.model_validate(media_item)

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