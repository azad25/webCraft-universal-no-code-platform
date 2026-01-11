"""Notifications domain service"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
import uuid


# In-memory storage
notifications_store: Dict[str, Dict] = {}
templates_store: Dict[str, Dict] = {}
subscriptions_store: Dict[str, List] = {}


class NotificationsService:
    def __init__(self, db: Session):
        self.db = db
    
    async def send_notification(
        self, app_id: str, notification_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        notification_id = str(uuid.uuid4())
        notification = {
            "id": notification_id,
            "app_id": app_id,
            "type": notification_data.get("type"),
            "title": notification_data.get("title"),
            "message": notification_data.get("message"),
            "recipient": notification_data.get("recipient"),
            "priority": notification_data.get("priority", "normal"),
            "data": notification_data.get("data", {}),
            "status": "pending",
            "scheduled_at": notification_data.get("scheduled_at"),
            "sent_at": None,
            "created_at": datetime.utcnow().isoformat()
        }
        notifications_store[notification_id] = notification
        return notification
    
    async def list_notifications(
        self, app_id: str, status: Optional[str] = None,
        notification_type: Optional[str] = None, limit: int = 50
    ) -> Dict[str, Any]:
        notifications = [
            n for n in notifications_store.values()
            if n["app_id"] == app_id
        ]
        
        if status:
            notifications = [n for n in notifications if n["status"] == status]
        if notification_type:
            notifications = [n for n in notifications if n["type"] == notification_type]
        
        notifications.sort(key=lambda x: x["created_at"], reverse=True)
        return {"notifications": notifications[:limit], "total": len(notifications)}
    
    async def get_notification(self, app_id: str, notification_id: str) -> Optional[Dict[str, Any]]:
        notification = notifications_store.get(notification_id)
        if notification and notification["app_id"] == app_id:
            return notification
        return None
    
    async def send_bulk(
        self, app_id: str, notifications_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        created = []
        for data in notifications_data:
            notification = await self.send_notification(app_id, data)
            created.append(notification["id"])
        return {"created": len(created), "notification_ids": created}
    
    async def create_template(self, app_id: str, template_data: Dict[str, Any]) -> Dict[str, Any]:
        template_id = str(uuid.uuid4())
        template = {
            "id": template_id,
            "app_id": app_id,
            "name": template_data.get("name"),
            "type": template_data.get("type"),
            "subject": template_data.get("subject"),
            "body": template_data.get("body"),
            "variables": template_data.get("variables", []),
            "created_at": datetime.utcnow().isoformat()
        }
        templates_store[template_id] = template
        return template
    
    async def list_templates(self, app_id: str) -> Dict[str, Any]:
        templates = [t for t in templates_store.values() if t["app_id"] == app_id]
        return {"templates": templates, "total": len(templates)}
    
    async def send_from_template(
        self, app_id: str, template_id: str, recipient: str, variables: Dict[str, str]
    ) -> Optional[Dict[str, Any]]:
        template = templates_store.get(template_id)
        if not template or template["app_id"] != app_id:
            return None
        
        body = template["body"]
        subject = template.get("subject", "")
        
        for var, value in variables.items():
            body = body.replace(f"{{{{{var}}}}}", value)
            subject = subject.replace(f"{{{{{var}}}}}", value)
        
        return await self.send_notification(app_id, {
            "type": template["type"],
            "title": subject,
            "message": body,
            "recipient": recipient,
            "priority": "normal",
            "data": {"template_id": template_id}
        })
    
    async def subscribe_push(
        self, app_id: str, subscription_data: Dict[str, Any], user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if app_id not in subscriptions_store:
            subscriptions_store[app_id] = []
        
        sub_data = {
            "id": str(uuid.uuid4()),
            "endpoint": subscription_data.get("endpoint"),
            "keys": subscription_data.get("keys"),
            "user_agent": subscription_data.get("user_agent"),
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat()
        }
        
        existing = next(
            (s for s in subscriptions_store[app_id] if s["endpoint"] == subscription_data.get("endpoint")),
            None
        )
        
        if not existing:
            subscriptions_store[app_id].append(sub_data)
        
        return {"subscribed": True, "subscription_id": sub_data["id"]}
    
    async def unsubscribe_push(self, app_id: str, endpoint: str) -> Dict[str, Any]:
        if app_id in subscriptions_store:
            subscriptions_store[app_id] = [
                s for s in subscriptions_store[app_id] if s["endpoint"] != endpoint
            ]
        return {"unsubscribed": True}
    
    async def broadcast_push(
        self, app_id: str, title: str, message: str, url: Optional[str] = None
    ) -> Dict[str, Any]:
        subscriptions = subscriptions_store.get(app_id, [])
        return {
            "broadcast": True,
            "recipients": len(subscriptions),
            "title": title,
            "message": message
        }
    
    async def list_push_subscriptions(self, app_id: str) -> Dict[str, Any]:
        subscriptions = subscriptions_store.get(app_id, [])
        return {"subscriptions": subscriptions, "total": len(subscriptions)}
    
    async def get_user_notifications(
        self, user_id: str, unread_only: bool = False, limit: int = 50
    ) -> Dict[str, Any]:
        notifications = [
            {
                "id": str(uuid.uuid4()),
                "type": "info",
                "title": "Welcome to WebCraft!",
                "message": "Start building your first app.",
                "link": "/dashboard/apps/new",
                "is_read": False,
                "created_at": datetime.utcnow().isoformat(),
                "metadata": {}
            }
        ]
        
        if unread_only:
            notifications = [n for n in notifications if not n["is_read"]]
        
        unread_count = len([n for n in notifications if not n["is_read"]])
        return {"notifications": notifications[:limit], "unread_count": unread_count, "total": len(notifications)}
    
    async def mark_read(self, notification_id: str) -> Dict[str, Any]:
        return {"success": True, "notification_id": notification_id}
    
    async def mark_all_read(self, user_id: str) -> Dict[str, Any]:
        return {"success": True, "count": 0}
    
    async def delete_notification(self, notification_id: str) -> Dict[str, Any]:
        return {"success": True, "notification_id": notification_id}
    
    async def clear_all(self, user_id: str) -> Dict[str, Any]:
        return {"success": True, "count": 0}
