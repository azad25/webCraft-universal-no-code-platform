"""
Preview domain router
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import io

from src.core.database import get_db
from src.core.security import get_current_user, get_current_user_optional
from src.domains.auth.models import User
from src.domains.apps.models import App
from src.domains.pages.models import Page
from .service import PreviewService
from .schemas import PreviewCreate, PreviewResponse, PreviewDataResponse

router = APIRouter(prefix="/preview", tags=["Preview"])


@router.post("/apps/{app_id}")
async def create_preview(
    app_id: str,
    data: PreviewCreate = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a preview URL for an app"""
    # Verify app ownership
    app = db.query(App).filter(
        App.id == uuid.UUID(app_id),
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    preview_service = PreviewService(db)
    device = data.device if data else "desktop"
    
    try:
        preview_data = await preview_service.create_preview_url(app, device)
        return preview_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create preview: {str(e)}")


@router.get("/{token}")
async def get_preview(
    token: str,
    device: Optional[str] = Query("desktop"),
    db: Session = Depends(get_db)
):
    """Access app preview by token"""
    preview_service = PreviewService(db)
    
    # Validate token
    preview_data = await preview_service.get_preview_data(token)
    if not preview_data:
        raise HTTPException(status_code=404, detail="Preview not found or expired")
    
    # Get app data
    app = db.query(App).filter(App.id == uuid.UUID(preview_data["app_id"])).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Load app pages
    pages = db.query(Page).filter(Page.app_id == app.id).all()
    
    return {
        "app": {
            "id": str(app.id),
            "name": app.name,
            "slug": app.slug,
            "app_type": app.app_type,
            "config": app.config,
            "theme_config": app.theme_config,
            "seo_config": app.seo_config
        },
        "preview": {
            "token": token,
            "device": device,
            "expires_at": preview_data["expires_at"]
        },
        "pages": [
            {
                "id": str(page.id),
                "title": page.title,
                "slug": page.slug,
                "content": page.content,
                "is_homepage": page.is_homepage,
                "meta_title": page.meta_title,
                "meta_description": page.meta_description
            }
            for page in pages
        ]
    }


@router.get("/{token}/embed")
async def get_preview_embed(
    token: str,
    device: Optional[str] = Query("desktop"),
    db: Session = Depends(get_db)
):
    """Get embeddable preview (for iframe)"""
    preview_service = PreviewService(db)
    
    # Validate token
    preview_data = await preview_service.get_preview_data(token)
    if not preview_data:
        raise HTTPException(status_code=404, detail="Preview not found or expired")
    
    # Get app data
    app = db.query(App).filter(App.id == uuid.UUID(preview_data["app_id"])).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{app.name} - Preview</title>
        <style>
            body {{ margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }}
            .preview-container {{ width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; }}
            .preview-content {{ background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }}
            .device-frame {{ border: 2px solid #ddd; border-radius: 12px; padding: 1rem; margin: 1rem 0; }}
            .mobile {{ max-width: 375px; }}
            .tablet {{ max-width: 768px; }}
            .desktop {{ max-width: 1200px; }}
        </style>
    </head>
    <body>
        <div class="preview-container">
            <div class="preview-content">
                <div class="device-frame {device}">
                    <h1>{app.name}</h1>
                    <p>App Type: {app.app_type}</p>
                    <p>Device: {device.title()}</p>
                    <p><small>Preview Mode - Token: {token[:8]}...</small></p>
                    <div id="app-content">
                        <p>App preview content will be rendered here.</p>
                    </div>
                </div>
            </div>
        </div>
        <script>
            console.log('Preview loaded for app:', '{app.id}');
            console.log('Device type:', '{device}');
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


@router.get("/{token}/qr")
async def get_preview_qr_code(
    token: str,
    size: int = Query(200, ge=100, le=500),
    db: Session = Depends(get_db)
):
    """Generate QR code for mobile preview"""
    preview_service = PreviewService(db)
    
    # Validate token
    preview_data = await preview_service.get_preview_data(token)
    if not preview_data:
        raise HTTPException(status_code=404, detail="Preview not found or expired")
    
    try:
        import qrcode
        
        # Generate mobile preview URL
        mobile_url = f"{preview_service.preview_base_url}/preview/{token}?device=mobile"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(mobile_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img = img.resize((size, size))
        
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        return Response(
            content=img_buffer.getvalue(),
            media_type="image/png",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": f"inline; filename=preview-{token[:8]}-qr.png"
            }
        )
    except ImportError:
        raise HTTPException(status_code=500, detail="QR code generation not available")


@router.get("/apps/{app_id}/sessions")
async def list_preview_sessions(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all active preview sessions for an app"""
    # Verify app ownership
    app = db.query(App).filter(
        App.id == uuid.UUID(app_id),
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    preview_service = PreviewService(db)
    
    try:
        sessions = await preview_service.get_app_preview_sessions(uuid.UUID(app_id))
        return {
            "app_id": app_id,
            "sessions": sessions,
            "total": len(sessions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get preview sessions: {str(e)}")


@router.delete("/{token}")
async def revoke_preview(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revoke a preview session"""
    preview_service = PreviewService(db)
    
    # Validate token and check ownership
    preview_data = await preview_service.get_preview_data(token)
    if not preview_data:
        raise HTTPException(status_code=404, detail="Preview not found")
    
    # Check if user owns the app
    app = db.query(App).filter(
        App.id == uuid.UUID(preview_data["app_id"]),
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=403, detail="Not authorized to revoke this preview")
    
    success = await preview_service.revoke_preview(token)
    
    if success:
        return {"message": "Preview revoked successfully"}
    else:
        raise HTTPException(status_code=404, detail="Preview not found")


@router.get("/{token}/iframe")
async def get_iframe_code(
    token: str,
    width: str = Query("100%"),
    height: str = Query("600px"),
    db: Session = Depends(get_db)
):
    """Get iframe embed code for preview"""
    preview_service = PreviewService(db)
    
    # Validate token
    preview_data = await preview_service.get_preview_data(token)
    if not preview_data:
        raise HTTPException(status_code=404, detail="Preview not found or expired")
    
    iframe_code = preview_service.get_iframe_embed_code(token, width, height)
    
    return {
        "iframe_code": iframe_code,
        "preview_url": f"{preview_service.preview_base_url}/preview/{token}/embed",
        "width": width,
        "height": height
    }
