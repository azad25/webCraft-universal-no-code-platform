"""
Authentication domain schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import uuid

from src.common.base_schema import BaseSchema


# Request schemas
class UserRegister(BaseSchema):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=255)
    terms_accepted: bool = Field(..., description="Must accept terms")


class UserLogin(BaseSchema):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseSchema):
    refresh_token: str


class PasswordResetRequest(BaseSchema):
    email: EmailStr


class PasswordResetConfirm(BaseSchema):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class ChangePasswordRequest(BaseSchema):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


class UpdateProfileRequest(BaseSchema):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class APIKeyCreate(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    scopes: Optional[List[str]] = Field(default_factory=list)
    rate_limit: Optional[int] = Field(1000, ge=100, le=10000)


# Response schemas
class UserResponse(BaseSchema):
    id: uuid.UUID
    email: str
    username: str
    full_name: Optional[str]
    is_verified: bool
    is_premium: bool
    subscription_tier: str
    avatar_url: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TokenResponse(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class APIKeyResponse(BaseSchema):
    id: uuid.UUID
    name: str
    key_prefix: str
    scopes: List[str]
    rate_limit: int
    last_used: Optional[datetime]
    usage_count: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class OAuthURLResponse(BaseSchema):
    authorization_url: str
    state: str
