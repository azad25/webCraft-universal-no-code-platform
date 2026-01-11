"""Content API domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from src.core.database import get_db
from .service import ContentAPIService

router = APIRouter(prefix="/content")


@router.get("/apps/{app_slug}")
async def get_app_content(
    app_slug: str = Path(...),
    format: str = Query("json", description="Output format: json, markdown, text"),
    db: Session = Depends(get_db)
):
    """Get app content in AI-friendly format"""
    service = ContentAPIService(db)
    content = await service.get_app_content(app_slug)
    
    if not content:
        raise HTTPException(status_code=404, detail="App not found")
    
    if format == "markdown":
        return PlainTextResponse(service.to_markdown(content), media_type="text/markdown")
    elif format == "text":
        return PlainTextResponse(service.to_plain_text(content), media_type="text/plain")
    
    return content


@router.get("/apps/{app_slug}/pages/{page_slug}")
async def get_page_content(
    app_slug: str = Path(...),
    page_slug: str = Path(...),
    format: str = Query("json"),
    db: Session = Depends(get_db)
):
    """Get specific page content"""
    service = ContentAPIService(db)
    content = await service.get_page_content(app_slug, page_slug)
    
    if not content:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if format == "markdown":
        md = f"# {content['title']}\n\n"
        if content.get("description"):
            md += f"*{content['description']}*\n\n"
        if content.get("content"):
            md += content["content"]
        return PlainTextResponse(md, media_type="text/markdown")
    
    return content


@router.get("/apps/{app_slug}/structured-data")
async def get_structured_data(
    app_slug: str = Path(...),
    db: Session = Depends(get_db)
):
    """Get JSON-LD structured data for an app"""
    service = ContentAPIService(db)
    return await service.get_structured_data(app_slug)
