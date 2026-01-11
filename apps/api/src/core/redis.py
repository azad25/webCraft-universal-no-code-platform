"""
Redis client for caching and session management
"""

import redis.asyncio as redis
from typing import Optional, Any
import json

from .config import settings

# Redis client instance
redis_client: Optional[redis.Redis] = None


async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client


async def get_redis() -> redis.Redis:
    """Get Redis client"""
    global redis_client
    if redis_client is None:
        await init_redis()
    return redis_client


async def cache_get(key: str) -> Optional[Any]:
    """Get value from cache"""
    client = await get_redis()
    value = await client.get(key)
    if value:
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return None


async def cache_set(key: str, value: Any, ttl: int = None) -> bool:
    """Set value in cache"""
    client = await get_redis()
    ttl = ttl or settings.REDIS_CACHE_TTL
    if isinstance(value, (dict, list)):
        value = json.dumps(value)
    await client.set(key, value, ex=ttl)
    return True


async def cache_delete(key: str) -> bool:
    """Delete value from cache"""
    client = await get_redis()
    await client.delete(key)
    return True


async def cache_invalidate_pattern(pattern: str) -> int:
    """Invalidate all keys matching pattern"""
    client = await get_redis()
    keys = await client.keys(pattern)
    if keys:
        return await client.delete(*keys)
    return 0
