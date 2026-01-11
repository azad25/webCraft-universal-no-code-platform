"""
Widget Layers API - Support for widget decomposition and sub-element management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from core.database import get_db, App, Page
from core.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/apps/{app_id}/widget-layers", tags=["Widget Layers"])

class SubElement(BaseModel):
    id: str
    parent_element_id: str
    path: str  # Path within the widget (e.g., 'title', 'description')
    type: str  # Sub-element type (e.g., 'text', 'image', 'button')
    name: str
    value: Any  # Current value of the sub-element
    editable: bool = True
    visible: bool = True
    locked: bool = False
    metadata: Dict[str, Any] = {}

class WidgetDecomposition(BaseModel):
    element_id: str
    element_type: str
    sub_elements: List[SubElement]
    total_sub_elements: int

# Widget sub-element definitions - matches frontend
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
        {"type": "description", "name": "Description", "path": "description", "editable": True},
        {"type": "controls", "name": "Player Controls", "path": "controls", "editable": True}
    ],
    "audio": [
        {"type": "audio-player", "name": "Audio Player", "path": "src", "editable": True},
        {"type": "title", "name": "Track Title", "path": "title", "editable": True},
        {"type": "artist", "name": "Artist Name", "path": "artist", "editable": True},
        {"type": "controls", "name": "Player Controls", "path": "controls", "editable": True}
    ],
    "custom-code": [
        {"type": "html-content", "name": "HTML Content", "path": "content", "editable": True},
        {"type": "css-styles", "name": "CSS Styles", "path": "styles", "editable": True},
        {"type": "js-script", "name": "JavaScript", "path": "script", "editable": True}
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

@router.get("/{element_id}/decompose", response_model=WidgetDecomposition)
async def decompose_widget(
    app_id: str,
    element_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Decompose a widget into its editable sub-elements"""
    
    # Verify app ownership
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Find the element across all pages
    element_data = None
    pages = db.query(Page).filter(Page.app_id == app_id).all()
    
    for page in pages:
        if page.content and 'elements' in page.content:
            for element in page.content['elements']:
                if element.get('id') == element_id:
                    element_data = element
                    break
        if element_data:
            break
    
    if not element_data:
        raise HTTPException(status_code=404, detail="Element not found")
    
    element_type = element_data.get('type', '')
    sub_element_defs = WIDGET_SUB_ELEMENTS.get(element_type, [])
    
    if not sub_element_defs:
        raise HTTPException(status_code=400, detail=f"Widget type '{element_type}' does not support decomposition")
    
    # Create sub-elements from the element's props
    sub_elements = []
    element_props = element_data.get('props', {})
    
    for sub_def in sub_element_defs:
        sub_element = SubElement(
            id=f"{element_id}-{sub_def['path']}",
            parent_element_id=element_id,
            path=sub_def['path'],
            type=sub_def['type'],
            name=sub_def['name'],
            value=element_props.get(sub_def['path'], ''),
            editable=sub_def.get('editable', True),
            visible=True,
            locked=False,
            metadata={
                'widget_type': element_type,
                'sub_element_def': sub_def
            }
        )
        sub_elements.append(sub_element)
    
    return WidgetDecomposition(
        element_id=element_id,
        element_type=element_type,
        sub_elements=sub_elements,
        total_sub_elements=len(sub_elements)
    )

@router.put("/{element_id}/sub-element/{sub_element_path}")
async def update_sub_element(
    app_id: str,
    element_id: str,
    sub_element_path: str,
    value: Any,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a specific sub-element within a widget"""
    
    # Verify app ownership
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Find and update the element across all pages
    updated = False
    pages = db.query(Page).filter(Page.app_id == app_id).all()
    
    for page in pages:
        if page.content and 'elements' in page.content:
            elements = page.content['elements']
            for i, element in enumerate(elements):
                if element.get('id') == element_id:
                    # Update the sub-element value
                    if 'props' not in element:
                        element['props'] = {}
                    
                    element['props'][sub_element_path] = value
                    elements[i] = element
                    
                    # Save the updated page content
                    page.content = {'elements': elements}
                    page.updated_at = datetime.utcnow()
                    db.commit()
                    
                    updated = True
                    break
        if updated:
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Element not found")
    
    return {
        "success": True,
        "element_id": element_id,
        "sub_element_path": sub_element_path,
        "new_value": value,
        "updated_at": datetime.utcnow().isoformat()
    }

@router.get("", response_model=List[WidgetDecomposition])
async def get_all_widget_layers(
    app_id: str,
    page_id: Optional[str] = Query(None),
    widget_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get decomposed layers for all widgets in an app or specific page"""
    
    # Verify app ownership
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Get pages to search
    if page_id:
        pages = db.query(Page).filter(
            Page.app_id == app_id,
            Page.id == page_id
        ).all()
    else:
        pages = db.query(Page).filter(Page.app_id == app_id).all()
    
    widget_decompositions = []
    
    for page in pages:
        if page.content and 'elements' in page.content:
            for element in page.content['elements']:
                element_type = element.get('type', '')
                element_id = element.get('id', '')
                
                # Filter by widget type if specified
                if widget_type and element_type != widget_type:
                    continue
                
                # Check if this widget type supports decomposition
                sub_element_defs = WIDGET_SUB_ELEMENTS.get(element_type, [])
                if not sub_element_defs:
                    continue
                
                # Create sub-elements
                sub_elements = []
                element_props = element.get('props', {})
                
                for sub_def in sub_element_defs:
                    sub_element = SubElement(
                        id=f"{element_id}-{sub_def['path']}",
                        parent_element_id=element_id,
                        path=sub_def['path'],
                        type=sub_def['type'],
                        name=sub_def['name'],
                        value=element_props.get(sub_def['path'], ''),
                        editable=sub_def.get('editable', True),
                        visible=True,
                        locked=False,
                        metadata={
                            'widget_type': element_type,
                            'page_id': page.id,
                            'page_title': page.title
                        }
                    )
                    sub_elements.append(sub_element)
                
                widget_decompositions.append(WidgetDecomposition(
                    element_id=element_id,
                    element_type=element_type,
                    sub_elements=sub_elements,
                    total_sub_elements=len(sub_elements)
                ))
    
    return widget_decompositions

@router.get("/supported-widgets")
async def get_supported_widgets():
    """Get list of widget types that support decomposition"""
    
    supported_widgets = []
    for widget_type, sub_elements in WIDGET_SUB_ELEMENTS.items():
        supported_widgets.append({
            "type": widget_type,
            "name": widget_type.replace('-', ' ').title(),
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