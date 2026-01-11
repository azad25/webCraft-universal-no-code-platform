"""Cross-App Communication domain"""
from .router import router
from .service import CrossAppService
from .schemas import *

__all__ = ["router", "CrossAppService"]
