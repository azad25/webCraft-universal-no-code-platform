"""
Automation domain models
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from src.common.base_model import BaseModel


class TriggerType(str, enum.Enum):
    FORM_SUBMIT = "form_submit"
    ORDER_CREATED = "order_created"
    USER_SIGNUP = "user_signup"
    SCHEDULE = "schedule"
    WEBHOOK = "webhook"
    PAGE_VIEW = "page_view"
    BUTTON_CLICK = "button_click"
    INVENTORY_LOW = "inventory_low"
    PAYMENT_RECEIVED = "payment_received"
    RECORD_CREATED = "record_created"
    RECORD_UPDATED = "record_updated"
    RECORD_DELETED = "record_deleted"


class ActionType(str, enum.Enum):
    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"
    CREATE_RECORD = "create_record"
    UPDATE_RECORD = "update_record"
    DELETE_RECORD = "delete_record"
    HTTP_REQUEST = "http_request"
    SLACK_MESSAGE = "slack_message"
    DELAY = "delay"
    CONDITION = "condition"
    LOOP = "loop"
    SET_VARIABLE = "set_variable"
    TRANSFORM_DATA = "transform_data"


class AutomationStatus(str, enum.Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Automation(BaseModel):
    __tablename__ = "automations"

    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    trigger_type = Column(SQLEnum(TriggerType), nullable=False)
    trigger_config = Column(JSON, default={})
    workflow_steps = Column(JSON, default=[])
    is_enabled = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    last_executed_at = Column(DateTime, nullable=True)
    execution_count = Column(Integer, default=0)
    
    # Relationships
    app = relationship("App", back_populates="automations")
    logs = relationship("AutomationLog", back_populates="automation")


class AutomationLog(BaseModel):
    __tablename__ = "automation_logs"

    automation_id = Column(UUID(as_uuid=True), ForeignKey("automations.id"), nullable=False, index=True)
    status = Column(SQLEnum(AutomationStatus), nullable=False)
    trigger_data = Column(JSON, default={})
    execution_result = Column(JSON, default={})
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    steps_executed = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    automation = relationship("Automation", back_populates="logs")