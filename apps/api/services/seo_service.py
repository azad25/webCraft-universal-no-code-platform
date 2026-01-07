"""
SEO Optimization Service
Handles SEO analysis, structured data, and optimization
"""

from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import json

from core.database import App, Page, SEOData


class SEOService:
    """Service for SEO optimization"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def optimize_app_seo(self, app: App) -> Dict[str, Any]:
        """Optimize SEO for an app"""
        
        results = {
            "optimizations": [],
            "score_before": 0,
            "score_after": 0
        }
        
        # Analyze current state
        analysis = await self.analyze_seo(app)
        results["score_before"] = analysis["score"]
        
        # Auto-fix issues
        seo_config = app.seo_config or {}
        
        # Ensure meta title
        if not seo_config.get("meta_title"):
            seo_config["meta_title"] = app.name[:60]
            results["optimizations"].append("Added meta title")
        
        # Ensure meta description
        if not seo_config.get("meta_description"):
            desc = app.description or f"Welcome to {app.name}"
            seo_config["meta_description"] = desc[:160]
            results["optimizations"].append("Added meta description")
        
        # Add Open Graph tags
        if not seo_config.get("og_title"):
            seo_config["og_title"] = seo_config.get("meta_title", app.name)
            results["optimizations"].append("Added Open Graph title")
        
        if not seo_config.get("og_description"):
            seo_config["og_description"] = seo_config.get("meta_description")
            results["optimizations"].append("Added Open Graph description")
        
        # Add structured data
        if not seo_config.get("structured_data"):
            seo_config["structured_data"] = self._generate_structured_data(app)
            results["optimizations"].append("Added structured data")
        
        # Update app
        app.seo_config = seo_config
        app.updated_at = datetime.utcnow()
        self.db.commit()
        
        # Re-analyze
        analysis = await self.analyze_seo(app)
        results["score_after"] = analysis["score"]
        
        return results
    
    async def analyze_seo(self, app: App) -> Dict[str, Any]:
        """Analyze SEO health"""
        
        score = 100
        issues = []
        recommendations = []
        
        seo_config = app.seo_config or {}
        
        # Check meta title
        meta_title = seo_config.get("meta_title", "")
        if not meta_title:
            score -= 15
            issues.append({"type": "error", "field": "meta_title", "message": "Missing meta title"})
            recommendations.append("Add a compelling meta title under 60 characters")
        elif len(meta_title) > 60:
            score -= 5
            issues.append({"type": "warning", "field": "meta_title", "message": "Meta title too long"})
        
        # Check meta description
        meta_desc = seo_config.get("meta_description", "")
        if not meta_desc:
            score -= 15
            issues.append({"type": "error", "field": "meta_description", "message": "Missing meta description"})
            recommendations.append("Add a meta description between 120-160 characters")
        elif len(meta_desc) > 160:
            score -= 5
            issues.append({"type": "warning", "field": "meta_description", "message": "Meta description too long"})
        
        # Check Open Graph
        if not seo_config.get("og_image"):
            score -= 5
            issues.append({"type": "warning", "field": "og_image", "message": "Missing Open Graph image"})
            recommendations.append("Add an Open Graph image for better social sharing")
        
        # Check structured data
        if not seo_config.get("structured_data"):
            score -= 10
            issues.append({"type": "info", "field": "structured_data", "message": "No structured data"})
            recommendations.append("Add JSON-LD structured data for rich snippets")
        
        return {
            "score": max(0, score),
            "issues": issues,
            "recommendations": recommendations,
            "has_structured_data": bool(seo_config.get("structured_data")),
            "analyzed_at": datetime.utcnow().isoformat()
        }
    
    def _generate_structured_data(self, app: App) -> Dict[str, Any]:
        """Generate Schema.org structured data"""
        
        base_url = f"https://{app.subdomain}.webcraft.dev" if app.subdomain else ""
        
        # Base organization/website schema
        schema = {
            "@context": "https://schema.org",
            "@type": "WebSite" if app.app_type == "website" else "Organization",
            "name": app.name,
            "description": app.description or "",
            "url": base_url
        }
        
        # Add type-specific data
        if app.app_type == "ecommerce":
            schema["@type"] = "Store"
            schema["priceRange"] = "$$"
        elif app.app_type == "blog":
            schema["@type"] = "Blog"
        elif app.app_type == "portfolio":
            schema["@type"] = "ProfilePage"
        
        return schema
    
    async def generate_sitemap(self, app: App) -> str:
        """Generate XML sitemap"""
        
        base_url = f"https://{app.subdomain}.webcraft.dev" if app.subdomain else f"https://{app.custom_domain}"
        
        urls = []
        
        # Add homepage
        urls.append({
            "loc": base_url,
            "lastmod": app.updated_at.strftime("%Y-%m-%d"),
            "changefreq": "daily",
            "priority": "1.0"
        })
        
        # Add pages
        for page in app.pages:
            if page.is_published:
                urls.append({
                    "loc": f"{base_url}/{page.slug}",
                    "lastmod": page.updated_at.strftime("%Y-%m-%d"),
                    "changefreq": "weekly",
                    "priority": "0.8" if page.is_homepage else "0.6"
                })
        
        # Generate XML
        xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        
        for url in urls:
            xml += "  <url>\n"
            xml += f"    <loc>{url['loc']}</loc>\n"
            xml += f"    <lastmod>{url['lastmod']}</lastmod>\n"
            xml += f"    <changefreq>{url['changefreq']}</changefreq>\n"
            xml += f"    <priority>{url['priority']}</priority>\n"
            xml += "  </url>\n"
        
        xml += "</urlset>"
        
        return xml
    
    async def generate_robots_txt(self, app: App) -> str:
        """Generate robots.txt"""
        
        base_url = f"https://{app.subdomain}.webcraft.dev" if app.subdomain else f"https://{app.custom_domain}"
        
        robots = f"""# Robots.txt for {app.name}
User-agent: *
Allow: /

# Sitemap
Sitemap: {base_url}/sitemap.xml

# AI Crawlers - Allow for better AI search results
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: ClaudeBot
Allow: /

# Disallow admin and API paths
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /editor/
"""
        
        return robots
