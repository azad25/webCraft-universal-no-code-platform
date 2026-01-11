"""
Data Flow Service - Unified data management across all sources
"""

from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from src.common.exceptions import NotFoundError, ValidationError
from ..data_sources.widget_binding_service import WidgetDataBindingService
from ..data_sources.service import DataSourceService, EndpointService
from ..collections.service import CollectionService, RecordService
from ..scrapers.service import ScraperService


class DataFlowService:
    """Unified service for managing data flow across all sources"""
    
    def __init__(self, db: Session):
        self.db = db
        self.widget_binding_service = WidgetDataBindingService(db)
        self.data_source_service = DataSourceService(db)
        self.endpoint_service = EndpointService(db)
        self.collection_service = CollectionService(db)
        self.record_service = RecordService(db)
        self.scraper_service = ScraperService(db)
    
    async def get_unified_data_sources(self, app_id: str) -> Dict[str, Any]:
        """Get all available data sources for an app"""
        
        # Get API data sources
        api_sources = self.data_source_service.list_data_sources(app_id)
        api_data = []
        for source in api_sources:
            endpoints = self.endpoint_service.list_endpoints(str(source.id))
            api_data.append({
                "id": str(source.id),
                "name": source.name,
                "description": source.description,
                "type": "api",
                "base_url": source.base_url,
                "is_connected": source.is_connected,
                "endpoints": [
                    {
                        "id": str(e.id),
                        "name": e.name,
                        "path": e.path,
                        "method": e.method
                    }
                    for e in endpoints
                ]
            })
        
        # Get collections
        collections, _ = self.collection_service.list_collections(app_id)
        collection_data = [
            {
                "id": str(c.id),
                "name": c.name,
                "description": c.description,
                "type": "collection",
                "slug": c.slug,
                "schema": c.schema,
                "record_count": self.collection_service.get_record_count(str(c.id))
            }
            for c in collections
        ]
        
        # Get scrapers
        scrapers = self.scraper_service.list_scrapers(app_id)
        scraper_data = [
            {
                "id": str(s.id),
                "name": s.name,
                "description": s.description,
                "type": "scraper",
                "url": s.url,
                "status": s.status,
                "last_run": s.last_run.isoformat() if s.last_run else None
            }
            for s in scrapers
        ]
        
        return {
            "api_sources": api_data,
            "collections": collection_data,
            "scrapers": scraper_data,
            "total": {
                "api_sources": len(api_data),
                "collections": len(collection_data),
                "scrapers": len(scraper_data)
            }
        }
    
    async def create_widget_data_connection(
        self,
        app_id: str,
        widget_id: str,
        widget_type: str,
        connection_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a unified data connection for a widget"""
        
        data_source_type = connection_config.get("data_source_type")
        
        if not data_source_type:
            raise ValidationError("data_source_type is required")
        
        # Validate the connection based on type
        if data_source_type == "api":
            endpoint_id = connection_config.get("data_source_endpoint_id")
            if not endpoint_id:
                raise ValidationError("data_source_endpoint_id is required for API connections")
            
            # Verify endpoint exists
            try:
                from ..data_sources.models import DataSourceEndpoint
                endpoint = self.db.query(DataSourceEndpoint).filter(
                    DataSourceEndpoint.id == uuid.UUID(endpoint_id),
                    DataSourceEndpoint.is_active == True
                ).first()
                if not endpoint:
                    raise ValidationError("API endpoint not found")
            except Exception:
                raise ValidationError("Invalid API endpoint ID")
        
        elif data_source_type == "collection":
            collection_id = connection_config.get("collection_id")
            if not collection_id:
                raise ValidationError("collection_id is required for collection connections")
            
            # Verify collection exists
            try:
                self.collection_service.get_collection(collection_id, app_id)
            except NotFoundError:
                raise ValidationError("Collection not found")
        
        elif data_source_type == "scraper":
            scraper_id = connection_config.get("scraper_id")
            if not scraper_id:
                raise ValidationError("scraper_id is required for scraper connections")
            
            # Verify scraper exists
            try:
                self.scraper_service.get_scraper(scraper_id)
            except NotFoundError:
                raise ValidationError("Scraper not found")
        
        else:
            raise ValidationError("Invalid data_source_type")
        
        # Create the binding
        binding = self.widget_binding_service.create_binding(
            app_id, widget_id, widget_type, data_source_type, connection_config
        )
        
        return {
            "binding_id": str(binding.id),
            "widget_id": widget_id,
            "data_source_type": data_source_type,
            "created_at": binding.created_at.isoformat()
        }
    
    async def get_widget_data(
        self,
        app_id: str,
        widget_id: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get data for a widget from its connected source"""
        return await self.widget_binding_service.fetch_widget_data(
            app_id, widget_id, params or {}
        )
    
    async def test_data_source_connection(
        self,
        data_source_type: str,
        source_id: str,
        app_id: str
    ) -> Dict[str, Any]:
        """Test connection to any data source type"""
        
        if data_source_type == "api":
            return await self.data_source_service.test_connection(source_id)
        
        elif data_source_type == "collection":
            try:
                collection = self.collection_service.get_collection(source_id, app_id)
                record_count = self.collection_service.get_record_count(source_id)
                return {
                    "success": True,
                    "message": f"Collection '{collection.name}' is accessible",
                    "record_count": record_count
                }
            except NotFoundError:
                return {
                    "success": False,
                    "message": "Collection not found"
                }
        
        elif data_source_type == "scraper":
            try:
                scraper = self.scraper_service.get_scraper(source_id)
                return {
                    "success": True,
                    "message": f"Scraper '{scraper.name}' is accessible",
                    "status": scraper.status,
                    "last_run": scraper.last_run.isoformat() if scraper.last_run else None
                }
            except NotFoundError:
                return {
                    "success": False,
                    "message": "Scraper not found"
                }
        
        else:
            return {
                "success": False,
                "message": "Invalid data source type"
            }
    
    async def get_data_source_preview(
        self,
        data_source_type: str,
        source_id: str,
        app_id: str,
        endpoint_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get preview data from any data source"""
        
        if data_source_type == "api" and endpoint_id:
            try:
                result = await self.endpoint_service.fetch_data(
                    endpoint_id, source_id, {}, False
                )
                data = result.get("data", [])
                
                return {
                    "success": True,
                    "data": data[:5] if isinstance(data, list) else data,
                    "total_items": len(data) if isinstance(data, list) else 1,
                    "structure": self._analyze_data_structure(data)
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e)
                }
        
        elif data_source_type == "collection":
            try:
                records, total = self.record_service.list_records(
                    source_id, page=1, page_size=5
                )
                
                data = [
                    {
                        "id": str(r.id),
                        **r.data,
                        "_created_at": r.created_at.isoformat()
                    }
                    for r in records
                ]
                
                return {
                    "success": True,
                    "data": data,
                    "total_items": total,
                    "structure": self._analyze_data_structure(data)
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e)
                }
        
        elif data_source_type == "scraper":
            try:
                result = await self.scraper_service.get_scraper_data(source_id, True)
                data = result.get("data", [])
                
                return {
                    "success": True,
                    "data": data[:5] if isinstance(data, list) else data,
                    "total_items": len(data) if isinstance(data, list) else 1,
                    "structure": self._analyze_data_structure(data),
                    "scraped_at": result.get("scraped_at")
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e)
                }
        
        else:
            return {
                "success": False,
                "error": "Invalid data source type or missing parameters"
            }
    
    def get_app_data_flow_stats(self, app_id: str) -> Dict[str, Any]:
        """Get comprehensive data flow statistics for an app"""
        
        # Get binding stats
        binding_stats = self.widget_binding_service.get_binding_stats(app_id)
        
        # Get source counts
        api_sources = len(self.data_source_service.list_data_sources(app_id))
        collections, total_collections = self.collection_service.list_collections(app_id, 1, 1000)
        scrapers = len(self.scraper_service.list_scrapers(app_id))
        
        # Calculate total records across all collections
        total_records = sum(
            self.collection_service.get_record_count(str(c.id))
            for c in collections
        )
        
        return {
            "data_sources": {
                "api_sources": api_sources,
                "collections": total_collections,
                "scrapers": scrapers,
                "total": api_sources + total_collections + scrapers
            },
            "widget_bindings": binding_stats,
            "data_volume": {
                "total_records": total_records,
                "collections_with_data": sum(
                    1 for c in collections 
                    if self.collection_service.get_record_count(str(c.id)) > 0
                )
            }
        }
    
    def _analyze_data_structure(self, data: Any) -> List[Dict[str, Any]]:
        """Analyze data structure for field mapping"""
        if not data:
            return []
        
        sample = data[0] if isinstance(data, list) and len(data) > 0 else data
        
        if not isinstance(sample, dict):
            return []
        
        fields = []
        for key, value in sample.items():
            field_info = {
                "name": key,
                "type": type(value).__name__,
                "sample": str(value)[:100] if value is not None else None
            }
            
            if isinstance(value, dict):
                field_info["type"] = "object"
                field_info["nested_fields"] = list(value.keys())
            elif isinstance(value, list):
                field_info["type"] = "array"
                if len(value) > 0:
                    field_info["item_type"] = type(value[0]).__name__
            
            fields.append(field_info)
        
        return fields