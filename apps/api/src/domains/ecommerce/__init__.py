"""E-commerce domain - Product management, orders, inventory"""
from .router import router
from .service import EcommerceService
from .schemas import *

__all__ = ["router", "EcommerceService"]
