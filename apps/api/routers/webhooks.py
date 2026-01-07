"""
Webhooks API Routes
Manage incoming and outgoing webhooks for apps
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, Request, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime
import uuid
import hmac
import hashlib
import httpx

from core.database import get_db, App, User
from core.auth import get_current_user

router = APIRouter()


class WebhookCreate(BaseModel):
    name: str
    url: str
    events: List[str]  # e.g., ["form.submitted", "order.created"]
    secret: Optional[str] = None
    headers: Dict[str, str] = {}
    is_active: bool = True


class WebhookUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    events: Optional[List[str]] = None
    headers: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None


# In-memory webhook storage (would be database in production)
webhooks_store: Dict[str, Dict] = {}
webhook_logs_store: Dict[str, List] = {}


def generate_signature(payload: str, secret: str) -> str:
    """Generate HMAC signature for webhook payload"""
    return hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()


async def send_webhook(webhook: Dict, event: str, payload: Dict):
    """Send webhook to configured URL"""
    webhook_id = webhook["id"]
    
    # Prepare payload
    full_payload = {
        "event": event,
        "timestamp": datetime.utcnow().isoformat(),
        "webhook_id": webhook_id,
        "data": payload
    }
    
    import json
    payload_str = json.dumps(full_payload)
    
    # Generate signature if secret is set
    headers = dict(webhook.get("headers", {}))
    headers["Content-Type"] = "application/json"
    headers["X-WebCraft-Event"] = event
    headers["X-WebCraft-Delivery"] = str(uuid.uuid4())
    
    if webhook.get("secret"):
        signature = generate_signature(payload_str, webhook["secret"])
        headers["X-WebCraft-Signature"] = f"sha256={signature}"
    
    # Send request
    log_entry = {
        "id": str(uuid.uuid4()),
        "webhook_id": webhook_id,
        "event": event,
        "url": webhook["url"],
        "request_headers": headers,
        "request_body": full_payload,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                webhook["url"],
                content=payload_str,
                headers=headers
            )
            
            log_entry["response_status"] = response.status_code
            log_entry["response_body"] = response.text[:1000]  # Limit response size
            log_entry["success"] = 200 <= response.status_code < 300
    
    except Exception as e:
        log_entry["error"] = str(e)
        log_entry["success"] = False
    
    # Store log
    if webhook_id not in webhook_logs_store:
        webhook_logs_store[webhook_id] = []
    webhook_logs_store[webhook_id].insert(0, log_entry)
    webhook_logs_store[webhook_id] = webhook_logs_store[webhook_id][:100]  # Keep last 100


@router.post("/apps/{app_id}/webhooks")
async def create_webhook(
    app_id: uuid.UUID = Path(...),
    webhook: WebhookCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new outgoing webhook"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    webhook_id = str(uuid.uuid4())
    webhook_data = {
        "id": webhook_id,
        "app_id": str(app_id),
        "name": webhook.name,
        "url": webhook.url,
        "events": webhook.events,
        "secret": webhook.secret or str(uuid.uuid4()),
        "headers": webhook.headers,
        "is_active": webhook.is_active,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    webhooks_store[webhook_id] = webhook_data
    
    return webhook_data


@router.get("/apps/{app_id}/webhooks")
async def list_webhooks(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all webhooks for an app"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_webhooks = [
        w for w in webhooks_store.values()
        if w["app_id"] == str(app_id)
    ]
    
    return {
        "webhooks": app_webhooks,
        "total": len(app_webhooks)
    }


@router.get("/apps/{app_id}/webhooks/{webhook_id}")
async def get_webhook(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get webhook details"""
    webhook = webhooks_store.get(webhook_id)
    if not webhook or webhook["app_id"] != str(app_id):
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    return webhook


@router.put("/apps/{app_id}/webhooks/{webhook_id}")
async def update_webhook(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    updates: WebhookUpdate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a webhook"""
    webhook = webhooks_store.get(webhook_id)
    if not webhook or webhook["app_id"] != str(app_id):
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        webhook[key] = value
    
    webhook["updated_at"] = datetime.utcnow().isoformat()
    webhooks_store[webhook_id] = webhook
    
    return webhook


@router.delete("/apps/{app_id}/webhooks/{webhook_id}")
async def delete_webhook(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a webhook"""
    webhook = webhooks_store.get(webhook_id)
    if not webhook or webhook["app_id"] != str(app_id):
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    del webhooks_store[webhook_id]
    
    return {"message": "Webhook deleted"}


@router.post("/apps/{app_id}/webhooks/{webhook_id}/test")
async def test_webhook(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a test webhook"""
    webhook = webhooks_store.get(webhook_id)
    if not webhook or webhook["app_id"] != str(app_id):
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    test_payload = {
        "test": True,
        "message": "This is a test webhook from WebCraft",
        "app_id": str(app_id),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    background_tasks.add_task(send_webhook, webhook, "test", test_payload)
    
    return {
        "message": "Test webhook sent",
        "webhook_id": webhook_id
    }


@router.get("/apps/{app_id}/webhooks/{webhook_id}/logs")
async def get_webhook_logs(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get webhook delivery logs"""
    webhook = webhooks_store.get(webhook_id)
    if not webhook or webhook["app_id"] != str(app_id):
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    logs = webhook_logs_store.get(webhook_id, [])[:limit]
    
    return {
        "logs": logs,
        "total": len(logs)
    }


@router.post("/apps/{app_id}/webhooks/{webhook_id}/logs/{log_id}/retry")
async def retry_webhook(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    log_id: str = Path(...),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retry a failed webhook delivery"""
    webhook = webhooks_store.get(webhook_id)
    if not webhook or webhook["app_id"] != str(app_id):
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    logs = webhook_logs_store.get(webhook_id, [])
    log_entry = next((l for l in logs if l["id"] == log_id), None)
    
    if not log_entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    
    background_tasks.add_task(
        send_webhook,
        webhook,
        log_entry["event"],
        log_entry["request_body"]["data"]
    )
    
    return {"message": "Webhook retry scheduled"}


@router.get("/webhook-events")
async def list_webhook_events():
    """List available webhook events"""
    return {
        "events": [
            {"name": "form.submitted", "description": "When a form is submitted"},
            {"name": "order.created", "description": "When a new order is created"},
            {"name": "order.updated", "description": "When an order is updated"},
            {"name": "order.completed", "description": "When an order is completed"},
            {"name": "user.signup", "description": "When a new user signs up"},
            {"name": "user.login", "description": "When a user logs in"},
            {"name": "page.published", "description": "When a page is published"},
            {"name": "page.updated", "description": "When a page is updated"},
            {"name": "record.created", "description": "When a database record is created"},
            {"name": "record.updated", "description": "When a database record is updated"},
            {"name": "record.deleted", "description": "When a database record is deleted"},
            {"name": "automation.executed", "description": "When an automation runs"},
            {"name": "export.completed", "description": "When an export completes"},
            {"name": "scraper.completed", "description": "When a scraper finishes"}
        ]
    }


# Incoming webhook endpoint for external services
@router.post("/incoming/{app_id}/{endpoint_id}")
async def incoming_webhook(
    app_id: uuid.UUID = Path(...),
    endpoint_id: str = Path(...),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """Receive incoming webhooks from external services"""
    app = db.query(App).filter(App.id == app_id, App.is_active == True).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Get request body
    try:
        body = await request.json()
    except:
        body = {}
    
    # Get headers
    headers = dict(request.headers)
    
    # Log the incoming webhook
    incoming_log = {
        "id": str(uuid.uuid4()),
        "app_id": str(app_id),
        "endpoint_id": endpoint_id,
        "method": request.method,
        "headers": headers,
        "body": body,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Trigger any automations listening for webhooks
    from core.database import Automation
    automations = db.query(Automation).filter(
        Automation.app_id == app_id,
        Automation.trigger_type == "webhook",
        Automation.is_enabled == True,
        Automation.is_active == True
    ).all()
    
    triggered = []
    for automation in automations:
        trigger_config = automation.trigger_config or {}
        if trigger_config.get("endpoint_id") == endpoint_id:
            triggered.append(str(automation.id))
            # Would trigger automation execution here
    
    return {
        "received": True,
        "webhook_id": incoming_log["id"],
        "automations_triggered": triggered
    }
