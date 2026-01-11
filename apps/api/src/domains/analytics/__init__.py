"""Analytics domain - Real-time analytics, tracking, and reporting"""
from .router import router
from .service import AnalyticsService
from .schemas import *

__all__ = ["router", "AnalyticsService"]
