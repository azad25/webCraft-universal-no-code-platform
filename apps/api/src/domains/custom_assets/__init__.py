"""Custom Assets domain - HTML, CSS, JS, and media assets"""
from .router import router
from .service import CustomAssetsService
from .schemas import *

__all__ = ["router", "CustomAssetsService"]
