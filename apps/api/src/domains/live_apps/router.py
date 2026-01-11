"""Live Apps domain router"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Optional

from src.core.database import get_db
from .service import LiveAppsService

router = APIRouter(prefix="/live")


@router.get("/app/{app_slug}", response_class=HTMLResponse)
@router.get("/app/{app_slug}/{page_slug}", response_class=HTMLResponse)
async def serve_live_app(
    request: Request,
    app_slug: str,
    page_slug: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Serve a live deployed app"""
    service = LiveAppsService(db)
    result = await service.get_live_app(app_slug, page_slug)
    
    if not result:
        raise HTTPException(status_code=404, detail="App not found or not published")
    
    base_url = str(request.base_url).rstrip('/')
    html_content = service.generate_html(
        result["app"],
        result["page"],
        result["all_pages"],
        base_url
    )
    
    return HTMLResponse(content=html_content)


@router.get("/api/app/{app_slug}/data")
async def get_live_app_data(
    app_slug: str,
    db: Session = Depends(get_db)
):
    """Get app data for client-side rendering"""
    service = LiveAppsService(db)
    result = await service.get_app_data(app_slug)
    
    if not result:
        raise HTTPException(status_code=404, detail="App not found")
    
    return result
