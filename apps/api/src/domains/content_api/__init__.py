"""Content API domain - AI-friendly content delivery"""
from .router import router
from .service import ContentAPIService

__all__ = ["router", "ContentAPIService"]
