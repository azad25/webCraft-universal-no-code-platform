"""
Integration Module - Third-party service integrations
"""

from typing import Dict, List, Any, Optional
from core.module_system import BaseModule, ModuleMetadata, ModuleType
from modules.base import IntegrationModuleBase
from fastapi import APIRouter
import httpx


class IntegrationModule(IntegrationModuleBase):
    """Manages third-party integrations"""
    
    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            id="core.integrations",
            name="Integrations Hub",
            version="1.0.0",
            type=ModuleType.INTEGRATION,
            description="Connect to 100+ third-party services",
            author="WebCraft",
            dependencies=[],
            is_premium=False
        )
    
    async def initialize(self) -> bool:
        self._integrations = self._load_integrations()
        self._connections: Dict[str, Any] = {}
        self._initialized = True
        return True
    
    async def shutdown(self) -> bool:
        for conn_id in list(self._connections.keys()):
            await self.disconnect()
        self._initialized = False
        return True
    
    def _load_integrations(self) -> Dict[str, Dict]:
        """Available integrations"""
        return {
            "google_analytics": {
                "name": "Google Analytics",
                "category": "analytics",
                "oauth": True,
                "scopes": ["analytics.readonly"]
            },
            "stripe": {
                "name": "Stripe",
                "category": "payment",
                "oauth": False,
                "fields": ["api_key", "webhook_secret"]
            },
            "mailchimp": {
                "name": "Mailchimp",
                "category": "marketing",
                "oauth": True,
                "scopes": ["lists:read", "lists:write"]
            },
            "slack": {
                "name": "Slack",
                "category": "communication",
                "oauth": True,
                "scopes": ["chat:write", "channels:read"]
            },
            "hubspot": {
                "name": "HubSpot",
                "category": "crm",
                "oauth": True,
                "scopes": ["contacts", "deals"]
            },
            "shopify": {
                "name": "Shopify",
                "category": "ecommerce",
                "oauth": True,
                "scopes": ["read_products", "write_orders"]
            },
            "zapier": {
                "name": "Zapier",
                "category": "automation",
                "oauth": False,
                "fields": ["webhook_url"]
            },
            "google_sheets": {
                "name": "Google Sheets",
                "category": "productivity",
                "oauth": True,
                "scopes": ["spreadsheets"]
            },
            "airtable": {
                "name": "Airtable",
                "category": "database",
                "oauth": False,
                "fields": ["api_key", "base_id"]
            },
            "twilio": {
                "name": "Twilio",
                "category": "communication",
                "oauth": False,
                "fields": ["account_sid", "auth_token"]
            }
        }
    
    async def connect(self, credentials: Dict[str, Any]) -> bool:
        integration_id = credentials.get("integration_id")
        if integration_id not in self._integrations:
            return False
        self._connections[integration_id] = credentials
        return True
    
    async def disconnect(self) -> bool:
        self._connections.clear()
        return True
    
    async def sync(self) -> Dict[str, Any]:
        return {"synced": len(self._connections)}
    
    def get_oauth_url(self) -> Optional[str]:
        return None
    
    def get_available_integrations(self) -> List[Dict]:
        return [{"id": k, **v} for k, v in self._integrations.items()]
    
    def get_routes(self) -> List[APIRouter]:
        router = APIRouter(prefix="/integrations", tags=["Integrations"])
        
        @router.get("/available")
        async def list_integrations():
            return {"integrations": self.get_available_integrations()}
        
        @router.post("/{integration_id}/connect")
        async def connect_integration(integration_id: str, credentials: Dict):
            credentials["integration_id"] = integration_id
            success = await self.connect(credentials)
            return {"success": success}
        
        return [router]
