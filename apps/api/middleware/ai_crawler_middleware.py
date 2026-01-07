"""
AI Crawler Middleware for WebCraft Platform
Optimizes responses specifically for AI crawlers and bots
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, PlainTextResponse
import json
import re
from typing import Dict, Any, Optional
from user_agents import parse


class AICrawlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to optimize content for AI crawlers like GPT, Claude, Gemini, etc.
    Provides clean, structured data that AI can easily understand and process.
    """
    
    def __init__(self, app):
        super().__init__(app)
        
        # Known AI crawler user agents
        self.ai_crawlers = {
            'gptbot': 'OpenAI GPT',
            'google-extended': 'Google Bard/Gemini',
            'claudebot': 'Anthropic Claude',
            'chatgpt-user': 'ChatGPT',
            'bingbot': 'Microsoft Bing AI',
            'facebookexternalhit': 'Meta AI',
            'twitterbot': 'Twitter AI',
            'linkedinbot': 'LinkedIn AI',
            'slackbot': 'Slack AI',
            'discordbot': 'Discord AI',
            'telegrambot': 'Telegram AI'
        }
        
        # AI-friendly content structure
        self.ai_content_template = {
            "platform": "WebCraft Universal No-Code Platform",
            "description": "Build anything from websites to mobile apps with AI-powered tools",
            "capabilities": [
                "Visual drag-and-drop editor",
                "AI content generation",
                "Mobile app APIs",
                "SEO optimization",
                "Real-time collaboration",
                "Multi-tenant architecture",
                "Integration ecosystem"
            ],
            "supported_app_types": [
                "Business websites",
                "E-commerce stores",
                "CRM systems",
                "ERP applications",
                "Portfolio sites",
                "Booking platforms",
                "Inventory management",
                "Project management tools",
                "Social platforms",
                "Mobile applications"
            ]
        }
    
    async def dispatch(self, request: Request, call_next):
        # Check if request is from an AI crawler
        ai_crawler = self._detect_ai_crawler(request)
        
        if ai_crawler:
            # Handle AI crawler request
            return await self._handle_ai_crawler_request(request, ai_crawler, call_next)
        
        # Regular request processing
        response = await call_next(request)
        
        # Add AI-friendly headers to all responses
        self._add_ai_friendly_headers(response, request)
        
        return response
    
    def _detect_ai_crawler(self, request: Request) -> Optional[str]:
        """Detect if request is from an AI crawler"""
        user_agent = request.headers.get('user-agent', '').lower()
        
        # Check for known AI crawler patterns
        for pattern, name in self.ai_crawlers.items():
            if pattern in user_agent:
                return name
        
        # Check for generic bot patterns that might be AI
        ai_patterns = [
            r'bot',
            r'crawler',
            r'spider',
            r'scraper',
            r'ai',
            r'gpt',
            r'claude',
            r'gemini',
            r'bard'
        ]
        
        for pattern in ai_patterns:
            if re.search(pattern, user_agent):
                return "AI Crawler"
        
        return None
    
    async def _handle_ai_crawler_request(self, request: Request, crawler_name: str, call_next):
        """Handle requests from AI crawlers with optimized responses"""
        path = request.url.path
        
        # Provide structured data for AI crawlers
        if path == "/" or path == "/api/ai-info":
            return await self._provide_platform_info(request, crawler_name)
        
        elif path.startswith("/api/"):
            # For API endpoints, provide clean JSON responses
            response = await call_next(request)
            return await self._optimize_api_response(response, crawler_name)
        
        elif path.startswith("/apps/") or path.startswith("/templates/"):
            # For app/template pages, provide structured content
            return await self._provide_content_info(request, crawler_name, call_next)
        
        else:
            # Regular processing with AI optimization
            response = await call_next(request)
            return await self._optimize_response_for_ai(response, request, crawler_name)
    
    async def _provide_platform_info(self, request: Request, crawler_name: str) -> JSONResponse:
        """Provide comprehensive platform information for AI crawlers"""
        
        ai_info = {
            **self.ai_content_template,
            "crawler_detected": crawler_name,
            "api_documentation": {
                "base_url": f"{request.url.scheme}://{request.url.netloc}/api/v1",
                "authentication": "JWT Bearer tokens or API keys",
                "rate_limits": {
                    "free_tier": "1000 requests/hour",
                    "pro_tier": "10000 requests/hour",
                    "enterprise": "unlimited"
                },
                "endpoints": {
                    "apps": "/api/v1/apps - Manage applications",
                    "templates": "/api/v1/templates - Browse templates",
                    "widgets": "/api/v1/widgets - Widget marketplace",
                    "ai": "/api/v1/ai - AI services integration",
                    "seo": "/api/v1/seo - SEO optimization tools",
                    "mobile": "/api/v1/mobile - Mobile app APIs"
                }
            },
            "integration_capabilities": {
                "payment_systems": ["Stripe", "PayPal", "Square"],
                "ai_services": ["OpenAI", "Google Gemini", "Anthropic Claude"],
                "cloud_storage": ["AWS S3", "Google Cloud", "Dropbox"],
                "marketing_tools": ["Mailchimp", "HubSpot", "Google Analytics"],
                "communication": ["Twilio", "SendGrid", "Slack"]
            },
            "seo_features": {
                "structured_data": "Automatic Schema.org markup",
                "meta_optimization": "Dynamic meta tags and Open Graph",
                "performance": "Core Web Vitals optimization",
                "ai_friendly": "Clean markup for AI crawlers",
                "multilingual": "Hreflang and localization support"
            },
            "mobile_development": {
                "sdks": ["iOS SDK", "Android SDK", "React Native", "Flutter"],
                "api_access": "Full REST and GraphQL APIs",
                "real_time": "WebSocket support for live features",
                "offline_support": "Progressive Web App capabilities"
            }
        }
        
        return JSONResponse(
            content=ai_info,
            headers={
                "X-AI-Crawler": crawler_name,
                "X-Content-Optimized": "ai-crawler",
                "Cache-Control": "public, max-age=3600"
            }
        )
    
    async def _provide_content_info(self, request: Request, crawler_name: str, call_next):
        """Provide structured content information for specific pages"""
        
        # Get the original response
        response = await call_next(request)
        
        # Extract structured information based on path
        path = request.url.path
        
        if path.startswith("/apps/"):
            content_info = {
                "type": "application_page",
                "platform": "WebCraft",
                "description": "User-created application built with WebCraft platform",
                "features": ["Custom domain support", "Mobile-responsive", "SEO optimized"],
                "api_access": f"{request.url.scheme}://{request.url.netloc}/api/v1/apps"
            }
        
        elif path.startswith("/templates/"):
            content_info = {
                "type": "template_page",
                "platform": "WebCraft",
                "description": "Professional template for rapid application development",
                "categories": ["Business", "E-commerce", "Portfolio", "SaaS"],
                "customization": "Fully customizable with drag-and-drop editor"
            }
        
        else:
            content_info = {"type": "general_page", "platform": "WebCraft"}
        
        # Return structured JSON for AI crawlers
        return JSONResponse(
            content=content_info,
            headers={
                "X-AI-Crawler": crawler_name,
                "X-Content-Type": "structured-info"
            }
        )
    
    async def _optimize_api_response(self, response: Response, crawler_name: str) -> Response:
        """Optimize API responses for AI crawlers"""
        
        # Add AI-friendly headers
        response.headers["X-AI-Crawler"] = crawler_name
        response.headers["X-API-Version"] = "2.0.0"
        response.headers["X-Content-Optimized"] = "ai-crawler"
        
        # Ensure JSON responses are properly formatted
        if hasattr(response, 'body') and response.headers.get('content-type', '').startswith('application/json'):
            try:
                # Parse and reformat JSON for better AI readability
                content = json.loads(response.body)
                
                # Add metadata for AI understanding
                if isinstance(content, dict):
                    content["_ai_metadata"] = {
                        "platform": "WebCraft",
                        "api_version": "2.0.0",
                        "documentation": "https://api.webcraft.dev/docs",
                        "crawler_detected": crawler_name
                    }
                
                # Return reformatted response
                return JSONResponse(
                    content=content,
                    status_code=response.status_code,
                    headers=dict(response.headers)
                )
            
            except (json.JSONDecodeError, AttributeError):
                pass
        
        return response
    
    async def _optimize_response_for_ai(self, response: Response, request: Request, crawler_name: str) -> Response:
        """General response optimization for AI crawlers"""
        
        # Add AI-friendly headers
        response.headers["X-AI-Crawler"] = crawler_name
        response.headers["X-Content-Optimized"] = "ai-friendly"
        
        # For HTML responses, add AI-readable metadata
        if response.headers.get('content-type', '').startswith('text/html'):
            try:
                content = response.body.decode('utf-8') if isinstance(response.body, bytes) else str(response.body)
                
                # Add AI-friendly metadata to HTML
                ai_metadata = f"""
<!-- AI Crawler Metadata -->
<meta name="ai:platform" content="WebCraft Universal No-Code Platform" />
<meta name="ai:type" content="no-code-platform" />
<meta name="ai:capabilities" content="app-builder,website-builder,mobile-apis,ai-integration" />
<meta name="ai:crawler-detected" content="{crawler_name}" />
"""
                
                # Inject metadata into head
                head_end = content.find('</head>')
                if head_end != -1:
                    content = content[:head_end] + ai_metadata + content[head_end:]
                    
                    # Update response with enhanced content
                    response.body = content.encode('utf-8')
                    response.headers["content-length"] = str(len(response.body))
            
            except Exception as e:
                print(f"AI optimization failed: {e}")
        
        return response
    
    def _add_ai_friendly_headers(self, response: Response, request: Request):
        """Add AI-friendly headers to all responses"""
        
        # Indicate AI-friendly content structure
        response.headers["X-AI-Friendly"] = "true"
        response.headers["X-Platform"] = "WebCraft"
        
        # Provide API discovery information
        if not request.url.path.startswith("/api/"):
            response.headers["X-API-Base"] = f"{request.url.scheme}://{request.url.netloc}/api/v1"
            response.headers["X-API-Docs"] = f"{request.url.scheme}://{request.url.netloc}/docs"
        
        # Content type optimization
        if response.headers.get('content-type', '').startswith('application/json'):
            response.headers["X-JSON-Schema"] = "available"
        
        # Performance indicators for AI crawlers
        response.headers["X-Response-Time"] = str(response.headers.get("X-Process-Time", "unknown"))
        
        # Caching guidance for AI crawlers
        if not response.headers.get("Cache-Control"):
            response.headers["Cache-Control"] = "public, max-age=1800"  # 30 minutes default