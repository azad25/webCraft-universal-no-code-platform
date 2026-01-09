from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
import shutil
from datetime import datetime
import mimetypes

from core.database import get_db, App, CustomAsset
from core.auth import get_current_user
from modules.custom_assets.schemas import CustomAssetCreate, CustomAssetUpdate, CustomAssetResponse

router = APIRouter(prefix="/apps/{app_id}/assets", tags=["custom-assets"])

# Allowed file types
ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'}
ALLOWED_VIDEO_TYPES = {'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'}
ALLOWED_AUDIO_TYPES = {'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'}

# Maximum file sizes (in bytes)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MAX_AUDIO_SIZE = 50 * 1024 * 1024   # 50MB

@router.get("", response_model=dict)
async def get_custom_assets(
    app_id: str,
    asset_type: Optional[str] = None,
    is_global: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all custom assets for an app"""
    
    # Verify app ownership
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Build query
    query = db.query(CustomAsset).filter(CustomAsset.app_id == app_id)
    
    if asset_type:
        query = query.filter(CustomAsset.type == asset_type)
    
    if is_global is not None:
        query = query.filter(CustomAsset.is_global == is_global)
    
    assets = query.order_by(CustomAsset.created_at.desc()).all()
    
    return {
        "assets": [CustomAssetResponse.from_orm(asset) for asset in assets],
        "total": len(assets)
    }

@router.post("", response_model=CustomAssetResponse)
async def create_custom_asset(
    app_id: str,
    asset_data: CustomAssetCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new custom asset (HTML, CSS, JS)"""
    
    # Verify app ownership
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Validate asset type
    if asset_data.type not in ['html', 'css', 'js']:
        raise HTTPException(status_code=400, detail="Invalid asset type for text assets")
    
    # Create asset
    asset = CustomAsset(
        id=str(uuid.uuid4()),
        app_id=app_id,
        page_id=asset_data.page_id,
        name=asset_data.name,
        type=asset_data.type,
        content=asset_data.content,
        is_global=asset_data.is_global,
        metadata=asset_data.metadata or {},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(asset)
    db.commit()
    db.refresh(asset)
    
    return CustomAssetResponse.from_orm(asset)

@router.put("/{asset_id}", response_model=CustomAssetResponse)
async def update_custom_asset(
    app_id: str,
    asset_id: str,
    asset_data: CustomAssetUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a custom asset"""
    
    # Verify app ownership
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Get asset
    asset = db.query(CustomAsset).filter(
        CustomAsset.id == asset_id,
        CustomAsset.app_id == app_id
    ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Update fields
    update_data = asset_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
    
    asset.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(asset)
    
    return CustomAssetResponse.from_orm(asset)

@router.delete("/{asset_id}")
async def delete_custom_asset(
    app_id: str,
    asset_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a custom asset"""
    
    # Verify app ownership
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Get asset
    asset = db.query(CustomAsset).filter(
        CustomAsset.id == asset_id,
        CustomAsset.app_id == app_id
    ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Delete file if it exists
    if asset.url and asset.type in ['image', 'video', 'audio']:
        try:
            # Extract filename from URL and delete from uploads directory
            filename = asset.url.split('/')[-1]
            file_path = f"uploads/{app_id}/{filename}"
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Failed to delete file: {e}")
    
    db.delete(asset)
    db.commit()
    
    return {"message": "Asset deleted successfully"}

@router.post("/upload", response_model=CustomAssetResponse)
async def upload_media_asset(
    app_id: str,
    file: UploadFile = File(...),
    asset_type: str = Form(...),
    page_id: Optional[str] = Form(None),
    is_global: bool = Form(False),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload a media file (image, video, audio)"""
    
    # Verify app ownership
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Validate file type and size
    content_type = file.content_type or mimetypes.guess_type(file.filename)[0]
    
    if asset_type == 'image':
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid image file type")
        max_size = MAX_IMAGE_SIZE
    elif asset_type == 'video':
        if content_type not in ALLOWED_VIDEO_TYPES:
            raise HTTPException(status_code=400, detail="Invalid video file type")
        max_size = MAX_VIDEO_SIZE
    elif asset_type == 'audio':
        if content_type not in ALLOWED_AUDIO_TYPES:
            raise HTTPException(status_code=400, detail="Invalid audio file type")
        max_size = MAX_AUDIO_SIZE
    else:
        raise HTTPException(status_code=400, detail="Invalid asset type")
    
    # Check file size
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {max_size // 1024 // 1024}MB")
    
    # Create upload directory
    upload_dir = f"uploads/{app_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Get file metadata
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
    
    # Create asset record
    asset = CustomAsset(
        id=str(uuid.uuid4()),
        app_id=app_id,
        page_id=page_id,
        name=os.path.splitext(file.filename)[0],
        type=asset_type,
        url=f"/uploads/{app_id}/{unique_filename}",
        size=len(file_content),
        is_global=is_global,
        metadata=metadata,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(asset)
    db.commit()
    db.refresh(asset)
    
    return CustomAssetResponse.from_orm(asset)

@router.get("/{asset_id}", response_model=CustomAssetResponse)
async def get_custom_asset(
    app_id: str,
    asset_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific custom asset"""
    
    # Verify app ownership
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Get asset
    asset = db.query(CustomAsset).filter(
        CustomAsset.id == asset_id,
        CustomAsset.app_id == app_id
    ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return CustomAssetResponse.from_orm(asset)