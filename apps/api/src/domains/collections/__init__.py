# Collections domain - User-defined databases
from .router import router
from .service import CollectionService, RecordService
from .models import Collection, CollectionRecord, CollectionRelation
from .schemas import (
    CollectionCreate, CollectionUpdate, CollectionResponse,
    RecordCreate, RecordUpdate, RecordResponse, RecordListResponse, RecordQuery
)

__all__ = [
    "router",
    "CollectionService",
    "RecordService",
    "Collection",
    "CollectionRecord",
    "CollectionRelation",
    "CollectionCreate",
    "CollectionUpdate",
    "CollectionResponse",
    "RecordCreate",
    "RecordUpdate",
    "RecordResponse",
    "RecordListResponse",
    "RecordQuery"
]
