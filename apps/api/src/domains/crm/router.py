"""CRM domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.schemas import UserResponse
from .service import CRMService

router = APIRouter(prefix="/apps/{app_id}/crm")


@router.get("/stats")
async def get_crm_stats(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get CRM statistics"""
    service = CRMService(db)
    return await service.get_crm_stats(str(app_id))


# Contacts
@router.post("/contacts")
async def create_contact(
    app_id: uuid.UUID = Path(...),
    contact: Dict[str, Any] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new contact"""
    service = CRMService(db)
    return await service.create_contact(str(app_id), contact)


@router.get("/contacts")
async def list_contacts(
    app_id: uuid.UUID = Path(...),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List contacts"""
    service = CRMService(db)
    return await service.list_contacts(str(app_id), status, search, limit, offset)


@router.get("/contacts/{contact_id}")
async def get_contact(
    app_id: uuid.UUID = Path(...),
    contact_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get contact details"""
    service = CRMService(db)
    contact = await service.get_contact(str(app_id), contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.put("/contacts/{contact_id}")
async def update_contact(
    app_id: uuid.UUID = Path(...),
    contact_id: str = Path(...),
    updates: Dict[str, Any] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a contact"""
    service = CRMService(db)
    contact = await service.update_contact(str(app_id), contact_id, updates)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    app_id: uuid.UUID = Path(...),
    contact_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a contact"""
    service = CRMService(db)
    if not await service.delete_contact(str(app_id), contact_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"deleted": True}


# Deals
@router.post("/deals")
async def create_deal(
    app_id: uuid.UUID = Path(...),
    deal: Dict[str, Any] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new deal"""
    service = CRMService(db)
    return await service.create_deal(str(app_id), deal)


@router.get("/deals")
async def list_deals(
    app_id: uuid.UUID = Path(...),
    stage: Optional[str] = Query(None),
    contact_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List deals"""
    service = CRMService(db)
    return await service.list_deals(str(app_id), stage, contact_id, limit)


@router.get("/deals/{deal_id}")
async def get_deal(
    app_id: uuid.UUID = Path(...),
    deal_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get deal details"""
    service = CRMService(db)
    deal = await service.get_deal(str(app_id), deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@router.put("/deals/{deal_id}")
async def update_deal(
    app_id: uuid.UUID = Path(...),
    deal_id: str = Path(...),
    updates: Dict[str, Any] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a deal"""
    service = CRMService(db)
    deal = await service.update_deal(str(app_id), deal_id, updates)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@router.put("/deals/{deal_id}/stage")
async def update_deal_stage(
    app_id: uuid.UUID = Path(...),
    deal_id: str = Path(...),
    stage: str = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update deal stage (for pipeline drag-drop)"""
    service = CRMService(db)
    deal = await service.update_deal_stage(str(app_id), deal_id, stage)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@router.delete("/deals/{deal_id}")
async def delete_deal(
    app_id: uuid.UUID = Path(...),
    deal_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a deal"""
    service = CRMService(db)
    if not await service.delete_deal(str(app_id), deal_id):
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"deleted": True}


# Activities
@router.post("/activities")
async def create_activity(
    app_id: uuid.UUID = Path(...),
    activity: Dict[str, Any] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new activity"""
    service = CRMService(db)
    return await service.create_activity(str(app_id), activity)


@router.get("/activities")
async def list_activities(
    app_id: uuid.UUID = Path(...),
    contact_id: Optional[str] = Query(None),
    deal_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    limit: int = Query(50, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List activities"""
    service = CRMService(db)
    return await service.list_activities(str(app_id), contact_id, deal_id, type, completed, limit)


@router.put("/activities/{activity_id}/complete")
async def complete_activity(
    app_id: uuid.UUID = Path(...),
    activity_id: str = Path(...),
    completed: bool = Query(True),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark activity as complete/incomplete"""
    service = CRMService(db)
    activity = await service.complete_activity(str(app_id), activity_id, completed)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.delete("/activities/{activity_id}")
async def delete_activity(
    app_id: uuid.UUID = Path(...),
    activity_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an activity"""
    service = CRMService(db)
    if not await service.delete_activity(str(app_id), activity_id):
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"deleted": True}


# Pipeline
@router.get("/pipeline")
async def get_pipeline(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pipeline view with deals grouped by stage"""
    service = CRMService(db)
    return await service.get_pipeline(str(app_id))
