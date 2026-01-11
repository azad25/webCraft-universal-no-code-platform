"""CRM domain service"""
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

# In-memory storage
contacts_store: Dict[str, Dict] = {}
deals_store: Dict[str, Dict] = {}
activities_store: Dict[str, Dict] = {}


class CRMService:
    def __init__(self, db: Session):
        self.db = db

    async def get_crm_stats(self, app_id: str) -> Dict[str, Any]:
        """Get CRM statistics"""
        app_contacts = [c for c in contacts_store.values() if c.get("app_id") == app_id]
        app_deals = [d for d in deals_store.values() if d.get("app_id") == app_id]
        
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

    async def create_contact(self, app_id: str, contact_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new contact"""
        contact_id = str(uuid.uuid4())
        contact = {
            "id": contact_id,
            "app_id": app_id,
            "first_name": contact_data["first_name"],
            "last_name": contact_data["last_name"],
            "email": contact_data["email"],
            "phone": contact_data.get("phone", ""),
            "company": contact_data.get("company", ""),
            "job_title": contact_data.get("job_title", ""),
            "status": contact_data.get("status", "lead"),
            "source": contact_data.get("source", ""),
            "tags": contact_data.get("tags", []),
            "notes": contact_data.get("notes", ""),
            "custom_fields": contact_data.get("custom_fields", {}),
            "last_contacted": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        contacts_store[contact_id] = contact
        return contact

    async def list_contacts(self, app_id: str, status: Optional[str] = None, search: Optional[str] = None, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """List contacts"""
        contacts = [c for c in contacts_store.values() if c.get("app_id") == app_id]
        
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
        return {"contacts": contacts[offset:offset + limit], "total": len(contacts)}

    async def get_contact(self, app_id: str, contact_id: str) -> Optional[Dict[str, Any]]:
        """Get contact details"""
        contact = contacts_store.get(contact_id)
        if contact and contact.get("app_id") == app_id:
            contact["deals"] = [d for d in deals_store.values() if d.get("contact_id") == contact_id]
            contact["activities"] = [a for a in activities_store.values() if a.get("contact_id") == contact_id]
            return contact
        return None

    async def update_contact(self, app_id: str, contact_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a contact"""
        contact = contacts_store.get(contact_id)
        if not contact or contact.get("app_id") != app_id:
            return None
        for key, value in updates.items():
            if value is not None:
                contact[key] = value
        contact["updated_at"] = datetime.utcnow().isoformat()
        return contact

    async def delete_contact(self, app_id: str, contact_id: str) -> bool:
        """Delete a contact"""
        contact = contacts_store.get(contact_id)
        if contact and contact.get("app_id") == app_id:
            del contacts_store[contact_id]
            return True
        return False

    async def create_deal(self, app_id: str, deal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new deal"""
        deal_id = str(uuid.uuid4())
        contact = contacts_store.get(deal_data.get("contact_id", ""))
        contact_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}" if contact else "Unknown"
        
        deal = {
            "id": deal_id,
            "app_id": app_id,
            "title": deal_data["title"],
            "value": deal_data["value"],
            "stage": deal_data.get("stage", "lead"),
            "contact_id": deal_data.get("contact_id"),
            "contact_name": contact_name,
            "probability": deal_data.get("probability", 20),
            "expected_close": deal_data.get("expected_close"),
            "notes": deal_data.get("notes", ""),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        deals_store[deal_id] = deal
        return deal

    async def list_deals(self, app_id: str, stage: Optional[str] = None, contact_id: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
        """List deals"""
        deals = [d for d in deals_store.values() if d.get("app_id") == app_id]
        if stage:
            deals = [d for d in deals if d.get("stage") == stage]
        if contact_id:
            deals = [d for d in deals if d.get("contact_id") == contact_id]
        deals.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return {"deals": deals[:limit], "total": len(deals)}

    async def get_deal(self, app_id: str, deal_id: str) -> Optional[Dict[str, Any]]:
        """Get deal details"""
        deal = deals_store.get(deal_id)
        if deal and deal.get("app_id") == app_id:
            return deal
        return None

    async def update_deal(self, app_id: str, deal_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a deal"""
        deal = deals_store.get(deal_id)
        if not deal or deal.get("app_id") != app_id:
            return None
        for key, value in updates.items():
            if value is not None:
                deal[key] = value
        deal["updated_at"] = datetime.utcnow().isoformat()
        return deal

    async def update_deal_stage(self, app_id: str, deal_id: str, stage: str) -> Optional[Dict[str, Any]]:
        """Update deal stage"""
        deal = deals_store.get(deal_id)
        if not deal or deal.get("app_id") != app_id:
            return None
        deal["stage"] = stage
        deal["updated_at"] = datetime.utcnow().isoformat()
        stage_probabilities = {"lead": 10, "qualified": 25, "proposal": 50, "negotiation": 75, "closed_won": 100, "closed_lost": 0}
        deal["probability"] = stage_probabilities.get(stage, deal["probability"])
        return deal

    async def delete_deal(self, app_id: str, deal_id: str) -> bool:
        """Delete a deal"""
        deal = deals_store.get(deal_id)
        if deal and deal.get("app_id") == app_id:
            del deals_store[deal_id]
            return True
        return False

    async def create_activity(self, app_id: str, activity_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new activity"""
        activity_id = str(uuid.uuid4())
        contact = contacts_store.get(activity_data.get("contact_id", ""))
        contact_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}" if contact else "Unknown"
        
        activity = {
            "id": activity_id,
            "app_id": app_id,
            "type": activity_data["type"],
            "title": activity_data["title"],
            "description": activity_data.get("description", ""),
            "contact_id": activity_data.get("contact_id"),
            "contact_name": contact_name,
            "deal_id": activity_data.get("deal_id"),
            "due_date": activity_data.get("due_date"),
            "completed": activity_data.get("completed", False),
            "created_at": datetime.utcnow().isoformat()
        }
        activities_store[activity_id] = activity
        
        if contact:
            contact["last_contacted"] = datetime.utcnow().isoformat()
        
        return activity

    async def list_activities(self, app_id: str, contact_id: Optional[str] = None, deal_id: Optional[str] = None, activity_type: Optional[str] = None, completed: Optional[bool] = None, limit: int = 50) -> Dict[str, Any]:
        """List activities"""
        activities = [a for a in activities_store.values() if a.get("app_id") == app_id]
        if contact_id:
            activities = [a for a in activities if a.get("contact_id") == contact_id]
        if deal_id:
            activities = [a for a in activities if a.get("deal_id") == deal_id]
        if activity_type:
            activities = [a for a in activities if a.get("type") == activity_type]
        if completed is not None:
            activities = [a for a in activities if a.get("completed") == completed]
        activities.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return {"activities": activities[:limit], "total": len(activities)}

    async def complete_activity(self, app_id: str, activity_id: str, completed: bool = True) -> Optional[Dict[str, Any]]:
        """Mark activity as complete/incomplete"""
        activity = activities_store.get(activity_id)
        if not activity or activity.get("app_id") != app_id:
            return None
        activity["completed"] = completed
        activity["completed_at"] = datetime.utcnow().isoformat() if completed else None
        return activity

    async def delete_activity(self, app_id: str, activity_id: str) -> bool:
        """Delete an activity"""
        activity = activities_store.get(activity_id)
        if activity and activity.get("app_id") == app_id:
            del activities_store[activity_id]
            return True
        return False

    async def get_pipeline(self, app_id: str) -> Dict[str, Any]:
        """Get pipeline view with deals grouped by stage"""
        deals = [d for d in deals_store.values() if d.get("app_id") == app_id]
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
