"""
Templates API routes for V2
Enhanced with comprehensive template management functionality
"""

from fastapi import APIRouter, Depends, Query, HTTPException, Path
from sqlalchemy.orm import Session
from typing import Optional, List

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.schemas import UserResponse
from .service import TemplateService
from .schemas import TemplateResponse, TemplateListResponse

router = APIRouter()


@router.get("/", response_model=dict)
async def list_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search templates"),
    is_premium: Optional[bool] = Query(None, description="Filter by premium status"),
    sort_by: str = Query("popular", description="Sort by: popular, rating, newest, name"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """List all templates with filtering and search"""
    service = TemplateService(db)
    result = await service.list_templates(
        category=category,
        search=search,
        is_premium=is_premium,
        sort_by=sort_by,
        page=page,
        per_page=per_page
    )
    
    return result


@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get all template categories with counts"""
    service = TemplateService(db)
    categories = await service.get_categories()
    return {"categories": categories}


@router.get("/featured")
async def get_featured_templates(
    limit: int = Query(6, ge=1, le=20, description="Number of featured templates"),
    db: Session = Depends(get_db)
):
    """Get featured templates"""
    service = TemplateService(db)
    featured = await service.get_featured_templates(limit=limit)
    return {"featured": featured}


@router.get("/sections")
async def get_section_templates(
    category: Optional[str] = Query(None, description="Filter by section category"),
    db: Session = Depends(get_db)
):
    """Get reusable section templates"""
    service = TemplateService(db)
    sections = await service.get_section_templates(category=category)
    return {"sections": sections}


@router.get("/{template_id}")
async def get_template(
    template_id: str = Path(..., description="Template ID or slug"),
    db: Session = Depends(get_db)
):
    """Get a specific template by ID"""
    service = TemplateService(db)
    template = await service.get_template(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Increment view count
    await service.increment_views(template_id)
    
    return template


@router.post("/{template_id}/install")
async def install_template(
    template_id: str = Path(..., description="Template ID"),
    app_name: str = Query(..., description="Name for the new app"),
    app_description: Optional[str] = Query(None, description="Description for the new app"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Install template as a new app"""
    service = TemplateService(db)
    template = await service.get_template(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Install template
    app = await service.install_template(
        template=template,
        user_id=str(current_user.id),
        app_name=app_name,
        app_description=app_description
    )
    
    return {
        "success": True,
        "message": f"Template '{template['name']}' installed successfully",
        "app": app
    }


@router.post("/{template_id}/rate")
async def rate_template(
    template_id: str = Path(..., description="Template ID"),
    rating: int = Query(..., ge=1, le=5, description="Rating from 1 to 5"),
    review: Optional[str] = Query(None, description="Optional review text"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate a template"""
    service = TemplateService(db)
    template = await service.get_template(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    result = await service.rate_template(
        template_id=template_id,
        user_id=str(current_user.id),
        rating=rating,
        review=review
    )
    
    return result


@router.get("/{template_id}/preview")
async def generate_template_preview(
    template_id: str = Path(..., description="Template ID"),
    db: Session = Depends(get_db)
):
    """Generate a preview URL for template"""
    service = TemplateService(db)
    template = await service.get_template(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    preview_url = await service.generate_preview(template)
    
    return {
        "preview_url": preview_url,
        "template_id": template_id
    }


# Additional V1 compatibility endpoints
@router.get("/app-types")
async def get_app_types(db: Session = Depends(get_db)):
    """Get available app types"""
    return {
        "app_types": [
            {
                "id": "website",
                "name": "Website",
                "description": "Static or dynamic websites",
                "icon": "Globe",
                "templates_count": 15
            },
            {
                "id": "ecommerce",
                "name": "E-commerce",
                "description": "Online stores and marketplaces",
                "icon": "ShoppingCart",
                "templates_count": 8
            },
            {
                "id": "blog",
                "name": "Blog",
                "description": "Personal or professional blogs",
                "icon": "FileText",
                "templates_count": 6
            },
            {
                "id": "portfolio",
                "name": "Portfolio",
                "description": "Showcase your work",
                "icon": "Briefcase",
                "templates_count": 10
            },
            {
                "id": "business",
                "name": "Business",
                "description": "Corporate and business sites",
                "icon": "Building",
                "templates_count": 12
            },
            {
                "id": "landing",
                "name": "Landing Page",
                "description": "Marketing and product landing pages",
                "icon": "Rocket",
                "templates_count": 8
            },
            {
                "id": "saas",
                "name": "SaaS",
                "description": "Software as a Service platforms",
                "icon": "Cloud",
                "templates_count": 5
            },
            {
                "id": "agency",
                "name": "Agency",
                "description": "Creative and digital agencies",
                "icon": "Palette",
                "templates_count": 7
            }
        ]
    }


@router.get("/elements")
async def get_template_elements(db: Session = Depends(get_db)):
    """Get available template elements"""
    return {
        "elements": [
            {
                "category": "layout",
                "name": "Layout",
                "icon": "Layout",
                "elements": [
                    {"id": "navbar", "name": "Navigation Bar", "description": "Site navigation", "icon": "Menu"},
                    {"id": "header", "name": "Header", "description": "Page header", "icon": "Header"},
                    {"id": "footer", "name": "Footer", "description": "Page footer", "icon": "Footer"},
                    {"id": "sidebar", "name": "Sidebar", "description": "Side navigation", "icon": "Sidebar"}
                ]
            },
            {
                "category": "content",
                "name": "Content",
                "icon": "FileText",
                "elements": [
                    {"id": "hero", "name": "Hero Section", "description": "Main banner", "icon": "Star"},
                    {"id": "features", "name": "Features", "description": "Feature showcase", "icon": "Grid"},
                    {"id": "testimonials", "name": "Testimonials", "description": "Customer reviews", "icon": "MessageSquare"},
                    {"id": "pricing", "name": "Pricing", "description": "Pricing tables", "icon": "DollarSign"},
                    {"id": "faq", "name": "FAQ", "description": "Frequently asked questions", "icon": "HelpCircle"},
                    {"id": "contact", "name": "Contact", "description": "Contact forms and info", "icon": "Mail"}
                ]
            },
            {
                "category": "media",
                "name": "Media",
                "icon": "Image",
                "elements": [
                    {"id": "gallery", "name": "Gallery", "description": "Image galleries", "icon": "Images"},
                    {"id": "video", "name": "Video", "description": "Video players", "icon": "Play"},
                    {"id": "carousel", "name": "Carousel", "description": "Image carousels", "icon": "RotateCw"}
                ]
            },
            {
                "category": "ecommerce",
                "name": "E-commerce",
                "icon": "ShoppingCart",
                "elements": [
                    {"id": "product", "name": "Product", "description": "Product displays", "icon": "Package"},
                    {"id": "cart", "name": "Shopping Cart", "description": "Shopping cart", "icon": "ShoppingCart"},
                    {"id": "checkout", "name": "Checkout", "description": "Checkout forms", "icon": "CreditCard"}
                ]
            },
            {
                "category": "forms",
                "name": "Forms",
                "icon": "FileText",
                "elements": [
                    {"id": "form", "name": "Contact Form", "description": "Contact forms", "icon": "Mail"},
                    {"id": "newsletter", "name": "Newsletter", "description": "Newsletter signup", "icon": "Send"},
                    {"id": "survey", "name": "Survey", "description": "Survey forms", "icon": "CheckSquare"}
                ]
            }
        ]
    }


@router.get("/elements/{category}")
async def get_elements_by_category(
    category: str = Path(..., description="Element category"),
    db: Session = Depends(get_db)
):
    """Get template elements by category"""
    elements_map = {
        "layout": [
            {"id": "navbar", "name": "Navigation Bar", "description": "Site navigation", "icon": "Menu"},
            {"id": "header", "name": "Header", "description": "Page header", "icon": "Header"},
            {"id": "footer", "name": "Footer", "description": "Page footer", "icon": "Footer"},
            {"id": "sidebar", "name": "Sidebar", "description": "Side navigation", "icon": "Sidebar"}
        ],
        "content": [
            {"id": "hero", "name": "Hero Section", "description": "Main banner", "icon": "Star"},
            {"id": "features", "name": "Features", "description": "Feature showcase", "icon": "Grid"},
            {"id": "testimonials", "name": "Testimonials", "description": "Customer reviews", "icon": "MessageSquare"},
            {"id": "pricing", "name": "Pricing", "description": "Pricing tables", "icon": "DollarSign"}
        ],
        "media": [
            {"id": "gallery", "name": "Gallery", "description": "Image galleries", "icon": "Images"},
            {"id": "video", "name": "Video", "description": "Video players", "icon": "Play"},
            {"id": "carousel", "name": "Carousel", "description": "Image carousels", "icon": "RotateCw"}
        ],
        "ecommerce": [
            {"id": "product", "name": "Product", "description": "Product displays", "icon": "Package"},
            {"id": "cart", "name": "Shopping Cart", "description": "Shopping cart", "icon": "ShoppingCart"},
            {"id": "checkout", "name": "Checkout", "description": "Checkout forms", "icon": "CreditCard"}
        ],
        "forms": [
            {"id": "form", "name": "Contact Form", "description": "Contact forms", "icon": "Mail"},
            {"id": "newsletter", "name": "Newsletter", "description": "Newsletter signup", "icon": "Send"},
            {"id": "survey", "name": "Survey", "description": "Survey forms", "icon": "CheckSquare"}
        ]
    }
    
    return {
        "category": category,
        "elements": elements_map.get(category, [])
    }