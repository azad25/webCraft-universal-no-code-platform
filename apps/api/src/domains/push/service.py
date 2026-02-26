"""Push notification service"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import json
import asyncio
import aiohttp
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.backends import default_backend
import base64

from .models import PushSubscription, PushNotification, PushDelivery
from .schemas import (
    PushSubscriptionCreate, PushSubscriptionResponse,
    PushNotificationCreate, PushNotificationResponse,
    BroadcastRequest, PushStatsResponse
)
from src.domains.apps.models import App


class PushService:
    def __init__(self, db: Session):
        self.db = db
    
    # Subscription management
    async def create_subscription(self, app_id: str, user_id: str, data: PushSubscriptionCreate) -> PushSubscriptionResponse:
        """Create a push subscription"""
        # Verify app ownership
        app = self.db.query(App).filter(
            App.id == app_id,
            App.owner_id == user_id
        ).first()
        
        if not app:
            raise ValueError("App not found")
        
        # Check if subscription already exists
        existing = self.db.query(PushSubscription).filter(
            PushSubscription.app_id == app_id,
            PushSubscription.endpoint == data.endpoint
        ).first()
        
        if existing:
            # Update existing subscription
            existing.p256dh_key = data.p256dh_key
            existing.auth_key = data.auth_key
            existing.is_active = True
            existing.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(existing)
            
            return PushSubscriptionResponse.from_orm(existing)
        
        # Create new subscription
        subscription = PushSubscription(
            app_id=app_id,
            **data.dict()
        )
        
        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)
        
        return PushSubscriptionResponse.from_orm(subscription)
    
    async def list_subscriptions(self, app_id: str, user_id: str) -> List[PushSubscriptionResponse]:
        """List all subscriptions for an app"""
        subscriptions = self.db.query(PushSubscription).join(App).filter(
            PushSubscription.app_id == app_id,
            App.owner_id == user_id,
            PushSubscription.is_active == True
        ).order_by(PushSubscription.created_at).all()
        
        return [PushSubscriptionResponse.from_orm(sub) for sub in subscriptions]
    
    async def unsubscribe(self, app_id: str, subscription_id: str, user_id: str) -> bool:
        """Unsubscribe from push notifications"""
        subscription = self.db.query(PushSubscription).join(App).filter(
            PushSubscription.id == subscription_id,
            PushSubscription.app_id == app_id,
            App.owner_id == user_id
        ).first()
        
        if not subscription:
            return False
        
        subscription.is_active = False
        subscription.updated_at = datetime.utcnow()
        
        self.db.commit()
        return True
    
    # Notification management
    async def create_notification(self, app_id: str, user_id: str, data: PushNotificationCreate) -> PushNotificationResponse:
        """Create a push notification"""
        # Verify app ownership
        app = self.db.query(App).filter(
            App.id == app_id,
            App.owner_id == user_id
        ).first()
        
        if not app:
            raise ValueError("App not found")
        
        notification = PushNotification(
            app_id=app_id,
            **data.dict()
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        return PushNotificationResponse.from_orm(notification)
    
    async def broadcast_notification(self, app_id: str, user_id: str, data: BroadcastRequest) -> Dict[str, Any]:
        """Broadcast a notification to subscribers"""
        # Create the notification
        notification = await self.create_notification(app_id, user_id, data.notification)
        
        # Get target subscriptions
        if data.target_all:
            subscriptions = self.db.query(PushSubscription).filter(
                PushSubscription.app_id == app_id,
                PushSubscription.is_active == True
            ).all()
        else:
            subscriptions = self.db.query(PushSubscription).filter(
                PushSubscription.app_id == app_id,
                PushSubscription.id.in_(data.target_subscriptions),
                PushSubscription.is_active == True
            ).all()
        
        if not subscriptions:
            return {
                "notification_id": str(notification.id),
                "message": "No active subscriptions found",
                "sent_count": 0
            }
        
        # Create delivery records
        deliveries = []
        for subscription in subscriptions:
            delivery = PushDelivery(
                notification_id=notification.id,
                subscription_id=subscription.id
            )
            deliveries.append(delivery)
        
        self.db.add_all(deliveries)
        self.db.commit()
        
        # Send notifications asynchronously
        asyncio.create_task(self._send_notifications(notification, subscriptions))
        
        # Update notification status
        notification.status = "sent"
        notification.sent_at = datetime.utcnow()
        notification.sent_count = len(subscriptions)
        
        self.db.commit()
        
        return {
            "notification_id": str(notification.id),
            "message": "Notification broadcast initiated",
            "sent_count": len(subscriptions)
        }
    
    async def _send_notifications(self, notification: PushNotification, subscriptions: List[PushSubscription]):
        """Send push notifications to subscriptions"""
        async with aiohttp.ClientSession() as session:
            tasks = []
            
            for subscription in subscriptions:
                task = self._send_single_notification(session, notification, subscription)
                tasks.append(task)
            
            # Send all notifications concurrently
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _send_single_notification(self, session: aiohttp.ClientSession, notification: PushNotification, subscription: PushSubscription):
        """Send a single push notification"""
        try:
            # Prepare payload
            payload = {
                "title": notification.title,
                "body": notification.body,
                "icon": notification.icon,
                "badge": notification.badge,
                "image": notification.image,
                "tag": notification.tag,
                "url": notification.url,
                "actions": notification.actions
            }
            
            # Prepare headers
            headers = {
                "Content-Type": "application/json",
                "TTL": str(notification.ttl),
                "Urgency": notification.urgency
            }
            
            # Send notification
            async with session.post(
                subscription.endpoint,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                
                # Update delivery status
                delivery = self.db.query(PushDelivery).filter(
                    PushDelivery.notification_id == notification.id,
                    PushDelivery.subscription_id == subscription.id
                ).first()
                
                if delivery:
                    delivery.status = "sent" if response.status < 400 else "failed"
                    delivery.response_code = response.status
                    delivery.sent_at = datetime.utcnow()
                    
                    if response.status >= 400:
                        delivery.error_message = f"HTTP {response.status}"
                    
                    self.db.commit()
        
        except Exception as e:
            # Update delivery status on error
            delivery = self.db.query(PushDelivery).filter(
                PushDelivery.notification_id == notification.id,
                PushDelivery.subscription_id == subscription.id
            ).first()
            
            if delivery:
                delivery.status = "failed"
                delivery.error_message = str(e)
                delivery.sent_at = datetime.utcnow()
                
                self.db.commit()
    
    async def list_notifications(self, app_id: str, user_id: str, page: int = 1, per_page: int = 50) -> Dict[str, Any]:
        """List notifications for an app"""
        query = self.db.query(PushNotification).join(App).filter(
            PushNotification.app_id == app_id,
            App.owner_id == user_id
        )
        
        total = query.count()
        
        notifications = query.order_by(desc(PushNotification.created_at)).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        return {
            "notifications": [PushNotificationResponse.from_orm(notif) for notif in notifications],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    
    async def get_push_stats(self, app_id: str, user_id: str) -> PushStatsResponse:
        """Get push notification statistics"""
        # Basic stats
        total_subscriptions = self.db.query(PushSubscription).join(App).filter(
            PushSubscription.app_id == app_id,
            App.owner_id == user_id
        ).count()
        
        active_subscriptions = self.db.query(PushSubscription).join(App).filter(
            PushSubscription.app_id == app_id,
            App.owner_id == user_id,
            PushSubscription.is_active == True
        ).count()
        
        total_notifications = self.db.query(PushNotification).join(App).filter(
            PushNotification.app_id == app_id,
            App.owner_id == user_id
        ).count()
        
        # Time-based stats
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        notifications_today = self.db.query(PushNotification).join(App).filter(
            PushNotification.app_id == app_id,
            App.owner_id == user_id,
            PushNotification.created_at >= today
        ).count()
        
        notifications_week = self.db.query(PushNotification).join(App).filter(
            PushNotification.app_id == app_id,
            App.owner_id == user_id,
            PushNotification.created_at >= week_ago
        ).count()
        
        notifications_month = self.db.query(PushNotification).join(App).filter(
            PushNotification.app_id == app_id,
            App.owner_id == user_id,
            PushNotification.created_at >= month_ago
        ).count()
        
        # Calculate rates
        total_sent = self.db.query(func.sum(PushNotification.sent_count)).join(App).filter(
            PushNotification.app_id == app_id,
            App.owner_id == user_id
        ).scalar() or 0
        
        total_delivered = self.db.query(func.sum(PushNotification.delivered_count)).join(App).filter(
            PushNotification.app_id == app_id,
            App.owner_id == user_id
        ).scalar() or 0
        
        total_clicked = self.db.query(func.sum(PushNotification.clicked_count)).join(App).filter(
            PushNotification.app_id == app_id,
            App.owner_id == user_id
        ).scalar() or 0
        
        delivery_rate = (total_delivered / total_sent * 100) if total_sent > 0 else 0
        click_rate = (total_clicked / total_delivered * 100) if total_delivered > 0 else 0
        
        return PushStatsResponse(
            total_subscriptions=total_subscriptions,
            active_subscriptions=active_subscriptions,
            total_notifications=total_notifications,
            notifications_sent_today=notifications_today,
            notifications_sent_this_week=notifications_week,
            notifications_sent_this_month=notifications_month,
            average_delivery_rate=round(delivery_rate, 2),
            average_click_rate=round(click_rate, 2)
        )