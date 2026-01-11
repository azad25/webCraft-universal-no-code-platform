"""
Data Sources domain service
"""

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import hashlib
import httpx
import base64

from src.common.base_service import BaseService
from src.common.exceptions import NotFoundError, ValidationError
from .models import DataSource, DataSourceEndpoint, DataSourceCache, WidgetDataBinding
from .schemas import DataSourceCreate, DataSourceUpdate, EndpointCreate, EndpointUpdate


class DataSourceService(BaseService[DataSource, DataSourceCreate, DataSourceUpdate]):
    """Service for managing data sources"""
    
    def __init__(self, db: Session):
        super().__init__(DataSource, db)
    
    def list_data_sources(self, app_id: str) -> List[DataSource]:
        """List all data sources for an app"""
        return self.db.query(DataSource).filter(
            DataSource.app_id == uuid.UUID(app_id),
            DataSource.is_active == True
        ).order_by(DataSource.created_at.desc()).all()
    
    def create_data_source(self, app_id: str, data: DataSourceCreate) -> DataSource:
        """Create a new data source"""
        source = DataSource(
            app_id=uuid.UUID(app_id),
            name=data.name,
            description=data.description,
            base_url=data.base_url.rstrip('/'),
            auth_type=data.auth_type,
            auth_config=data.auth_config.model_dump() if data.auth_config else {},
            default_headers=data.default_headers,
            rate_limit=data.rate_limit,
            timeout=data.timeout,
            retry_count=data.retry_count,
            cache_ttl=data.cache_ttl
        )
        
        self.db.add(source)
        self.db.commit()
        self.db.refresh(source)
        
        return source
    
    def get_data_source(self, source_id: str) -> DataSource:
        """Get data source by ID"""
        source = self.db.query(DataSource).filter(
            DataSource.id == uuid.UUID(source_id),
            DataSource.is_active == True
        ).first()
        
        if not source:
            raise NotFoundError("Data source not found")
        
        return source
    
    def update_data_source(self, source_id: str, data: DataSourceUpdate) -> DataSource:
        """Update a data source"""
        source = self.get_data_source(source_id)
        
        update_data = data.model_dump(exclude_unset=True)
        if "auth_config" in update_data and update_data["auth_config"]:
            update_data["auth_config"] = update_data["auth_config"].model_dump() if hasattr(update_data["auth_config"], 'model_dump') else update_data["auth_config"]
        if "base_url" in update_data:
            update_data["base_url"] = update_data["base_url"].rstrip('/')
        
        for key, value in update_data.items():
            setattr(source, key, value)
        
        source.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(source)
        
        return source
    
    def delete_data_source(self, source_id: str) -> bool:
        """Soft delete a data source"""
        source = self.get_data_source(source_id)
        source.is_active = False
        self.db.commit()
        return True
    
    async def test_connection(self, source_id: str) -> Dict[str, Any]:
        """Test connection to a data source"""
        source = self.get_data_source(source_id)
        
        try:
            headers = self._build_headers(source)
            
            async with httpx.AsyncClient(timeout=source.timeout) as client:
                response = await client.get(source.base_url, headers=headers)
                
                source.is_connected = response.status_code < 400
                source.last_tested = datetime.utcnow()
                source.last_error = None if source.is_connected else f"HTTP {response.status_code}"
                self.db.commit()
                
                return {
                    "success": source.is_connected,
                    "status_code": response.status_code,
                    "response_time_ms": int(response.elapsed.total_seconds() * 1000),
                    "message": "Connection successful" if source.is_connected else f"Failed with status {response.status_code}"
                }
        
        except httpx.TimeoutException:
            source.is_connected = False
            source.last_tested = datetime.utcnow()
            source.last_error = "Connection timeout"
            self.db.commit()
            return {"success": False, "message": "Connection timeout"}
        
        except Exception as e:
            source.is_connected = False
            source.last_tested = datetime.utcnow()
            source.last_error = str(e)
            self.db.commit()
            return {"success": False, "message": str(e)}
    
    def _build_headers(self, source: DataSource) -> Dict[str, str]:
        """Build request headers including authentication"""
        headers = dict(source.default_headers or {})
        auth_config = source.auth_config or {}
        
        if source.auth_type == "api_key":
            header_name = auth_config.get("api_key_header", "X-API-Key")
            api_key = auth_config.get("api_key", "")
            prefix = auth_config.get("api_key_prefix", "")
            headers[header_name] = f"{prefix}{api_key}" if prefix else api_key
        
        elif source.auth_type == "bearer_token":
            token = auth_config.get("token", "")
            headers["Authorization"] = f"Bearer {token}"
        
        elif source.auth_type == "basic_auth":
            username = auth_config.get("username", "")
            password = auth_config.get("password", "")
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers["Authorization"] = f"Basic {credentials}"
        
        elif source.auth_type == "custom_header":
            custom_headers = auth_config.get("custom_headers", {})
            headers.update(custom_headers)
        
        return headers


class EndpointService:
    """Service for managing data source endpoints"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def list_endpoints(self, source_id: str) -> List[DataSourceEndpoint]:
        """List all endpoints for a data source"""
        return self.db.query(DataSourceEndpoint).filter(
            DataSourceEndpoint.data_source_id == uuid.UUID(source_id),
            DataSourceEndpoint.is_active == True
        ).all()
    
    def create_endpoint(self, source_id: str, data: EndpointCreate) -> DataSourceEndpoint:
        """Create a new endpoint"""
        endpoint = DataSourceEndpoint(
            data_source_id=uuid.UUID(source_id),
            name=data.name,
            path=data.path,
            method=data.method.upper(),
            query_params=data.query_params,
            body_template=data.body_template,
            headers=data.headers,
            response_mapping=data.response_mapping,
            pagination_config=data.pagination_config
        )
        
        self.db.add(endpoint)
        self.db.commit()
        self.db.refresh(endpoint)
        
        return endpoint
    
    def get_endpoint(self, endpoint_id: str, source_id: str) -> DataSourceEndpoint:
        """Get endpoint by ID"""
        endpoint = self.db.query(DataSourceEndpoint).filter(
            DataSourceEndpoint.id == uuid.UUID(endpoint_id),
            DataSourceEndpoint.data_source_id == uuid.UUID(source_id),
            DataSourceEndpoint.is_active == True
        ).first()
        
        if not endpoint:
            raise NotFoundError("Endpoint not found")
        
        return endpoint
    
    def update_endpoint(self, endpoint_id: str, source_id: str, data: EndpointUpdate) -> DataSourceEndpoint:
        """Update an endpoint"""
        endpoint = self.get_endpoint(endpoint_id, source_id)
        
        update_data = data.model_dump(exclude_unset=True)
        if "method" in update_data:
            update_data["method"] = update_data["method"].upper()
        
        for key, value in update_data.items():
            setattr(endpoint, key, value)
        
        endpoint.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(endpoint)
        
        return endpoint
    
    def delete_endpoint(self, endpoint_id: str, source_id: str) -> bool:
        """Soft delete an endpoint"""
        endpoint = self.get_endpoint(endpoint_id, source_id)
        endpoint.is_active = False
        self.db.commit()
        return True
    
    async def fetch_data(
        self,
        endpoint_id: str,
        source_id: str,
        params: Dict[str, Any] = None,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """Fetch data from an endpoint"""
        endpoint = self.get_endpoint(endpoint_id, source_id)
        source = endpoint.data_source
        
        # Generate cache key
        cache_key = self._generate_cache_key(endpoint_id, params or {})
        
        # Check cache
        if use_cache:
            cached = self.db.query(DataSourceCache).filter(
                DataSourceCache.cache_key == cache_key,
                DataSourceCache.expires_at > datetime.utcnow()
            ).first()
            
            if cached:
                cached.hit_count += 1
                self.db.commit()
                return {
                    "data": cached.response_data,
                    "cached": True,
                    "cache_hit_count": cached.hit_count
                }
        
        # Fetch from API
        data = await self._fetch_from_api(source, endpoint, params or {})
        
        # Apply response mapping
        if endpoint.response_mapping:
            data = self._apply_response_mapping(data, endpoint.response_mapping)
        
        # Cache the response
        if source.cache_ttl > 0:
            self._cache_response(cache_key, endpoint.id, data, params or {}, source.cache_ttl)
        
        return {"data": data, "cached": False}
    
    async def _fetch_from_api(
        self,
        source: DataSource,
        endpoint: DataSourceEndpoint,
        params: Dict[str, Any]
    ) -> Any:
        """Fetch data from external API"""
        data_source_service = DataSourceService(self.db)
        headers = data_source_service._build_headers(source)
        headers.update(endpoint.headers or {})
        
        url = f"{source.base_url}{endpoint.path}"
        
        query_params = dict(endpoint.query_params or {})
        query_params.update(params)
        
        body = None
        if endpoint.method in ["POST", "PUT", "PATCH"] and endpoint.body_template:
            body = endpoint.body_template.copy()
        
        async with httpx.AsyncClient(timeout=source.timeout) as client:
            response = await client.request(
                method=endpoint.method,
                url=url,
                headers=headers,
                params=query_params if endpoint.method == "GET" else None,
                json=body
            )
            
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type:
                return response.json()
            else:
                return response.text
    
    def _apply_response_mapping(self, data: Any, mapping: Dict[str, str]) -> Any:
        """Apply field mapping to response data"""
        if isinstance(data, list):
            return [self._apply_response_mapping(item, mapping) for item in data]
        
        if isinstance(data, dict):
            result = {}
            for target_field, source_path in mapping.items():
                value = self._get_nested_value(data, source_path)
                result[target_field] = value
            return result
        
        return data
    
    def _get_nested_value(self, obj: Dict, path: str) -> Any:
        """Get nested value from dict using dot notation"""
        keys = path.split(".")
        value = obj
        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
            elif isinstance(value, list) and key.isdigit():
                value = value[int(key)] if int(key) < len(value) else None
            else:
                return None
        return value
    
    def _generate_cache_key(self, endpoint_id: str, params: Dict) -> str:
        """Generate cache key from endpoint and params"""
        import json
        param_str = json.dumps(params, sort_keys=True)
        return hashlib.sha256(f"{endpoint_id}:{param_str}".encode()).hexdigest()[:64]
    
    def _cache_response(
        self,
        cache_key: str,
        endpoint_id: uuid.UUID,
        data: Any,
        params: Dict,
        ttl: int
    ):
        """Cache the response"""
        cache_entry = self.db.query(DataSourceCache).filter(
            DataSourceCache.cache_key == cache_key
        ).first()
        
        if cache_entry:
            cache_entry.response_data = data
            cache_entry.expires_at = datetime.utcnow() + timedelta(seconds=ttl)
            cache_entry.hit_count = 0
        else:
            cache_entry = DataSourceCache(
                cache_key=cache_key,
                endpoint_id=endpoint_id,
                response_data=data,
                request_params=params,
                expires_at=datetime.utcnow() + timedelta(seconds=ttl)
            )
            self.db.add(cache_entry)
        
        self.db.commit()
