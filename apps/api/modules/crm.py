"""
CRM Module - Customer Relationship Management
"""

from typing import Dict, List, Any
from core.module_system import BaseModule, ModuleMetadata, ModuleType
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import uuid


class Contact(BaseModel):
    id: str = None
    email: str
    first_name: str = ""
    last_name: str = ""
    phone: str = ""
    company: str = ""
    tags: List[str] = []
    custom_fields: Dict = {}
    created_at: datetime = None


class Deal(BaseModel):
    id: str = None
    title: str
    value: float
    stage: str = "lead"
    contact_id: str = None
    probability: int = 0
    expected_close: datetime = None
    notes: str = ""


class CRMModule(BaseModule):
    """CRM functionality for managing contacts and deals"""
    
    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            id="core.crm",
            name="CRM Suite",
            version="1.0.0",
            type=ModuleType.CRM,
            description="Contact and deal management",
            author="WebCraft",
            dependencies=[],
            is_premium=True,
            price=19.99,
            tags=["contacts", "deals", "pipeline", "sales"]
        )
    
    async def initialize(self) -> bool:
        self._contacts: Dict[str, Contact] = {}
        self._deals: Dict[str, Deal] = {}
        self._pipelines = self._default_pipelines()
        self._initialized = True
        return True
    
    async def shutdown(self) -> bool:
        self._initialized = False
        return True
    
    def _default_pipelines(self) -> Dict:
        return {
            "default": {
                "name": "Sales Pipeline",
                "stages": [
                    {"id": "lead", "name": "Lead", "probability": 10},
                    {"id": "qualified", "name": "Qualified", "probability": 25},
                    {"id": "proposal", "name": "Proposal", "probability": 50},
                    {"id": "negotiation", "name": "Negotiation", "probability": 75},
                    {"id": "won", "name": "Won", "probability": 100},
                    {"id": "lost", "name": "Lost", "probability": 0}
                ]
            }
        }
    
    async def create_contact(self, contact: Contact) -> Contact:
        contact.id = str(uuid.uuid4())
        contact.created_at = datetime.utcnow()
        self._contacts[contact.id] = contact
        await self.trigger_hook("contact.created", contact)
        return contact
    
    async def create_deal(self, deal: Deal) -> Deal:
        deal.id = str(uuid.uuid4())
        self._deals[deal.id] = deal
        await self.trigger_hook("deal.created", deal)
        return deal
    
    async def move_deal(self, deal_id: str, stage: str) -> Deal:
        if deal_id in self._deals:
            self._deals[deal_id].stage = stage
            await self.trigger_hook("deal.moved", self._deals[deal_id])
        return self._deals.get(deal_id)
    
    def get_routes(self) -> List[APIRouter]:
        router = APIRouter(prefix="/crm", tags=["CRM"])
        
        @router.get("/contacts")
        async def list_contacts():
            return {"contacts": list(self._contacts.values())}
        
        @router.post("/contacts")
        async def create_contact(contact: Contact):
            return await self.create_contact(contact)
        
        @router.get("/deals")
        async def list_deals(stage: str = None):
            deals = list(self._deals.values())
            if stage:
                deals = [d for d in deals if d.stage == stage]
            return {"deals": deals}
        
        @router.post("/deals")
        async def create_deal(deal: Deal):
            return await self.create_deal(deal)
        
        @router.get("/pipelines")
        async def get_pipelines():
            return {"pipelines": self._pipelines}
        
        return [router]
