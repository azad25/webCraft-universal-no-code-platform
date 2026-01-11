"""
Collections domain schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class FieldDefinition(BaseModel):
    name: str
    type: str  # text, number, boolean, date, datetime, select, multiselect, file, image, relation, formula
    label: Optional[str] = None
    required: bool = False
    unique: bool = False
    default: Optional[Any] = None
    options: Optional[List[str]] = None
    relation_collection_id: Optional[str] = None
    relation_multiple: bool = False
    formula: Optional[str] = None
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


class CollectionResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    icon: str
    color: str
    schema: List[Dict[str, Any]]
    settings: Dict[str, Any]
    record_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class RecordCreate(BaseModel):
    data: Dict[str, Any]


class RecordUpdate(BaseModel):
    data: Dict[str, Any]


class RecordResponse(BaseModel):
    id: uuid.UUID
    data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    
    model_config = {"from_attributes": True}


class RecordListResponse(BaseModel):
    records: List[RecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class RecordQuery(BaseModel):
    filters: Optional[Dict[str, Any]] = None
    sort_field: Optional[str] = None
    sort_order: str = "asc"
    page: int = 1
    page_size: int = 50
    search: Optional[str] = None
