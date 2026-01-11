"""
Integrations domain models
"""

from sqlalchemy import Column, String, Boolean, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.common.base_model import BaseModel


class Integration(BaseModel):
    """Integration model for V2"""
    __tablename__ = "integrations"
    
    name = Column(String(255), nullable=False)
    provider = Column(String(100), nullable=False)  # stripe, mailchimp, zapier, etc.
    
    # Configuration
    config = Column(JSONB, default={})
    credentials = Column(JSONB, default={})  # Encrypted in production
    
    # Status
    is_connected = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(String(50), nullable=True)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), nullable=False)  # Reference to apps table
    
    __table_args__ = (
        Index('idx_integration_app_provider', 'app_id', 'provider'),
    )


class IntegrationLog(BaseModel):
    """Integration activity log for V2"""
    __tablename__ = "integration_logs"
    
    action = Column(String(100), nullable=False)  # sync, test, connect, disconnect
    status = Column(String(50), nullable=False)  # success, error, pending
    message = Column(Text, nullable=True)
    request_data = Column(JSONB, default={})
    response_data = Column(JSONB, default={})
    
    # Relationships
    integration_id = Column(UUID(as_uuid=True), nullable=False)  # Reference to integrations table