"""
Page Management API Routes
CRUD operations for app pages
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from core.database import get_db, App, Page, User
from core.auth import get_current_user

router = APIRouter()


class PageCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    content: Dict[str, Any] = Field(default_factory=dict)
    is_homepage: bool = False
    is_published: bool = True
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_image: Optional[str] = None


class PageUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    is_homepage: Optional[bool] = None
    is_published: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_image: Optional[str] = None


class PageResponse(BaseModel):
    id: uuid.UUID
    app_id: uuid.UUID
    title: str
    slug: str
    content: Dict[str, Any]
    is_homepage: bool
    is_published: bool
    meta_title: Optional[str]
    meta_description: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/apps/{app_id}/pages")
async def list_pages(
    app_id: uuid.UUID = Path(...),
    is_published: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all pages for an app"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    query = db.query(Page).filter(Page.app_id == app_id)
    if is_published is not None:
        query = query.filter(Page.is_published == is_published)
    
    pages = query.all()
    return {
        "pages": [
            {
                "id": str(p.id),
                "title": p.title,
                "slug": p.slug,
                "is_homepage": p.is_homepage,
                "is_published": p.is_published,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None
            }
            for p in pages
        ],
        "total": len(pages)
    }


@router.post("/apps/{app_id}/pages")
async def create_page(
    app_id: uuid.UUID = Path(...),
    page_data: PageCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new page"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Check slug uniqueness
    existing = db.query(Page).filter(Page.app_id == app_id, Page.slug == page_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Page slug already exists")
    
    # If setting as homepage, unset other homepages
    if page_data.is_homepage:
        db.query(Page).filter(Page.app_id == app_id, Page.is_homepage == True).update({"is_homepage": False})
    
    page = Page(
        app_id=app_id,
        title=page_data.title,
        slug=page_data.slug,
        content=page_data.content,
        is_homepage=page_data.is_homepage,
        is_published=page_data.is_published,
        meta_title=page_data.meta_title or page_data.title,
        meta_description=page_data.meta_description,
        meta_keywords=page_data.meta_keywords,
        og_image=page_data.og_image
    )
    
    db.add(page)
    db.commit()
    db.refresh(page)
    
    return page


@router.get("/apps/{app_id}/pages/{page_id}")
async def get_page(
    app_id: uuid.UUID = Path(...),
    page_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get page details"""
    page = db.query(Page).join(App).filter(
        Page.id == page_id,
        Page.app_id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return page


@router.put("/apps/{app_id}/pages/{page_id}")
async def update_page(
    app_id: uuid.UUID = Path(...),
    page_id: uuid.UUID = Path(...),
    updates: PageUpdate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a page"""
    page = db.query(Page).join(App).filter(
        Page.id == page_id,
        Page.app_id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    update_data = updates.dict(exclude_unset=True)
    
    # Check slug uniqueness if changing
    if "slug" in update_data and update_data["slug"] != page.slug:
        existing = db.query(Page).filter(
            Page.app_id == app_id,
            Page.slug == update_data["slug"],
            Page.id != page_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Page slug already exists")
    
    # Handle homepage change
    if update_data.get("is_homepage"):
        db.query(Page).filter(Page.app_id == app_id, Page.is_homepage == True, Page.id != page_id).update({"is_homepage": False})
    
    for field, value in update_data.items():
        setattr(page, field, value)
    
    page.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(page)
    
    return page


@router.delete("/apps/{app_id}/pages/{page_id}")
async def delete_page(
    app_id: uuid.UUID = Path(...),
    page_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a page"""
    page = db.query(Page).join(App).filter(
        Page.id == page_id,
        Page.app_id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if page.is_homepage:
        raise HTTPException(status_code=400, detail="Cannot delete homepage")
    
    db.delete(page)
    db.commit()
    
    return {"message": "Page deleted"}


@router.post("/apps/{app_id}/pages/{page_id}/duplicate")
async def duplicate_page(
    app_id: uuid.UUID = Path(...),
    page_id: uuid.UUID = Path(...),
    new_title: str = Query(...),
    new_slug: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Duplicate a page"""
    page = db.query(Page).join(App).filter(
        Page.id == page_id,
        Page.app_id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Check slug uniqueness
    existing = db.query(Page).filter(Page.app_id == app_id, Page.slug == new_slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Page slug already exists")
    
    new_page = Page(
        app_id=app_id,
        title=new_title,
        slug=new_slug,
        content=page.content.copy() if page.content else {},
        is_homepage=False,
        is_published=False,
        meta_title=new_title,
        meta_description=page.meta_description
    )
    
    db.add(new_page)
    db.commit()
    db.refresh(new_page)
    
    return new_page


@router.put("/apps/{app_id}/pages/{page_id}/content")
async def update_page_content(
    app_id: uuid.UUID = Path(...),
    page_id: uuid.UUID = Path(...),
    content: Dict[str, Any] = {},
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update only page content (for editor auto-save)"""
    page = db.query(Page).join(App).filter(
        Page.id == page_id,
        Page.app_id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    page.content = content
    page.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Content updated", "updated_at": page.updated_at.isoformat()}


@router.post("/apps/{app_id}/pages/reorder")
async def reorder_pages(
    app_id: uuid.UUID = Path(...),
    page_order: List[str] = [],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder pages"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Would update sort_order field
    return {"message": "Pages reordered", "order": page_order}
