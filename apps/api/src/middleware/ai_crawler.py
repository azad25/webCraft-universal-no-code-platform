"""
AI Crawler Middleware for WebCraft Platform
Optimizes responses specifically for AI crawlers and bots
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import json
import re
from typing import Dict, Any, Optional


class AICrawlerMiddleware(BaseHTTPMiddleware):
    """Middleware to optimize content for AI crawlers"""
    
    def __init__(self, app):
        super().__init__(app)
        
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
        ai_crawler = self._detect_ai_crawler(request)
        
        if ai_crawler:
            return await self._handle_ai_crawler_request(request, ai_crawler, call_next)
        
        response = await call_next(request)
        self._add_ai_friendly_headers(response, request)
        return response
    
    def _detect_ai_crawler(self, request: Request) -> Optional[str]:
        """Detect if request is from an AI crawler"""
        user_agent = request.headers.get('user-agent', '').lower()
        
        for pattern, name in self.ai_crawlers.items():
            if pattern in user_agent:
                return name
        
        ai_patterns = [r'bot', r'crawler', r'spider', r'scraper', r'ai', r'gpt', r'claude', r'gemini', r'bard']
        for pattern in ai_patterns:
            if re.search(pattern, user_agent):
                return "AI Crawler"
        
        return None
    
    async def _handle_ai_crawler_request(self, request: Request, crawler_name: str, call_next):
        """Handle requests from AI crawlers with optimized responses"""
        path = request.url.path
        
        if path == "/" or path == "/api/ai-info":
            return await self._provide_platform_info(request, crawler_name)
        elif path.startswith("/api/"):
            response = await call_next(request)
            return await self._optimize_api_response(response, crawler_name)
        else:
            response = await call_next(request)
            return await self._optimize_response_for_ai(response, request, crawler_name)
    
    async def _provide_platform_info(self, request: Request, crawler_name: str) -> JSONResponse:
        """Provide comprehensive platform information for AI crawlers"""
        ai_info = {
            **self.ai_content_template,
            "crawler_detected": crawler_name,
            "api_documentation": {
                "base_url": f"{request.url.scheme}://{request.url.netloc}/api/v2",
                "authentication": "JWT Bearer tokens or API keys",
                "rate_limits": {
                    "free_tier": "1000 requests/hour",
                    "pro_tier": "10000 requests/hour",
                    "enterprise": "unlimited"
                }
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
    
    async def _optimize_api_response(self, response: Response, crawler_name: str) -> Response:
        """Optimize API responses for AI crawlers"""
        response.headers["X-AI-Crawler"] = crawler_name
        response.headers["X-API-Version"] = "2.0.0"
        response.headers["X-Content-Optimized"] = "ai-crawler"
        return response
    
    async def _optimize_response_for_ai(self, response: Response, request: Request, crawler_name: str) -> Response:
        """General response optimization for AI crawlers"""
        response.headers["X-AI-Crawler"] = crawler_name
        response.headers["X-Content-Optimized"] = "ai-friendly"
        return response
    
    def _add_ai_friendly_headers(self, response: Response, request: Request):
        """Add AI-friendly headers to all responses"""
        response.headers["X-AI-Friendly"] = "true"
        response.headers["X-Platform"] = "WebCraft"
        
        if not request.url.path.startswith("/api/"):
            response.headers["X-API-Base"] = f"{request.url.scheme}://{request.url.netloc}/api/v2"
            response.headers["X-API-Docs"] = f"{request.url.scheme}://{request.url.netloc}/docs"
        
        if not response.headers.get("Cache-Control"):
            response.headers["Cache-Control"] = "public, max-age=1800"
