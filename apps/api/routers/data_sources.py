"""
Data Sources Router - API endpoints for managing external data sources
Real implementation with actual API calls and caching
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import uuid
import hashlib
import httpx
import asyncio

from core.database import (
    get_db, DataSource, DataSourceEndpoint, DataSourceCache, 
    WidgetDataBinding, App, User
)
from core.auth import get_current_user


router = APIRouter(prefix="/data-sources", tags=["Data Sources"])


# ============================================
# PYDANTIC MODELS
# ============================================

class AuthConfigCreate(BaseModel):
    api_key: Optional[str] = None
    api_key_header: Optional[str] = "X-API-Key"
    api_key_prefix: Optional[str] = None
    token: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    custom_headers: Optional[Dict[str, str]] = None


class DataSourceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    base_url: str
    auth_type: str = "none"  # none, api_key, bearer_token, basic_auth, custom_header
    auth_config: Optional[AuthConfigCreate] = None
    default_headers: Dict[str, str] = Field(default_factory=dict)
    rate_limit: int = 60
    timeout: int = 30
    retry_count: int = 3
    cache_ttl: int = 300


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_url: Optional[str] = None
    auth_type: Optional[str] = None
    auth_config: Optional[AuthConfigCreate] = None
    default_headers: Optional[Dict[str, str]] = None
    rate_limit: Optional[int] = None
    timeout: Optional[int] = None
    cache_ttl: Optional[int] = None


class EndpointCreate(BaseModel):
    name: str
    path: str
    method: str = "GET"
    query_params: Dict[str, Any] = Field(default_factory=dict)
    body_template: Optional[Dict[str, Any]] = None
    headers: Dict[str, str] = Field(default_factory=dict)
    response_mapping: Optional[Dict[str, str]] = None
    pagination_config: Optional[Dict[str, Any]] = None


class EndpointUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[str] = None
    method: Optional[str] = None
    query_params: Optional[Dict[str, Any]] = None
    body_template: Optional[Dict[str, Any]] = None
    headers: Optional[Dict[str, str]] = None
    response_mapping: Optional[Dict[str, str]] = None
    pagination_config: Optional[Dict[str, Any]] = None


class WidgetBindingCreate(BaseModel):
    app_widget_id: str
    data_source_endpoint_id: Optional[str] = None
    scraper_id: Optional[str] = None
    binding_type: str  # 'api' or 'scraper'
    field_mappings: Dict[str, str] = Field(default_factory=dict)
    refresh_interval: int = 0
    transform_script: Optional[str] = None


# ============================================
# DATA SOURCE CRUD
# ============================================

@router.post("")
async def create_data_source(
    app_id: str = Query(...),
    data: DataSourceCreate = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new data source for an app"""
    # Verify app ownership
    app = db.query(App).filter(App.id == uuid.UUID(app_id), App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    source = DataSource(
        name=data.name,
        description=data.description,
        base_url=data.base_url.rstrip('/'),
        auth_type=data.auth_type,
        auth_config=data.auth_config.dict() if data.auth_config else {},
        default_headers=data.default_headers,
        rate_limit=data.rate_limit,
        timeout=data.timeout,
        retry_count=data.retry_count,
        cache_ttl=data.cache_ttl,
        app_id=uuid.UUID(app_id)
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    
    return {
        "id": str(source.id),
        "name": source.name,
        "description": source.description,
        "base_url": source.base_url,
        "auth_type": source.auth_type,
        "is_connected": source.is_connected,
        "created_at": source.created_at.isoformat()
    }


@router.get("")
async def list_data_sources(
    app_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all data sources for an app"""
    sources = db.query(DataSource).filter(
        DataSource.app_id == uuid.UUID(app_id),
        DataSource.is_active == True
    ).order_by(DataSource.created_at.desc()).all()
    
    return {
        "data_sources": [
            {
                "id": str(s.id),
                "name": s.name,
                "description": s.description,
                "base_url": s.base_url,
                "auth_type": s.auth_type,
                "is_connected": s.is_connected,
                "last_tested": s.last_tested.isoformat() if s.last_tested else None,
                "last_error": s.last_error,
                "endpoint_count": len(s.endpoints),
                "created_at": s.created_at.isoformat()
            }
            for s in sources
        ],
        "total": len(sources)
    }


@router.get("/{source_id}")
async def get_data_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific data source with its endpoints"""
    source = db.query(DataSource).filter(
        DataSource.id == uuid.UUID(source_id),
        DataSource.is_active == True
    ).first()
    
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    return {
        "id": str(source.id),
        "name": source.name,
        "description": source.description,
        "base_url": source.base_url,
        "auth_type": source.auth_type,
        "default_headers": source.default_headers,
        "rate_limit": source.rate_limit,
        "timeout": source.timeout,
        "retry_count": source.retry_count,
        "cache_ttl": source.cache_ttl,
        "is_connected": source.is_connected,
        "last_tested": source.last_tested.isoformat() if source.last_tested else None,
        "last_error": source.last_error,
        "endpoints": [
            {
                "id": str(e.id),
                "name": e.name,
                "path": e.path,
                "method": e.method,
                "query_params": e.query_params,
                "response_mapping": e.response_mapping
            }
            for e in source.endpoints if e.is_active
        ],
        "created_at": source.created_at.isoformat()
    }


@router.put("/{source_id}")
async def update_data_source(
    source_id: str,
    data: DataSourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a data source"""
    source = db.query(DataSource).filter(
        DataSource.id == uuid.UUID(source_id),
        DataSource.is_active == True
    ).first()
    
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    update_data = data.dict(exclude_unset=True)
    if "auth_config" in update_data and update_data["auth_config"]:
        update_data["auth_config"] = update_data["auth_config"].dict() if hasattr(update_data["auth_config"], 'dict') else update_data["auth_config"]
    if "base_url" in update_data:
        update_data["base_url"] = update_data["base_url"].rstrip('/')
    
    for key, value in update_data.items():
        setattr(source, key, value)
    
    source.updated_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "id": str(source.id)}


@router.delete("/{source_id}")
async def delete_data_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a data source (soft delete)"""
    source = db.query(DataSource).filter(
        DataSource.id == uuid.UUID(source_id)
    ).first()
    
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    source.is_active = False
    db.commit()
    
    return {"success": True}


# ============================================
# TEST CONNECTION
# ============================================

@router.post("/{source_id}/test")
async def test_data_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test connection to a data source"""
    source = db.query(DataSource).filter(
        DataSource.id == uuid.UUID(source_id),
        DataSource.is_active == True
    ).first()
    
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    try:
        headers = build_headers(source)
        
        async with httpx.AsyncClient(timeout=source.timeout) as client:
            response = await client.get(
                source.base_url,
                headers=headers
            )
            
            source.is_connected = response.status_code < 400
            source.last_tested = datetime.utcnow()
            source.last_error = None if source.is_connected else f"HTTP {response.status_code}"
            db.commit()
            
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
        db.commit()
        return {"success": False, "message": "Connection timeout"}
    
    except Exception as e:
        source.is_connected = False
        source.last_tested = datetime.utcnow()
        source.last_error = str(e)
        db.commit()
        return {"success": False, "message": str(e)}


# ============================================
# ENDPOINT CRUD
# ============================================

@router.post("/{source_id}/endpoints")
async def create_endpoint(
    source_id: str,
    data: EndpointCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add an endpoint to a data source"""
    source = db.query(DataSource).filter(
        DataSource.id == uuid.UUID(source_id),
        DataSource.is_active == True
    ).first()
    
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    endpoint = DataSourceEndpoint(
        name=data.name,
        path=data.path,
        method=data.method.upper(),
        query_params=data.query_params,
        body_template=data.body_template,
        headers=data.headers,
        response_mapping=data.response_mapping,
        pagination_config=data.pagination_config,
        data_source_id=source.id
    )
    db.add(endpoint)
    db.commit()
    db.refresh(endpoint)
    
    return {
        "id": str(endpoint.id),
        "name": endpoint.name,
        "path": endpoint.path,
        "method": endpoint.method,
        "created_at": endpoint.created_at.isoformat()
    }


@router.get("/{source_id}/endpoints")
async def list_endpoints(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all endpoints for a data source"""
    endpoints = db.query(DataSourceEndpoint).filter(
        DataSourceEndpoint.data_source_id == uuid.UUID(source_id),
        DataSourceEndpoint.is_active == True
    ).all()
    
    return {
        "endpoints": [
            {
                "id": str(e.id),
                "name": e.name,
                "path": e.path,
                "method": e.method,
                "query_params": e.query_params,
                "response_mapping": e.response_mapping,
                "created_at": e.created_at.isoformat()
            }
            for e in endpoints
        ]
    }


@router.put("/{source_id}/endpoints/{endpoint_id}")
async def update_endpoint(
    source_id: str,
    endpoint_id: str,
    data: EndpointUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an endpoint"""
    endpoint = db.query(DataSourceEndpoint).filter(
        DataSourceEndpoint.id == uuid.UUID(endpoint_id),
        DataSourceEndpoint.data_source_id == uuid.UUID(source_id),
        DataSourceEndpoint.is_active == True
    ).first()
    
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    update_data = data.dict(exclude_unset=True)
    if "method" in update_data:
        update_data["method"] = update_data["method"].upper()
    
    for key, value in update_data.items():
        setattr(endpoint, key, value)
    
    endpoint.updated_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "id": str(endpoint.id)}


@router.delete("/{source_id}/endpoints/{endpoint_id}")
async def delete_endpoint(
    source_id: str,
    endpoint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an endpoint (soft delete)"""
    endpoint = db.query(DataSourceEndpoint).filter(
        DataSourceEndpoint.id == uuid.UUID(endpoint_id),
        DataSourceEndpoint.data_source_id == uuid.UUID(source_id)
    ).first()
    
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    endpoint.is_active = False
    db.commit()
    
    return {"success": True}


# ============================================
# FETCH DATA FROM ENDPOINT
# ============================================

@router.post("/{source_id}/endpoints/{endpoint_id}/fetch")
async def fetch_endpoint_data(
    source_id: str,
    endpoint_id: str,
    params: Optional[Dict[str, Any]] = None,
    use_cache: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch data from an endpoint with caching"""
    endpoint = db.query(DataSourceEndpoint).filter(
        DataSourceEndpoint.id == uuid.UUID(endpoint_id),
        DataSourceEndpoint.data_source_id == uuid.UUID(source_id),
        DataSourceEndpoint.is_active == True
    ).first()
    
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    source = endpoint.data_source
    
    # Generate cache key
    cache_key = generate_cache_key(endpoint_id, params or {})
    
    # Check cache
    if use_cache:
        cached = db.query(DataSourceCache).filter(
            DataSourceCache.cache_key == cache_key,
            DataSourceCache.expires_at > datetime.utcnow()
        ).first()
        
        if cached:
            cached.hit_count += 1
            db.commit()
            return {
                "data": cached.response_data,
                "cached": True,
                "cache_hit_count": cached.hit_count
            }
    
    # Fetch from API
    try:
        data = await fetch_from_api(source, endpoint, params or {})
        
        # Apply response mapping
        if endpoint.response_mapping:
            data = apply_response_mapping(data, endpoint.response_mapping)
        
        # Cache the response
        if source.cache_ttl > 0:
            cache_entry = db.query(DataSourceCache).filter(
                DataSourceCache.cache_key == cache_key
            ).first()
            
            if cache_entry:
                cache_entry.response_data = data
                cache_entry.expires_at = datetime.utcnow() + timedelta(seconds=source.cache_ttl)
                cache_entry.hit_count = 0
            else:
                cache_entry = DataSourceCache(
                    cache_key=cache_key,
                    endpoint_id=endpoint.id,
                    response_data=data,
                    request_params=params or {},
                    expires_at=datetime.utcnow() + timedelta(seconds=source.cache_ttl)
                )
                db.add(cache_entry)
            
            db.commit()
        
        return {
            "data": data,
            "cached": False
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")


@router.get("/{source_id}/endpoints/{endpoint_id}/preview")
async def preview_endpoint(
    source_id: str,
    endpoint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Preview endpoint response structure"""
    endpoint = db.query(DataSourceEndpoint).filter(
        DataSourceEndpoint.id == uuid.UUID(endpoint_id),
        DataSourceEndpoint.data_source_id == uuid.UUID(source_id),
        DataSourceEndpoint.is_active == True
    ).first()
    
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    source = endpoint.data_source
    
    try:
        data = await fetch_from_api(source, endpoint, {})
        
        # Analyze response structure
        structure = analyze_response_structure(data)
        
        return {
            "sample_data": data[:5] if isinstance(data, list) else data,
            "structure": structure,
            "total_items": len(data) if isinstance(data, list) else 1
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview: {str(e)}")


# ============================================
# WIDGET BINDINGS
# ============================================

@router.post("/bindings")
async def create_widget_binding(
    data: WidgetBindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bind a widget to a data source or scraper"""
    binding = WidgetDataBinding(
        app_widget_id=uuid.UUID(data.app_widget_id),
        data_source_endpoint_id=uuid.UUID(data.data_source_endpoint_id) if data.data_source_endpoint_id else None,
        scraper_id=uuid.UUID(data.scraper_id) if data.scraper_id else None,
        binding_type=data.binding_type,
        field_mappings=data.field_mappings,
        refresh_interval=data.refresh_interval,
        transform_script=data.transform_script
    )
    db.add(binding)
    db.commit()
    db.refresh(binding)
    
    return {"success": True, "binding_id": str(binding.id)}


@router.get("/bindings/{widget_id}")
async def get_widget_bindings(
    widget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get data bindings for a widget"""
    bindings = db.query(WidgetDataBinding).filter(
        WidgetDataBinding.app_widget_id == uuid.UUID(widget_id),
        WidgetDataBinding.is_active == True
    ).all()
    
    return {
        "bindings": [
            {
                "id": str(b.id),
                "binding_type": b.binding_type,
                "field_mappings": b.field_mappings,
                "refresh_interval": b.refresh_interval,
                "data_source_endpoint_id": str(b.data_source_endpoint_id) if b.data_source_endpoint_id else None,
                "scraper_id": str(b.scraper_id) if b.scraper_id else None
            }
            for b in bindings
        ]
    }


@router.delete("/bindings/{binding_id}")
async def delete_widget_binding(
    binding_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a widget binding"""
    binding = db.query(WidgetDataBinding).filter(
        WidgetDataBinding.id == uuid.UUID(binding_id)
    ).first()
    
    if not binding:
        raise HTTPException(status_code=404, detail="Binding not found")
    
    binding.is_active = False
    db.commit()
    
    return {"success": True}


# ============================================
# HELPER FUNCTIONS
# ============================================

def build_headers(source: DataSource) -> Dict[str, str]:
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


async def fetch_from_api(
    source: DataSource,
    endpoint: DataSourceEndpoint,
    params: Dict[str, Any]
) -> Any:
    """Fetch data from external API"""
    headers = build_headers(source)
    headers.update(endpoint.headers or {})
    
    # Build URL
    url = f"{source.base_url}{endpoint.path}"
    
    # Merge query params
    query_params = dict(endpoint.query_params or {})
    query_params.update(params)
    
    # Build body
    body = None
    if endpoint.method in ["POST", "PUT", "PATCH"] and endpoint.body_template:
        body = endpoint.body_template.copy()
        # Replace placeholders with params
        for key, value in params.items():
            if f"{{{key}}}" in str(body):
                body = replace_placeholders(body, {key: value})
    
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


def replace_placeholders(obj: Any, values: Dict[str, Any]) -> Any:
    """Replace placeholders in object with values"""
    if isinstance(obj, str):
        for key, value in values.items():
            obj = obj.replace(f"{{{key}}}", str(value))
        return obj
    elif isinstance(obj, dict):
        return {k: replace_placeholders(v, values) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_placeholders(item, values) for item in obj]
    return obj


def apply_response_mapping(data: Any, mapping: Dict[str, str]) -> Any:
    """Apply field mapping to response data"""
    if isinstance(data, list):
        return [apply_response_mapping(item, mapping) for item in data]
    
    if isinstance(data, dict):
        result = {}
        for target_field, source_path in mapping.items():
            value = get_nested_value(data, source_path)
            result[target_field] = value
        return result
    
    return data


def get_nested_value(obj: Dict, path: str) -> Any:
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


def generate_cache_key(endpoint_id: str, params: Dict) -> str:
    """Generate cache key from endpoint and params"""
    import json
    param_str = json.dumps(params, sort_keys=True)
    return hashlib.sha256(f"{endpoint_id}:{param_str}".encode()).hexdigest()[:64]


def analyze_response_structure(data: Any, prefix: str = "") -> List[Dict]:
    """Analyze response structure for field mapping UI"""
    fields = []
    
    if isinstance(data, list) and len(data) > 0:
        data = data[0]
    
    if isinstance(data, dict):
        for key, value in data.items():
            field_path = f"{prefix}.{key}" if prefix else key
            field_type = type(value).__name__
            
            if isinstance(value, dict):
                fields.append({"path": field_path, "type": "object"})
                fields.extend(analyze_response_structure(value, field_path))
            elif isinstance(value, list):
                fields.append({"path": field_path, "type": "array"})
                if len(value) > 0:
                    fields.extend(analyze_response_structure(value[0], f"{field_path}[0]"))
            else:
                fields.append({"path": field_path, "type": field_type, "sample": str(value)[:100]})
    
    return fields
