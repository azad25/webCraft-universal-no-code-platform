"""
Base repository pattern for data access
"""

from typing import TypeVar, Generic, Optional, List, Type, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from uuid import UUID

from .base_model import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """Base repository with data access methods"""
    
    def __init__(self, db: Session, model: Type[ModelType]):
        self.db = db
        self.model = model
    
    def find_by_id(self, id: UUID) -> Optional[ModelType]:
        """Find entity by ID"""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def find_one(self, **filters) -> Optional[ModelType]:
        """Find single entity by filters"""
        query = self.db.query(self.model)
        for key, value in filters.items():
            if hasattr(self.model, key):
                query = query.filter(getattr(self.model, key) == value)
        return query.first()
    
    def find_many(
        self,
        filters: Dict[str, Any] = None,
        order_by: str = None,
        order_desc: bool = False,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """Find multiple entities"""
        query = self.db.query(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    query = query.filter(getattr(self.model, key) == value)
        
        if order_by and hasattr(self.model, order_by):
            column = getattr(self.model, order_by)
            query = query.order_by(column.desc() if order_desc else column)
        
        return query.offset(skip).limit(limit).all()
    
    def count(self, **filters) -> int:
        """Count entities"""
        query = self.db.query(self.model)
        for key, value in filters.items():
            if hasattr(self.model, key) and value is not None:
                query = query.filter(getattr(self.model, key) == value)
        return query.count()
    
    def exists(self, **filters) -> bool:
        """Check if entity exists"""
        return self.find_one(**filters) is not None
    
    def save(self, entity: ModelType) -> ModelType:
        """Save entity"""
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity
    
    def save_many(self, entities: List[ModelType]) -> List[ModelType]:
        """Save multiple entities"""
        self.db.add_all(entities)
        self.db.commit()
        for entity in entities:
            self.db.refresh(entity)
        return entities
    
    def delete(self, entity: ModelType) -> None:
        """Delete entity"""
        self.db.delete(entity)
        self.db.commit()
    
    def delete_by_id(self, id: UUID) -> bool:
        """Delete entity by ID"""
        entity = self.find_by_id(id)
        if entity:
            self.delete(entity)
            return True
        return False
