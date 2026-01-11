"""
WebSocket Manager for Real-time Communication
Implements pub/sub pattern with Redis for horizontal scaling
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set, Optional, Any
import json
import asyncio
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

from src.core.redis import redis_client


class WSMessageType(str, Enum):
    """WebSocket message types"""
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    PING = "ping"
    PONG = "pong"
    ELEMENT_ADDED = "element.added"
    ELEMENT_UPDATED = "element.updated"
    ELEMENT_DELETED = "element.deleted"
    ELEMENT_MOVED = "element.moved"
    ELEMENT_RESIZED = "element.resized"
    ELEMENT_SELECTED = "element.selected"
    CURSOR_MOVED = "cursor.moved"
    USER_JOINED = "user.joined"
    USER_LEFT = "user.left"
    PRESENCE_UPDATE = "presence.update"
    APP_SAVED = "app.saved"
    APP_PUBLISHED = "app.published"
    PAGE_CHANGED = "page.changed"
    COMMENT_ADDED = "comment.added"
    COMMENT_UPDATED = "comment.updated"
    COMMENT_DELETED = "comment.deleted"
    NOTIFICATION = "notification"
    ALERT = "alert"
    ERROR = "error"


@dataclass
class WSMessage:
    """WebSocket message structure"""
    type: str
    payload: Dict[str, Any]
    sender_id: Optional[str] = None
    timestamp: Optional[str] = None
    room: Optional[str] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_json(cls, data: str) -> 'WSMessage':
        parsed = json.loads(data)
        return cls(**parsed)


@dataclass
class ConnectionInfo:
    """WebSocket connection information"""
    connection_id: str
    user_id: str
    websocket: WebSocket
    rooms: Set[str]
    connected_at: datetime
    last_activity: datetime
    metadata: Dict[str, Any]


class WebSocketManager:
    """Production-grade WebSocket manager"""
    
    def __init__(self):
        self._connections: Dict[str, ConnectionInfo] = {}
        self._rooms: Dict[str, Set[str]] = {}
        self._user_connections: Dict[str, Set[str]] = {}
        self._pubsub = None
        self._pubsub_task = None
        self._message_counts: Dict[str, int] = {}
        self._rate_limit = 100
    
    async def start(self) -> None:
        """Start WebSocket manager and Redis pub/sub"""
        try:
            if redis_client and redis_client.client:
                self._pubsub = redis_client.client.pubsub()
                await self._pubsub.subscribe("ws:broadcast")
                self._pubsub_task = asyncio.create_task(self._listen_redis())
        except Exception as e:
            print(f"Failed to start WebSocket manager: {e}")
    
    async def stop(self) -> None:
        """Stop WebSocket manager"""
        if self._pubsub_task:
            self._pubsub_task.cancel()
        if self._pubsub:
            await self._pubsub.unsubscribe()
        
        for conn_id in list(self._connections.keys()):
            await self.disconnect(conn_id)
    
    async def connect(self, websocket: WebSocket, user_id: str, metadata: Dict[str, Any] = None) -> str:
        """Accept WebSocket connection and register it"""
        await websocket.accept()
        
        connection_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        conn_info = ConnectionInfo(
            connection_id=connection_id,
            user_id=user_id,
            websocket=websocket,
            rooms=set(),
            connected_at=now,
            last_activity=now,
            metadata=metadata or {}
        )
        
        self._connections[connection_id] = conn_info
        
        if user_id not in self._user_connections:
            self._user_connections[user_id] = set()
        self._user_connections[user_id].add(connection_id)
        
        await self.send_to_connection(
            connection_id,
            WSMessage(type=WSMessageType.CONNECT, payload={"connection_id": connection_id, "user_id": user_id})
        )
        
        return connection_id
    
    async def disconnect(self, connection_id: str) -> None:
        """Disconnect and cleanup WebSocket connection"""
        conn_info = self._connections.get(connection_id)
        if not conn_info:
            return
        
        for room in list(conn_info.rooms):
            await self.leave_room(connection_id, room)
        
        user_id = conn_info.user_id
        if user_id in self._user_connections:
            self._user_connections[user_id].discard(connection_id)
            if not self._user_connections[user_id]:
                del self._user_connections[user_id]
        
        del self._connections[connection_id]
        
        try:
            await conn_info.websocket.close()
        except Exception:
            pass
    
    async def join_room(self, connection_id: str, room: str) -> None:
        """Join a room for group messaging"""
        conn_info = self._connections.get(connection_id)
        if not conn_info:
            return
        
        if room not in self._rooms:
            self._rooms[room] = set()
        self._rooms[room].add(connection_id)
        conn_info.rooms.add(room)
        
        await self.broadcast_to_room(
            room,
            WSMessage(type=WSMessageType.USER_JOINED, payload={"user_id": conn_info.user_id, "connection_id": connection_id}, room=room),
            exclude=[connection_id]
        )
    
    async def leave_room(self, connection_id: str, room: str) -> None:
        """Leave a room"""
        conn_info = self._connections.get(connection_id)
        if not conn_info:
            return
        
        if room in self._rooms:
            self._rooms[room].discard(connection_id)
            if not self._rooms[room]:
                del self._rooms[room]
        
        conn_info.rooms.discard(room)
        
        await self.broadcast_to_room(
            room,
            WSMessage(type=WSMessageType.USER_LEFT, payload={"user_id": conn_info.user_id, "connection_id": connection_id}, room=room)
        )
    
    async def send_to_connection(self, connection_id: str, message: WSMessage) -> bool:
        """Send message to specific connection"""
        conn_info = self._connections.get(connection_id)
        if not conn_info:
            return False
        
        try:
            await conn_info.websocket.send_text(message.to_json())
            conn_info.last_activity = datetime.utcnow()
            return True
        except Exception as e:
            await self.disconnect(connection_id)
            return False
    
    async def send_to_user(self, user_id: str, message: WSMessage) -> int:
        """Send message to all connections of a user"""
        connection_ids = self._user_connections.get(user_id, set())
        sent_count = 0
        
        for conn_id in connection_ids:
            if await self.send_to_connection(conn_id, message):
                sent_count += 1
        
        return sent_count
    
    async def broadcast_to_room(self, room: str, message: WSMessage, exclude: List[str] = None) -> int:
        """Broadcast message to all connections in a room"""
        exclude = exclude or []
        connection_ids = self._rooms.get(room, set())
        sent_count = 0
        
        message.room = room
        
        for conn_id in connection_ids:
            if conn_id not in exclude:
                if await self.send_to_connection(conn_id, message):
                    sent_count += 1
        
        return sent_count
    
    async def broadcast_all(self, message: WSMessage, exclude: List[str] = None) -> int:
        """Broadcast message to all connections"""
        exclude = exclude or []
        sent_count = 0
        
        for conn_id in self._connections:
            if conn_id not in exclude:
                if await self.send_to_connection(conn_id, message):
                    sent_count += 1
        
        return sent_count
    
    async def handle_message(self, connection_id: str, raw_message: str) -> None:
        """Handle incoming WebSocket message"""
        conn_info = self._connections.get(connection_id)
        if not conn_info:
            return
        
        if not self._check_rate_limit(connection_id):
            await self.send_to_connection(
                connection_id,
                WSMessage(type=WSMessageType.ERROR, payload={"error": "Rate limit exceeded"})
            )
            return
        
        try:
            message = WSMessage.from_json(raw_message)
            message.sender_id = conn_info.user_id
            conn_info.last_activity = datetime.utcnow()
            await self._route_message(connection_id, message)
        except json.JSONDecodeError:
            await self.send_to_connection(
                connection_id,
                WSMessage(type=WSMessageType.ERROR, payload={"error": "Invalid JSON"})
            )
    
    async def _route_message(self, connection_id: str, message: WSMessage) -> None:
        """Route message to appropriate handler"""
        msg_type = message.type
        
        if msg_type == WSMessageType.PING:
            await self.send_to_connection(connection_id, WSMessage(type=WSMessageType.PONG, payload={}))
        elif msg_type in [WSMessageType.CURSOR_MOVED, WSMessageType.ELEMENT_ADDED, WSMessageType.ELEMENT_UPDATED, 
                          WSMessageType.ELEMENT_DELETED, WSMessageType.ELEMENT_MOVED, WSMessageType.ELEMENT_RESIZED,
                          WSMessageType.PRESENCE_UPDATE]:
            if message.room:
                await self.broadcast_to_room(message.room, message, exclude=[connection_id])
    
    async def _listen_redis(self) -> None:
        """Listen for Redis pub/sub messages"""
        try:
            async for message in self._pubsub.listen():
                if message["type"] == "message":
                    channel = message["channel"].decode()
                    data = message["data"].decode()
                    ws_message = WSMessage.from_json(data)
                    
                    if channel == "ws:broadcast":
                        for conn_id in self._connections:
                            await self.send_to_connection(conn_id, ws_message)
                    elif channel.startswith("ws:room:"):
                        room = channel.replace("ws:room:", "")
                        for conn_id in self._rooms.get(room, set()):
                            await self.send_to_connection(conn_id, ws_message)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Redis pub/sub error: {e}")
    
    def _check_rate_limit(self, connection_id: str) -> bool:
        """Check if connection is within rate limit"""
        current_count = self._message_counts.get(connection_id, 0)
        if current_count >= self._rate_limit:
            return False
        self._message_counts[connection_id] = current_count + 1
        return True
    
    async def get_room_members(self, room: str) -> List[Dict[str, Any]]:
        """Get all members in a room"""
        members = []
        for conn_id in self._rooms.get(room, set()):
            conn_info = self._connections.get(conn_id)
            if conn_info:
                members.append({
                    "connection_id": conn_id,
                    "user_id": conn_info.user_id,
                    "metadata": conn_info.metadata
                })
        return members
    
    async def get_user_presence(self, user_id: str) -> Dict[str, Any]:
        """Get user's online presence"""
        connections = self._user_connections.get(user_id, set())
        return {
            "user_id": user_id,
            "online": len(connections) > 0,
            "connection_count": len(connections),
            "connections": list(connections)
        }


# Global WebSocket manager instance
ws_manager = WebSocketManager()
