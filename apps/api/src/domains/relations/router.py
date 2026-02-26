"""Relations router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.schemas import UserResponse
from src.domains.collections.models import CollectionRecord, CollectionRelation

router = APIRouter()


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session):
    """Helper to verify app ownership"""
    from src.domains.apps.models import App
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.get("/apps/{app_id}/relations/{relation_id}")
async def get_relation(
    app_id: uuid.UUID = Path(...),
    relation_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific relation"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    relation = db.query(CollectionRelation).filter(
        CollectionRelation.id == relation_id
    ).first()
    
    if not relation:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    return {
        "id": str(relation.id),
        "source_collection_id": str(relation.source_collection_id),
        "source_record_id": str(relation.source_record_id),
        "source_field": relation.source_field,
        "target_collection_id": str(relation.target_collection_id),
        "target_record_id": str(relation.target_record_id),
        "created_at": relation.created_at,
        "updated_at": relation.updated_at
    }


@router.post("/apps/{app_id}/relations")
async def create_relation(
    app_id: uuid.UUID = Path(...),
    relation_data: Dict[str, Any] = {},
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new relation between records"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    # Validate required fields
    required_fields = ['source_collection_id', 'source_record_id', 'source_field', 'target_collection_id', 'target_record_id']
    for field in required_fields:
        if field not in relation_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Create relation
    relation = CollectionRelation(
        source_collection_id=relation_data['source_collection_id'],
        source_record_id=relation_data['source_record_id'],
        source_field=relation_data['source_field'],
        target_collection_id=relation_data['target_collection_id'],
        target_record_id=relation_data['target_record_id']
    )
    
    db.add(relation)
    db.commit()
    db.refresh(relation)
    
    return {
        "id": str(relation.id),
        "message": "Relation created successfully"
    }


@router.put("/apps/{app_id}/relations/{relation_id}")
async def update_relation(
    app_id: uuid.UUID = Path(...),
    relation_id: uuid.UUID = Path(...),
    relation_data: Dict[str, Any] = {},
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a relation"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    relation = db.query(CollectionRelation).filter(
        CollectionRelation.id == relation_id
    ).first()
    
    if not relation:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    # Update fields
    for field, value in relation_data.items():
        if hasattr(relation, field):
            setattr(relation, field, value)
    
    db.commit()
    db.refresh(relation)
    
    return {"message": "Relation updated successfully"}


@router.delete("/apps/{app_id}/relations/{relation_id}")
async def delete_relation(
    app_id: uuid.UUID = Path(...),
    relation_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a relation"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    relation = db.query(CollectionRelation).filter(
        CollectionRelation.id == relation_id
    ).first()
    
    if not relation:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    db.delete(relation)
    db.commit()
    
    return {"message": "Relation deleted successfully"}


@router.get("/apps/{app_id}/collections/{collection_id}/records/{record_id}/relations")
async def get_record_relations(
    app_id: uuid.UUID = Path(...),
    collection_id: uuid.UUID = Path(...),
    record_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all relations for a specific record"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    # Get outgoing relations (where this record is the source)
    outgoing_relations = db.query(CollectionRelation).filter(
        CollectionRelation.source_record_id == record_id
    ).all()
    
    # Get incoming relations (where this record is the target)
    incoming_relations = db.query(CollectionRelation).filter(
        CollectionRelation.target_record_id == record_id
    ).all()
    
    return {
        "outgoing_relations": [
            {
                "id": str(rel.id),
                "target_collection_id": str(rel.target_collection_id),
                "target_record_id": str(rel.target_record_id),
                "field": rel.source_field
            }
            for rel in outgoing_relations
        ],
        "incoming_relations": [
            {
                "id": str(rel.id),
                "source_collection_id": str(rel.source_collection_id),
                "source_record_id": str(rel.source_record_id),
                "field": rel.source_field
            }
            for rel in incoming_relations
        ]
    }