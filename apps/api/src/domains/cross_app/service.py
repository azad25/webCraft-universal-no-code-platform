"""Cross-App Communication service"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from src.domains.apps.models import App


# In-memory storage
shared_collections_store: Dict[str, Dict] = {}
connections_store: Dict[str, Dict] = {}
events_store: Dict[str, Dict] = {}
messages_store: Dict[str, Dict] = {}
sync_jobs_store: Dict[str, Dict] = {}


class CrossAppService:
    def __init__(self, db: Session):
        self.db = db
    
    async def share_collection(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        share_id = str(uuid.uuid4())
        shared_collections_store[share_id] = {
            "id": share_id,
            "collection_id": data["collection_id"],
            "owner_id": user_id,
            "visibility": data["visibility"],
            "allowed_apps": data.get("allowed_apps", []),
            "permissions": data.get("permissions", {}),
            "created_at": datetime.utcnow().isoformat()
        }
        return {"success": True, "shared_collection_id": share_id, "visibility": data["visibility"]}
    
    async def get_shared_collections(self, user_id: str, app_id: str) -> Dict[str, Any]:
        collections = [c for c in shared_collections_store.values() if c["owner_id"] == user_id or app_id in c.get("allowed_apps", [])]
        return {"shared_collections": collections, "total": len(collections)}
    
    async def access_shared_data(self, app_id: str, collection_id: str, user_id: str, filters: Optional[str], limit: int) -> Dict[str, Any]:
        return {"data": [], "total": 0}
    
    async def create_connection(self, app_id: str, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        conn_id = str(uuid.uuid4())
        connections_store[conn_id] = {
            "id": conn_id,
            "source_app_id": app_id,
            "target_app_id": data["target_app_id"],
            "connection_type": data["connection_type"],
            "config": data.get("config", {}),
            "created_at": datetime.utcnow().isoformat()
        }
        return {"success": True, "connection_id": conn_id, "connection_type": data["connection_type"]}
    
    async def get_connections(self, app_id: str, connection_type: Optional[str]) -> Dict[str, Any]:
        connections = [c for c in connections_store.values() if c["source_app_id"] == app_id]
        if connection_type:
            connections = [c for c in connections if c["connection_type"] == connection_type]
        return {"connections": connections, "total": len(connections)}
    
    async def delete_connection(self, app_id: str, connection_id: str) -> Dict[str, Any]:
        if connection_id in connections_store:
            del connections_store[connection_id]
        return {"success": True, "message": "Connection deleted"}
    
    async def trigger_event(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        event_id = str(uuid.uuid4())
        events_store[event_id] = {
            "id": event_id,
            "source_app_id": app_id,
            "target_app_id": data.get("target_app_id"),
            "event_type": data["event_type"],
            "event_data": data.get("event_data", {}),
            "status": "triggered",
            "created_at": datetime.utcnow().isoformat()
        }
        return {"success": True, "event_id": event_id, "event_type": data["event_type"], "status": "triggered"}
    
    async def get_events(self, app_id: str, event_type: Optional[str], limit: int) -> Dict[str, Any]:
        events = [e for e in events_store.values() if e["source_app_id"] == app_id or e.get("target_app_id") == app_id]
        if event_type:
            events = [e for e in events if e["event_type"] == event_type]
        return {"events": events[:limit], "total": len(events)}
    
    async def send_message(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        msg_id = str(uuid.uuid4())
        messages_store[msg_id] = {
            "id": msg_id,
            "from_app_id": app_id,
            "to_app_id": data["to_app_id"],
            "message_type": data["message_type"],
            "subject": data["subject"],
            "payload": data.get("payload", {}),
            "is_read": False,
            "created_at": datetime.utcnow().isoformat()
        }
        return {"success": True, "message_id": msg_id, "to_app_id": data["to_app_id"]}
    
    async def get_messages(self, app_id: str, message_type: Optional[str], unread_only: bool, limit: int) -> Dict[str, Any]:
        messages = [m for m in messages_store.values() if m["to_app_id"] == app_id]
        if message_type:
            messages = [m for m in messages if m["message_type"] == message_type]
        if unread_only:
            messages = [m for m in messages if not m["is_read"]]
        unread_count = len([m for m in messages if not m["is_read"]])
        return {"messages": messages[:limit], "total": len(messages), "unread_count": unread_count}
    
    async def mark_message_read(self, message_id: str) -> Dict[str, Any]:
        if message_id in messages_store:
            messages_store[message_id]["is_read"] = True
        return {"success": True, "message": "Message marked as read"}
    
    async def create_sync_job(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        job_id = str(uuid.uuid4())
        sync_jobs_store[job_id] = {
            "id": job_id,
            "source_app_id": app_id,
            "target_app_id": data["target_app_id"],
            "source_collection_id": data["source_collection_id"],
            "target_collection_id": data["target_collection_id"],
            "sync_type": data.get("sync_type", "one_way"),
            "field_mappings": data.get("field_mappings", {}),
            "sync_frequency": data.get("sync_frequency", "manual"),
            "sync_status": "idle",
            "created_at": datetime.utcnow().isoformat()
        }
        return {"success": True, "sync_job_id": job_id, "sync_type": data.get("sync_type", "one_way")}
    
    async def execute_sync_job(self, sync_job_id: str, background_tasks) -> Dict[str, Any]:
        return {"success": True, "message": "Data sync job started", "sync_job_id": sync_job_id}
    
    async def get_sync_jobs(self, app_id: str) -> Dict[str, Any]:
        jobs = [j for j in sync_jobs_store.values() if j["source_app_id"] == app_id]
        return {"sync_jobs": jobs, "total": len(jobs)}
    
    async def discover_apps(self, user_id: str, current_app_id: str, search: Optional[str], app_type: Optional[str]) -> Dict[str, Any]:
        apps = self.db.query(App).filter(App.owner_id == user_id, App.id != uuid.UUID(current_app_id)).all()
        result = [{"id": str(a.id), "name": a.name, "app_type": a.app_type} for a in apps]
        if search:
            result = [a for a in result if search.lower() in a["name"].lower()]
        if app_type:
            result = [a for a in result if a["app_type"] == app_type]
        return {"apps": result, "total": len(result)}
