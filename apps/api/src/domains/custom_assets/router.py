"""Custom Assets domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.apps.models import App
from src.domains.auth.schemas import UserResponse
from .service import CustomAssetsService
from .schemas import CustomAssetCreate, CustomAssetUpdate

router = APIRouter(prefix="/apps/{app_id}/assets")


async def get_app_or_404(app_id: str, user_id: str, db: Session) -> App:
    try:
        app_uuid = uuid.UUID(app_id)
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    app = db.query(App).filter(App.id == app_uuid, App.owner_id == user_uuid).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.get("")
async def get_custom_assets(
    app_id: str = Path(...),
    asset_type: Optional[str] = Query(None),
    is_global: Optional[bool] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all custom assets for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CustomAssetsService(db)
    return await service.list_assets(app_id, asset_type, is_global)


@router.post("")
async def create_custom_asset(
    app_id: str = Path(...),
    asset_data: CustomAssetCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new custom asset (HTML, CSS, JS)"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    if asset_data.type not in ['html', 'css', 'js']:
        raise HTTPException(status_code=400, detail="Invalid asset type for text assets")
    
    service = CustomAssetsService(db)
    return await service.create_asset(app_id, asset_data.dict())


@router.put("/{asset_id}")
async def update_custom_asset(
    app_id: str = Path(...),
    asset_id: str = Path(...),
    asset_data: CustomAssetUpdate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a custom asset"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CustomAssetsService(db)
    asset = await service.update_asset(app_id, asset_id, asset_data.dict(exclude_unset=True))
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.delete("/{asset_id}")
async def delete_custom_asset(
    app_id: str = Path(...),
    asset_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a custom asset"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CustomAssetsService(db)
    if not await service.delete_asset(app_id, asset_id):
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted successfully"}


@router.post("/upload")
async def upload_media_asset(
    app_id: str = Path(...),
    file: UploadFile = File(...),
    asset_type: str = Form(...),
    page_id: Optional[str] = Form(None),
    is_global: bool = Form(False),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a media file (image, video, audio)"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    if asset_type not in ['image', 'video', 'audio']:
        raise HTTPException(status_code=400, detail="Invalid asset type")
    
    service = CustomAssetsService(db)
    result = await service.upload_media(app_id, file, asset_type, page_id, is_global)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/{asset_id}")
async def get_custom_asset(
    app_id: str = Path(...),
    asset_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific custom asset"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CustomAssetsService(db)
    asset = await service.get_asset(app_id, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset
