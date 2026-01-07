"""
SEO Middleware for WebCraft Platform
Optimizes responses for search engines and AI crawlers
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import HTMLResponse
import json
import time
from typing import Dict, Any
from urllib.parse import urlparse


class SEOMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enhance SEO for all generated sites and the platform itself
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.seo_config = {
            "default_meta": {
                "title": "WebCraft - Universal No-Code Platform",
                "description": "Build anything from websites to mobile apps with our AI-powered no-code platform. Create ERP, CRM, e-commerce, and more.",
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
        # Process the request
        response = await call_next(request)
        
        # Only process HTML responses
        if not self._should_process_response(request, response):
            return response
        
        # Add SEO headers
        self._add_seo_headers(response, request)
        
        # If it's an HTML response, enhance it with SEO data
        if isinstance(response, HTMLResponse):
            response = await self._enhance_html_response(response, request)
        
        return response
    
    def _should_process_response(self, request: Request, response: Response) -> bool:
        """Determine if response should be processed for SEO"""
        # Skip API endpoints
        if request.url.path.startswith("/api/"):
            return False
        
        # Skip static files
        static_extensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']
        if any(request.url.path.endswith(ext) for ext in static_extensions):
            return False
        
        # Only process successful responses
        if response.status_code >= 400:
            return False
        
        return True
    
    def _add_seo_headers(self, response: Response, request: Request):
        """Add SEO-friendly headers"""
        # Cache control for better performance
        if request.url.path.startswith("/static/"):
            response.headers["Cache-Control"] = "public, max-age=31536000"  # 1 year
        else:
            response.headers["Cache-Control"] = "public, max-age=3600"  # 1 hour
        
        # Security headers that also help with SEO
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Performance headers
        response.headers["X-DNS-Prefetch-Control"] = "on"
        
        # Canonical URL
        canonical_url = f"{request.url.scheme}://{request.url.netloc}{request.url.path}"
        response.headers["Link"] = f'<{canonical_url}>; rel="canonical"'
    
    async def _enhance_html_response(self, response: HTMLResponse, request: Request) -> HTMLResponse:
        """Enhance HTML response with SEO metadata"""
        try:
            # Get the original content
            content = response.body.decode('utf-8') if isinstance(response.body, bytes) else str(response.body)
            
            # Generate SEO enhancements
            seo_meta = self._generate_meta_tags(request)
            structured_data = self._generate_structured_data(request)
            
            # Inject SEO data into HTML
            enhanced_content = self._inject_seo_data(content, seo_meta, structured_data)
            
            # Create new response with enhanced content
            return HTMLResponse(
                content=enhanced_content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        
        except Exception as e:
            # If enhancement fails, return original response
            print(f"SEO enhancement failed: {e}")
            return response
    
    def _generate_meta_tags(self, request: Request) -> str:
        """Generate meta tags based on request"""
        meta_tags = []
        
        # Basic meta tags
        for key, value in self.seo_config["default_meta"].items():
            if key.startswith("og:"):
                meta_tags.append(f'<meta property="{key}" content="{value}" />')
            elif key.startswith("twitter:"):
                meta_tags.append(f'<meta name="{key}" content="{value}" />')
            else:
                meta_tags.append(f'<meta name="{key}" content="{value}" />')
        
        # Dynamic meta tags based on path
        path = request.url.path
        if path == "/":
            meta_tags.append('<meta name="title" content="WebCraft - Build Anything with No-Code" />')
        elif path.startswith("/templates"):
            meta_tags.append('<meta name="title" content="Templates - WebCraft" />')
            meta_tags.append('<meta name="description" content="Browse hundreds of professional templates for websites, apps, and business tools." />')
        elif path.startswith("/widgets"):
            meta_tags.append('<meta name="title" content="Widgets - WebCraft" />')
            meta_tags.append('<meta name="description" content="Discover powerful widgets to enhance your applications." />')
        
        # Canonical URL
        canonical_url = f"{request.url.scheme}://{request.url.netloc}{request.url.path}"
        meta_tags.append(f'<link rel="canonical" href="{canonical_url}" />')
        
        # Hreflang for international SEO (if applicable)
        meta_tags.append(f'<link rel="alternate" hreflang="en" href="{canonical_url}" />')
        
        return "\n    ".join(meta_tags)
    
    def _generate_structured_data(self, request: Request) -> str:
        """Generate JSON-LD structured data"""
        structured_data = self.seo_config["structured_data"].copy()
        
        # Add dynamic data based on path
        path = request.url.path
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        
        if path == "/":
            structured_data.update({
                "url": base_url,
                "description": "Universal no-code platform for building websites, mobile apps, and business tools",
                "screenshot": f"{base_url}/static/images/platform-screenshot.png",
                "featureList": [
                    "Drag-and-drop editor",
                    "AI-powered design",
                    "Mobile app APIs",
                    "SEO optimization",
                    "Real-time collaboration"
                ]
            })
        
        # Add breadcrumb structured data
        if path != "/":
            breadcrumb_data = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": self._generate_breadcrumbs(request)
            }
            
            # Combine multiple structured data objects
            combined_data = [structured_data, breadcrumb_data]
            return f'<script type="application/ld+json">{json.dumps(combined_data, indent=2)}</script>'
        
        return f'<script type="application/ld+json">{json.dumps(structured_data, indent=2)}</script>'
    
    def _generate_breadcrumbs(self, request: Request) -> list:
        """Generate breadcrumb structured data"""
        path_parts = [part for part in request.url.path.split('/') if part]
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        
        breadcrumbs = [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": base_url
        }]
        
        current_path = ""
        for i, part in enumerate(path_parts, 2):
            current_path += f"/{part}"
            breadcrumbs.append({
                "@type": "ListItem",
                "position": i,
                "name": part.replace('-', ' ').title(),
                "item": f"{base_url}{current_path}"
            })
        
        return breadcrumbs
    
    def _inject_seo_data(self, content: str, meta_tags: str, structured_data: str) -> str:
        """Inject SEO data into HTML content"""
        # Find the head tag and inject meta tags
        head_end = content.find('</head>')
        if head_end != -1:
            seo_injection = f"""
    <!-- SEO Meta Tags -->
    {meta_tags}
    
    <!-- Structured Data -->
    {structured_data}
    
    <!-- Performance Optimization -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="//api.webcraft.dev">
    
    <!-- Core Web Vitals Optimization -->
    <link rel="preload" as="style" href="/static/css/critical.css">
    
"""
            content = content[:head_end] + seo_injection + content[head_end:]
        
        return content