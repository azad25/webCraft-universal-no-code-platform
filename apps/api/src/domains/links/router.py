"""Link management router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.schemas import UserResponse
from .service import LinkService
from .schemas import (
    LinkCreate, LinkUpdate, LinkResponse,
    LinkGroupCreate, LinkGroupUpdate, LinkGroupResponse,
    LinkRedirectCreate, LinkRedirectUpdate, LinkRedirectResponse,
    LinkStatsResponse, BulkLinkOperation, BulkValidationResponse
)

router = APIRouter()


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session):
    """Helper to verify app ownership"""
    from src.domains.apps.models import App
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


# Link CRUD endpoints
@router.get("/apps/{app_id}/links")
async def list_links(
    app_id: uuid.UUID = Path(...),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    page_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    link_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all links for an app with filtering and pagination"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    return await service.list_links(
        str(app_id), str(current_user.id),
        page_id=str(page_id) if page_id else None,
        category=category,
        link_type=link_type,
        is_active=is_active,
        search=search,
        page=page,
        per_page=per_page
    )


@router.post("/apps/{app_id}/links", response_model=LinkResponse)
async def create_link(
    app_id: uuid.UUID = Path(...),
    link_data: LinkCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new link"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    try:
        return await service.create_link(str(app_id), str(current_user.id), link_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/{app_id}/links/{link_id}", response_model=LinkResponse)
async def get_link(
    app_id: uuid.UUID = Path(...),
    link_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific link"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    link = await service.get_link(str(app_id), str(link_id), str(current_user.id))
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    return link


@router.put("/apps/{app_id}/links/{link_id}", response_model=LinkResponse)
async def update_link(
    app_id: uuid.UUID = Path(...),
    link_id: uuid.UUID = Path(...),
    updates: LinkUpdate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a link"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    link = await service.update_link(str(app_id), str(link_id), str(current_user.id), updates)
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    return link


@router.delete("/apps/{app_id}/links/{link_id}")
async def delete_link(
    app_id: uuid.UUID = Path(...),
    link_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a link"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    success = await service.delete_link(str(app_id), str(link_id), str(current_user.id))
    
    if not success:
        raise HTTPException(status_code=404, detail="Link not found")
    
    return {"message": "Link deleted successfully"}


# Link validation endpoints
@router.post("/apps/{app_id}/links/{link_id}/validate")
async def validate_link(
    app_id: uuid.UUID = Path(...),
    link_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate a single link"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    try:
        return await service.validate_link(str(link_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/apps/{app_id}/links/validate-all", response_model=BulkValidationResponse)
async def validate_all_links(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate all links in an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    return await service.validate_all_links(str(app_id), str(current_user.id))


# Bulk operations
@router.post("/apps/{app_id}/links/bulk")
async def bulk_link_operations(
    app_id: uuid.UUID = Path(...),
    operation: BulkLinkOperation = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Perform bulk operations on links"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    
    if operation.operation == "validate":
        results = []
        for link_id in operation.link_ids:
            try:
                result = await service.validate_link(str(link_id))
                results.append(result)
            except ValueError:
                continue
        
        return {"message": f"Validated {len(results)} links", "results": results}
    
    # Handle other bulk operations
    return {"message": f"Bulk {operation.operation} completed", "affected": len(operation.link_ids)}


# Link groups endpoints
@router.get("/apps/{app_id}/link-groups", response_model=List[LinkGroupResponse])
async def list_link_groups(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all link groups for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    return await service.list_link_groups(str(app_id), str(current_user.id))


@router.post("/apps/{app_id}/link-groups", response_model=LinkGroupResponse)
async def create_link_group(
    app_id: uuid.UUID = Path(...),
    group_data: LinkGroupCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new link group"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    try:
        return await service.create_link_group(str(app_id), str(current_user.id), group_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/{app_id}/link-groups/{group_id}", response_model=LinkGroupResponse)
async def get_link_group(
    app_id: uuid.UUID = Path(...),
    group_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific link group"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    group = await service.get_link_group(str(app_id), str(group_id), str(current_user.id))
    
    if not group:
        raise HTTPException(status_code=404, detail="Link group not found")
    
    return group


@router.post("/apps/{app_id}/link-groups/{group_id}/links/{link_id}")
async def add_link_to_group(
    app_id: uuid.UUID = Path(...),
    group_id: uuid.UUID = Path(...),
    link_id: uuid.UUID = Path(...),
    sort_order: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a link to a group"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    success = await service.add_link_to_group(
        str(group_id), str(link_id), str(current_user.id), sort_order
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add link to group")
    
    return {"message": "Link added to group successfully"}


# Link analytics endpoints
@router.get("/apps/{app_id}/links/stats", response_model=LinkStatsResponse)
async def get_link_stats(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get link statistics for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    return await service.get_link_stats(str(app_id), str(current_user.id))


@router.post("/apps/{app_id}/links/{link_id}/click")
async def track_link_click(
    app_id: uuid.UUID = Path(...),
    link_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db)
):
    """Track a link click (public endpoint for analytics)"""
    service = LinkService(db)
    success = await service.track_link_click(str(link_id))
    
    if not success:
        raise HTTPException(status_code=404, detail="Link not found")
    
    return {"message": "Click tracked"}


# Link redirects endpoints
@router.get("/apps/{app_id}/redirects", response_model=List[LinkRedirectResponse])
async def list_redirects(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all redirects for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    return await service.list_redirects(str(app_id), str(current_user.id))


@router.post("/apps/{app_id}/redirects", response_model=LinkRedirectResponse)
async def create_redirect(
    app_id: uuid.UUID = Path(...),
    redirect_data: LinkRedirectCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new redirect"""
    await get_app_or_404(app_id, str(current_user.id), db)
    
    service = LinkService(db)
    try:
        return await service.create_redirect(str(app_id), str(current_user.id), redirect_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))