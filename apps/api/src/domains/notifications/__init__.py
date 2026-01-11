"""Notifications domain - Push, email, SMS, and in-app notifications"""
from .router import router
from .service import NotificationsService
from .schemas import *

__all__ = ["router", "NotificationsService"]
