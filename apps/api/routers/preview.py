"""
Preview API Routes
Manage live preview instances for apps
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

from core.auth import get_current_user
from core.database import get_db, App, User
from sqlalchemy.orm import Session
from services.preview_service import get_preview_service, PreviewStatus

router = APIRouter(prefix="/preview", tags=["Preview"])


class PreviewRequest(BaseModel):
    app_id: str
    pages: Optional[List[Dict[str, Any]]] = None


class PreviewResponse(BaseModel):
    preview_id: str
    app_id: str
    status: str
    url: str
    port: int
    created_at: datetime
    expires_at: datetime
    error_message: Optional[str] = None


@router.post("/start", response_model=PreviewResponse)
async def start_preview(
    request: PreviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start a live preview for an app.
    
    Creates a new preview server on an available port and returns the preview URL.
    Previews automatically expire after 2 hours of inactivity.
    """
    # Get app
    app = db.query(App).filter(
        App.id == request.app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    preview_service = get_preview_service()
    
    # Get app configuration
    app_config = {
        "name": app.name,
        "slug": app.slug,
        "theme": app.config.get("theme", {}),
        "settings": app.config.get("settings", {})
    }
    
    # Get pages from request or app config
    pages = request.pages or app.config.get("pages", [
        {"path": "/", "title": "Home", "widgets": []}
    ])
    
    try:
        preview = await preview_service.create_preview(
            app_id=str(app.id),
            user_id=str(current_user.id),
            app_config=app_config,
            pages=pages
        )
        
        return PreviewResponse(
            preview_id=preview.id,
            app_id=preview.app_id,
            status=preview.status.value,
            url=preview.url,
            port=preview.port,
            created_at=preview.created_at,
            expires_at=preview.expires_at,
            error_message=preview.error_message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start preview: {str(e)}")


@router.post("/stop/{preview_id}")
async def stop_preview(
    preview_id: str = Path(...),
    current_user: User = Depends(get_current_user)
):
    """Stop a running preview"""
    preview_service = get_preview_service()
    
    preview = preview_service.get_preview(preview_id)
    if not preview:
        raise HTTPException(status_code=404, detail="Preview not found")
    
    if preview.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = await preview_service.stop_preview(preview_id)
    
    if success:
        return {"success": True, "message": "Preview stopped"}
    else:
        raise HTTPException(status_code=500, detail="Failed to stop preview")


@router.post("/refresh/{preview_id}", response_model=PreviewResponse)
async def refresh_preview(
    preview_id: str = Path(...),
    pages: Optional[List[Dict[str, Any]]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Refresh a preview with updated content"""
    preview_service = get_preview_service()
    
    preview = preview_service.get_preview(preview_id)
    if not preview:
        raise HTTPException(status_code=404, detail="Preview not found")
    
    if preview.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get app for config
    app = db.query(App).filter(App.id == preview.app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = {
        "name": app.name,
        "slug": app.slug,
        "theme": app.config.get("theme", {}),
        "settings": app.config.get("settings", {})
    }
    
    pages_data = pages or app.config.get("pages", [])
    
    try:
        updated_preview = await preview_service.refresh_preview(
            preview_id=preview_id,
            app_config=app_config,
            pages=pages_data
        )
        
        return PreviewResponse(
            preview_id=updated_preview.id,
            app_id=updated_preview.app_id,
            status=updated_preview.status.value,
            url=updated_preview.url,
            port=updated_preview.port,
            created_at=updated_preview.created_at,
            expires_at=updated_preview.expires_at,
            error_message=updated_preview.error_message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh preview: {str(e)}")


@router.get("/status/{preview_id}", response_model=PreviewResponse)
async def get_preview_status(
    preview_id: str = Path(...),
    current_user: User = Depends(get_current_user)
):
    """Get the status of a preview"""
    preview_service = get_preview_service()
    
    preview = preview_service.get_preview(preview_id)
    if not preview:
        raise HTTPException(status_code=404, detail="Preview not found")
    
    if preview.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return PreviewResponse(
        preview_id=preview.id,
        app_id=preview.app_id,
        status=preview.status.value,
        url=preview.url,
        port=preview.port,
        created_at=preview.created_at,
        expires_at=preview.expires_at,
        error_message=preview.error_message
    )


@router.get("/app/{app_id}", response_model=Optional[PreviewResponse])
async def get_app_preview(
    app_id: str = Path(...),
    current_user: User = Depends(get_current_user)
):
    """Get the active preview for an app (if any)"""
    preview_service = get_preview_service()
    
    preview = preview_service.get_app_preview(app_id, str(current_user.id))
    
    if not preview:
        return None
    
    return PreviewResponse(
        preview_id=preview.id,
        app_id=preview.app_id,
        status=preview.status.value,
        url=preview.url,
        port=preview.port,
        created_at=preview.created_at,
        expires_at=preview.expires_at,
        error_message=preview.error_message
    )


@router.get("/list", response_model=List[PreviewResponse])
async def list_user_previews(
    current_user: User = Depends(get_current_user)
):
    """List all active previews for the current user"""
    preview_service = get_preview_service()
    
    previews = preview_service.get_user_previews(str(current_user.id))
    
    return [
        PreviewResponse(
            preview_id=p.id,
            app_id=p.app_id,
            status=p.status.value,
            url=p.url,
            port=p.port,
            created_at=p.created_at,
            expires_at=p.expires_at,
            error_message=p.error_message
        )
        for p in previews
    ]


@router.get("/stats")
async def get_preview_stats(
    current_user: User = Depends(get_current_user)
):
    """Get preview service statistics (admin only)"""
    # In production, check for admin role
    preview_service = get_preview_service()
    return preview_service.get_stats()


# Quick preview endpoint for editor
@router.post("/quick")
async def quick_preview(
    app_id: str,
    widgets: List[Dict[str, Any]],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a quick preview from editor widgets.
    
    This is optimized for the live editor - it creates a minimal preview
    that updates quickly as the user edits.
    """
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    preview_service = get_preview_service()
    
    # Create a single-page preview with the provided widgets
    pages = [{
        "path": "/",
        "title": "Preview",
        "widgets": widgets
    }]
    
    app_config = {
        "name": f"{app.name} Preview",
        "slug": app.slug,
        "theme": app.config.get("theme", {}),
        "settings": app.config.get("settings", {})
    }
    
    try:
        preview = await preview_service.create_preview(
            app_id=str(app.id),
            user_id=str(current_user.id),
            app_config=app_config,
            pages=pages
        )
        
        return {
            "preview_id": preview.id,
            "url": preview.url,
            "port": preview.port,
            "status": preview.status.value
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create preview: {str(e)}")
