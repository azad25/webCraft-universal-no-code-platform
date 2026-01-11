"""
Rate Limiting Middleware
Implements tiered rate limiting based on user subscription
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from datetime import datetime, timedelta
from typing import Dict, Optional
import asyncio


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with tiered limits"""
    
    def __init__(self, app):
        super().__init__(app)
        self._requests: Dict[str, list] = {}
        self._cleanup_task = None
        
        # Rate limits per tier (requests per hour)
        self.limits = {
            "free": 1000,
            "pro": 10000,
            "enterprise": 100000,
            "anonymous": 100
        }
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for certain paths
        if self._should_skip(request.url.path):
            return await call_next(request)
        
        # Get client identifier
        client_id = self._get_client_id(request)
        tier = self._get_tier(request)
        
        # Check rate limit
        if not self._check_rate_limit(client_id, tier):
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"You have exceeded the rate limit of {self.limits[tier]} requests per hour",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )
        
        # Record request
        self._record_request(client_id)
        
        # Add rate limit headers
        response = await call_next(request)
        remaining = self._get_remaining(client_id, tier)
        response.headers["X-RateLimit-Limit"] = str(self.limits[tier])
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int((datetime.utcnow() + timedelta(hours=1)).timestamp()))
        
        return response
    
    def _should_skip(self, path: str) -> bool:
        """Skip rate limiting for certain paths"""
        skip_paths = ["/health", "/docs", "/redoc", "/openapi.json", "/"]
        return path in skip_paths
    
    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier"""
        # Try to get from auth token
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return f"token:{auth_header[7:20]}"
        
        # Fall back to IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        
        return f"ip:{request.client.host if request.client else 'unknown'}"
    
    def _get_tier(self, request: Request) -> str:
        """Get user tier from request"""
        # Would check user subscription from token
        # For now, return based on auth presence
        if request.headers.get("Authorization"):
            return "pro"  # Would check actual tier
        return "anonymous"
    
    def _check_rate_limit(self, client_id: str, tier: str) -> bool:
        """Check if client is within rate limit"""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        
        # Get requests in last hour
        requests = self._requests.get(client_id, [])
        recent_requests = [r for r in requests if r > hour_ago]
        
        return len(recent_requests) < self.limits[tier]
    
    def _record_request(self, client_id: str):
        """Record a request"""
        now = datetime.utcnow()
        
        if client_id not in self._requests:
            self._requests[client_id] = []
        
        self._requests[client_id].append(now)
        
        # Cleanup old entries
        hour_ago = now - timedelta(hours=1)
        self._requests[client_id] = [r for r in self._requests[client_id] if r > hour_ago]
    
    def _get_remaining(self, client_id: str, tier: str) -> int:
        """Get remaining requests"""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        
        requests = self._requests.get(client_id, [])
        recent_count = len([r for r in requests if r > hour_ago])
        
        return max(0, self.limits[tier] - recent_count)