"""
App Builder API Routes
Core functionality for creating and managing applications
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from core.database import get_db, App, User, Template, Page
from core.auth import get_current_user
from services.app_builder import AppBuilderService
from services.seo_service import SEOService
from services.deployment_service import DeploymentService

router = APIRouter()

# Pydantic models for API
class AppCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    app_type: str = Field(..., description="Type of app: website, ecommerce, crm, erp, etc.")
    template_id: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    theme_config: Dict[str, Any] = Field(default_factory=dict)

class AppUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    theme_config: Optional[Dict[str, Any]] = None
    seo_config: Optional[Dict[str, Any]] = None

class AppResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    app_type: str
    is_published: bool
    custom_domain: Optional[str]
    subdomain: Optional[str]
    config: Dict[str, Any]
    theme_config: Dict[str, Any]
    seo_config: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AppListResponse(BaseModel):
    apps: List[AppResponse]
    total: int
    page: int
    per_page: int

class PublishRequest(BaseModel):
    custom_domain: Optional[str] = None
    subdomain: Optional[str] = None


@router.get("/", response_model=AppListResponse)
async def list_apps(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    app_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all apps for the current user
    
    - **page**: Page number (starts from 1)
    - **per_page**: Number of apps per page (max 100)
    - **app_type**: Filter by app type (website, ecommerce, crm, etc.)
    - **search**: Search in app names and descriptions
    """
    
    query = db.query(App).filter(App.owner_id == current_user.id)
    
    # Apply filters
    if app_type:
        query = query.filter(App.app_type == app_type)
    
    if search:
        query = query.filter(
            App.name.ilike(f"%{search}%") | 
            App.description.ilike(f"%{search}%")
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    apps = query.offset((page - 1) * per_page).limit(per_page).all()
    
    return AppListResponse(
        apps=apps,
        total=total,
        page=page,
        per_page=per_page
    )


@router.post("/", response_model=AppResponse)
async def create_app(
    app_data: AppCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new application
    
    Creates a new app with the specified configuration. If a template_id is provided,
    the app will be initialized with the template's configuration and pages.
    """
    
    app_builder = AppBuilderService(db)
    
    try:
        # Create the app
        app = await app_builder.create_app(
            user_id=current_user.id,
            name=app_data.name,
            description=app_data.description,
            app_type=app_data.app_type,
            template_id=app_data.template_id,
            config=app_data.config,
            theme_config=app_data.theme_config
        )
        
        return app
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create app")


@router.get("/{app_id}", response_model=AppResponse)
async def get_app(
    app_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific app by ID
    
    Returns detailed information about the app including configuration,
    theme settings, and SEO configuration.
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    return app


@router.put("/{app_id}", response_model=AppResponse)
async def update_app(
    app_id: uuid.UUID,
    app_data: AppUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing app
    
    Updates app configuration, theme, SEO settings, or basic information.
    Only the provided fields will be updated.
    """
    
    print(f"🔄 Updating app {app_id} for user {current_user.email}")
    print(f"📦 Update data: {app_data.dict(exclude_unset=True)}")
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        print(f"❌ App {app_id} not found for user {current_user.id}")
        raise HTTPException(status_code=404, detail="App not found")
    
    # Update fields
    update_data = app_data.dict(exclude_unset=True)
    print(f"📝 Applying updates: {update_data}")
    
    for field, value in update_data.items():
        setattr(app, field, value)
        print(f"✅ Updated {field}")
    
    app.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(app)
        print(f"💾 App {app_id} saved successfully")
        return app
    except Exception as e:
        print(f"❌ Failed to save app: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save app: {str(e)}")


@router.delete("/{app_id}")
async def delete_app(
    app_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an app
    
    Permanently deletes the app and all associated data including pages,
    widgets, and configurations. This action cannot be undone.
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Delete associated data
    db.query(Page).filter(Page.app_id == app_id).delete()
    
    # Delete the app
    db.delete(app)
    db.commit()
    
    return {"message": "App deleted successfully"}


@router.post("/{app_id}/publish")
async def publish_app(
    app_id: uuid.UUID,
    publish_data: PublishRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Publish an app to make it live
    
    Deploys the app to the hosting infrastructure and makes it accessible
    via custom domain or subdomain. Includes SEO optimization and performance setup.
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    deployment_service = DeploymentService(db)
    seo_service = SEOService(db)
    
    try:
        # Deploy the app
        deployment_result = await deployment_service.deploy_app(
            app=app,
            custom_domain=publish_data.custom_domain,
            subdomain=publish_data.subdomain
        )
        
        # Create live app URL
        live_url_result = await deployment_service.create_live_app_url(
            app=app,
            subdomain=publish_data.subdomain,
            custom_domain=publish_data.custom_domain
        )
        
        # Optimize SEO
        await seo_service.optimize_app_seo(app)
        
        # Update app status
        app.is_published = True
        app.custom_domain = publish_data.custom_domain
        app.subdomain = publish_data.subdomain or app.slug
        app.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": "App published successfully",
            "url": live_url_result["live_url"],
            "subdomain": app.subdomain,
            "custom_domain": app.custom_domain,
            "ssl_enabled": deployment_result.get("ssl_enabled", True),
            "cdn_enabled": deployment_result.get("cdn_enabled", True),
            "deployed_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to publish app: {str(e)}")


@router.get("/{app_id}/deployment/status")
async def get_deployment_status(
    app_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the deployment status of an app
    
    Returns current deployment information including URLs, SSL status,
    and deployment health.
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    if not app.is_published:
        return {
            "status": "not_deployed",
            "message": "App is not published"
        }
    
    deployment_service = DeploymentService(db)
    
    try:
        status = await deployment_service.get_deployment_status(app)
        
        # Add live URLs
        live_url = f"https://{app.custom_domain}" if app.custom_domain else f"https://{app.subdomain}.webcraft.dev"
        subdomain_url = f"https://{app.subdomain}.webcraft.dev" if app.subdomain else None
        
        return {
            **status,
            "live_url": live_url,
            "subdomain_url": subdomain_url,
            "custom_domain": app.custom_domain,
            "ssl_enabled": True,
            "deployed_at": app.updated_at.isoformat() if app.updated_at else None
        }
    
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@router.post("/{app_id}/unpublish")
async def unpublish_app(
    app_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Unpublish an app (take it offline)
    
    Removes the app from public access while preserving all data.
    The app can be republished later.
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    deployment_service = DeploymentService(db)
    
    try:
        await deployment_service.unpublish_app(app)
        
        app.is_published = False
        app.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "App unpublished successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unpublish app: {str(e)}")


@router.get("/{app_id}/preview")
async def preview_app(
    app_id: uuid.UUID = Path(...),
    device: Optional[str] = Query("desktop", regex="^(mobile|tablet|desktop)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get app preview URL
    
    Returns a preview URL for testing the app before publishing.
    Preview URLs are valid for 24 hours and support different device types.
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    try:
        from services.preview_service import PreviewService
        preview_service = PreviewService(db)
        
        preview_data = await preview_service.create_preview_url(app, device)
        
        return preview_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create preview: {str(e)}")


@router.get("/{app_id}/analytics")
async def get_app_analytics(
    app_id: uuid.UUID = Path(...),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get app analytics data
    
    Returns visitor statistics, performance metrics, and SEO data
    for the specified time period.
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # This would integrate with analytics service
    # For now, return mock data
    return {
        "period_days": days,
        "visitors": {
            "total": 1250,
            "unique": 980,
            "returning": 270
        },
        "page_views": 3420,
        "bounce_rate": 0.35,
        "avg_session_duration": 180,
        "top_pages": [
            {"path": "/", "views": 1200},
            {"path": "/about", "views": 450},
            {"path": "/contact", "views": 320}
        ],
        "traffic_sources": {
            "organic": 0.45,
            "direct": 0.30,
            "social": 0.15,
            "referral": 0.10
        },
        "performance": {
            "core_web_vitals": {
                "lcp": 1.2,  # Largest Contentful Paint
                "fid": 0.08,  # First Input Delay
                "cls": 0.05   # Cumulative Layout Shift
            },
            "page_speed_score": 95,
            "mobile_score": 92
        }
    }