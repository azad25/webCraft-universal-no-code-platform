"""
Redis Client with Connection Pooling and Caching Utilities
Implements cache-aside pattern with automatic serialization
"""

import redis.asyncio as redis
from redis.asyncio.connection import ConnectionPool
from typing import Any, Optional, Union, List, Dict
import json
import pickle
import hashlib
from datetime import timedelta
from functools import wraps
import asyncio
from contextlib import asynccontextmanager

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


class RedisClient:
    """
    Production-grade Redis client with:
    - Connection pooling
    - Automatic reconnection
    - JSON/Pickle serialization
    - Cache decorators
    - Pub/Sub support
    - Distributed locking
    """
    
    _instance: Optional['RedisClient'] = None
    _pool: Optional[ConnectionPool] = None
    _client: Optional[redis.Redis] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    async def connect(self) -> None:
        """Initialize Redis connection pool"""
        if self._client is not None:
            return
        
        try:
            self._pool = ConnectionPool.from_url(
                settings.REDIS_URL,
                password=settings.REDIS_PASSWORD,
                db=settings.REDIS_DB,
                max_connections=50,
                decode_responses=False,  # We handle serialization ourselves
                socket_timeout=5.0,
                socket_connect_timeout=5.0,
                retry_on_timeout=True,
            )
            
            self._client = redis.Redis(connection_pool=self._pool)
            
            # Test connection
            await self._client.ping()
            logger.info("Redis connection established successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close Redis connection"""
        if self._client:
            await self._client.close()
            self._client = None
        if self._pool:
            await self._pool.disconnect()
            self._pool = None
        logger.info("Redis connection closed")
    
    @property
    def client(self) -> redis.Redis:
        """Get Redis client instance"""
        if self._client is None:
            raise RuntimeError("Redis client not initialized. Call connect() first.")
        return self._client
    
    # ==================== Basic Operations ====================
    
    async def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache with automatic deserialization"""
        try:
            value = await self.client.get(key)
            if value is None:
                return default
            return self._deserialize(value)
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return default
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        nx: bool = False,
        xx: bool = False
    ) -> bool:
        """Set value in cache with automatic serialization"""
        try:
            serialized = self._serialize(value)
            ttl = ttl or settings.REDIS_CACHE_TTL
            
            return await self.client.set(
                key,
                serialized,
                ex=ttl,
                nx=nx,
                xx=xx
            )
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False
    
    async def delete(self, *keys: str) -> int:
        """Delete one or more keys"""
        try:
            return await self.client.delete(*keys)
        except Exception as e:
            logger.error(f"Redis DELETE error: {e}")
            return 0
    
    async def exists(self, *keys: str) -> int:
        """Check if keys exist"""
        try:
            return await self.client.exists(*keys)
        except Exception as e:
            logger.error(f"Redis EXISTS error: {e}")
            return 0
    
    async def expire(self, key: str, ttl: int) -> bool:
        """Set expiration on a key"""
        try:
            return await self.client.expire(key, ttl)
        except Exception as e:
            logger.error(f"Redis EXPIRE error for key {key}: {e}")
            return False
    
    async def ttl(self, key: str) -> int:
        """Get TTL of a key"""
        try:
            return await self.client.ttl(key)
        except Exception as e:
            logger.error(f"Redis TTL error for key {key}: {e}")
            return -2
    
    # ==================== Hash Operations ====================
    
    async def hget(self, name: str, key: str) -> Any:
        """Get hash field value"""
        try:
            value = await self.client.hget(name, key)
            if value is None:
                return None
            return self._deserialize(value)
        except Exception as e:
            logger.error(f"Redis HGET error: {e}")
            return None
    
    async def hset(self, name: str, key: str, value: Any) -> int:
        """Set hash field value"""
        try:
            serialized = self._serialize(value)
            return await self.client.hset(name, key, serialized)
        except Exception as e:
            logger.error(f"Redis HSET error: {e}")
            return 0
    
    async def hgetall(self, name: str) -> Dict[str, Any]:
        """Get all hash fields"""
        try:
            data = await self.client.hgetall(name)
            return {
                k.decode() if isinstance(k, bytes) else k: self._deserialize(v)
                for k, v in data.items()
            }
        except Exception as e:
            logger.error(f"Redis HGETALL error: {e}")
            return {}
    
    async def hdel(self, name: str, *keys: str) -> int:
        """Delete hash fields"""
        try:
            return await self.client.hdel(name, *keys)
        except Exception as e:
            logger.error(f"Redis HDEL error: {e}")
            return 0
    
    # ==================== List Operations ====================
    
    async def lpush(self, key: str, *values: Any) -> int:
        """Push values to list head"""
        try:
            serialized = [self._serialize(v) for v in values]
            return await self.client.lpush(key, *serialized)
        except Exception as e:
            logger.error(f"Redis LPUSH error: {e}")
            return 0
    
    async def rpush(self, key: str, *values: Any) -> int:
        """Push values to list tail"""
        try:
            serialized = [self._serialize(v) for v in values]
            return await self.client.rpush(key, *serialized)
        except Exception as e:
            logger.error(f"Redis RPUSH error: {e}")
            return 0
    
    async def lrange(self, key: str, start: int, end: int) -> List[Any]:
        """Get list range"""
        try:
            values = await self.client.lrange(key, start, end)
            return [self._deserialize(v) for v in values]
        except Exception as e:
            logger.error(f"Redis LRANGE error: {e}")
            return []
    
    async def llen(self, key: str) -> int:
        """Get list length"""
        try:
            return await self.client.llen(key)
        except Exception as e:
            logger.error(f"Redis LLEN error: {e}")
            return 0
    
    # ==================== Set Operations ====================
    
    async def sadd(self, key: str, *values: Any) -> int:
        """Add values to set"""
        try:
            serialized = [self._serialize(v) for v in values]
            return await self.client.sadd(key, *serialized)
        except Exception as e:
            logger.error(f"Redis SADD error: {e}")
            return 0
    
    async def smembers(self, key: str) -> set:
        """Get all set members"""
        try:
            values = await self.client.smembers(key)
            return {self._deserialize(v) for v in values}
        except Exception as e:
            logger.error(f"Redis SMEMBERS error: {e}")
            return set()
    
    async def sismember(self, key: str, value: Any) -> bool:
        """Check if value is in set"""
        try:
            serialized = self._serialize(value)
            return await self.client.sismember(key, serialized)
        except Exception as e:
            logger.error(f"Redis SISMEMBER error: {e}")
            return False
    
    # ==================== Sorted Set Operations ====================
    
    async def zadd(self, key: str, mapping: Dict[Any, float]) -> int:
        """Add values to sorted set"""
        try:
            serialized_mapping = {
                self._serialize(k): v for k, v in mapping.items()
            }
            return await self.client.zadd(key, serialized_mapping)
        except Exception as e:
            logger.error(f"Redis ZADD error: {e}")
            return 0
    
    async def zrange(
        self,
        key: str,
        start: int,
        end: int,
        withscores: bool = False
    ) -> Union[List[Any], List[tuple]]:
        """Get sorted set range"""
        try:
            values = await self.client.zrange(key, start, end, withscores=withscores)
            if withscores:
                return [(self._deserialize(v), s) for v, s in values]
            return [self._deserialize(v) for v in values]
        except Exception as e:
            logger.error(f"Redis ZRANGE error: {e}")
            return []
    
    # ==================== Pub/Sub ====================
    
    async def publish(self, channel: str, message: Any) -> int:
        """Publish message to channel"""
        try:
            serialized = self._serialize(message)
            return await self.client.publish(channel, serialized)
        except Exception as e:
            logger.error(f"Redis PUBLISH error: {e}")
            return 0
    
    async def subscribe(self, *channels: str):
        """Subscribe to channels"""
        try:
            pubsub = self.client.pubsub()
            await pubsub.subscribe(*channels)
            return pubsub
        except Exception as e:
            logger.error(f"Redis SUBSCRIBE error: {e}")
            raise
    
    # ==================== Distributed Locking ====================
    
    @asynccontextmanager
    async def lock(
        self,
        name: str,
        timeout: int = 10,
        blocking: bool = True,
        blocking_timeout: Optional[float] = None
    ):
        """
        Distributed lock context manager
        
        Usage:
            async with redis_client.lock("my-lock"):
                # Critical section
                pass
        """
        lock = self.client.lock(
            f"lock:{name}",
            timeout=timeout,
            blocking=blocking,
            blocking_timeout=blocking_timeout
        )
        
        try:
            acquired = await lock.acquire()
            if not acquired:
                raise RuntimeError(f"Could not acquire lock: {name}")
            yield lock
        finally:
            try:
                await lock.release()
            except Exception:
                pass
    
    # ==================== Cache Patterns ====================
    
    async def get_or_set(
        self,
        key: str,
        factory,
        ttl: Optional[int] = None
    ) -> Any:
        """
        Cache-aside pattern: Get from cache or compute and store
        
        Args:
            key: Cache key
            factory: Async function to compute value if not cached
            ttl: Time to live in seconds
        """
        value = await self.get(key)
        if value is not None:
            return value
        
        # Compute value
        if asyncio.iscoroutinefunction(factory):
            value = await factory()
        else:
            value = factory()
        
        # Store in cache
        await self.set(key, value, ttl=ttl)
        return value
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        try:
            keys = []
            async for key in self.client.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                return await self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis invalidate pattern error: {e}")
            return 0
    
    # ==================== Serialization ====================
    
    def _serialize(self, value: Any) -> bytes:
        """Serialize value for storage"""
        try:
            # Try JSON first for simple types
            return json.dumps(value).encode('utf-8')
        except (TypeError, ValueError):
            # Fall back to pickle for complex objects
            return pickle.dumps(value)
    
    def _deserialize(self, value: bytes) -> Any:
        """Deserialize value from storage"""
        try:
            return json.loads(value.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return pickle.loads(value)
    
    # ==================== Key Generation ====================
    
    @staticmethod
    def make_key(*parts: str, prefix: str = "webcraft") -> str:
        """Generate cache key from parts"""
        return f"{prefix}:{':'.join(str(p) for p in parts)}"
    
    @staticmethod
    def hash_key(data: Any) -> str:
        """Generate hash-based cache key"""
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.md5(serialized.encode()).hexdigest()


# Cache decorator
def cached(
    key_prefix: str,
    ttl: Optional[int] = None,
    key_builder: Optional[callable] = None
):
    """
    Decorator for caching function results
    
    Usage:
        @cached("user", ttl=3600)
        async def get_user(user_id: str):
            return await db.get_user(user_id)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            redis_client = RedisClient()
            
            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                key_parts = [key_prefix]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
                cache_key = RedisClient.make_key(*key_parts)
            
            # Try to get from cache
            cached_value = await redis_client.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            await redis_client.set(cache_key, result, ttl=ttl)
            
            return result
        return wrapper
    return decorator


# Global instance
redis_client = RedisClient()


async def init_redis():
    """Initialize Redis connection"""
    await redis_client.connect()


async def close_redis():
    """Close Redis connection"""
    await redis_client.disconnect()