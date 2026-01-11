"""
Widget Data Binding Service
Handles binding widgets to various data sources (APIs, Collections, Scrapers)
"""

from typing import List, Optional, Dict, Any, Union, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import json

from src.common.base_service import BaseService
from src.common.exceptions import NotFoundError, ValidationError
from .models import WidgetDataBinding, DataSourceEndpoint
from ..collections.models import Collection, CollectionRecord
from .service import EndpointService
from ..collections.service import RecordService


class WidgetDataBindingService:
    """Service for managing widget data bindings"""
    
    def __init__(self, db: Session):
        self.db = db
        self.endpoint_service = EndpointService(db)
        self.record_service = RecordService(db)
    
    def create_binding(
        self,
        app_id: str,
        widget_id: str,
        widget_type: str,
        data_source_type: str,
        config: Dict[str, Any]
    ) -> WidgetDataBinding:
        """Create a new widget data binding"""
        
        # Validate data source configuration
        if data_source_type == "api":
            if not config.get("data_source_endpoint_id"):
                raise ValidationError("API binding requires data_source_endpoint_id")
        elif data_source_type == "collection":
            if not config.get("collection_id"):
                raise ValidationError("Collection binding requires collection_id")
        elif data_source_type == "scraper":
            if not config.get("scraper_id"):
                raise ValidationError("Scraper binding requires scraper_id")
        else:
            raise ValidationError("Invalid data_source_type")
        
        # Remove existing bindings for this widget
        self.db.query(WidgetDataBinding).filter(
            WidgetDataBinding.app_id == uuid.UUID(app_id),
            WidgetDataBinding.widget_id == uuid.UUID(widget_id)
        ).update({"is_active": False})
        
        binding = WidgetDataBinding(
            app_id=uuid.UUID(app_id),
            widget_id=uuid.UUID(widget_id),
            widget_type=widget_type,
            data_source_type=data_source_type,
            data_source_endpoint_id=uuid.UUID(config["data_source_endpoint_id"]) if config.get("data_source_endpoint_id") else None,
            collection_id=uuid.UUID(config["collection_id"]) if config.get("collection_id") else None,
            scraper_id=uuid.UUID(config["scraper_id"]) if config.get("scraper_id") else None,
            field_mappings=config.get("field_mappings", {}),
            filters=config.get("filters", {}),
            sorting=config.get("sorting", {}),
            pagination=config.get("pagination", {"page": 1, "page_size": 20}),
            refresh_interval=config.get("refresh_interval", 0),
            cache_duration=config.get("cache_duration", 300),
            transform_script=config.get("transform_script")
        )
        
        self.db.add(binding)
        self.db.commit()
        self.db.refresh(binding)
        
        return binding
    
    def get_widget_binding(self, app_id: str, widget_id: str) -> Optional[WidgetDataBinding]:
        """Get active binding for a widget"""
        return self.db.query(WidgetDataBinding).filter(
            WidgetDataBinding.app_id == uuid.UUID(app_id),
            WidgetDataBinding.widget_id == uuid.UUID(widget_id),
            WidgetDataBinding.is_active == True
        ).first()
    
    def update_binding(
        self,
        binding_id: str,
        config: Dict[str, Any]
    ) -> WidgetDataBinding:
        """Update a widget data binding"""
        binding = self.db.query(WidgetDataBinding).filter(
            WidgetDataBinding.id == uuid.UUID(binding_id),
            WidgetDataBinding.is_active == True
        ).first()
        
        if not binding:
            raise NotFoundError("Widget binding not found")
        
        # Update fields
        for key, value in config.items():
            if hasattr(binding, key):
                setattr(binding, key, value)
        
        binding.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(binding)
        
        return binding
    
    def delete_binding(self, binding_id: str) -> bool:
        """Delete a widget data binding"""
        binding = self.db.query(WidgetDataBinding).filter(
            WidgetDataBinding.id == uuid.UUID(binding_id)
        ).first()
        
        if not binding:
            raise NotFoundError("Widget binding not found")
        
        binding.is_active = False
        self.db.commit()
        return True
    
    async def fetch_widget_data(
        self,
        app_id: str,
        widget_id: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Fetch data for a widget based on its binding"""
        binding = self.get_widget_binding(app_id, widget_id)
        
        if not binding:
            return {"data": [], "total": 0, "error": "No data binding configured"}
        
        try:
            if binding.data_source_type == "api":
                return await self._fetch_api_data(binding, params or {})
            elif binding.data_source_type == "collection":
                return await self._fetch_collection_data(binding, params or {})
            elif binding.data_source_type == "scraper":
                return await self._fetch_scraper_data(binding, params or {})
            else:
                return {"data": [], "total": 0, "error": "Invalid data source type"}
        
        except Exception as e:
            # Update sync status
            binding.sync_status = "error"
            binding.sync_error = str(e)
            binding.last_sync = datetime.utcnow()
            self.db.commit()
            
            return {"data": [], "total": 0, "error": str(e)}
    
    async def _fetch_api_data(
        self,
        binding: WidgetDataBinding,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Fetch data from API endpoint"""
        if not binding.data_source_endpoint_id:
            raise ValueError("No API endpoint configured")
        
        # Get endpoint
        endpoint = self.db.query(DataSourceEndpoint).filter(
            DataSourceEndpoint.id == binding.data_source_endpoint_id,
            DataSourceEndpoint.is_active == True
        ).first()
        
        if not endpoint:
            raise ValueError("API endpoint not found")
        
        # Merge params with filters
        api_params = {**binding.filters, **params}
        
        # Add pagination
        if binding.pagination:
            api_params.update(binding.pagination)
        
        # Fetch data using endpoint service
        result = await self.endpoint_service.fetch_data(
            str(binding.data_source_endpoint_id),
            str(endpoint.data_source_id),
            api_params,
            True  # Use cache
        )
        
        data = result.get("data", [])
        
        # Apply field mappings
        if binding.field_mappings:
            data = self._apply_field_mappings(data, binding.field_mappings)
        
        # Apply transformation script
        if binding.transform_script:
            data = self._apply_transform_script(data, binding.transform_script)
        
        # Update sync status
        binding.sync_status = "success"
        binding.sync_error = None
        binding.last_sync = datetime.utcnow()
        self.db.commit()
        
        return {
            "data": data,
            "total": len(data) if isinstance(data, list) else 1,
            "cached": result.get("cached", False),
            "binding_id": str(binding.id)
        }
    
    async def _fetch_collection_data(
        self,
        binding: WidgetDataBinding,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Fetch data from collection"""
        if not binding.collection_id:
            raise ValueError("No collection configured")
        
        # Get collection
        collection = self.db.query(Collection).filter(
            Collection.id == binding.collection_id,
            Collection.is_active == True
        ).first()
        
        if not collection:
            raise ValueError("Collection not found")
        
        # Build query parameters
        page = params.get("page", binding.pagination.get("page", 1))
        page_size = params.get("page_size", binding.pagination.get("page_size", 20))
        search = params.get("search")
        sort_field = binding.sorting.get("field")
        sort_order = binding.sorting.get("order", "desc")
        
        # Fetch records
        records, total = self.record_service.list_records(
            str(binding.collection_id),
            page=page,
            page_size=page_size,
            sort_field=sort_field,
            sort_order=sort_order,
            search=search
        )
        
        # Convert to data format
        data = [
            {
                "id": str(record.id),
                **record.data,
                "_created_at": record.created_at.isoformat(),
                "_updated_at": record.updated_at.isoformat()
            }
            for record in records
        ]
        
        # Apply field mappings
        if binding.field_mappings:
            data = self._apply_field_mappings(data, binding.field_mappings)
        
        # Apply transformation script
        if binding.transform_script:
            data = self._apply_transform_script(data, binding.transform_script)
        
        # Update sync status
        binding.sync_status = "success"
        binding.sync_error = None
        binding.last_sync = datetime.utcnow()
        self.db.commit()
        
        return {
            "data": data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "binding_id": str(binding.id)
        }
    
    async def _fetch_scraper_data(
        self,
        binding: WidgetDataBinding,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Fetch data from web scraper"""
        if not binding.scraper_id:
            raise ValueError("No scraper configured")
        
        # Import scraper service
        from ..scrapers.service import ScraperService
        from ..scrapers.models import WebScraper
        
        scraper_service = ScraperService(self.db)
        
        try:
            # Get scraper
            scraper = self.db.query(WebScraper).filter(
                WebScraper.id == binding.scraper_id,
                WebScraper.is_active == True
            ).first()
            
            if not scraper:
                raise ValueError("Scraper not found")
            
            # Get cached data first
            use_cache = params.get("use_cache", True)
            result = await scraper_service.get_scraper_data(
                str(binding.scraper_id),
                use_cache=use_cache
            )
            
            data = result.get("data", [])
            
            # Apply filters if specified
            if binding.filters:
                data = self._apply_filters(data, binding.filters)
            
            # Apply sorting
            if binding.sorting:
                data = self._apply_sorting(data, binding.sorting)
            
            # Apply pagination
            if binding.pagination:
                data, total = self._apply_pagination(data, binding.pagination, params)
            else:
                total = len(data)
            
            # Apply field mappings
            if binding.field_mappings:
                data = self._apply_field_mappings(data, binding.field_mappings)
            
            # Apply transformation script
            if binding.transform_script:
                data = self._apply_transform_script(data, binding.transform_script)
            
            # Update sync status
            binding.sync_status = "success"
            binding.sync_error = None
            binding.last_sync = datetime.utcnow()
            self.db.commit()
            
            return {
                "data": data,
                "total": total,
                "cached": result.get("cached", False),
                "scraped_at": result.get("scraped_at"),
                "binding_id": str(binding.id)
            }
        
        except Exception as e:
            # If no cached data, try to run scraper
            if "No data available" in str(e) and not params.get("no_auto_run"):
                try:
                    await scraper_service.run_scraper(str(binding.scraper_id))
                    # Retry with cached data
                    return await self._fetch_scraper_data(
                        binding, 
                        {**params, "no_auto_run": True}
                    )
                except Exception as run_error:
                    raise ValueError(f"Failed to run scraper: {str(run_error)}")
            
            raise ValueError(f"Scraper data fetch failed: {str(e)}")
    
    def _apply_field_mappings(
        self,
        data: Union[List[Dict], Dict],
        mappings: Dict[str, str]
    ) -> Union[List[Dict], Dict]:
        """Apply field mappings to transform data structure"""
        if isinstance(data, list):
            return [self._apply_field_mappings(item, mappings) for item in data]
        
        if isinstance(data, dict):
            result = {}
            for target_field, source_path in mappings.items():
                value = self._get_nested_value(data, source_path)
                result[target_field] = value
            
            # Include unmapped fields if no explicit mapping
            if not mappings:
                result = data
            
            return result
        
        return data
    
    def _get_nested_value(self, obj: Dict, path: str) -> Any:
        """Get nested value using dot notation"""
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
    
    def _apply_transform_script(self, data: Any, script: str) -> Any:
        """Apply JavaScript transformation script to data"""
        # TODO: Implement safe JavaScript execution
        # For now, return data unchanged
        # In production, use a sandboxed JS engine like PyMiniRacer
        return data
    
    def _apply_filters(self, data: List[Dict], filters: Dict[str, Any]) -> List[Dict]:
        """Apply filters to data"""
        if not filters or not data:
            return data
        
        filtered_data = []
        for item in data:
            include_item = True
            
            for field, condition in filters.items():
                if not self._check_filter_condition(item, field, condition):
                    include_item = False
                    break
            
            if include_item:
                filtered_data.append(item)
        
        return filtered_data
    
    def _check_filter_condition(self, item: Dict, field: str, condition: Any) -> bool:
        """Check if item matches filter condition"""
        value = self._get_nested_value(item, field)
        
        if isinstance(condition, dict):
            op = condition.get("op", "eq")
            filter_value = condition.get("value")
            
            if op == "eq":
                return value == filter_value
            elif op == "ne":
                return value != filter_value
            elif op == "gt":
                return self._safe_compare(value, filter_value, lambda a, b: a > b)
            elif op == "lt":
                return self._safe_compare(value, filter_value, lambda a, b: a < b)
            elif op == "gte":
                return self._safe_compare(value, filter_value, lambda a, b: a >= b)
            elif op == "lte":
                return self._safe_compare(value, filter_value, lambda a, b: a <= b)
            elif op == "contains":
                return filter_value in str(value) if value else False
            elif op == "in":
                return value in filter_value if isinstance(filter_value, list) else False
            elif op == "not_in":
                return value not in filter_value if isinstance(filter_value, list) else True
        else:
            return value == condition
        
        return True
    
    def _safe_compare(self, a: Any, b: Any, comparator) -> bool:
        """Safely compare values with type conversion"""
        try:
            # Try numeric comparison first
            return comparator(float(a), float(b))
        except (ValueError, TypeError):
            try:
                # Try string comparison
                return comparator(str(a), str(b))
            except:
                return False
    
    def _apply_sorting(self, data: List[Dict], sorting: Dict[str, Any]) -> List[Dict]:
        """Apply sorting to data"""
        if not sorting or not data:
            return data
        
        field = sorting.get("field")
        order = sorting.get("order", "asc")
        
        if not field:
            return data
        
        try:
            reverse = order.lower() == "desc"
            
            def sort_key(item):
                value = self._get_nested_value(item, field)
                # Handle None values
                if value is None:
                    return "" if isinstance(value, str) else 0
                # Try to convert to number for numeric sorting
                try:
                    return float(value)
                except (ValueError, TypeError):
                    return str(value).lower()
            
            return sorted(data, key=sort_key, reverse=reverse)
        except Exception:
            return data
    
    def _apply_pagination(
        self, 
        data: List[Dict], 
        pagination: Dict[str, Any], 
        params: Dict[str, Any]
    ) -> Tuple[List[Dict], int]:
        """Apply pagination to data"""
        total = len(data)
        
        page = params.get("page", pagination.get("page", 1))
        page_size = params.get("page_size", pagination.get("page_size", 20))
        
        # Ensure valid pagination values
        page = max(1, int(page))
        page_size = max(1, min(100, int(page_size)))
        
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        return data[start_idx:end_idx], total
    
    def list_app_bindings(self, app_id: str) -> List[WidgetDataBinding]:
        """List all active bindings for an app"""
        return self.db.query(WidgetDataBinding).filter(
            WidgetDataBinding.app_id == uuid.UUID(app_id),
            WidgetDataBinding.is_active == True
        ).order_by(WidgetDataBinding.created_at.desc()).all()
    
    def get_binding_stats(self, app_id: str) -> Dict[str, Any]:
        """Get binding statistics for an app"""
        bindings = self.list_app_bindings(app_id)
        
        stats = {
            "total_bindings": len(bindings),
            "by_type": {},
            "by_status": {},
            "last_sync": None
        }
        
        for binding in bindings:
            # Count by data source type
            if binding.data_source_type not in stats["by_type"]:
                stats["by_type"][binding.data_source_type] = 0
            stats["by_type"][binding.data_source_type] += 1
            
            # Count by sync status
            if binding.sync_status not in stats["by_status"]:
                stats["by_status"][binding.sync_status] = 0
            stats["by_status"][binding.sync_status] += 1
            
            # Track latest sync
            if binding.last_sync:
                if not stats["last_sync"] or binding.last_sync > stats["last_sync"]:
                    stats["last_sync"] = binding.last_sync
        
        return stats