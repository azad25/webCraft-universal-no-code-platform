"""
AI Integration Service for WebCraft Platform
Integrates with OpenAI, Google Gemini, and other AI services
"""

import openai
import google.generativeai as genai
from typing import Dict, List, Optional, Any, Union
import json
import os
import asyncio
import aiohttp
from datetime import datetime
import uuid

from core.database import Session, App, User, Page
from services.content_service import ContentService

class AIService:
    """Main AI service for content generation, design assistance, and automation"""
    
    def __init__(self):
        # Initialize AI clients
        self.openai_client = openai.AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        genai.configure(api_key=os.getenv("GOOGLE_AI_API_KEY"))
        self.gemini_model = genai.GenerativeModel('gemini-pro')
        
        # AI service configurations
        self.ai_configs = {
            "openai": {
                "models": {
                    "text": "gpt-4-turbo-preview",
                    "code": "gpt-4",
                    "image": "dall-e-3"
                },
                "max_tokens": 4000,
                "temperature": 0.7
            },
            "gemini": {
                "model": "gemini-pro",
                "max_tokens": 8000,
                "temperature": 0.7
            }
        }
    
    async def generate_content(
        self,
        prompt: str,
        content_type: str = "text",
        provider: str = "openai",
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate content using AI
        
        Args:
            prompt: The content generation prompt
            content_type: Type of content (text, code, image, etc.)
            provider: AI provider (openai, gemini)
            context: Additional context for generation
            user_id: User ID for usage tracking
        
        Returns:
            Generated content with metadata
        """
        
        try:
            if provider == "openai":
                return await self._generate_with_openai(prompt, content_type, context)
            elif provider == "gemini":
                return await self._generate_with_gemini(prompt, content_type, context)
            else:
                raise ValueError(f"Unsupported AI provider: {provider}")
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "content": None,
                "metadata": {
                    "provider": provider,
                    "content_type": content_type,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    async def _generate_with_openai(
        self,
        prompt: str,
        content_type: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate content using OpenAI"""
        
        config = self.ai_configs["openai"]
        
        if content_type == "image":
            # Generate image with DALL-E
            response = await self.openai_client.images.generate(
                model=config["models"]["image"],
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1
            )
            
            return {
                "success": True,
                "content": {
                    "type": "image",
                    "url": response.data[0].url,
                    "prompt": prompt
                },
                "metadata": {
                    "provider": "openai",
                    "model": config["models"]["image"],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        
        else:
            # Generate text/code content
            model = config["models"].get(content_type, config["models"]["text"])
            
            # Build system message based on content type
            system_messages = {
                "text": "You are a professional content writer. Create engaging, SEO-friendly content.",
                "code": "You are an expert developer. Write clean, efficient, and well-documented code.",
                "marketing": "You are a marketing expert. Create compelling marketing copy that converts.",
                "seo": "You are an SEO specialist. Create content optimized for search engines and user engagement."
            }
            
            system_message = system_messages.get(content_type, system_messages["text"])
            
            # Add context if provided
            if context:
                context_str = f"\nContext: {json.dumps(context, indent=2)}"
                prompt += context_str
            
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=config["max_tokens"],
                temperature=config["temperature"]
            )
            
            return {
                "success": True,
                "content": {
                    "type": content_type,
                    "text": response.choices[0].message.content,
                    "prompt": prompt
                },
                "metadata": {
                    "provider": "openai",
                    "model": model,
                    "tokens_used": response.usage.total_tokens,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    async def _generate_with_gemini(
        self,
        prompt: str,
        content_type: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate content using Google Gemini"""
        
        # Add context if provided
        if context:
            context_str = f"\nContext: {json.dumps(context, indent=2)}"
            prompt += context_str
        
        # Add content type specific instructions
        content_instructions = {
            "text": "Create engaging, well-structured content.",
            "code": "Write clean, efficient code with proper documentation.",
            "marketing": "Create compelling marketing copy that drives action.",
            "seo": "Optimize content for search engines while maintaining readability."
        }
        
        instruction = content_instructions.get(content_type, content_instructions["text"])
        full_prompt = f"{instruction}\n\n{prompt}"
        
        response = self.gemini_model.generate_content(full_prompt)
        
        return {
            "success": True,
            "content": {
                "type": content_type,
                "text": response.text,
                "prompt": prompt
            },
            "metadata": {
                "provider": "gemini",
                "model": "gemini-pro",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    
    async def generate_app_content(
        self,
        app: App,
        content_requests: List[Dict[str, Any]],
        user_id: str
    ) -> Dict[str, Any]:
        """
        Generate comprehensive content for an app
        
        Args:
            app: The app to generate content for
            content_requests: List of content generation requests
            user_id: User ID for tracking
        
        Returns:
            Generated content organized by type
        """
        
        app_context = {
            "app_name": app.name,
            "app_type": app.app_type,
            "description": app.description,
            "config": app.config,
            "theme": app.theme_config
        }
        
        results = {}
        
        for request in content_requests:
            content_type = request.get("type", "text")
            prompt = request.get("prompt", "")
            provider = request.get("provider", "openai")
            
            # Generate content
            result = await self.generate_content(
                prompt=prompt,
                content_type=content_type,
                provider=provider,
                context=app_context,
                user_id=user_id
            )
            
            results[request.get("key", f"{content_type}_{len(results)}")] = result
        
        return {
            "app_id": str(app.id),
            "generated_content": results,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def generate_page_content(
        self,
        page: Page,
        sections: List[str],
        provider: str = "openai"
    ) -> Dict[str, Any]:
        """Generate content for specific page sections"""
        
        page_context = {
            "page_title": page.title,
            "page_slug": page.slug,
            "app_type": page.app.app_type if page.app else "website",
            "existing_content": page.content
        }
        
        generated_sections = {}
        
        for section in sections:
            prompt = self._build_section_prompt(section, page_context)
            
            result = await self.generate_content(
                prompt=prompt,
                content_type="text",
                provider=provider,
                context=page_context
            )
            
            generated_sections[section] = result
        
        return {
            "page_id": str(page.id),
            "sections": generated_sections,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _build_section_prompt(self, section: str, context: Dict[str, Any]) -> str:
        """Build prompts for different page sections"""
        
        prompts = {
            "hero": f"Create a compelling hero section for a {context.get('app_type', 'website')} page titled '{context.get('page_title')}'. Include a headline, subheadline, and call-to-action.",
            
            "about": f"Write an engaging about section for '{context.get('page_title')}'. Make it personal and trustworthy.",
            
            "features": f"Create a features section highlighting the key benefits and capabilities of this {context.get('app_type', 'service')}.",
            
            "testimonials": f"Generate realistic testimonials for a {context.get('app_type', 'business')} called '{context.get('page_title')}'.",
            
            "faq": f"Create a comprehensive FAQ section for '{context.get('page_title')}' addressing common questions about this {context.get('app_type', 'service')}.",
            
            "contact": f"Write compelling contact section copy that encourages visitors to get in touch about '{context.get('page_title')}'."
        }
        
        return prompts.get(section, f"Create engaging content for the {section} section of '{context.get('page_title')}'.")
    
    async def generate_seo_content(
        self,
        app: App,
        target_keywords: List[str],
        provider: str = "openai"
    ) -> Dict[str, Any]:
        """Generate SEO-optimized content for an app"""
        
        seo_context = {
            "app_name": app.name,
            "app_type": app.app_type,
            "description": app.description,
            "target_keywords": target_keywords,
            "current_seo": app.seo_config
        }
        
        seo_tasks = [
            {
                "key": "meta_title",
                "prompt": f"Create an SEO-optimized meta title for '{app.name}', a {app.app_type}. Include keywords: {', '.join(target_keywords[:3])}. Keep under 60 characters."
            },
            {
                "key": "meta_description",
                "prompt": f"Write a compelling meta description for '{app.name}', a {app.app_type}. Include keywords: {', '.join(target_keywords[:5])}. Keep under 160 characters."
            },
            {
                "key": "h1_headline",
                "prompt": f"Create a powerful H1 headline for '{app.name}' that includes the primary keyword '{target_keywords[0] if target_keywords else app.app_type}'."
            },
            {
                "key": "content_outline",
                "prompt": f"Create a detailed content outline for '{app.name}' that naturally incorporates these keywords: {', '.join(target_keywords)}. Focus on user intent and value."
            }
        ]
        
        seo_results = {}
        
        for task in seo_tasks:
            result = await self.generate_content(
                prompt=task["prompt"],
                content_type="seo",
                provider=provider,
                context=seo_context
            )
            
            seo_results[task["key"]] = result
        
        return {
            "app_id": str(app.id),
            "seo_content": seo_results,
            "target_keywords": target_keywords,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def generate_code_component(
        self,
        component_type: str,
        requirements: Dict[str, Any],
        framework: str = "react",
        provider: str = "openai"
    ) -> Dict[str, Any]:
        """Generate code for custom components"""
        
        code_context = {
            "component_type": component_type,
            "framework": framework,
            "requirements": requirements
        }
        
        prompt = f"""
        Create a {framework} component for a {component_type} with the following requirements:
        {json.dumps(requirements, indent=2)}
        
        The component should be:
        - Modern and responsive
        - Accessible (ARIA compliant)
        - Well-documented with comments
        - Follow best practices for {framework}
        - Include TypeScript types if applicable
        - Use Tailwind CSS for styling
        """
        
        result = await self.generate_content(
            prompt=prompt,
            content_type="code",
            provider=provider,
            context=code_context
        )
        
        return {
            "component_type": component_type,
            "framework": framework,
            "code": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def analyze_content_performance(
        self,
        content: str,
        metrics: Dict[str, Any],
        provider: str = "openai"
    ) -> Dict[str, Any]:
        """Analyze content performance and suggest improvements"""
        
        analysis_prompt = f"""
        Analyze the following content performance and provide actionable improvement suggestions:
        
        Content: {content[:1000]}...
        
        Performance Metrics:
        {json.dumps(metrics, indent=2)}
        
        Provide:
        1. Performance analysis
        2. Specific improvement recommendations
        3. SEO optimization suggestions
        4. User engagement improvements
        5. Conversion optimization tips
        """
        
        result = await self.generate_content(
            prompt=analysis_prompt,
            content_type="text",
            provider=provider,
            context={"metrics": metrics}
        )
        
        return {
            "analysis": result,
            "metrics": metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def generate_marketing_copy(
        self,
        app: App,
        campaign_type: str,
        target_audience: Dict[str, Any],
        provider: str = "openai"
    ) -> Dict[str, Any]:
        """Generate marketing copy for different campaigns"""
        
        marketing_context = {
            "app_name": app.name,
            "app_type": app.app_type,
            "description": app.description,
            "campaign_type": campaign_type,
            "target_audience": target_audience
        }
        
        campaign_prompts = {
            "email": f"Create a compelling email marketing campaign for '{app.name}', a {app.app_type}. Target audience: {target_audience.get('description', 'general users')}.",
            
            "social": f"Generate social media posts for '{app.name}' across different platforms (Facebook, Twitter, LinkedIn, Instagram). Make them engaging and platform-appropriate.",
            
            "ads": f"Create high-converting ad copy for '{app.name}'. Include headlines, descriptions, and call-to-actions for Google Ads and Facebook Ads.",
            
            "landing": f"Write persuasive landing page copy for '{app.name}' that converts visitors into users. Focus on benefits and social proof."
        }
        
        prompt = campaign_prompts.get(campaign_type, f"Create marketing copy for '{app.name}' for a {campaign_type} campaign.")
        
        result = await self.generate_content(
            prompt=prompt,
            content_type="marketing",
            provider=provider,
            context=marketing_context
        )
        
        return {
            "app_id": str(app.id),
            "campaign_type": campaign_type,
            "marketing_copy": result,
            "target_audience": target_audience,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def get_ai_suggestions(
        self,
        app: App,
        suggestion_type: str = "general",
        provider: str = "openai"
    ) -> Dict[str, Any]:
        """Get AI-powered suggestions for app improvement"""
        
        app_data = {
            "name": app.name,
            "type": app.app_type,
            "description": app.description,
            "config": app.config,
            "seo_config": app.seo_config
        }
        
        suggestion_prompts = {
            "general": f"Analyze this {app.app_type} app and provide specific improvement suggestions for user experience, functionality, and growth.",
            
            "seo": f"Provide detailed SEO improvement recommendations for this {app.app_type} app to increase organic visibility.",
            
            "conversion": f"Suggest conversion rate optimization strategies for this {app.app_type} app to increase user engagement and conversions.",
            
            "features": f"Recommend new features and functionality that would enhance this {app.app_type} app based on current trends and user needs."
        }
        
        prompt = f"""
        {suggestion_prompts.get(suggestion_type, suggestion_prompts['general'])}
        
        App Details:
        {json.dumps(app_data, indent=2)}
        
        Provide actionable, specific recommendations with implementation priorities.
        """
        
        result = await self.generate_content(
            prompt=prompt,
            content_type="text",
            provider=provider,
            context=app_data
        )
        
        return {
            "app_id": str(app.id),
            "suggestion_type": suggestion_type,
            "suggestions": result,
            "timestamp": datetime.utcnow().isoformat()
        }