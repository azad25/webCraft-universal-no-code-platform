"""
AI domain router
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.models import User
from .service import AIService
from .schemas import (
    GenerateContentRequest, GenerateImageRequest,
    DesignSuggestionsRequest, SEOOptimizeRequest,
    AIResponse, AIUsageStatsResponse
)

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/generate", response_model=AIResponse)
async def generate_content(
    data: GenerateContentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate content using AI"""
    service = AIService(db)
    result = await service.generate_content(
        user_id=str(current_user.id),
        content_type=data.content_type,
        prompt=data.prompt,
        provider=data.provider,
        context=data.context,
        app_id=data.app_id
    )
    return AIResponse(success=True, data=result)


@router.post("/generate-image", response_model=AIResponse)
async def generate_image(
    data: GenerateImageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate image using AI"""
    service = AIService(db)
    result = await service.generate_image(
        user_id=str(current_user.id),
        prompt=data.prompt,
        style=data.style,
        size=data.size,
        app_id=data.app_id
    )
    return AIResponse(success=True, data=result)


@router.post("/apps/{app_id}/suggestions", response_model=AIResponse)
async def get_design_suggestions(
    app_id: str,
    data: DesignSuggestionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered design suggestions for an app"""
    service = AIService(db)
    result = await service.get_design_suggestions(
        user_id=str(current_user.id),
        app_id=app_id,
        page_content=data.page_content
    )
    return AIResponse(success=True, data=result)


@router.post("/optimize-seo", response_model=AIResponse)
async def optimize_seo(
    data: SEOOptimizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Optimize content for SEO"""
    service = AIService(db)
    result = await service.optimize_seo(
        user_id=str(current_user.id),
        app_id=data.app_id,
        content=data.content,
        keywords=data.keywords
    )
    return AIResponse(success=True, data=result)


@router.get("/templates")
async def list_templates(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List AI prompt templates"""
    service = AIService(db)
    templates = service.get_templates(category)
    return {"templates": templates}


@router.get("/usage", response_model=AIUsageStatsResponse)
async def get_usage_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI usage statistics"""
    service = AIService(db)
    stats = service.get_usage_stats(str(current_user.id))
    return AIUsageStatsResponse(**stats)


@router.get("/providers")
async def list_providers(current_user: User = Depends(get_current_user)):
    """List available AI providers"""
    return {
        "providers": [
            {
                "id": "openai",
                "name": "OpenAI",
                "models": ["gpt-4", "gpt-3.5-turbo", "dall-e-3"],
                "capabilities": ["text", "code", "image"]
            },
            {
                "id": "gemini",
                "name": "Google Gemini",
                "models": ["gemini-pro", "gemini-pro-vision"],
                "capabilities": ["text", "code", "vision"]
            },
            {
                "id": "claude",
                "name": "Anthropic Claude",
                "models": ["claude-3-opus", "claude-3-sonnet"],
                "capabilities": ["text", "code"]
            }
        ]
    }


# Additional V1-compatible endpoints
@router.post("/generate-content", response_model=AIResponse)
async def generate_content_v1_compat(
    data: GenerateContentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate content using AI (V1 compatible)"""
    service = AIService(db)
    result = await service.generate_content(
        user_id=str(current_user.id),
        content_type=data.content_type,
        prompt=data.prompt,
        provider=data.provider,
        context=data.context,
        app_id=data.app_id
    )
    return AIResponse(success=True, data=result)


@router.post("/apps/{app_id}/generate-content")
async def generate_app_content(
    app_id: str,
    data: GenerateContentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate content for specific app"""
    service = AIService(db)
    result = await service.generate_content(
        user_id=str(current_user.id),
        content_type=data.content_type,
        prompt=data.prompt,
        provider=data.provider,
        context=data.context,
        app_id=app_id
    )
    return AIResponse(success=True, data=result)


@router.post("/apps/{app_id}/pages/{page_id}/generate-content")
async def generate_page_content(
    app_id: str,
    page_id: str,
    data: GenerateContentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate content for specific page"""
    service = AIService(db)
    # Add page context
    enhanced_context = data.context or {}
    enhanced_context.update({"page_id": page_id})
    
    result = await service.generate_content(
        user_id=str(current_user.id),
        content_type=data.content_type,
        prompt=data.prompt,
        provider=data.provider,
        context=enhanced_context,
        app_id=app_id
    )
    return AIResponse(success=True, data=result)


@router.post("/apps/{app_id}/generate-seo")
async def generate_seo_content(
    app_id: str,
    data: SEOOptimizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate SEO content for app"""
    service = AIService(db)
    result = await service.optimize_seo(
        user_id=str(current_user.id),
        app_id=app_id,
        content=data.content,
        keywords=data.keywords
    )
    return AIResponse(success=True, data=result)


@router.post("/generate-component")
async def generate_component(
    data: GenerateContentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate code component"""
    service = AIService(db)
    # Set content type to code for component generation
    result = await service.generate_content(
        user_id=str(current_user.id),
        content_type="code",
        prompt=data.prompt,
        provider=data.provider,
        context=data.context,
        app_id=data.app_id
    )
    return AIResponse(success=True, data=result)


@router.post("/apps/{app_id}/generate-marketing")
async def generate_marketing_content(
    app_id: str,
    data: GenerateContentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate marketing content for app"""
    service = AIService(db)
    result = await service.generate_content(
        user_id=str(current_user.id),
        content_type="marketing",
        prompt=data.prompt,
        provider=data.provider,
        context=data.context,
        app_id=app_id
    )
    return AIResponse(success=True, data=result)


@router.post("/analyze-content")
async def analyze_content(
    data: GenerateContentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze content with AI"""
    service = AIService(db)
    # Set content type to analysis
    result = await service.generate_content(
        user_id=str(current_user.id),
        content_type="analysis",
        prompt=data.prompt,
        provider=data.provider,
        context=data.context,
        app_id=data.app_id
    )
    return AIResponse(success=True, data=result)
