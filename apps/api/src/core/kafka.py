"""
Kafka client for event streaming
"""

from typing import Optional, Dict, Any
import json

from .config import settings

# Kafka producer instance
kafka_producer = None


async def init_kafka():
    """Initialize Kafka producer"""
    global kafka_producer
    try:
        from aiokafka import AIOKafkaProducer
        kafka_producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        await kafka_producer.start()
    except Exception as e:
        print(f"Kafka initialization failed: {e}")
        kafka_producer = None


async def publish_event(topic: str, event: Dict[str, Any], key: str = None):
    """Publish event to Kafka topic"""
    global kafka_producer
    if kafka_producer is None:
        return False
    
    try:
        await kafka_producer.send_and_wait(
            topic,
            value=event,
            key=key.encode('utf-8') if key else None
        )
        return True
    except Exception as e:
        print(f"Failed to publish event: {e}")
        return False


async def shutdown_kafka():
    """Shutdown Kafka producer"""
    global kafka_producer
    if kafka_producer:
        await kafka_producer.stop()
