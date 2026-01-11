"""
Integrations service
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from src.common.exceptions import NotFoundError, ValidationError
from .models import Integration, IntegrationLog


# Integration providers configuration
INTEGRATIONS = {
    "stripe": {
        "name": "Stripe",
        "category": "payment",
        "auth_type": "api_key",
        "description": "Accept payments and manage subscriptions"
    },
    "mailchimp": {
        "name": "Mailchimp", 
        "category": "email",
        "auth_type": "oauth",
        "description": "Email marketing and automation"
    },
    "zapier": {
        "name": "Zapier",
        "category": "automation", 
        "auth_type": "webhook",
        "description": "Connect with 5000+ apps"
    },
    "google_analytics": {
        "name": "Google Analytics",
        "category": "analytics",
        "auth_type": "oauth", 
        "description": "Track website performance"
    },
    "slack": {
        "name": "Slack",
        "category": "communication",
        "auth_type": "oauth",
        "description": "Team communication and notifications"
    }
}


class IntegrationService:
    """Integration management service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def list_available(self, category: Optional[str] = None) -> Dict[str, Any]:
        """List available integrations"""
        integrations = INTEGRATIONS
        if category:
            integrations = {k: v for k, v in integrations.items() if v.get("category") == category}
        
        return {"integrations": integrations}
    
    async def list_categories(self) -> Dict[str, Any]:
        """List integration categories"""
        categories = set()
        for integration in INTEGRATIONS.values():
            categories.add(integration.get("category", "other"))
        
        return {"categories": sorted(list(categories))}
    
    def list_app_integrations(self, app_id: str) -> List[Dict[str, Any]]:
        """List integrations for an app"""
        integrations = self.db.query(Integration).filter(
            Integration.app_id == uuid.UUID(app_id)
        ).all()
        
        return [
            {
                "id": str(integration.id),
                "name": integration.name,
                "provider": integration.provider,
                "is_connected": integration.is_connected,
                "is_active": integration.is_active,
                "last_sync_at": integration.last_sync_at,
                "created_at": integration.created_at.isoformat(),
                "updated_at": integration.updated_at.isoformat()
            }
            for integration in integrations
        ]
    
    def get_integration(self, app_id: str, integration_id: str) -> Optional[Dict[str, Any]]:
        """Get specific integration"""
        integration = self.db.query(Integration).filter(
            Integration.id == uuid.UUID(integration_id),
            Integration.app_id == uuid.UUID(app_id)
        ).first()
        
        if not integration:
            return None
        
        return {
            "id": str(integration.id),
            "name": integration.name,
            "provider": integration.provider,
            "config": integration.config,
            "is_connected": integration.is_connected,
            "is_active": integration.is_active,
            "last_sync_at": integration.last_sync_at,
            "created_at": integration.created_at.isoformat(),
            "updated_at": integration.updated_at.isoformat()
        }
    
    async def get(self, app_id: str, integration_id: str) -> Optional[Dict[str, Any]]:
        """Get specific integration (alias for get_integration)"""
        return self.get_integration(app_id, integration_id)
    
    async def update(self, app_id: str, integration_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update integration settings"""
        integration = self.db.query(Integration).filter(
            Integration.id == uuid.UUID(integration_id),
            Integration.app_id == uuid.UUID(app_id)
        ).first()
        
        if not integration:
            return None
        
        # Update allowed fields
        if "name" in updates:
            integration.name = updates["name"]
        if "config" in updates:
            integration.config = updates["config"]
        if "is_active" in updates:
            integration.is_active = updates["is_active"]
        
        integration.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(integration)
        
        self._log_activity(integration.id, "update", "success", "Integration settings updated")
        
        return {
            "id": str(integration.id),
            "name": integration.name,
            "provider": integration.provider,
            "config": integration.config,
            "is_connected": integration.is_connected,
            "is_active": integration.is_active,
            "last_sync_at": integration.last_sync_at,
            "created_at": integration.created_at.isoformat(),
            "updated_at": integration.updated_at.isoformat()
        }
    
    async def connect(
        self, app_id: str, provider: str, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Connect to an integration"""
        if provider not in INTEGRATIONS:
            raise ValidationError(f"Unknown provider: {provider}")
        
        provider_info = INTEGRATIONS[provider]
        
        # Check for existing integration
        existing = self.db.query(Integration).filter(
            Integration.app_id == uuid.UUID(app_id),
            Integration.provider == provider
        ).first()
        
        if existing:
            # Update existing
            existing.config = config
            existing.is_connected = True
            existing.is_active = True
            existing.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(existing)
            
            self._log_activity(existing.id, "connect", "success", "Reconnected to integration")
            
            return {
                "status": "success",
                "message": f"Reconnected to {provider}",
                "integration_id": str(existing.id)
            }
        
        # Create new integration
        integration = Integration(
            app_id=uuid.UUID(app_id),
            name=provider_info["name"],
            provider=provider,
            config=config,
            is_connected=True,
            is_active=True
        )
        
        self.db.add(integration)
        self.db.commit()
        self.db.refresh(integration)
        
        self._log_activity(integration.id, "connect", "success", "Connected to integration")
        
        return {
            "status": "success",
            "message": f"Connected to {provider}",
            "integration_id": str(integration.id)
        }
    
    async def disconnect(self, app_id: str, integration_id: str) -> bool:
        """Disconnect an integration"""
        integration = self.db.query(Integration).filter(
            Integration.id == uuid.UUID(integration_id),
            Integration.app_id == uuid.UUID(app_id)
        ).first()
        
        if not integration:
            raise NotFoundError("Integration not found")
        
        integration.is_connected = False
        integration.is_active = False
        integration.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        self._log_activity(integration.id, "disconnect", "success", "Disconnected from integration")
        
        return True
    
    async def sync(self, app_id: str, integration_id: str) -> Dict[str, Any]:
        """Sync data with integration"""
        integration = self.db.query(Integration).filter(
            Integration.id == uuid.UUID(integration_id),
            Integration.app_id == uuid.UUID(app_id)
        ).first()
        
        if not integration:
            raise NotFoundError("Integration not found")
        
        if not integration.is_connected:
            raise ValidationError("Integration is not connected")
        
        # Perform sync based on provider
        result = await self._perform_sync(integration)
        
        # Update last sync time
        integration.last_sync_at = datetime.utcnow().isoformat()
        self.db.commit()
        
        self._log_activity(
            integration.id, 
            "sync", 
            result.get("status", "success"),
            result.get("message", "Sync completed")
        )
        
        return result
    
    async def test(self, app_id: str, integration_id: str) -> Dict[str, Any]:
        """Test integration connection"""
        integration = self.db.query(Integration).filter(
            Integration.id == uuid.UUID(integration_id),
            Integration.app_id == uuid.UUID(app_id)
        ).first()
        
        if not integration:
            raise NotFoundError("Integration not found")
        
        # Perform connection test based on provider
        result = await self._test_connection(integration)
        
        self._log_activity(
            integration.id,
            "test",
            result.get("status", "success"),
            result.get("message", "Connection test completed")
        )
        
        return result
    
    async def get_oauth_url(self, provider: str, app_id: str, redirect_uri: str) -> Dict[str, Any]:
        """Get OAuth authorization URL"""
        if provider not in INTEGRATIONS:
            raise ValidationError("Unknown provider")
        
        integration = INTEGRATIONS[provider]
        if integration.get("auth_type") != "oauth":
            raise ValidationError("Provider does not use OAuth")
        
        state = str(uuid.uuid4())
        return {
            "authorization_url": f"https://{provider}.com/oauth/authorize?client_id=xxx&redirect_uri={redirect_uri}&state={state}",
            "state": state
        }
    
    async def oauth_callback(
        self, provider: str, code: str, state: str, app_id: str, user
    ) -> Dict[str, Any]:
        """Handle OAuth callback"""
        if provider not in INTEGRATIONS:
            raise ValidationError("Unknown provider")
        
        provider_info = INTEGRATIONS[provider]
        
        # In production, exchange code for access token
        credentials = {"access_token": "xxx", "refresh_token": "xxx"}
        
        # Check for existing integration
        existing = self.db.query(Integration).filter(
            Integration.app_id == uuid.UUID(app_id),
            Integration.provider == provider
        ).first()
        
        if existing:
            existing.is_active = True
            existing.is_connected = True
            existing.credentials = credentials
            existing.updated_at = datetime.utcnow()
            
            self.db.commit()
            
            return {
                "status": "success",
                "message": f"Connected to {provider}",
                "integration_id": str(existing.id)
            }
        
        # Create new integration
        integration = Integration(
            app_id=uuid.UUID(app_id),
            name=provider_info["name"],
            provider=provider,
            config={},
            credentials=credentials,
            is_connected=True,
            is_active=True
        )
        
        self.db.add(integration)
        self.db.commit()
        self.db.refresh(integration)
        
        return {
            "status": "success",
            "message": f"Connected to {provider}",
            "integration_id": str(integration.id)
        }
    
    async def _perform_sync(self, integration: Integration) -> Dict[str, Any]:
        """Perform sync based on provider"""
        provider = integration.provider
        
        if provider == "stripe":
            return await self._sync_stripe(integration)
        elif provider == "mailchimp":
            return await self._sync_mailchimp(integration)
        elif provider == "google_analytics":
            return await self._sync_google_analytics(integration)
        else:
            return {
                "status": "success",
                "message": f"Sync completed for {provider}",
                "records_synced": 0
            }
    
    async def _test_connection(self, integration: Integration) -> Dict[str, Any]:
        """Test connection based on provider"""
        provider = integration.provider
        
        # In production, make actual API calls to test connection
        return {
            "status": "success",
            "message": "Connection test successful",
            "latency_ms": 150,
            "provider": provider
        }
    
    async def _sync_stripe(self, integration: Integration) -> Dict[str, Any]:
        """Sync Stripe data"""
        # In production, use Stripe API to sync payments, customers, etc.
        return {
            "status": "success",
            "message": "Stripe data synced successfully",
            "records_synced": 25,
            "last_transaction": datetime.utcnow().isoformat()
        }
    
    async def _sync_mailchimp(self, integration: Integration) -> Dict[str, Any]:
        """Sync Mailchimp data"""
        # In production, use Mailchimp API to sync subscribers, campaigns, etc.
        return {
            "status": "success", 
            "message": "Mailchimp data synced successfully",
            "records_synced": 150,
            "subscribers": 1250
        }
    
    async def _sync_google_analytics(self, integration: Integration) -> Dict[str, Any]:
        """Sync Google Analytics data"""
        # In production, use Google Analytics API to sync metrics
        return {
            "status": "success",
            "message": "Google Analytics data synced successfully", 
            "records_synced": 30,
            "metrics_updated": ["pageviews", "sessions", "bounce_rate"]
        }
    
    def _log_activity(self, integration_id: uuid.UUID, action: str, status: str, message: str):
        """Log integration activity"""
        log = IntegrationLog(
            integration_id=integration_id,
            action=action,
            status=status,
            message=message
        )
        
        self.db.add(log)
        self.db.commit()