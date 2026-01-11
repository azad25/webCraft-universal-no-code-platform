"""Live Apps domain service"""
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
import uuid
import json

from src.domains.apps.models import App
from core.database import Page


class LiveAppsService:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_live_app(
        self, app_slug: str, page_slug: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        app = self.db.query(App).filter(
            App.slug == app_slug,
            App.is_published == True
        ).first()
        
        if not app:
            return None
        
        # Get the requested page or homepage
        if page_slug:
            page = self.db.query(Page).filter(
                Page.app_id == app.id,
                Page.slug == page_slug,
                Page.is_published == True
            ).first()
        else:
            page = self.db.query(Page).filter(
                Page.app_id == app.id,
                Page.is_homepage == True,
                Page.is_published == True
            ).first()
        
        if not page:
            page = self.db.query(Page).filter(
                Page.app_id == app.id,
                Page.is_published == True
            ).first()
        
        if not page:
            return None
        
        # Get all pages for navigation
        all_pages = self.db.query(Page).filter(
            Page.app_id == app.id,
            Page.is_published == True
        ).all()
        
        return {
            "app": app,
            "page": page,
            "all_pages": all_pages
        }
    
    async def get_app_data(self, app_slug: str) -> Optional[Dict[str, Any]]:
        app = self.db.query(App).filter(
            App.slug == app_slug,
            App.is_published == True
        ).first()
        
        if not app:
            return None
        
        pages = self.db.query(Page).filter(
            Page.app_id == app.id,
            Page.is_published == True
        ).all()
        
        return {
            "app": {
                "id": str(app.id),
                "name": app.name,
                "slug": app.slug,
                "app_type": app.app_type,
                "config": app.config,
                "theme_config": app.theme_config,
                "seo_config": app.seo_config
            },
            "pages": [{
                "id": str(page.id),
                "title": page.title,
                "slug": page.slug,
                "content": page.content,
                "is_homepage": page.is_homepage,
                "meta_title": page.meta_title,
                "meta_description": page.meta_description
            } for page in pages]
        }
    
    def generate_html(
        self, app: App, page: Page, all_pages: List[Page], base_url: str
    ) -> str:
        elements = app.config.get('elements', []) if app.config else []
        if not elements and page.content:
            elements = page.content.get('elements', [])
        
        theme_config = app.theme_config or {}
        seo_config = app.seo_config or {}
        
        nav_items = [{
            "title": p.title,
            "slug": p.slug,
            "url": f"/app/{app.slug}" if p.is_homepage else f"/app/{app.slug}/{p.slug}",
            "active": p.id == page.id
        } for p in all_pages]
        
        element_html = self._generate_element_html(elements, theme_config)
        nav_html = self._generate_nav_html(nav_items, app) if len(all_pages) > 1 else ''
        
        return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{page.meta_title or page.title or app.name}</title>
    <meta name="description" content="{page.meta_description or seo_config.get('description', '')}">
    <meta property="og:title" content="{page.meta_title or page.title or app.name}">
    <meta property="og:description" content="{page.meta_description or ''}">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {{
            --primary-color: {theme_config.get('primaryColor', '#3b82f6')};
            --background-color: {theme_config.get('backgroundColor', '#ffffff')};
            --text-color: {theme_config.get('textColor', '#1f2937')};
        }}
        body {{
            font-family: {theme_config.get('fontFamily', 'Inter, system-ui, sans-serif')};
            background-color: var(--background-color);
            color: var(--text-color);
        }}
        .webcraft-app {{ min-height: 100vh; position: relative; }}
    </style>
</head>
<body>
    {nav_html}
    <div class="webcraft-app" id="webcraft-app">
        {element_html}
    </div>
    <div class="text-center py-4 text-sm text-gray-500 border-t mt-8">
        <p>Powered by <a href="https://webcraft.dev" class="text-blue-600 hover:underline">WebCraft</a></p>
    </div>
    <script>
        window.WEBCRAFT_APP = {json.dumps({"id": str(app.id), "name": app.name, "slug": app.slug})};
    </script>
</body>
</html>'''
    
    def _generate_element_html(self, elements: List[Dict], theme_config: Dict) -> str:
        html_parts = []
        for element in elements:
            element_type = element.get('type', '')
            props = element.get('props', {})
            element_id = element.get('id', '')
            
            if element_type == 'hero':
                html_parts.append(f'''
                <div id="{element_id}" class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-6">
                    <div class="max-w-4xl mx-auto text-center">
                        <h1 class="text-4xl md:text-6xl font-bold mb-6">{props.get('title', 'Welcome')}</h1>
                        <p class="text-xl mb-8">{props.get('subtitle', '')}</p>
                    </div>
                </div>''')
            elif element_type == 'text':
                html_parts.append(f'<div id="{element_id}" class="py-6 px-6 max-w-4xl mx-auto"><p>{props.get("content", "")}</p></div>')
            elif element_type == 'button':
                html_parts.append(f'<div id="{element_id}" class="py-6 px-6 text-center"><a href="{props.get("url", "#")}" class="bg-blue-600 text-white px-6 py-3 rounded-lg">{props.get("text", "Button")}</a></div>')
            elif element_type == 'image':
                html_parts.append(f'<div id="{element_id}" class="py-6 px-6 max-w-4xl mx-auto"><img src="{props.get("src", "")}" alt="{props.get("alt", "")}" class="w-full rounded-lg"></div>')
            else:
                html_parts.append(f'<div id="{element_id}" class="py-6 px-6">{props.get("content", "")}</div>')
        
        return '\n'.join(html_parts)
    
    def _generate_nav_html(self, nav_items: List[Dict], app: App) -> str:
        links = []
        for item in nav_items:
            active_class = 'bg-blue-100 text-blue-700' if item['active'] else 'text-gray-600 hover:text-gray-900'
            links.append(f'<a href="{item["url"]}" class="{active_class} px-3 py-2 rounded-lg">{item["title"]}</a>')
        
        return f'''
        <nav class="bg-white shadow-sm border-b sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex justify-between items-center py-4">
                    <div class="text-xl font-bold text-gray-900">{app.name}</div>
                    <div class="flex space-x-2">{''.join(links)}</div>
                </div>
            </div>
        </nav>'''
