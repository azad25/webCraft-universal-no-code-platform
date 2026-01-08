"""
Redis client configuration for WebCraft platform
Used for caching, sessions, and real-time features
"""

import redis.asyncio as redis
import os
import json
from typing import Optional, Any, Dict
import logging

logger = logging.getLogger(__name__)

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Global Redis client
_redis_client: Optional[redis.Redis] = None


async def init_redis():
    """Initialize Redis connection"""
    global _redis_client
    
    try:
        _redis_client = redis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30
        )
        
        # Test connection
        await _redis_client.ping()
        logger.info("Redis connection established successfully")
        
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        raise


def get_redis_client() -> redis.Redis:
    """Get Redis client instance"""
    if _redis_client is None:
        raise RuntimeError("Redis client not initialized. Call init_redis() first.")
    return _redis_client


class RedisService:
    """Redis service wrapper with common operations"""
    
    def __init__(self):
        self.redis = get_redis_client()
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set a key-value pair with optional TTL"""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            
            if ttl:
                return await self.redis.setex(key, ttl, value)
            else:
                return await self.redis.set(key, value)
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value by key"""
        try:
            value = await self.redis.get(key)
            if value is None:
                return None
            
            # Try to parse as JSON
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None
    
    async def delete(self, key: str) -> bool:
        """Delete a key"""
        try:
            result = await self.redis.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            return await self.redis.exists(key) > 0
        except Exception as e:
            logger.error(f"Redis EXISTS error for key {key}: {e}")
            return False
    
    async def expire(self, key: str, ttl: int) -> bool:
        """Set TTL for existing key"""
        try:
            return await self.redis.expire(key, ttl)
        except Exception as e:
            logger.error(f"Redis EXPIRE error for key {key}: {e}")
            return False
    
    async def ttl(self, key: str) -> int:
        """Get TTL for key"""
        try:
            return await self.redis.ttl(key)
        except Exception as e:
            logger.error(f"Redis TTL error for key {key}: {e}")
            return -1
    
    async def incr(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment counter"""
        try:
            return await self.redis.incrby(key, amount)
        except Exception as e:
            logger.error(f"Redis INCR error for key {key}: {e}")
            return None
    
    async def decr(self, key: str, amount: int = 1) -> Optional[int]:
        """Decrement counter"""
        try:
            return await self.redis.decrby(key, amount)
        except Exception as e:
            logger.error(f"Redis DECR error for key {key}: {e}")
            return None
    
    # Hash operations
    async def hset(self, key: str, field: str, value: Any) -> bool:
        """Set hash field"""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            return await self.redis.hset(key, field, value)
        except Exception as e:
            logger.error(f"Redis HSET error for key {key}, field {field}: {e}")
            return False
    
    async def hget(self, key: str, field: str) -> Optional[Any]:
        """Get hash field"""
        try:
            value = await self.redis.hget(key, field)
            if value is None:
                return None
            
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            logger.error(f"Redis HGET error for key {key}, field {field}: {e}")
            return None
    
    async def hgetall(self, key: str) -> Dict[str, Any]:
        """Get all hash fields"""
        try:
            data = await self.redis.hgetall(key)
            result = {}
            for field, value in data.items():
                try:
                    result[field] = json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    result[field] = value
            return result
        except Exception as e:
            logger.error(f"Redis HGETALL error for key {key}: {e}")
            return {}
    
    async def hdel(self, key: str, field: str) -> bool:
        """Delete hash field"""
        try:
            result = await self.redis.hdel(key, field)
            return result > 0
        except Exception as e:
            logger.error(f"Redis HDEL error for key {key}, field {field}: {e}")
            return False
    
    # List operations
    async def lpush(self, key: str, *values) -> Optional[int]:
        """Push to left of list"""
        try:
            serialized_values = []
            for value in values:
                if isinstance(value, (dict, list)):
                    serialized_values.append(json.dumps(value))
                else:
                    serialized_values.append(value)
            return await self.redis.lpush(key, *serialized_values)
        except Exception as e:
            logger.error(f"Redis LPUSH error for key {key}: {e}")
            return None
    
    async def rpush(self, key: str, *values) -> Optional[int]:
        """Push to right of list"""
        try:
            serialized_values = []
            for value in values:
                if isinstance(value, (dict, list)):
                    serialized_values.append(json.dumps(value))
                else:
                    serialized_values.append(value)
            return await self.redis.rpush(key, *serialized_values)
        except Exception as e:
            logger.error(f"Redis RPUSH error for key {key}: {e}")
            return None
    
    async def lpop(self, key: str) -> Optional[Any]:
        """Pop from left of list"""
        try:
            value = await self.redis.lpop(key)
            if value is None:
                return None
            
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            logger.error(f"Redis LPOP error for key {key}: {e}")
            return None
    
    async def rpop(self, key: str) -> Optional[Any]:
        """Pop from right of list"""
        try:
            value = await self.redis.rpop(key)
            if value is None:
                return None
            
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            logger.error(f"Redis RPOP error for key {key}: {e}")
            return None
    
    async def lrange(self, key: str, start: int = 0, end: int = -1) -> list:
        """Get list range"""
        try:
            values = await self.redis.lrange(key, start, end)
            result = []
            for value in values:
                try:
                    result.append(json.loads(value))
                except (json.JSONDecodeError, TypeError):
                    result.append(value)
            return result
        except Exception as e:
            logger.error(f"Redis LRANGE error for key {key}: {e}")
            return []
    
    # Set operations
    async def sadd(self, key: str, *members) -> Optional[int]:
        """Add to set"""
        try:
            serialized_members = []
            for member in members:
                if isinstance(member, (dict, list)):
                    serialized_members.append(json.dumps(member))
                else:
                    serialized_members.append(member)
            return await self.redis.sadd(key, *serialized_members)
        except Exception as e:
            logger.error(f"Redis SADD error for key {key}: {e}")
            return None
    
    async def srem(self, key: str, *members) -> Optional[int]:
        """Remove from set"""
        try:
            serialized_members = []
            for member in members:
                if isinstance(member, (dict, list)):
                    serialized_members.append(json.dumps(member))
                else:
                    serialized_members.append(member)
            return await self.redis.srem(key, *serialized_members)
        except Exception as e:
            logger.error(f"Redis SREM error for key {key}: {e}")
            return None
    
    async def smembers(self, key: str) -> set:
        """Get all set members"""
        try:
            members = await self.redis.smembers(key)
            result = set()
            for member in members:
                try:
                    result.add(json.loads(member))
                except (json.JSONDecodeError, TypeError):
                    result.add(member)
            return result
        except Exception as e:
            logger.error(f"Redis SMEMBERS error for key {key}: {e}")
            return set()
    
    async def sismember(self, key: str, member: Any) -> bool:
        """Check if member in set"""
        try:
            if isinstance(member, (dict, list)):
                member = json.dumps(member)
            return await self.redis.sismember(key, member)
        except Exception as e:
            logger.error(f"Redis SISMEMBER error for key {key}: {e}")
            return False
    
    # Pub/Sub operations
    async def publish(self, channel: str, message: Any) -> Optional[int]:
        """Publish message to channel"""
        try:
            if isinstance(message, (dict, list)):
                message = json.dumps(message)
            return await self.redis.publish(channel, message)
        except Exception as e:
            logger.error(f"Redis PUBLISH error for channel {channel}: {e}")
            return None
    
    # Cache helpers
    async def cache_get_or_set(self, key: str, func, ttl: int = 3600, *args, **kwargs):
        """Get from cache or set if not exists"""
        value = await self.get(key)
        if value is not None:
            return value
        
        # Generate value
        if callable(func):
            if asyncio.iscoroutinefunction(func):
                value = await func(*args, **kwargs)
            else:
                value = func(*args, **kwargs)
        else:
            value = func
        
        # Cache the value
        await self.set(key, value, ttl)
        return value
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """Delete keys matching pattern"""
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                return await self.redis.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis pattern invalidation error for {pattern}: {e}")
            return 0


# Import asyncio for cache helper
import asyncio

# Create a global redis client instance for backward compatibility
class RedisClientWrapper:
    def __init__(self):
        self._client = None
    
    def __getattr__(self, name):
        if self._client is None:
            self._client = get_redis_client()
        return getattr(self._client, name)

redis_client = RedisClientWrapper()