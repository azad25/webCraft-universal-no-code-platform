"""Content API domain service"""
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from src.domains.apps.models import App
from core.database import Page


class ContentAPIService:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_app_content(self, app_slug: str) -> Optional[Dict[str, Any]]:
        app = self.db.query(App).filter(App.slug == app_slug, App.is_published == True).first()
        if not app:
            return None
        
        content = {
            "name": app.name,
            "description": app.description,
            "type": app.app_type,
            "url": f"https://{app.subdomain}.webcraft.dev" if app.subdomain else None,
            "seo": {
                "title": app.seo_config.get("meta_title") if app.seo_config else None,
                "description": app.seo_config.get("meta_description") if app.seo_config else None,
                "keywords": app.seo_config.get("meta_keywords", []) if app.seo_config else []
            },
            "pages": []
        }
        
        pages = self.db.query(Page).filter(Page.app_id == app.id, Page.is_published == True).all()
        for page in pages:
            page_content = {
                "title": page.title,
                "slug": page.slug,
                "description": page.meta_description,
                "content": self._extract_text_content(page.content)
            }
            content["pages"].append(page_content)
        
        return content
    
    async def get_page_content(self, app_slug: str, page_slug: str) -> Optional[Dict[str, Any]]:
        app = self.db.query(App).filter(App.slug == app_slug, App.is_published == True).first()
        if not app:
            return None
        
        page = self.db.query(Page).filter(
            Page.app_id == app.id, Page.slug == page_slug, Page.is_published == True
        ).first()
        if not page:
            return None
        
        return {
            "title": page.title,
            "slug": page.slug,
            "description": page.meta_description,
            "content": self._extract_text_content(page.content),
            "structured_content": page.content
        }
    
    async def get_structured_data(self, app_slug: str) -> Dict[str, Any]:
        app = self.db.query(App).filter(App.slug == app_slug, App.is_published == True).first()
        if not app:
            return {}
        return app.seo_config.get("structured_data", {}) if app.seo_config else {}
    
    def _extract_text_content(self, content: dict) -> str:
        if not content:
            return ""
        texts = []
        elements = content.get("elements", [])
        for element in elements:
            if isinstance(element, dict):
                props = element.get("props", {})
                for key in ["text", "title", "description", "content"]:
                    if key in props:
                        texts.append(props[key])
        return "\n\n".join(texts)
    
    def to_markdown(self, content: dict) -> str:
        md = f"# {content['name']}\n\n"
        if content.get("description"):
            md += f"{content['description']}\n\n"
        for page in content.get("pages", []):
            md += f"## {page['title']}\n\n"
            if page.get("description"):
                md += f"*{page['description']}*\n\n"
            if page.get("content"):
                md += f"{page['content']}\n\n"
        return md
    
    def to_plain_text(self, content: dict) -> str:
        text = f"{content['name']}\n{'=' * len(content['name'])}\n\n"
        if content.get("description"):
            text += f"{content['description']}\n\n"
        for page in content.get("pages", []):
            text += f"{page['title']}\n{'-' * len(page['title'])}\n"
            if page.get("content"):
                text += f"{page['content']}\n\n"
        return text
