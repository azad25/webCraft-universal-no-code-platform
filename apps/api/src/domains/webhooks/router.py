"""Webhooks domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Request, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.apps.models import App
from src.domains.auth.schemas import UserResponse
from .service import WebhooksService
from .schemas import WebhookCreate, WebhookUpdate

router = APIRouter(prefix="/webhooks")


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session) -> App:
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.post("/apps/{app_id}")
async def create_webhook(
    app_id: uuid.UUID = Path(...),
    webhook: WebhookCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new outgoing webhook"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = WebhooksService(db)
    return await service.create_webhook(str(app_id), webhook.dict())


@router.get("/apps/{app_id}")
async def list_webhooks(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all webhooks for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = WebhooksService(db)
    return await service.list_webhooks(str(app_id))


@router.get("/apps/{app_id}/{webhook_id}")
async def get_webhook(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get webhook details"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = WebhooksService(db)
    webhook = await service.get_webhook(str(app_id), webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return webhook


@router.put("/apps/{app_id}/{webhook_id}")
async def update_webhook(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    updates: WebhookUpdate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a webhook"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = WebhooksService(db)
    webhook = await service.update_webhook(str(app_id), webhook_id, updates.dict(exclude_unset=True))
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return webhook


@router.delete("/apps/{app_id}/{webhook_id}")
async def delete_webhook(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a webhook"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = WebhooksService(db)
    if not await service.delete_webhook(str(app_id), webhook_id):
        raise HTTPException(status_code=404, detail="Webhook not found")
    return {"message": "Webhook deleted"}


@router.post("/apps/{app_id}/{webhook_id}/test")
async def test_webhook(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    background_tasks: BackgroundTasks = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a test webhook"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = WebhooksService(db)
    result = await service.test_webhook(str(app_id), webhook_id, background_tasks)
    if not result:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return result


@router.get("/apps/{app_id}/{webhook_id}/logs")
async def get_webhook_logs(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    limit: int = Query(50, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get webhook delivery logs"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = WebhooksService(db)
    result = await service.get_logs(str(app_id), webhook_id, limit)
    if result is None:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return result


@router.post("/apps/{app_id}/{webhook_id}/logs/{log_id}/retry")
async def retry_webhook(
    app_id: uuid.UUID = Path(...),
    webhook_id: str = Path(...),
    log_id: str = Path(...),
    background_tasks: BackgroundTasks = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retry a failed webhook delivery"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = WebhooksService(db)
    result = await service.retry_webhook(str(app_id), webhook_id, log_id, background_tasks)
    if not result:
        raise HTTPException(status_code=404, detail="Webhook or log entry not found")
    return result


@router.get("/events")
async def list_webhook_events():
    """List available webhook events"""
    service = WebhooksService(None)
    return await service.list_events()


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
    
    try:
        body = await request.json()
    except:
        body = {}
    
    headers = dict(request.headers)
    service = WebhooksService(db)
    return await service.handle_incoming(str(app_id), endpoint_id, request.method, headers, body)
