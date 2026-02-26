"""Storage router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.schemas import UserResponse
from .service import StorageService
from .schemas import (
    StorageFileResponse, StorageFileUpdate,
    StorageFolderCreate, StorageFolderResponse,
    StorageQuotaResponse, StorageStatsResponse,
    BulkDeleteRequest, BulkMoveRequest
)

router = APIRouter(prefix="/storage")


# File endpoints
@router.post("/upload", response_model=StorageFileResponse)
async def upload_file(
    file: UploadFile = File(...),
    folder_path: str = Query("/"),
    is_public: bool = Query(False),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file"""
    service = StorageService(db)
    
    try:
        return await service.upload_file(
            user_id=str(current_user.id),
            file_data=file.file,
            filename=file.filename,
            mime_type=file.content_type,
            folder_path=folder_path,
            is_public=is_public
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Upload failed")


@router.get("/files", response_model=dict)
async def list_files(
    folder_path: Optional[str] = Query(None),
    mime_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's files"""
    service = StorageService(db)
    
    return await service.list_files(
        user_id=str(current_user.id),
        folder_path=folder_path,
        mime_type_filter=mime_type,
        search=search,
        page=page,
        per_page=per_page
    )


@router.get("/files/{file_id}", response_model=StorageFileResponse)
async def get_file(
    file_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file information"""
    service = StorageService(db)
    
    file = await service.get_file(str(file_id), str(current_user.id))
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return file


@router.put("/files/{file_id}", response_model=StorageFileResponse)
async def update_file(
    file_id: uuid.UUID = Path(...),
    updates: StorageFileUpdate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update file metadata"""
    service = StorageService(db)
    
    file = await service.update_file(str(file_id), str(current_user.id), updates)
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return file


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file"""
    service = StorageService(db)
    
    success = await service.delete_file(str(file_id), str(current_user.id))
    
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"message": "File deleted successfully"}


# Folder endpoints
@router.post("/folders", response_model=StorageFolderResponse)
async def create_folder(
    folder_data: StorageFolderCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a folder"""
    service = StorageService(db)
    
    try:
        return await service.create_folder(str(current_user.id), folder_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/folders", response_model=List[StorageFolderResponse])
async def list_folders(
    parent_id: Optional[uuid.UUID] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List folders"""
    service = StorageService(db)
    
    return await service.list_folders(
        str(current_user.id),
        str(parent_id) if parent_id else None
    )


# Quota and stats endpoints
@router.get("/quota", response_model=StorageQuotaResponse)
async def get_storage_quota(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's storage quota"""
    service = StorageService(db)
    
    return await service.get_quota(str(current_user.id))


@router.get("/stats", response_model=StorageStatsResponse)
async def get_storage_stats(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get storage statistics"""
    service = StorageService(db)
    
    return await service.get_storage_stats(str(current_user.id))


# Bulk operations
@router.post("/files/bulk-delete")
async def bulk_delete_files(
    delete_data: BulkDeleteRequest = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete multiple files"""
    service = StorageService(db)
    
    return await service.bulk_delete(str(current_user.id), delete_data)


@router.post("/files/bulk-move")
async def bulk_move_files(
    move_data: BulkMoveRequest = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Move multiple files to a folder"""
    service = StorageService(db)
    
    return await service.bulk_move(str(current_user.id), move_data)