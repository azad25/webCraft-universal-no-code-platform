"""
Data Flow Router - Unified data management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.models import User
from src.common.exceptions import NotFoundError, ValidationError
from .service import DataFlowService

router = APIRouter(prefix="/apps/{app_id}/data-flow", tags=["Data Flow"])


class DataConnectionCreate(BaseModel):
    widget_id: str
    widget_type: str
    data_source_type: str  # 'api', 'collection', 'scraper'
    data_source_endpoint_id: Optional[str] = None
    collection_id: Optional[str] = None
    scraper_id: Optional[str] = None
    field_mappings: Dict[str, str] = {}
    filters: Dict[str, Any] = {}
    sorting: Dict[str, Any] = {}
    pagination: Dict[str, Any] = {"page": 1, "page_size": 20}
    refresh_interval: int = 0
    cache_duration: int = 300
    transform_script: Optional[str] = None


@router.get("/sources")
async def get_unified_data_sources(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available data sources for an app"""
    service = DataFlowService(db)
    sources = await service.get_unified_data_sources(app_id)
    return sources


@router.post("/connections")
async def create_widget_data_connection(
    app_id: str,
    data: DataConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a unified data connection for a widget"""
    service = DataFlowService(db)
    
    try:
        connection_config = {
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
        
        result = await service.create_widget_data_connection(
            app_id, data.widget_id, data.widget_type, connection_config
        )
        
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/widgets/{widget_id}/data")
async def get_widget_data(
    app_id: str,
    widget_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    use_cache: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get data for a widget from its connected source"""
    service = DataFlowService(db)
    
    params = {
        "page": page,
        "page_size": page_size,
        "search": search,
        "use_cache": use_cache
    }
    
    try:
        result = await service.get_widget_data(app_id, widget_id, params)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sources/{source_id}/test")
async def test_data_source_connection(
    app_id: str,
    source_id: str,
    data_source_type: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test connection to any data source type"""
    service = DataFlowService(db)
    result = await service.test_data_source_connection(data_source_type, source_id, app_id)
    return result


@router.get("/sources/{source_id}/preview")
async def get_data_source_preview(
    app_id: str,
    source_id: str,
    data_source_type: str = Query(...),
    endpoint_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get preview data from any data source"""
    service = DataFlowService(db)
    result = await service.get_data_source_preview(
        data_source_type, source_id, app_id, endpoint_id
    )
    return result


@router.get("/stats")
async def get_app_data_flow_stats(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive data flow statistics for an app"""
    service = DataFlowService(db)
    stats = service.get_app_data_flow_stats(app_id)
    return stats