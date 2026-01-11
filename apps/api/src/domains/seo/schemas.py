"""
SEO domain schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class SEOConfigUpdate(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    twitter_card: Optional[str] = None
    twitter_title: Optional[str] = None
    twitter_description: Optional[str] = None
    twitter_image: Optional[str] = None
    robots: Optional[str] = None
    canonical_url: Optional[str] = None
    keywords: Optional[List[str]] = None
    structured_data: Optional[Dict[str, Any]] = None


class SEOAnalysisRequest(BaseModel):
    content: str
    target_keywords: Optional[List[str]] = None


class SEOAnalysisResponse(BaseModel):
    score: int
    issues: List[Dict[str, Any]]
    suggestions: List[str]
    keyword_density: Dict[str, float]
    readability_score: float


class SitemapResponse(BaseModel):
    url: str
    generated_at: datetime
    page_count: int


class RobotsResponse(BaseModel):
    content: str
    generated_at: datetime


class StructuredDataResponse(BaseModel):
    type: str
    data: Dict[str, Any]
