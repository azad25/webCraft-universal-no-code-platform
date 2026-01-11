"""
Collections domain router
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.models import User
from src.common.exceptions import NotFoundError, ValidationError
from .service import CollectionService, RecordService
from .schemas import (
    CollectionCreate, CollectionUpdate, CollectionResponse,
    RecordCreate, RecordUpdate, RecordResponse, RecordListResponse, RecordQuery
)

router = APIRouter(prefix="/apps/{app_id}/collections", tags=["Collections"])


@router.get("")
async def list_collections(
    app_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all collections for an app"""
    service = CollectionService(db)
    collections, total = service.list_collections(app_id, page, per_page)
    
    return {
        "collections": [
            {
                "id": str(c.id),
                "name": c.name,
                "slug": c.slug,
                "description": c.description,
                "icon": c.icon,
                "color": c.color,
                "schema": c.schema,
                "settings": c.settings,
                "record_count": service.get_record_count(str(c.id)),
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat()
            }
            for c in collections
        ],
        "total": total,
        "page": page,
        "per_page": per_page
    }


@router.post("")
async def create_collection(
    app_id: str,
    data: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new collection"""
    try:
        service = CollectionService(db)
        collection = service.create_collection(app_id, data)
        
        return {
            "id": str(collection.id),
            "name": collection.name,
            "slug": collection.slug,
            "description": collection.description,
            "icon": collection.icon,
            "color": collection.color,
            "schema": collection.schema,
            "settings": collection.settings,
            "created_at": collection.created_at.isoformat()
        }
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{collection_id}")
async def get_collection(
    app_id: str,
    collection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get collection details"""
    try:
        service = CollectionService(db)
        collection = service.get_collection(collection_id, app_id)
        
        return {
            "id": str(collection.id),
            "name": collection.name,
            "slug": collection.slug,
            "description": collection.description,
            "icon": collection.icon,
            "color": collection.color,
            "schema": collection.schema,
            "settings": collection.settings,
            "indexes": collection.indexes,
            "validation_rules": collection.validation_rules,
            "webhooks": collection.webhooks,
            "record_count": service.get_record_count(collection_id),
            "created_at": collection.created_at.isoformat(),
            "updated_at": collection.updated_at.isoformat()
        }
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Collection not found")


@router.put("/{collection_id}")
async def update_collection(
    app_id: str,
    collection_id: str,
    data: CollectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a collection"""
    try:
        service = CollectionService(db)
        collection = service.update_collection(collection_id, app_id, data)
        
        return {
            "id": str(collection.id),
            "name": collection.name,
            "slug": collection.slug,
            "schema": collection.schema,
            "updated_at": collection.updated_at.isoformat()
        }
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Collection not found")


@router.delete("/{collection_id}")
async def delete_collection(
    app_id: str,
    collection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a collection"""
    try:
        service = CollectionService(db)
        service.delete_collection(collection_id, app_id)
        return {"message": "Collection deleted"}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Collection not found")


# Record endpoints
@router.get("/{collection_id}/records")
async def list_records(
    app_id: str,
    collection_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort_field: Optional[str] = Query(None),
    sort_order: str = Query("desc"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List records in a collection"""
    # Verify collection exists
    collection_service = CollectionService(db)
    try:
        collection_service.get_collection(collection_id, app_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    record_service = RecordService(db)
    records, total = record_service.list_records(
        collection_id, page, page_size, sort_field, sort_order, search
    )
    
    return {
        "records": [
            {
                "id": str(r.id),
                "data": r.data,
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat(),
                "created_by": str(r.created_by_id) if r.created_by_id else None
            }
            for r in records
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/{collection_id}/records")
async def create_record(
    app_id: str,
    collection_id: str,
    data: RecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new record"""
    # Get collection schema
    collection_service = CollectionService(db)
    try:
        collection = collection_service.get_collection(collection_id, app_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    try:
        record_service = RecordService(db)
        record = record_service.create_record(
            collection_id, data, str(current_user.id), collection.schema
        )
        
        return {
            "id": str(record.id),
            "data": record.data,
            "created_at": record.created_at.isoformat()
        }
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{collection_id}/records/{record_id}")
async def get_record(
    app_id: str,
    collection_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single record"""
    try:
        record_service = RecordService(db)
        record = record_service.get_record(record_id, collection_id)
        
        return {
            "id": str(record.id),
            "data": record.data,
            "created_at": record.created_at.isoformat(),
            "updated_at": record.updated_at.isoformat(),
            "created_by": str(record.created_by_id) if record.created_by_id else None,
            "updated_by": str(record.updated_by_id) if record.updated_by_id else None
        }
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Record not found")


@router.put("/{collection_id}/records/{record_id}")
async def update_record(
    app_id: str,
    collection_id: str,
    record_id: str,
    data: RecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a record"""
    # Get collection schema
    collection_service = CollectionService(db)
    try:
        collection = collection_service.get_collection(collection_id, app_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    try:
        record_service = RecordService(db)
        record = record_service.update_record(
            record_id, collection_id, data, str(current_user.id), collection.schema
        )
        
        return {
            "id": str(record.id),
            "data": record.data,
            "updated_at": record.updated_at.isoformat()
        }
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Record not found")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{collection_id}/records/{record_id}")
async def delete_record(
    app_id: str,
    collection_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a record"""
    try:
        record_service = RecordService(db)
        record_service.delete_record(record_id, collection_id)
        return {"message": "Record deleted"}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Record not found")


@router.post("/{collection_id}/query")
async def query_records(
    app_id: str,
    collection_id: str,
    query: RecordQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Advanced query for records with filters"""
    # Verify collection exists
    collection_service = CollectionService(db)
    try:
        collection_service.get_collection(collection_id, app_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    record_service = RecordService(db)
    records, total = record_service.list_records(
        collection_id,
        query.page,
        query.page_size,
        query.sort_field,
        query.sort_order,
        query.search
    )
    
    return {
        "records": [
            {
                "id": str(r.id),
                "data": r.data,
                "created_at": r.created_at.isoformat()
            }
            for r in records
        ],
        "total": total,
        "page": query.page,
        "page_size": query.page_size
    }
