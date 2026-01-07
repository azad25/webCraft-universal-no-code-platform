"""
Data Fetcher Service
Handles fetching data from external APIs and scrapers for widgets
"""

import httpx
import hashlib
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from core.database import (
    DataSource, DataSourceEndpoint, DataSourceCache,
    WebScraper, ScraperResult, WidgetDataBinding
)


class DataFetcherService:
    """Service for fetching and caching data from external sources"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def fetch_widget_data(
        self,
        widget_id: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Fetch data for a widget based on its bindings"""
        import uuid
        
        bindings = self.db.query(WidgetDataBinding).filter(
            WidgetDataBinding.app_widget_id == uuid.UUID(widget_id),
            WidgetDataBinding.is_active == True
        ).all()
        
        if not bindings:
            return {"data": None, "error": "No data binding found"}
        
        results = {}
        
        for binding in bindings:
            if binding.binding_type == "api" and binding.data_source_endpoint_id:
                data = await self.fetch_from_api(
                    str(binding.data_source_endpoint_id),
                    params
                )
                results[binding.id] = self._apply_field_mappings(
                    data,
                    binding.field_mappings
                )
            
            elif binding.binding_type == "scraper" and binding.scraper_id:
                data = await self.fetch_from_scraper(str(binding.scraper_id))
                results[binding.id] = self._apply_field_mappings(
                    data,
                    binding.field_mappings
                )
        
        return {"data": results}
    
    async def fetch_from_api(
        self,
        endpoint_id: str,
        params: Optional[Dict[str, Any]] = None,
        use_cache: bool = True
    ) -> Any:
        """Fetch data from an API endpoint"""
        import uuid
        
        endpoint = self.db.query(DataSourceEndpoint).filter(
            DataSourceEndpoint.id == uuid.UUID(endpoint_id),
            DataSourceEndpoint.is_active == True
        ).first()
        
        if not endpoint:
            raise ValueError("Endpoint not found")
        
        source = endpoint.data_source
        
        # Check cache
        cache_key = self._generate_cache_key(endpoint_id, params or {})
        
        if use_cache and source.cache_ttl > 0:
            cached = self.db.query(DataSourceCache).filter(
                DataSourceCache.cache_key == cache_key,
                DataSourceCache.expires_at > datetime.utcnow()
            ).first()
            
            if cached:
                cached.hit_count += 1
                self.db.commit()
                return cached.response_data
        
        # Build request
        headers = self._build_headers(source)
        headers.update(endpoint.headers or {})
        
        url = f"{source.base_url}{endpoint.path}"
        query_params = dict(endpoint.query_params or {})
        if params:
            query_params.update(params)
        
        body = None
        if endpoint.method in ["POST", "PUT", "PATCH"] and endpoint.body_template:
            body = self._replace_placeholders(endpoint.body_template, params or {})
        
        # Make request
        async with httpx.AsyncClient(timeout=source.timeout) as client:
            response = await client.request(
                method=endpoint.method,
                url=url,
                headers=headers,
                params=query_params if endpoint.method == "GET" else None,
                json=body
            )
            response.raise_for_status()
            
            data = response.json() if "application/json" in response.headers.get("content-type", "") else response.text
        
        # Apply response mapping
        if endpoint.response_mapping:
            data = self._apply_response_mapping(data, endpoint.response_mapping)
        
        # Cache response
        if source.cache_ttl > 0:
            self._cache_response(cache_key, endpoint.id, data, params, source.cache_ttl)
        
        return data
    
    async def fetch_from_scraper(
        self,
        scraper_id: str,
        use_cache: bool = True
    ) -> Any:
        """Fetch latest data from a scraper"""
        import uuid
        
        scraper = self.db.query(WebScraper).filter(
            WebScraper.id == uuid.UUID(scraper_id),
            WebScraper.is_active == True
        ).first()
        
        if not scraper:
            raise ValueError("Scraper not found")
        
        # Get latest result
        result = self.db.query(ScraperResult).filter(
            ScraperResult.scraper_id == scraper.id,
            ScraperResult.status == "completed"
        ).order_by(ScraperResult.created_at.desc()).first()
        
        if not result:
            return None
        
        # Check if cache is still valid
        if use_cache and result.expires_at and datetime.utcnow() < result.expires_at:
            return result.data
        
        return result.data
    
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
            import base64
            username = auth_config.get("username", "")
            password = auth_config.get("password", "")
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers["Authorization"] = f"Basic {credentials}"
        
        elif source.auth_type == "custom_header":
            custom_headers = auth_config.get("custom_headers", {})
            headers.update(custom_headers)
        
        return headers
    
    def _generate_cache_key(self, endpoint_id: str, params: Dict) -> str:
        """Generate cache key from endpoint and params"""
        param_str = json.dumps(params, sort_keys=True)
        return hashlib.sha256(f"{endpoint_id}:{param_str}".encode()).hexdigest()[:64]
    
    def _cache_response(
        self,
        cache_key: str,
        endpoint_id,
        data: Any,
        params: Optional[Dict],
        ttl: int
    ):
        """Cache API response"""
        existing = self.db.query(DataSourceCache).filter(
            DataSourceCache.cache_key == cache_key
        ).first()
        
        if existing:
            existing.response_data = data
            existing.expires_at = datetime.utcnow() + timedelta(seconds=ttl)
            existing.hit_count = 0
        else:
            cache_entry = DataSourceCache(
                cache_key=cache_key,
                endpoint_id=endpoint_id,
                response_data=data,
                request_params=params or {},
                expires_at=datetime.utcnow() + timedelta(seconds=ttl)
            )
            self.db.add(cache_entry)
        
        self.db.commit()
    
    def _replace_placeholders(self, obj: Any, values: Dict[str, Any]) -> Any:
        """Replace placeholders in object with values"""
        if isinstance(obj, str):
            for key, value in values.items():
                obj = obj.replace(f"{{{key}}}", str(value))
            return obj
        elif isinstance(obj, dict):
            return {k: self._replace_placeholders(v, values) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._replace_placeholders(item, values) for item in obj]
        return obj
    
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
                idx = int(key)
                value = value[idx] if idx < len(value) else None
            else:
                return None
        return value
    
    def _apply_field_mappings(self, data: Any, mappings: Dict[str, str]) -> Any:
        """Apply widget field mappings to data"""
        if not mappings:
            return data
        
        if isinstance(data, list):
            return [self._apply_field_mappings(item, mappings) for item in data]
        
        if isinstance(data, dict):
            result = {}
            for widget_field, data_field in mappings.items():
                result[widget_field] = self._get_nested_value(data, data_field)
            return result
        
        return data


# Singleton instance
_data_fetcher: Optional[DataFetcherService] = None


def get_data_fetcher(db: Session) -> DataFetcherService:
    """Get or create data fetcher service"""
    return DataFetcherService(db)
