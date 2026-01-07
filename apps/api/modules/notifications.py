"""
Notification Module - Multi-channel notifications
"""

from typing import Dict, List, Any
from core.module_system import BaseModule, ModuleMetadata, ModuleType
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import uuid


class Notification(BaseModel):
    id: str = None
    channel: str  # email, sms, push, in_app, slack
    recipient: str
    title: str
    body: str
    data: Dict = {}
    status: str = "pending"
    sent_at: datetime = None


class NotificationModule(BaseModule):
    """Multi-channel notification system"""
    
    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            id="core.notifications",
            name="Notifications",
            version="1.0.0",
            type=ModuleType.NOTIFICATION,
            description="Email, SMS, Push, Slack notifications",
            author="WebCraft",
            dependencies=[],
            is_premium=False
        )
    
    async def initialize(self) -> bool:
        self._notifications: List[Notification] = []
        self._templates: Dict[str, Dict] = {}
        self._channels = {
            "email": {"provider": "sendgrid", "enabled": True},
            "sms": {"provider": "twilio", "enabled": True},
            "push": {"provider": "firebase", "enabled": True},
            "in_app": {"provider": "internal", "enabled": True},
            "slack": {"provider": "slack", "enabled": False}
        }
        self._initialized = True
        return True
    
    async def shutdown(self) -> bool:
        self._initialized = False
        return True
    
    async def send(self, notification: Notification) -> Notification:
        notification.id = str(uuid.uuid4())
        notification.sent_at = datetime.utcnow()
        notification.status = "sent"
        self._notifications.append(notification)
        await self.trigger_hook("notification.sent", notification)
        return notification
    
    async def send_bulk(self, notifications: List[Notification]) -> List[Notification]:
        results = []
        for n in notifications:
            results.append(await self.send(n))
        return results
    
    def get_routes(self) -> List[APIRouter]:
        router = APIRouter(prefix="/notifications", tags=["Notifications"])
        
        @router.get("/channels")
        async def list_channels():
            return {"channels": self._channels}
        
        @router.post("/send")
        async def send_notification(notification: Notification):
            return await self.send(notification)
        
        @router.post("/send-bulk")
        async def send_bulk(notifications: List[Notification]):
            return {"sent": await self.send_bulk(notifications)}
        
        @router.get("/history")
        async def get_history(limit: int = 50):
            return {"notifications": self._notifications[-limit:]}
        
        return [router]
