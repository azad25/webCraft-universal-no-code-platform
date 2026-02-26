"""Push notification models"""
from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from src.core.database import Base


class PushSubscription(Base):
    """Push notification subscriptions"""
    __tablename__ = "push_subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Subscription details
    endpoint = Column(String(500), nullable=False)
    p256dh_key = Column(String(255), nullable=False)
    auth_key = Column(String(255), nullable=False)
    
    # User info
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime, nullable=True)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_push_subscription_app', 'app_id'),
        Index('idx_push_subscription_endpoint', 'endpoint'),
        Index('idx_push_subscription_active', 'is_active'),
    )


class PushNotification(Base):
    """Push notification messages"""
    __tablename__ = "push_notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Message content
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    icon = Column(String(500), nullable=True)
    badge = Column(String(500), nullable=True)
    image = Column(String(500), nullable=True)
    
    # Notification options
    tag = Column(String(100), nullable=True)
    url = Column(String(500), nullable=True)  # URL to open when clicked
    actions = Column(JSONB, default=[])  # Action buttons
    
    # Delivery settings
    ttl = Column(Integer, default=86400)  # Time to live in seconds
    urgency = Column(String(20), default="normal")  # low, normal, high
    
    # Status
    status = Column(String(20), default="pending")  # pending, sent, failed
    sent_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Statistics
    sent_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    clicked_count = Column(Integer, default=0)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_push_notification_app', 'app_id'),
        Index('idx_push_notification_status', 'status'),
        Index('idx_push_notification_sent', 'sent_at'),
    )


class PushDelivery(Base):
    """Individual push notification deliveries"""
    __tablename__ = "push_deliveries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relationships
    notification_id = Column(UUID(as_uuid=True), ForeignKey("push_notifications.id"), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("push_subscriptions.id"), nullable=False)
    
    # Delivery status
    status = Column(String(20), default="pending")  # pending, sent, delivered, failed, clicked
    response_code = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    notification = relationship("PushNotification")
    subscription = relationship("PushSubscription")
    
    # Indexes
    __table_args__ = (
        Index('idx_push_delivery_notification', 'notification_id'),
        Index('idx_push_delivery_subscription', 'subscription_id'),
        Index('idx_push_delivery_status', 'status'),
    )