"""Push notifications router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.schemas import UserResponse
from .service import PushService
from .schemas import (
    PushSubscriptionCreate, PushSubscriptionResponse,
    PushNotificationCreate, PushNotificationResponse,
    BroadcastRequest, PushStatsResponse
)

router = APIRouter()


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session):
    """Helper to verify app ownership"""
    from src.domains.apps.models import App
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


# Subscription endpoints
@router.post("/apps/{app_id}/push/subscribe", response_model=PushSubscriptionResponse)
async def subscribe_to_push(
    app_id: uuid.UUID = Path(...),
    subscription_data: PushSubscriptionCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subscribe to push notifications"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = PushService(db)
    try:
        return await service.create_subscription(str(app_id), str(current_user.id), subscription_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/{app_id}/push/subscriptions", response_model=List[PushSubscriptionResponse])
async def list_push_subscriptions(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all push subscriptions for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = PushService(db)
    return await service.list_subscriptions(str(app_id), str(current_user.id))


@router.delete("/apps/{app_id}/push/unsubscribe/{subscription_id}")
async def unsubscribe_from_push(
    app_id: uuid.UUID = Path(...),
    subscription_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unsubscribe from push notifications"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = PushService(db)
    success = await service.unsubscribe(str(app_id), str(subscription_id), str(current_user.id))
    
    if not success:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Unsubscribed successfully"}


# Notification endpoints
@router.post("/apps/{app_id}/push/broadcast")
async def broadcast_push_notification(
    app_id: uuid.UUID = Path(...),
    broadcast_data: BroadcastRequest = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Broadcast a push notification to subscribers"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = PushService(db)
    try:
        return await service.broadcast_notification(str(app_id), str(current_user.id), broadcast_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/{app_id}/push/notifications")
async def list_push_notifications(
    app_id: uuid.UUID = Path(...),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List push notifications for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = PushService(db)
    return await service.list_notifications(str(app_id), str(current_user.id), page, per_page)


@router.get("/apps/{app_id}/push/stats", response_model=PushStatsResponse)
async def get_push_stats(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get push notification statistics"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = PushService(db)
    return await service.get_push_stats(str(app_id), str(current_user.id))