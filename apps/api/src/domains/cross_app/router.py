"""Cross-App Communication domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.apps.models import App
from src.domains.auth.schemas import UserResponse
from .service import CrossAppService
from .schemas import (
    ShareCollectionRequest, CreateConnectionRequest, TriggerEventRequest,
    SendMessageRequest, CreateSyncJobRequest
)

router = APIRouter(prefix="/cross-app")


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session) -> App:
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.post("/apps/{app_id}/collections/share")
async def share_collection(
    app_id: uuid.UUID = Path(...),
    request: ShareCollectionRequest = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Share a collection with other apps"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.share_collection(str(current_user.id), request.dict())


@router.get("/apps/{app_id}/collections/shared")
async def get_shared_collections(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get collections that are shared with this app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.get_shared_collections(str(current_user.id), str(app_id))


@router.get("/apps/{app_id}/collections/{collection_id}/data")
async def access_shared_collection_data(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    filters: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=1000),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Access data from a shared collection"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.access_shared_data(str(app_id), str(collection_id), str(current_user.id), filters, limit)


@router.post("/apps/{app_id}/connections")
async def create_app_connection(
    app_id: uuid.UUID = Path(...),
    request: CreateConnectionRequest = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a connection between two apps"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.create_connection(str(app_id), str(current_user.id), request.dict())


@router.get("/apps/{app_id}/connections")
async def get_app_connections(
    app_id: uuid.UUID = Path(...),
    connection_type: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all connections for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.get_connections(str(app_id), connection_type)


@router.delete("/apps/{app_id}/connections/{connection_id}")
async def delete_app_connection(
    app_id: uuid.UUID = Path(...),
    connection_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an app connection"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.delete_connection(str(app_id), str(connection_id))


@router.post("/apps/{app_id}/events/trigger")
async def trigger_cross_app_event(
    app_id: uuid.UUID = Path(...),
    request: TriggerEventRequest = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger an event that can be consumed by other apps"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.trigger_event(str(app_id), request.dict())


@router.get("/apps/{app_id}/events")
async def get_app_events(
    app_id: uuid.UUID = Path(...),
    event_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get events for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.get_events(str(app_id), event_type, limit)


@router.post("/apps/{app_id}/messages/send")
async def send_app_message(
    app_id: uuid.UUID = Path(...),
    request: SendMessageRequest = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message from one app to another"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.send_message(str(app_id), request.dict())


@router.get("/apps/{app_id}/messages")
async def get_app_messages(
    app_id: uuid.UUID = Path(...),
    message_type: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.get_messages(str(app_id), message_type, unread_only, limit)


@router.put("/apps/{app_id}/messages/{message_id}/read")
async def mark_message_read(
    app_id: uuid.UUID = Path(...),
    message_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a message as read"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.mark_message_read(str(message_id))


@router.post("/apps/{app_id}/sync-jobs")
async def create_data_sync_job(
    app_id: uuid.UUID = Path(...),
    request: CreateSyncJobRequest = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a data synchronization job"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.create_sync_job(str(app_id), request.dict())


@router.post("/apps/{app_id}/sync-jobs/{sync_job_id}/execute")
async def execute_data_sync(
    app_id: uuid.UUID = Path(...),
    sync_job_id: uuid.UUID = Path(...),
    background_tasks: BackgroundTasks = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute a data synchronization job"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.execute_sync_job(str(sync_job_id), background_tasks)


@router.get("/apps/{app_id}/sync-jobs")
async def get_data_sync_jobs(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all data sync jobs for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.get_sync_jobs(str(app_id))


@router.get("/apps/{app_id}/discover")
async def discover_apps(
    app_id: uuid.UUID = Path(...),
    search: Optional[str] = Query(None),
    app_type: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Discover apps that can be connected to"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = CrossAppService(db)
    return await service.discover_apps(str(current_user.id), str(app_id), search, app_type)


@router.get("/action-types")
async def get_cross_app_action_types(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get available cross-app action types"""
    return {
        "action_types": [
            {"type": "trigger_app_event", "name": "Trigger App Event", "description": "Trigger an event in another app", "category": "Events"},
            {"type": "send_app_message", "name": "Send App Message", "description": "Send a message to another app", "category": "Communication"},
            {"type": "sync_app_data", "name": "Sync App Data", "description": "Trigger data synchronization between apps", "category": "Data"},
            {"type": "access_shared_data", "name": "Access Shared Data", "description": "Access data from a shared collection", "category": "Data"}
        ]
    }
