"""Export domain schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ExportFormat(str, Enum):
    ZIP = "zip"
    GITHUB = "github"
    NETLIFY = "netlify"
    VERCEL = "vercel"
    S3 = "s3"


class ExportOptions(BaseModel):
    format: ExportFormat = ExportFormat.ZIP
    include_analytics: bool = False
    minify_html: bool = True
    minify_css: bool = True
    minify_js: bool = True
    optimize_images: bool = True
    generate_sitemap: bool = True
    generate_robots: bool = True
    custom_domain: Optional[str] = None
    base_path: str = "/"


class ExportStatus(BaseModel):
    id: str
    status: str
    progress: int
    format: str
    file_size_bytes: Optional[int]
    pages_count: Optional[int]
    assets_count: Optional[int]
    lighthouse_score: Optional[Dict[str, int]]
    error_message: Optional[str]
    created_at: str
    expires_at: Optional[str]


class ExportPreview(BaseModel):
    app_name: str
    pages: List[Dict[str, str]]
    assets: Dict[str, int]
    estimated_size: str
    estimated_time: str


class LighthouseResult(BaseModel):
    scores: Dict[str, int]
    metrics: Dict[str, str]
    recommendations: List[Dict[str, str]]


class ExportHistoryItem(BaseModel):
    id: str
    format: str
    status: str
    file_size_bytes: Optional[int]
    pages_count: Optional[int]
    created_at: str
    expires_at: Optional[str]
