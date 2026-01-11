"""
Scrapers domain service
"""

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import asyncio
import httpx
from bs4 import BeautifulSoup
import re
import urllib.robotparser

from src.common.base_service import BaseService
from src.common.exceptions import NotFoundError, ValidationError
from .models import WebScraper, ScraperResult
from .schemas import ScraperCreate, ScraperUpdate


class ScraperService(BaseService[WebScraper, ScraperCreate, ScraperUpdate]):
    """Service for managing web scrapers"""
    
    def __init__(self, db: Session):
        super().__init__(WebScraper, db)
    
    def list_scrapers(self, app_id: str) -> List[WebScraper]:
        """List all scrapers for an app"""
        return self.db.query(WebScraper).filter(
            WebScraper.app_id == uuid.UUID(app_id),
            WebScraper.is_active == True
        ).order_by(WebScraper.created_at.desc()).all()
    
    def create_scraper(self, app_id: str, data: ScraperCreate) -> WebScraper:
        """Create a new scraper"""
        scraper = WebScraper(
            app_id=uuid.UUID(app_id),
            name=data.name,
            description=data.description,
            url=data.url,
            fields=[f.model_dump() for f in data.fields],
            item_selector=data.item_selector,
            pagination_config=data.pagination_config.model_dump() if data.pagination_config else None,
            headers=data.headers,
            cookies=data.cookies,
            user_agent=data.user_agent,
            timeout=data.timeout,
            delay_ms=data.delay_ms,
            max_pages=data.max_pages,
            respect_robots=data.respect_robots,
            cache_ttl=data.cache_ttl,
            schedule=data.schedule,
            is_scheduled=bool(data.schedule)
        )
        
        self.db.add(scraper)
        self.db.commit()
        self.db.refresh(scraper)
        
        return scraper
    
    def get_scraper(self, scraper_id: str) -> WebScraper:
        """Get scraper by ID"""
        scraper = self.db.query(WebScraper).filter(
            WebScraper.id == uuid.UUID(scraper_id),
            WebScraper.is_active == True
        ).first()
        
        if not scraper:
            raise NotFoundError("Scraper not found")
        
        return scraper
    
    def update_scraper(self, scraper_id: str, data: ScraperUpdate) -> WebScraper:
        """Update a scraper"""
        scraper = self.get_scraper(scraper_id)
        
        update_data = data.model_dump(exclude_unset=True)
        
        if "fields" in update_data and update_data["fields"]:
            update_data["fields"] = [
                f.model_dump() if hasattr(f, 'model_dump') else f
                for f in update_data["fields"]
            ]
        
        if "pagination_config" in update_data and update_data["pagination_config"]:
            update_data["pagination_config"] = (
                update_data["pagination_config"].model_dump()
                if hasattr(update_data["pagination_config"], 'model_dump')
                else update_data["pagination_config"]
            )
        
        for key, value in update_data.items():
            setattr(scraper, key, value)
        
        scraper.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(scraper)
        
        return scraper
    
    def delete_scraper(self, scraper_id: str) -> bool:
        """Soft delete a scraper"""
        scraper = self.get_scraper(scraper_id)
        scraper.is_active = False
        self.db.commit()
        return True
    
    async def run_scraper(self, scraper_id: str) -> Dict[str, Any]:
        """Execute a scraper"""
        scraper = self.get_scraper(scraper_id)
        
        if scraper.status == "running":
            raise ValidationError("Scraper is already running")
        
        # Update status
        scraper.status = "running"
        self.db.commit()
        
        try:
            result = await self._execute_scraper(scraper)
            return {
                "success": True,
                "result_id": str(result.id),
                "item_count": result.item_count,
                "page_count": result.page_count,
                "duration_ms": result.duration_ms
            }
        except Exception as e:
            scraper.status = "failed"
            scraper.last_error = str(e)
            scraper.last_run = datetime.utcnow()
            self.db.commit()
            raise ValidationError(f"Scraper execution failed: {str(e)}")
    
    async def get_scraper_data(
        self,
        scraper_id: str,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """Get latest scraped data"""
        scraper = self.get_scraper(scraper_id)
        
        # Get latest successful result
        result = self.db.query(ScraperResult).filter(
            ScraperResult.scraper_id == uuid.UUID(scraper_id),
            ScraperResult.status == "completed"
        ).order_by(ScraperResult.created_at.desc()).first()
        
        if not result:
            raise NotFoundError("No data available. Run the scraper first.")
        
        # Check cache validity
        is_cached = use_cache and result.expires_at and datetime.utcnow() < result.expires_at
        
        return {
            "data": result.data,
            "cached": is_cached,
            "item_count": result.item_count,
            "page_count": result.page_count,
            "scraped_at": result.created_at.isoformat(),
            "expires_at": result.expires_at.isoformat() if result.expires_at else None
        }
    
    async def preview_scraper(self, data: ScraperCreate) -> Dict[str, Any]:
        """Preview scraper results without saving"""
        try:
            # Check robots.txt if enabled
            if data.respect_robots:
                can_fetch = await self._check_robots_txt(data.url, data.user_agent)
                if not can_fetch:
                    return {
                        "success": False,
                        "error": "Blocked by robots.txt",
                        "data": []
                    }
            
            # Fetch and parse
            html = await self._fetch_page(data.url, data.headers, data.user_agent, data.timeout)
            soup = BeautifulSoup(html, 'lxml')
            
            # Extract data
            items = self._extract_data(soup, [f.model_dump() for f in data.fields], data.item_selector)
            
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
    
    async def _execute_scraper(self, scraper: WebScraper) -> ScraperResult:
        """Execute scraper and return result"""
        start_time = datetime.utcnow()
        
        try:
            all_items = []
            pages_scraped = 0
            current_url = scraper.url
            
            # Check robots.txt
            if scraper.respect_robots:
                can_fetch = await self._check_robots_txt(scraper.url, scraper.user_agent)
                if not can_fetch:
                    raise Exception("Blocked by robots.txt")
            
            # Scrape pages
            pagination = scraper.pagination_config or {}
            max_pages = min(scraper.max_pages, pagination.get("max_pages", 10))
            
            while current_url and pages_scraped < max_pages:
                # Fetch page
                html = await self._fetch_page(
                    current_url,
                    scraper.headers or {},
                    scraper.user_agent,
                    scraper.timeout
                )
                soup = BeautifulSoup(html, 'lxml')
                
                # Extract data
                items = self._extract_data(soup, scraper.fields, scraper.item_selector)
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
            self.db.add(result)
            
            # Update scraper status
            scraper.status = "completed"
            scraper.last_run = datetime.utcnow()
            scraper.run_count += 1
            scraper.last_error = None
            
            self.db.commit()
            self.db.refresh(result)
            
            return result
        
        except Exception as e:
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
            self.db.add(result)
            
            # Update scraper status
            scraper.status = "failed"
            scraper.last_error = str(e)
            scraper.last_run = datetime.utcnow()
            
            self.db.commit()
            raise e
    
    async def _check_robots_txt(self, url: str, user_agent: str) -> bool:
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
    
    async def _fetch_page(
        self,
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
    
    def _extract_data(
        self,
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
                    value = self._extract_field(element, field)
                    item[field["name"]] = value
                items.append(item)
        else:
            # Extract single item from page
            item = {}
            for field in fields:
                value = self._extract_field(soup, field)
                item[field["name"]] = value
            items.append(item)
        
        return items
    
    def _extract_field(self, element: BeautifulSoup, field: Dict) -> Any:
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
            elif selector_type == "regex":
                text = element.get_text()
                match = re.search(selector, text)
                if match:
                    return self._apply_transform(
                        match.group(1) if match.groups() else match.group(), 
                        transform
                    )
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
                return [self._apply_transform(v, transform) for v in values]
            else:
                if attribute:
                    value = found.get(attribute, default)
                else:
                    value = found.get_text(strip=True)
                return self._apply_transform(value, transform)
        
        except Exception:
            return default
    
    def _apply_transform(self, value: Any, transform: Optional[str]) -> Any:
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