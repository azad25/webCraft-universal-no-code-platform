"""
App Builder Service
Core service for creating and managing applications
"""

from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from slugify import slugify

from core.database import App, Page, Template, User


class AppBuilderService:
    """Service for building and managing apps"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_app(
        self,
        user_id: uuid.UUID,
        name: str,
        description: Optional[str],
        app_type: str,
        template_id: Optional[uuid.UUID] = None,
        config: Dict[str, Any] = None,
        theme_config: Dict[str, Any] = None
    ) -> App:
        """Create a new application"""
        
        # Generate unique slug
        base_slug = slugify(name)
        slug = base_slug
        counter = 1
        while self.db.query(App).filter(
            App.owner_id == user_id,
            App.slug == slug
        ).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Create app
        app = App(
            name=name,
            slug=slug,
            description=description,
            app_type=app_type,
            owner_id=user_id,
            config=config or {},
            theme_config=theme_config or self._default_theme(),
            seo_config=self._default_seo(name, description)
        )
        
        self.db.add(app)
        self.db.flush()
        
        # Apply template if provided
        if template_id:
            await self._apply_template(app, template_id)
        else:
            # Create default homepage
            await self._create_default_page(app)
        
        self.db.commit()
        self.db.refresh(app)
        
        return app
    
    async def _apply_template(self, app: App, template_id: uuid.UUID):
        """Apply a template to an app"""
        template = self.db.query(Template).filter(Template.id == template_id).first()
        if not template:
            raise ValueError("Template not found")
        
        # Copy template config
        app.config = {**app.config, **template.config}
        
        # Create pages from template
        pages_config = template.pages_config or {}
        for page_slug, page_config in pages_config.items():
            page = Page(
                app_id=app.id,
                title=page_config.get("title", page_slug.title()),
                slug=page_slug,
                content=page_config.get("content", {}),
                is_homepage=page_config.get("is_homepage", False),
                meta_title=page_config.get("meta_title"),
                meta_description=page_config.get("meta_description")
            )
            self.db.add(page)
        
        # Update template download count
        template.downloads += 1
    
    async def _create_default_page(self, app: App):
        """Create a default homepage"""
        page = Page(
            app_id=app.id,
            title="Home",
            slug="home",
            content={
                "elements": [],
                "layout": "default"
            },
            is_homepage=True,
            meta_title=f"{app.name} - Home",
            meta_description=app.description
        )
        self.db.add(page)
    
    def _default_theme(self) -> Dict[str, Any]:
        """Default theme configuration"""
        return {
            "colors": {
                "primary": "#3b82f6",
                "secondary": "#6b7280",
                "accent": "#8b5cf6",
                "background": "#ffffff",
                "foreground": "#1f2937",
                "muted": "#f3f4f6"
            },
            "fonts": {
                "heading": "Inter",
                "body": "Inter"
            },
            "borderRadius": "8px",
            "spacing": {
                "base": "16px"
            }
        }
    
    def _default_seo(self, name: str, description: Optional[str]) -> Dict[str, Any]:
        """Default SEO configuration"""
        return {
            "meta_title": name,
            "meta_description": description or f"Welcome to {name}",
            "og_title": name,
            "og_description": description,
            "twitter_card": "summary_large_image",
            "robots": "index, follow"
        }
    
    async def duplicate_app(self, app_id: uuid.UUID, user_id: uuid.UUID, new_name: str) -> App:
        """Duplicate an existing app"""
        original = self.db.query(App).filter(App.id == app_id).first()
        if not original:
            raise ValueError("App not found")
        
        # Create new app with copied config
        new_app = await self.create_app(
            user_id=user_id,
            name=new_name,
            description=original.description,
            app_type=original.app_type,
            config=original.config.copy(),
            theme_config=original.theme_config.copy()
        )
        
        # Copy pages
        for page in original.pages:
            new_page = Page(
                app_id=new_app.id,
                title=page.title,
                slug=page.slug,
                content=page.content.copy() if page.content else {},
                is_homepage=page.is_homepage,
                meta_title=page.meta_title,
                meta_description=page.meta_description
            )
            self.db.add(new_page)
        
        self.db.commit()
        return new_app
    
    async def export_app(self, app_id: uuid.UUID) -> Dict[str, Any]:
        """Export app configuration"""
        app = self.db.query(App).filter(App.id == app_id).first()
        if not app:
            raise ValueError("App not found")
        
        return {
            "name": app.name,
            "app_type": app.app_type,
            "description": app.description,
            "config": app.config,
            "theme_config": app.theme_config,
            "seo_config": app.seo_config,
            "pages": [
                {
                    "title": p.title,
                    "slug": p.slug,
                    "content": p.content,
                    "is_homepage": p.is_homepage,
                    "meta_title": p.meta_title,
                    "meta_description": p.meta_description
                }
                for p in app.pages
            ],
            "exported_at": datetime.utcnow().isoformat()
        }
    
    async def import_app(self, user_id: uuid.UUID, data: Dict[str, Any]) -> App:
        """Import app from exported data"""
        app = await self.create_app(
            user_id=user_id,
            name=data["name"],
            description=data.get("description"),
            app_type=data["app_type"],
            config=data.get("config", {}),
            theme_config=data.get("theme_config", {})
        )
        
        # Import pages
        for page_data in data.get("pages", []):
            page = Page(
                app_id=app.id,
                title=page_data["title"],
                slug=page_data["slug"],
                content=page_data.get("content", {}),
                is_homepage=page_data.get("is_homepage", False),
                meta_title=page_data.get("meta_title"),
                meta_description=page_data.get("meta_description")
            )
            self.db.add(page)
        
        self.db.commit()
        return app
