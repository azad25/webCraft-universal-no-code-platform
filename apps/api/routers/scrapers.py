"""
Web Scrapers Router - API endpoints for managing web scrapers
Real implementation with BeautifulSoup scraping
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import uuid
import asyncio
import httpx
from bs4 import BeautifulSoup
import re
import urllib.robotparser

from core.database import (
    get_db, WebScraper, ScraperResult, WidgetDataBinding, App, User
)
from core.auth import get_current_user


router = APIRouter(prefix="/scrapers", tags=["Web Scrapers"])


# ============================================
# PYDANTIC MODELS
# ============================================

class FieldExtractorCreate(BaseModel):
    name: str
    selector: str
    selector_type: str = "css"  # css, xpath, regex
    attribute: Optional[str] = None  # None for text content, or attr name
    multiple: bool = False
    transform: Optional[str] = None  # trim, lowercase, uppercase, number, date
    default: Optional[Any] = None


class PaginationConfig(BaseModel):
    type: str = "none"  # none, next_button, page_param, infinite_scroll
    next_selector: Optional[str] = None
    page_param: Optional[str] = None
    max_pages: int = 10


class ScraperCreate(BaseModel):
    name: str
    description: Optional[str] = None
    url: str
    fields: List[FieldExtractorCreate]
    item_selector: Optional[str] = None  # Selector for repeating items
    pagination_config: Optional[PaginationConfig] = None
    headers: Dict[str, str] = Field(default_factory=dict)
    cookies: Dict[str, str] = Field(default_factory=dict)
    delay_ms: int = 1000
    max_pages: int = 10
    timeout: int = 30
    user_agent: str = "WebCraft-Scraper/1.0 (compatible; +https://webcraft.dev/bot)"
    respect_robots: bool = True
    cache_ttl: int = 3600
    schedule: Optional[str] = None


class ScraperUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    fields: Optional[List[FieldExtractorCreate]] = None
    item_selector: Optional[str] = None
    pagination_config: Optional[PaginationConfig] = None
    headers: Optional[Dict[str, str]] = None
    delay_ms: Optional[int] = None
    max_pages: Optional[int] = None
    timeout: Optional[int] = None
    cache_ttl: Optional[int] = None
    schedule: Optional[str] = None
    is_scheduled: Optional[bool] = None


# ============================================
# SCRAPER CRUD
# ============================================

@router.post("")
async def create_scraper(
    app_id: str = Query(...),
    data: ScraperCreate = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new web scraper"""
    app = db.query(App).filter(App.id == uuid.UUID(app_id), App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    scraper = WebScraper(
        name=data.name,
        description=data.description,
        url=data.url,
        fields=[f.dict() for f in data.fields],
        pagination_config=data.pagination_config.dict() if data.pagination_config else None,
        headers=data.headers,
        cookies=data.cookies,
        delay_ms=data.delay_ms,
        max_pages=data.max_pages,
        timeout=data.timeout,
        user_agent=data.user_agent,
        respect_robots=data.respect_robots,
        cache_ttl=data.cache_ttl,
        schedule=data.schedule,
        is_scheduled=bool(data.schedule),
        app_id=uuid.UUID(app_id)
    )
    db.add(scraper)
    db.commit()
    db.refresh(scraper)
    
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
    app_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all scrapers for an app"""
    scrapers = db.query(WebScraper).filter(
        WebScraper.app_id == uuid.UUID(app_id),
        WebScraper.is_active == True
    ).order_by(WebScraper.created_at.desc()).all()
    
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
    scraper_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific scraper with configuration"""
    scraper = db.query(WebScraper).filter(
        WebScraper.id == uuid.UUID(scraper_id),
        WebScraper.is_active == True
    ).first()
    
    if not scraper:
        raise HTTPException(status_code=404, detail="Scraper not found")
    
    # Get latest result stats
    latest_result = db.query(ScraperResult).filter(
        ScraperResult.scraper_id == scraper.id
    ).order_by(ScraperResult.created_at.desc()).first()
    
    return {
        "id": str(scraper.id),
        "name": scraper.name,
        "description": scraper.description,
        "url": scraper.url,
        "fields": scraper.fields,
        "pagination_config": scraper.pagination_config,
        "headers": scraper.headers,
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
        "latest_result": {
            "item_count": latest_result.item_count,
            "page_count": latest_result.page_count,
            "duration_ms": latest_result.duration_ms
        } if latest_result else None,
        "created_at": scraper.created_at.isoformat()
    }


@router.put("/{scraper_id}")
async def update_scraper(
    scraper_id: str,
    data: ScraperUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a scraper"""
    scraper = db.query(WebScraper).filter(
        WebScraper.id == uuid.UUID(scraper_id),
        WebScraper.is_active == True
    ).first()
    
    if not scraper:
        raise HTTPException(status_code=404, detail="Scraper not found")
    
    update_data = data.dict(exclude_unset=True)
    
    if "fields" in update_data and update_data["fields"]:
        update_data["fields"] = [
            f.dict() if hasattr(f, 'dict') else f 
            for f in update_data["fields"]
        ]
    
    if "pagination_config" in update_data and update_data["pagination_config"]:
        update_data["pagination_config"] = (
            update_data["pagination_config"].dict() 
            if hasattr(update_data["pagination_config"], 'dict') 
            else update_data["pagination_config"]
        )
    
    for key, value in update_data.items():
        setattr(scraper, key, value)
    
    scraper.updated_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "id": str(scraper.id)}


@router.delete("/{scraper_id}")
async def delete_scraper(
    scraper_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a scraper (soft delete)"""
    scraper = db.query(WebScraper).filter(
        WebScraper.id == uuid.UUID(scraper_id)
    ).first()
    
    if not scraper:
        raise HTTPException(status_code=404, detail="Scraper not found")
    
    scraper.is_active = False
    db.commit()
    
    return {"success": True}


# ============================================
# SCRAPER EXECUTION
# ============================================

@router.post("/{scraper_id}/run")
async def run_scraper(
    scraper_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run a scraper (async)"""
    scraper = db.query(WebScraper).filter(
        WebScraper.id == uuid.UUID(scraper_id),
        WebScraper.is_active == True
    ).first()
    
    if not scraper:
        raise HTTPException(status_code=404, detail="Scraper not found")
    
    if scraper.status == "running":
        raise HTTPException(status_code=409, detail="Scraper is already running")
    
    # Update status
    scraper.status = "running"
    db.commit()
    
    # Add background task
    background_tasks.add_task(execute_scraper, str(scraper.id))
    
    return {"status": "started", "scraper_id": scraper_id}


@router.get("/{scraper_id}/status")
async def get_scraper_status(
    scraper_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get scraper status"""
    scraper = db.query(WebScraper).filter(
        WebScraper.id == uuid.UUID(scraper_id),
        WebScraper.is_active == True
    ).first()
    
    if not scraper:
        raise HTTPException(status_code=404, detail="Scraper not found")
    
    return {
        "scraper_id": scraper_id,
        "status": scraper.status,
        "last_run": scraper.last_run.isoformat() if scraper.last_run else None,
        "last_error": scraper.last_error,
        "run_count": scraper.run_count
    }


# ============================================
# SCRAPER RESULTS
# ============================================

@router.get("/{scraper_id}/results")
async def list_scraper_results(
    scraper_id: str,
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List scraper results"""
    results = db.query(ScraperResult).filter(
        ScraperResult.scraper_id == uuid.UUID(scraper_id),
        ScraperResult.is_active == True
    ).order_by(ScraperResult.created_at.desc()).limit(limit).all()
    
    return {
        "results": [
            {
                "id": str(r.id),
                "url": r.url,
                "page_count": r.page_count,
                "item_count": r.item_count,
                "duration_ms": r.duration_ms,
                "status": r.status,
                "error_message": r.error_message,
                "created_at": r.created_at.isoformat()
            }
            for r in results
        ]
    }


@router.get("/{scraper_id}/data")
async def get_scraper_data(
    scraper_id: str,
    use_cache: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get latest scraped data"""
    scraper = db.query(WebScraper).filter(
        WebScraper.id == uuid.UUID(scraper_id),
        WebScraper.is_active == True
    ).first()
    
    if not scraper:
        raise HTTPException(status_code=404, detail="Scraper not found")
    
    # Get latest result
    result = db.query(ScraperResult).filter(
        ScraperResult.scraper_id == uuid.UUID(scraper_id),
        ScraperResult.status == "completed"
    ).order_by(ScraperResult.created_at.desc()).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="No data available. Run the scraper first.")
    
    # Check cache validity
    is_cached = use_cache and result.expires_at and datetime.utcnow() < result.expires_at
    
    return {
        "data": result.data,
        "cached": is_cached,
        "item_count": result.item_count,
        "scraped_at": result.created_at.isoformat()
    }


@router.get("/{scraper_id}/results/{result_id}")
async def get_scraper_result(
    scraper_id: str,
    result_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific scraper result"""
    result = db.query(ScraperResult).filter(
        ScraperResult.id == uuid.UUID(result_id),
        ScraperResult.scraper_id == uuid.UUID(scraper_id)
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    return {
        "id": str(result.id),
        "url": result.url,
        "data": result.data,
        "page_count": result.page_count,
        "item_count": result.item_count,
        "duration_ms": result.duration_ms,
        "status": result.status,
        "error_message": result.error_message,
        "created_at": result.created_at.isoformat()
    }


# ============================================
# PREVIEW ENDPOINT
# ============================================

@router.post("/preview")
async def preview_scraper(
    data: ScraperCreate,
    current_user: User = Depends(get_current_user)
):
    """Preview scraper results without saving"""
    try:
        # Check robots.txt if enabled
        if data.respect_robots:
            can_fetch = await check_robots_txt(data.url, data.user_agent)
            if not can_fetch:
                return {
                    "success": False,
                    "error": "Blocked by robots.txt",
                    "data": []
                }
        
        # Fetch and parse
        html = await fetch_page(data.url, data.headers, data.user_agent, data.timeout)
        soup = BeautifulSoup(html, 'lxml')
        
        # Extract data
        items = extract_data(soup, [f.dict() for f in data.fields], None)
        
        return {
            "success": True,
            "data": items[:10],  # Limit preview to 10 items
            "total_found": len(items),
            "page_title": soup.title.string if soup.title else None
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }


# ============================================
# HELPER FUNCTIONS
# ============================================

async def check_robots_txt(url: str, user_agent: str) -> bool:
    """Check if scraping is allowed by robots.txt"""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(robots_url)
            
            if response.status_code == 200:
                rp = urllib.robotparser.RobotFileParser()
                rp.parse(response.text.split('\n'))
                return rp.can_fetch(user_agent, url)
        
        return True  # Allow if no robots.txt
    except:
        return True  # Allow on error


async def fetch_page(
    url: str,
    headers: Dict[str, str],
    user_agent: str,
    timeout: int
) -> str:
    """Fetch a web page"""
    request_headers = {
        "User-Agent": user_agent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        **headers
    }
    
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        response = await client.get(url, headers=request_headers)
        response.raise_for_status()
        return response.text


def extract_data(
    soup: BeautifulSoup,
    fields: List[Dict],
    item_selector: Optional[str]
) -> List[Dict]:
    """Extract data from parsed HTML"""
    items = []
    
    if item_selector:
        # Extract from repeating items
        elements = soup.select(item_selector)
        for element in elements:
            item = {}
            for field in fields:
                value = extract_field(element, field)
                item[field["name"]] = value
            items.append(item)
    else:
        # Extract single item from page
        item = {}
        for field in fields:
            value = extract_field(soup, field)
            item[field["name"]] = value
        items.append(item)
    
    return items


def extract_field(element: BeautifulSoup, field: Dict) -> Any:
    """Extract a single field from an element"""
    selector = field.get("selector")
    selector_type = field.get("selector_type", "css")
    attribute = field.get("attribute")
    multiple = field.get("multiple", False)
    transform = field.get("transform")
    default = field.get("default")
    
    try:
        if selector_type == "css":
            if multiple:
                found = element.select(selector)
            else:
                found = element.select_one(selector)
        elif selector_type == "xpath":
            # BeautifulSoup doesn't support XPath natively
            # Would need lxml for this
            found = None
        elif selector_type == "regex":
            text = element.get_text()
            match = re.search(selector, text)
            if match:
                return apply_transform(match.group(1) if match.groups() else match.group(), transform)
            return default
        else:
            found = None
        
        if not found:
            return default
        
        if multiple:
            values = []
            for el in found:
                if attribute:
                    values.append(el.get(attribute, default))
                else:
                    values.append(el.get_text(strip=True))
            return [apply_transform(v, transform) for v in values]
        else:
            if attribute:
                value = found.get(attribute, default)
            else:
                value = found.get_text(strip=True)
            return apply_transform(value, transform)
    
    except Exception:
        return default


def apply_transform(value: Any, transform: Optional[str]) -> Any:
    """Apply transformation to extracted value"""
    if value is None or transform is None:
        return value
    
    if transform == "trim":
        return str(value).strip()
    elif transform == "lowercase":
        return str(value).lower()
    elif transform == "uppercase":
        return str(value).upper()
    elif transform == "number":
        # Extract numeric value
        numbers = re.findall(r'[\d.,]+', str(value))
        if numbers:
            num_str = numbers[0].replace(',', '')
            try:
                return float(num_str)
            except:
                return None
        return None
    elif transform == "date":
        from dateutil import parser
        try:
            return parser.parse(str(value)).isoformat()
        except:
            return value
    
    return value


async def execute_scraper(scraper_id: str):
    """Execute scraper in background"""
    from core.database import SessionLocal
    
    db = SessionLocal()
    start_time = datetime.utcnow()
    
    try:
        scraper = db.query(WebScraper).filter(
            WebScraper.id == uuid.UUID(scraper_id)
        ).first()
        
        if not scraper:
            return
        
        all_items = []
        pages_scraped = 0
        current_url = scraper.url
        
        # Check robots.txt
        if scraper.respect_robots:
            can_fetch = await check_robots_txt(scraper.url, scraper.user_agent)
            if not can_fetch:
                raise Exception("Blocked by robots.txt")
        
        # Scrape pages
        pagination = scraper.pagination_config or {}
        max_pages = min(scraper.max_pages, pagination.get("max_pages", 10))
        
        while current_url and pages_scraped < max_pages:
            # Fetch page
            html = await fetch_page(
                current_url,
                scraper.headers or {},
                scraper.user_agent,
                scraper.timeout
            )
            soup = BeautifulSoup(html, 'lxml')
            
            # Extract data
            items = extract_data(soup, scraper.fields, None)
            all_items.extend(items)
            pages_scraped += 1
            
            # Handle pagination
            if pagination.get("type") == "next_button" and pagination.get("next_selector"):
                next_link = soup.select_one(pagination["next_selector"])
                if next_link and next_link.get("href"):
                    from urllib.parse import urljoin
                    current_url = urljoin(current_url, next_link["href"])
                else:
                    break
            else:
                break
            
            # Delay between requests
            if scraper.delay_ms > 0:
                await asyncio.sleep(scraper.delay_ms / 1000)
        
        # Calculate duration
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Save result
        result = ScraperResult(
            scraper_id=scraper.id,
            url=scraper.url,
            data=all_items,
            page_count=pages_scraped,
            item_count=len(all_items),
            duration_ms=duration_ms,
            status="completed",
            expires_at=datetime.utcnow() + timedelta(seconds=scraper.cache_ttl)
        )
        db.add(result)
        
        # Update scraper status
        scraper.status = "completed"
        scraper.last_run = datetime.utcnow()
        scraper.run_count += 1
        scraper.last_error = None
        
        db.commit()
    
    except Exception as e:
        scraper = db.query(WebScraper).filter(
            WebScraper.id == uuid.UUID(scraper_id)
        ).first()
        
        if scraper:
            scraper.status = "failed"
            scraper.last_error = str(e)
            scraper.last_run = datetime.utcnow()
            
            # Save failed result
            result = ScraperResult(
                scraper_id=scraper.id,
                url=scraper.url,
                data=[],
                page_count=0,
                item_count=0,
                duration_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000),
                status="failed",
                error_message=str(e)
            )
            db.add(result)
            db.commit()
    
    finally:
        db.close()
