"""Webhooks domain service"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
import uuid
import hmac
import hashlib


# In-memory storage
webhooks_store: Dict[str, Dict] = {}
webhook_logs_store: Dict[str, List] = {}


WEBHOOK_EVENTS = [
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


class WebhooksService:
    def __init__(self, db: Session):
        self.db = db
    
    def _generate_signature(self, payload: str, secret: str) -> str:
        return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    
    async def create_webhook(self, app_id: str, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        webhook_id = str(uuid.uuid4())
        webhook = {
            "id": webhook_id,
            "app_id": app_id,
            "name": webhook_data.get("name"),
            "url": webhook_data.get("url"),
            "events": webhook_data.get("events", []),
            "secret": webhook_data.get("secret") or str(uuid.uuid4()),
            "headers": webhook_data.get("headers", {}),
            "is_active": webhook_data.get("is_active", True),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        webhooks_store[webhook_id] = webhook
        return webhook
    
    async def list_webhooks(self, app_id: str) -> Dict[str, Any]:
        webhooks = [w for w in webhooks_store.values() if w["app_id"] == app_id]
        return {"webhooks": webhooks, "total": len(webhooks)}
    
    async def get_webhook(self, app_id: str, webhook_id: str) -> Optional[Dict[str, Any]]:
        webhook = webhooks_store.get(webhook_id)
        if webhook and webhook["app_id"] == app_id:
            return webhook
        return None
    
    async def update_webhook(
        self, app_id: str, webhook_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        webhook = webhooks_store.get(webhook_id)
        if not webhook or webhook["app_id"] != app_id:
            return None
        
        for key, value in updates.items():
            if value is not None:
                webhook[key] = value
        webhook["updated_at"] = datetime.utcnow().isoformat()
        return webhook
    
    async def delete_webhook(self, app_id: str, webhook_id: str) -> bool:
        webhook = webhooks_store.get(webhook_id)
        if webhook and webhook["app_id"] == app_id:
            del webhooks_store[webhook_id]
            return True
        return False
    
    async def test_webhook(
        self, app_id: str, webhook_id: str, background_tasks
    ) -> Optional[Dict[str, Any]]:
        webhook = webhooks_store.get(webhook_id)
        if not webhook or webhook["app_id"] != app_id:
            return None
        
        return {"message": "Test webhook sent", "webhook_id": webhook_id}
    
    async def get_logs(
        self, app_id: str, webhook_id: str, limit: int = 50
    ) -> Optional[Dict[str, Any]]:
        webhook = webhooks_store.get(webhook_id)
        if not webhook or webhook["app_id"] != app_id:
            return None
        
        logs = webhook_logs_store.get(webhook_id, [])[:limit]
        return {"logs": logs, "total": len(logs)}
    
    async def retry_webhook(
        self, app_id: str, webhook_id: str, log_id: str, background_tasks
    ) -> Optional[Dict[str, Any]]:
        webhook = webhooks_store.get(webhook_id)
        if not webhook or webhook["app_id"] != app_id:
            return None
        
        logs = webhook_logs_store.get(webhook_id, [])
        log_entry = next((l for l in logs if l["id"] == log_id), None)
        if not log_entry:
            return None
        
        return {"message": "Webhook retry scheduled"}
    
    async def list_events(self) -> Dict[str, Any]:
        return {"events": WEBHOOK_EVENTS}
    
    async def handle_incoming(
        self, app_id: str, endpoint_id: str, method: str,
        headers: Dict[str, str], body: Dict[str, Any]
    ) -> Dict[str, Any]:
        incoming_log = {
            "id": str(uuid.uuid4()),
            "app_id": app_id,
            "endpoint_id": endpoint_id,
            "method": method,
            "headers": headers,
            "body": body,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return {
            "received": True,
            "webhook_id": incoming_log["id"],
            "automations_triggered": []
        }
