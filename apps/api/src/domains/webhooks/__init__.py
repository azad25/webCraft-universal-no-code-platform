"""Webhooks domain - Incoming and outgoing webhook management"""
from .router import router
from .service import WebhooksService
from .schemas import *

__all__ = ["router", "WebhooksService"]
