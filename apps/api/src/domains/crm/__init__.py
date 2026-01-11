"""CRM domain - Contact management, deals, pipeline, and activities"""
from .router import router
from .service import CRMService

__all__ = ["router", "CRMService"]
