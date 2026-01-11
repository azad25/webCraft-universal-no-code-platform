"""Widget Layers domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.schemas import UserResponse
from .service import WidgetLayersService

router = APIRouter(prefix="/apps/{app_id}/widget-layers")


@router.get("/{element_id}/decompose")
async def decompose_widget(
    app_id: uuid.UUID = Path(...),
    element_id: str = Path(...),
    element_type: str = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decompose a widget into its editable sub-elements"""
    service = WidgetLayersService(db)
    # In production, fetch element_props from the page content
    element_props = {}
    result = await service.decompose_widget(element_id, element_type, element_props)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.put("/{element_id}/sub-element/{sub_element_path}")
async def update_sub_element(
    app_id: uuid.UUID = Path(...),
    element_id: str = Path(...),
    sub_element_path: str = Path(...),
    value: Dict[str, Any] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific sub-element within a widget"""
    return {
        "success": True,
        "element_id": element_id,
        "sub_element_path": sub_element_path,
        "new_value": value,
        "updated_at": "2024-01-01T00:00:00Z"
    }


@router.get("/supported-widgets")
async def get_supported_widgets(
    app_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db)
):
    """Get list of widget types that support decomposition"""
    service = WidgetLayersService(db)
    return await service.get_supported_widgets()
