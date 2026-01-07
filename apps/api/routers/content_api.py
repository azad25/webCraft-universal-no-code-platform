"""
Content API for AI Crawlers and Headless Usage
Provides clean, structured content for AI systems
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from core.database import get_db, App, Page

router = APIRouter()


@router.get("/apps/{app_slug}")
async def get_app_content(
    app_slug: str = Path(...),
    format: str = Query("json", description="Output format: json, markdown, text"),
    db: Session = Depends(get_db)
):
    """
    Get app content in AI-friendly format
    
    Returns structured content optimized for AI crawlers and LLMs.
    """
    
    app = db.query(App).filter(
        App.slug == app_slug,
        App.is_published == True
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    content = {
        "name": app.name,
        "description": app.description,
        "type": app.app_type,
        "url": f"https://{app.subdomain}.webcraft.dev" if app.subdomain else None,
        "seo": {
            "title": app.seo_config.get("meta_title"),
            "description": app.seo_config.get("meta_description"),
            "keywords": app.seo_config.get("meta_keywords", [])
        },
        "pages": []
    }
    
    for page in app.pages:
        if page.is_published:
            page_content = {
                "title": page.title,
                "slug": page.slug,
                "description": page.meta_description,
                "content": _extract_text_content(page.content)
            }
            content["pages"].append(page_content)
    
    if format == "markdown":
        return PlainTextResponse(_to_markdown(content), media_type="text/markdown")
    elif format == "text":
        return PlainTextResponse(_to_plain_text(content), media_type="text/plain")
    
    return content


@router.get("/apps/{app_slug}/pages/{page_slug}")
async def get_page_content(
    app_slug: str = Path(...),
    page_slug: str = Path(...),
    format: str = Query("json"),
    db: Session = Depends(get_db)
):
    """Get specific page content"""
    
    app = db.query(App).filter(
        App.slug == app_slug,
        App.is_published == True
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    page = db.query(Page).filter(
        Page.app_id == app.id,
        Page.slug == page_slug,
        Page.is_published == True
    ).first()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    content = {
        "title": page.title,
        "slug": page.slug,
        "description": page.meta_description,
        "content": _extract_text_content(page.content),
        "structured_content": page.content
    }
    
    if format == "markdown":
        return PlainTextResponse(_page_to_markdown(content), media_type="text/markdown")
    
    return content


@router.get("/apps/{app_slug}/structured-data")
async def get_structured_data(
    app_slug: str = Path(...),
    db: Session = Depends(get_db)
):
    """Get JSON-LD structured data for an app"""
    
    app = db.query(App).filter(
        App.slug == app_slug,
        App.is_published == True
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    return app.seo_config.get("structured_data", {})


@router.get("/apps/{app_slug}/sitemap.xml")
async def get_sitemap(
    app_slug: str = Path(...),
    db: Session = Depends(get_db)
):
    """Get XML sitemap"""
    
    from services.seo_service import SEOService
    
    app = db.query(App).filter(
        App.slug == app_slug,
        App.is_published == True
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    seo_service = SEOService(db)
    sitemap = await seo_service.generate_sitemap(app)
    
    return PlainTextResponse(sitemap, media_type="application/xml")


@router.get("/apps/{app_slug}/robots.txt")
async def get_robots(
    app_slug: str = Path(...),
    db: Session = Depends(get_db)
):
    """Get robots.txt"""
    
    from services.seo_service import SEOService
    
    app = db.query(App).filter(
        App.slug == app_slug,
        App.is_published == True
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    seo_service = SEOService(db)
    robots = await seo_service.generate_robots_txt(app)
    
    return PlainTextResponse(robots, media_type="text/plain")


def _extract_text_content(content: dict) -> str:
    """Extract plain text from page content structure"""
    if not content:
        return ""
    
    texts = []
    elements = content.get("elements", [])
    
    for element in elements:
        if isinstance(element, dict):
            props = element.get("props", {})
            if "text" in props:
                texts.append(props["text"])
            if "title" in props:
                texts.append(props["title"])
            if "description" in props:
                texts.append(props["description"])
    
    return "\n\n".join(texts)


def _to_markdown(content: dict) -> str:
    """Convert content to Markdown"""
    md = f"# {content['name']}\n\n"
    
    if content.get("description"):
        md += f"{content['description']}\n\n"
    
    for page in content.get("pages", []):
        md += f"## {page['title']}\n\n"
        if page.get("description"):
            md += f"*{page['description']}*\n\n"
        if page.get("content"):
            md += f"{page['content']}\n\n"
    
    return md


def _to_plain_text(content: dict) -> str:
    """Convert content to plain text"""
    text = f"{content['name']}\n{'=' * len(content['name'])}\n\n"
    
    if content.get("description"):
        text += f"{content['description']}\n\n"
    
    for page in content.get("pages", []):
        text += f"{page['title']}\n{'-' * len(page['title'])}\n"
        if page.get("content"):
            text += f"{page['content']}\n\n"
    
    return text


def _page_to_markdown(content: dict) -> str:
    """Convert page content to Markdown"""
    md = f"# {content['title']}\n\n"
    
    if content.get("description"):
        md += f"*{content['description']}*\n\n"
    
    if content.get("content"):
        md += content["content"]
    
    return md
