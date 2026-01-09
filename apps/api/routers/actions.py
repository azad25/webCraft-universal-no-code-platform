"""
Actions & Events API Routes
Advanced action system for dynamic app interactions
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from enum import Enum
import uuid
import asyncio
import httpx
import json

from core.database import get_db, App, User, AppCollection, AppRecord
from core.auth import get_current_user
from services.action_service import ActionExecutionService, EventManager

router = APIRouter()


class ActionType(str, Enum):
    # Data Actions
    CREATE_RECORD = "create_record"
    UPDATE_RECORD = "update_record"
    DELETE_RECORD = "delete_record"
    QUERY_DATA = "query_data"
    
    # Communication Actions
    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"
    SEND_NOTIFICATION = "send_notification"
    
    # Integration Actions
    API_CALL = "api_call"
    WEBHOOK_CALL = "webhook_call"
    
    # Authentication Actions
    LOGIN_USER = "login_user"
    LOGOUT_USER = "logout_user"
    REGISTER_USER = "register_user"
    RESET_PASSWORD = "reset_password"
    
    # Payment Actions
    PROCESS_PAYMENT = "process_payment"
    CREATE_SUBSCRIPTION = "create_subscription"
    CANCEL_SUBSCRIPTION = "cancel_subscription"
    
    # Navigation Actions
    REDIRECT = "redirect"
    OPEN_MODAL = "open_modal"
    CLOSE_MODAL = "close_modal"
    
    # UI Actions
    SHOW_MESSAGE = "show_message"
    UPDATE_ELEMENT = "update_element"
    TOGGLE_VISIBILITY = "toggle_visibility"
    
    # Workflow Actions
    TRIGGER_AUTOMATION = "trigger_automation"
    DELAY = "delay"
    CONDITION = "condition"
    LOOP = "loop"
    
    # Cross-App Actions
    TRIGGER_APP_EVENT = "trigger_app_event"
    SEND_APP_MESSAGE = "send_app_message"
    SYNC_APP_DATA = "sync_app_data"
    ACCESS_SHARED_DATA = "access_shared_data"


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


class PageAction(BaseModel):
    id: Optional[str] = None
    app_id: str
    page_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    event_handlers: List[EventHandler] = []
    is_active: bool = True


class ActionExecution(BaseModel):
    action_id: str
    event_data: Dict[str, Any] = {}
    user_context: Dict[str, Any] = {}


# ============================================
# ACTION MANAGEMENT
# ============================================

@router.post("/apps/{app_id}/actions")
async def create_action(
    app_id: uuid.UUID = Path(...),
    action: PageAction = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new page action"""
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Store action configuration in app config
    app_config = app.config or {}
    if 'actions' not in app_config:
        app_config['actions'] = {}
    
    action_id = str(uuid.uuid4())
    app_config['actions'][action_id] = {
        "id": action_id,
        "app_id": str(app_id),
        "page_id": action.page_id,
        "name": action.name,
        "description": action.description,
        "event_handlers": [h.dict() for h in action.event_handlers],
        "is_active": action.is_active,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": str(current_user.id)
    }
    
    app.config = app_config
    db.commit()
    
    return {
        "id": action_id,
        "message": "Action created successfully"
    }


@router.get("/apps/{app_id}/actions")
async def list_actions(
    app_id: uuid.UUID = Path(...),
    page_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all actions for an app or page"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = app.config or {}
    actions = app_config.get('actions', {})
    
    # Filter by page if specified
    if page_id:
        actions = {k: v for k, v in actions.items() if v.get('page_id') == page_id}
    
    return {
        "actions": list(actions.values()),
        "total": len(actions)
    }


@router.get("/apps/{app_id}/actions/{action_id}")
async def get_action(
    app_id: uuid.UUID = Path(...),
    action_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get action details"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = app.config or {}
    actions = app_config.get('actions', {})
    
    if action_id not in actions:
        raise HTTPException(status_code=404, detail="Action not found")
    
    return actions[action_id]


@router.put("/apps/{app_id}/actions/{action_id}")
async def update_action(
    app_id: uuid.UUID = Path(...),
    action_id: str = Path(...),
    updates: Dict[str, Any] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an action"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = app.config or {}
    actions = app_config.get('actions', {})
    
    if action_id not in actions:
        raise HTTPException(status_code=404, detail="Action not found")
    
    # Update action
    actions[action_id].update(updates)
    actions[action_id]["updated_at"] = datetime.utcnow().isoformat()
    
    app.config = app_config
    db.commit()
    
    return {"message": "Action updated successfully"}


@router.delete("/apps/{app_id}/actions/{action_id}")
async def delete_action(
    app_id: uuid.UUID = Path(...),
    action_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an action"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = app.config or {}
    actions = app_config.get('actions', {})
    
    if action_id not in actions:
        raise HTTPException(status_code=404, detail="Action not found")
    
    del actions[action_id]
    app.config = app_config
    db.commit()
    
    return {"message": "Action deleted successfully"}


# ============================================
# ACTION EXECUTION
# ============================================

@router.post("/apps/{app_id}/actions/{action_id}/execute")
async def execute_action(
    app_id: uuid.UUID = Path(...),
    action_id: str = Path(...),
    execution: ActionExecution = None,
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute an action"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = app.config or {}
    actions = app_config.get('actions', {})
    
    if action_id not in actions:
        raise HTTPException(status_code=404, detail="Action not found")
    
    action = actions[action_id]
    
    # Use the new action service
    action_service = ActionExecutionService(db)
    
    results = []
    for handler in action.get('event_handlers', []):
        for action_config in handler.get('actions', []):
            result = await action_service.execute_widget_action(
                app_id=str(app_id),
                widget_id=execution.action_id,  # Use action_id as widget_id for now
                action_config=action_config,
                event_data=execution.event_data,
                user_context=execution.user_context
            )
            results.append(result)
    
    return {
        "status": "completed",
        "action_id": action_id,
        "results": results,
        "executed_at": datetime.utcnow().isoformat()
    }


async def execute_action_workflow(
    action: Dict[str, Any],
    event_data: Dict[str, Any],
    user_context: Dict[str, Any],
    db: Session,
    app_id: str
):
    """Execute action workflow"""
    try:
        for handler in action.get('event_handlers', []):
            for action_config in handler.get('actions', []):
                await execute_single_action(
                    action_config,
                    event_data,
                    user_context,
                    db,
                    app_id
                )
    except Exception as e:
        print(f"Action execution failed: {e}")


async def execute_single_action(
    action_config: Dict[str, Any],
    event_data: Dict[str, Any],
    user_context: Dict[str, Any],
    db: Session,
    app_id: str
):
    """Execute a single action"""
    action_type = action_config.get('type')
    config = action_config.get('config', {})
    
    try:
        if action_type == ActionType.CREATE_RECORD:
            await handle_create_record(config, event_data, db, app_id)
        
        elif action_type == ActionType.UPDATE_RECORD:
            await handle_update_record(config, event_data, db, app_id)
        
        elif action_type == ActionType.DELETE_RECORD:
            await handle_delete_record(config, event_data, db, app_id)
        
        elif action_type == ActionType.SEND_EMAIL:
            await handle_send_email(config, event_data, user_context)
        
        elif action_type == ActionType.SEND_SMS:
            await handle_send_sms(config, event_data, user_context)
        
        elif action_type == ActionType.API_CALL:
            await handle_api_call(config, event_data, user_context)
        
        elif action_type == ActionType.PROCESS_PAYMENT:
            await handle_process_payment(config, event_data, user_context)
        
        elif action_type == ActionType.TRIGGER_AUTOMATION:
            await handle_trigger_automation(config, event_data, db, app_id)
        
        elif action_type == ActionType.DELAY:
            delay_seconds = config.get('seconds', 1)
            await asyncio.sleep(min(delay_seconds, 300))  # Max 5 minutes
        
        # Cross-App Actions
        elif action_type == ActionType.TRIGGER_APP_EVENT:
            await handle_trigger_app_event(config, event_data, db, app_id)
        
        elif action_type == ActionType.SEND_APP_MESSAGE:
            await handle_send_app_message(config, event_data, db, app_id)
        
        elif action_type == ActionType.SYNC_APP_DATA:
            await handle_sync_app_data(config, event_data, db, app_id)
        
        elif action_type == ActionType.ACCESS_SHARED_DATA:
            await handle_access_shared_data(config, event_data, db, app_id)
        
    except Exception as e:
        print(f"Action {action_type} failed: {e}")
        # Handle error based on error_handling config
        error_handling = action_config.get('error_handling', {})
        if error_handling.get('continue_on_error', True):
            return
        else:
            raise


# ============================================
# ACTION HANDLERS
# ============================================

async def handle_create_record(config: Dict, event_data: Dict, db: Session, app_id: str):
    """Handle record creation"""
    collection_id = config.get('collection_id')
    data = config.get('data', {})
    
    # Merge event data
    for key, value in event_data.items():
        if f"{{{key}}}" in str(data):
            data = replace_placeholders(data, {key: value})
    
    if collection_id:
        record = AppRecord(
            collection_id=uuid.UUID(collection_id),
            data=data
        )
        db.add(record)
        db.commit()


async def handle_update_record(config: Dict, event_data: Dict, db: Session, app_id: str):
    """Handle record update"""
    record_id = config.get('record_id')
    data = config.get('data', {})
    
    # Replace placeholders with event data
    for key, value in event_data.items():
        if f"{{{key}}}" in str(data):
            data = replace_placeholders(data, {key: value})
    
    if record_id:
        record = db.query(AppRecord).filter(AppRecord.id == uuid.UUID(record_id)).first()
        if record:
            record.data = {**record.data, **data}
            db.commit()


async def handle_delete_record(config: Dict, event_data: Dict, db: Session, app_id: str):
    """Handle record deletion"""
    record_id = config.get('record_id')
    
    if record_id:
        record = db.query(AppRecord).filter(AppRecord.id == uuid.UUID(record_id)).first()
        if record:
            record.is_active = False
            db.commit()


async def handle_send_email(config: Dict, event_data: Dict, user_context: Dict):
    """Handle email sending"""
    to_email = config.get('to')
    subject = config.get('subject', 'Notification')
    template = config.get('template')
    
    # Replace placeholders
    if to_email and "{" in to_email:
        to_email = replace_placeholders(to_email, event_data)
    if subject and "{" in subject:
        subject = replace_placeholders(subject, event_data)
    
    # Here you would integrate with your email service
    print(f"Sending email to {to_email}: {subject}")


async def handle_send_sms(config: Dict, event_data: Dict, user_context: Dict):
    """Handle SMS sending"""
    phone = config.get('phone')
    message = config.get('message')
    
    # Replace placeholders
    if phone and "{" in phone:
        phone = replace_placeholders(phone, event_data)
    if message and "{" in message:
        message = replace_placeholders(message, event_data)
    
    # Here you would integrate with your SMS service
    print(f"Sending SMS to {phone}: {message}")


async def handle_api_call(config: Dict, event_data: Dict, user_context: Dict):
    """Handle API call"""
    url = config.get('url')
    method = config.get('method', 'POST')
    headers = config.get('headers', {})
    body = config.get('body', {})
    
    # Replace placeholders
    if url and "{" in url:
        url = replace_placeholders(url, event_data)
    if body:
        body = replace_placeholders(body, event_data)
    
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=method,
            url=url,
            headers=headers,
            json=body,
            timeout=30.0
        )
        return response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text


async def handle_process_payment(config: Dict, event_data: Dict, user_context: Dict):
    """Handle payment processing"""
    amount = config.get('amount')
    currency = config.get('currency', 'USD')
    payment_method = config.get('payment_method')
    
    # Replace placeholders
    if isinstance(amount, str) and "{" in amount:
        amount = replace_placeholders(amount, event_data)
    
    # Here you would integrate with payment processors like Stripe
    print(f"Processing payment: {amount} {currency}")


async def handle_trigger_automation(config: Dict, event_data: Dict, db: Session, app_id: str):
    """Handle automation triggering"""
    automation_id = config.get('automation_id')
    
    if automation_id:
        # Import here to avoid circular imports
        from routers.automations import execute_automation_workflow
        await execute_automation_workflow(
            uuid.UUID(automation_id),
            event_data,
            db
        )


# ============================================
# CROSS-APP ACTION HANDLERS
# ============================================

async def handle_trigger_app_event(config: Dict, event_data: Dict, db: Session, app_id: str):
    """Handle triggering an event in another app"""
    from services.cross_app_service import CrossAppService
    
    target_app_id = config.get('target_app_id')
    event_type = config.get('event_type')
    cross_app_event_data = config.get('event_data', {})
    
    # Merge with current event data
    merged_data = {**cross_app_event_data, **event_data}
    
    if target_app_id and event_type:
        service = CrossAppService(db)
        await service.trigger_cross_app_event(
            source_app_id=uuid.UUID(app_id),
            event_type=event_type,
            event_data=merged_data,
            target_app_id=uuid.UUID(target_app_id)
        )


async def handle_send_app_message(config: Dict, event_data: Dict, db: Session, app_id: str):
    """Handle sending a message to another app"""
    from services.cross_app_service import CrossAppService
    
    to_app_id = config.get('to_app_id')
    message_type = config.get('message_type')
    subject = config.get('subject')
    payload = config.get('payload', {})
    
    # Replace placeholders in subject and payload
    if subject and "{" in subject:
        subject = replace_placeholders(subject, event_data)
    
    if payload:
        payload = replace_placeholders(payload, event_data)
    
    if to_app_id and message_type and subject:
        service = CrossAppService(db)
        await service.send_app_message(
            from_app_id=uuid.UUID(app_id),
            to_app_id=uuid.UUID(to_app_id),
            message_type=message_type,
            subject=subject,
            payload=payload
        )


async def handle_sync_app_data(config: Dict, event_data: Dict, db: Session, app_id: str):
    """Handle triggering data synchronization between apps"""
    from services.cross_app_service import CrossAppService
    
    sync_job_id = config.get('sync_job_id')
    
    if sync_job_id:
        service = CrossAppService(db)
        await service.execute_data_sync(uuid.UUID(sync_job_id))


async def handle_access_shared_data(config: Dict, event_data: Dict, db: Session, app_id: str):
    """Handle accessing data from a shared collection"""
    from services.cross_app_service import CrossAppService
    
    collection_id = config.get('collection_id')
    filters = config.get('filters', {})
    limit = config.get('limit', 50)
    
    # Replace placeholders in filters
    if filters:
        filters = replace_placeholders(filters, event_data)
    
    if collection_id:
        service = CrossAppService(db)
        # Get the app owner for permission check
        app = db.query(App).filter(App.id == uuid.UUID(app_id)).first()
        if app:
            data = await service.access_shared_collection_data(
                collection_id=uuid.UUID(collection_id),
                requesting_app_id=uuid.UUID(app_id),
                user_id=app.owner_id,
                filters=filters,
                limit=limit
            )
            # Store the accessed data in event context for use by subsequent actions
            event_data['shared_data'] = data


# ============================================
# ACTION TEMPLATES
# ============================================

@router.get("/action-templates")
async def get_action_templates(
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get pre-built action templates"""
    templates = {
        "user_registration": {
            "name": "User Registration Flow",
            "description": "Complete user registration with email verification",
            "category": "authentication",
            "event_handlers": [
                {
                    "event_type": "submit",
                    "element_selector": "#registration-form",
                    "actions": [
                        {
                            "type": "create_record",
                            "config": {
                                "collection_id": "users",
                                "data": {
                                    "email": "{email}",
                                    "name": "{name}",
                                    "status": "pending_verification"
                                }
                            }
                        },
                        {
                            "type": "send_email",
                            "config": {
                                "to": "{email}",
                                "subject": "Welcome! Please verify your email",
                                "template": "email_verification"
                            }
                        },
                        {
                            "type": "redirect",
                            "config": {
                                "url": "/verification-sent"
                            }
                        }
                    ]
                }
            ]
        },
        
        "order_processing": {
            "name": "E-commerce Order Processing",
            "description": "Handle order creation and payment processing",
            "category": "ecommerce",
            "event_handlers": [
                {
                    "event_type": "submit",
                    "element_selector": "#checkout-form",
                    "actions": [
                        {
                            "type": "process_payment",
                            "config": {
                                "amount": "{total}",
                                "currency": "USD",
                                "payment_method": "{payment_method}"
                            }
                        },
                        {
                            "type": "create_record",
                            "config": {
                                "collection_id": "orders",
                                "data": {
                                    "customer_email": "{email}",
                                    "items": "{items}",
                                    "total": "{total}",
                                    "status": "confirmed"
                                }
                            }
                        },
                        {
                            "type": "send_email",
                            "config": {
                                "to": "{email}",
                                "subject": "Order Confirmation #{order_id}",
                                "template": "order_confirmation"
                            }
                        }
                    ]
                }
            ]
        },
        
        "lead_capture": {
            "name": "Lead Capture & CRM Integration",
            "description": "Capture leads and add to CRM system",
            "category": "marketing",
            "event_handlers": [
                {
                    "event_type": "submit",
                    "element_selector": "#lead-form",
                    "actions": [
                        {
                            "type": "create_record",
                            "config": {
                                "collection_id": "leads",
                                "data": {
                                    "email": "{email}",
                                    "name": "{name}",
                                    "company": "{company}",
                                    "source": "website",
                                    "status": "new"
                                }
                            }
                        },
                        {
                            "type": "api_call",
                            "config": {
                                "url": "https://api.crm.com/leads",
                                "method": "POST",
                                "headers": {
                                    "Authorization": "Bearer {crm_token}"
                                },
                                "body": {
                                    "email": "{email}",
                                    "name": "{name}",
                                    "company": "{company}"
                                }
                            }
                        },
                        {
                            "type": "trigger_automation",
                            "config": {
                                "automation_id": "lead_nurture_sequence"
                            }
                        }
                    ]
                }
            ]
        },
        
        "support_ticket": {
            "name": "Support Ticket Creation",
            "description": "Create support tickets and notify team",
            "category": "support",
            "event_handlers": [
                {
                    "event_type": "submit",
                    "element_selector": "#support-form",
                    "actions": [
                        {
                            "type": "create_record",
                            "config": {
                                "collection_id": "tickets",
                                "data": {
                                    "customer_email": "{email}",
                                    "subject": "{subject}",
                                    "description": "{description}",
                                    "priority": "{priority}",
                                    "status": "open"
                                }
                            }
                        },
                        {
                            "type": "send_email",
                            "config": {
                                "to": "support@company.com",
                                "subject": "New Support Ticket: {subject}",
                                "template": "support_notification"
                            }
                        },
                        {
                            "type": "send_email",
                            "config": {
                                "to": "{email}",
                                "subject": "Support Ticket Created - #{ticket_id}",
                                "template": "ticket_confirmation"
                            }
                        }
                    ]
                }
            ]
        },
        
        "cross_app_data_sync": {
            "name": "Cross-App Data Synchronization",
            "description": "Sync data between different apps when records are created",
            "category": "cross_app",
            "event_handlers": [
                {
                    "event_type": "submit",
                    "element_selector": "#customer-form",
                    "actions": [
                        {
                            "type": "create_record",
                            "config": {
                                "collection_id": "customers",
                                "data": {
                                    "name": "{name}",
                                    "email": "{email}",
                                    "phone": "{phone}",
                                    "company": "{company}"
                                }
                            }
                        },
                        {
                            "type": "trigger_app_event",
                            "config": {
                                "target_app_id": "{crm_app_id}",
                                "event_type": "customer_created",
                                "event_data": {
                                    "customer_name": "{name}",
                                    "customer_email": "{email}",
                                    "source_app": "website"
                                }
                            }
                        },
                        {
                            "type": "send_app_message",
                            "config": {
                                "to_app_id": "{marketing_app_id}",
                                "message_type": "new_lead",
                                "subject": "New Lead from Website",
                                "payload": {
                                    "lead_data": {
                                        "name": "{name}",
                                        "email": "{email}",
                                        "source": "contact_form"
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        },
        
        "shared_inventory_update": {
            "name": "Shared Inventory Management",
            "description": "Update inventory across multiple e-commerce apps",
            "category": "cross_app",
            "event_handlers": [
                {
                    "event_type": "submit",
                    "element_selector": "#order-form",
                    "actions": [
                        {
                            "type": "update_record",
                            "config": {
                                "collection_id": "products",
                                "record_id": "{product_id}",
                                "data": {
                                    "inventory_count": "{new_inventory_count}"
                                }
                            }
                        },
                        {
                            "type": "sync_app_data",
                            "config": {
                                "sync_job_id": "{inventory_sync_job_id}"
                            }
                        },
                        {
                            "type": "trigger_app_event",
                            "config": {
                                "event_type": "inventory_updated",
                                "event_data": {
                                    "product_id": "{product_id}",
                                    "new_count": "{new_inventory_count}",
                                    "updated_by": "order_system"
                                }
                            }
                        }
                    ]
                }
            ]
        },
        
        "multi_app_notification": {
            "name": "Multi-App Notification System",
            "description": "Send notifications across multiple connected apps",
            "category": "cross_app",
            "event_handlers": [
                {
                    "event_type": "click",
                    "element_selector": "#emergency-alert-btn",
                    "actions": [
                        {
                            "type": "trigger_app_event",
                            "config": {
                                "event_type": "emergency_alert",
                                "event_data": {
                                    "alert_type": "system_maintenance",
                                    "message": "Scheduled maintenance starting in 30 minutes",
                                    "severity": "high",
                                    "timestamp": "{timestamp}"
                                }
                            }
                        },
                        {
                            "type": "send_app_message",
                            "config": {
                                "to_app_id": "{admin_dashboard_app_id}",
                                "message_type": "system_alert",
                                "subject": "Emergency Alert Triggered",
                                "payload": {
                                    "alert_details": {
                                        "type": "maintenance",
                                        "scheduled_time": "{maintenance_time}",
                                        "duration": "2 hours"
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        }
    }
    
    if category:
        templates = {k: v for k, v in templates.items() if v.get('category') == category}
    
    return {"templates": templates}


@router.post("/apps/{app_id}/actions/from-template")
async def create_action_from_template(
    app_id: uuid.UUID = Path(...),
    template_id: str = Query(...),
    page_id: Optional[str] = Query(None),
    customizations: Dict[str, Any] = {},
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create action from template"""
    # Get template
    templates_response = await get_action_templates(current_user=current_user)
    templates = templates_response["templates"]
    
    if template_id not in templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = templates[template_id]
    
    # Create action from template
    action = PageAction(
        app_id=str(app_id),
        page_id=page_id,
        name=template["name"],
        description=template["description"],
        event_handlers=[EventHandler(**handler) for handler in template["event_handlers"]]
    )
    
    # Apply customizations
    if customizations:
        # Apply customizations to action config
        pass
    
    # Create the action
    return await create_action(app_id, action, current_user, db)


# ============================================
# HELPER FUNCTIONS
# ============================================

def replace_placeholders(obj: Any, values: Dict[str, Any]) -> Any:
    """Replace placeholders in object with values"""
    if isinstance(obj, str):
        for key, value in values.items():
            obj = obj.replace(f"{{{key}}}", str(value))
        return obj
    elif isinstance(obj, dict):
        return {k: replace_placeholders(v, values) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_placeholders(item, values) for item in obj]
    return obj


# ============================================
# WIDGET EVENT HANDLING
# ============================================

@router.post("/apps/{app_id}/widgets/{widget_id}/events/{event_type}")
async def handle_widget_event(
    app_id: uuid.UUID = Path(...),
    widget_id: str = Path(...),
    event_type: str = Path(...),
    event_data: Dict[str, Any] = {},
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Handle a widget event and execute associated actions"""
    
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Use the event manager
    event_manager = EventManager(db)
    
    user_context = {
        'user_id': str(current_user.id),
        'user_email': current_user.email,
        'user_name': current_user.full_name or current_user.username,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    results = await event_manager.handle_widget_event(
        app_id=str(app_id),
        widget_id=widget_id,
        event_type=event_type,
        event_data=event_data,
        user_context=user_context
    )
    
    return {
        'success': True,
        'app_id': str(app_id),
        'widget_id': widget_id,
        'event_type': event_type,
        'results': results,
        'executed_at': datetime.utcnow().isoformat()
    }


@router.get("/apps/{app_id}/widgets/{widget_id}/actions")
async def get_widget_actions(
    app_id: uuid.UUID = Path(...),
    widget_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all actions associated with a widget"""
    
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    app_config = app.config or {}
    actions = app_config.get('actions', {})
    
    widget_actions = []
    for action_id, action in actions.items():
        for handler in action.get('event_handlers', []):
            element_selector = handler.get('element_selector', '')
            if f"#{widget_id}" in element_selector or f".{widget_id}" in element_selector:
                widget_actions.append({
                    'action_id': action_id,
                    'action_name': action.get('name'),
                    'event_type': handler.get('event_type'),
                    'actions_count': len(handler.get('actions', []))
                })
    
    return {
        'widget_id': widget_id,
        'actions': widget_actions,
        'total': len(widget_actions)
    }


# ============================================
# REAL-TIME EVENTS
# ============================================

@router.post("/apps/{app_id}/events/trigger")
async def trigger_event(
    app_id: uuid.UUID = Path(...),
    event_type: str = Query(...),
    element_id: Optional[str] = Query(None),
    event_data: Dict[str, Any] = {},
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger a custom event"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Find matching actions
    app_config = app.config or {}
    actions = app_config.get('actions', {})
    
    triggered_actions = []
    for action_id, action in actions.items():
        for handler in action.get('event_handlers', []):
            if handler.get('event_type') == event_type:
                # Check element selector if specified
                if element_id and handler.get('element_selector'):
                    selector = handler.get('element_selector')
                    if f"#{element_id}" not in selector and f".{element_id}" not in selector:
                        continue
                
                # Execute action
                await execute_action_workflow(
                    action,
                    event_data,
                    {"user_id": str(current_user.id)},
                    db,
                    str(app_id)
                )
                triggered_actions.append(action_id)
    
    return {
        "triggered_actions": triggered_actions,
        "event_type": event_type,
        "element_id": element_id
    }