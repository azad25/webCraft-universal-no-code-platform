"""
Widget Management API Routes
Marketplace for reusable components and plugins
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from core.database import get_db, Widget, User
from core.auth import get_current_user

router = APIRouter()


class WidgetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    category: str = Field(..., description="Category: layout, content, form, ecommerce, etc.")
    config_schema: Dict[str, Any] = Field(default_factory=dict)
    default_config: Dict[str, Any] = Field(default_factory=dict)
    component_code: Optional[str] = None
    is_premium: bool = False
    price: int = 0


class WidgetResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    category: str
    config_schema: Dict[str, Any]
    default_config: Dict[str, Any]
    is_premium: bool
    price: int
    downloads: int
    rating: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class WidgetListResponse(BaseModel):
    widgets: List[WidgetResponse]
    total: int
    page: int
    per_page: int


# Built-in widget definitions
BUILTIN_WIDGETS = {
    "layout": [
        {"id": "container", "name": "Container", "description": "Flexible container for organizing content"},
        {"id": "section", "name": "Section", "description": "Full-width section with background options"},
        {"id": "columns", "name": "Columns", "description": "Multi-column layout system"},
        {"id": "grid", "name": "Grid", "description": "CSS Grid layout container"},
        {"id": "spacer", "name": "Spacer", "description": "Add spacing between elements"}
    ],
    "content": [
        {"id": "heading", "name": "Heading", "description": "H1-H6 headings with styling"},
        {"id": "text", "name": "Text", "description": "Rich text with formatting"},
        {"id": "paragraph", "name": "Paragraph", "description": "Paragraph text block"},
        {"id": "list", "name": "List", "description": "Ordered and unordered lists"},
        {"id": "quote", "name": "Quote", "description": "Blockquote with styling"}
    ],
    "media": [
        {"id": "image", "name": "Image", "description": "Responsive images with effects"},
        {"id": "gallery", "name": "Gallery", "description": "Image gallery with lightbox"},
        {"id": "video", "name": "Video", "description": "Video player with controls"},
        {"id": "icon", "name": "Icon", "description": "Icon with customizable styling"}
    ],
    "interactive": [
        {"id": "button", "name": "Button", "description": "Interactive button with actions"},
        {"id": "form", "name": "Form", "description": "Contact and data collection forms"},
        {"id": "input", "name": "Input", "description": "Form input field"},
        {"id": "select", "name": "Select", "description": "Dropdown selection"}
    ],
    "business": [
        {"id": "chart", "name": "Chart", "description": "Data visualization charts"},
        {"id": "table", "name": "Table", "description": "Data tables with sorting"},
        {"id": "pricing", "name": "Pricing", "description": "Pricing table widget"},
        {"id": "testimonial", "name": "Testimonial", "description": "Customer testimonials"}
    ],
    "ecommerce": [
        {"id": "product", "name": "Product", "description": "Product showcase card"},
        {"id": "cart", "name": "Cart", "description": "Shopping cart widget"},
        {"id": "checkout", "name": "Checkout", "description": "Checkout form"}
    ],
    "advanced": [
        {"id": "map", "name": "Map", "description": "Interactive maps"},
        {"id": "calendar", "name": "Calendar", "description": "Event calendar"},
        {"id": "social", "name": "Social", "description": "Social media integration"},
        {"id": "custom", "name": "Custom Code", "description": "Custom HTML/CSS/JS"}
    ]
}


@router.get("/", response_model=WidgetListResponse)
async def list_widgets(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all available widgets
    
    Returns both built-in widgets and custom marketplace widgets.
    """
    
    query = db.query(Widget).filter(Widget.is_active == True)
    
    if category:
        query = query.filter(Widget.category == category)
    
    if search:
        query = query.filter(
            Widget.name.ilike(f"%{search}%") |
            Widget.description.ilike(f"%{search}%")
        )
    
    total = query.count()
    widgets = query.offset((page - 1) * per_page).limit(per_page).all()
    
    return WidgetListResponse(
        widgets=widgets,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/builtin")
async def get_builtin_widgets():
    """
    Get all built-in widget definitions
    
    Returns the complete list of built-in widgets organized by category.
    """
    return {
        "categories": BUILTIN_WIDGETS,
        "total": sum(len(widgets) for widgets in BUILTIN_WIDGETS.values())
    }


@router.get("/categories")
async def get_widget_categories():
    """Get all widget categories"""
    return {
        "categories": [
            {"id": "layout", "name": "Layout", "description": "Structure and organize content"},
            {"id": "content", "name": "Content", "description": "Text and media elements"},
            {"id": "media", "name": "Media", "description": "Images, videos, and galleries"},
            {"id": "interactive", "name": "Interactive", "description": "Buttons, forms, and inputs"},
            {"id": "business", "name": "Business", "description": "Charts, tables, and data"},
            {"id": "ecommerce", "name": "E-commerce", "description": "Products and shopping"},
            {"id": "advanced", "name": "Advanced", "description": "Maps, calendars, and custom code"}
        ]
    }


@router.get("/{widget_id}", response_model=WidgetResponse)
async def get_widget(
    widget_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific widget by ID"""
    
    widget = db.query(Widget).filter(Widget.id == widget_id).first()
    
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    return widget


@router.post("/", response_model=WidgetResponse)
async def create_widget(
    widget_data: WidgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a custom widget
    
    Allows users to create and publish custom widgets to the marketplace.
    """
    
    # Check if slug is unique
    existing = db.query(Widget).filter(Widget.slug == widget_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Widget slug already exists")
    
    widget = Widget(
        **widget_data.dict(),
        creator_id=current_user.id
    )
    
    db.add(widget)
    db.commit()
    db.refresh(widget)
    
    return widget


@router.put("/{widget_id}", response_model=WidgetResponse)
async def update_widget(
    widget_id: uuid.UUID = Path(...),
    widget_data: WidgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a custom widget"""
    
    widget = db.query(Widget).filter(
        Widget.id == widget_id,
        Widget.creator_id == current_user.id
    ).first()
    
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    for field, value in widget_data.dict(exclude_unset=True).items():
        setattr(widget, field, value)
    
    widget.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(widget)
    
    return widget


@router.delete("/{widget_id}")
async def delete_widget(
    widget_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a custom widget"""
    
    widget = db.query(Widget).filter(
        Widget.id == widget_id,
        Widget.creator_id == current_user.id
    ).first()
    
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    db.delete(widget)
    db.commit()
    
    return {"message": "Widget deleted successfully"}
