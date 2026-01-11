"""Pages domain - Page management for apps"""
from .router import router
from .service import PagesService
from .schemas import *

__all__ = ["router", "PagesService"]
