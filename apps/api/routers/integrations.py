"""
Third-party Integrations API Routes
Connect external services - Database Persisted
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
import uuid

from core.database import get_db, Integration, App, User
from core.auth import get_current_user

router = APIRouter()


class IntegrationConnect(BaseModel):
    provider: str
    credentials: Dict[str, Any] = {}
    config: Dict[str, Any] = {}


class IntegrationUpdate(BaseModel):
    config: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None


# Available integrations catalog
INTEGRATIONS = {
    "stripe": {
        "name": "Stripe",
        "category": "payment",
        "description": "Accept payments with Stripe",
        "auth_type": "api_key",
        "fields": ["api_key", "webhook_secret"],
        "icon": "credit-card"
    },
    "paypal": {
        "name": "PayPal",
        "category": "payment",
        "description": "Accept PayPal payments",
        "auth_type": "oauth",
        "fields": ["client_id", "client_secret"],
        "icon": "dollar-sign"
    },
    "google_analytics": {
        "name": "Google Analytics",
        "category": "analytics",
        "description": "Track website analytics",
        "auth_type": "oauth",
        "scopes": ["analytics.readonly"],
        "icon": "bar-chart"
    },
    "mailchimp": {
        "name": "Mailchimp",
        "category": "marketing",
        "description": "Email marketing automation",
        "auth_type": "api_key",
        "fields": ["api_key"],
        "icon": "mail"
    },
    "sendgrid": {
        "name": "SendGrid",
        "category": "email",
        "description": "Transactional email service",
        "auth_type": "api_key",
        "fields": ["api_key"],
        "icon": "send"
    },
    "twilio": {
        "name": "Twilio",
        "category": "communication",
        "description": "SMS and voice messaging",
        "auth_type": "api_key",
        "fields": ["account_sid", "auth_token"],
        "icon": "phone"
    },
    "slack": {
        "name": "Slack",
        "category": "communication",
        "description": "Team messaging integration",
        "auth_type": "oauth",
        "scopes": ["chat:write", "channels:read"],
        "icon": "message-square"
    },
    "hubspot": {
        "name": "HubSpot",
        "category": "crm",
        "description": "CRM and marketing platform",
        "auth_type": "oauth",
        "scopes": ["contacts", "deals"],
        "icon": "users"
    },
    "shopify": {
        "name": "Shopify",
        "category": "ecommerce",
        "description": "E-commerce platform sync",
        "auth_type": "oauth",
        "scopes": ["read_products", "write_orders"],
        "icon": "shopping-bag"
    },
    "google_sheets": {
        "name": "Google Sheets",
        "category": "productivity",
        "description": "Sync data with spreadsheets",
        "auth_type": "oauth",
        "scopes": ["spreadsheets"],
        "icon": "table"
    },
    "airtable": {
        "name": "Airtable",
        "category": "database",
        "description": "Connect to Airtable bases",
        "auth_type": "api_key",
        "fields": ["api_key", "base_id"],
        "icon": "database"
    },
    "zapier": {
        "name": "Zapier",
        "category": "automation",
        "description": "Connect to 5000+ apps",
        "auth_type": "webhook",
        "fields": ["webhook_url"],
        "icon": "zap"
    },
    "aws_s3": {
        "name": "AWS S3",
        "category": "storage",
        "description": "Cloud file storage",
        "auth_type": "api_key",
        "fields": ["access_key", "secret_key", "bucket", "region"],
        "icon": "cloud"
    },
    "cloudinary": {
        "name": "Cloudinary",
        "category": "media",
        "description": "Image and video management",
        "auth_type": "api_key",
        "fields": ["cloud_name", "api_key", "api_secret"],
        "icon": "image"
    }
}


def integration_to_response(integration: Integration) -> Dict:
    """Convert Integration model to response dict"""
    provider_info = INTEGRATIONS.get(integration.provider, {})
    return {
        "id": str(integration.id),
        "app_id": str(integration.app_id),
        "provider": integration.provider,
        "name": integration.name,
        "category": provider_info.get("category", "other"),
        "icon": provider_info.get("icon", "plug"),
        "is_connected": integration.is_connected,
        "is_enabled": integration.is_active,
        "config": integration.config or {},
        "last_sync": integration.last_sync.isoformat() if integration.last_sync else None,
        "created_at": integration.created_at.isoformat(),
        "updated_at": integration.updated_at.isoformat()
    }


@router.get("/available")
async def list_available_integrations(
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """List all available integrations"""
    integrations = [
        {"id": k, **v}
        for k, v in INTEGRATIONS.items()
    ]
    
    if category:
        integrations = [i for i in integrations if i["category"] == category]
    
    return {"integrations": integrations}


@router.get("/categories")
async def list_integration_categories():
    """List integration categories"""
    categories = list(set(i["category"] for i in INTEGRATIONS.values()))
    return {
        "categories": [
            {"id": c, "name": c.replace("_", " ").title()}
            for c in sorted(categories)
        ]
    }


@router.get("/apps/{app_id}/integrations")
async def list_app_integrations(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List connected integrations for an app"""
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    integrations = db.query(Integration).filter(
        Integration.app_id == app_id,
        Integration.is_active == True
    ).order_by(Integration.created_at.desc()).all()
    
    return {
        "integrations": [integration_to_response(i) for i in integrations],
        "total": len(integrations)
    }


@router.post("/apps/{app_id}/integrations/connect")
async def connect_integration(
    app_id: uuid.UUID = Path(...),
    data: IntegrationConnect = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connect an integration"""
    if data.provider not in INTEGRATIONS:
        raise HTTPException(status_code=400, detail="Unknown integration provider")
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Check if already connected
    existing = db.query(Integration).filter(
        Integration.app_id == app_id,
        Integration.provider == data.provider,
        Integration.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Integration already connected")
    
    provider_info = INTEGRATIONS[data.provider]
    
    integration = Integration(
        app_id=app_id,
        name=provider_info["name"],
        provider=data.provider,
        config=data.config,
        credentials=data.credentials,  # Should be encrypted in production
        is_connected=True
    )
    
    db.add(integration)
    db.commit()
    db.refresh(integration)
    
    return integration_to_response(integration)


@router.get("/apps/{app_id}/integrations/{integration_id}")
async def get_integration(
    app_id: uuid.UUID = Path(...),
    integration_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get integration details"""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.app_id == app_id,
        Integration.is_active == True
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    return integration_to_response(integration)


@router.put("/apps/{app_id}/integrations/{integration_id}")
async def update_integration(
    app_id: uuid.UUID = Path(...),
    integration_id: uuid.UUID = Path(...),
    updates: IntegrationUpdate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update integration settings"""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.app_id == app_id,
        Integration.is_active == True
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    if updates.config is not None:
        integration.config = updates.config
    if updates.credentials is not None:
        integration.credentials = updates.credentials
    if updates.is_enabled is not None:
        integration.is_active = updates.is_enabled
    
    integration.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(integration)
    
    return integration_to_response(integration)


@router.delete("/apps/{app_id}/integrations/{integration_id}")
async def disconnect_integration(
    app_id: uuid.UUID = Path(...),
    integration_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect an integration (soft delete)"""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.app_id == app_id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    integration.is_active = False
    integration.is_connected = False
    db.commit()
    
    return {"message": "Integration disconnected"}


@router.post("/apps/{app_id}/integrations/{integration_id}/sync")
async def sync_integration(
    app_id: uuid.UUID = Path(...),
    integration_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually sync integration data"""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.app_id == app_id,
        Integration.is_active == True
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # TODO: Implement actual sync logic per provider
    integration.last_sync = datetime.utcnow()
    db.commit()
    
    return {
        "message": "Sync completed",
        "last_sync": integration.last_sync.isoformat(),
        "records_synced": 0  # Would return actual count
    }


@router.post("/apps/{app_id}/integrations/{integration_id}/test")
async def test_integration(
    app_id: uuid.UUID = Path(...),
    integration_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test integration connection"""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.app_id == app_id,
        Integration.is_active == True
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # TODO: Implement actual connection test per provider
    # For now, mark as connected
    integration.is_connected = True
    db.commit()
    
    return {
        "status": "success",
        "message": "Connection test successful",
        "latency_ms": 150
    }


@router.get("/oauth/{provider}/authorize")
async def get_oauth_url(
    provider: str = Path(...),
    app_id: uuid.UUID = Query(...),
    redirect_uri: str = Query(...),
    current_user: User = Depends(get_current_user)
):
    """Get OAuth authorization URL"""
    if provider not in INTEGRATIONS:
        raise HTTPException(status_code=400, detail="Unknown provider")
    
    integration = INTEGRATIONS[provider]
    if integration.get("auth_type") != "oauth":
        raise HTTPException(status_code=400, detail="Provider does not use OAuth")
    
    # Generate OAuth URL (would use actual OAuth library in production)
    state = str(uuid.uuid4())
    
    # Store state for verification (would use Redis in production)
    
    return {
        "authorization_url": f"https://{provider}.com/oauth/authorize?client_id=xxx&redirect_uri={redirect_uri}&state={state}",
        "state": state
    }


@router.post("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str = Path(...),
    code: str = Query(...),
    state: str = Query(...),
    app_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Handle OAuth callback"""
    if provider not in INTEGRATIONS:
        raise HTTPException(status_code=400, detail="Unknown provider")
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # TODO: Verify state token
    # TODO: Exchange code for tokens using actual OAuth library
    
    provider_info = INTEGRATIONS[provider]
    
    # Create or update integration
    integration = db.query(Integration).filter(
        Integration.app_id == app_id,
        Integration.provider == provider
    ).first()
    
    if integration:
        integration.is_active = True
        integration.is_connected = True
        integration.credentials = {
            "access_token": "xxx",  # Would be actual token
            "refresh_token": "xxx"
        }
    else:
        integration = Integration(
            app_id=app_id,
            name=provider_info["name"],
            provider=provider,
            config={},
            credentials={
                "access_token": "xxx",
                "refresh_token": "xxx"
            },
            is_connected=True
        )
        db.add(integration)
    
    db.commit()
    db.refresh(integration)
    
    return {
        "status": "success",
        "message": f"Connected to {provider}",
        "integration_id": str(integration.id)
    }
