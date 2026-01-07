"""
Data Sources Module - Connect to third-party APIs as data sources
"""

from typing import Dict, List, Any, Optional
from enum import Enum
from core.module_system import BaseModule, ModuleMetadata, ModuleType
from modules.base import IntegrationModuleBase
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import httpx
import asyncio
import json
import hashlib
from datetime import datetime, timedelta


class AuthType(str, Enum):
    NONE = "none"
    API_KEY = "api_key"
    BEARER_TOKEN = "bearer_token"
    BASIC_AUTH = "basic_auth"
    OAUTH2 = "oauth2"
    CUSTOM_HEADER = "custom_header"


class HttpMethod(str, Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"


class DataSourceConfig(BaseModel):
    name: str
    description: Optional[str] = None
    base_url: str
    auth_type: AuthType = AuthType.NONE
    auth_config: Dict[str, Any] = Field(default_factory=dict)
    default_headers: Dict[str, str] = Field(default_factory=dict)
    rate_limit: int = 60  # requests per minute
    timeout: int = 30  # seconds
    retry_count: int = 3
    cache_ttl: int = 300  # seconds


class EndpointConfig(BaseModel):
    name: str
    path: str
    method: HttpMethod = HttpMethod.GET
    query_params: Dict[str, Any] = Field(default_factory=dict)
    body_template: Optional[Dict[str, Any]] = None
    headers: Dict[str, str] = Field(default_factory=dict)
    response_mapping: Optional[Dict[str, str]] = None  # Map response fields
    pagination: Optional[Dict[str, Any]] = None


class DataSourceModule(IntegrationModuleBase):
    """Manages external API data sources"""
    
    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            id="core.data_sources",
            name="Data Sources",
            version="1.0.0",
            type=ModuleType.INTEGRATION,
            description="Connect to any third-party API as a data source",
            author="WebCraft",
            dependencies=[],
            is_premium=False
        )
    
    async def initialize(self) -> bool:
        self._sources: Dict[str, DataSourceConfig] = {}
        self._endpoints: Dict[str, Dict[str, EndpointConfig]] = {}
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._rate_limits: Dict[str, List[datetime]] = {}
        self._initialized = True
        return True
    
    async def shutdown(self) -> bool:
        self._sources.clear()
        self._endpoints.clear()
        self._cache.clear()
        self._initialized = False
        return True
    
    async def connect(self, credentials: Dict[str, Any]) -> bool:
        return True
    
    async def disconnect(self) -> bool:
        return True
    
    async def sync(self) -> Dict[str, Any]:
        return {"sources": len(self._sources)}
    
    def get_oauth_url(self) -> Optional[str]:
        return None
    
    def _get_cache_key(self, source_id: str, endpoint: str, params: Dict) -> str:
        """Generate cache key for request"""
        param_str = json.dumps(params, sort_keys=True)
        return hashlib.md5(f"{source_id}:{endpoint}:{param_str}".encode()).hexdigest()
    
    def _check_rate_limit(self, source_id: str, limit: int) -> bool:
        """Check if rate limit allows request"""
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)
        
        if source_id not in self._rate_limits:
            self._rate_limits[source_id] = []
        
        # Clean old entries
        self._rate_limits[source_id] = [
            t for t in self._rate_limits[source_id] if t > minute_ago
        ]
        
        if len(self._rate_limits[source_id]) >= limit:
            return False
        
        self._rate_limits[source_id].append(now)
        return True
    
    def _build_auth_headers(self, config: DataSourceConfig) -> Dict[str, str]:
        """Build authentication headers based on auth type"""
        headers = dict(config.default_headers)
        auth_config = config.auth_config
        
        if config.auth_type == AuthType.API_KEY:
            header_name = auth_config.get("header_name", "X-API-Key")
            headers[header_name] = auth_config.get("api_key", "")
        
        elif config.auth_type == AuthType.BEARER_TOKEN:
            headers["Authorization"] = f"Bearer {auth_config.get('token', '')}"
        
        elif config.auth_type == AuthType.BASIC_AUTH:
            import base64
            credentials = f"{auth_config.get('username', '')}:{auth_config.get('password', '')}"
            encoded = base64.b64encode(credentials.encode()).decode()
            headers["Authorization"] = f"Basic {encoded}"
        
        elif config.auth_type == AuthType.CUSTOM_HEADER:
            for key, value in auth_config.get("headers", {}).items():
                headers[key] = value
        
        return headers
    
    def _apply_response_mapping(self, data: Any, mapping: Optional[Dict[str, str]]) -> Any:
        """Apply field mapping to response data"""
        if not mapping or not isinstance(data, dict):
            return data
        
        result = {}
        for target_key, source_path in mapping.items():
            value = data
            for key in source_path.split("."):
                if isinstance(value, dict):
                    value = value.get(key)
                elif isinstance(value, list) and key.isdigit():
                    value = value[int(key)] if int(key) < len(value) else None
                else:
                    value = None
                    break
            result[target_key] = value
        
        return result
    
    async def create_data_source(self, app_id: str, config: DataSourceConfig) -> str:
        """Create a new data source"""
        source_id = f"{app_id}_{config.name.lower().replace(' ', '_')}"
        self._sources[source_id] = config
        self._endpoints[source_id] = {}
        return source_id
    
    async def add_endpoint(self, source_id: str, endpoint: EndpointConfig) -> bool:
        """Add an endpoint to a data source"""
        if source_id not in self._sources:
            return False
        self._endpoints[source_id][endpoint.name] = endpoint
        return True
    
    async def fetch_data(
        self,
        source_id: str,
        endpoint_name: str,
        params: Dict[str, Any] = None,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """Fetch data from a data source endpoint"""
        if source_id not in self._sources:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        if endpoint_name not in self._endpoints.get(source_id, {}):
            raise HTTPException(status_code=404, detail="Endpoint not found")
        
        source = self._sources[source_id]
        endpoint = self._endpoints[source_id][endpoint_name]
        params = params or {}
        
        # Check cache
        cache_key = self._get_cache_key(source_id, endpoint_name, params)
        if use_cache and cache_key in self._cache:
            cached = self._cache[cache_key]
            if datetime.utcnow() < cached["expires"]:
                return {"data": cached["data"], "cached": True}
        
        # Check rate limit
        if not self._check_rate_limit(source_id, source.rate_limit):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Build request
        url = f"{source.base_url.rstrip('/')}/{endpoint.path.lstrip('/')}"
        headers = self._build_auth_headers(source)
        headers.update(endpoint.headers)
        
        query_params = {**endpoint.query_params, **params.get("query", {})}
        body = None
        if endpoint.body_template:
            body = {**endpoint.body_template, **params.get("body", {})}
        
        # Make request with retry
        last_error = None
        for attempt in range(source.retry_count):
            try:
                async with httpx.AsyncClient(timeout=source.timeout) as client:
                    response = await client.request(
                        method=endpoint.method.value,
                        url=url,
                        headers=headers,
                        params=query_params,
                        json=body
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    # Apply response mapping
                    if endpoint.response_mapping:
                        if isinstance(data, list):
                            data = [self._apply_response_mapping(item, endpoint.response_mapping) for item in data]
                        else:
                            data = self._apply_response_mapping(data, endpoint.response_mapping)
                    
                    # Cache response
                    self._cache[cache_key] = {
                        "data": data,
                        "expires": datetime.utcnow() + timedelta(seconds=source.cache_ttl)
                    }
                    
                    return {"data": data, "cached": False}
            
            except httpx.HTTPStatusError as e:
                last_error = f"HTTP {e.response.status_code}: {e.response.text}"
            except httpx.RequestError as e:
                last_error = str(e)
            
            if attempt < source.retry_count - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        raise HTTPException(status_code=502, detail=f"Failed to fetch data: {last_error}")
    
    async def test_connection(self, source_id: str) -> Dict[str, Any]:
        """Test data source connection"""
        if source_id not in self._sources:
            return {"success": False, "error": "Data source not found"}
        
        source = self._sources[source_id]
        headers = self._build_auth_headers(source)
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(source.base_url, headers=headers)
                return {
                    "success": response.status_code < 400,
                    "status_code": response.status_code,
                    "response_time_ms": response.elapsed.total_seconds() * 1000
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_routes(self) -> List[APIRouter]:
        router = APIRouter(prefix="/data-sources", tags=["Data Sources"])
        
        @router.post("")
        async def create_source(app_id: str, config: DataSourceConfig):
            source_id = await self.create_data_source(app_id, config)
            return {"source_id": source_id, "success": True}
        
        @router.post("/{source_id}/endpoints")
        async def add_source_endpoint(source_id: str, endpoint: EndpointConfig):
            success = await self.add_endpoint(source_id, endpoint)
            return {"success": success}
        
        @router.get("/{source_id}/fetch/{endpoint_name}")
        async def fetch_endpoint_data(
            source_id: str,
            endpoint_name: str,
            use_cache: bool = True
        ):
            return await self.fetch_data(source_id, endpoint_name, use_cache=use_cache)
        
        @router.post("/{source_id}/fetch/{endpoint_name}")
        async def fetch_endpoint_data_with_params(
            source_id: str,
            endpoint_name: str,
            params: Dict[str, Any],
            use_cache: bool = True
        ):
            return await self.fetch_data(source_id, endpoint_name, params, use_cache)
        
        @router.get("/{source_id}/test")
        async def test_source_connection(source_id: str):
            return await self.test_connection(source_id)
        
        return [router]
