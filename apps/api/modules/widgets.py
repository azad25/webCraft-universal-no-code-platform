"""
Widget Module - Core widget system
"""

from typing import Dict, List, Any
from core.module_system import BaseModule, ModuleMetadata, ModuleType
from modules.base import WidgetModuleBase
from fastapi import APIRouter


class WidgetModule(WidgetModuleBase):
    """Core widget module providing all built-in widgets"""
    
    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            id="core.widgets",
            name="Core Widgets",
            version="1.0.0",
            type=ModuleType.WIDGET,
            description="Built-in widget library",
            author="WebCraft",
            dependencies=[],
            is_premium=False
        )
    
    async def initialize(self) -> bool:
        self._widgets = self._load_widget_definitions()
        self._initialized = True
        return True
    
    async def shutdown(self) -> bool:
        self._initialized = False
        return True
    
    def _load_widget_definitions(self) -> Dict[str, Dict]:
        """Load all widget definitions"""
        return {
            # Layout widgets
            "container": {
                "category": "layout",
                "name": "Container",
                "icon": "square",
                "defaultProps": {"padding": "16px"},
                "configSchema": {
                    "padding": {"type": "spacing"},
                    "margin": {"type": "spacing"},
                    "backgroundColor": {"type": "color"},
                    "maxWidth": {"type": "size"}
                }
            },
            "section": {
                "category": "layout",
                "name": "Section",
                "icon": "layout",
                "defaultProps": {"fullWidth": True},
                "configSchema": {
                    "fullWidth": {"type": "boolean"},
                    "backgroundColor": {"type": "color"},
                    "backgroundImage": {"type": "image"}
                }
            },
            "columns": {
                "category": "layout",
                "name": "Columns",
                "icon": "columns",
                "defaultProps": {"columns": 2, "gap": "16px"},
                "configSchema": {
                    "columns": {"type": "number", "min": 1, "max": 12},
                    "gap": {"type": "spacing"}
                }
            },
            # Content widgets
            "heading": {
                "category": "content",
                "name": "Heading",
                "icon": "type",
                "defaultProps": {"level": "h2", "text": "Heading"},
                "configSchema": {
                    "level": {"type": "select", "options": ["h1","h2","h3","h4","h5","h6"]},
                    "text": {"type": "text"},
                    "textAlign": {"type": "align"}
                }
            },
            "text": {
                "category": "content",
                "name": "Text",
                "icon": "align-left",
                "defaultProps": {"text": "Enter text..."},
                "configSchema": {
                    "text": {"type": "richtext"},
                    "fontSize": {"type": "size"},
                    "color": {"type": "color"}
                }
            },
            "image": {
                "category": "media",
                "name": "Image",
                "icon": "image",
                "defaultProps": {},
                "configSchema": {
                    "src": {"type": "image"},
                    "alt": {"type": "text"},
                    "objectFit": {"type": "select", "options": ["cover","contain","fill"]}
                }
            },
            "button": {
                "category": "interactive",
                "name": "Button",
                "icon": "mouse-pointer",
                "defaultProps": {"text": "Click Me", "variant": "primary"},
                "configSchema": {
                    "text": {"type": "text"},
                    "href": {"type": "url"},
                    "variant": {"type": "select", "options": ["primary","secondary","outline"]}
                }
            },
            "form": {
                "category": "interactive",
                "name": "Form",
                "icon": "file-text",
                "defaultProps": {"fields": []},
                "configSchema": {
                    "fields": {"type": "array"},
                    "submitText": {"type": "text"},
                    "action": {"type": "url"}
                }
            },
            "hero": {
                "category": "sections",
                "name": "Hero",
                "icon": "star",
                "defaultProps": {"title": "Welcome", "subtitle": ""},
                "configSchema": {
                    "title": {"type": "text"},
                    "subtitle": {"type": "text"},
                    "backgroundImage": {"type": "image"},
                    "ctaText": {"type": "text"},
                    "ctaUrl": {"type": "url"}
                }
            }
        }
    
    def get_widget_definitions(self) -> List[Dict[str, Any]]:
        return [{"id": k, **v} for k, v in self._widgets.items()]
    
    def render_widget(self, widget_type: str, props: Dict) -> str:
        """Server-side render for SEO"""
        widget = self._widgets.get(widget_type)
        if not widget:
            return f"<div>Unknown widget: {widget_type}</div>"
        
        # Basic SSR rendering
        if widget_type == "heading":
            level = props.get("level", "h2")
            text = props.get("text", "")
            return f"<{level}>{text}</{level}>"
        elif widget_type == "text":
            return f"<p>{props.get('text', '')}</p>"
        elif widget_type == "image":
            return f'<img src="{props.get("src", "")}" alt="{props.get("alt", "")}" />'
        elif widget_type == "button":
            return f'<a href="{props.get("href", "#")}">{props.get("text", "")}</a>'
        
        return f"<div data-widget='{widget_type}'></div>"
    
    def get_routes(self) -> List[APIRouter]:
        router = APIRouter(prefix="/widgets", tags=["Widgets"])
        
        @router.get("/definitions")
        async def get_definitions():
            return {"widgets": self.get_widget_definitions()}
        
        return [router]
