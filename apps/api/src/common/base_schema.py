"""
Base Pydantic schemas for API request/response
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional, Generic, TypeVar, List
from datetime import datetime
import uuid

T = TypeVar('T')


class BaseSchema(BaseModel):
    """Base schema with common configuration"""
    model_config = ConfigDict(from_attributes=True)


class IDSchema(BaseSchema):
    """Schema with ID field"""
    id: uuid.UUID


class TimestampMixin:
    """Mixin for timestamp fields - use with BaseSchema"""
    created_at: datetime
    updated_at: datetime


class TimestampSchema(BaseSchema):
    """Schema with timestamp fields"""
    created_at: datetime
    updated_at: datetime


class PaginatedResponse(BaseSchema, Generic[T]):
    """Generic paginated response"""
    items: List[T]
    total: int
    page: int
    per_page: int
    pages: int


class MessageResponse(BaseSchema):
    """Simple message response"""
    message: str
    success: bool = True


class ErrorResponse(BaseSchema):
    """Error response"""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
