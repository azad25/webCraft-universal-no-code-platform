"""
Cross-App Communication API Routes
Enable apps to communicate, share data, and trigger events across applications
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from core.database import get_db, App, User
from core.auth import get_current_user
from services.cross_app_service import CrossAppService

router = APIRouter(prefix="/cross-app", tags=["Cross-App Communication"])


# ============================================
# PYDANTIC MODELS
# ============================================

class ShareCollectionRequest(BaseModel):
    collection_id: str
    visibility: str = Field(..., pattern="^(private|shared|public)$")
    allowed_apps: List[str] = Field(default_factory=list)
    permissions: Dict[str, List[str]] = Field(default_factory=dict)


class CreateConnectionRequest(BaseModel):
    target_app_id: str
    connection_type: str = Field(..., pattern="^(webhook|data_sync|event_trigger)$")
    config: Dict[str, Any] = Field(default_factory=dict)


class TriggerEventRequest(BaseModel):
    event_type: str
    event_data: Dict[str, Any] = Field(default_factory=dict)
    target_app_id: Optional[str] = None


class SendMessageRequest(BaseModel):
    to_app_id: str
    message_type: str
    subject: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class CreateSyncJobRequest(BaseModel):
    target_app_id: str
    source_collection_id: str
    target_collection_id: str
    sync_type: str = Field(default="one_way", pattern="^(one_way|two_way|real_time)$")
    field_mappings: Dict[str, str] = Field(default_factory=dict)
    sync_frequency: str = Field(default="manual", pattern="^(manual|hourly|daily|real_time)$")


# ============================================
# SHARED COLLECTIONS
# ============================================

@router.post("/apps/{app_id}/collections/share")
async def share_collection(
    app_id: uuid.UUID = Path(...),
    request: ShareCollectionRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Share a collection with other apps"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    try:
        shared_collection = await service.share_collection(
            collection_id=uuid.UUID(request.collection_id),
            owner_id=current_user.id,
            visibility=request.visibility,
            allowed_apps=[uuid.UUID(app_id) for app_id in request.allowed_apps],
            permissions=request.permissions
        )
        
        return {
            "success": True,
            "shared_collection_id": str(shared_collection.id),
            "visibility": shared_collection.visibility,
            "allowed_apps": len(shared_collection.allowed_apps),
            "message": f"Collection shared as {request.visibility}"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/{app_id}/collections/shared")
async def get_shared_collections(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get collections that are shared with this app"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    shared_collections = await service.get_shared_collections(
        user_id=current_user.id,
        app_id=app_id
    )
    
    return {
        "shared_collections": shared_collections,
        "total": len(shared_collections)
    }


@router.get("/apps/{app_id}/collections/{collection_id}/data")
async def access_shared_collection_data(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    filters: Optional[str] = Query(None, description="JSON string of filters"),
    limit: int = Query(50, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Access data from a shared collection"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    try:
        import json
        filter_dict = json.loads(filters) if filters else {}
        
        data = await service.access_shared_collection_data(
            collection_id=collection_id,
            requesting_app_id=app_id,
            user_id=current_user.id,
            filters=filter_dict,
            limit=limit
        )
        
        return data
        
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid filters JSON")


# ============================================
# APP CONNECTIONS
# ============================================

@router.post("/apps/{app_id}/connections")
async def create_app_connection(
    app_id: uuid.UUID = Path(...),
    request: CreateConnectionRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a connection between two apps"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    try:
        connection = await service.create_app_connection(
            source_app_id=app_id,
            target_app_id=uuid.UUID(request.target_app_id),
            connection_type=request.connection_type,
            config=request.config,
            user_id=current_user.id
        )
        
        return {
            "success": True,
            "connection_id": str(connection.id),
            "connection_type": connection.connection_type,
            "target_app_id": str(connection.target_app_id),
            "created_at": connection.created_at.isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/{app_id}/connections")
async def get_app_connections(
    app_id: uuid.UUID = Path(...),
    connection_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all connections for an app"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    connections = await service.get_app_connections(
        app_id=app_id,
        connection_type=connection_type
    )
    
    return {
        "connections": connections,
        "total": len(connections)
    }


@router.delete("/apps/{app_id}/connections/{connection_id}")
async def delete_app_connection(
    app_id: uuid.UUID = Path(...),
    connection_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an app connection"""
    
    from core.database import AppConnection
    
    # Verify app ownership and connection
    connection = db.query(AppConnection).filter(
        AppConnection.id == connection_id,
        AppConnection.source_app_id == app_id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    connection.is_active = False
    db.commit()
    
    return {"success": True, "message": "Connection deleted"}


# ============================================
# CROSS-APP EVENTS
# ============================================

@router.post("/apps/{app_id}/events/trigger")
async def trigger_cross_app_event(
    app_id: uuid.UUID = Path(...),
    request: TriggerEventRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger an event that can be consumed by other apps"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    event = await service.trigger_cross_app_event(
        source_app_id=app_id,
        event_type=request.event_type,
        event_data=request.event_data,
        target_app_id=uuid.UUID(request.target_app_id) if request.target_app_id else None
    )
    
    return {
        "success": True,
        "event_id": str(event.id),
        "event_type": event.event_type,
        "status": event.status,
        "created_at": event.created_at.isoformat()
    }


@router.get("/apps/{app_id}/events")
async def get_app_events(
    app_id: uuid.UUID = Path(...),
    event_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get events for an app (both sent and received)"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    events = await service.get_app_events(
        app_id=app_id,
        event_type=event_type,
        limit=limit
    )
    
    return {
        "events": events,
        "total": len(events)
    }


# ============================================
# APP MESSAGING
# ============================================

@router.post("/apps/{app_id}/messages/send")
async def send_app_message(
    app_id: uuid.UUID = Path(...),
    request: SendMessageRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message from one app to another"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    message = await service.send_app_message(
        from_app_id=app_id,
        to_app_id=uuid.UUID(request.to_app_id),
        message_type=request.message_type,
        subject=request.subject,
        payload=request.payload
    )
    
    return {
        "success": True,
        "message_id": str(message.id),
        "to_app_id": str(message.to_app_id),
        "created_at": message.created_at.isoformat()
    }


@router.get("/apps/{app_id}/messages")
async def get_app_messages(
    app_id: uuid.UUID = Path(...),
    message_type: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages for an app"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    messages = await service.get_app_messages(
        app_id=app_id,
        message_type=message_type,
        unread_only=unread_only,
        limit=limit
    )
    
    return {
        "messages": messages,
        "total": len(messages),
        "unread_count": len([m for m in messages if not m["is_read"]])
    }


@router.put("/apps/{app_id}/messages/{message_id}/read")
async def mark_message_read(
    app_id: uuid.UUID = Path(...),
    message_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a message as read"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    success = await service.mark_message_read(message_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"success": True, "message": "Message marked as read"}


# ============================================
# DATA SYNCHRONIZATION
# ============================================

@router.post("/apps/{app_id}/sync-jobs")
async def create_data_sync_job(
    app_id: uuid.UUID = Path(...),
    request: CreateSyncJobRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a data synchronization job between collections"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    sync_job = await service.create_data_sync_job(
        source_app_id=app_id,
        target_app_id=uuid.UUID(request.target_app_id),
        source_collection_id=uuid.UUID(request.source_collection_id),
        target_collection_id=uuid.UUID(request.target_collection_id),
        sync_type=request.sync_type,
        field_mappings=request.field_mappings,
        sync_frequency=request.sync_frequency
    )
    
    return {
        "success": True,
        "sync_job_id": str(sync_job.id),
        "sync_type": sync_job.sync_type,
        "sync_frequency": sync_job.sync_frequency,
        "created_at": sync_job.created_at.isoformat()
    }


@router.post("/apps/{app_id}/sync-jobs/{sync_job_id}/execute")
async def execute_data_sync(
    app_id: uuid.UUID = Path(...),
    sync_job_id: uuid.UUID = Path(...),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute a data synchronization job"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    # Execute sync in background for large datasets
    background_tasks.add_task(service.execute_data_sync, sync_job_id)
    
    return {
        "success": True,
        "message": "Data sync job started",
        "sync_job_id": str(sync_job_id)
    }


@router.get("/apps/{app_id}/sync-jobs")
async def get_data_sync_jobs(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all data sync jobs for an app"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    from core.database import DataSyncJob
    
    sync_jobs = db.query(DataSyncJob).filter(
        DataSyncJob.source_app_id == app_id,
        DataSyncJob.is_active == True
    ).all()
    
    return {
        "sync_jobs": [
            {
                "id": str(job.id),
                "target_app": {
                    "id": str(job.target_app.id),
                    "name": job.target_app.name
                },
                "source_collection": job.source_collection.name,
                "target_collection": job.target_collection.name,
                "sync_type": job.sync_type,
                "sync_frequency": job.sync_frequency,
                "sync_status": job.sync_status,
                "last_sync_at": job.last_sync_at.isoformat() if job.last_sync_at else None,
                "next_sync_at": job.next_sync_at.isoformat() if job.next_sync_at else None,
                "created_at": job.created_at.isoformat()
            }
            for job in sync_jobs
        ],
        "total": len(sync_jobs)
    }


# ============================================
# APP DISCOVERY
# ============================================

@router.get("/apps/{app_id}/discover")
async def discover_apps(
    app_id: uuid.UUID = Path(...),
    search: Optional[str] = Query(None),
    app_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Discover apps that can be connected to"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    service = CrossAppService(db)
    
    apps = await service.discover_apps(
        user_id=current_user.id,
        search_query=search,
        app_type=app_type
    )
    
    # Filter out the current app
    apps = [a for a in apps if a["id"] != str(app_id)]
    
    return {
        "apps": apps,
        "total": len(apps)
    }


# ============================================
# CROSS-APP ACTIONS (Enhanced Actions System)
# ============================================

@router.post("/apps/{app_id}/actions/cross-app")
async def create_cross_app_action(
    app_id: uuid.UUID = Path(...),
    action_data: Dict[str, Any] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an action that can trigger in other apps"""
    
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Add cross-app action types to the existing actions system
    cross_app_actions = {
        "trigger_app_event": {
            "type": "trigger_app_event",
            "config": {
                "target_app_id": action_data.get("target_app_id"),
                "event_type": action_data.get("event_type"),
                "event_data": action_data.get("event_data", {})
            }
        },
        "send_app_message": {
            "type": "send_app_message",
            "config": {
                "to_app_id": action_data.get("to_app_id"),
                "message_type": action_data.get("message_type"),
                "subject": action_data.get("subject"),
                "payload": action_data.get("payload", {})
            }
        },
        "sync_app_data": {
            "type": "sync_app_data",
            "config": {
                "sync_job_id": action_data.get("sync_job_id")
            }
        },
        "access_shared_data": {
            "type": "access_shared_data",
            "config": {
                "collection_id": action_data.get("collection_id"),
                "filters": action_data.get("filters", {}),
                "limit": action_data.get("limit", 50)
            }
        }
    }
    
    action_type = action_data.get("action_type")
    if action_type not in cross_app_actions:
        raise HTTPException(status_code=400, detail="Invalid cross-app action type")
    
    # Store the action in the app's config (integrate with existing actions system)
    app_config = app.config or {}
    if 'cross_app_actions' not in app_config:
        app_config['cross_app_actions'] = {}
    
    action_id = str(uuid.uuid4())
    app_config['cross_app_actions'][action_id] = {
        "id": action_id,
        "name": action_data.get("name", f"Cross-App {action_type}"),
        "description": action_data.get("description", ""),
        "action": cross_app_actions[action_type],
        "created_at": datetime.utcnow().isoformat(),
        "created_by": str(current_user.id)
    }
    
    app.config = app_config
    db.commit()
    
    return {
        "success": True,
        "action_id": action_id,
        "action_type": action_type,
        "message": "Cross-app action created successfully"
    }


@router.get("/cross-app/action-types")
async def get_cross_app_action_types(
    current_user: User = Depends(get_current_user)
):
    """Get available cross-app action types"""
    
    return {
        "action_types": [
            {
                "type": "trigger_app_event",
                "name": "Trigger App Event",
                "description": "Trigger an event in another app",
                "category": "Events",
                "config_fields": [
                    {"name": "target_app_id", "type": "app_selector", "required": True},
                    {"name": "event_type", "type": "text", "required": True},
                    {"name": "event_data", "type": "json", "required": False}
                ]
            },
            {
                "type": "send_app_message",
                "name": "Send App Message",
                "description": "Send a message to another app",
                "category": "Communication",
                "config_fields": [
                    {"name": "to_app_id", "type": "app_selector", "required": True},
                    {"name": "message_type", "type": "text", "required": True},
                    {"name": "subject", "type": "text", "required": True},
                    {"name": "payload", "type": "json", "required": False}
                ]
            },
            {
                "type": "sync_app_data",
                "name": "Sync App Data",
                "description": "Trigger data synchronization between apps",
                "category": "Data",
                "config_fields": [
                    {"name": "sync_job_id", "type": "sync_job_selector", "required": True}
                ]
            },
            {
                "type": "access_shared_data",
                "name": "Access Shared Data",
                "description": "Access data from a shared collection",
                "category": "Data",
                "config_fields": [
                    {"name": "collection_id", "type": "shared_collection_selector", "required": True},
                    {"name": "filters", "type": "json", "required": False},
                    {"name": "limit", "type": "number", "required": False}
                ]
            }
        ]
    }