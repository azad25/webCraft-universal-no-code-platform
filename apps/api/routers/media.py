"""
Media Manager API - WordPress-like media library
Supports images, videos, documents, URLs, code snippets, embeds
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
import mimetypes

router = APIRouter(prefix="/apps/{app_id}/media", tags=["Media"])


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    URL = "url"
    CODE = "code"
    EMBED = "embed"  # YouTube, Vimeo, etc.


class MediaItem(BaseModel):
    id: str
    app_id: str
    type: MediaType
    name: str
    url: str
    thumbnail_url: Optional[str] = None
    mime_type: Optional[str] = None
    size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None  # For video/audio
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    metadata: Dict[str, Any] = {}
    folder_id: Optional[str] = None
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime


class MediaFolder(BaseModel):
    id: str
    app_id: str
    name: str
    parent_id: Optional[str] = None
    created_at: datetime


class UploadResponse(BaseModel):
    success: bool
    media: Optional[MediaItem] = None
    error: Optional[str] = None


class EmbedRequest(BaseModel):
    url: str
    app_id: str
    folder_id: Optional[str] = None


class CodeSnippetRequest(BaseModel):
    app_id: str
    name: str
    code: str
    language: str
    folder_id: Optional[str] = None


class UrlMediaRequest(BaseModel):
    app_id: str
    url: str
    name: Optional[str] = None
    folder_id: Optional[str] = None


# In-memory storage (replace with database in production)
media_store: Dict[str, MediaItem] = {}
folder_store: Dict[str, MediaFolder] = {}


def get_media_type(mime_type: str) -> MediaType:
    """Determine media type from MIME type"""
    if mime_type.startswith("image/"):
        return MediaType.IMAGE
    elif mime_type.startswith("video/"):
        return MediaType.VIDEO
    elif mime_type.startswith("audio/"):
        return MediaType.VIDEO  # Treat audio as video for simplicity
    else:
        return MediaType.DOCUMENT


def extract_embed_info(url: str) -> Dict[str, Any]:
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


@router.post("/upload", response_model=UploadResponse)
async def upload_media(
    app_id: str,
    file: UploadFile = File(...),
    folder_id: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    tags: Optional[str] = Form(None)  # Comma-separated
):
    """Upload a file (image, video, document)"""
    try:
        content = await file.read()
        file_id = str(uuid.uuid4())
        
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        media_type = get_media_type(mime_type)
        
        # Generate thumbnail URL for images/videos (placeholder)
        thumbnail_url = None
        if media_type == MediaType.IMAGE:
            thumbnail_url = f"/api/media/thumbnail/{file_id}"
        
        media_item = MediaItem(
            id=file_id,
            app_id=app_id,
            type=media_type,
            name=file.filename,
            url=f"/api/media/file/{file_id}",
            thumbnail_url=thumbnail_url,
            mime_type=mime_type,
            size=len(content),
            alt_text=alt_text,
            folder_id=folder_id,
            tags=tags.split(",") if tags else [],
            metadata={"original_filename": file.filename},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        media_store[file_id] = media_item
        
        return UploadResponse(success=True, media=media_item)
    
    except Exception as e:
        return UploadResponse(success=False, error=str(e))


@router.post("/upload/batch", response_model=List[UploadResponse])
async def upload_batch(
    app_id: str,
    files: List[UploadFile] = File(...),
    folder_id: Optional[str] = Form(None)
):
    """Upload multiple files at once"""
    results = []
    for file in files:
        result = await upload_media(file, app_id, folder_id)
        results.append(result)
    return results


@router.post("/embed", response_model=UploadResponse)
async def add_embed(request: EmbedRequest):
    """Add an embed (YouTube, Vimeo, Google Drive, etc.)"""
    try:
        embed_info = extract_embed_info(request.url)
        file_id = str(uuid.uuid4())
        
        media_item = MediaItem(
            id=file_id,
            app_id=request.app_id,
            type=MediaType.EMBED,
            name=f"{embed_info['provider'].title()} Embed",
            url=request.url,
            thumbnail_url=embed_info.get("thumbnail_url"),
            folder_id=request.folder_id,
            metadata=embed_info,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        media_store[file_id] = media_item
        return UploadResponse(success=True, media=media_item)
    
    except Exception as e:
        return UploadResponse(success=False, error=str(e))


@router.post("/url", response_model=UploadResponse)
async def add_url_media(request: UrlMediaRequest):
    """Add media from external URL"""
    try:
        file_id = str(uuid.uuid4())
        
        # Guess type from URL
        mime_type = mimetypes.guess_type(request.url)[0] or "application/octet-stream"
        media_type = get_media_type(mime_type)
        
        media_item = MediaItem(
            id=file_id,
            app_id=request.app_id,
            type=media_type,
            name=request.name or request.url.split("/")[-1],
            url=request.url,
            thumbnail_url=request.url if media_type == MediaType.IMAGE else None,
            mime_type=mime_type,
            folder_id=request.folder_id,
            metadata={"source": "external_url"},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        media_store[file_id] = media_item
        return UploadResponse(success=True, media=media_item)
    
    except Exception as e:
        return UploadResponse(success=False, error=str(e))


@router.post("/code", response_model=UploadResponse)
async def add_code_snippet(request: CodeSnippetRequest):
    """Add a code snippet"""
    try:
        file_id = str(uuid.uuid4())
        
        media_item = MediaItem(
            id=file_id,
            app_id=request.app_id,
            type=MediaType.CODE,
            name=request.name,
            url=f"/api/media/code/{file_id}",
            metadata={
                "code": request.code,
                "language": request.language
            },
            folder_id=request.folder_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        media_store[file_id] = media_item
        return UploadResponse(success=True, media=media_item)
    
    except Exception as e:
        return UploadResponse(success=False, error=str(e))


@router.get("", response_model=List[MediaItem])
async def list_media(
    app_id: str,
    type: Optional[MediaType] = None,
    folder_id: Optional[str] = None,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """List media items with filtering"""
    items = [m for m in media_store.values() if m.app_id == app_id]
    
    if type:
        items = [m for m in items if m.type == type]
    
    if folder_id:
        items = [m for m in items if m.folder_id == folder_id]
    elif folder_id is None:
        # Root level items only
        items = [m for m in items if m.folder_id is None]
    
    if search:
        search_lower = search.lower()
        items = [m for m in items if search_lower in m.name.lower()]
    
    if tags:
        tag_list = tags.split(",")
        items = [m for m in items if any(t in m.tags for t in tag_list)]
    
    # Sort by created_at descending
    items.sort(key=lambda x: x.created_at, reverse=True)
    
    # Pagination
    start = (page - 1) * limit
    return items[start:start + limit]


@router.get("/{media_id}", response_model=MediaItem)
async def get_media(media_id: str):
    """Get a single media item"""
    if media_id not in media_store:
        raise HTTPException(status_code=404, detail="Media not found")
    return media_store[media_id]


@router.put("/{media_id}", response_model=MediaItem)
async def update_media(
    media_id: str,
    name: Optional[str] = None,
    alt_text: Optional[str] = None,
    caption: Optional[str] = None,
    folder_id: Optional[str] = None,
    tags: Optional[List[str]] = None
):
    """Update media metadata"""
    if media_id not in media_store:
        raise HTTPException(status_code=404, detail="Media not found")
    
    media = media_store[media_id]
    
    if name:
        media.name = name
    if alt_text is not None:
        media.alt_text = alt_text
    if caption is not None:
        media.caption = caption
    if folder_id is not None:
        media.folder_id = folder_id
    if tags is not None:
        media.tags = tags
    
    media.updated_at = datetime.utcnow()
    media_store[media_id] = media
    
    return media


@router.delete("/{media_id}")
async def delete_media(media_id: str):
    """Delete a media item"""
    if media_id not in media_store:
        raise HTTPException(status_code=404, detail="Media not found")
    
    del media_store[media_id]
    return {"success": True}


# Folder management
@router.post("/folders", response_model=MediaFolder)
async def create_folder(
    app_id: str,
    name: str,
    parent_id: Optional[str] = None
):
    """Create a media folder"""
    folder_id = str(uuid.uuid4())
    folder = MediaFolder(
        id=folder_id,
        app_id=app_id,
        name=name,
        parent_id=parent_id,
        created_at=datetime.utcnow()
    )
    folder_store[folder_id] = folder
    return folder


@router.get("/folders", response_model=List[MediaFolder])
async def list_folders(app_id: str, parent_id: Optional[str] = None):
    """List folders"""
    folders = [f for f in folder_store.values() if f.app_id == app_id]
    if parent_id:
        folders = [f for f in folders if f.parent_id == parent_id]
    else:
        folders = [f for f in folders if f.parent_id is None]
    return folders


@router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str):
    """Delete a folder (moves contents to parent)"""
    if folder_id not in folder_store:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    folder = folder_store[folder_id]
    
    # Move media to parent folder
    for media in media_store.values():
        if media.folder_id == folder_id:
            media.folder_id = folder.parent_id
    
    del folder_store[folder_id]
    return {"success": True}
