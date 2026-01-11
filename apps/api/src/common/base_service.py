"""
Base service class with common operations
"""

from typing import TypeVar, Generic, Optional, List, Type, Any
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel as PydanticBaseModel

from .base_model import BaseModel
from .exceptions import NotFoundError

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=PydanticBaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=PydanticBaseModel)


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base service with CRUD operations"""
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def get(self, id: UUID) -> Optional[ModelType]:
        """Get entity by ID"""
        return self.db.query(self.model).filter(
            self.model.id == id,
            self.model.is_active == True
        ).first()
    
    def get_or_404(self, id: UUID) -> ModelType:
        """Get entity by ID or raise NotFoundError"""
        entity = self.get(id)
        if not entity:
            raise NotFoundError(f"{self.model.__name__} not found")
        return entity
    
    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        **filters
    ) -> List[ModelType]:
        """Get all entities with pagination and filters"""
        query = self.db.query(self.model).filter(self.model.is_active == True)
        
        for key, value in filters.items():
            if hasattr(self.model, key) and value is not None:
                query = query.filter(getattr(self.model, key) == value)
        
        return query.offset(skip).limit(limit).all()
    
    def count(self, **filters) -> int:
        """Count entities with filters"""
        query = self.db.query(self.model).filter(self.model.is_active == True)
        
        for key, value in filters.items():
            if hasattr(self.model, key) and value is not None:
                query = query.filter(getattr(self.model, key) == value)
        
        return query.count()
    
    def create(self, data: Any = None, **kwargs) -> ModelType:
        """Create new entity"""
        if data is not None and hasattr(data, 'model_dump'):
            entity_data = data.model_dump()
        elif data is not None and isinstance(data, dict):
            entity_data = data
        else:
            entity_data = kwargs
        
        entity = self.model(**entity_data)
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity
    
    def update(self, id: UUID, data: Any = None, **kwargs) -> ModelType:
        """Update entity"""
        entity = self.get_or_404(id)
        
        if data is not None and hasattr(data, 'model_dump'):
            update_data = data.model_dump(exclude_unset=True)
        elif data is not None and isinstance(data, dict):
            update_data = data
        else:
            update_data = kwargs
        
        for key, value in update_data.items():
            if hasattr(entity, key) and value is not None:
                setattr(entity, key, value)
        
        self.db.commit()
        self.db.refresh(entity)
        return entity
    
    def delete(self, id: UUID, soft: bool = True) -> bool:
        """Delete entity (soft delete by default)"""
        entity = self.get_or_404(id)
        
        if soft:
            entity.is_active = False
            self.db.commit()
        else:
            self.db.delete(entity)
            self.db.commit()
        
        return True
