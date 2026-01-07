"""
Collections API Routes
User-defined database collections for no-code apps
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from core.database import (
    get_db, App, User, AppCollection, AppRecord, AppRelation
)
from core.auth import get_current_user

router = APIRouter()


# ============================================
# PYDANTIC MODELS
# ============================================

class FieldDefinition(BaseModel):
    name: str
    type: str  # text, number, boolean, date, datetime, select, multiselect, file, image, relation, formula, rollup
    label: Optional[str] = None
    required: bool = False
    unique: bool = False
    default: Optional[Any] = None
    options: Optional[List[str]] = None  # For select/multiselect
    relation_collection_id: Optional[str] = None  # For relation fields
    relation_multiple: bool = False
    formula: Optional[str] = None  # For formula fields
    validation: Optional[Dict[str, Any]] = None


class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: str = "database"
    color: str = "#6366f1"
    schema: List[FieldDefinition] = []
    settings: Dict[str, Any] = {}


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    schema: Optional[List[FieldDefinition]] = None
    settings: Optional[Dict[str, Any]] = None


class RecordCreate(BaseModel):
    data: Dict[str, Any]


class RecordUpdate(BaseModel):
    data: Dict[str, Any]


class RecordQuery(BaseModel):
    filters: Optional[Dict[str, Any]] = None
    sort_field: Optional[str] = None
    sort_order: str = "asc"
    page: int = 1
    page_size: int = 50
    search: Optional[str] = None


# ============================================
# COLLECTION ENDPOINTS
# ============================================

@router.get("/apps/{app_id}/collections")
async def list_collections(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all collections for an app"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    collections = db.query(AppCollection).filter(
        AppCollection.app_id == app_id,
        AppCollection.is_active == True
    ).order_by(AppCollection.created_at.desc()).all()
    
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
                "record_count": db.query(AppRecord).filter(
                    AppRecord.collection_id == c.id,
                    AppRecord.is_active == True
                ).count(),
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat()
            }
            for c in collections
        ],
        "total": len(collections)
    }


@router.post("/apps/{app_id}/collections")
async def create_collection(
    app_id: uuid.UUID = Path(...),
    collection: CollectionCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new collection"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Generate slug if not provided
    slug = collection.slug or collection.name.lower().replace(" ", "_")
    
    # Check for duplicate slug
    existing = db.query(AppCollection).filter(
        AppCollection.app_id == app_id,
        AppCollection.slug == slug,
        AppCollection.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Collection with this slug already exists")
    
    new_collection = AppCollection(
        app_id=app_id,
        name=collection.name,
        slug=slug,
        description=collection.description,
        icon=collection.icon,
        color=collection.color,
        schema=[f.dict() for f in collection.schema],
        settings=collection.settings
    )
    
    db.add(new_collection)
    db.commit()
    db.refresh(new_collection)
    
    return {
        "id": str(new_collection.id),
        "name": new_collection.name,
        "slug": new_collection.slug,
        "description": new_collection.description,
        "icon": new_collection.icon,
        "color": new_collection.color,
        "schema": new_collection.schema,
        "settings": new_collection.settings,
        "created_at": new_collection.created_at.isoformat()
    }


@router.get("/apps/{app_id}/collections/{collection_id}")
async def get_collection(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get collection details"""
    collection = db.query(AppCollection).filter(
        AppCollection.id == collection_id,
        AppCollection.app_id == app_id,
        AppCollection.is_active == True
    ).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    record_count = db.query(AppRecord).filter(
        AppRecord.collection_id == collection_id,
        AppRecord.is_active == True
    ).count()
    
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
        "record_count": record_count,
        "created_at": collection.created_at.isoformat(),
        "updated_at": collection.updated_at.isoformat()
    }


@router.put("/apps/{app_id}/collections/{collection_id}")
async def update_collection(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    updates: CollectionUpdate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a collection"""
    collection = db.query(AppCollection).filter(
        AppCollection.id == collection_id,
        AppCollection.app_id == app_id,
        AppCollection.is_active == True
    ).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    update_data = updates.dict(exclude_unset=True)
    
    if "schema" in update_data and update_data["schema"]:
        update_data["schema"] = [
            f.dict() if hasattr(f, 'dict') else f 
            for f in update_data["schema"]
        ]
    
    for key, value in update_data.items():
        setattr(collection, key, value)
    
    collection.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(collection)
    
    return {
        "id": str(collection.id),
        "name": collection.name,
        "slug": collection.slug,
        "schema": collection.schema,
        "updated_at": collection.updated_at.isoformat()
    }


@router.delete("/apps/{app_id}/collections/{collection_id}")
async def delete_collection(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a collection (soft delete)"""
    collection = db.query(AppCollection).filter(
        AppCollection.id == collection_id,
        AppCollection.app_id == app_id
    ).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    collection.is_active = False
    db.commit()
    
    return {"message": "Collection deleted"}


# ============================================
# RECORD ENDPOINTS
# ============================================

@router.get("/apps/{app_id}/collections/{collection_id}/records")
async def list_records(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort_field: Optional[str] = Query(None),
    sort_order: str = Query("desc"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List records in a collection with pagination and filtering"""
    collection = db.query(AppCollection).filter(
        AppCollection.id == collection_id,
        AppCollection.app_id == app_id,
        AppCollection.is_active == True
    ).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    query = db.query(AppRecord).filter(
        AppRecord.collection_id == collection_id,
        AppRecord.is_active == True
    )
    
    # Search
    if search:
        query = query.filter(AppRecord.search_text.ilike(f"%{search}%"))
    
    # Get total count
    total = query.count()
    
    # Sorting
    if sort_field:
        if sort_order == "desc":
            query = query.order_by(AppRecord.data[sort_field].desc())
        else:
            query = query.order_by(AppRecord.data[sort_field].asc())
    else:
        query = query.order_by(AppRecord.created_at.desc())
    
    # Pagination
    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()
    
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


@router.post("/apps/{app_id}/collections/{collection_id}/records")
async def create_record(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    record: RecordCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new record"""
    collection = db.query(AppCollection).filter(
        AppCollection.id == collection_id,
        AppCollection.app_id == app_id,
        AppCollection.is_active == True
    ).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Validate data against schema
    schema = collection.schema or []
    errors = validate_record_data(record.data, schema)
    if errors:
        raise HTTPException(status_code=400, detail={"validation_errors": errors})
    
    # Generate search text
    search_text = generate_search_text(record.data, schema)
    
    new_record = AppRecord(
        collection_id=collection_id,
        data=record.data,
        search_text=search_text,
        created_by_id=current_user.id,
        updated_by_id=current_user.id
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {
        "id": str(new_record.id),
        "data": new_record.data,
        "created_at": new_record.created_at.isoformat()
    }


@router.get("/apps/{app_id}/collections/{collection_id}/records/{record_id}")
async def get_record(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    record_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single record"""
    record = db.query(AppRecord).filter(
        AppRecord.id == record_id,
        AppRecord.collection_id == collection_id,
        AppRecord.is_active == True
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    # Get related records
    relations = db.query(AppRelation).filter(
        AppRelation.source_record_id == record_id
    ).all()
    
    related_data = {}
    for rel in relations:
        target_record = db.query(AppRecord).filter(
            AppRecord.id == rel.target_record_id
        ).first()
        if target_record:
            field = rel.source_field
            if field not in related_data:
                related_data[field] = []
            related_data[field].append({
                "id": str(target_record.id),
                "data": target_record.data
            })
    
    return {
        "id": str(record.id),
        "data": record.data,
        "relations": related_data,
        "created_at": record.created_at.isoformat(),
        "updated_at": record.updated_at.isoformat(),
        "created_by": str(record.created_by_id) if record.created_by_id else None,
        "updated_by": str(record.updated_by_id) if record.updated_by_id else None
    }


@router.put("/apps/{app_id}/collections/{collection_id}/records/{record_id}")
async def update_record(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    record_id: uuid.UUID = Path(...),
    updates: RecordUpdate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a record"""
    record = db.query(AppRecord).filter(
        AppRecord.id == record_id,
        AppRecord.collection_id == collection_id,
        AppRecord.is_active == True
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    collection = db.query(AppCollection).filter(
        AppCollection.id == collection_id
    ).first()
    
    # Merge data
    new_data = {**record.data, **updates.data}
    
    # Validate
    schema = collection.schema or []
    errors = validate_record_data(new_data, schema)
    if errors:
        raise HTTPException(status_code=400, detail={"validation_errors": errors})
    
    record.data = new_data
    record.search_text = generate_search_text(new_data, schema)
    record.updated_by_id = current_user.id
    record.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(record)
    
    return {
        "id": str(record.id),
        "data": record.data,
        "updated_at": record.updated_at.isoformat()
    }


@router.delete("/apps/{app_id}/collections/{collection_id}/records/{record_id}")
async def delete_record(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    record_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a record (soft delete)"""
    record = db.query(AppRecord).filter(
        AppRecord.id == record_id,
        AppRecord.collection_id == collection_id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record.is_active = False
    db.commit()
    
    return {"message": "Record deleted"}


@router.post("/apps/{app_id}/collections/{collection_id}/records/bulk")
async def bulk_create_records(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    records: List[RecordCreate] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk create records"""
    collection = db.query(AppCollection).filter(
        AppCollection.id == collection_id,
        AppCollection.app_id == app_id,
        AppCollection.is_active == True
    ).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    schema = collection.schema or []
    created = []
    errors = []
    
    for i, record in enumerate(records):
        validation_errors = validate_record_data(record.data, schema)
        if validation_errors:
            errors.append({"index": i, "errors": validation_errors})
            continue
        
        new_record = AppRecord(
            collection_id=collection_id,
            data=record.data,
            search_text=generate_search_text(record.data, schema),
            created_by_id=current_user.id
        )
        db.add(new_record)
        created.append(new_record)
    
    if created:
        db.commit()
    
    return {
        "created": len(created),
        "errors": errors,
        "records": [
            {"id": str(r.id), "data": r.data}
            for r in created
        ]
    }


@router.post("/apps/{app_id}/collections/{collection_id}/query")
async def query_records(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    query: RecordQuery = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Advanced query for records with filters"""
    collection = db.query(AppCollection).filter(
        AppCollection.id == collection_id,
        AppCollection.app_id == app_id,
        AppCollection.is_active == True
    ).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    db_query = db.query(AppRecord).filter(
        AppRecord.collection_id == collection_id,
        AppRecord.is_active == True
    )
    
    # Apply filters
    if query.filters:
        for field, condition in query.filters.items():
            if isinstance(condition, dict):
                op = condition.get("op", "eq")
                value = condition.get("value")
                
                if op == "eq":
                    db_query = db_query.filter(AppRecord.data[field].astext == str(value))
                elif op == "ne":
                    db_query = db_query.filter(AppRecord.data[field].astext != str(value))
                elif op == "gt":
                    db_query = db_query.filter(AppRecord.data[field].astext.cast(db.Float) > value)
                elif op == "lt":
                    db_query = db_query.filter(AppRecord.data[field].astext.cast(db.Float) < value)
                elif op == "contains":
                    db_query = db_query.filter(AppRecord.data[field].astext.ilike(f"%{value}%"))
                elif op == "in":
                    db_query = db_query.filter(AppRecord.data[field].astext.in_(value))
            else:
                db_query = db_query.filter(AppRecord.data[field].astext == str(condition))
    
    # Search
    if query.search:
        db_query = db_query.filter(AppRecord.search_text.ilike(f"%{query.search}%"))
    
    total = db_query.count()
    
    # Sorting
    if query.sort_field:
        if query.sort_order == "desc":
            db_query = db_query.order_by(AppRecord.data[query.sort_field].desc())
        else:
            db_query = db_query.order_by(AppRecord.data[query.sort_field].asc())
    
    # Pagination
    offset = (query.page - 1) * query.page_size
    records = db_query.offset(offset).limit(query.page_size).all()
    
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


# ============================================
# RELATION ENDPOINTS
# ============================================

@router.post("/apps/{app_id}/collections/{collection_id}/records/{record_id}/relations")
async def create_relation(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    record_id: uuid.UUID = Path(...),
    field: str = Query(...),
    target_record_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a relation between records"""
    source_record = db.query(AppRecord).filter(
        AppRecord.id == record_id,
        AppRecord.collection_id == collection_id
    ).first()
    
    if not source_record:
        raise HTTPException(status_code=404, detail="Source record not found")
    
    target_record = db.query(AppRecord).filter(
        AppRecord.id == target_record_id
    ).first()
    
    if not target_record:
        raise HTTPException(status_code=404, detail="Target record not found")
    
    relation = AppRelation(
        source_collection_id=collection_id,
        source_record_id=record_id,
        source_field=field,
        target_collection_id=target_record.collection_id,
        target_record_id=target_record_id
    )
    
    db.add(relation)
    db.commit()
    
    return {"message": "Relation created", "relation_id": str(relation.id)}


@router.delete("/apps/{app_id}/relations/{relation_id}")
async def delete_relation(
    app_id: uuid.UUID = Path(...),
    relation_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a relation"""
    relation = db.query(AppRelation).filter(
        AppRelation.id == relation_id
    ).first()
    
    if not relation:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    db.delete(relation)
    db.commit()
    
    return {"message": "Relation deleted"}


# ============================================
# HELPER FUNCTIONS
# ============================================

def validate_record_data(data: Dict, schema: List[Dict]) -> List[str]:
    """Validate record data against collection schema"""
    errors = []
    
    for field_def in schema:
        field_name = field_def.get("name")
        field_type = field_def.get("type")
        required = field_def.get("required", False)
        
        value = data.get(field_name)
        
        # Check required
        if required and (value is None or value == ""):
            errors.append(f"Field '{field_name}' is required")
            continue
        
        if value is None:
            continue
        
        # Type validation
        if field_type == "number":
            try:
                float(value)
            except (ValueError, TypeError):
                errors.append(f"Field '{field_name}' must be a number")
        
        elif field_type == "boolean":
            if not isinstance(value, bool):
                errors.append(f"Field '{field_name}' must be a boolean")
        
        elif field_type == "select":
            options = field_def.get("options", [])
            if value not in options:
                errors.append(f"Field '{field_name}' must be one of: {', '.join(options)}")
        
        elif field_type == "multiselect":
            options = field_def.get("options", [])
            if isinstance(value, list):
                for v in value:
                    if v not in options:
                        errors.append(f"Field '{field_name}' contains invalid option: {v}")
    
    return errors


def generate_search_text(data: Dict, schema: List[Dict]) -> str:
    """Generate searchable text from record data"""
    searchable = []
    
    for field_def in schema:
        field_name = field_def.get("name")
        field_type = field_def.get("type")
        
        if field_type in ["text", "select", "multiselect"]:
            value = data.get(field_name)
            if value:
                if isinstance(value, list):
                    searchable.extend(value)
                else:
                    searchable.append(str(value))
    
    return " ".join(searchable)
