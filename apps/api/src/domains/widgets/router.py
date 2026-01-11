"""
Widgets domain router
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.models import User
from .service import WidgetService
from .schemas import WidgetResponse, WidgetCategoryResponse

router = APIRouter(prefix="/widgets", tags=["Widgets"])


@router.get("", response_model=List[WidgetResponse])
async def list_widgets(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_premium: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """List all available widgets"""
    service = WidgetService(db)
    widgets = service.get_all_widgets(category=category, search=search, is_premium=is_premium)
    return widgets


@router.get("/categories", response_model=List[WidgetCategoryResponse])
async def list_categories(db: Session = Depends(get_db)):
    """List widget categories"""
    service = WidgetService(db)
    return service.get_categories()


@router.get("/{widget_slug}", response_model=WidgetResponse)
async def get_widget(
    widget_slug: str,
    db: Session = Depends(get_db)
):
    """Get widget by slug"""
    service = WidgetService(db)
    widget = service.get_by_slug(widget_slug)
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    return widget


@router.get("/{widget_slug}/config")
async def get_widget_config(
    widget_slug: str,
    db: Session = Depends(get_db)
):
    """Get widget configuration schema"""
    service = WidgetService(db)
    config = service.get_widget_config(widget_slug)
    if not config:
        raise HTTPException(status_code=404, detail="Widget not found")
    return config
