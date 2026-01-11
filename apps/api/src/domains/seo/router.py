"""
SEO domain router
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.models import User
from src.domains.apps.models import App
from .service import SEOService
from .schemas import (
    SEOConfigUpdate, SEOAnalysisRequest, SEOAnalysisResponse,
    SitemapResponse, RobotsResponse, StructuredDataResponse
)

router = APIRouter(prefix="/seo", tags=["SEO"])


@router.get("/apps/{app_id}/config")
async def get_seo_config(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get SEO configuration for an app"""
    # Verify ownership
    app = db.query(App).filter(
        App.id == uuid.UUID(app_id),
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = SEOService(db)
    config = service.get_seo_config(app_id)
    
    return {
        "app_id": app_id,
        "config": config
    }


@router.put("/apps/{app_id}/config")
async def update_seo_config(
    app_id: str,
    data: SEOConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update SEO configuration for an app"""
    # Verify ownership
    app = db.query(App).filter(
        App.id == uuid.UUID(app_id),
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = SEOService(db)
    config = service.update_seo_config(app_id, data.model_dump(exclude_unset=True))
    
    return {
        "app_id": app_id,
        "config": config,
        "updated_at": datetime.utcnow().isoformat()
    }


@router.post("/analyze")
async def analyze_content(
    data: SEOAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze content for SEO optimization"""
    service = SEOService(db)
    result = service.analyze_content(data.content, data.target_keywords)
    
    return result


@router.get("/apps/{app_id}/sitemap.xml")
async def get_sitemap(
    app_id: str,
    db: Session = Depends(get_db)
):
    """Generate XML sitemap for an app"""
    app = db.query(App).filter(App.id == uuid.UUID(app_id)).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Determine base URL
    if app.custom_domain:
        base_url = f"https://{app.custom_domain}"
    elif app.subdomain:
        base_url = f"https://{app.subdomain}.webcraft.dev"
    else:
        base_url = f"https://{app.slug}.webcraft.dev"
    
    service = SEOService(db)
    sitemap = service.generate_sitemap(app_id, base_url)
    
    return Response(
        content=sitemap,
        media_type="application/xml",
        headers={"Content-Disposition": "inline; filename=sitemap.xml"}
    )


@router.get("/apps/{app_id}/robots.txt")
async def get_robots_txt(
    app_id: str,
    db: Session = Depends(get_db)
):
    """Generate robots.txt for an app"""
    app = db.query(App).filter(App.id == uuid.UUID(app_id)).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Determine base URL
    if app.custom_domain:
        base_url = f"https://{app.custom_domain}"
    elif app.subdomain:
        base_url = f"https://{app.subdomain}.webcraft.dev"
    else:
        base_url = f"https://{app.slug}.webcraft.dev"
    
    service = SEOService(db)
    robots = service.generate_robots_txt(app_id, base_url)
    
    return Response(
        content=robots,
        media_type="text/plain",
        headers={"Content-Disposition": "inline; filename=robots.txt"}
    )


@router.get("/apps/{app_id}/structured-data")
async def get_structured_data(
    app_id: str,
    data_type: str = Query("WebSite"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate JSON-LD structured data"""
    # Verify ownership
    app = db.query(App).filter(
        App.id == uuid.UUID(app_id),
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = SEOService(db)
    data = service.generate_structured_data(app_id, data_type)
    
    return {
        "type": data_type,
        "data": data
    }


@router.get("/apps/{app_id}/meta-tags")
async def get_meta_tags(
    app_id: str,
    page_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get meta tags for an app or page"""
    # Verify ownership
    app = db.query(App).filter(
        App.id == uuid.UUID(app_id),
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = SEOService(db)
    meta_tags = service.get_meta_tags(app_id, page_id)
    
    return {
        "app_id": app_id,
        "page_id": page_id,
        "meta_tags": meta_tags
    }


@router.post("/apps/{app_id}/audit")
async def run_seo_audit(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run a comprehensive SEO audit for an app"""
    # Verify ownership
    app = db.query(App).filter(
        App.id == uuid.UUID(app_id),
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    issues = []
    suggestions = []
    score = 100
    
    seo_config = app.seo_config or {}
    
    # Check meta title
    if not seo_config.get("meta_title"):
        issues.append({
            "type": "missing_meta_title",
            "severity": "error",
            "message": "Meta title is missing"
        })
        score -= 15
    elif len(seo_config.get("meta_title", "")) > 60:
        issues.append({
            "type": "meta_title_too_long",
            "severity": "warning",
            "message": "Meta title is too long (over 60 characters)"
        })
        score -= 5
    
    # Check meta description
    if not seo_config.get("meta_description"):
        issues.append({
            "type": "missing_meta_description",
            "severity": "error",
            "message": "Meta description is missing"
        })
        score -= 15
    elif len(seo_config.get("meta_description", "")) > 160:
        issues.append({
            "type": "meta_description_too_long",
            "severity": "warning",
            "message": "Meta description is too long (over 160 characters)"
        })
        score -= 5
    
    # Check Open Graph
    if not seo_config.get("og_title"):
        issues.append({
            "type": "missing_og_title",
            "severity": "info",
            "message": "Open Graph title is missing"
        })
        suggestions.append("Add Open Graph title for better social sharing")
        score -= 3
    
    if not seo_config.get("og_image"):
        issues.append({
            "type": "missing_og_image",
            "severity": "info",
            "message": "Open Graph image is missing"
        })
        suggestions.append("Add an Open Graph image for better social sharing")
        score -= 3
    
    # Check Twitter Card
    if not seo_config.get("twitter_card"):
        suggestions.append("Add Twitter Card meta tags for better Twitter sharing")
    
    score = max(0, score)
    
    return {
        "app_id": app_id,
        "score": score,
        "issues": issues,
        "suggestions": suggestions,
        "audit_date": datetime.utcnow().isoformat()
    }
