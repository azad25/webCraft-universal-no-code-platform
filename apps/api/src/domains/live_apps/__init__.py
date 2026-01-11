"""Live Apps domain - Deployed app serving"""
from .router import router
from .service import LiveAppsService

__all__ = ["router", "LiveAppsService"]
