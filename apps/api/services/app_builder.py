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
        template_id: Optional[str] = None,
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
    
    async def _apply_template(self, app: App, template_id: str):
        """Apply a template to an app"""
        from services.template_service import TemplateService
        from core.database import Template, TemplatePage
        
        template_service = TemplateService(self.db)
        template = await template_service.get_template(template_id)
        
        if not template:
            raise ValueError(f"Template '{template_id}' not found")
        
        # Copy template config
        app.config = {**app.config, **template.get("config", {})}
        
        if template.get("database_template"):
            # This is a database template, pages are already included
            print(f"🔄 Using database template: {template['name']}")
            
            pages_created = 0
            for page_data in template.get("pages", []):
                page = Page(
                    app_id=app.id,
                    title=page_data["name"],
                    slug=page_data["slug"],
                    content=page_data["content"],
                    is_homepage=page_data["is_homepage"],
                    meta_title=page_data["name"],
                    meta_description=f"{app.name} - {page_data['name']}"
                )
                self.db.add(page)
                pages_created += 1
                print(f"✅ Created page: {page_data['name']}")
            
            # Don't create default page if template pages were created
            if pages_created > 0:
                return
        else:
            # This is a hardcoded template
            print(f"🔄 Using hardcoded template: {template_id}")
            
            pages = template.get("pages", [])
            pages_config = template.get("pages_config", {})
            pages_created = 0
            
            # If pages_config exists, use that structure
            if pages_config:
                for page_key, page_data in pages_config.items():
                    elements = page_data.get("content", {}).get("elements", [])
                    page = Page(
                        app_id=app.id,
                        title=page_data.get("title", page_key.title()),
                        slug=page_key,
                        content={
                            "elements": elements
                        },
                        is_homepage=page_data.get("is_homepage", page_key == "home"),
                        meta_title=page_data.get("title", page_key.title()),
                        meta_description=f"{app.name} - {page_data.get('title', page_key.title())}"
                    )
                    self.db.add(page)
                    pages_created += 1
            else:
                # Use the original pages structure
                for page_data in pages:
                    elements = page_data.get("elements", [])
                    if not elements and "content" in page_data:
                        elements = page_data["content"].get("elements", [])
                    
                    page = Page(
                        app_id=app.id,
                        title=page_data.get("name", "Home"),
                        slug=page_data.get("slug", "home"),
                        content={
                            "elements": elements
                        },
                        is_homepage=page_data.get("slug") == "home",
                        meta_title=page_data.get("name", "Home"),
                        meta_description=f"{app.name} - {page_data.get('name', 'Home')}"
                    )
                    self.db.add(page)
                    pages_created += 1
            
            # Don't create default page if template pages were created
            if pages_created > 0:
                return
        
        # Only create default homepage if no template pages were created
        print("🔄 No template pages found, creating default homepage")
        await self._create_default_page(app)
    
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
    
    async def create_template_from_app(
        self, 
        app_id: uuid.UUID, 
        creator_id: uuid.UUID,
        template_name: str,
        template_description: str,
        category: str,
        is_premium: bool = False,
        price: int = 0
    ) -> Dict[str, Any]:
        """Create a template from an existing app"""
        from core.database import Template, TemplatePage
        from slugify import slugify
        
        # Get the source app
        app = self.db.query(App).filter(App.id == app_id).first()
        if not app:
            raise ValueError("App not found")
        
        # Generate unique slug
        base_slug = slugify(template_name)
        slug = base_slug
        counter = 1
        while self.db.query(Template).filter(Template.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Create template
        template = Template(
            name=template_name,
            slug=slug,
            description=template_description,
            category=category,
            config=app.config,
            is_premium=is_premium,
            price=price,
            creator_id=creator_id
        )
        
        self.db.add(template)
        self.db.flush()
        
        # Copy pages to template pages
        for page in app.pages:
            template_page = TemplatePage(
                template_id=template.id,
                title=page.title,
                slug=page.slug,
                content=page.content,
                is_homepage=page.is_homepage,
                meta_title=page.meta_title,
                meta_description=page.meta_description
            )
            self.db.add(template_page)
        
        self.db.commit()
        self.db.refresh(template)
        
        return {
            "id": template.slug,
            "name": template.name,
            "description": template.description,
            "category": template.category,
            "created_at": template.created_at.isoformat()
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
