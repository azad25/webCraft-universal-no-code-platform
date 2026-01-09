"""
Data Flow Management API Routes
Advanced data pipeline and transformation system
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from enum import Enum
import uuid
import asyncio
import httpx
import json
from io import StringIO

# Optional pandas import
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None

from core.database import (
    get_db, App, User, AppCollection, AppRecord, 
    DataSource, DataSourceEndpoint, DataSourceCache
)
from core.auth import get_current_user

router = APIRouter()


class DataFlowType(str, Enum):
    ETL = "etl"  # Extract, Transform, Load
    SYNC = "sync"  # Real-time synchronization
    BATCH = "batch"  # Batch processing
    STREAM = "stream"  # Stream processing
    WEBHOOK = "webhook"  # Webhook-triggered


class TransformationType(str, Enum):
    MAP = "map"  # Field mapping
    FILTER = "filter"  # Data filtering
    AGGREGATE = "aggregate"  # Data aggregation
    JOIN = "join"  # Data joining
    SPLIT = "split"  # Data splitting
    VALIDATE = "validate"  # Data validation
    ENRICH = "enrich"  # Data enrichment
    DEDUPE = "dedupe"  # Deduplication
    SORT = "sort"  # Sorting
    GROUP = "group"  # Grouping


class DataSource(BaseModel):
    type: str  # api, database, file, webhook, collection
    config: Dict[str, Any]
    name: Optional[str] = None


class DataDestination(BaseModel):
    type: str  # collection, api, file, webhook
    config: Dict[str, Any]
    name: Optional[str] = None


class TransformationStep(BaseModel):
    type: TransformationType
    config: Dict[str, Any]
    name: Optional[str] = None
    enabled: bool = True


class DataFlowConfig(BaseModel):
    id: Optional[str] = None
    app_id: str
    name: str
    description: Optional[str] = None
    flow_type: DataFlowType
    source: DataSource
    destination: DataDestination
    transformations: List[TransformationStep] = []
    schedule: Optional[Dict[str, Any]] = None  # For batch processing
    is_active: bool = True
    error_handling: Dict[str, Any] = {}


class DataFlowExecution(BaseModel):
    flow_id: str
    trigger_data: Dict[str, Any] = {}
    manual: bool = False


# ============================================
# DATA FLOW MANAGEMENT
# ============================================

@router.post("/apps/{app_id}/data-flows")
async def create_data_flow(
    app_id: uuid.UUID = Path(...),
    flow: DataFlowConfig = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new data flow"""
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Store data flow configuration
    app_config = app.config or {}
    if 'data_flows' not in app_config:
        app_config['data_flows'] = {}
    
    flow_id = str(uuid.uuid4())
    app_config['data_flows'][flow_id] = {
        "id": flow_id,
        "app_id": str(app_id),
        "name": flow.name,
        "description": flow.description,
        "flow_type": flow.flow_type,
        "source": flow.source.dict(),
        "destination": flow.destination.dict(),
        "transformations": [t.dict() for t in flow.transformations],
        "schedule": flow.schedule,
        "is_active": flow.is_active,
        "error_handling": flow.error_handling,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": str(current_user.id),
        "execution_count": 0,
        "last_executed": None,
        "last_error": None
    }
    
    app.config = app_config
    db.commit()
    
    return {
        "id": flow_id,
        "message": "Data flow created successfully"
    }


@router.get("/apps/{app_id}/data-flows")
async def list_data_flows(
    app_id: uuid.UUID = Path(...),
    flow_type: Optional[DataFlowType] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all data flows for an app"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = app.config or {}
    flows = app_config.get('data_flows', {})
    
    # Apply filters
    if flow_type:
        flows = {k: v for k, v in flows.items() if v.get('flow_type') == flow_type}
    
    if is_active is not None:
        flows = {k: v for k, v in flows.items() if v.get('is_active') == is_active}
    
    return {
        "flows": list(flows.values()),
        "total": len(flows)
    }


@router.get("/apps/{app_id}/data-flows/{flow_id}")
async def get_data_flow(
    app_id: uuid.UUID = Path(...),
    flow_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get data flow details"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = app.config or {}
    flows = app_config.get('data_flows', {})
    
    if flow_id not in flows:
        raise HTTPException(status_code=404, detail="Data flow not found")
    
    return flows[flow_id]


@router.put("/apps/{app_id}/data-flows/{flow_id}")
async def update_data_flow(
    app_id: uuid.UUID = Path(...),
    flow_id: str = Path(...),
    updates: Dict[str, Any] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a data flow"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = app.config or {}
    flows = app_config.get('data_flows', {})
    
    if flow_id not in flows:
        raise HTTPException(status_code=404, detail="Data flow not found")
    
    # Update flow
    flows[flow_id].update(updates)
    flows[flow_id]["updated_at"] = datetime.utcnow().isoformat()
    
    app.config = app_config
    db.commit()
    
    return {"message": "Data flow updated successfully"}


@router.delete("/apps/{app_id}/data-flows/{flow_id}")
async def delete_data_flow(
    app_id: uuid.UUID = Path(...),
    flow_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a data flow"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = app.config or {}
    flows = app_config.get('data_flows', {})
    
    if flow_id not in flows:
        raise HTTPException(status_code=404, detail="Data flow not found")
    
    del flows[flow_id]
    app.config = app_config
    db.commit()
    
    return {"message": "Data flow deleted successfully"}


# ============================================
# DATA FLOW EXECUTION
# ============================================

@router.post("/apps/{app_id}/data-flows/{flow_id}/execute")
async def execute_data_flow(
    app_id: uuid.UUID = Path(...),
    flow_id: str = Path(...),
    execution: DataFlowExecution = None,
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute a data flow"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = app.config or {}
    flows = app_config.get('data_flows', {})
    
    if flow_id not in flows:
        raise HTTPException(status_code=404, detail="Data flow not found")
    
    flow = flows[flow_id]
    
    if not flow.get('is_active', True):
        raise HTTPException(status_code=400, detail="Data flow is not active")
    
    # Execute in background
    background_tasks.add_task(
        execute_data_flow_pipeline,
        flow,
        execution.trigger_data,
        db,
        str(app_id)
    )
    
    return {
        "status": "started",
        "flow_id": flow_id,
        "message": "Data flow execution started"
    }


async def execute_data_flow_pipeline(
    flow: Dict[str, Any],
    trigger_data: Dict[str, Any],
    db: Session,
    app_id: str
):
    """Execute the complete data flow pipeline"""
    flow_id = flow['id']
    start_time = datetime.utcnow()
    
    try:
        # Step 1: Extract data from source
        source_data = await extract_data_from_source(flow['source'], trigger_data, db, app_id)
        
        # Step 2: Apply transformations
        transformed_data = source_data
        for transformation in flow.get('transformations', []):
            if transformation.get('enabled', True):
                transformed_data = await apply_transformation(
                    transformed_data, 
                    transformation, 
                    db, 
                    app_id
                )
        
        # Step 3: Load data to destination
        await load_data_to_destination(
            transformed_data, 
            flow['destination'], 
            db, 
            app_id
        )
        
        # Update execution stats
        await update_flow_execution_stats(flow_id, True, None, db, app_id)
        
    except Exception as e:
        error_message = str(e)
        print(f"Data flow {flow_id} failed: {error_message}")
        
        # Update execution stats with error
        await update_flow_execution_stats(flow_id, False, error_message, db, app_id)
        
        # Handle error based on error_handling config
        error_handling = flow.get('error_handling', {})
        if error_handling.get('notify_on_error', False):
            # Send notification about error
            pass


async def extract_data_from_source(
    source: Dict[str, Any], 
    trigger_data: Dict[str, Any], 
    db: Session, 
    app_id: str
) -> List[Dict[str, Any]]:
    """Extract data from various source types"""
    source_type = source.get('type')
    config = source.get('config', {})
    
    if source_type == 'api':
        return await extract_from_api(config, trigger_data)
    
    elif source_type == 'collection':
        return await extract_from_collection(config, db, app_id)
    
    elif source_type == 'file':
        return await extract_from_file(config)
    
    elif source_type == 'webhook':
        return [trigger_data]  # Webhook data is the trigger data
    
    elif source_type == 'database':
        return await extract_from_database(config)
    
    else:
        raise ValueError(f"Unsupported source type: {source_type}")


async def extract_from_api(config: Dict[str, Any], trigger_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract data from API endpoint"""
    url = config.get('url')
    method = config.get('method', 'GET')
    headers = config.get('headers', {})
    params = config.get('params', {})
    
    # Replace placeholders with trigger data
    if trigger_data:
        url = replace_placeholders(url, trigger_data)
        params = replace_placeholders(params, trigger_data)
    
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=method,
            url=url,
            headers=headers,
            params=params,
            timeout=30.0
        )
        response.raise_for_status()
        
        data = response.json()
        
        # Handle different response structures
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            # Check for common pagination patterns
            if 'data' in data and isinstance(data['data'], list):
                return data['data']
            elif 'results' in data and isinstance(data['results'], list):
                return data['results']
            elif 'items' in data and isinstance(data['items'], list):
                return data['items']
            else:
                return [data]
        else:
            return [{"value": data}]


async def extract_from_collection(config: Dict[str, Any], db: Session, app_id: str) -> List[Dict[str, Any]]:
    """Extract data from app collection"""
    collection_id = config.get('collection_id')
    filters = config.get('filters', {})
    limit = config.get('limit', 1000)
    
    if not collection_id:
        raise ValueError("Collection ID is required")
    
    query = db.query(AppRecord).filter(
        AppRecord.collection_id == uuid.UUID(collection_id),
        AppRecord.is_active == True
    )
    
    # Apply filters
    for field, condition in filters.items():
        if isinstance(condition, dict):
            op = condition.get('op', 'eq')
            value = condition.get('value')
            
            if op == 'eq':
                query = query.filter(AppRecord.data[field].astext == str(value))
            elif op == 'ne':
                query = query.filter(AppRecord.data[field].astext != str(value))
            elif op == 'gt':
                query = query.filter(AppRecord.data[field].astext.cast(db.Float) > value)
            elif op == 'lt':
                query = query.filter(AppRecord.data[field].astext.cast(db.Float) < value)
            elif op == 'contains':
                query = query.filter(AppRecord.data[field].astext.ilike(f"%{value}%"))
    
    records = query.limit(limit).all()
    return [record.data for record in records]


async def extract_from_file(config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract data from file (CSV, JSON, etc.)"""
    file_path = config.get('file_path')
    file_type = config.get('file_type', 'csv')
    
    if file_type == 'csv':
        if not HAS_PANDAS:
            raise HTTPException(status_code=500, detail="Pandas is required for CSV processing")
        df = pd.read_csv(file_path)
        return df.to_dict('records')
    elif file_type == 'json':
        with open(file_path, 'r') as f:
            data = json.load(f)
            return data if isinstance(data, list) else [data]
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


async def extract_from_database(config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract data from external database"""
    # This would integrate with various database types
    # For now, return empty list
    return []


async def apply_transformation(
    data: List[Dict[str, Any]], 
    transformation: Dict[str, Any], 
    db: Session, 
    app_id: str
) -> List[Dict[str, Any]]:
    """Apply a single transformation to data"""
    transform_type = transformation.get('type')
    config = transformation.get('config', {})
    
    if transform_type == TransformationType.MAP:
        return apply_field_mapping(data, config)
    
    elif transform_type == TransformationType.FILTER:
        return apply_data_filter(data, config)
    
    elif transform_type == TransformationType.AGGREGATE:
        return apply_aggregation(data, config)
    
    elif transform_type == TransformationType.JOIN:
        return await apply_data_join(data, config, db, app_id)
    
    elif transform_type == TransformationType.VALIDATE:
        return apply_validation(data, config)
    
    elif transform_type == TransformationType.ENRICH:
        return await apply_enrichment(data, config)
    
    elif transform_type == TransformationType.DEDUPE:
        return apply_deduplication(data, config)
    
    elif transform_type == TransformationType.SORT:
        return apply_sorting(data, config)
    
    elif transform_type == TransformationType.GROUP:
        return apply_grouping(data, config)
    
    else:
        return data


def apply_field_mapping(data: List[Dict[str, Any]], config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Apply field mapping transformation"""
    field_mappings = config.get('mappings', {})
    
    result = []
    for item in data:
        mapped_item = {}
        for target_field, source_field in field_mappings.items():
            if source_field in item:
                mapped_item[target_field] = item[source_field]
        result.append(mapped_item)
    
    return result


def apply_data_filter(data: List[Dict[str, Any]], config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Apply data filtering"""
    conditions = config.get('conditions', [])
    
    result = []
    for item in data:
        include = True
        for condition in conditions:
            field = condition.get('field')
            operator = condition.get('operator', 'eq')
            value = condition.get('value')
            
            if field not in item:
                include = False
                break
            
            item_value = item[field]
            
            if operator == 'eq' and item_value != value:
                include = False
                break
            elif operator == 'ne' and item_value == value:
                include = False
                break
            elif operator == 'gt' and float(item_value) <= float(value):
                include = False
                break
            elif operator == 'lt' and float(item_value) >= float(value):
                include = False
                break
            elif operator == 'contains' and value not in str(item_value):
                include = False
                break
        
        if include:
            result.append(item)
    
    return result


def apply_aggregation(data: List[Dict[str, Any]], config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Apply data aggregation"""
    group_by = config.get('group_by', [])
    aggregations = config.get('aggregations', [])
    
    if not group_by:
        # Global aggregation
        result = {}
        for agg in aggregations:
            field = agg.get('field')
            operation = agg.get('operation', 'sum')
            
            values = [float(item.get(field, 0)) for item in data if field in item]
            
            if operation == 'sum':
                result[f"{field}_sum"] = sum(values)
            elif operation == 'avg':
                result[f"{field}_avg"] = sum(values) / len(values) if values else 0
            elif operation == 'count':
                result[f"{field}_count"] = len(values)
            elif operation == 'min':
                result[f"{field}_min"] = min(values) if values else 0
            elif operation == 'max':
                result[f"{field}_max"] = max(values) if values else 0
        
        return [result]
    
    else:
        # Group by aggregation
        if not HAS_PANDAS:
            raise HTTPException(status_code=500, detail="Pandas is required for data aggregation")
        df = pd.DataFrame(data)
        grouped = df.groupby(group_by)
        
        result = []
        for name, group in grouped:
            group_result = {}
            
            # Add group by fields
            if isinstance(name, tuple):
                for i, field in enumerate(group_by):
                    group_result[field] = name[i]
            else:
                group_result[group_by[0]] = name
            
            # Apply aggregations
            for agg in aggregations:
                field = agg.get('field')
                operation = agg.get('operation', 'sum')
                
                if field in group.columns:
                    if operation == 'sum':
                        group_result[f"{field}_sum"] = group[field].sum()
                    elif operation == 'avg':
                        group_result[f"{field}_avg"] = group[field].mean()
                    elif operation == 'count':
                        group_result[f"{field}_count"] = group[field].count()
                    elif operation == 'min':
                        group_result[f"{field}_min"] = group[field].min()
                    elif operation == 'max':
                        group_result[f"{field}_max"] = group[field].max()
            
            result.append(group_result)
        
        return result


async def apply_data_join(
    data: List[Dict[str, Any]], 
    config: Dict[str, Any], 
    db: Session, 
    app_id: str
) -> List[Dict[str, Any]]:
    """Apply data join transformation"""
    join_source = config.get('join_source', {})
    join_key = config.get('join_key')
    join_type = config.get('join_type', 'left')  # left, right, inner, outer
    
    # Get join data
    join_data = await extract_data_from_source(join_source, {}, db, app_id)
    
    # Create lookup dictionary
    join_lookup = {item.get(join_key): item for item in join_data if join_key in item}
    
    result = []
    for item in data:
        if join_key in item:
            join_value = item[join_key]
            if join_value in join_lookup:
                # Merge data
                merged_item = {**item, **join_lookup[join_value]}
                result.append(merged_item)
            elif join_type in ['left', 'outer']:
                result.append(item)
        elif join_type in ['left', 'outer']:
            result.append(item)
    
    return result


def apply_validation(data: List[Dict[str, Any]], config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Apply data validation"""
    rules = config.get('rules', [])
    action = config.get('action', 'filter')  # filter, flag, fix
    
    result = []
    for item in data:
        is_valid = True
        validation_errors = []
        
        for rule in rules:
            field = rule.get('field')
            rule_type = rule.get('type')
            params = rule.get('params', {})
            
            if field not in item:
                if rule.get('required', False):
                    is_valid = False
                    validation_errors.append(f"Missing required field: {field}")
                continue
            
            value = item[field]
            
            if rule_type == 'type':
                expected_type = params.get('type')
                if expected_type == 'number' and not isinstance(value, (int, float)):
                    is_valid = False
                    validation_errors.append(f"Field {field} must be a number")
                elif expected_type == 'string' and not isinstance(value, str):
                    is_valid = False
                    validation_errors.append(f"Field {field} must be a string")
            
            elif rule_type == 'range':
                min_val = params.get('min')
                max_val = params.get('max')
                if min_val is not None and float(value) < min_val:
                    is_valid = False
                    validation_errors.append(f"Field {field} below minimum: {min_val}")
                if max_val is not None and float(value) > max_val:
                    is_valid = False
                    validation_errors.append(f"Field {field} above maximum: {max_val}")
            
            elif rule_type == 'pattern':
                import re
                pattern = params.get('pattern')
                if pattern and not re.match(pattern, str(value)):
                    is_valid = False
                    validation_errors.append(f"Field {field} doesn't match pattern")
        
        if action == 'filter' and is_valid:
            result.append(item)
        elif action == 'flag':
            item['_validation_errors'] = validation_errors
            item['_is_valid'] = is_valid
            result.append(item)
        elif action == 'fix':
            # Apply fixes based on rules
            result.append(item)
    
    return result


async def apply_enrichment(data: List[Dict[str, Any]], config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Apply data enrichment"""
    enrichment_source = config.get('source', {})
    lookup_field = config.get('lookup_field')
    enrich_fields = config.get('enrich_fields', [])
    
    # This would typically call external APIs for enrichment
    # For now, return data as-is
    return data


def apply_deduplication(data: List[Dict[str, Any]], config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Apply deduplication"""
    key_fields = config.get('key_fields', [])
    strategy = config.get('strategy', 'first')  # first, last, merge
    
    if not key_fields:
        return data
    
    seen = {}
    result = []
    
    for item in data:
        # Create key from specified fields
        key_values = tuple(item.get(field) for field in key_fields)
        
        if key_values not in seen:
            seen[key_values] = item
            result.append(item)
        elif strategy == 'last':
            seen[key_values] = item
            # Replace in result
            for i, existing in enumerate(result):
                existing_key = tuple(existing.get(field) for field in key_fields)
                if existing_key == key_values:
                    result[i] = item
                    break
        elif strategy == 'merge':
            # Merge with existing
            existing = seen[key_values]
            merged = {**existing, **item}
            seen[key_values] = merged
            # Update in result
            for i, existing in enumerate(result):
                existing_key = tuple(existing.get(field) for field in key_fields)
                if existing_key == key_values:
                    result[i] = merged
                    break
    
    return result


def apply_sorting(data: List[Dict[str, Any]], config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Apply sorting"""
    sort_fields = config.get('fields', [])
    
    if not sort_fields:
        return data
    
    def sort_key(item):
        return tuple(item.get(field['name'], '') for field in sort_fields)
    
    reverse = any(field.get('order', 'asc') == 'desc' for field in sort_fields)
    
    return sorted(data, key=sort_key, reverse=reverse)


def apply_grouping(data: List[Dict[str, Any]], config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Apply grouping"""
    group_by = config.get('group_by', [])
    
    if not group_by:
        return data
    
    groups = {}
    for item in data:
        key = tuple(item.get(field) for field in group_by)
        if key not in groups:
            groups[key] = []
        groups[key].append(item)
    
    result = []
    for key, items in groups.items():
        group_item = {}
        for i, field in enumerate(group_by):
            group_item[field] = key[i]
        group_item['items'] = items
        group_item['count'] = len(items)
        result.append(group_item)
    
    return result


async def load_data_to_destination(
    data: List[Dict[str, Any]], 
    destination: Dict[str, Any], 
    db: Session, 
    app_id: str
):
    """Load data to destination"""
    dest_type = destination.get('type')
    config = destination.get('config', {})
    
    if dest_type == 'collection':
        await load_to_collection(data, config, db, app_id)
    
    elif dest_type == 'api':
        await load_to_api(data, config)
    
    elif dest_type == 'file':
        await load_to_file(data, config)
    
    elif dest_type == 'webhook':
        await load_to_webhook(data, config)
    
    else:
        raise ValueError(f"Unsupported destination type: {dest_type}")


async def load_to_collection(
    data: List[Dict[str, Any]], 
    config: Dict[str, Any], 
    db: Session, 
    app_id: str
):
    """Load data to app collection"""
    collection_id = config.get('collection_id')
    mode = config.get('mode', 'append')  # append, replace, upsert
    
    if not collection_id:
        raise ValueError("Collection ID is required")
    
    if mode == 'replace':
        # Delete existing records
        db.query(AppRecord).filter(
            AppRecord.collection_id == uuid.UUID(collection_id)
        ).update({"is_active": False})
    
    # Insert new records
    for item in data:
        if mode == 'upsert':
            # Check if record exists (would need unique key logic)
            pass
        
        record = AppRecord(
            collection_id=uuid.UUID(collection_id),
            data=item
        )
        db.add(record)
    
    db.commit()


async def load_to_api(data: List[Dict[str, Any]], config: Dict[str, Any]):
    """Load data to external API"""
    url = config.get('url')
    method = config.get('method', 'POST')
    headers = config.get('headers', {})
    batch_size = config.get('batch_size', 100)
    
    async with httpx.AsyncClient() as client:
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                json=batch,
                timeout=30.0
            )
            response.raise_for_status()


async def load_to_file(data: List[Dict[str, Any]], config: Dict[str, Any]):
    """Load data to file"""
    file_path = config.get('file_path')
    file_type = config.get('file_type', 'csv')
    
    if file_type == 'csv':
        if not HAS_PANDAS:
            raise HTTPException(status_code=500, detail="Pandas is required for CSV export")
        df = pd.DataFrame(data)
        df.to_csv(file_path, index=False)
    elif file_type == 'json':
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)


async def load_to_webhook(data: List[Dict[str, Any]], config: Dict[str, Any]):
    """Load data to webhook"""
    url = config.get('url')
    headers = config.get('headers', {})
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url=url,
            headers=headers,
            json={"data": data},
            timeout=30.0
        )
        response.raise_for_status()


async def update_flow_execution_stats(
    flow_id: str, 
    success: bool, 
    error_message: Optional[str], 
    db: Session, 
    app_id: str
):
    """Update flow execution statistics"""
    # This would update the flow stats in the app config
    pass


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


# ============================================
# DATA FLOW TEMPLATES
# ============================================

@router.get("/data-flow-templates")
async def get_data_flow_templates(
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get pre-built data flow templates"""
    templates = {
        "api_to_collection": {
            "name": "API to Collection Sync",
            "description": "Sync data from external API to app collection",
            "category": "integration",
            "flow_type": "sync",
            "source": {
                "type": "api",
                "config": {
                    "url": "https://api.example.com/data",
                    "method": "GET",
                    "headers": {"Authorization": "Bearer {token}"}
                }
            },
            "destination": {
                "type": "collection",
                "config": {
                    "collection_id": "{collection_id}",
                    "mode": "upsert"
                }
            },
            "transformations": [
                {
                    "type": "map",
                    "config": {
                        "mappings": {
                            "id": "external_id",
                            "name": "title",
                            "email": "contact_email"
                        }
                    }
                },
                {
                    "type": "validate",
                    "config": {
                        "rules": [
                            {"field": "email", "type": "pattern", "params": {"pattern": "^[^@]+@[^@]+\\.[^@]+$"}}
                        ]
                    }
                }
            ]
        },
        
        "csv_import": {
            "name": "CSV Data Import",
            "description": "Import and process CSV files into collections",
            "category": "import",
            "flow_type": "batch",
            "source": {
                "type": "file",
                "config": {
                    "file_path": "{file_path}",
                    "file_type": "csv"
                }
            },
            "destination": {
                "type": "collection",
                "config": {
                    "collection_id": "{collection_id}",
                    "mode": "append"
                }
            },
            "transformations": [
                {
                    "type": "validate",
                    "config": {
                        "rules": [
                            {"field": "email", "type": "pattern", "required": True}
                        ]
                    }
                },
                {
                    "type": "dedupe",
                    "config": {
                        "key_fields": ["email"],
                        "strategy": "first"
                    }
                }
            ]
        },
        
        "webhook_processor": {
            "name": "Webhook Data Processor",
            "description": "Process incoming webhook data and store in collection",
            "category": "webhook",
            "flow_type": "webhook",
            "source": {
                "type": "webhook",
                "config": {}
            },
            "destination": {
                "type": "collection",
                "config": {
                    "collection_id": "{collection_id}",
                    "mode": "append"
                }
            },
            "transformations": [
                {
                    "type": "map",
                    "config": {
                        "mappings": {
                            "timestamp": "received_at",
                            "payload": "data"
                        }
                    }
                },
                {
                    "type": "enrich",
                    "config": {
                        "source": {
                            "type": "api",
                            "config": {
                                "url": "https://api.enrichment.com/lookup/{id}"
                            }
                        }
                    }
                }
            ]
        }
    }
    
    if category:
        templates = {k: v for k, v in templates.items() if v.get('category') == category}
    
    return {"templates": templates}


@router.post("/apps/{app_id}/data-flows/from-template")
async def create_data_flow_from_template(
    app_id: uuid.UUID = Path(...),
    template_id: str = Query(...),
    customizations: Dict[str, Any] = {},
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create data flow from template"""
    # Get template
    templates_response = await get_data_flow_templates(current_user=current_user)
    templates = templates_response["templates"]
    
    if template_id not in templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = templates[template_id]
    
    # Apply customizations
    flow_config = template.copy()
    flow_config.update(customizations)
    
    # Create data flow
    flow = DataFlowConfig(
        app_id=str(app_id),
        name=flow_config["name"],
        description=flow_config["description"],
        flow_type=flow_config["flow_type"],
        source=DataSource(**flow_config["source"]),
        destination=DataDestination(**flow_config["destination"]),
        transformations=[TransformationStep(**t) for t in flow_config.get("transformations", [])]
    )
    
    return await create_data_flow(app_id, flow, current_user, db)