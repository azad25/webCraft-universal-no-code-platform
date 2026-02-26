"""
Media domain router
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from typing import List, Optional
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.schemas import UserResponse
from .service import MediaService, MediaFolderService
from .schemas import (
    MediaItemResponse, MediaFolderResponse, UploadResponse,
    EmbedRequest, CodeSnippetRequest, UrlMediaRequest,
    MediaListParams, MediaType, MediaFolderCreate
)

router = APIRouter(prefix="/apps/{app_id}/media", tags=["Media"])


def get_media_service(db: Session = Depends(get_db)) -> MediaService:
    return MediaService(db)


def get_folder_service(db: Session = Depends(get_db)) -> MediaFolderService:
    return MediaFolderService(db)


@router.post("/upload", response_model=UploadResponse)
async def upload_media(
    app_id: str,
    file: UploadFile = File(...),
    folder_id: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # Comma-separated
    current_user: UserResponse = Depends(get_current_user),
    service: MediaService = Depends(get_media_service)
):
    """Upload a file (image, video, document) - integrated with Storage"""
    try:
        tag_list = tags.split(",") if tags else []
        media = await service.upload_file(
            app_id=app_id,
            file=file,
            folder_id=folder_id,
            alt_text=alt_text,
            tags=tag_list,
            user_id=str(current_user.id)  # Pass user_id for storage integration
        )
        return UploadResponse(success=True, media=media)
    except Exception as e:
        return UploadResponse(success=False, error=str(e))


@router.post("/upload/batch", response_model=List[UploadResponse])
async def upload_batch(
    app_id: str,
    files: List[UploadFile] = File(...),
    folder_id: Optional[str] = Form(None),
    service: MediaService = Depends(get_media_service)
):
    """Upload multiple files at once"""
    results = []
    for file in files:
        try:
            media = await service.upload_file(
                app_id=app_id,
                file=file,
                folder_id=folder_id
            )
            results.append(UploadResponse(success=True, media=media))
        except Exception as e:
            results.append(UploadResponse(success=False, error=str(e)))
    return results


@router.post("/embed", response_model=UploadResponse)
async def add_embed(
    request: EmbedRequest,
    service: MediaService = Depends(get_media_service)
):
    """Add an embed (YouTube, Vimeo, Google Drive, etc.)"""
    try:
        media = service.add_embed(request)
        return UploadResponse(success=True, media=media)
    except Exception as e:
        return UploadResponse(success=False, error=str(e))


@router.post("/url", response_model=UploadResponse)
async def add_url_media(
    request: UrlMediaRequest,
    service: MediaService = Depends(get_media_service)
):
    """Add media from external URL"""
    try:
        media = service.add_url_media(request)
        return UploadResponse(success=True, media=media)
    except Exception as e:
        return UploadResponse(success=False, error=str(e))


@router.post("/code", response_model=UploadResponse)
async def add_code_snippet(
    request: CodeSnippetRequest,
    service: MediaService = Depends(get_media_service)
):
    """Add a code snippet"""
    try:
        media = service.add_code_snippet(request)
        return UploadResponse(success=True, media=media)
    except Exception as e:
        return UploadResponse(success=False, error=str(e))


@router.get("", response_model=List[MediaItemResponse])
async def list_media(
    app_id: str,
    type: Optional[MediaType] = None,
    folder_id: Optional[str] = None,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    service: MediaService = Depends(get_media_service)
):
    """List media items with filtering"""
    params = MediaListParams(
        type=type,
        folder_id=folder_id,
        search=search,
        tags=tags,
        page=page,
        limit=limit
    )
    return service.list_media(app_id, params)


@router.get("/{media_id}", response_model=MediaItemResponse)
async def get_media(
    app_id: str,
    media_id: str,
    service: MediaService = Depends(get_media_service)
):
    """Get a single media item"""
    media = service.get_by_app_id(app_id, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media


@router.put("/{media_id}", response_model=MediaItemResponse)
async def update_media(
    app_id: str,
    media_id: str,
    name: Optional[str] = None,
    alt_text: Optional[str] = None,
    caption: Optional[str] = None,
    folder_id: Optional[str] = None,
    tags: Optional[List[str]] = None,
    service: MediaService = Depends(get_media_service)
):
    """Update media metadata"""
    media = service.get_by_app_id(app_id, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if alt_text is not None:
        update_data["alt_text"] = alt_text
    if caption is not None:
        update_data["caption"] = caption
    if folder_id is not None:
        update_data["folder_id"] = folder_id
    if tags is not None:
        update_data["tags"] = tags
    
    updated_media = service.update(media_id, update_data)
    return MediaItemResponse.model_validate(updated_media)


@router.delete("/{media_id}")
async def delete_media(
    app_id: str,
    media_id: str,
    service: MediaService = Depends(get_media_service)
):
    """Delete a media item"""
    media = service.get_by_app_id(app_id, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    service.delete(media_id)
    return {"success": True}


# Storage integration endpoints
@router.post("/import-from-storage", response_model=UploadResponse)
async def import_from_storage(
    app_id: str,
    storage_file_id: str,
    folder_id: Optional[str] = None,
    alt_text: Optional[str] = None,
    tags: Optional[List[str]] = None,
    current_user: UserResponse = Depends(get_current_user),
    service: MediaService = Depends(get_media_service)
):
    """Import a file from Storage into Media library"""
    try:
        media = await service.import_from_storage(
            app_id=app_id,
            storage_file_id=storage_file_id,
            user_id=str(current_user.id),
            folder_id=folder_id,
            alt_text=alt_text,
            tags=tags or []
        )
        return UploadResponse(success=True, media=media)
    except Exception as e:
        return UploadResponse(success=False, error=str(e))


@router.get("/storage-files")
async def list_storage_files(
    app_id: str,
    mime_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    service: MediaService = Depends(get_media_service)
):
    """List available storage files for import"""
    try:
        return await service.list_storage_files(
            user_id=str(current_user.id),
            mime_type_filter=mime_type,
            page=page,
            per_page=per_page
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Folder management
@router.post("/folders", response_model=MediaFolderResponse)
async def create_folder(
    app_id: str,
    name: str,
    parent_id: Optional[str] = None,
    service: MediaFolderService = Depends(get_folder_service)
):
    """Create a media folder"""
    folder_data = MediaFolderCreate(
        app_id=app_id,
        name=name,
        parent_id=parent_id
    )
    folder = service.create(folder_data)
    return MediaFolderResponse.model_validate(folder)


@router.get("/folders", response_model=List[MediaFolderResponse])
async def list_folders(
    app_id: str,
    parent_id: Optional[str] = None,
    service: MediaFolderService = Depends(get_folder_service)
):
    """List folders"""
    return service.list_folders(app_id, parent_id)


@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: str,
    service: MediaFolderService = Depends(get_folder_service)
):
    """Delete a folder (moves contents to parent)"""
    success = service.delete_folder(folder_id)
    if not success:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"success": True}