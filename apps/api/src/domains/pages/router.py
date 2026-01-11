"""Pages domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.apps.models import App
from src.domains.auth.schemas import UserResponse
from .service import PagesService
from .schemas import PageCreate, PageUpdate

router = APIRouter(prefix="/apps/{app_id}/pages")


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session) -> App:
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.get("")
async def list_pages(
    app_id: uuid.UUID = Path(...),
    is_published: Optional[bool] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all pages for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = PagesService(db)
    return await service.list_pages(str(app_id), is_published)


@router.post("")
async def create_page(
    app_id: uuid.UUID = Path(...),
    page_data: PageCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new page"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = PagesService(db)
    try:
        return await service.create_page(str(app_id), page_data.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{page_id}")
async def get_page(
    app_id: uuid.UUID = Path(...),
    page_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get page details"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = PagesService(db)
    page = await service.get_page(str(app_id), str(page_id))
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.put("/{page_id}")
async def update_page(
    app_id: uuid.UUID = Path(...),
    page_id: uuid.UUID = Path(...),
    updates: PageUpdate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a page"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = PagesService(db)
    try:
        page = await service.update_page(str(app_id), str(page_id), updates.dict(exclude_unset=True))
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        return page
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{page_id}")
async def delete_page(
    app_id: uuid.UUID = Path(...),
    page_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a page"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = PagesService(db)
    try:
        if not await service.delete_page(str(app_id), str(page_id)):
            raise HTTPException(status_code=404, detail="Page not found")
        return {"message": "Page deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{page_id}/duplicate")
async def duplicate_page(
    app_id: uuid.UUID = Path(...),
    page_id: uuid.UUID = Path(...),
    new_title: str = Query(...),
    new_slug: str = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Duplicate a page"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = PagesService(db)
    try:
        page = await service.duplicate_page(str(app_id), str(page_id), new_title, new_slug)
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        return page
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{page_id}/content")
async def update_page_content(
    app_id: uuid.UUID = Path(...),
    page_id: uuid.UUID = Path(...),
    content: Dict[str, Any] = {},
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update only page content (for editor auto-save)"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = PagesService(db)
    result = await service.update_content(str(app_id), str(page_id), content)
    if not result:
        raise HTTPException(status_code=404, detail="Page not found")
    return result


@router.post("/reorder")
async def reorder_pages(
    app_id: uuid.UUID = Path(...),
    page_order: List[str] = [],
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder pages"""
    await get_app_or_404(app_id, str(current_user.id), db)
    return {"message": "Pages reordered", "order": page_order}
