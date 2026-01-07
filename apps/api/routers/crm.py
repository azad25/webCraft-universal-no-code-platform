"""
CRM API Routes
Contact management, deals, pipeline, and activities
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from enum import Enum
import uuid

from core.database import get_db, App, User
from core.auth import get_current_user

router = APIRouter()


class ContactStatus(str, Enum):
    LEAD = "lead"
    PROSPECT = "prospect"
    CUSTOMER = "customer"
    CHURNED = "churned"


class DealStage(str, Enum):
    LEAD = "lead"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class ActivityType(str, Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    NOTE = "note"
    TASK = "task"


class ContactCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str = ""
    company: str = ""
    job_title: str = ""
    status: ContactStatus = ContactStatus.LEAD
    source: str = ""
    tags: List[str] = []
    notes: str = ""
    custom_fields: Dict[str, Any] = {}


class DealCreate(BaseModel):
    title: str
    value: float
    stage: DealStage = DealStage.LEAD
    contact_id: str
    probability: int = 20
    expected_close: Optional[str] = None
    notes: str = ""


class ActivityCreate(BaseModel):
    type: ActivityType
    title: str
    description: str = ""
    contact_id: str
    deal_id: Optional[str] = None
    due_date: Optional[str] = None
    completed: bool = False


# In-memory storage
contacts_store: Dict[str, Dict] = {}
deals_store: Dict[str, Dict] = {}
activities_store: Dict[str, Dict] = {}


@router.get("/apps/{app_id}/crm/stats")
async def get_crm_stats(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get CRM statistics"""
    app_contacts = [c for c in contacts_store.values() if c.get("app_id") == str(app_id)]
    app_deals = [d for d in deals_store.values() if d.get("app_id") == str(app_id)]
    
    open_deals = [d for d in app_deals if d.get("stage") not in ["closed_won", "closed_lost"]]
    won_deals = [d for d in app_deals if d.get("stage") == "closed_won"]
    
    pipeline_value = sum(d.get("value", 0) for d in open_deals)
    won_value = sum(d.get("value", 0) for d in won_deals)
    
    conversion_rate = (len(won_deals) / len(app_deals) * 100) if app_deals else 0
    
    return {
        "total_contacts": len(app_contacts),
        "leads": len([c for c in app_contacts if c.get("status") == "lead"]),
        "customers": len([c for c in app_contacts if c.get("status") == "customer"]),
        "open_deals": len(open_deals),
        "pipeline_value": pipeline_value,
        "won_deals": len(won_deals),
        "won_value": won_value,
        "conversion_rate": round(conversion_rate, 1)
    }


# Contacts
@router.post("/apps/{app_id}/crm/contacts")
async def create_contact(
    app_id: uuid.UUID = Path(...),
    contact: ContactCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new contact"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    contact_id = str(uuid.uuid4())
    
    contact_data = {
        "id": contact_id,
        "app_id": str(app_id),
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "email": contact.email,
        "phone": contact.phone,
        "company": contact.company,
        "job_title": contact.job_title,
        "status": contact.status.value,
        "source": contact.source,
        "tags": contact.tags,
        "notes": contact.notes,
        "custom_fields": contact.custom_fields,
        "last_contacted": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    contacts_store[contact_id] = contact_data
    return contact_data


@router.get("/apps/{app_id}/crm/contacts")
async def list_contacts(
    app_id: uuid.UUID = Path(...),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List contacts"""
    contacts = [c for c in contacts_store.values() if c.get("app_id") == str(app_id)]
    
    if status:
        contacts = [c for c in contacts if c.get("status") == status]
    if search:
        search_lower = search.lower()
        contacts = [c for c in contacts if 
            search_lower in f"{c.get('first_name', '')} {c.get('last_name', '')}".lower() or
            search_lower in c.get("email", "").lower() or
            search_lower in c.get("company", "").lower()
        ]
    
    contacts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {
        "contacts": contacts[offset:offset + limit],
        "total": len(contacts)
    }


@router.get("/apps/{app_id}/crm/contacts/{contact_id}")
async def get_contact(
    app_id: uuid.UUID = Path(...),
    contact_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get contact details"""
    contact = contacts_store.get(contact_id)
    if not contact or contact.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Include related deals and activities
    contact["deals"] = [d for d in deals_store.values() if d.get("contact_id") == contact_id]
    contact["activities"] = [a for a in activities_store.values() if a.get("contact_id") == contact_id]
    
    return contact


@router.put("/apps/{app_id}/crm/contacts/{contact_id}")
async def update_contact(
    app_id: uuid.UUID = Path(...),
    contact_id: str = Path(...),
    contact: ContactCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a contact"""
    existing = contacts_store.get(contact_id)
    if not existing or existing.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    
    existing.update({
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "email": contact.email,
        "phone": contact.phone,
        "company": contact.company,
        "job_title": contact.job_title,
        "status": contact.status.value,
        "source": contact.source,
        "tags": contact.tags,
        "notes": contact.notes,
        "custom_fields": contact.custom_fields,
        "updated_at": datetime.utcnow().isoformat()
    })
    
    return existing


@router.delete("/apps/{app_id}/crm/contacts/{contact_id}")
async def delete_contact(
    app_id: uuid.UUID = Path(...),
    contact_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a contact"""
    contact = contacts_store.get(contact_id)
    if not contact or contact.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    
    del contacts_store[contact_id]
    return {"deleted": True}


# Deals
@router.post("/apps/{app_id}/crm/deals")
async def create_deal(
    app_id: uuid.UUID = Path(...),
    deal: DealCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new deal"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Get contact name
    contact = contacts_store.get(deal.contact_id)
    contact_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}" if contact else "Unknown"
    
    deal_id = str(uuid.uuid4())
    
    deal_data = {
        "id": deal_id,
        "app_id": str(app_id),
        "title": deal.title,
        "value": deal.value,
        "stage": deal.stage.value,
        "contact_id": deal.contact_id,
        "contact_name": contact_name,
        "probability": deal.probability,
        "expected_close": deal.expected_close,
        "notes": deal.notes,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    deals_store[deal_id] = deal_data
    return deal_data


@router.get("/apps/{app_id}/crm/deals")
async def list_deals(
    app_id: uuid.UUID = Path(...),
    stage: Optional[str] = Query(None),
    contact_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List deals"""
    deals = [d for d in deals_store.values() if d.get("app_id") == str(app_id)]
    
    if stage:
        deals = [d for d in deals if d.get("stage") == stage]
    if contact_id:
        deals = [d for d in deals if d.get("contact_id") == contact_id]
    
    deals.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {"deals": deals[:limit], "total": len(deals)}


@router.get("/apps/{app_id}/crm/deals/{deal_id}")
async def get_deal(
    app_id: uuid.UUID = Path(...),
    deal_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get deal details"""
    deal = deals_store.get(deal_id)
    if not deal or deal.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@router.put("/apps/{app_id}/crm/deals/{deal_id}")
async def update_deal(
    app_id: uuid.UUID = Path(...),
    deal_id: str = Path(...),
    deal: DealCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a deal"""
    existing = deals_store.get(deal_id)
    if not existing or existing.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Deal not found")
    
    existing.update({
        "title": deal.title,
        "value": deal.value,
        "stage": deal.stage.value,
        "probability": deal.probability,
        "expected_close": deal.expected_close,
        "notes": deal.notes,
        "updated_at": datetime.utcnow().isoformat()
    })
    
    return existing


@router.put("/apps/{app_id}/crm/deals/{deal_id}/stage")
async def update_deal_stage(
    app_id: uuid.UUID = Path(...),
    deal_id: str = Path(...),
    stage: DealStage = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update deal stage (for pipeline drag-drop)"""
    deal = deals_store.get(deal_id)
    if not deal or deal.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Deal not found")
    
    deal["stage"] = stage.value
    deal["updated_at"] = datetime.utcnow().isoformat()
    
    # Update probability based on stage
    stage_probabilities = {
        "lead": 10,
        "qualified": 25,
        "proposal": 50,
        "negotiation": 75,
        "closed_won": 100,
        "closed_lost": 0
    }
    deal["probability"] = stage_probabilities.get(stage.value, deal["probability"])
    
    return deal


@router.delete("/apps/{app_id}/crm/deals/{deal_id}")
async def delete_deal(
    app_id: uuid.UUID = Path(...),
    deal_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a deal"""
    deal = deals_store.get(deal_id)
    if not deal or deal.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Deal not found")
    
    del deals_store[deal_id]
    return {"deleted": True}


# Activities
@router.post("/apps/{app_id}/crm/activities")
async def create_activity(
    app_id: uuid.UUID = Path(...),
    activity: ActivityCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new activity"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Get contact name
    contact = contacts_store.get(activity.contact_id)
    contact_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}" if contact else "Unknown"
    
    activity_id = str(uuid.uuid4())
    
    activity_data = {
        "id": activity_id,
        "app_id": str(app_id),
        "type": activity.type.value,
        "title": activity.title,
        "description": activity.description,
        "contact_id": activity.contact_id,
        "contact_name": contact_name,
        "deal_id": activity.deal_id,
        "due_date": activity.due_date,
        "completed": activity.completed,
        "created_at": datetime.utcnow().isoformat()
    }
    
    activities_store[activity_id] = activity_data
    
    # Update contact's last_contacted
    if contact:
        contact["last_contacted"] = datetime.utcnow().isoformat()
    
    return activity_data


@router.get("/apps/{app_id}/crm/activities")
async def list_activities(
    app_id: uuid.UUID = Path(...),
    contact_id: Optional[str] = Query(None),
    deal_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List activities"""
    activities = [a for a in activities_store.values() if a.get("app_id") == str(app_id)]
    
    if contact_id:
        activities = [a for a in activities if a.get("contact_id") == contact_id]
    if deal_id:
        activities = [a for a in activities if a.get("deal_id") == deal_id]
    if type:
        activities = [a for a in activities if a.get("type") == type]
    if completed is not None:
        activities = [a for a in activities if a.get("completed") == completed]
    
    activities.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {"activities": activities[:limit], "total": len(activities)}


@router.put("/apps/{app_id}/crm/activities/{activity_id}/complete")
async def complete_activity(
    app_id: uuid.UUID = Path(...),
    activity_id: str = Path(...),
    completed: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark activity as complete/incomplete"""
    activity = activities_store.get(activity_id)
    if not activity or activity.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Activity not found")
    
    activity["completed"] = completed
    activity["completed_at"] = datetime.utcnow().isoformat() if completed else None
    
    return activity


@router.delete("/apps/{app_id}/crm/activities/{activity_id}")
async def delete_activity(
    app_id: uuid.UUID = Path(...),
    activity_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an activity"""
    activity = activities_store.get(activity_id)
    if not activity or activity.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Activity not found")
    
    del activities_store[activity_id]
    return {"deleted": True}


# Pipeline view
@router.get("/apps/{app_id}/crm/pipeline")
async def get_pipeline(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pipeline view with deals grouped by stage"""
    deals = [d for d in deals_store.values() if d.get("app_id") == str(app_id)]
    
    stages = [
        {"id": "lead", "name": "Lead"},
        {"id": "qualified", "name": "Qualified"},
        {"id": "proposal", "name": "Proposal"},
        {"id": "negotiation", "name": "Negotiation"},
        {"id": "closed_won", "name": "Closed Won"},
        {"id": "closed_lost", "name": "Closed Lost"}
    ]
    
    pipeline = []
    for stage in stages:
        stage_deals = [d for d in deals if d.get("stage") == stage["id"]]
        pipeline.append({
            "id": stage["id"],
            "name": stage["name"],
            "deals": stage_deals,
            "count": len(stage_deals),
            "total_value": sum(d.get("value", 0) for d in stage_deals)
        })
    
    return {"pipeline": pipeline}
