"""Notifications domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, Dict, List
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.apps.models import App
from src.domains.auth.schemas import UserResponse
from .service import NotificationsService
from .schemas import NotificationCreate, NotificationTemplateCreate, PushSubscription

router = APIRouter(prefix="/notifications")


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session) -> App:
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.post("/apps/{app_id}/send")
async def send_notification(
    app_id: uuid.UUID = Path(...),
    notification: NotificationCreate = None,
    background_tasks: BackgroundTasks = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a notification"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = NotificationsService(db)
    return await service.send_notification(str(app_id), notification.dict())


@router.get("/apps/{app_id}")
async def list_notifications(
    app_id: uuid.UUID = Path(...),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List notifications for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = NotificationsService(db)
    return await service.list_notifications(str(app_id), status, type, limit)


@router.get("/apps/{app_id}/{notification_id}")
async def get_notification(
    app_id: uuid.UUID = Path(...),
    notification_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification details"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = NotificationsService(db)
    notification = await service.get_notification(str(app_id), notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.post("/apps/{app_id}/bulk")
async def send_bulk_notifications(
    app_id: uuid.UUID = Path(...),
    notifications: List[NotificationCreate] = None,
    background_tasks: BackgroundTasks = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send multiple notifications"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = NotificationsService(db)
    return await service.send_bulk(str(app_id), [n.dict() for n in notifications])


@router.post("/apps/{app_id}/templates")
async def create_template(
    app_id: uuid.UUID = Path(...),
    template: NotificationTemplateCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a notification template"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = NotificationsService(db)
    return await service.create_template(str(app_id), template.dict())


@router.get("/apps/{app_id}/templates")
async def list_templates(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List notification templates"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = NotificationsService(db)
    return await service.list_templates(str(app_id))


@router.post("/apps/{app_id}/from-template/{template_id}")
async def send_from_template(
    app_id: uuid.UUID = Path(...),
    template_id: str = Path(...),
    recipient: str = Query(...),
    variables: Dict[str, str] = {},
    background_tasks: BackgroundTasks = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send notification using a template"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = NotificationsService(db)
    result = await service.send_from_template(str(app_id), template_id, recipient, variables)
    if not result:
        raise HTTPException(status_code=404, detail="Template not found")
    return result


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
    service = NotificationsService(db)
    return await service.subscribe_push(str(app_id), subscription.dict(), user_id)


@router.delete("/apps/{app_id}/push/unsubscribe")
async def unsubscribe_push(
    app_id: uuid.UUID = Path(...),
    endpoint: str = Query(...),
    db: Session = Depends(get_db)
):
    """Unsubscribe from push notifications"""
    service = NotificationsService(db)
    return await service.unsubscribe_push(str(app_id), endpoint)


@router.post("/apps/{app_id}/push/broadcast")
async def broadcast_push(
    app_id: uuid.UUID = Path(...),
    title: str = Query(...),
    message: str = Query(...),
    url: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Broadcast push notification to all subscribers"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = NotificationsService(db)
    return await service.broadcast_push(str(app_id), title, message, url)


@router.get("/apps/{app_id}/push/subscriptions")
async def list_push_subscriptions(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List push notification subscriptions"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = NotificationsService(db)
    return await service.list_push_subscriptions(str(app_id))


@router.get("/user")
async def get_user_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's in-app notifications"""
    service = NotificationsService(db)
    return await service.get_user_notifications(str(current_user.id), unread_only, limit)


@router.post("/user/{notification_id}/read")
async def mark_notification_read(
    notification_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    service = NotificationsService(db)
    return await service.mark_read(notification_id)


@router.post("/user/read-all")
async def mark_all_read(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    service = NotificationsService(db)
    return await service.mark_all_read(str(current_user.id))


@router.delete("/user/{notification_id}")
async def delete_notification(
    notification_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    service = NotificationsService(db)
    return await service.delete_notification(notification_id)


@router.delete("/user/clear")
async def clear_all_notifications(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all notifications"""
    service = NotificationsService(db)
    return await service.clear_all(str(current_user.id))
