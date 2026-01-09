"""
Cross-App Communication Service
Handles communication, data sharing, and events between different apps
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from core.database import (
    App, User, AppCollection, AppRecord, SharedCollection, 
    AppConnection, CrossAppEvent, AppMessage, DataSyncJob
)


class CrossAppService:
    """Service for managing cross-app communication and data sharing"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============================================
    # SHARED COLLECTIONS
    # ============================================
    
    async def share_collection(
        self, 
        collection_id: uuid.UUID, 
        owner_id: uuid.UUID,
        visibility: str = "shared",
        allowed_apps: List[uuid.UUID] = None,
        permissions: Dict[str, List[str]] = None
    ) -> SharedCollection:
        """Share a collection with other apps"""
        
        # Check if collection exists and user owns it
        collection = self.db.query(AppCollection).filter(
            AppCollection.id == collection_id,
            AppCollection.app.has(App.owner_id == owner_id)
        ).first()
        
        if not collection:
            raise ValueError("Collection not found or access denied")
        
        # Check if already shared
        existing_share = self.db.query(SharedCollection).filter(
            SharedCollection.collection_id == collection_id
        ).first()
        
        if existing_share:
            # Update existing share
            existing_share.visibility = visibility
            existing_share.allowed_apps = allowed_apps or []
            existing_share.permissions = permissions or {}
            existing_share.updated_at = datetime.utcnow()
            self.db.commit()
            return existing_share
        
        # Create new shared collection
        shared_collection = SharedCollection(
            collection_id=collection_id,
            owner_id=owner_id,
            visibility=visibility,
            allowed_apps=allowed_apps or [],
            permissions=permissions or {}
        )
        
        self.db.add(shared_collection)
        self.db.commit()
        self.db.refresh(shared_collection)
        
        return shared_collection
    
    async def get_shared_collections(
        self, 
        user_id: uuid.UUID,
        app_id: Optional[uuid.UUID] = None
    ) -> List[Dict]:
        """Get collections that are shared with the user's apps"""
        
        query = self.db.query(SharedCollection).join(AppCollection).join(App)
        
        # Get collections that are:
        # 1. Public
        # 2. Shared and the user's app is in allowed_apps
        # 3. Owned by the user
        conditions = [
            SharedCollection.visibility == "public",
            SharedCollection.owner_id == user_id
        ]
        
        if app_id:
            conditions.append(
                and_(
                    SharedCollection.visibility == "shared",
                    SharedCollection.allowed_apps.contains([str(app_id)])
                )
            )
        
        shared_collections = query.filter(
            or_(*conditions),
            SharedCollection.is_active == True
        ).all()
        
        result = []
        for shared in shared_collections:
            collection_data = {
                "id": str(shared.collection.id),
                "name": shared.collection.name,
                "description": shared.collection.description,
                "schema": shared.collection.schema,
                "app_name": shared.collection.app.name,
                "app_id": str(shared.collection.app_id),
                "owner_name": shared.owner.full_name or shared.owner.username,
                "visibility": shared.visibility,
                "permissions": shared.permissions.get(str(app_id), ["read"]) if app_id else ["read"],
                "shared_at": shared.created_at.isoformat()
            }
            result.append(collection_data)
        
        return result
    
    async def access_shared_collection_data(
        self,
        collection_id: uuid.UUID,
        requesting_app_id: uuid.UUID,
        user_id: uuid.UUID,
        filters: Dict = None,
        limit: int = 50
    ) -> Dict:
        """Access data from a shared collection"""
        
        # Check if collection is shared and accessible
        shared_collection = self.db.query(SharedCollection).filter(
            SharedCollection.collection_id == collection_id,
            SharedCollection.is_active == True
        ).first()
        
        if not shared_collection:
            raise ValueError("Collection is not shared")
        
        # Check permissions
        if shared_collection.visibility == "private":
            raise ValueError("Collection is private")
        
        if shared_collection.visibility == "shared":
            if str(requesting_app_id) not in shared_collection.allowed_apps:
                raise ValueError("App not authorized to access this collection")
        
        # Get permissions for this app
        app_permissions = shared_collection.permissions.get(str(requesting_app_id), ["read"])
        
        if "read" not in app_permissions:
            raise ValueError("No read permission for this collection")
        
        # Fetch data
        query = self.db.query(AppRecord).filter(
            AppRecord.collection_id == collection_id,
            AppRecord.is_active == True
        )
        
        # Apply filters if provided
        if filters:
            for field, value in filters.items():
                query = query.filter(AppRecord.data[field].astext == str(value))
        
        records = query.limit(limit).all()
        
        return {
            "collection_id": str(collection_id),
            "collection_name": shared_collection.collection.name,
            "permissions": app_permissions,
            "records": [
                {
                    "id": str(record.id),
                    "data": record.data,
                    "created_at": record.created_at.isoformat()
                }
                for record in records
            ],
            "total": len(records)
        }
    
    # ============================================
    # APP CONNECTIONS
    # ============================================
    
    async def create_app_connection(
        self,
        source_app_id: uuid.UUID,
        target_app_id: uuid.UUID,
        connection_type: str,
        config: Dict = None,
        user_id: uuid.UUID = None
    ) -> AppConnection:
        """Create a connection between two apps"""
        
        # Verify user owns both apps (for now - later we can add permission requests)
        if user_id:
            source_app = self.db.query(App).filter(
                App.id == source_app_id,
                App.owner_id == user_id
            ).first()
            
            target_app = self.db.query(App).filter(
                App.id == target_app_id,
                App.owner_id == user_id
            ).first()
            
            if not source_app or not target_app:
                raise ValueError("One or both apps not found or access denied")
        
        # Check if connection already exists
        existing = self.db.query(AppConnection).filter(
            AppConnection.source_app_id == source_app_id,
            AppConnection.target_app_id == target_app_id,
            AppConnection.connection_type == connection_type
        ).first()
        
        if existing:
            existing.config = config or {}
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            return existing
        
        connection = AppConnection(
            source_app_id=source_app_id,
            target_app_id=target_app_id,
            connection_type=connection_type,
            config=config or {}
        )
        
        self.db.add(connection)
        self.db.commit()
        self.db.refresh(connection)
        
        return connection
    
    async def get_app_connections(
        self,
        app_id: uuid.UUID,
        connection_type: Optional[str] = None
    ) -> List[Dict]:
        """Get all connections for an app"""
        
        query = self.db.query(AppConnection).filter(
            or_(
                AppConnection.source_app_id == app_id,
                AppConnection.target_app_id == app_id
            ),
            AppConnection.is_active == True
        )
        
        if connection_type:
            query = query.filter(AppConnection.connection_type == connection_type)
        
        connections = query.all()
        
        result = []
        for conn in connections:
            is_source = conn.source_app_id == app_id
            connected_app = conn.target_app if is_source else conn.source_app
            
            result.append({
                "id": str(conn.id),
                "connected_app": {
                    "id": str(connected_app.id),
                    "name": connected_app.name,
                    "app_type": connected_app.app_type
                },
                "connection_type": conn.connection_type,
                "direction": "outgoing" if is_source else "incoming",
                "config": conn.config,
                "created_at": conn.created_at.isoformat()
            })
        
        return result
    
    # ============================================
    # CROSS-APP EVENTS
    # ============================================
    
    async def trigger_cross_app_event(
        self,
        source_app_id: uuid.UUID,
        event_type: str,
        event_data: Dict,
        target_app_id: Optional[uuid.UUID] = None
    ) -> CrossAppEvent:
        """Trigger an event that can be consumed by other apps"""
        
        event = CrossAppEvent(
            source_app_id=source_app_id,
            target_app_id=target_app_id,
            event_type=event_type,
            event_data=event_data
        )
        
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        
        # Process event asynchronously
        asyncio.create_task(self._process_cross_app_event(event.id))
        
        return event
    
    async def _process_cross_app_event(self, event_id: uuid.UUID):
        """Process a cross-app event"""
        
        event = self.db.query(CrossAppEvent).filter(
            CrossAppEvent.id == event_id
        ).first()
        
        if not event:
            return
        
        try:
            event.status = "processing"
            self.db.commit()
            
            # Find apps that should receive this event
            if event.target_app_id:
                # Specific target
                target_apps = [event.target_app_id]
            else:
                # Broadcast - find connected apps
                connections = self.db.query(AppConnection).filter(
                    AppConnection.source_app_id == event.source_app_id,
                    AppConnection.connection_type == "event_trigger",
                    AppConnection.is_active == True
                ).all()
                
                target_apps = [conn.target_app_id for conn in connections]
            
            # Send event to target apps
            for target_app_id in target_apps:
                await self._deliver_event_to_app(event, target_app_id)
            
            event.status = "completed"
            event.processed_at = datetime.utcnow()
            self.db.commit()
            
        except Exception as e:
            event.status = "failed"
            event.error_message = str(e)
            event.processed_at = datetime.utcnow()
            self.db.commit()
    
    async def _deliver_event_to_app(self, event: CrossAppEvent, target_app_id: uuid.UUID):
        """Deliver an event to a specific app"""
        
        # For now, we'll store it as a message
        # Later, this could trigger webhooks, automations, etc.
        message = AppMessage(
            from_app_id=event.source_app_id,
            to_app_id=target_app_id,
            message_type="event",
            subject=f"Event: {event.event_type}",
            payload={
                "event_id": str(event.id),
                "event_type": event.event_type,
                "event_data": event.event_data,
                "timestamp": event.created_at.isoformat()
            }
        )
        
        self.db.add(message)
        self.db.commit()
    
    async def get_app_events(
        self,
        app_id: uuid.UUID,
        event_type: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """Get events for an app (both sent and received)"""
        
        # Get sent events
        sent_query = self.db.query(CrossAppEvent).filter(
            CrossAppEvent.source_app_id == app_id
        )
        
        # Get received events (via messages)
        received_query = self.db.query(AppMessage).filter(
            AppMessage.to_app_id == app_id,
            AppMessage.message_type == "event"
        )
        
        if event_type:
            sent_query = sent_query.filter(CrossAppEvent.event_type == event_type)
        
        sent_events = sent_query.limit(limit).all()
        received_messages = received_query.limit(limit).all()
        
        result = []
        
        # Add sent events
        for event in sent_events:
            result.append({
                "id": str(event.id),
                "type": "sent",
                "event_type": event.event_type,
                "target_app": event.target_app.name if event.target_app else "Broadcast",
                "data": event.event_data,
                "status": event.status,
                "created_at": event.created_at.isoformat()
            })
        
        # Add received events
        for message in received_messages:
            payload = message.payload
            result.append({
                "id": payload.get("event_id"),
                "type": "received",
                "event_type": payload.get("event_type"),
                "source_app": message.from_app.name,
                "data": payload.get("event_data"),
                "status": "received",
                "created_at": message.created_at.isoformat()
            })
        
        # Sort by creation time
        result.sort(key=lambda x: x["created_at"], reverse=True)
        
        return result[:limit]
    
    # ============================================
    # APP MESSAGING
    # ============================================
    
    async def send_app_message(
        self,
        from_app_id: uuid.UUID,
        to_app_id: uuid.UUID,
        message_type: str,
        subject: str,
        payload: Dict
    ) -> AppMessage:
        """Send a message from one app to another"""
        
        message = AppMessage(
            from_app_id=from_app_id,
            to_app_id=to_app_id,
            message_type=message_type,
            subject=subject,
            payload=payload
        )
        
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        
        return message
    
    async def get_app_messages(
        self,
        app_id: uuid.UUID,
        message_type: Optional[str] = None,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Dict]:
        """Get messages for an app"""
        
        query = self.db.query(AppMessage).filter(
            AppMessage.to_app_id == app_id
        )
        
        if message_type:
            query = query.filter(AppMessage.message_type == message_type)
        
        if unread_only:
            query = query.filter(AppMessage.is_read == False)
        
        messages = query.order_by(AppMessage.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": str(msg.id),
                "from_app": {
                    "id": str(msg.from_app.id),
                    "name": msg.from_app.name
                },
                "message_type": msg.message_type,
                "subject": msg.subject,
                "payload": msg.payload,
                "is_read": msg.is_read,
                "created_at": msg.created_at.isoformat(),
                "read_at": msg.read_at.isoformat() if msg.read_at else None
            }
            for msg in messages
        ]
    
    async def mark_message_read(self, message_id: uuid.UUID) -> bool:
        """Mark a message as read"""
        
        message = self.db.query(AppMessage).filter(
            AppMessage.id == message_id
        ).first()
        
        if not message:
            return False
        
        message.is_read = True
        message.read_at = datetime.utcnow()
        self.db.commit()
        
        return True
    
    # ============================================
    # DATA SYNCHRONIZATION
    # ============================================
    
    async def create_data_sync_job(
        self,
        source_app_id: uuid.UUID,
        target_app_id: uuid.UUID,
        source_collection_id: uuid.UUID,
        target_collection_id: uuid.UUID,
        sync_type: str = "one_way",
        field_mappings: Dict = None,
        sync_frequency: str = "manual"
    ) -> DataSyncJob:
        """Create a data synchronization job between collections"""
        
        sync_job = DataSyncJob(
            source_app_id=source_app_id,
            target_app_id=target_app_id,
            source_collection_id=source_collection_id,
            target_collection_id=target_collection_id,
            sync_type=sync_type,
            field_mappings=field_mappings or {},
            sync_frequency=sync_frequency
        )
        
        self.db.add(sync_job)
        self.db.commit()
        self.db.refresh(sync_job)
        
        return sync_job
    
    async def execute_data_sync(self, sync_job_id: uuid.UUID) -> Dict:
        """Execute a data synchronization job"""
        
        sync_job = self.db.query(DataSyncJob).filter(
            DataSyncJob.id == sync_job_id,
            DataSyncJob.is_active == True
        ).first()
        
        if not sync_job:
            raise ValueError("Sync job not found")
        
        try:
            # Get source data
            source_records = self.db.query(AppRecord).filter(
                AppRecord.collection_id == sync_job.source_collection_id,
                AppRecord.is_active == True
            ).all()
            
            synced_count = 0
            
            for source_record in source_records:
                # Apply field mappings
                mapped_data = {}
                for target_field, source_field in sync_job.field_mappings.items():
                    if source_field in source_record.data:
                        mapped_data[target_field] = source_record.data[source_field]
                
                # Check if record exists in target
                existing_record = self.db.query(AppRecord).filter(
                    AppRecord.collection_id == sync_job.target_collection_id,
                    AppRecord.data.contains({"sync_source_id": str(source_record.id)})
                ).first()
                
                if existing_record:
                    # Update existing record
                    existing_record.data.update(mapped_data)
                    existing_record.updated_at = datetime.utcnow()
                else:
                    # Create new record
                    mapped_data["sync_source_id"] = str(source_record.id)
                    new_record = AppRecord(
                        collection_id=sync_job.target_collection_id,
                        data=mapped_data
                    )
                    self.db.add(new_record)
                
                synced_count += 1
            
            # Update sync job
            sync_job.last_sync_at = datetime.utcnow()
            sync_job.sync_status = "active"
            sync_job.error_message = None
            
            # Set next sync time based on frequency
            if sync_job.sync_frequency == "hourly":
                sync_job.next_sync_at = datetime.utcnow() + timedelta(hours=1)
            elif sync_job.sync_frequency == "daily":
                sync_job.next_sync_at = datetime.utcnow() + timedelta(days=1)
            
            self.db.commit()
            
            return {
                "success": True,
                "synced_records": synced_count,
                "last_sync_at": sync_job.last_sync_at.isoformat()
            }
            
        except Exception as e:
            sync_job.sync_status = "error"
            sync_job.error_message = str(e)
            self.db.commit()
            
            return {
                "success": False,
                "error": str(e)
            }
    
    # ============================================
    # APP DISCOVERY
    # ============================================
    
    async def discover_apps(
        self,
        user_id: uuid.UUID,
        search_query: Optional[str] = None,
        app_type: Optional[str] = None
    ) -> List[Dict]:
        """Discover apps that can be connected to"""
        
        query = self.db.query(App).filter(
            App.owner_id == user_id,  # For now, only user's own apps
            App.is_active == True
        )
        
        if search_query:
            query = query.filter(
                or_(
                    App.name.ilike(f"%{search_query}%"),
                    App.description.ilike(f"%{search_query}%")
                )
            )
        
        if app_type:
            query = query.filter(App.app_type == app_type)
        
        apps = query.all()
        
        result = []
        for app in apps:
            # Get collection count
            collection_count = self.db.query(AppCollection).filter(
                AppCollection.app_id == app.id,
                AppCollection.is_active == True
            ).count()
            
            # Get shared collections count
            shared_count = self.db.query(SharedCollection).join(AppCollection).filter(
                AppCollection.app_id == app.id,
                SharedCollection.is_active == True
            ).count()
            
            result.append({
                "id": str(app.id),
                "name": app.name,
                "description": app.description,
                "app_type": app.app_type,
                "collection_count": collection_count,
                "shared_collections": shared_count,
                "created_at": app.created_at.isoformat()
            })
        
        return result