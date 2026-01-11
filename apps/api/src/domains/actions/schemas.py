"""Actions domain schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ActionType(str, Enum):
    CREATE_RECORD = "create_record"
    UPDATE_RECORD = "update_record"
    DELETE_RECORD = "delete_record"
    QUERY_DATA = "query_data"
    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"
    SEND_NOTIFICATION = "send_notification"
    API_CALL = "api_call"
    WEBHOOK_CALL = "webhook_call"
    LOGIN_USER = "login_user"
    LOGOUT_USER = "logout_user"
    REGISTER_USER = "register_user"
    PROCESS_PAYMENT = "process_payment"
    REDIRECT = "redirect"
    OPEN_MODAL = "open_modal"
    CLOSE_MODAL = "close_modal"
    SHOW_MESSAGE = "show_message"
    UPDATE_ELEMENT = "update_element"
    TRIGGER_AUTOMATION = "trigger_automation"
    DELAY = "delay"
    CONDITION = "condition"
    TRIGGER_APP_EVENT = "trigger_app_event"
    SEND_APP_MESSAGE = "send_app_message"


class EventType(str, Enum):
    CLICK = "click"
    SUBMIT = "submit"
    CHANGE = "change"
    LOAD = "load"
    SCROLL = "scroll"
    HOVER = "hover"
    FOCUS = "focus"
    BLUR = "blur"
    TIMER = "timer"
    DATA_CHANGE = "data_change"
    CUSTOM = "custom"


class ActionConfig(BaseModel):
    type: ActionType
    config: Dict[str, Any] = {}
    conditions: List[Dict[str, Any]] = []
    error_handling: Dict[str, Any] = {}


class EventHandler(BaseModel):
    event_type: EventType
    element_selector: Optional[str] = None
    actions: List[ActionConfig] = []
    debounce_ms: int = 0
    once: bool = False


class PageActionCreate(BaseModel):
    app_id: str
    page_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    event_handlers: List[EventHandler] = []
    is_active: bool = True


class ActionCreateRequest(BaseModel):
    """Action creation request without app_id (comes from URL)"""
    page_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    event_handlers: List[EventHandler] = []
    is_active: bool = True


class ActionExecution(BaseModel):
    action_id: str
    event_data: Dict[str, Any] = {}
    user_context: Dict[str, Any] = {}


class ActionResponse(BaseModel):
    id: str
    app_id: str
    page_id: Optional[str]
    name: str
    description: Optional[str]
    event_handlers: List[Dict[str, Any]]
    is_active: bool
    created_at: str
    created_by: str


class ActionTemplate(BaseModel):
    name: str
    description: str
    category: str
    event_handlers: List[Dict[str, Any]]
