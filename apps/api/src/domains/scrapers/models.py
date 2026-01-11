"""
Scrapers domain models
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from src.common.base_model import BaseModel


class WebScraper(BaseModel):
    """Web scraper configuration"""
    __tablename__ = "web_scrapers"
    
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String(1000), nullable=False)
    
    # Extraction configuration
    fields = Column(JSON, default=list)  # Field extractors
    item_selector = Column(String(500), nullable=True)  # CSS selector for repeating items
    pagination_config = Column(JSON, nullable=True)  # Pagination settings
    
    # Request configuration
    headers = Column(JSON, default=dict)
    cookies = Column(JSON, default=dict)
    user_agent = Column(String(500), default="WebCraft-Scraper/1.0")
    timeout = Column(Integer, default=30)
    delay_ms = Column(Integer, default=1000)
    max_pages = Column(Integer, default=10)
    respect_robots = Column(Boolean, default=True)
    
    # Caching and scheduling
    cache_ttl = Column(Integer, default=3600)  # Cache TTL in seconds
    schedule = Column(String(100), nullable=True)  # Cron expression
    is_scheduled = Column(Boolean, default=False)
    
    # Status tracking
    status = Column(String(20), default="idle")  # idle, running, completed, failed
    last_run = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    run_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    app = relationship("App", back_populates="scrapers")
    results = relationship("ScraperResult", back_populates="scraper", cascade="all, delete-orphan")


class ScraperResult(BaseModel):
    """Scraper execution result"""
    __tablename__ = "scraper_results"
    
    scraper_id = Column(UUID(as_uuid=True), ForeignKey("web_scrapers.id"), nullable=False, index=True)
    url = Column(String(1000), nullable=False)
    data = Column(JSON, default=list)  # Scraped data
    
    # Execution stats
    page_count = Column(Integer, default=0)
    item_count = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    
    # Status
    status = Column(String(20), default="pending")  # pending, completed, failed
    error_message = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # Cache expiration
    is_active = Column(Boolean, default=True)
    
    # Relationships
    scraper = relationship("WebScraper", back_populates="results")