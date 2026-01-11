"""
Automation domain schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from src.common.base_schema import BaseSchema


class TriggerType(str, Enum):
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


class ActionType(str, Enum):
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


class AutomationStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WorkflowStep(BaseModel):
    id: str
    type: str
    action_type: Optional[ActionType] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    next_steps: List[str] = Field(default_factory=list)
    position: Dict[str, int] = Field(default_factory=lambda: {"x": 0, "y": 0})


class AutomationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    trigger_type: TriggerType
    trigger_config: Dict[str, Any] = Field(default_factory=dict)
    workflow_steps: List[WorkflowStep] = Field(default_factory=list)
    is_enabled: bool = True


class AutomationCreateRequest(BaseModel):
    """Automation creation request without app_id (comes from URL)"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    trigger_type: TriggerType
    trigger_config: Dict[str, Any] = Field(default_factory=dict)
    workflow_steps: List[WorkflowStep] = Field(default_factory=list)
    is_enabled: bool = True


class AutomationCreate(AutomationBase):
    app_id: str


class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_config: Optional[Dict[str, Any]] = None
    workflow_steps: Optional[List[WorkflowStep]] = None
    is_enabled: Optional[bool] = None


class AutomationResponse(BaseSchema, AutomationBase):
    app_id: str
    is_active: bool
    last_executed_at: Optional[datetime] = None
    execution_count: int


class AutomationLogBase(BaseModel):
    status: AutomationStatus
    trigger_data: Dict[str, Any] = Field(default_factory=dict)
    execution_result: Dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None
    duration_ms: Optional[int] = None
    steps_executed: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class AutomationLogCreate(AutomationLogBase):
    automation_id: str


class AutomationLogResponse(BaseSchema, AutomationLogBase):
    automation_id: str


class AutomationTemplate(BaseModel):
    id: str
    name: str
    description: str
    category: str
    trigger_type: TriggerType
    difficulty: str = "beginner"
    estimated_time: str = "5 minutes"
    features: List[str] = Field(default_factory=list)
    workflow_steps: List[WorkflowStep] = Field(default_factory=list)
    usage_count: Optional[int] = None
    success_rate: Optional[int] = None


class AutomationListParams(BaseModel):
    is_enabled: Optional[bool] = None
    trigger_type: Optional[str] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=50, ge=1, le=100)


class AutomationLogListParams(BaseModel):
    status: Optional[AutomationStatus] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=50, ge=1, le=100)


class ScheduleConfig(BaseModel):
    type: str  # "cron", "interval", "date"
    cron: Optional[str] = None
    interval_seconds: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    timezone: str = "UTC"


class WebhookTriggerData(BaseModel):
    hook_id: str
    payload: Dict[str, Any] = Field(default_factory=dict)


# Response list schemas
class AutomationListResponse(BaseModel):
    items: List[AutomationResponse]
    total: int
    page: int
    per_page: int


class ExecuteRequest(BaseModel):
    trigger_data: Dict[str, Any] = Field(default_factory=dict)
