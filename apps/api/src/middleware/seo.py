"""
SEO Middleware for WebCraft Platform
Optimizes responses for search engines and AI crawlers
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import HTMLResponse
import json
from typing import Dict, Any


class SEOMiddleware(BaseHTTPMiddleware):
    """Middleware to enhance SEO for all generated sites"""
    
    def __init__(self, app):
        super().__init__(app)
        self.seo_config = {
            "default_meta": {
                "title": "WebCraft - Universal No-Code Platform",
                "description": "Build anything from websites to mobile apps with our AI-powered no-code platform.",
                "keywords": "no-code, website builder, app builder, AI, drag-and-drop, templates",
                "author": "WebCraft",
                "robots": "index, follow",
                "og:type": "website",
                "og:site_name": "WebCraft",
                "twitter:card": "summary_large_image",
                "twitter:site": "@webcraft"
            },
            "structured_data": {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "WebCraft",
                "applicationCategory": "WebApplication",
                "operatingSystem": "Web",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                }
            }
        }
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        if not self._should_process_response(request, response):
            return response
        
        self._add_seo_headers(response, request)
        return response
    
    def _should_process_response(self, request: Request, response: Response) -> bool:
        """Determine if response should be processed for SEO"""
        if request.url.path.startswith("/api/"):
            return False
        
        static_extensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']
        if any(request.url.path.endswith(ext) for ext in static_extensions):
            return False
        
        if response.status_code >= 400:
            return False
        
        return True
    
    def _add_seo_headers(self, response: Response, request: Request):
        """Add SEO-friendly headers"""
        if request.url.path.startswith("/static/"):
            response.headers["Cache-Control"] = "public, max-age=31536000"
        else:
            response.headers["Cache-Control"] = "public, max-age=3600"
        
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-DNS-Prefetch-Control"] = "on"
        
        canonical_url = f"{request.url.scheme}://{request.url.netloc}{request.url.path}"
        response.headers["Link"] = f'<{canonical_url}>; rel="canonical"'
    
    def _generate_meta_tags(self, request: Request) -> str:
        """Generate meta tags based on request"""
        meta_tags = []
        
        for key, value in self.seo_config["default_meta"].items():
            if key.startswith("og:"):
                meta_tags.append(f'<meta property="{key}" content="{value}" />')
            elif key.startswith("twitter:"):
                meta_tags.append(f'<meta name="{key}" content="{value}" />')
            else:
                meta_tags.append(f'<meta name="{key}" content="{value}" />')
        
        canonical_url = f"{request.url.scheme}://{request.url.netloc}{request.url.path}"
        meta_tags.append(f'<link rel="canonical" href="{canonical_url}" />')
        meta_tags.append(f'<link rel="alternate" hreflang="en" href="{canonical_url}" />')
        
        return "\n    ".join(meta_tags)
    
    def _generate_structured_data(self, request: Request) -> str:
        """Generate JSON-LD structured data"""
        structured_data = self.seo_config["structured_data"].copy()
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        
        structured_data.update({
            "url": base_url,
            "description": "Universal no-code platform for building websites, mobile apps, and business tools"
        })
        
        return f'<script type="application/ld+json">{json.dumps(structured_data, indent=2)}</script>'
