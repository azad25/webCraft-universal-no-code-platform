"""
Authentication domain models for V2
"""

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declared_attr
from datetime import datetime
import uuid

from src.common.base_model import BaseModel


class User(BaseModel):
    """User model for V2 - completely separate from V1"""
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255))
    hashed_password = Column(String(255))
    is_verified = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)
    avatar_url = Column(String(500))
    
    # OAuth fields
    google_id = Column(String(100), unique=True, nullable=True)
    github_id = Column(String(100), unique=True, nullable=True)
    microsoft_id = Column(String(100), unique=True, nullable=True)
    
    # Subscription info
    subscription_tier = Column(String(50), default="free")  # free, pro, enterprise
    subscription_expires = Column(DateTime, nullable=True)
    
    # Relationships using declared_attr to avoid circular imports
    # TODO: Re-enable AI relationships once circular import issues are resolved
    # @declared_attr
    # def ai_requests(cls):
    #     return relationship("AIRequest", back_populates="user", lazy="dynamic", 
    #                       cascade="all, delete-orphan", passive_deletes=True)
    
    # @declared_attr
    # def ai_usage_stats(cls):
    #     return relationship("AIUsageStats", back_populates="user", lazy="dynamic",
    #                       cascade="all, delete-orphan", passive_deletes=True)


class APIKey(BaseModel):
    """API Key model for V2"""
    __tablename__ = "api_keys"
    
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), nullable=False, unique=True)
    key_prefix = Column(String(20), nullable=False)
    
    # Permissions
    scopes = Column(String(500), default="read")  # comma-separated scopes
    is_active = Column(Boolean, default=True)
    
    # Usage tracking
    last_used_at = Column(DateTime, nullable=True)
    usage_count = Column(String(50), default="0")
    
    # Expiration
    expires_at = Column(DateTime, nullable=True)
    
class PasswordResetToken(BaseModel):
    """Password reset token model for V2"""
    __tablename__ = "password_reset_tokens"
    
    token = Column(String(255), nullable=False, unique=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)


class EmailVerificationToken(BaseModel):
    """Email verification token model for V2"""
    __tablename__ = "email_verification_tokens"
    
    token = Column(String(255), nullable=False, unique=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)


class RefreshToken(BaseModel):
    """Refresh token model for V2"""
    __tablename__ = "refresh_tokens"
    
    token_hash = Column(String(255), nullable=False, unique=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    device_info = Column(String(500), nullable=True)