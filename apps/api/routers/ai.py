"""
AI Integration API Routes
Content generation, design assistance, and AI-powered features
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from core.database import get_db, App, User, Page
from core.auth import get_current_user, get_current_premium_user
from services.ai_service import AIService

router = APIRouter()

# Pydantic models for AI API
class ContentGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=2000)
    content_type: str = Field("text", description="Type: text, code, image, marketing, seo")
    provider: str = Field("openai", description="AI provider: openai, gemini")
    context: Optional[Dict[str, Any]] = None
    target_audience: Optional[str] = None
    tone: Optional[str] = Field("professional", description="Tone: professional, casual, friendly, formal")
    length: Optional[str] = Field("medium", description="Length: short, medium, long")

class ContentGenerationResponse(BaseModel):
    success: bool
    content: Optional[Dict[str, Any]]
    metadata: Dict[str, Any]
    error: Optional[str] = None

class AppContentRequest(BaseModel):
    content_requests: List[Dict[str, Any]] = Field(..., description="List of content generation requests")
    provider: str = Field("openai", description="AI provider to use")

class PageContentRequest(BaseModel):
    sections: List[str] = Field(..., description="Page sections to generate: hero, about, features, etc.")
    provider: str = Field("openai", description="AI provider to use")

class SEOContentRequest(BaseModel):
    target_keywords: List[str] = Field(..., min_items=1, max_items=10)
    provider: str = Field("openai", description="AI provider to use")

class CodeComponentRequest(BaseModel):
    component_type: str = Field(..., description="Type of component to generate")
    requirements: Dict[str, Any] = Field(..., description="Component requirements and specifications")
    framework: str = Field("react", description="Framework: react, vue, angular")
    provider: str = Field("openai", description="AI provider to use")

class MarketingCopyRequest(BaseModel):
    campaign_type: str = Field(..., description="Campaign type: email, social, ads, landing")
    target_audience: Dict[str, Any] = Field(..., description="Target audience details")
    provider: str = Field("openai", description="AI provider to use")

class ContentAnalysisRequest(BaseModel):
    content: str = Field(..., min_length=50)
    metrics: Dict[str, Any] = Field(..., description="Performance metrics to analyze")
    provider: str = Field("openai", description="AI provider to use")

class AISuggestionsRequest(BaseModel):
    suggestion_type: str = Field("general", description="Type: general, seo, conversion, features")
    provider: str = Field("openai", description="AI provider to use")

class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=1000)
    style: Optional[str] = Field("realistic", description="Image style: realistic, artistic, cartoon, etc.")
    size: Optional[str] = Field("1024x1024", description="Image size: 1024x1024, 1792x1024, etc.")
    provider: str = Field("openai", description="AI provider: openai")


@router.post("/generate-content", response_model=ContentGenerationResponse)
async def generate_content(
    request: ContentGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate content using AI
    
    Creates various types of content including text, code, marketing copy,
    and SEO-optimized content using advanced AI models.
    """
    
    ai_service = AIService()
    
    # Build enhanced context
    enhanced_context = request.context or {}
    enhanced_context.update({
        "user_id": str(current_user.id),
        "target_audience": request.target_audience,
        "tone": request.tone,
        "length": request.length,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    try:
        result = await ai_service.generate_content(
            prompt=request.prompt,
            content_type=request.content_type,
            provider=request.provider,
            context=enhanced_context,
            user_id=str(current_user.id)
        )
        
        return ContentGenerationResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")


@router.post("/generate-image", response_model=ContentGenerationResponse)
async def generate_image(
    request: ImageGenerationRequest,
    current_user: User = Depends(get_current_premium_user),  # Premium feature
    db: Session = Depends(get_db)
):
    """
    Generate images using AI
    
    Creates custom images based on text prompts using DALL-E or other
    image generation models. Premium feature only.
    """
    
    ai_service = AIService()
    
    # Enhance prompt with style information
    enhanced_prompt = request.prompt
    if request.style and request.style != "realistic":
        enhanced_prompt = f"{request.prompt}, {request.style} style"
    
    try:
        result = await ai_service.generate_content(
            prompt=enhanced_prompt,
            content_type="image",
            provider=request.provider,
            context={
                "size": request.size,
                "style": request.style,
                "user_id": str(current_user.id)
            },
            user_id=str(current_user.id)
        )
        
        return ContentGenerationResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@router.post("/apps/{app_id}/generate-content")
async def generate_app_content(
    app_id: uuid.UUID,
    request: AppContentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate comprehensive content for an app
    
    Creates multiple types of content for an app including descriptions,
    marketing copy, feature lists, and more based on the app's configuration.
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    ai_service = AIService()
    
    try:
        result = await ai_service.generate_app_content(
            app=app,
            content_requests=request.content_requests,
            user_id=str(current_user.id)
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"App content generation failed: {str(e)}")


@router.post("/apps/{app_id}/pages/{page_id}/generate-content")
async def generate_page_content(
    app_id: uuid.UUID,
    page_id: uuid.UUID,
    request: PageContentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate content for specific page sections
    
    Creates content for individual page sections like hero, about, features,
    testimonials, FAQ, and contact sections.
    """
    
    page = db.query(Page).join(App).filter(
        Page.id == page_id,
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    ai_service = AIService()
    
    try:
        result = await ai_service.generate_page_content(
            page=page,
            sections=request.sections,
            provider=request.provider
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Page content generation failed: {str(e)}")


@router.post("/apps/{app_id}/generate-seo")
async def generate_seo_content(
    app_id: uuid.UUID,
    request: SEOContentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate SEO-optimized content for an app
    
    Creates meta titles, descriptions, headlines, and content outlines
    optimized for search engines and target keywords.
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    ai_service = AIService()
    
    try:
        result = await ai_service.generate_seo_content(
            app=app,
            target_keywords=request.target_keywords,
            provider=request.provider
        )
        
        # Update app SEO config with generated content
        if result.get("seo_content"):
            seo_updates = {}
            for key, content in result["seo_content"].items():
                if content.get("success") and content.get("content"):
                    seo_updates[key] = content["content"]["text"]
            
            if seo_updates:
                app.seo_config = {**app.seo_config, **seo_updates}
                app.updated_at = datetime.utcnow()
                db.commit()
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SEO content generation failed: {str(e)}")


@router.post("/generate-component")
async def generate_code_component(
    request: CodeComponentRequest,
    current_user: User = Depends(get_current_premium_user),  # Premium feature
    db: Session = Depends(get_db)
):
    """
    Generate custom code components
    
    Creates React, Vue, or Angular components based on specifications.
    Includes TypeScript types, accessibility features, and best practices.
    Premium feature only.
    """
    
    ai_service = AIService()
    
    try:
        result = await ai_service.generate_code_component(
            component_type=request.component_type,
            requirements=request.requirements,
            framework=request.framework,
            provider=request.provider
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Component generation failed: {str(e)}")


@router.post("/apps/{app_id}/generate-marketing")
async def generate_marketing_copy(
    app_id: uuid.UUID,
    request: MarketingCopyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate marketing copy for different campaigns
    
    Creates email campaigns, social media posts, ad copy, and landing page
    content tailored to specific target audiences.
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    ai_service = AIService()
    
    try:
        result = await ai_service.generate_marketing_copy(
            app=app,
            campaign_type=request.campaign_type,
            target_audience=request.target_audience,
            provider=request.provider
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Marketing copy generation failed: {str(e)}")


@router.post("/analyze-content")
async def analyze_content_performance(
    request: ContentAnalysisRequest,
    current_user: User = Depends(get_current_premium_user),  # Premium feature
    db: Session = Depends(get_db)
):
    """
    Analyze content performance and get improvement suggestions
    
    Uses AI to analyze content performance metrics and provide actionable
    recommendations for improvement. Premium feature only.
    """
    
    ai_service = AIService()
    
    try:
        result = await ai_service.analyze_content_performance(
            content=request.content,
            metrics=request.metrics,
            provider=request.provider
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content analysis failed: {str(e)}")


@router.post("/apps/{app_id}/suggestions")
async def get_ai_suggestions(
    app_id: uuid.UUID,
    request: AISuggestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get AI-powered improvement suggestions for an app
    
    Analyzes the app and provides specific recommendations for improving
    user experience, SEO, conversions, and feature development.
    """
    
    app = db.query(App).filter(
        App.id == app_id,
        App.owner_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    ai_service = AIService()
    
    try:
        result = await ai_service.get_ai_suggestions(
            app=app,
            suggestion_type=request.suggestion_type,
            provider=request.provider
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI suggestions failed: {str(e)}")


@router.get("/providers")
async def get_ai_providers(
    current_user: User = Depends(get_current_user)
):
    """
    Get available AI providers and their capabilities
    
    Returns information about supported AI providers, their models,
    and feature availability based on user subscription.
    """
    
    providers = {
        "openai": {
            "name": "OpenAI",
            "models": {
                "text": ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"],
                "code": ["gpt-4", "gpt-3.5-turbo"],
                "image": ["dall-e-3", "dall-e-2"]
            },
            "features": ["text_generation", "code_generation", "image_generation"],
            "available": True,
            "premium_only": ["image_generation", "gpt-4"]
        },
        "gemini": {
            "name": "Google Gemini",
            "models": {
                "text": ["gemini-pro"],
                "code": ["gemini-pro"]
            },
            "features": ["text_generation", "code_generation"],
            "available": True,
            "premium_only": []
        }
    }
    
    # Filter features based on user subscription
    if not current_user.is_premium:
        for provider in providers.values():
            provider["features"] = [
                feature for feature in provider["features"]
                if feature not in provider.get("premium_only", [])
            ]
    
    return {
        "providers": providers,
        "user_tier": "premium" if current_user.is_premium else "free",
        "usage_limits": {
            "free": {
                "requests_per_day": 50,
                "image_generations_per_day": 0
            },
            "premium": {
                "requests_per_day": 1000,
                "image_generations_per_day": 100
            }
        }
    }


@router.get("/usage")
async def get_ai_usage(
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365)
):
    """
    Get AI usage statistics for the current user
    
    Returns usage metrics including requests made, tokens consumed,
    and remaining quota for the specified time period.
    """
    
    # This would integrate with usage tracking service
    # For now, return mock data
    return {
        "period_days": days,
        "total_requests": 245,
        "requests_by_type": {
            "text_generation": 180,
            "code_generation": 45,
            "image_generation": 20 if current_user.is_premium else 0
        },
        "tokens_consumed": 125000,
        "remaining_quota": {
            "daily_requests": 950 if current_user.is_premium else 45,
            "daily_images": 80 if current_user.is_premium else 0
        },
        "cost_estimate": 12.50 if current_user.is_premium else 0,
        "top_use_cases": [
            {"type": "content_generation", "count": 85},
            {"type": "seo_optimization", "count": 60},
            {"type": "marketing_copy", "count": 40}
        ]
    }