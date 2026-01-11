"""Widget Layers domain service"""
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime

# Widget sub-element definitions
WIDGET_SUB_ELEMENTS = {
    "hero": [
        {"type": "badge", "name": "Badge", "path": "badgeText", "editable": True},
        {"type": "title", "name": "Title", "path": "title", "editable": True},
        {"type": "subtitle", "name": "Subtitle", "path": "subtitle", "editable": True},
        {"type": "description", "name": "Description", "path": "description", "editable": True},
        {"type": "primary-button", "name": "Primary Button", "path": "primaryButtonText", "editable": True},
        {"type": "secondary-button", "name": "Secondary Button", "path": "secondaryButtonText", "editable": True},
        {"type": "background", "name": "Background", "path": "backgroundImage", "editable": True}
    ],
    "card": [
        {"type": "image", "name": "Card Image", "path": "image", "editable": True},
        {"type": "title", "name": "Card Title", "path": "title", "editable": True},
        {"type": "description", "name": "Description", "path": "description", "editable": True},
        {"type": "button", "name": "Action Button", "path": "buttonText", "editable": True}
    ],
    "navbar": [
        {"type": "logo", "name": "Logo", "path": "logo", "editable": True},
        {"type": "brand", "name": "Brand Text", "path": "brandText", "editable": True},
        {"type": "menu-items", "name": "Menu Items", "path": "menuItems", "editable": True},
        {"type": "cta-button", "name": "CTA Button", "path": "ctaButton", "editable": True}
    ],
    "footer": [
        {"type": "logo", "name": "Footer Logo", "path": "logo", "editable": True},
        {"type": "description", "name": "Description", "path": "description", "editable": True},
        {"type": "links", "name": "Footer Links", "path": "links", "editable": True},
        {"type": "social", "name": "Social Links", "path": "socialLinks", "editable": True},
        {"type": "copyright", "name": "Copyright", "path": "copyright", "editable": True}
    ],
    "pricing": [
        {"type": "title", "name": "Plan Title", "path": "title", "editable": True},
        {"type": "price", "name": "Price", "path": "price", "editable": True},
        {"type": "features", "name": "Features List", "path": "features", "editable": True},
        {"type": "button", "name": "Subscribe Button", "path": "buttonText", "editable": True}
    ],
    "testimonial": [
        {"type": "quote", "name": "Quote Text", "path": "quote", "editable": True},
        {"type": "author", "name": "Author Name", "path": "author", "editable": True},
        {"type": "role", "name": "Author Role", "path": "role", "editable": True},
        {"type": "avatar", "name": "Author Avatar", "path": "avatar", "editable": True},
        {"type": "rating", "name": "Rating", "path": "rating", "editable": True}
    ],
    "features": [
        {"type": "title", "name": "Section Title", "path": "title", "editable": True},
        {"type": "subtitle", "name": "Subtitle", "path": "subtitle", "editable": True},
        {"type": "feature-items", "name": "Feature Items", "path": "features", "editable": True}
    ],
    "form": [
        {"type": "title", "name": "Form Title", "path": "title", "editable": True},
        {"type": "fields", "name": "Form Fields", "path": "fields", "editable": True},
        {"type": "submit-button", "name": "Submit Button", "path": "submitButton", "editable": True}
    ],
    "gallery": [
        {"type": "title", "name": "Gallery Title", "path": "title", "editable": True},
        {"type": "images", "name": "Image Grid", "path": "images", "editable": True},
        {"type": "filters", "name": "Filter Buttons", "path": "filters", "editable": True}
    ],
    "video": [
        {"type": "video-player", "name": "Video Player", "path": "src", "editable": True},
        {"type": "title", "name": "Video Title", "path": "title", "editable": True},
        {"type": "description", "name": "Description", "path": "description", "editable": True}
    ],
    "text": [
        {"type": "text-content", "name": "Text Content", "path": "content", "editable": True}
    ],
    "image": [
        {"type": "image-src", "name": "Image Source", "path": "src", "editable": True},
        {"type": "alt-text", "name": "Alt Text", "path": "alt", "editable": True}
    ],
    "button": [
        {"type": "button-text", "name": "Button Text", "path": "text", "editable": True},
        {"type": "button-icon", "name": "Button Icon", "path": "icon", "editable": True}
    ]
}


class WidgetLayersService:
    def __init__(self, db: Session):
        self.db = db

    async def decompose_widget(self, element_id: str, element_type: str, element_props: Dict[str, Any]) -> Dict[str, Any]:
        """Decompose a widget into its editable sub-elements"""
        sub_element_defs = WIDGET_SUB_ELEMENTS.get(element_type, [])
        
        if not sub_element_defs:
            return {"error": f"Widget type '{element_type}' does not support decomposition"}
        
        sub_elements = []
        for sub_def in sub_element_defs:
            sub_elements.append({
                "id": f"{element_id}-{sub_def['path']}",
                "parent_element_id": element_id,
                "path": sub_def["path"],
                "type": sub_def["type"],
                "name": sub_def["name"],
                "value": element_props.get(sub_def["path"], ""),
                "editable": sub_def.get("editable", True),
                "visible": True,
                "locked": False,
                "metadata": {"widget_type": element_type}
            })
        
        return {
            "element_id": element_id,
            "element_type": element_type,
            "sub_elements": sub_elements,
            "total_sub_elements": len(sub_elements)
        }

    async def get_supported_widgets(self) -> Dict[str, Any]:
        """Get list of widget types that support decomposition"""
        supported_widgets = []
        for widget_type, sub_elements in WIDGET_SUB_ELEMENTS.items():
            supported_widgets.append({
                "type": widget_type,
                "name": widget_type.replace("-", " ").title(),
                "sub_element_count": len(sub_elements),
                "sub_elements": [
                    {
                        "type": sub_el["type"],
                        "name": sub_el["name"],
                        "path": sub_el["path"],
                        "editable": sub_el.get("editable", True)
                    }
                    for sub_el in sub_elements
                ]
            })
        
        return {
            "supported_widgets": supported_widgets,
            "total_widget_types": len(supported_widgets),
            "total_sub_elements": sum(len(sub_els) for sub_els in WIDGET_SUB_ELEMENTS.values())
        }
