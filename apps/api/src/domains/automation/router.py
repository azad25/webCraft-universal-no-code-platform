"""
Automation domain router
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.models import User
from src.common.exceptions import NotFoundError
from .service import AutomationService
from .schemas import (
    AutomationCreate, AutomationCreateRequest, AutomationUpdate, AutomationResponse,
    AutomationListResponse, AutomationLogResponse, ExecuteRequest
)

router = APIRouter(prefix="/apps/{app_id}/automations", tags=["Automation"])


@router.get("", response_model=AutomationListResponse)
async def list_automations(
    app_id: str,
    is_enabled: Optional[bool] = Query(None),
    trigger_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List automations for an app"""
    service = AutomationService(db)
    automations, total = service.list_automations(
        app_id=app_id,
        is_enabled=is_enabled,
        trigger_type=trigger_type,
        page=page,
        per_page=per_page
    )
    
    return AutomationListResponse(
        items=[AutomationResponse.model_validate(a) for a in automations],
        total=total,
        page=page,
        per_page=per_page
    )


@router.post("", response_model=AutomationResponse)
async def create_automation(
    app_id: str,
    data: AutomationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new automation"""
    service = AutomationService(db)
    automation = service.create_automation(
        app_id=app_id,
        name=data.name,
        trigger_type=data.trigger_type,
        trigger_config=data.trigger_config,
        workflow_steps=data.workflow_steps,
        description=data.description
    )
    return AutomationResponse.model_validate(automation)


@router.get("/{automation_id}", response_model=AutomationResponse)
async def get_automation(
    app_id: str,
    automation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get automation details"""
    service = AutomationService(db)
    automation = service.get(automation_id)
    if not automation or automation.app_id != app_id:
        raise HTTPException(status_code=404, detail="Automation not found")
    return AutomationResponse.model_validate(automation)


@router.put("/{automation_id}", response_model=AutomationResponse)
async def update_automation(
    app_id: str,
    automation_id: str,
    data: AutomationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an automation"""
    try:
        service = AutomationService(db)
        automation = service.update_automation(
            automation_id=automation_id,
            app_id=app_id,
            **data.model_dump(exclude_unset=True)
        )
        return AutomationResponse.model_validate(automation)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Automation not found")


@router.delete("/{automation_id}")
async def delete_automation(
    app_id: str,
    automation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an automation"""
    try:
        service = AutomationService(db)
        service.delete_automation(automation_id, app_id)
        return {"message": "Automation deleted successfully"}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Automation not found")


@router.post("/{automation_id}/toggle")
async def toggle_automation(
    app_id: str,
    automation_id: str,
    enabled: bool = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enable or disable an automation"""
    try:
        service = AutomationService(db)
        automation = service.toggle_automation(automation_id, app_id, enabled)
        return {"message": f"Automation {'enabled' if enabled else 'disabled'}", "is_enabled": automation.is_enabled}
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Automation not found")


@router.post("/{automation_id}/execute", response_model=AutomationLogResponse)
async def execute_automation(
    app_id: str,
    automation_id: str,
    data: ExecuteRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually execute an automation"""
    try:
        service = AutomationService(db)
        trigger_data = data.trigger_data if data else {}
        log = await service.execute_automation(automation_id, app_id, trigger_data)
        return AutomationLogResponse.model_validate(log)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Automation not found or disabled")


@router.get("/{automation_id}/logs")
async def get_automation_logs(
    app_id: str,
    automation_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get execution logs for an automation"""
    service = AutomationService(db)
    logs, total = service.get_automation_logs(automation_id, page, per_page)
    
    return {
        "items": [AutomationLogResponse.model_validate(log) for log in logs],
        "total": total,
        "page": page,
        "per_page": per_page
    }
