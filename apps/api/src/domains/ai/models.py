"""
AI domain models
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from src.common.base_model import BaseModel


class AIProvider(str, enum.Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    CLAUDE = "claude"
    CUSTOM = "custom"


class ContentType(str, enum.Enum):
    TEXT = "text"
    CODE = "code"
    IMAGE = "image"
    MARKETING = "marketing"
    SEO = "seo"
    DESIGN = "design"


class AIRequest(BaseModel):
    __tablename__ = "ai_requests"

    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(SQLEnum(AIProvider), nullable=False)
    content_type = Column(SQLEnum(ContentType), nullable=False)
    prompt = Column(Text, nullable=False)
    context = Column(JSON, default={})
    response_data = Column(JSON, default={})
    extra_data = Column(JSON, default={})  # Renamed from 'metadata' which is reserved
    tokens_used = Column(Integer, default=0)
    cost_cents = Column(Integer, default=0)
    processing_time_ms = Column(Integer, default=0)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    
    # Relationships (temporarily disabled to fix circular imports)
    # TODO: Re-enable once User model relationships are fixed
    # app = relationship("App", back_populates="ai_requests", lazy="select")
    # user = relationship("User", back_populates="ai_requests", lazy="select")


class AITemplate(BaseModel):
    __tablename__ = "ai_templates"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    content_type = Column(SQLEnum(ContentType), nullable=False)
    prompt_template = Column(Text, nullable=False)
    variables = Column(JSON, default=[])
    example_output = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)


class AIUsageStats(BaseModel):
    __tablename__ = "ai_usage_stats"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    provider = Column(SQLEnum(AIProvider), nullable=False)
    content_type = Column(SQLEnum(ContentType), nullable=False)
    requests_count = Column(Integer, default=0)
    tokens_used = Column(Integer, default=0)
    cost_cents = Column(Integer, default=0)
    
    # Relationships (temporarily disabled to fix circular imports)
    # TODO: Re-enable once User model relationships are fixed
    # user = relationship("User", back_populates="ai_usage_stats", lazy="select")