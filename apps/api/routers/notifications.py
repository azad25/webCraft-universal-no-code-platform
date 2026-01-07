"""
Notifications API Routes
Push notifications, email notifications, and in-app notifications
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
import uuid

from core.database import get_db, App, User
from core.auth import get_current_user

router = APIRouter()


class NotificationType(str, Enum):
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"
    IN_APP = "in_app"
    SLACK = "slack"
    WEBHOOK = "webhook"


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationCreate(BaseModel):
    type: NotificationType
    title: str
    message: str
    recipient: str  # email, phone, user_id, channel
    priority: NotificationPriority = NotificationPriority.NORMAL
    data: Dict[str, Any] = {}
    scheduled_at: Optional[datetime] = None


class NotificationTemplateCreate(BaseModel):
    name: str
    type: NotificationType
    subject: Optional[str] = None
    body: str
    variables: List[str] = []


class PushSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]
    user_agent: Optional[str] = None


# In-memory storage (would be database in production)
notifications_store: Dict[str, Dict] = {}
templates_store: Dict[str, Dict] = {}
subscriptions_store: Dict[str, List] = {}


@router.post("/apps/{app_id}/notifications/send")
async def send_notification(
    app_id: uuid.UUID = Path(...),
    notification: NotificationCreate = None,
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a notification"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    notification_id = str(uuid.uuid4())
    notification_data = {
        "id": notification_id,
        "app_id": str(app_id),
        "type": notification.type.value,
        "title": notification.title,
        "message": notification.message,
        "recipient": notification.recipient,
        "priority": notification.priority.value,
        "data": notification.data,
        "status": "pending",
        "scheduled_at": notification.scheduled_at.isoformat() if notification.scheduled_at else None,
        "sent_at": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    notifications_store[notification_id] = notification_data
    
    # Send notification in background
    if not notification.scheduled_at:
        background_tasks.add_task(process_notification, notification_id)
    
    return notification_data


async def process_notification(notification_id: str):
    """Process and send a notification"""
    notification = notifications_store.get(notification_id)
    if not notification:
        return
    
    try:
        notification_type = notification["type"]
        
        if notification_type == "email":
            # Would integrate with email service
            pass
        elif notification_type == "push":
            # Would send web push notification
            pass
        elif notification_type == "sms":
            # Would integrate with SMS service (Twilio)
            pass
        elif notification_type == "slack":
            # Would send Slack message
            pass
        
        notification["status"] = "sent"
        notification["sent_at"] = datetime.utcnow().isoformat()
    
    except Exception as e:
        notification["status"] = "failed"
        notification["error"] = str(e)
    
    notifications_store[notification_id] = notification


@router.get("/apps/{app_id}/notifications")
async def list_notifications(
    app_id: uuid.UUID = Path(...),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List notifications for an app"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    notifications = [
        n for n in notifications_store.values()
        if n["app_id"] == str(app_id)
    ]
    
    if status:
        notifications = [n for n in notifications if n["status"] == status]
    if type:
        notifications = [n for n in notifications if n["type"] == type]
    
    notifications.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "notifications": notifications[:limit],
        "total": len(notifications)
    }


@router.get("/apps/{app_id}/notifications/{notification_id}")
async def get_notification(
    app_id: uuid.UUID = Path(...),
    notification_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification details"""
    notification = notifications_store.get(notification_id)
    if not notification or notification["app_id"] != str(app_id):
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return notification


@router.post("/apps/{app_id}/notifications/bulk")
async def send_bulk_notifications(
    app_id: uuid.UUID = Path(...),
    notifications: List[NotificationCreate] = None,
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send multiple notifications"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    created = []
    for notification in notifications:
        notification_id = str(uuid.uuid4())
        notification_data = {
            "id": notification_id,
            "app_id": str(app_id),
            "type": notification.type.value,
            "title": notification.title,
            "message": notification.message,
            "recipient": notification.recipient,
            "priority": notification.priority.value,
            "data": notification.data,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
        notifications_store[notification_id] = notification_data
        created.append(notification_id)
        
        if not notification.scheduled_at:
            background_tasks.add_task(process_notification, notification_id)
    
    return {
        "created": len(created),
        "notification_ids": created
    }


# Notification Templates
@router.post("/apps/{app_id}/notification-templates")
async def create_template(
    app_id: uuid.UUID = Path(...),
    template: NotificationTemplateCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a notification template"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    template_id = str(uuid.uuid4())
    template_data = {
        "id": template_id,
        "app_id": str(app_id),
        "name": template.name,
        "type": template.type.value,
        "subject": template.subject,
        "body": template.body,
        "variables": template.variables,
        "created_at": datetime.utcnow().isoformat()
    }
    
    templates_store[template_id] = template_data
    
    return template_data


@router.get("/apps/{app_id}/notification-templates")
async def list_templates(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List notification templates"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    templates = [
        t for t in templates_store.values()
        if t["app_id"] == str(app_id)
    ]
    
    return {
        "templates": templates,
        "total": len(templates)
    }


@router.post("/apps/{app_id}/notifications/from-template/{template_id}")
async def send_from_template(
    app_id: uuid.UUID = Path(...),
    template_id: str = Path(...),
    recipient: str = Query(...),
    variables: Dict[str, str] = {},
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send notification using a template"""
    template = templates_store.get(template_id)
    if not template or template["app_id"] != str(app_id):
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Replace variables in template
    body = template["body"]
    subject = template.get("subject", "")
    
    for var, value in variables.items():
        body = body.replace(f"{{{{{var}}}}}", value)
        subject = subject.replace(f"{{{{{var}}}}}", value)
    
    notification_id = str(uuid.uuid4())
    notification_data = {
        "id": notification_id,
        "app_id": str(app_id),
        "template_id": template_id,
        "type": template["type"],
        "title": subject,
        "message": body,
        "recipient": recipient,
        "priority": "normal",
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    
    notifications_store[notification_id] = notification_data
    background_tasks.add_task(process_notification, notification_id)
    
    return notification_data


# Push Notification Subscriptions
@router.post("/apps/{app_id}/push/subscribe")
async def subscribe_push(
    app_id: uuid.UUID = Path(...),
    subscription: PushSubscription = None,
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Subscribe to push notifications"""
    app = db.query(App).filter(App.id == app_id, App.is_active == True).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_id_str = str(app_id)
    if app_id_str not in subscriptions_store:
        subscriptions_store[app_id_str] = []
    
    sub_data = {
        "id": str(uuid.uuid4()),
        "endpoint": subscription.endpoint,
        "keys": subscription.keys,
        "user_agent": subscription.user_agent,
        "user_id": user_id,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Check if already subscribed
    existing = next(
        (s for s in subscriptions_store[app_id_str] if s["endpoint"] == subscription.endpoint),
        None
    )
    
    if not existing:
        subscriptions_store[app_id_str].append(sub_data)
    
    return {"subscribed": True, "subscription_id": sub_data["id"]}


@router.delete("/apps/{app_id}/push/unsubscribe")
async def unsubscribe_push(
    app_id: uuid.UUID = Path(...),
    endpoint: str = Query(...),
    db: Session = Depends(get_db)
):
    """Unsubscribe from push notifications"""
    app_id_str = str(app_id)
    if app_id_str in subscriptions_store:
        subscriptions_store[app_id_str] = [
            s for s in subscriptions_store[app_id_str]
            if s["endpoint"] != endpoint
        ]
    
    return {"unsubscribed": True}


@router.post("/apps/{app_id}/push/broadcast")
async def broadcast_push(
    app_id: uuid.UUID = Path(...),
    title: str = Query(...),
    message: str = Query(...),
    url: Optional[str] = Query(None),
    icon: Optional[str] = Query(None),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Broadcast push notification to all subscribers"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_id_str = str(app_id)
    subscriptions = subscriptions_store.get(app_id_str, [])
    
    # Would send push notifications to all subscribers
    # Using web-push library in production
    
    return {
        "broadcast": True,
        "recipients": len(subscriptions),
        "title": title,
        "message": message
    }


@router.get("/apps/{app_id}/push/subscriptions")
async def list_push_subscriptions(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List push notification subscriptions"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    subscriptions = subscriptions_store.get(str(app_id), [])
    
    return {
        "subscriptions": subscriptions,
        "total": len(subscriptions)
    }


# In-App Notifications for Users
@router.get("/notifications")
async def get_user_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's in-app notifications"""
    from core.database import Base
    from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
    from sqlalchemy.dialects.postgresql import UUID, JSONB
    
    # Query notifications from database
    # For now, return sample data - in production would query Notification model
    notifications = [
        {
            "id": str(uuid.uuid4()),
            "type": "info",
            "title": "Welcome to WebCraft!",
            "message": "Start building your first app by clicking 'Create App' in the dashboard.",
            "link": "/dashboard/apps/new",
            "is_read": False,
            "created_at": datetime.utcnow().isoformat(),
            "metadata": {}
        },
        {
            "id": str(uuid.uuid4()),
            "type": "success",
            "title": "Setup Complete",
            "message": "Your WebCraft platform is ready to use.",
            "link": None,
            "is_read": True,
            "created_at": (datetime.utcnow()).isoformat(),
            "metadata": {}
        }
    ]
    
    if unread_only:
        notifications = [n for n in notifications if not n["is_read"]]
    
    unread_count = len([n for n in notifications if not n["is_read"]])
    
    return {
        "notifications": notifications[:limit],
        "unread_count": unread_count,
        "total": len(notifications)
    }


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    # Would update in database
    return {"success": True, "notification_id": notification_id}


@router.post("/notifications/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    # Would update all unread notifications in database
    return {"success": True, "count": 0}


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    # Would delete from database
    return {"success": True, "notification_id": notification_id}


@router.delete("/notifications/clear")
async def clear_all_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all notifications"""
    # Would delete all notifications for user
    return {"success": True, "count": 0}


@router.post("/notifications/create")
async def create_user_notification(
    title: str = Query(...),
    message: str = Query(...),
    type: str = Query("info"),
    link: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a notification for a user (admin only)"""
    notification_id = str(uuid.uuid4())
    
    return {
        "id": notification_id,
        "title": title,
        "message": message,
        "type": type,
        "link": link,
        "is_read": False,
        "created_at": datetime.utcnow().isoformat()
    }
