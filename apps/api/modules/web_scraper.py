"""
Web Scraper Module - Scrape data from websites
"""

from typing import Dict, List, Any, Optional
from enum import Enum
from core.module_system import BaseModule, ModuleMetadata, ModuleType
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field, HttpUrl
import httpx
import asyncio
import json
import hashlib
import re
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse


class SelectorType(str, Enum):
    CSS = "css"
    XPATH = "xpath"
    REGEX = "regex"


class ScraperStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SCHEDULED = "scheduled"


class FieldExtractor(BaseModel):
    name: str
    selector: str
    selector_type: SelectorType = SelectorType.CSS
    attribute: Optional[str] = None  # None = text content, or 'href', 'src', etc.
    multiple: bool = False
    transform: Optional[str] = None  # 'trim', 'lowercase', 'number', 'date'
    default: Optional[Any] = None


class ScraperConfig(BaseModel):
    name: str
    description: Optional[str] = None
    url: str
    fields: List[FieldExtractor]
    pagination: Optional[Dict[str, Any]] = None
    schedule: Optional[str] = None  # Cron expression
    headers: Dict[str, str] = Field(default_factory=dict)
    cookies: Dict[str, str] = Field(default_factory=dict)
    delay_ms: int = 1000  # Delay between requests
    max_pages: int = 10
    timeout: int = 30
    user_agent: str = "WebCraft-Scraper/1.0"
    respect_robots: bool = True
    cache_ttl: int = 3600


class ScrapedData(BaseModel):
    scraper_id: str
    url: str
    data: List[Dict[str, Any]]
    scraped_at: datetime
    page_count: int
    item_count: int
    duration_ms: int


class WebScraperModule(BaseModule):
    """Web scraping functionality for data extraction"""
    
    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            id="core.web_scraper",
            name="Web Scraper",
            version="1.0.0",
            type=ModuleType.INTEGRATION,
            description="Scrape and extract data from any website",
            author="WebCraft",
            dependencies=[],
            is_premium=True
        )
    
    async def initialize(self) -> bool:
        self._scrapers: Dict[str, ScraperConfig] = {}
        self._results: Dict[str, ScrapedData] = {}
        self._status: Dict[str, ScraperStatus] = {}
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._robots_cache: Dict[str, Dict[str, Any]] = {}
        self._initialized = True
        return True
    
    async def shutdown(self) -> bool:
        self._scrapers.clear()
        self._results.clear()
        self._status.clear()
        self._initialized = False
        return True
    
    def _get_cache_key(self, url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()
    
    async def _fetch_robots_txt(self, base_url: str) -> Dict[str, Any]:
        """Fetch and parse robots.txt"""
        parsed = urlparse(base_url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        
        if robots_url in self._robots_cache:
            return self._robots_cache[robots_url]
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(robots_url)
                if response.status_code == 200:
                    rules = self._parse_robots_txt(response.text)
                    self._robots_cache[robots_url] = rules
                    return rules
        except:
            pass
        
        return {"allowed": True, "crawl_delay": 0}
    
    def _parse_robots_txt(self, content: str) -> Dict[str, Any]:
        """Parse robots.txt content"""
        disallowed = []
        crawl_delay = 0
        
        current_agent = None
        for line in content.split("\n"):
            line = line.strip().lower()
            if line.startswith("user-agent:"):
                agent = line.split(":", 1)[1].strip()
                current_agent = agent
            elif current_agent in ["*", "webcraft-scraper"]:
                if line.startswith("disallow:"):
                    path = line.split(":", 1)[1].strip()
                    if path:
                        disallowed.append(path)
                elif line.startswith("crawl-delay:"):
                    try:
                        crawl_delay = int(line.split(":", 1)[1].strip())
                    except:
                        pass
        
        return {"disallowed": disallowed, "crawl_delay": crawl_delay}
    
    def _is_allowed(self, url: str, robots: Dict[str, Any]) -> bool:
        """Check if URL is allowed by robots.txt"""
        parsed = urlparse(url)
        path = parsed.path
        
        for disallowed in robots.get("disallowed", []):
            if path.startswith(disallowed):
                return False
        return True
    
    async def _fetch_page(self, url: str, config: ScraperConfig) -> Optional[str]:
        """Fetch a single page"""
        headers = {
            "User-Agent": config.user_agent,
            **config.headers
        }
        
        try:
            async with httpx.AsyncClient(timeout=config.timeout) as client:
                response = await client.get(
                    url,
                    headers=headers,
                    cookies=config.cookies,
                    follow_redirects=True
                )
                response.raise_for_status()
                return response.text
        except Exception as e:
            print(f"Failed to fetch {url}: {e}")
            return None
    
    def _transform_value(self, value: str, transform: Optional[str]) -> Any:
        """Apply transformation to extracted value"""
        if not transform or not value:
            return value
        
        if transform == "trim":
            return value.strip()
        elif transform == "lowercase":
            return value.lower()
        elif transform == "uppercase":
            return value.upper()
        elif transform == "number":
            try:
                cleaned = re.sub(r"[^\d.-]", "", value)
                return float(cleaned) if "." in cleaned else int(cleaned)
            except:
                return None
        elif transform == "date":
            # Basic date parsing
            from dateutil import parser
            try:
                return parser.parse(value).isoformat()
            except:
                return value
        
        return value
    
    def _extract_field(self, soup: BeautifulSoup, field: FieldExtractor) -> Any:
        """Extract a single field from HTML"""
        try:
            if field.selector_type == SelectorType.CSS:
                if field.multiple:
                    elements = soup.select(field.selector)
                else:
                    elements = [soup.select_one(field.selector)]
                    elements = [e for e in elements if e]
            
            elif field.selector_type == SelectorType.REGEX:
                html = str(soup)
                if field.multiple:
                    matches = re.findall(field.selector, html)
                    return [self._transform_value(m, field.transform) for m in matches]
                else:
                    match = re.search(field.selector, html)
                    if match:
                        return self._transform_value(match.group(1) if match.groups() else match.group(), field.transform)
                    return field.default
            
            else:
                return field.default
            
            if not elements:
                return [] if field.multiple else field.default
            
            values = []
            for el in elements:
                if field.attribute:
                    value = el.get(field.attribute, "")
                else:
                    value = el.get_text(strip=True)
                
                value = self._transform_value(value, field.transform)
                values.append(value)
            
            return values if field.multiple else (values[0] if values else field.default)
        
        except Exception as e:
            print(f"Error extracting field {field.name}: {e}")
            return [] if field.multiple else field.default
    
    def _extract_data(self, html: str, config: ScraperConfig) -> List[Dict[str, Any]]:
        """Extract all fields from HTML"""
        soup = BeautifulSoup(html, "html.parser")
        
        # Check if we have a container selector for multiple items
        container_selector = None
        for field in config.fields:
            if field.name == "_container" and field.selector_type == SelectorType.CSS:
                container_selector = field.selector
                break
        
        if container_selector:
            containers = soup.select(container_selector)
            results = []
            for container in containers:
                item = {}
                for field in config.fields:
                    if field.name != "_container":
                        item[field.name] = self._extract_field(container, field)
                results.append(item)
            return results
        else:
            # Single item extraction
            item = {}
            for field in config.fields:
                item[field.name] = self._extract_field(soup, field)
            return [item]
    
    def _get_next_page_url(self, html: str, current_url: str, pagination: Dict[str, Any]) -> Optional[str]:
        """Get next page URL from pagination config"""
        if not pagination:
            return None
        
        soup = BeautifulSoup(html, "html.parser")
        
        if "next_selector" in pagination:
            next_el = soup.select_one(pagination["next_selector"])
            if next_el:
                href = next_el.get("href")
                if href:
                    return urljoin(current_url, href)
        
        elif "page_param" in pagination:
            # URL parameter based pagination
            parsed = urlparse(current_url)
            current_page = int(pagination.get("current_page", 1))
            max_page = pagination.get("max_page", 10)
            
            if current_page < max_page:
                next_page = current_page + 1
                param = pagination["page_param"]
                if "?" in current_url:
                    return f"{current_url}&{param}={next_page}"
                else:
                    return f"{current_url}?{param}={next_page}"
        
        return None
    
    async def create_scraper(self, app_id: str, config: ScraperConfig) -> str:
        """Create a new scraper"""
        scraper_id = f"{app_id}_{config.name.lower().replace(' ', '_')}"
        self._scrapers[scraper_id] = config
        self._status[scraper_id] = ScraperStatus.IDLE
        return scraper_id
    
    async def run_scraper(self, scraper_id: str) -> ScrapedData:
        """Run a scraper and collect data"""
        if scraper_id not in self._scrapers:
            raise HTTPException(status_code=404, detail="Scraper not found")
        
        config = self._scrapers[scraper_id]
        self._status[scraper_id] = ScraperStatus.RUNNING
        
        start_time = datetime.utcnow()
        all_data = []
        pages_scraped = 0
        current_url = config.url
        
        try:
            # Check robots.txt
            if config.respect_robots:
                robots = await self._fetch_robots_txt(config.url)
                crawl_delay = max(config.delay_ms, robots.get("crawl_delay", 0) * 1000)
            else:
                robots = {"allowed": True}
                crawl_delay = config.delay_ms
            
            while current_url and pages_scraped < config.max_pages:
                # Check if allowed
                if config.respect_robots and not self._is_allowed(current_url, robots):
                    break
                
                # Fetch page
                html = await self._fetch_page(current_url, config)
                if not html:
                    break
                
                # Extract data
                page_data = self._extract_data(html, config)
                all_data.extend(page_data)
                pages_scraped += 1
                
                # Get next page
                current_url = self._get_next_page_url(html, current_url, config.pagination)
                
                # Delay between requests
                if current_url:
                    await asyncio.sleep(crawl_delay / 1000)
            
            duration = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            result = ScrapedData(
                scraper_id=scraper_id,
                url=config.url,
                data=all_data,
                scraped_at=datetime.utcnow(),
                page_count=pages_scraped,
                item_count=len(all_data),
                duration_ms=duration
            )
            
            self._results[scraper_id] = result
            self._status[scraper_id] = ScraperStatus.COMPLETED
            
            # Cache results
            cache_key = self._get_cache_key(config.url)
            self._cache[cache_key] = {
                "data": all_data,
                "expires": datetime.utcnow() + timedelta(seconds=config.cache_ttl)
            }
            
            return result
        
        except Exception as e:
            self._status[scraper_id] = ScraperStatus.FAILED
            raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")
    
    async def get_scraper_data(self, scraper_id: str, use_cache: bool = True) -> Dict[str, Any]:
        """Get scraped data for a scraper"""
        if scraper_id not in self._scrapers:
            raise HTTPException(status_code=404, detail="Scraper not found")
        
        config = self._scrapers[scraper_id]
        cache_key = self._get_cache_key(config.url)
        
        # Check cache
        if use_cache and cache_key in self._cache:
            cached = self._cache[cache_key]
            if datetime.utcnow() < cached["expires"]:
                return {"data": cached["data"], "cached": True}
        
        # Return last result or run scraper
        if scraper_id in self._results:
            return {"data": self._results[scraper_id].data, "cached": False}
        
        result = await self.run_scraper(scraper_id)
        return {"data": result.data, "cached": False}
    
    async def preview_scraper(self, config: ScraperConfig) -> Dict[str, Any]:
        """Preview scraper results without saving"""
        html = await self._fetch_page(config.url, config)
        if not html:
            raise HTTPException(status_code=502, detail="Failed to fetch page")
        
        data = self._extract_data(html, config)
        return {
            "url": config.url,
            "items_found": len(data),
            "sample_data": data[:5],
            "html_length": len(html)
        }
    
    def get_routes(self) -> List[APIRouter]:
        router = APIRouter(prefix="/scrapers", tags=["Web Scrapers"])
        
        @router.post("")
        async def create_new_scraper(app_id: str, config: ScraperConfig):
            scraper_id = await self.create_scraper(app_id, config)
            return {"scraper_id": scraper_id, "success": True}
        
        @router.post("/{scraper_id}/run")
        async def run_scraper_job(scraper_id: str, background_tasks: BackgroundTasks):
            if scraper_id not in self._scrapers:
                raise HTTPException(status_code=404, detail="Scraper not found")
            background_tasks.add_task(self.run_scraper, scraper_id)
            return {"status": "started", "scraper_id": scraper_id}
        
        @router.get("/{scraper_id}/status")
        async def get_scraper_status(scraper_id: str):
            if scraper_id not in self._scrapers:
                raise HTTPException(status_code=404, detail="Scraper not found")
            return {
                "scraper_id": scraper_id,
                "status": self._status.get(scraper_id, ScraperStatus.IDLE)
            }
        
        @router.get("/{scraper_id}/data")
        async def get_scraped_data(scraper_id: str, use_cache: bool = True):
            return await self.get_scraper_data(scraper_id, use_cache)
        
        @router.post("/preview")
        async def preview_scraper_config(config: ScraperConfig):
            return await self.preview_scraper(config)
        
        @router.get("/{scraper_id}")
        async def get_scraper_config(scraper_id: str):
            if scraper_id not in self._scrapers:
                raise HTTPException(status_code=404, detail="Scraper not found")
            return {"scraper_id": scraper_id, "config": self._scrapers[scraper_id]}
        
        @router.delete("/{scraper_id}")
        async def delete_scraper(scraper_id: str):
            if scraper_id not in self._scrapers:
                raise HTTPException(status_code=404, detail="Scraper not found")
            del self._scrapers[scraper_id]
            self._status.pop(scraper_id, None)
            self._results.pop(scraper_id, None)
            return {"success": True}
        
        return [router]
