"""
Kafka Client for Event-Driven Architecture
Implements producer/consumer patterns with automatic serialization
"""

from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from aiokafka.errors import KafkaError
from typing import Any, Dict, List, Optional, Callable, Awaitable
import json
import asyncio
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


class EventType(str, Enum):
    """Event types for the platform"""
    # User Events
    USER_CREATED = "user.created"
    USER_UPDATED = "user.updated"
    USER_DELETED = "user.deleted"
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    
    # App Events
    APP_CREATED = "app.created"
    APP_UPDATED = "app.updated"
    APP_DELETED = "app.deleted"
    APP_PUBLISHED = "app.published"
    APP_UNPUBLISHED = "app.unpublished"
    
    # Deployment Events
    DEPLOYMENT_STARTED = "deployment.started"
    DEPLOYMENT_COMPLETED = "deployment.completed"
    DEPLOYMENT_FAILED = "deployment.failed"
    
    # Payment Events
    PAYMENT_SUCCEEDED = "payment.succeeded"
    PAYMENT_FAILED = "payment.failed"
    SUBSCRIPTION_CREATED = "subscription.created"
    SUBSCRIPTION_CANCELLED = "subscription.cancelled"
    
    # AI Events
    AI_GENERATION_STARTED = "ai.generation.started"
    AI_GENERATION_COMPLETED = "ai.generation.completed"
    AI_GENERATION_FAILED = "ai.generation.failed"
    
    # Email Events
    EMAIL_SENT = "email.sent"
    EMAIL_FAILED = "email.failed"
    EMAIL_OPENED = "email.opened"
    EMAIL_CLICKED = "email.clicked"
    
    # Analytics Events
    PAGE_VIEW = "analytics.page_view"
    WIDGET_INTERACTION = "analytics.widget_interaction"
    CONVERSION = "analytics.conversion"
    
    # System Events
    SYSTEM_ERROR = "system.error"
    SYSTEM_WARNING = "system.warning"
    CACHE_INVALIDATED = "cache.invalidated"


@dataclass
class Event:
    """Base event structure"""
    event_id: str
    event_type: str
    timestamp: str
    source: str
    data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None
    
    @classmethod
    def create(
        cls,
        event_type: EventType,
        data: Dict[str, Any],
        source: str = "webcraft-api",
        metadata: Optional[Dict[str, Any]] = None
    ) -> 'Event':
        return cls(
            event_id=str(uuid.uuid4()),
            event_type=event_type.value,
            timestamp=datetime.utcnow().isoformat(),
            source=source,
            data=data,
            metadata=metadata or {}
        )
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_json(cls, json_str: str) -> 'Event':
        data = json.loads(json_str)
        return cls(**data)


class KafkaProducerClient:
    """
    Kafka Producer with:
    - Automatic serialization
    - Retry logic
    - Batch sending
    - Compression
    """
    
    _instance: Optional['KafkaProducerClient'] = None
    _producer: Optional[AIOKafkaProducer] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    async def connect(self) -> None:
        """Initialize Kafka producer"""
        if self._producer is not None:
            return
        
        try:
            self._producer = AIOKafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                compression_type='gzip',
                acks='all',  # Wait for all replicas
                retry_backoff_ms=100,
                max_batch_size=16384,
                linger_ms=10,  # Batch for 10ms
            )
            
            await self._producer.start()
            logger.info("Kafka producer connected successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect Kafka producer: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close Kafka producer"""
        if self._producer:
            await self._producer.stop()
            self._producer = None
        logger.info("Kafka producer disconnected")
    
    @property
    def producer(self) -> AIOKafkaProducer:
        if self._producer is None:
            raise RuntimeError("Kafka producer not initialized")
        return self._producer
    
    async def send(
        self,
        topic: str,
        event: Event,
        key: Optional[str] = None,
        partition: Optional[int] = None
    ) -> None:
        """Send event to Kafka topic"""
        if self._producer is None:
            logger.debug(f"Kafka not available, skipping event: {event.event_type}")
            return
            
        try:
            await self.producer.send_and_wait(
                topic=topic,
                value=event.to_dict(),
                key=key or event.event_id,
                partition=partition
            )
            logger.debug(f"Event sent to {topic}: {event.event_type}")
            
        except KafkaError as e:
            logger.error(f"Failed to send event to {topic}: {e}")
            raise
    
    async def send_batch(
        self,
        topic: str,
        events: List[Event]
    ) -> None:
        """Send batch of events"""
        try:
            batch = self.producer.create_batch()
            
            for event in events:
                metadata = batch.append(
                    key=event.event_id.encode('utf-8'),
                    value=event.to_json().encode('utf-8'),
                    timestamp=None
                )
                if metadata is None:
                    # Batch is full, send and create new
                    await self.producer.send_batch(batch, topic)
                    batch = self.producer.create_batch()
                    batch.append(
                        key=event.event_id.encode('utf-8'),
                        value=event.to_json().encode('utf-8'),
                        timestamp=None
                    )
            
            # Send remaining
            if batch.record_count() > 0:
                await self.producer.send_batch(batch, topic)
            
            logger.debug(f"Batch of {len(events)} events sent to {topic}")
            
        except KafkaError as e:
            logger.error(f"Failed to send batch to {topic}: {e}")
            raise


class KafkaConsumerClient:
    """
    Kafka Consumer with:
    - Automatic deserialization
    - Consumer groups
    - Offset management
    - Error handling
    """
    
    def __init__(
        self,
        topics: List[str],
        group_id: Optional[str] = None,
        auto_offset_reset: str = 'earliest'
    ):
        self.topics = topics
        self.group_id = group_id or settings.KAFKA_CONSUMER_GROUP
        self.auto_offset_reset = auto_offset_reset
        self._consumer: Optional[AIOKafkaConsumer] = None
        self._handlers: Dict[str, List[Callable[[Event], Awaitable[None]]]] = {}
        self._running = False
    
    async def connect(self) -> None:
        """Initialize Kafka consumer"""
        try:
            self._consumer = AIOKafkaConsumer(
                *self.topics,
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                group_id=self.group_id,
                auto_offset_reset=self.auto_offset_reset,
                enable_auto_commit=True,
                auto_commit_interval_ms=5000,
                value_deserializer=lambda v: json.loads(v.decode('utf-8')),
                key_deserializer=lambda k: k.decode('utf-8') if k else None,
            )
            
            await self._consumer.start()
            logger.info(f"Kafka consumer connected to topics: {self.topics}")
            
        except Exception as e:
            logger.error(f"Failed to connect Kafka consumer: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close Kafka consumer"""
        self._running = False
        if self._consumer:
            await self._consumer.stop()
            self._consumer = None
        logger.info("Kafka consumer disconnected")
    
    def register_handler(
        self,
        event_type: EventType,
        handler: Callable[[Event], Awaitable[None]]
    ) -> None:
        """Register event handler"""
        event_type_str = event_type.value
        if event_type_str not in self._handlers:
            self._handlers[event_type_str] = []
        self._handlers[event_type_str].append(handler)
        logger.debug(f"Handler registered for {event_type_str}")
    
    async def start_consuming(self) -> None:
        """Start consuming messages"""
        if self._consumer is None:
            raise RuntimeError("Consumer not connected")
        
        self._running = True
        logger.info("Starting Kafka consumer...")
        
        try:
            async for message in self._consumer:
                if not self._running:
                    break
                
                try:
                    event = Event(**message.value)
                    await self._process_event(event)
                    
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    # Could implement dead letter queue here
                    
        except Exception as e:
            logger.error(f"Consumer error: {e}")
            raise
    
    async def _process_event(self, event: Event) -> None:
        """Process event with registered handlers"""
        handlers = self._handlers.get(event.event_type, [])
        
        if not handlers:
            logger.debug(f"No handlers for event type: {event.event_type}")
            return
        
        for handler in handlers:
            try:
                await handler(event)
            except Exception as e:
                logger.error(f"Handler error for {event.event_type}: {e}")


# Topic definitions
class Topics:
    """Kafka topic names"""
    USER_EVENTS = "webcraft.user.events"
    APP_EVENTS = "webcraft.app.events"
    DEPLOYMENT_EVENTS = "webcraft.deployment.events"
    PAYMENT_EVENTS = "webcraft.payment.events"
    AI_EVENTS = "webcraft.ai.events"
    EMAIL_EVENTS = "webcraft.email.events"
    ANALYTICS_EVENTS = "webcraft.analytics.events"
    SYSTEM_EVENTS = "webcraft.system.events"
    
    # Dead letter queues
    DLQ_USER_EVENTS = "webcraft.dlq.user.events"
    DLQ_APP_EVENTS = "webcraft.dlq.app.events"


# Event Publisher Helper
class EventPublisher:
    """High-level event publishing interface"""
    
    def __init__(self):
        self.producer = KafkaProducerClient()
    
    async def publish_user_event(
        self,
        event_type: EventType,
        user_id: str,
        data: Dict[str, Any]
    ) -> None:
        """Publish user-related event"""
        event = Event.create(
            event_type=event_type,
            data={"user_id": user_id, **data}
        )
        await self.producer.send(Topics.USER_EVENTS, event, key=user_id)
    
    async def publish_app_event(
        self,
        event_type: EventType,
        app_id: str,
        user_id: str,
        data: Dict[str, Any]
    ) -> None:
        """Publish app-related event"""
        event = Event.create(
            event_type=event_type,
            data={"app_id": app_id, "user_id": user_id, **data}
        )
        await self.producer.send(Topics.APP_EVENTS, event, key=app_id)
    
    async def publish_deployment_event(
        self,
        event_type: EventType,
        deployment_id: str,
        app_id: str,
        data: Dict[str, Any]
    ) -> None:
        """Publish deployment-related event"""
        event = Event.create(
            event_type=event_type,
            data={"deployment_id": deployment_id, "app_id": app_id, **data}
        )
        await self.producer.send(Topics.DEPLOYMENT_EVENTS, event, key=deployment_id)
    
    async def publish_payment_event(
        self,
        event_type: EventType,
        user_id: str,
        data: Dict[str, Any]
    ) -> None:
        """Publish payment-related event"""
        event = Event.create(
            event_type=event_type,
            data={"user_id": user_id, **data}
        )
        await self.producer.send(Topics.PAYMENT_EVENTS, event, key=user_id)
    
    async def publish_analytics_event(
        self,
        event_type: EventType,
        app_id: str,
        data: Dict[str, Any]
    ) -> None:
        """Publish analytics event"""
        event = Event.create(
            event_type=event_type,
            data={"app_id": app_id, **data}
        )
        await self.producer.send(Topics.ANALYTICS_EVENTS, event, key=app_id)


# Global instances
kafka_producer = KafkaProducerClient()
event_publisher = EventPublisher()


async def init_kafka():
    """Initialize Kafka connections"""
    try:
        await kafka_producer.connect()
        logger.info("Kafka producer initialized successfully")
    except Exception as e:
        logger.warning(f"Kafka not available, running without event streaming: {e}")
        # Continue without Kafka for development


async def close_kafka():
    """Close Kafka connections"""
    await kafka_producer.disconnect()