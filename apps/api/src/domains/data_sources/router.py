"""
Data Sources domain router
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.models import User
from src.common.exceptions import NotFoundError
from .service import DataSourceService, EndpointService
from .widget_binding_service import WidgetDataBindingService
from .schemas import (
    DataSourceCreate, DataSourceUpdate, DataSourceResponse,
    EndpointCreate, EndpointUpdate, EndpointResponse,
    WidgetBindingCreate, WidgetBindingUpdate, TestConnectionResponse, FetchDataResponse
)

router = APIRouter(prefix="/data-sources", tags=["Data Sources"])


@router.post("")
async def create_data_source(
    app_id: str = Query(...),
    data: DataSourceCreate = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new data source for an app"""
    service = DataSourceService(db)
    source = service.create_data_source(app_id, data)
    
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
    service = DataSourceService(db)
    sources = service.list_data_sources(app_id)
    
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
    try:
        service = DataSourceService(db)
        source = service.get_data_source(source_id)
        
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
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Data source not found")


@router.put("/{source_id}")
async def update_data_source(
    source_id: str,
    data: DataSourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a data source"""
    try:
        service = DataSourceService(db)
        source = service.update_data_source(source_id, data)
        return {"success": True, "id": str(source.id)}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Data source not found")


@router.delete("/{source_id}")
async def delete_data_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a data source"""
    try:
        service = DataSourceService(db)
        service.delete_data_source(source_id)
        return {"success": True}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Data source not found")


@router.post("/{source_id}/test")
async def test_data_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test connection to a data source"""
    try:
        service = DataSourceService(db)
        result = await service.test_connection(source_id)
        return result
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Data source not found")


# Endpoint routes
@router.post("/{source_id}/endpoints")
async def create_endpoint(
    source_id: str,
    data: EndpointCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add an endpoint to a data source"""
    # Verify source exists
    source_service = DataSourceService(db)
    try:
        source_service.get_data_source(source_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    endpoint_service = EndpointService(db)
    endpoint = endpoint_service.create_endpoint(source_id, data)
    
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
    endpoint_service = EndpointService(db)
    endpoints = endpoint_service.list_endpoints(source_id)
    
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
    try:
        endpoint_service = EndpointService(db)
        endpoint = endpoint_service.update_endpoint(endpoint_id, source_id, data)
        return {"success": True, "id": str(endpoint.id)}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Endpoint not found")


@router.delete("/{source_id}/endpoints/{endpoint_id}")
async def delete_endpoint(
    source_id: str,
    endpoint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an endpoint"""
    try:
        endpoint_service = EndpointService(db)
        endpoint_service.delete_endpoint(endpoint_id, source_id)
        return {"success": True}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Endpoint not found")


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
    try:
        endpoint_service = EndpointService(db)
        result = await endpoint_service.fetch_data(endpoint_id, source_id, params, use_cache)
        return result
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Endpoint not found")
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
    try:
        endpoint_service = EndpointService(db)
        result = await endpoint_service.fetch_data(endpoint_id, source_id, {}, False)
        data = result.get("data")
        
        # Analyze response structure
        structure = _analyze_response_structure(data)
        
        return {
            "sample_data": data[:5] if isinstance(data, list) else data,
            "structure": structure,
            "total_items": len(data) if isinstance(data, list) else 1
        }
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview: {str(e)}")


def _analyze_response_structure(data: Any, prefix: str = "") -> list:
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
                fields.extend(_analyze_response_structure(value, field_path))
            elif isinstance(value, list):
                fields.append({"path": field_path, "type": "array"})
                if len(value) > 0:
                    fields.extend(_analyze_response_structure(value[0], f"{field_path}[0]"))
            else:
                fields.append({"path": field_path, "type": field_type, "sample": str(value)[:100]})
    
    return fields


# ============================================
# WIDGET BINDING ENDPOINTS
# ============================================

@router.post("/apps/{app_id}/widgets/{widget_id}/binding")
async def create_widget_binding(
    app_id: str,
    widget_id: str,
    data: WidgetBindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a widget data binding"""
    binding_service = WidgetDataBindingService(db)
    
    config = {
        "data_source_endpoint_id": data.data_source_endpoint_id,
        "collection_id": data.collection_id,
        "scraper_id": data.scraper_id,
        "field_mappings": data.field_mappings,
        "filters": data.filters,
        "sorting": data.sorting,
        "pagination": data.pagination,
        "refresh_interval": data.refresh_interval,
        "cache_duration": data.cache_duration,
        "transform_script": data.transform_script
    }
    
    try:
        binding = binding_service.create_binding(
            app_id, widget_id, data.widget_type, data.data_source_type, config
        )
        
        return {
            "id": str(binding.id),
            "widget_id": widget_id,
            "data_source_type": binding.data_source_type,
            "created_at": binding.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/{app_id}/widgets/{widget_id}/binding")
async def get_widget_binding(
    app_id: str,
    widget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get widget data binding"""
    binding_service = WidgetDataBindingService(db)
    binding = binding_service.get_widget_binding(app_id, widget_id)
    
    if not binding:
        raise HTTPException(status_code=404, detail="No binding found for this widget")
    
    return {
        "id": str(binding.id),
        "widget_id": str(binding.widget_id),
        "widget_type": binding.widget_type,
        "data_source_type": binding.data_source_type,
        "data_source_endpoint_id": str(binding.data_source_endpoint_id) if binding.data_source_endpoint_id else None,
        "collection_id": str(binding.collection_id) if binding.collection_id else None,
        "scraper_id": str(binding.scraper_id) if binding.scraper_id else None,
        "field_mappings": binding.field_mappings,
        "filters": binding.filters,
        "sorting": binding.sorting,
        "pagination": binding.pagination,
        "refresh_interval": binding.refresh_interval,
        "cache_duration": binding.cache_duration,
        "transform_script": binding.transform_script,
        "sync_status": binding.sync_status,
        "last_sync": binding.last_sync.isoformat() if binding.last_sync else None,
        "sync_error": binding.sync_error,
        "created_at": binding.created_at.isoformat(),
        "updated_at": binding.updated_at.isoformat()
    }


@router.put("/apps/{app_id}/widgets/{widget_id}/binding")
async def update_widget_binding(
    app_id: str,
    widget_id: str,
    data: WidgetBindingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update widget data binding"""
    binding_service = WidgetDataBindingService(db)
    binding = binding_service.get_widget_binding(app_id, widget_id)
    
    if not binding:
        raise HTTPException(status_code=404, detail="No binding found for this widget")
    
    try:
        config = data.model_dump(exclude_unset=True)
        updated_binding = binding_service.update_binding(str(binding.id), config)
        
        return {
            "id": str(updated_binding.id),
            "updated_at": updated_binding.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/apps/{app_id}/widgets/{widget_id}/binding")
async def delete_widget_binding(
    app_id: str,
    widget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete widget data binding"""
    binding_service = WidgetDataBindingService(db)
    binding = binding_service.get_widget_binding(app_id, widget_id)
    
    if not binding:
        raise HTTPException(status_code=404, detail="No binding found for this widget")
    
    try:
        binding_service.delete_binding(str(binding.id))
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/{app_id}/widgets/{widget_id}/data")
async def fetch_widget_data(
    app_id: str,
    widget_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    use_cache: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch data for a widget based on its binding"""
    binding_service = WidgetDataBindingService(db)
    
    params = {
        "page": page,
        "page_size": page_size,
        "search": search,
        "use_cache": use_cache
    }
    
    try:
        result = await binding_service.fetch_widget_data(app_id, widget_id, params)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/apps/{app_id}/bindings")
async def list_app_bindings(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all widget bindings for an app"""
    binding_service = WidgetDataBindingService(db)
    bindings = binding_service.list_app_bindings(app_id)
    
    return {
        "bindings": [
            {
                "id": str(b.id),
                "widget_id": str(b.widget_id),
                "widget_type": b.widget_type,
                "data_source_type": b.data_source_type,
                "sync_status": b.sync_status,
                "last_sync": b.last_sync.isoformat() if b.last_sync else None,
                "created_at": b.created_at.isoformat()
            }
            for b in bindings
        ],
        "total": len(bindings)
    }


@router.get("/apps/{app_id}/bindings/stats")
async def get_binding_stats(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get binding statistics for an app"""
    binding_service = WidgetDataBindingService(db)
    stats = binding_service.get_binding_stats(app_id)
    
    if stats["last_sync"]:
        stats["last_sync"] = stats["last_sync"].isoformat()
    
    return stats
