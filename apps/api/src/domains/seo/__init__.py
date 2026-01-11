# SEO domain - Search engine optimization
from .router import router
from .service import SEOService
from .schemas import (
    SEOConfigUpdate, SEOAnalysisRequest, SEOAnalysisResponse,
    SitemapResponse, RobotsResponse, StructuredDataResponse
)

__all__ = [
    "router",
    "SEOService",
    "SEOConfigUpdate",
    "SEOAnalysisRequest",
    "SEOAnalysisResponse",
    "SitemapResponse",
    "RobotsResponse",
    "StructuredDataResponse"
]
