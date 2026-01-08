"""
Preview API Routes
Handles app preview functionality for development and production
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, Response
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import qrcode
import io
import base64

from core.database import get_db, App, User
from core.auth import get_current_user, get_current_user_optional
from services.preview_service import PreviewService

router = APIRouter()


@router.post("/apps/{app_id}/preview")
async def create_preview(
    app_id: uuid.UUID = Path(...),
    device: Optional[str] = Query(None, regex="^(mobile|tablet|desktop)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a preview URL for an app
    
    - **app_id**: The app ID to create preview for
    - **device**: Optional device type (mobile, tablet, desktop)
    
    Returns preview URL and metadata including QR code for mobile testing.
    """
    
    # Verify app ownership
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    preview_service = PreviewService(db)
    
    try:
        preview_data = await preview_service.create_preview_url(app, device)
        return preview_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create preview: {str(e)}")


@router.get("/preview/{token}")
async def get_preview(
    token: str = Path(...),
    device: Optional[str] = Query("desktop", regex="^(mobile|tablet|desktop)$"),
    db: Session = Depends(get_db)
):
    """
    Access app preview by token
    
    This endpoint validates the preview token and returns the app data
    for rendering in the preview interface.
    """
    
    preview_service = PreviewService(db)
    
    # Validate token
    preview_data = await preview_service.get_preview_data(token)
    if not preview_data:
        raise HTTPException(status_code=404, detail="Preview not found or expired")
    
    # Get app data
    app = db.query(App).filter(App.id == preview_data["app_id"]).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Load app pages
    from core.database import Page
    pages = db.query(Page).filter(
        Page.app_id == app.id,
        Page.is_published == True
    ).all()
    
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


@router.get("/preview/{token}/embed")
async def get_preview_embed(
    token: str = Path(...),
    device: Optional[str] = Query("desktop"),
    db: Session = Depends(get_db)
):
    """
    Get embeddable preview (for iframe)
    
    Returns a minimal HTML page suitable for iframe embedding.
    """
    
    preview_service = PreviewService(db)
    
    # Validate token
    preview_data = await preview_service.get_preview_data(token)
    if not preview_data:
        raise HTTPException(status_code=404, detail="Preview not found or expired")
    
    # Get app data
    app = db.query(App).filter(App.id == preview_data["app_id"]).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Generate minimal HTML for embedding
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{app.name} - Preview</title>
        <style>
            body {{
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5;
            }}
            .preview-container {{
                width: 100%;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }}
            .preview-content {{
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
            }}
            .device-frame {{
                border: 2px solid #ddd;
                border-radius: 12px;
                padding: 1rem;
                margin: 1rem 0;
            }}
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
                    
                    <!-- App content would be rendered here -->
                    <div id="app-content">
                        <p>App preview content will be rendered here based on the app configuration.</p>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            // App rendering logic would go here
            console.log('Preview loaded for app:', '{app.id}');
            console.log('Device type:', '{device}');
            console.log('App config:', {app.config});
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


@router.get("/preview/{token}/qr")
async def get_preview_qr_code(
    token: str = Path(...),
    size: int = Query(200, ge=100, le=500),
    db: Session = Depends(get_db)
):
    """
    Generate QR code for mobile preview
    
    - **token**: Preview token
    - **size**: QR code size in pixels (100-500)
    
    Returns a PNG image of the QR code for easy mobile access.
    """
    
    preview_service = PreviewService(db)
    
    # Validate token
    preview_data = await preview_service.get_preview_data(token)
    if not preview_data:
        raise HTTPException(status_code=404, detail="Preview not found or expired")
    
    # Generate mobile preview URL
    if preview_service.environment == "development":
        mobile_url = f"http://localhost:3000/preview/{token}?device=mobile"
    else:
        mobile_url = f"https://{preview_service.preview_domain}/preview/{token}?device=mobile"
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(mobile_url)
    qr.make(fit=True)
    
    # Create QR code image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Resize to requested size
    img = img.resize((size, size))
    
    # Convert to bytes
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


@router.get("/apps/{app_id}/preview/sessions")
async def list_preview_sessions(
    app_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all active preview sessions for an app
    
    Returns all currently active preview sessions with their tokens,
    device types, and expiration times.
    """
    
    # Verify app ownership
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    preview_service = PreviewService(db)
    
    try:
        sessions = await preview_service.get_app_preview_sessions(app_id)
        return {
            "app_id": str(app_id),
            "sessions": sessions,
            "total": len(sessions)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get preview sessions: {str(e)}")


@router.delete("/preview/{token}")
async def revoke_preview(
    token: str = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Revoke a preview session
    
    Immediately invalidates the preview token and removes access.
    """
    
    preview_service = PreviewService(db)
    
    # Validate token and check ownership
    preview_data = await preview_service.get_preview_data(token)
    if not preview_data:
        raise HTTPException(status_code=404, detail="Preview not found")
    
    # Check if user owns the app
    app = db.query(App).filter(
        App.id == preview_data["app_id"],
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=403, detail="Not authorized to revoke this preview")
    
    # Revoke the preview
    success = await preview_service.revoke_preview(token)
    
    if success:
        return {"message": "Preview revoked successfully"}
    else:
        raise HTTPException(status_code=404, detail="Preview not found")


@router.get("/preview/{token}/iframe")
async def get_iframe_code(
    token: str = Path(...),
    width: str = Query("100%"),
    height: str = Query("600px"),
    db: Session = Depends(get_db)
):
    """
    Get iframe embed code for preview
    
    - **token**: Preview token
    - **width**: Iframe width (e.g., "100%", "800px")
    - **height**: Iframe height (e.g., "600px", "100vh")
    
    Returns HTML iframe code for embedding the preview.
    """
    
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


@router.post("/preview/cleanup")
async def cleanup_expired_previews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clean up expired preview sessions
    
    Removes expired preview sessions from the database and cache.
    This is typically called by a scheduled job.
    """
    
    # Only allow admin users to run cleanup
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    preview_service = PreviewService(db)
    
    try:
        cleaned_count = await preview_service.cleanup_expired_previews()
        return {
            "message": f"Cleaned up {cleaned_count} expired preview sessions",
            "cleaned_count": cleaned_count
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup previews: {str(e)}")