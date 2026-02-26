"""
SEO domain service
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import re
import json

from src.domains.apps.models import App
from src.domains.pages.models import Page


class SEOService:
    """Service for SEO optimization"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_seo_config(self, app_id: str) -> Dict[str, Any]:
        """Get SEO configuration for an app"""
        app = self.db.query(App).filter(App.id == app_id).first()
        if not app:
            return {}
        return app.seo_config or {}
    
    def update_seo_config(self, app_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Update SEO configuration"""
        app = self.db.query(App).filter(App.id == app_id).first()
        if not app:
            return {}
        
        current_config = app.seo_config or {}
        current_config.update(config)
        app.seo_config = current_config
        app.updated_at = datetime.utcnow()
        
        self.db.commit()
        return current_config
    
    def analyze_content(
        self,
        content: str,
        target_keywords: List[str] = None
    ) -> Dict[str, Any]:
        """Analyze content for SEO"""
        issues = []
        suggestions = []
        
        # Word count
        words = content.split()
        word_count = len(words)
        
        if word_count < 300:
            issues.append({
                "type": "content_length",
                "severity": "warning",
                "message": f"Content is too short ({word_count} words). Aim for at least 300 words."
            })
            suggestions.append("Add more detailed content to improve SEO ranking.")
        
        # Keyword density
        keyword_density = {}
        if target_keywords:
            content_lower = content.lower()
            for keyword in target_keywords:
                count = content_lower.count(keyword.lower())
                density = (count / word_count * 100) if word_count > 0 else 0
                keyword_density[keyword] = round(density, 2)
                
                if density < 0.5:
                    issues.append({
                        "type": "keyword_density",
                        "severity": "info",
                        "message": f"Keyword '{keyword}' density is low ({density}%). Consider using it more."
                    })
                elif density > 3:
                    issues.append({
                        "type": "keyword_stuffing",
                        "severity": "warning",
                        "message": f"Keyword '{keyword}' density is high ({density}%). Avoid keyword stuffing."
                    })
        
        # Readability (simple Flesch-Kincaid approximation)
        sentences = re.split(r'[.!?]+', content)
        sentence_count = len([s for s in sentences if s.strip()])
        avg_sentence_length = word_count / sentence_count if sentence_count > 0 else 0
        
        readability_score = 100 - (avg_sentence_length * 1.5)
        readability_score = max(0, min(100, readability_score))
        
        if avg_sentence_length > 25:
            issues.append({
                "type": "readability",
                "severity": "info",
                "message": "Sentences are too long on average. Consider breaking them up."
            })
            suggestions.append("Use shorter sentences for better readability.")
        
        # Calculate overall score
        score = 100
        for issue in issues:
            if issue["severity"] == "error":
                score -= 20
            elif issue["severity"] == "warning":
                score -= 10
            else:
                score -= 5
        
        score = max(0, score)
        
        return {
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "keyword_density": keyword_density,
            "readability_score": round(readability_score, 1),
            "word_count": word_count,
            "sentence_count": sentence_count
        }
    
    def generate_sitemap(self, app_id: str, base_url: str) -> str:
        """Generate XML sitemap for an app"""
        pages = self.db.query(Page).filter(Page.app_id == app_id).all()
        
        sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        
        for page in pages:
            url = f"{base_url}/{page.slug}" if page.slug != "home" else base_url
            lastmod = page.updated_at.strftime("%Y-%m-%d") if page.updated_at else datetime.utcnow().strftime("%Y-%m-%d")
            priority = "1.0" if page.is_homepage else "0.8"
            
            sitemap += f"""  <url>
    <loc>{url}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>{priority}</priority>
  </url>\n"""
        
        sitemap += '</urlset>'
        return sitemap
    
    def generate_robots_txt(self, app_id: str, base_url: str) -> str:
        """Generate robots.txt for an app"""
        app = self.db.query(App).filter(App.id == app_id).first()
        
        robots = "User-agent: *\n"
        robots += "Allow: /\n"
        robots += "\n"
        robots += f"Sitemap: {base_url}/sitemap.xml\n"
        
        return robots
    
    def generate_structured_data(
        self,
        app_id: str,
        data_type: str = "WebSite"
    ) -> Dict[str, Any]:
        """Generate JSON-LD structured data"""
        app = self.db.query(App).filter(App.id == app_id).first()
        if not app:
            return {}
        
        seo_config = app.seo_config or {}
        
        if data_type == "WebSite":
            return {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": app.name,
                "description": seo_config.get("meta_description", app.description),
                "url": f"https://{app.subdomain}.webcraft.dev" if app.subdomain else None
            }
        
        elif data_type == "Organization":
            return {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": app.name,
                "description": seo_config.get("meta_description", app.description),
                "url": f"https://{app.subdomain}.webcraft.dev" if app.subdomain else None
            }
        
        elif data_type == "WebPage":
            return {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": seo_config.get("meta_title", app.name),
                "description": seo_config.get("meta_description", app.description)
            }
        
        return {}
    
    def get_meta_tags(self, app_id: str, page_id: str = None) -> Dict[str, str]:
        """Get meta tags for an app or page"""
        app = self.db.query(App).filter(App.id == app_id).first()
        if not app:
            return {}
        
        seo_config = app.seo_config or {}
        
        meta_tags = {
            "title": seo_config.get("meta_title", app.name),
            "description": seo_config.get("meta_description", app.description or ""),
            "robots": seo_config.get("robots", "index, follow"),
            "og:title": seo_config.get("og_title", seo_config.get("meta_title", app.name)),
            "og:description": seo_config.get("og_description", seo_config.get("meta_description", "")),
            "og:type": "website",
            "twitter:card": seo_config.get("twitter_card", "summary_large_image"),
            "twitter:title": seo_config.get("twitter_title", seo_config.get("meta_title", app.name)),
            "twitter:description": seo_config.get("twitter_description", seo_config.get("meta_description", ""))
        }
        
        if seo_config.get("og_image"):
            meta_tags["og:image"] = seo_config["og_image"]
        
        if seo_config.get("twitter_image"):
            meta_tags["twitter:image"] = seo_config["twitter_image"]
        
        if seo_config.get("canonical_url"):
            meta_tags["canonical"] = seo_config["canonical_url"]
        
        # Override with page-specific meta if provided
        if page_id:
            page = self.db.query(Page).filter(Page.id == page_id).first()
            if page:
                if page.meta_title:
                    meta_tags["title"] = page.meta_title
                    meta_tags["og:title"] = page.meta_title
                    meta_tags["twitter:title"] = page.meta_title
                if page.meta_description:
                    meta_tags["description"] = page.meta_description
                    meta_tags["og:description"] = page.meta_description
                    meta_tags["twitter:description"] = page.meta_description
        
        return meta_tags
