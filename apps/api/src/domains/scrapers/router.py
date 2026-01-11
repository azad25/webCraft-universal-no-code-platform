"""
Scrapers domain router
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Optional

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.models import User
from src.common.exceptions import NotFoundError, ValidationError
from .service import ScraperService
from .schemas import (
    ScraperCreate, ScraperUpdate, ScraperResponse,
    ScraperResultResponse, ScraperDataResponse, ScraperPreviewResponse
)

router = APIRouter(prefix="/apps/{app_id}/scrapers", tags=["Scrapers"])


@router.post("")
async def create_scraper(
    app_id: str,
    data: ScraperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new web scraper"""
    service = ScraperService(db)
    scraper = service.create_scraper(app_id, data)
    
    return {
        "id": str(scraper.id),
        "name": scraper.name,
        "description": scraper.description,
        "url": scraper.url,
        "status": scraper.status,
        "created_at": scraper.created_at.isoformat()
    }


@router.get("")
async def list_scrapers(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all scrapers for an app"""
    service = ScraperService(db)
    scrapers = service.list_scrapers(app_id)
    
    return {
        "scrapers": [
            {
                "id": str(s.id),
                "name": s.name,
                "description": s.description,
                "url": s.url,
                "status": s.status,
                "last_run": s.last_run.isoformat() if s.last_run else None,
                "run_count": s.run_count,
                "schedule": s.schedule,
                "is_scheduled": s.is_scheduled,
                "created_at": s.created_at.isoformat()
            }
            for s in scrapers
        ],
        "total": len(scrapers)
    }


@router.get("/{scraper_id}")
async def get_scraper(
    app_id: str,
    scraper_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific scraper with configuration"""
    try:
        service = ScraperService(db)
        scraper = service.get_scraper(scraper_id)
        
        return {
            "id": str(scraper.id),
            "name": scraper.name,
            "description": scraper.description,
            "url": scraper.url,
            "fields": scraper.fields,
            "item_selector": scraper.item_selector,
            "pagination_config": scraper.pagination_config,
            "headers": scraper.headers,
            "cookies": scraper.cookies,
            "delay_ms": scraper.delay_ms,
            "max_pages": scraper.max_pages,
            "timeout": scraper.timeout,
            "user_agent": scraper.user_agent,
            "respect_robots": scraper.respect_robots,
            "cache_ttl": scraper.cache_ttl,
            "schedule": scraper.schedule,
            "is_scheduled": scraper.is_scheduled,
            "status": scraper.status,
            "last_run": scraper.last_run.isoformat() if scraper.last_run else None,
            "last_error": scraper.last_error,
            "run_count": scraper.run_count,
            "created_at": scraper.created_at.isoformat()
        }
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Scraper not found")


@router.put("/{scraper_id}")
async def update_scraper(
    app_id: str,
    scraper_id: str,
    data: ScraperUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a scraper"""
    try:
        service = ScraperService(db)
        scraper = service.update_scraper(scraper_id, data)
        return {"success": True, "id": str(scraper.id)}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Scraper not found")


@router.delete("/{scraper_id}")
async def delete_scraper(
    app_id: str,
    scraper_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a scraper"""
    try:
        service = ScraperService(db)
        service.delete_scraper(scraper_id)
        return {"success": True}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Scraper not found")


@router.post("/{scraper_id}/run")
async def run_scraper(
    app_id: str,
    scraper_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run a scraper (async)"""
    try:
        service = ScraperService(db)
        
        # Run scraper in background
        async def run_scraper_task():
            try:
                await service.run_scraper(scraper_id)
            except Exception as e:
                print(f"Background scraper task failed: {e}")
        
        background_tasks.add_task(run_scraper_task)
        
        return {"status": "started", "scraper_id": scraper_id}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Scraper not found")
    except ValidationError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/{scraper_id}/status")
async def get_scraper_status(
    app_id: str,
    scraper_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get scraper status"""
    try:
        service = ScraperService(db)
        scraper = service.get_scraper(scraper_id)
        
        return {
            "scraper_id": scraper_id,
            "status": scraper.status,
            "last_run": scraper.last_run.isoformat() if scraper.last_run else None,
            "last_error": scraper.last_error,
            "run_count": scraper.run_count
        }
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Scraper not found")


@router.get("/{scraper_id}/data")
async def get_scraper_data(
    app_id: str,
    scraper_id: str,
    use_cache: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get latest scraped data"""
    try:
        service = ScraperService(db)
        result = await service.get_scraper_data(scraper_id, use_cache)
        return result
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Scraper not found or no data available")


@router.post("/preview")
async def preview_scraper(
    data: ScraperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Preview scraper results without saving"""
    service = ScraperService(db)
    result = await service.preview_scraper(data)
    return result