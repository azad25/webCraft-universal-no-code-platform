"""
Collections domain service
"""

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from src.common.base_service import BaseService
from src.common.exceptions import NotFoundError, ValidationError
from .models import Collection, CollectionRecord, CollectionRelation
from .schemas import CollectionCreate, CollectionUpdate, RecordCreate, RecordUpdate


class CollectionService(BaseService[Collection, CollectionCreate, CollectionUpdate]):
    """Service for managing collections"""
    
    def __init__(self, db: Session):
        super().__init__(Collection, db)
    
    def list_collections(
        self,
        app_id: str,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Collection], int]:
        """List collections for an app"""
        query = self.db.query(Collection).filter(
            Collection.app_id == uuid.UUID(app_id),
            Collection.is_active == True
        )
        
        total = query.count()
        collections = query.order_by(Collection.created_at.desc()).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        return collections, total
    
    def create_collection(
        self,
        app_id: str,
        data: CollectionCreate
    ) -> Collection:
        """Create a new collection"""
        # Generate slug if not provided
        slug = data.slug or data.name.lower().replace(" ", "_")
        
        # Check for duplicate slug
        existing = self.db.query(Collection).filter(
            Collection.app_id == uuid.UUID(app_id),
            Collection.slug == slug,
            Collection.is_active == True
        ).first()
        
        if existing:
            raise ValidationError("Collection with this slug already exists")
        
        collection = Collection(
            app_id=uuid.UUID(app_id),
            name=data.name,
            slug=slug,
            description=data.description,
            icon=data.icon,
            color=data.color,
            schema=[f.model_dump() for f in data.schema],
            settings=data.settings
        )
        
        self.db.add(collection)
        self.db.commit()
        self.db.refresh(collection)
        
        return collection
    
    def get_collection(self, collection_id: str, app_id: str) -> Collection:
        """Get collection by ID"""
        collection = self.db.query(Collection).filter(
            Collection.id == uuid.UUID(collection_id),
            Collection.app_id == uuid.UUID(app_id),
            Collection.is_active == True
        ).first()
        
        if not collection:
            raise NotFoundError("Collection not found")
        
        return collection
    
    def update_collection(
        self,
        collection_id: str,
        app_id: str,
        data: CollectionUpdate
    ) -> Collection:
        """Update a collection"""
        collection = self.get_collection(collection_id, app_id)
        
        update_data = data.model_dump(exclude_unset=True)
        if "schema" in update_data and update_data["schema"]:
            update_data["schema"] = [
                f.model_dump() if hasattr(f, 'model_dump') else f
                for f in update_data["schema"]
            ]
        
        for key, value in update_data.items():
            setattr(collection, key, value)
        
        collection.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(collection)
        
        return collection
    
    def delete_collection(self, collection_id: str, app_id: str) -> bool:
        """Soft delete a collection"""
        collection = self.get_collection(collection_id, app_id)
        collection.is_active = False
        self.db.commit()
        return True
    
    def get_record_count(self, collection_id: str) -> int:
        """Get record count for a collection"""
        return self.db.query(CollectionRecord).filter(
            CollectionRecord.collection_id == uuid.UUID(collection_id),
            CollectionRecord.is_active == True
        ).count()


class RecordService:
    """Service for managing collection records"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def list_records(
        self,
        collection_id: str,
        page: int = 1,
        page_size: int = 50,
        sort_field: Optional[str] = None,
        sort_order: str = "desc",
        search: Optional[str] = None
    ) -> Tuple[List[CollectionRecord], int]:
        """List records with pagination and filtering"""
        query = self.db.query(CollectionRecord).filter(
            CollectionRecord.collection_id == uuid.UUID(collection_id),
            CollectionRecord.is_active == True
        )
        
        if search:
            query = query.filter(CollectionRecord.search_text.ilike(f"%{search}%"))
        
        total = query.count()
        
        # Sorting
        if sort_field:
            if sort_order == "desc":
                query = query.order_by(CollectionRecord.data[sort_field].desc())
            else:
                query = query.order_by(CollectionRecord.data[sort_field].asc())
        else:
            query = query.order_by(CollectionRecord.created_at.desc())
        
        records = query.offset((page - 1) * page_size).limit(page_size).all()
        
        return records, total
    
    def create_record(
        self,
        collection_id: str,
        data: RecordCreate,
        user_id: Optional[str] = None,
        schema: List[Dict] = None
    ) -> CollectionRecord:
        """Create a new record"""
        # Validate data against schema
        if schema:
            errors = self._validate_record_data(data.data, schema)
            if errors:
                raise ValidationError(f"Validation errors: {', '.join(errors)}")
        
        # Generate search text
        search_text = self._generate_search_text(data.data, schema or [])
        
        record = CollectionRecord(
            collection_id=uuid.UUID(collection_id),
            data=data.data,
            search_text=search_text,
            created_by_id=uuid.UUID(user_id) if user_id else None,
            updated_by_id=uuid.UUID(user_id) if user_id else None
        )
        
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        
        return record
    
    def get_record(self, record_id: str, collection_id: str) -> CollectionRecord:
        """Get a record by ID"""
        record = self.db.query(CollectionRecord).filter(
            CollectionRecord.id == uuid.UUID(record_id),
            CollectionRecord.collection_id == uuid.UUID(collection_id),
            CollectionRecord.is_active == True
        ).first()
        
        if not record:
            raise NotFoundError("Record not found")
        
        return record
    
    def update_record(
        self,
        record_id: str,
        collection_id: str,
        data: RecordUpdate,
        user_id: Optional[str] = None,
        schema: List[Dict] = None
    ) -> CollectionRecord:
        """Update a record"""
        record = self.get_record(record_id, collection_id)
        
        # Merge data
        new_data = {**record.data, **data.data}
        
        # Validate
        if schema:
            errors = self._validate_record_data(new_data, schema)
            if errors:
                raise ValidationError(f"Validation errors: {', '.join(errors)}")
        
        record.data = new_data
        record.search_text = self._generate_search_text(new_data, schema or [])
        record.updated_by_id = uuid.UUID(user_id) if user_id else None
        record.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(record)
        
        return record
    
    def delete_record(self, record_id: str, collection_id: str) -> bool:
        """Soft delete a record"""
        record = self.get_record(record_id, collection_id)
        record.is_active = False
        self.db.commit()
        return True
    
    def _validate_record_data(self, data: Dict, schema: List[Dict]) -> List[str]:
        """Validate record data against schema"""
        errors = []
        
        for field_def in schema:
            field_name = field_def.get("name")
            field_type = field_def.get("type")
            required = field_def.get("required", False)
            
            value = data.get(field_name)
            
            if required and (value is None or value == ""):
                errors.append(f"Field '{field_name}' is required")
                continue
            
            if value is None:
                continue
            
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
        
        return errors
    
    def _generate_search_text(self, data: Dict, schema: List[Dict]) -> str:
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
