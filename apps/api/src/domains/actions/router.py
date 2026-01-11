"""Actions domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.apps.models import App
from src.domains.auth.schemas import UserResponse
from .service import ActionsService
from .schemas import PageActionCreate, ActionCreateRequest, ActionExecution

router = APIRouter(prefix="/actions")


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session) -> App:
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.post("/apps/{app_id}")
async def create_action(
    app_id: uuid.UUID = Path(...),
    action: ActionCreateRequest = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new page action"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = ActionsService(db)
    # Add app_id to the action data since it comes from URL
    action_data = action.dict()
    action_data["app_id"] = str(app_id)
    result = await service.create_action(str(app_id), str(current_user.id), action_data)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/apps/{app_id}")
async def list_actions(
    app_id: uuid.UUID = Path(...),
    page_id: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all actions for an app or page"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = ActionsService(db)
    return await service.list_actions(str(app_id), page_id)


@router.get("/apps/{app_id}/{action_id}")
async def get_action(
    app_id: uuid.UUID = Path(...),
    action_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get action details"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = ActionsService(db)
    action = await service.get_action(str(app_id), action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    return action


@router.put("/apps/{app_id}/{action_id}")
async def update_action(
    app_id: uuid.UUID = Path(...),
    action_id: str = Path(...),
    updates: Dict[str, Any] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an action"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = ActionsService(db)
    result = await service.update_action(str(app_id), action_id, updates)
    if not result:
        raise HTTPException(status_code=404, detail="Action not found")
    return result


@router.delete("/apps/{app_id}/{action_id}")
async def delete_action(
    app_id: uuid.UUID = Path(...),
    action_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an action"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = ActionsService(db)
    if not await service.delete_action(str(app_id), action_id):
        raise HTTPException(status_code=404, detail="Action not found")
    return {"message": "Action deleted successfully"}


@router.post("/apps/{app_id}/{action_id}/execute")
async def execute_action(
    app_id: uuid.UUID = Path(...),
    action_id: str = Path(...),
    execution: ActionExecution = None,
    background_tasks: BackgroundTasks = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute an action"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = ActionsService(db)
    result = await service.execute_action(str(app_id), action_id, execution.dict())
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/templates")
async def get_action_templates(
    category: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pre-built action templates"""
    service = ActionsService(db)
    return await service.get_templates(category)
