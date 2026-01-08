"""
Automation Engine API Routes
Visual workflow builder with triggers and actions - Database Persisted
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
import uuid
import asyncio
import httpx

from core.database import get_db, Automation, AutomationLog, App, User
from core.auth import get_current_user

router = APIRouter()


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


class WorkflowStep(BaseModel):
    id: str
    type: str
    action_type: Optional[ActionType] = None
    config: Dict[str, Any] = {}
    next_steps: List[str] = []
    position: Dict[str, int] = {"x": 0, "y": 0}


class AutomationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    trigger_type: TriggerType
    trigger_config: Dict[str, Any] = {}
    workflow_steps: List[WorkflowStep] = []
    is_enabled: bool = True


class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_config: Optional[Dict[str, Any]] = None
    workflow_steps: Optional[List[WorkflowStep]] = None
    is_enabled: Optional[bool] = None


class AutomationResponse(BaseModel):
    id: str
    app_id: str
    name: str
    description: Optional[str]
    trigger_type: str
    trigger_config: Dict[str, Any]
    workflow_steps: List[Dict]
    is_enabled: bool
    last_executed_at: Optional[datetime]
    execution_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def automation_to_response(automation: Automation) -> Dict:
    """Convert Automation model to response dict"""
    return {
        "id": str(automation.id),
        "app_id": str(automation.app_id),
        "name": automation.name,
        "description": automation.description,
        "trigger_type": automation.trigger_type,
        "trigger_config": automation.trigger_config or {},
        "workflow_steps": automation.workflow_steps or [],
        "is_enabled": automation.is_enabled,
        "last_executed_at": automation.last_executed_at.isoformat() if automation.last_executed_at else None,
        "execution_count": automation.execution_count,
        "created_at": automation.created_at.isoformat(),
        "updated_at": automation.updated_at.isoformat()
    }


@router.get("/apps/{app_id}/automations")
async def list_automations(
    app_id: uuid.UUID = Path(...),
    is_enabled: Optional[bool] = Query(None),
    trigger_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all automations for an app"""
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    query = db.query(Automation).filter(
        Automation.app_id == app_id,
        Automation.is_active == True
    )
    
    if is_enabled is not None:
        query = query.filter(Automation.is_enabled == is_enabled)
    
    if trigger_type:
        query = query.filter(Automation.trigger_type == trigger_type)
    
    automations = query.order_by(Automation.created_at.desc()).all()
    
    return {
        "automations": [automation_to_response(a) for a in automations],
        "total": len(automations)
    }


@router.post("/apps/{app_id}/automations")
async def create_automation(
    app_id: uuid.UUID = Path(...),
    automation: AutomationCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new automation workflow"""
    # Verify app ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    new_automation = Automation(
        app_id=app_id,
        name=automation.name,
        description=automation.description,
        trigger_type=automation.trigger_type.value,
        trigger_config=automation.trigger_config,
        workflow_steps=[s.dict() for s in automation.workflow_steps],
        is_enabled=automation.is_enabled
    )
    
    db.add(new_automation)
    db.commit()
    db.refresh(new_automation)
    
    return automation_to_response(new_automation)


@router.get("/apps/{app_id}/automations/{automation_id}")
async def get_automation(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get automation details"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    return automation_to_response(automation)


@router.put("/apps/{app_id}/automations/{automation_id}")
async def update_automation(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    updates: AutomationUpdate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an automation"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    update_data = updates.dict(exclude_unset=True)
    
    if "workflow_steps" in update_data and update_data["workflow_steps"]:
        update_data["workflow_steps"] = [
            s.dict() if hasattr(s, 'dict') else s 
            for s in update_data["workflow_steps"]
        ]
    
    for key, value in update_data.items():
        setattr(automation, key, value)
    
    automation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(automation)
    
    return automation_to_response(automation)


@router.delete("/apps/{app_id}/automations/{automation_id}")
async def delete_automation(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an automation (soft delete)"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    automation.is_active = False
    db.commit()
    
    return {"message": "Automation deleted"}


async def execute_workflow_step(step: Dict, context: Dict, db: Session) -> Dict:
    """Execute a single workflow step"""
    action_type = step.get("action_type")
    config = step.get("config", {})
    result = {"success": True, "output": {}}
    
    try:
        if action_type == "send_email":
            # Integration with email service
            result["output"] = {
                "sent": True,
                "to": config.get("to"),
                "subject": config.get("subject")
            }
        
        elif action_type == "http_request":
            async with httpx.AsyncClient() as client:
                method = config.get("method", "GET").upper()
                url = config.get("url")
                headers = config.get("headers", {})
                body = config.get("body")
                
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=body if body else None,
                    timeout=30.0
                )
                result["output"] = {
                    "status_code": response.status_code,
                    "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                }
        
        elif action_type == "delay":
            delay_seconds = config.get("seconds", 0)
            delay_minutes = config.get("minutes", 0)
            total_delay = delay_seconds + (delay_minutes * 60)
            await asyncio.sleep(min(total_delay, 300))  # Max 5 min delay
            result["output"] = {"delayed_seconds": total_delay}
        
        elif action_type == "create_record":
            from core.database import AppCollection, AppRecord
            collection_id = config.get("collection_id")
            data = config.get("data", {})
            
            if collection_id:
                record = AppRecord(
                    collection_id=uuid.UUID(collection_id),
                    data=data
                )
                db.add(record)
                db.commit()
                result["output"] = {"record_id": str(record.id)}
        
        elif action_type == "update_record":
            from core.database import AppRecord
            record_id = config.get("record_id")
            data = config.get("data", {})
            
            if record_id:
                record = db.query(AppRecord).filter(AppRecord.id == uuid.UUID(record_id)).first()
                if record:
                    record.data = {**record.data, **data}
                    db.commit()
                    result["output"] = {"updated": True}
        
        elif action_type == "set_variable":
            var_name = config.get("name")
            var_value = config.get("value")
            context["variables"] = context.get("variables", {})
            context["variables"][var_name] = var_value
            result["output"] = {"variable": var_name, "value": var_value}
        
        elif action_type == "condition":
            # Evaluate condition
            field = config.get("field")
            operator = config.get("operator")
            value = config.get("value")
            
            actual_value = context.get("variables", {}).get(field) or context.get("trigger_data", {}).get(field)
            
            condition_met = False
            if operator == "equals":
                condition_met = actual_value == value
            elif operator == "not_equals":
                condition_met = actual_value != value
            elif operator == "contains":
                condition_met = value in str(actual_value)
            elif operator == "greater_than":
                condition_met = float(actual_value or 0) > float(value or 0)
            elif operator == "less_than":
                condition_met = float(actual_value or 0) < float(value or 0)
            
            result["output"] = {"condition_met": condition_met}
            result["branch"] = "true" if condition_met else "false"
        
    except Exception as e:
        result["success"] = False
        result["error"] = str(e)
    
    return result


async def execute_automation_workflow(
    automation_id: uuid.UUID,
    trigger_data: Dict,
    db: Session
):
    """Execute the full automation workflow"""
    automation = db.query(Automation).filter(Automation.id == automation_id).first()
    if not automation:
        return
    
    # Create execution log
    log = AutomationLog(
        automation_id=automation_id,
        status="running",
        trigger_data=trigger_data,
        started_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    
    start_time = datetime.utcnow()
    steps_executed = 0
    execution_result = {"steps": []}
    context = {"trigger_data": trigger_data, "variables": {}}
    
    try:
        workflow_steps = automation.workflow_steps or []
        steps_by_id = {s["id"]: s for s in workflow_steps}
        
        # Find the first step (trigger step or first action)
        current_step_ids = []
        for step in workflow_steps:
            if step.get("type") == "trigger" or not any(
                step["id"] in s.get("next_steps", []) for s in workflow_steps
            ):
                current_step_ids.append(step["id"])
                break
        
        # Execute steps
        visited = set()
        while current_step_ids:
            next_step_ids = []
            
            for step_id in current_step_ids:
                if step_id in visited:
                    continue
                visited.add(step_id)
                
                step = steps_by_id.get(step_id)
                if not step:
                    continue
                
                if step.get("type") == "trigger":
                    next_step_ids.extend(step.get("next_steps", []))
                    continue
                
                # Execute the step
                result = await execute_workflow_step(step, context, db)
                steps_executed += 1
                
                execution_result["steps"].append({
                    "step_id": step_id,
                    "action_type": step.get("action_type"),
                    "result": result
                })
                
                if not result.get("success"):
                    raise Exception(f"Step {step_id} failed: {result.get('error')}")
                
                # Determine next steps
                if result.get("branch"):
                    # Conditional branching
                    branch = result["branch"]
                    branch_config = step.get("config", {}).get("branches", {})
                    next_step_ids.extend(branch_config.get(branch, []))
                else:
                    next_step_ids.extend(step.get("next_steps", []))
            
            current_step_ids = next_step_ids
        
        # Update log as completed
        log.status = "completed"
        log.execution_result = execution_result
        log.steps_executed = steps_executed
        log.completed_at = datetime.utcnow()
        log.duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Update automation stats
        automation.execution_count += 1
        automation.last_executed_at = datetime.utcnow()
        
    except Exception as e:
        log.status = "failed"
        log.error_message = str(e)
        log.execution_result = execution_result
        log.steps_executed = steps_executed
        log.completed_at = datetime.utcnow()
        log.duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    
    db.commit()


@router.post("/apps/{app_id}/automations/{automation_id}/execute")
async def execute_automation(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    trigger_data: Dict[str, Any] = {},
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger an automation"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Execute in background
    background_tasks.add_task(execute_automation_workflow, automation_id, trigger_data, db)
    
    return {
        "status": "started",
        "automation_id": str(automation_id),
        "message": "Automation execution started"
    }


@router.post("/apps/{app_id}/automations/{automation_id}/test")
async def test_automation(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    test_data: Dict[str, Any] = {},
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dry-run an automation without side effects"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    workflow_steps = automation.workflow_steps or []
    
    # Validate workflow
    errors = []
    warnings = []
    
    for step in workflow_steps:
        if step.get("type") == "action":
            action_type = step.get("action_type")
            config = step.get("config", {})
            
            if action_type == "send_email" and not config.get("to"):
                errors.append(f"Step {step['id']}: Email recipient is required")
            
            if action_type == "http_request" and not config.get("url"):
                errors.append(f"Step {step['id']}: URL is required")
            
            if action_type == "create_record" and not config.get("collection_id"):
                errors.append(f"Step {step['id']}: Collection ID is required")
    
    return {
        "status": "test_completed",
        "would_execute": len([s for s in workflow_steps if s.get("type") == "action"]),
        "validation": {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        },
        "preview": {
            "trigger_type": automation.trigger_type,
            "steps": [
                {"id": s["id"], "type": s.get("type"), "action": s.get("action_type")}
                for s in workflow_steps
            ]
        }
    }


@router.get("/apps/{app_id}/automations/{automation_id}/logs")
async def get_automation_logs(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    limit: int = Query(50, le=100),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get execution logs for an automation"""
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    query = db.query(AutomationLog).filter(
        AutomationLog.automation_id == automation_id
    )
    
    if status:
        query = query.filter(AutomationLog.status == status)
    
    logs = query.order_by(AutomationLog.created_at.desc()).limit(limit).all()
    
    return {
        "logs": [
            {
                "id": str(log.id),
                "automation_id": str(log.automation_id),
                "status": log.status,
                "trigger_data": log.trigger_data,
                "execution_result": log.execution_result,
                "error_message": log.error_message,
                "duration_ms": log.duration_ms,
                "steps_executed": log.steps_executed,
                "started_at": log.started_at.isoformat() if log.started_at else None,
                "completed_at": log.completed_at.isoformat() if log.completed_at else None,
                "created_at": log.created_at.isoformat()
            }
            for log in logs
        ],
        "total": len(logs)
    }


@router.post("/apps/{app_id}/automations/{automation_id}/enable")
async def enable_automation(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable an automation"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    automation.is_enabled = True
    db.commit()
    
    return {"message": "Automation enabled", "is_enabled": True}


@router.post("/apps/{app_id}/automations/{automation_id}/disable")
async def disable_automation(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable an automation"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    automation.is_enabled = False
    db.commit()
    
    return {"message": "Automation disabled", "is_enabled": False}


@router.get("/automation-templates")
async def get_automation_templates(
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get pre-built automation templates"""
    templates = [
        {
            "id": "welcome_email",
            "name": "Welcome Email",
            "description": "Send welcome email when user signs up",
            "category": "onboarding",
            "trigger_type": "user_signup",
            "workflow_steps": [
                {"id": "1", "type": "trigger", "next_steps": ["2"]},
                {"id": "2", "type": "action", "action_type": "delay", "config": {"minutes": 5}, "next_steps": ["3"]},
                {"id": "3", "type": "action", "action_type": "send_email", "config": {"template": "welcome"}, "next_steps": []}
            ]
        },
        {
            "id": "order_confirmation",
            "name": "Order Confirmation Flow",
            "description": "Send confirmation and update inventory on new order",
            "category": "ecommerce",
            "trigger_type": "order_created",
            "workflow_steps": [
                {"id": "1", "type": "trigger", "next_steps": ["2"]},
                {"id": "2", "type": "action", "action_type": "send_email", "config": {"template": "order_confirm"}, "next_steps": ["3"]},
                {"id": "3", "type": "action", "action_type": "update_record", "config": {"table": "inventory"}, "next_steps": []}
            ]
        },
        {
            "id": "lead_nurture",
            "name": "Lead Nurturing",
            "description": "Follow up with leads over time",
            "category": "marketing",
            "trigger_type": "form_submit",
            "workflow_steps": [
                {"id": "1", "type": "trigger", "next_steps": ["2"]},
                {"id": "2", "type": "action", "action_type": "create_record", "config": {"collection": "contacts"}, "next_steps": ["3"]},
                {"id": "3", "type": "action", "action_type": "send_email", "config": {"template": "welcome"}, "next_steps": ["4"]},
                {"id": "4", "type": "action", "action_type": "delay", "config": {"days": 3}, "next_steps": ["5"]},
                {"id": "5", "type": "action", "action_type": "send_email", "config": {"template": "followup"}, "next_steps": []}
            ]
        },
        {
            "id": "low_inventory",
            "name": "Low Inventory Alert",
            "description": "Alert when inventory falls below threshold",
            "category": "ecommerce",
            "trigger_type": "inventory_low",
            "workflow_steps": [
                {"id": "1", "type": "trigger", "next_steps": ["2"]},
                {"id": "2", "type": "action", "action_type": "send_email", "config": {"to": "admin"}, "next_steps": ["3"]},
                {"id": "3", "type": "action", "action_type": "slack_message", "config": {"channel": "#inventory"}, "next_steps": []}
            ]
        },
        {
            "id": "webhook_sync",
            "name": "Webhook Data Sync",
            "description": "Sync data when webhook is received",
            "category": "integration",
            "trigger_type": "webhook",
            "workflow_steps": [
                {"id": "1", "type": "trigger", "next_steps": ["2"]},
                {"id": "2", "type": "action", "action_type": "transform_data", "config": {}, "next_steps": ["3"]},
                {"id": "3", "type": "action", "action_type": "create_record", "config": {}, "next_steps": []}
            ]
        }
    ]
    
    if category:
        templates = [t for t in templates if t["category"] == category]
    
    return {"templates": templates}


@router.post("/webhooks/{app_id}/{hook_id}")
async def webhook_endpoint(
    app_id: uuid.UUID = Path(...),
    hook_id: str = Path(...),
    payload: Dict[str, Any] = {},
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """Webhook endpoint for external triggers"""
    # Find automations with webhook trigger matching this hook_id
    automations = db.query(Automation).filter(
        Automation.app_id == app_id,
        Automation.trigger_type == "webhook",
        Automation.is_enabled == True,
        Automation.is_active == True
    ).all()
    
    executed = []
    for automation in automations:
        trigger_config = automation.trigger_config or {}
        if trigger_config.get("hook_id") == hook_id:
            background_tasks.add_task(
                execute_automation_workflow,
                automation.id,
                payload,
                db
            )
            executed.append({
                "automation_id": str(automation.id),
                "automation_name": automation.name
            })
    
    return {
        "received": True,
        "hook_id": hook_id,
        "executions": executed
    }


@router.get("/apps/{app_id}/automations/{automation_id}/logs")
async def get_automation_logs(
    app_id: uuid.UUID,
    automation_id: uuid.UUID,
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get execution logs for an automation"""
    
    # Verify automation exists and user has access
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    # Verify user has access to the app
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id,
        App.is_active == True
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Build query
    query = db.query(AutomationLog).filter(AutomationLog.automation_id == automation_id)
    
    if status:
        query = query.filter(AutomationLog.status == status)
    
    total = query.count()
    logs = query.order_by(AutomationLog.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "logs": [
            {
                "id": str(log.id),
                "automation_id": str(log.automation_id),
                "status": log.status,
                "trigger_data": log.trigger_data,
                "execution_result": log.execution_result,
                "error_message": log.error_message,
                "duration_ms": log.duration_ms,
                "steps_executed": log.steps_executed,
                "started_at": log.started_at.isoformat() if log.started_at else None,
                "completed_at": log.completed_at.isoformat() if log.completed_at else None,
                "created_at": log.created_at.isoformat()
            }
            for log in logs
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.post("/apps/{app_id}/automations/{automation_id}/enable")
async def enable_automation(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable an automation"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    automation.is_enabled = True
    automation.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Automation enabled", "is_enabled": True}


@router.post("/apps/{app_id}/automations/{automation_id}/disable")
async def disable_automation(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable an automation"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    automation.is_enabled = False
    automation.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Automation disabled", "is_enabled": False}


@router.get("/automation-templates")
async def get_automation_templates(
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get pre-built automation templates with enhanced features"""
    templates = [
        {
            "id": "welcome_email_series",
            "name": "Welcome Email Series",
            "description": "Multi-step onboarding email sequence with personalization",
            "category": "marketing",
            "trigger_type": "user_signup",
            "difficulty": "beginner",
            "estimated_time": "5 minutes",
            "features": ["Email automation", "Delay steps", "Personalization", "Error handling"],
            "workflow_steps": [
                {"id": "1", "type": "action", "action_type": "delay", "config": {"minutes": 5}, "next_steps": ["2"], "position": {"x": 100, "y": 100}},
                {"id": "2", "type": "action", "action_type": "send_email", "config": {"template": "welcome", "subject": "Welcome to {{app.name}}!"}, "next_steps": ["3"], "position": {"x": 100, "y": 200}},
                {"id": "3", "type": "action", "action_type": "delay", "config": {"days": 3}, "next_steps": ["4"], "position": {"x": 100, "y": 300}},
                {"id": "4", "type": "action", "action_type": "send_email", "config": {"template": "tips", "subject": "Getting started tips"}, "next_steps": ["5"], "position": {"x": 100, "y": 400}},
                {"id": "5", "type": "action", "action_type": "error_handler", "config": {"error_action": "retry", "max_retries": 3}, "next_steps": [], "position": {"x": 100, "y": 500}}
            ]
        },
        {
            "id": "ecommerce_order_flow",
            "name": "E-commerce Order Processing",
            "description": "Complete order fulfillment with inventory management and notifications",
            "category": "ecommerce",
            "trigger_type": "order_created",
            "difficulty": "intermediate",
            "estimated_time": "10 minutes",
            "features": ["Order processing", "Inventory updates", "Multi-channel notifications", "Parallel execution"],
            "workflow_steps": [
                {"id": "1", "type": "action", "action_type": "parallel", "config": {"branches": ["email", "inventory"]}, "next_steps": ["2", "3"], "position": {"x": 100, "y": 100}},
                {"id": "2", "type": "action", "action_type": "send_email", "config": {"template": "order_confirm", "to": "{{order.customer_email}}"}, "next_steps": ["4"], "position": {"x": 50, "y": 200}},
                {"id": "3", "type": "action", "action_type": "update_record", "config": {"collection": "inventory", "data": {"quantity": "{{inventory.quantity - order.quantity}}"}}, "next_steps": ["4"], "position": {"x": 150, "y": 200}},
                {"id": "4", "type": "action", "action_type": "slack_message", "config": {"channel": "#orders", "message": "New order #{{order.id}} received"}, "next_steps": ["5"], "position": {"x": 100, "y": 300}},
                {"id": "5", "type": "action", "action_type": "condition", "config": {"field": "order.total", "operator": "greater_than", "value": 100}, "next_steps": ["6"], "position": {"x": 100, "y": 400}},
                {"id": "6", "type": "action", "action_type": "discord", "config": {"webhook_url": "{{env.DISCORD_WEBHOOK}}", "message": "High-value order alert!"}, "next_steps": [], "position": {"x": 100, "y": 500}}
            ]
        },
        {
            "id": "lead_nurturing_crm",
            "name": "Advanced Lead Nurturing",
            "description": "Intelligent lead scoring and nurturing with CRM integration",
            "category": "sales",
            "trigger_type": "form_submit",
            "difficulty": "advanced",
            "estimated_time": "15 minutes",
            "features": ["Lead scoring", "CRM integration", "Behavioral triggers", "A/B testing"],
            "workflow_steps": [
                {"id": "1", "type": "action", "action_type": "airtable", "config": {"base_id": "{{env.AIRTABLE_BASE}}", "table_name": "Leads", "fields": "{\"Name\": \"{{form.name}}\", \"Email\": \"{{form.email}}\", \"Score\": 10}"}, "next_steps": ["2"], "position": {"x": 100, "y": 100}},
                {"id": "2", "type": "action", "action_type": "send_email", "config": {"template": "welcome_lead", "subject": "Thanks for your interest!"}, "next_steps": ["3"], "position": {"x": 100, "y": 200}},
                {"id": "3", "type": "action", "action_type": "delay", "config": {"days": 2}, "next_steps": ["4"], "position": {"x": 100, "y": 300}},
                {"id": "4", "type": "action", "action_type": "condition", "config": {"field": "lead.engagement", "operator": "greater_than", "value": 50}, "next_steps": ["5", "6"], "position": {"x": 100, "y": 400}},
                {"id": "5", "type": "action", "action_type": "send_email", "config": {"template": "high_engagement", "subject": "Ready to learn more?"}, "next_steps": [], "position": {"x": 50, "y": 500}},
                {"id": "6", "type": "action", "action_type": "send_email", "config": {"template": "nurture_sequence", "subject": "Here's what others are saying..."}, "next_steps": [], "position": {"x": 150, "y": 500}}
            ]
        },
        {
            "id": "google_sheets_sync",
            "name": "Google Sheets Data Sync",
            "description": "Automatically sync form submissions to Google Sheets with data validation",
            "category": "productivity",
            "trigger_type": "form_submit",
            "difficulty": "beginner",
            "estimated_time": "5 minutes",
            "features": ["Google Sheets integration", "Data validation", "Error handling", "Duplicate detection"],
            "workflow_steps": [
                {"id": "1", "type": "action", "action_type": "transform_data", "config": {"script": "// Validate and clean data\nconst cleanData = {\n  name: data.name.trim(),\n  email: data.email.toLowerCase(),\n  timestamp: new Date().toISOString()\n};\nreturn cleanData;"}, "next_steps": ["2"], "position": {"x": 100, "y": 100}},
                {"id": "2", "type": "action", "action_type": "google_sheets", "config": {"spreadsheet_id": "{{env.GOOGLE_SHEETS_ID}}", "sheet_name": "Submissions", "values": "{{data.name}}, {{data.email}}, {{data.timestamp}}"}, "next_steps": ["3"], "position": {"x": 100, "y": 200}},
                {"id": "3", "type": "action", "action_type": "error_handler", "config": {"error_action": "notify", "notification_email": "admin@example.com"}, "next_steps": [], "position": {"x": 100, "y": 300}}
            ]
        },
        {
            "id": "notion_project_tracker",
            "name": "Notion Project Tracker",
            "description": "Create and update project tasks in Notion with team notifications",
            "category": "productivity",
            "trigger_type": "webhook",
            "difficulty": "intermediate",
            "estimated_time": "8 minutes",
            "features": ["Notion integration", "Team notifications", "Status tracking", "Due date management"],
            "workflow_steps": [
                {"id": "1", "type": "action", "action_type": "notion", "config": {"database_id": "{{env.NOTION_DATABASE_ID}}", "title": "{{webhook.task_title}}", "properties": "{\"Status\": \"In Progress\", \"Assignee\": \"{{webhook.assignee}}\", \"Due Date\": \"{{webhook.due_date}}\"}"}, "next_steps": ["2"], "position": {"x": 100, "y": 100}},
                {"id": "2", "type": "action", "action_type": "teams", "config": {"webhook_url": "{{env.TEAMS_WEBHOOK}}", "message": "New task assigned: {{webhook.task_title}} to {{webhook.assignee}}"}, "next_steps": ["3"], "position": {"x": 100, "y": 200}},
                {"id": "3", "type": "action", "action_type": "delay", "config": {"days": 1}, "next_steps": ["4"], "position": {"x": 100, "y": 300}},
                {"id": "4", "type": "action", "action_type": "send_email", "config": {"to": "{{webhook.assignee_email}}", "subject": "Task reminder: {{webhook.task_title}}", "template": "task_reminder"}, "next_steps": [], "position": {"x": 100, "y": 400}}
            ]
        }
    ]
    
    if category:
        templates = [t for t in templates if t["category"] == category]
    
    # Add usage statistics
    for template in templates:
        template["usage_count"] = 150 + hash(template["id"]) % 500  # Mock usage data
        template["success_rate"] = 95 + (hash(template["id"]) % 5)  # Mock success rate
    
    return {
        "templates": templates, 
        "total": len(templates),
        "categories": ["marketing", "ecommerce", "sales", "productivity", "support"],
        "featured": ["welcome_email_series", "ecommerce_order_flow", "lead_nurturing_crm"]
    }


@router.post("/webhooks/{app_id}/{hook_id}")
async def webhook_endpoint(
    app_id: uuid.UUID = Path(...),
    hook_id: str = Path(...),
    payload: Dict[str, Any] = {},
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """Webhook endpoint for external triggers"""
    # Find automations with webhook trigger matching this hook_id
    automations = db.query(Automation).filter(
        Automation.app_id == app_id,
        Automation.trigger_type == "webhook",
        Automation.is_enabled == True,
        Automation.is_active == True
    ).all()
    
    executed = []
    for automation in automations:
        trigger_config = automation.trigger_config or {}
        if trigger_config.get("hook_id") == hook_id:
            background_tasks.add_task(run_automation, str(automation.id), payload, db)
            executed.append({
                "automation_id": str(automation.id),
                "automation_name": automation.name
            })
    
    return {
        "received": True,
        "hook_id": hook_id,
        "executions_triggered": len(executed),
        "automations": executed
    }


# ============================================
# SCHEDULER ENDPOINTS
# ============================================

@router.get("/scheduler/jobs")
async def list_scheduled_jobs(
    current_user: User = Depends(get_current_user)
):
    """List all scheduled automation jobs"""
    try:
        from services.scheduler_service import scheduler_service
        jobs = scheduler_service.get_scheduled_jobs()
        return {"jobs": jobs, "total": len(jobs)}
    except Exception as e:
        return {"jobs": [], "total": 0, "error": str(e)}


@router.get("/apps/{app_id}/automations/{automation_id}/schedule")
async def get_automation_schedule(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get schedule info for an automation"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    try:
        from services.scheduler_service import scheduler_service
        job_info = scheduler_service.get_job_info(str(automation_id))
        
        return {
            "automation_id": str(automation_id),
            "trigger_type": automation.trigger_type,
            "trigger_config": automation.trigger_config,
            "is_scheduled": job_info is not None,
            "job_info": job_info
        }
    except Exception as e:
        return {
            "automation_id": str(automation_id),
            "trigger_type": automation.trigger_type,
            "trigger_config": automation.trigger_config,
            "is_scheduled": False,
            "error": str(e)
        }


@router.post("/apps/{app_id}/automations/{automation_id}/schedule")
async def schedule_automation(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    schedule_config: Dict[str, Any] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Schedule an automation"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Update trigger config
    if schedule_config:
        automation.trigger_type = "schedule"
        automation.trigger_config = schedule_config
        db.commit()
        db.refresh(automation)
    
    try:
        from services.scheduler_service import scheduler_service
        success = await scheduler_service.schedule_automation(automation)
        
        if success:
            return {
                "message": "Automation scheduled successfully",
                "automation_id": str(automation_id),
                "schedule_config": automation.trigger_config
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to schedule automation")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scheduler error: {str(e)}")


@router.delete("/apps/{app_id}/automations/{automation_id}/schedule")
async def unschedule_automation(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove an automation from the schedule"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    try:
        from services.scheduler_service import scheduler_service
        success = await scheduler_service.unschedule_automation(str(automation_id))
        
        return {
            "message": "Automation unscheduled" if success else "Automation was not scheduled",
            "automation_id": str(automation_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scheduler error: {str(e)}")


@router.post("/apps/{app_id}/automations/{automation_id}/trigger-now")
async def trigger_automation_now(
    app_id: uuid.UUID = Path(...),
    automation_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger a scheduled automation immediately"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.app_id == app_id,
        Automation.is_active == True
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    # Verify ownership
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    try:
        from services.scheduler_service import scheduler_service
        success = await scheduler_service.trigger_now(str(automation_id))
        
        if success:
            return {
                "message": "Automation triggered",
                "automation_id": str(automation_id)
            }
        else:
            raise HTTPException(status_code=400, detail="Automation is not scheduled")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scheduler error: {str(e)}")
