"""
Template API Routes
Template marketplace, creation, and management
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid
import json

from core.database import get_db, Template, User, App
from core.auth import get_current_user, get_current_active_user
from services.template_service import TemplateService, PREMADE_TEMPLATES, SECTION_TEMPLATES
from services.ai_service import AIService

router = APIRouter()

# Pydantic models
class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., description="Template category: business, ecommerce, portfolio, etc.")
    config: Dict[str, Any] = Field(default_factory=dict)
    pages_config: Dict[str, Any] = Field(default_factory=dict)
    is_premium: bool = Field(False, description="Whether template requires premium subscription")
    price: int = Field(0, description="Price in cents (0 for free)")
    tags: List[str] = Field(default_factory=list)

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    pages_config: Optional[Dict[str, Any]] = None
    is_premium: Optional[bool] = None
    price: Optional[int] = None
    tags: Optional[List[str]] = None

class TemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    category: str
    preview_image: Optional[str]
    demo_url: Optional[str]
    is_premium: bool
    price: int
    downloads: int
    rating: int
    tags: List[str]
    creator: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TemplateListResponse(BaseModel):
    templates: List[TemplateResponse]
    total: int
    page: int
    per_page: int
    categories: List[str]
    featured: List[TemplateResponse]

class TemplateInstallRequest(BaseModel):
    app_name: str = Field(..., min_length=1, max_length=255)
    app_description: Optional[str] = None
    customizations: Dict[str, Any] = Field(default_factory=dict)

class AITemplateRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=1000)
    app_type: str = Field(..., description="Type of app: website, ecommerce, portfolio, etc.")
    industry: Optional[str] = None
    style: Optional[str] = Field("modern", description="Design style: modern, classic, minimal, etc.")
    color_scheme: Optional[str] = Field("blue", description="Primary color scheme")
    features: List[str] = Field(default_factory=list, description="Required features")


@router.get("/", response_model=TemplateListResponse)
async def list_templates(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_premium: Optional[bool] = Query(None),
    sort_by: str = Query("popular", description="Sort by: popular, newest, rating, price"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    db: Session = Depends(get_db)
):
    """
    List all available templates
    
    Browse the template marketplace with filtering and search capabilities.
    """
    
    template_service = TemplateService(db)
    
    # Parse tags
    tag_list = tags.split(",") if tags else []
    
    result = await template_service.list_templates(
        page=page,
        per_page=per_page,
        category=category,
        search=search,
        is_premium=is_premium,
        sort_by=sort_by,
        tags=tag_list
    )
    
    return TemplateListResponse(**result)


@router.get("/categories")
async def get_template_categories(db: Session = Depends(get_db)):
    """
    Get all template categories
    
    Returns available template categories with counts.
    """
    
    template_service = TemplateService(db)
    categories = await template_service.get_categories()
    
    return categories


@router.get("/featured")
async def get_featured_templates(
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Get featured templates
    
    Returns curated featured templates for the homepage.
    """
    
    template_service = TemplateService(db)
    featured = await template_service.get_featured_templates(limit)
    
    return {"featured": featured}


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db)
):
    """
    Get template details
    
    Returns detailed information about a specific template.
    """
    
    template = db.query(Template).filter(Template.id == template_id).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Increment view count (for analytics)
    template_service = TemplateService(db)
    await template_service.increment_views(template_id)
    
    return TemplateResponse.from_orm(template)


@router.post("/", response_model=TemplateResponse)
async def create_template(
    template_data: TemplateCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new template
    
    Creates a template that can be shared in the marketplace.
    """
    
    template_service = TemplateService(db)
    
    try:
        template = await template_service.create_template(
            creator_id=current_user.id,
            name=template_data.name,
            description=template_data.description,
            category=template_data.category,
            config=template_data.config,
            pages_config=template_data.pages_config,
            is_premium=template_data.is_premium,
            price=template_data.price,
            tags=template_data.tags
        )
        
        return TemplateResponse.from_orm(template)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: uuid.UUID = Path(...),
    template_data: TemplateUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a template
    
    Updates template information. Only the creator can update their templates.
    """
    
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.creator_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found or not authorized")
    
    # Update fields
    update_data = template_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    template.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(template)
    
    return TemplateResponse.from_orm(template)


@router.delete("/{template_id}")
async def delete_template(
    template_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a template
    
    Removes template from marketplace. Only the creator can delete their templates.
    """
    
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.creator_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found or not authorized")
    
    db.delete(template)
    db.commit()
    
    return {"message": "Template deleted successfully"}


@router.post("/{template_id}/install")
async def install_template(
    template_id: uuid.UUID = Path(...),
    install_data: TemplateInstallRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Install template as new app
    
    Creates a new app based on the selected template with customizations.
    """
    
    template = db.query(Template).filter(Template.id == template_id).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check if user has access to premium templates
    if template.is_premium and not current_user.is_premium:
        raise HTTPException(
            status_code=403, 
            detail="Premium subscription required for this template"
        )
    
    template_service = TemplateService(db)
    
    try:
        app = await template_service.install_template(
            template=template,
            user_id=current_user.id,
            app_name=install_data.app_name,
            app_description=install_data.app_description,
            customizations=install_data.customizations
        )
        
        # Increment download count
        template.downloads += 1
        db.commit()
        
        return {
            "message": "Template installed successfully",
            "app_id": str(app.id),
            "app_name": app.name,
            "app_slug": app.slug
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to install template: {str(e)}")


@router.post("/{template_id}/preview")
async def preview_template(
    template_id: uuid.UUID = Path(...),
    customizations: Dict[str, Any] = {},
    db: Session = Depends(get_db)
):
    """
    Generate template preview
    
    Creates a temporary preview of the template with optional customizations.
    """
    
    template = db.query(Template).filter(Template.id == template_id).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template_service = TemplateService(db)
    
    try:
        preview_url = await template_service.generate_preview(
            template=template,
            customizations=customizations
        )
        
        return {
            "preview_url": preview_url,
            "expires_in": "1 hour",
            "template_id": str(template_id)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")


@router.post("/{template_id}/rate")
async def rate_template(
    template_id: uuid.UUID = Path(...),
    rating: int = Field(..., ge=1, le=5),
    review: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Rate and review a template
    
    Allows users to rate templates they have used.
    """
    
    template = db.query(Template).filter(Template.id == template_id).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template_service = TemplateService(db)
    
    result = await template_service.rate_template(
        template_id=template_id,
        user_id=current_user.id,
        rating=rating,
        review=review
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/generate-ai-template")
async def generate_ai_template(
    request: AITemplateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate template using AI
    
    Creates a custom template based on AI-generated design and content.
    Premium feature only.
    """
    
    if not current_user.is_premium:
        raise HTTPException(
            status_code=403,
            detail="Premium subscription required for AI template generation"
        )
    
    ai_service = AIService()
    template_service = TemplateService(db)
    
    try:
        # Generate template using AI
        ai_template = await ai_service.generate_template(
            prompt=request.prompt,
            app_type=request.app_type,
            industry=request.industry,
            style=request.style,
            color_scheme=request.color_scheme,
            features=request.features
        )
        
        # Create template from AI generation
        template = await template_service.create_template_from_ai(
            creator_id=current_user.id,
            ai_template=ai_template,
            name=f"AI Generated - {request.app_type.title()}",
            category=request.app_type
        )
        
        return {
            "message": "AI template generated successfully",
            "template_id": str(template.id),
            "template": TemplateResponse.from_orm(template)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI template generation failed: {str(e)}")


@router.post("/{template_id}/upload-preview")
async def upload_preview_image(
    template_id: uuid.UUID = Path(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload preview image for template
    
    Uploads a preview image for the template. Only the creator can upload images.
    """
    
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.creator_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found or not authorized")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    template_service = TemplateService(db)
    
    try:
        image_url = await template_service.upload_preview_image(
            template_id=template_id,
            file=file
        )
        
        template.preview_image = image_url
        template.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "message": "Preview image uploaded successfully",
            "image_url": image_url
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")


@router.get("/my-templates")
async def get_my_templates(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get templates created by current user
    
    Returns all templates created by the authenticated user.
    """
    
    templates = db.query(Template).filter(
        Template.creator_id == current_user.id
    ).order_by(Template.created_at.desc()).all()
    
    return {
        "templates": [TemplateResponse.from_orm(template) for template in templates],
        "total": len(templates)
    }


@router.get("/analytics/{template_id}")
async def get_template_analytics(
    template_id: uuid.UUID = Path(...),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get template analytics
    
    Returns analytics data for templates created by the user.
    """
    
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.creator_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found or not authorized")
    
    template_service = TemplateService(db)
    analytics = await template_service.get_template_analytics(template_id, days)
    
    return analytics



# ============================================
# Premade Templates Endpoints (No Auth Required)
# ============================================

@router.get("/premade/list")
async def list_premade_templates(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None, description="Comma-separated tags")
):
    """
    List all premade templates
    
    Returns built-in page templates that users can use to start their projects.
    No authentication required.
    """
    
    templates = list(PREMADE_TEMPLATES.values())
    
    # Filter by category
    if category:
        templates = [t for t in templates if t["category"] == category]
    
    # Filter by search
    if search:
        search_lower = search.lower()
        templates = [t for t in templates if 
            search_lower in t["name"].lower() or 
            search_lower in t["description"].lower() or
            any(search_lower in tag for tag in t.get("tags", []))]
    
    # Filter by tags
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        templates = [t for t in templates if 
            any(tag in t.get("tags", []) for tag in tag_list)]
    
    # Get categories with counts
    categories = {}
    for t in PREMADE_TEMPLATES.values():
        cat = t["category"]
        if cat not in categories:
            categories[cat] = {"id": cat, "name": cat.replace("-", " ").title(), "count": 0}
        categories[cat]["count"] += 1
    
    return {
        "templates": templates,
        "total": len(templates),
        "categories": list(categories.values())
    }


@router.get("/premade/{template_id}")
async def get_premade_template(template_id: str = Path(...)):
    """
    Get a specific premade template
    
    Returns detailed information about a premade template including all pages and elements.
    """
    
    template = PREMADE_TEMPLATES.get(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template


@router.post("/premade/{template_id}/use")
async def use_premade_template(
    template_id: str = Path(...),
    app_name: str = Query(..., min_length=1, max_length=255),
    app_description: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new app from a premade template
    
    Creates a new app with all pages and elements from the selected template.
    """
    
    template = PREMADE_TEMPLATES.get(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template_service = TemplateService(db)
    
    try:
        app = await template_service.install_template(
            template=template,
            user_id=str(current_user.id),
            app_name=app_name,
            app_description=app_description
        )
        
        return {
            "message": "App created successfully from template",
            "app_id": app["id"],
            "app_name": app["name"],
            "app_slug": app["slug"],
            "pages": len(template.get("pages", []))
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create app: {str(e)}")


@router.get("/sections/list")
async def list_section_templates(
    category: Optional[str] = Query(None)
):
    """
    List all section templates
    
    Returns reusable section templates that can be added to any page.
    """
    
    sections = list(SECTION_TEMPLATES.values())
    
    if category:
        sections = [s for s in sections if s["category"] == category]
    
    # Get categories
    categories = list(set(s["category"] for s in SECTION_TEMPLATES.values()))
    
    return {
        "sections": sections,
        "total": len(sections),
        "categories": categories
    }


@router.get("/sections/{section_id}")
async def get_section_template(section_id: str = Path(...)):
    """
    Get a specific section template
    
    Returns the element configuration for a section template.
    """
    
    section = SECTION_TEMPLATES.get(section_id)
    
    if not section:
        raise HTTPException(status_code=404, detail="Section template not found")
    
    return section


@router.get("/premade/categories")
async def get_premade_categories():
    """
    Get all premade template categories
    
    Returns categories with counts for filtering.
    """
    
    categories = {}
    for template in PREMADE_TEMPLATES.values():
        cat = template["category"]
        if cat not in categories:
            categories[cat] = {
                "id": cat,
                "name": cat.replace("-", " ").title(),
                "count": 0,
                "icon": _get_category_icon(cat)
            }
        categories[cat]["count"] += 1
    
    return {"categories": list(categories.values())}


def _get_category_icon(category: str) -> str:
    """Get icon name for category"""
    icons = {
        "landing": "Rocket",
        "portfolio": "Briefcase",
        "ecommerce": "ShoppingCart",
        "business": "Building",
        "blog": "FileText",
        "restaurant": "Utensils",
        "event": "Calendar",
        "saas": "Cloud",
        "agency": "Palette",
        "real-estate": "Home",
        "erp": "Building",
        "lms": "FileText",
        "crm": "Briefcase",
        "management": "Layout",
        "shop": "ShoppingCart",
        "hr": "Briefcase",
        "booking": "Calendar",
        "healthcare": "Building",
        "fitness": "Rocket",
        "hospitality": "Home",
        "education": "FileText",
        "beauty": "Palette"
    }
    return icons.get(category, "Layout")
