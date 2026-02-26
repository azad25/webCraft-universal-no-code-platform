"""Pages domain service"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

# Import Page from V2 database models
from .models import Page
from src.domains.apps.models import App


class PagesService:
    def __init__(self, db: Session):
        self.db = db
    
    async def list_pages(
        self, app_id: str, is_published: Optional[bool] = None
    ) -> Dict[str, Any]:
        query = self.db.query(Page).filter(Page.app_id == uuid.UUID(app_id), Page.is_active == True)
        if is_published is not None:
            query = query.filter(Page.is_published == is_published)
        
        pages = query.all()
        return {
            "pages": [{
                "id": str(p.id),
                "title": p.title,
                "slug": p.slug,
                "is_homepage": p.is_homepage,
                "is_published": p.is_published,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None
            } for p in pages],
            "total": len(pages)
        }
    
    async def create_page(self, app_id: str, page_data: Dict[str, Any]) -> Page:
        # Check slug uniqueness
        existing = self.db.query(Page).filter(
            Page.app_id == uuid.UUID(app_id),
            Page.slug == page_data["slug"]
        ).first()
        if existing:
            raise ValueError("Page slug already exists")
        
        # If setting as homepage, unset other homepages
        if page_data.get("is_homepage"):
            self.db.query(Page).filter(
                Page.app_id == uuid.UUID(app_id),
                Page.is_homepage == True
            ).update({"is_homepage": False})
        
        page = Page(
            app_id=uuid.UUID(app_id),
            title=page_data["title"],
            slug=page_data["slug"],
            content=page_data.get("content", {}),
            is_homepage=page_data.get("is_homepage", False),
            is_published=page_data.get("is_published", True),
            meta_title=page_data.get("meta_title") or page_data["title"],
            meta_description=page_data.get("meta_description"),
            meta_keywords=page_data.get("meta_keywords"),
            og_image=page_data.get("og_image")
        )
        
        self.db.add(page)
        self.db.commit()
        self.db.refresh(page)
        return page
    
    async def get_page(self, app_id: str, page_id: str) -> Optional[Page]:
        return self.db.query(Page).filter(
            Page.id == uuid.UUID(page_id),
            Page.app_id == uuid.UUID(app_id),
            Page.is_active == True
        ).first()
    
    async def update_page(
        self, app_id: str, page_id: str, updates: Dict[str, Any]
    ) -> Optional[Page]:
        page = await self.get_page(app_id, page_id)
        if not page:
            return None
        
        # Check slug uniqueness if changing
        if "slug" in updates and updates["slug"] != page.slug:
            existing = self.db.query(Page).filter(
                Page.app_id == uuid.UUID(app_id),
                Page.slug == updates["slug"],
                Page.id != uuid.UUID(page_id)
            ).first()
            if existing:
                raise ValueError("Page slug already exists")
        
        # Handle homepage change
        if updates.get("is_homepage"):
            self.db.query(Page).filter(
                Page.app_id == uuid.UUID(app_id),
                Page.is_homepage == True,
                Page.id != uuid.UUID(page_id)
            ).update({"is_homepage": False})
        
        for field, value in updates.items():
            if value is not None:
                setattr(page, field, value)
        
        page.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(page)
        return page
    
    async def delete_page(self, app_id: str, page_id: str) -> bool:
        page = await self.get_page(app_id, page_id)
        if not page:
            return False
        if page.is_homepage:
            raise ValueError("Cannot delete homepage")
        
        page.is_active = False
        self.db.commit()
        return True
    
    async def duplicate_page(
        self, app_id: str, page_id: str, new_title: str, new_slug: str
    ) -> Optional[Page]:
        page = await self.get_page(app_id, page_id)
        if not page:
            return None
        
        # Check slug uniqueness
        existing = self.db.query(Page).filter(
            Page.app_id == uuid.UUID(app_id),
            Page.slug == new_slug
        ).first()
        if existing:
            raise ValueError("Page slug already exists")
        
        new_page = Page(
            app_id=uuid.UUID(app_id),
            title=new_title,
            slug=new_slug,
            content=page.content.copy() if page.content else {},
            is_homepage=False,
            is_published=False,
            meta_title=new_title,
            meta_description=page.meta_description
        )
        
        self.db.add(new_page)
        self.db.commit()
        self.db.refresh(new_page)
        return new_page
    
    async def update_content(
        self, app_id: str, page_id: str, content: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        page = await self.get_page(app_id, page_id)
        if not page:
            return None
        
        page.content = content
        page.updated_at = datetime.utcnow()
        self.db.commit()
        
        return {"message": "Content updated", "updated_at": page.updated_at.isoformat()}
