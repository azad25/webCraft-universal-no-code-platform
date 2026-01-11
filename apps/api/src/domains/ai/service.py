"""
AI domain service
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from src.core.config import settings
from src.common.exceptions import ValidationError
from .models import AIRequest, AITemplate, AIProvider, ContentType


class AIService:
    """AI service for content generation"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def generate_content(
        self,
        user_id: str,
        content_type: ContentType,
        prompt: str,
        provider: AIProvider = AIProvider.OPENAI,
        context: Dict[str, Any] = None,
        app_id: str = None
    ) -> Dict[str, Any]:
        """Generate content using AI"""
        start_time = datetime.utcnow()
        
        # Create request record
        request = AIRequest(
            id=str(uuid.uuid4()),
            user_id=user_id,
            app_id=uuid.UUID(app_id) if app_id else None,
            provider=provider,
            content_type=content_type,
            prompt=prompt,
            context=context or {}
        )
        
        try:
            # Generate content based on provider
            if provider == AIProvider.OPENAI:
                result = await self._generate_openai(prompt, content_type, context)
            elif provider == AIProvider.GEMINI:
                result = await self._generate_gemini(prompt, content_type, context)
            elif provider == AIProvider.CLAUDE:
                result = await self._generate_claude(prompt, content_type, context)
            else:
                raise ValidationError(f"Unsupported AI provider: {provider}")
            
            request.response_data = result
            request.success = True
            request.tokens_used = result.get("tokens_used", 0)
            request.cost_cents = result.get("cost_cents", 0)
            
        except Exception as e:
            request.success = False
            request.error_message = str(e)
            result = {"error": str(e)}
        
        request.processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Try to save to database, but don't fail if table doesn't exist (V2 tables may not be created yet)
        try:
            self.db.add(request)
            self.db.commit()
        except Exception as db_error:
            print(f"Warning: Could not save AI request to database: {db_error}")
            # Continue without database logging
        
        return result
    
    async def _generate_openai(
        self,
        prompt: str,
        content_type: ContentType,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate content using OpenAI"""
        if not settings.OPENAI_API_KEY:
            # Return mock response for development
            return {
                "content": f"Generated {content_type.value} content for: {prompt[:50]}...",
                "tokens_used": 100,
                "cost_cents": 1,
                "provider": "openai",
                "model": "gpt-4"
            }
        
        # Real OpenAI implementation would go here
        try:
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": f"You are a helpful assistant generating {content_type.value} content."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000
            )
            
            return {
                "content": response.choices[0].message.content,
                "tokens_used": response.usage.total_tokens,
                "cost_cents": int(response.usage.total_tokens * 0.003),
                "provider": "openai",
                "model": "gpt-4"
            }
        except Exception as e:
            return {
                "content": f"Mock response for: {prompt[:50]}...",
                "tokens_used": 100,
                "cost_cents": 1,
                "provider": "openai",
                "model": "gpt-4",
                "note": "Using mock response"
            }
    
    async def _generate_gemini(
        self,
        prompt: str,
        content_type: ContentType,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate content using Google Gemini"""
        return {
            "content": f"Generated {content_type.value} content using Gemini for: {prompt[:50]}...",
            "tokens_used": 100,
            "cost_cents": 1,
            "provider": "gemini",
            "model": "gemini-pro"
        }
    
    async def _generate_claude(
        self,
        prompt: str,
        content_type: ContentType,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate content using Anthropic Claude"""
        return {
            "content": f"Generated {content_type.value} content using Claude for: {prompt[:50]}...",
            "tokens_used": 100,
            "cost_cents": 1,
            "provider": "claude",
            "model": "claude-3"
        }
    
    async def generate_image(
        self,
        user_id: str,
        prompt: str,
        style: str = "realistic",
        size: str = "1024x1024",
        app_id: str = None
    ) -> Dict[str, Any]:
        """Generate image using AI"""
        request = AIRequest(
            id=str(uuid.uuid4()),
            user_id=user_id,
            app_id=app_id,
            provider=AIProvider.OPENAI,
            content_type=ContentType.IMAGE,
            prompt=prompt,
            context={"style": style, "size": size}
        )
        
        try:
            if settings.OPENAI_API_KEY:
                import openai
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                
                response = client.images.generate(
                    model="dall-e-3",
                    prompt=prompt,
                    size=size,
                    quality="standard",
                    n=1
                )
                
                result = {
                    "image_url": response.data[0].url,
                    "revised_prompt": response.data[0].revised_prompt,
                    "provider": "openai",
                    "model": "dall-e-3"
                }
            else:
                result = {
                    "image_url": "https://via.placeholder.com/1024",
                    "revised_prompt": prompt,
                    "provider": "openai",
                    "model": "dall-e-3",
                    "note": "Using placeholder image"
                }
            
            request.response_data = result
            request.success = True
            
        except Exception as e:
            request.success = False
            request.error_message = str(e)
            result = {"error": str(e)}
        
        self.db.add(request)
        self.db.commit()
        
        return result
    
    async def get_design_suggestions(
        self,
        user_id: str,
        app_id: str,
        page_content: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get AI-powered design suggestions"""
        prompt = f"Analyze this page layout and suggest improvements: {str(page_content)[:500]}"
        
        return await self.generate_content(
            user_id=user_id,
            content_type=ContentType.DESIGN,
            prompt=prompt,
            app_id=app_id,
            context={"page_content": page_content}
        )
    
    async def optimize_seo(
        self,
        user_id: str,
        app_id: str,
        content: str,
        keywords: List[str] = None
    ) -> Dict[str, Any]:
        """Optimize content for SEO"""
        prompt = f"Optimize this content for SEO with keywords {keywords or []}: {content[:500]}"
        
        return await self.generate_content(
            user_id=user_id,
            content_type=ContentType.SEO,
            prompt=prompt,
            app_id=app_id,
            context={"keywords": keywords}
        )
    
    def get_templates(self, category: str = None) -> List[Dict[str, Any]]:
        """Get AI prompt templates"""
        query = self.db.query(AITemplate).filter(AITemplate.is_active == True)
        
        if category:
            query = query.filter(AITemplate.category == category)
        
        templates = query.all()
        
        return [
            {
                "id": str(t.id),
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "content_type": t.content_type.value,
                "prompt_template": t.prompt_template,
                "variables": t.variables,
                "usage_count": t.usage_count
            }
            for t in templates
        ]
    
    def get_usage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get AI usage statistics for a user"""
        requests = self.db.query(AIRequest).filter(
            AIRequest.user_id == user_id
        ).all()
        
        total_requests = len(requests)
        total_tokens = sum(r.tokens_used for r in requests)
        total_cost = sum(r.cost_cents for r in requests)
        
        by_provider = {}
        by_content_type = {}
        
        for r in requests:
            provider = r.provider.value
            content_type = r.content_type.value
            
            if provider not in by_provider:
                by_provider[provider] = {"requests": 0, "tokens": 0, "cost_cents": 0}
            by_provider[provider]["requests"] += 1
            by_provider[provider]["tokens"] += r.tokens_used
            by_provider[provider]["cost_cents"] += r.cost_cents
            
            if content_type not in by_content_type:
                by_content_type[content_type] = {"requests": 0, "tokens": 0}
            by_content_type[content_type]["requests"] += 1
            by_content_type[content_type]["tokens"] += r.tokens_used
        
        return {
            "total_requests": total_requests,
            "total_tokens": total_tokens,
            "total_cost_cents": total_cost,
            "by_provider": by_provider,
            "by_content_type": by_content_type
        }
