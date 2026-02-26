"""
Templates service for V2
Enhanced with comprehensive template management functionality
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import json

from src.common.exceptions import NotFoundError, ValidationError
from .models import Template, TemplatePage


# Premade page templates with widget configurations (same as V1)
PREMADE_TEMPLATES = {
    # Landing Page Templates
    "landing-startup": {
        "id": "landing-startup",
        "name": "Startup Landing Page",
        "description": "Modern landing page for startups with hero, features, pricing, and CTA sections",
        "category": "landing",
        "thumbnail": "/templates/landing-startup.png",
        "tags": ["startup", "saas", "modern", "landing"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {
                        "id": "nav-1",
                        "type": "navbar",
                        "props": {
                            "logo": "StartupPro",
                            "logoImage": "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=40&h=40&fit=crop",
                            "links": [
                                {"label": "Features", "href": "#features"},
                                {"label": "Pricing", "href": "#pricing"},
                                {"label": "About", "href": "#about"},
                                {"label": "Contact", "href": "#contact"}
                            ],
                            "ctaText": "Get Started",
                            "ctaHref": "/signup",
                            "variant": "transparent",
                            "sticky": True
                        }
                    },
                    {
                        "id": "hero-1",
                        "type": "hero",
                        "props": {
                            "title": "Build Something Amazing",
                            "subtitle": "The all-in-one platform to launch your next big idea. Start building today with our powerful tools and seamless integrations.",
                            "primaryCta": "Start Free Trial",
                            "secondaryCta": "Watch Demo",
                            "backgroundType": "gradient",
                            "alignment": "center",
                            "backgroundImage": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop",
                            "showArrow": True,
                            "size": "large"
                        }
                    },
                    {
                        "id": "features-1",
                        "type": "features",
                        "props": {
                            "title": "Everything you need",
                            "subtitle": "Powerful features to help you build faster and scale effortlessly",
                            "columns": 3,
                            "variant": "cards",
                            "features": [
                                {
                                    "icon": "Zap", 
                                    "title": "Lightning Fast", 
                                    "description": "Built for speed and performance with optimized infrastructure and global CDN"
                                },
                                {
                                    "icon": "Shield", 
                                    "title": "Secure by Default", 
                                    "description": "Enterprise-grade security with end-to-end encryption and compliance certifications"
                                },
                                {
                                    "icon": "Puzzle", 
                                    "title": "Easy Integration", 
                                    "description": "Connect with your favorite tools through our extensive API and webhook system"
                                }
                            ]
                        }
                    },
                    {
                        "id": "pricing-1",
                        "type": "pricing",
                        "props": {
                            "title": "Simple, transparent pricing",
                            "subtitle": "Choose the plan that works for you. No hidden fees, cancel anytime.",
                            "showToggle": True,
                            "plans": [
                                {
                                    "name": "Starter", 
                                    "price": 9, 
                                    "period": "month", 
                                    "yearlyPrice": 90,
                                    "description": "Perfect for individuals and small projects",
                                    "features": [
                                        "5 Projects", 
                                        "Basic Analytics", 
                                        "Email Support",
                                        "1GB Storage",
                                        "SSL Certificate"
                                    ], 
                                    "cta": "Get Started",
                                    "popular": False
                                },
                                {
                                    "name": "Pro", 
                                    "price": 29, 
                                    "period": "month", 
                                    "yearlyPrice": 290,
                                    "description": "Best for growing teams and businesses",
                                    "features": [
                                        "Unlimited Projects", 
                                        "Advanced Analytics", 
                                        "Priority Support", 
                                        "API Access",
                                        "10GB Storage",
                                        "Custom Domain",
                                        "Team Collaboration"
                                    ], 
                                    "cta": "Start Free Trial", 
                                    "popular": True
                                }
                            ]
                        }
                    },
                    {
                        "id": "cta-1",
                        "type": "cta",
                        "props": {
                            "title": "Ready to get started?",
                            "subtitle": "Join thousands of satisfied customers today. Start your free trial now.",
                            "primaryCta": "Start Free Trial",
                            "secondaryCta": "Talk to Sales",
                            "backgroundType": "gradient",
                            "centered": True
                        }
                    }
                ]
            }
        ]
    },
    
    # Portfolio Templates
    "portfolio-creative": {
        "id": "portfolio-creative",
        "name": "Creative Portfolio",
        "description": "Stunning portfolio for designers, photographers, and creatives",
        "category": "portfolio",
        "thumbnail": "/templates/portfolio-creative.png",
        "tags": ["portfolio", "creative", "designer", "photographer"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {
                        "id": "nav-1",
                        "type": "navbar",
                        "props": {"logo": "Portfolio", "links": [{"label": "Work", "href": "#work"}, {"label": "About", "href": "#about"}, {"label": "Contact", "href": "#contact"}], "variant": "minimal"}
                    },
                    {
                        "id": "hero-1",
                        "type": "hero",
                        "props": {"title": "Hi, I'm Alex", "subtitle": "A creative designer crafting beautiful digital experiences", "alignment": "left", "backgroundType": "image"}
                    },
                    {
                        "id": "gallery-1",
                        "type": "gallery",
                        "props": {"title": "Selected Work", "layout": "masonry", "images": []}
                    },
                    {
                        "id": "contact-1",
                        "type": "contact",
                        "props": {"title": "Let's Work Together", "email": "hello@example.com", "showForm": True}
                    }
                ]
            }
        ]
    },

    # E-commerce Templates
    "ecommerce-store": {
        "id": "ecommerce-store",
        "name": "Modern E-commerce Store",
        "description": "Complete online store with product listings, cart, and checkout",
        "category": "ecommerce",
        "thumbnail": "/templates/ecommerce-store.png",
        "tags": ["ecommerce", "store", "shop", "products"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "banner-1", "type": "banner", "props": {"text": "🎉 Free shipping on orders over $50!", "variant": "info", "dismissible": True}},
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ShopName", "links": [{"label": "Shop", "href": "/shop"}, {"label": "Collections", "href": "/collections"}, {"label": "About", "href": "/about"}], "showCart": True, "showSearch": True}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "New Arrivals", "subtitle": "Discover our latest collection", "primaryCta": "Shop Now", "backgroundType": "image"}},
                    {"id": "products-1", "type": "product", "props": {"name": "Premium Headphones", "price": 199.99, "originalPrice": 249.99, "layout": "card", "showAddToCart": True, "showWishlist": True, "showRating": True}}
                ]
            }
        ]
    },
    
    # Business Templates
    "business-corporate": {
        "id": "business-corporate",
        "name": "Corporate Business",
        "description": "Professional business website for companies and agencies",
        "category": "business",
        "thumbnail": "/templates/business-corporate.png",
        "tags": ["business", "corporate", "agency", "professional"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "CompanyName", "links": [{"label": "Services", "href": "/services"}, {"label": "About", "href": "/about"}, {"label": "Team", "href": "/team"}, {"label": "Contact", "href": "/contact"}], "ctaText": "Get Quote"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "We Build Digital Solutions", "subtitle": "Transform your business with our expert services", "primaryCta": "Our Services", "secondaryCta": "Contact Us", "backgroundType": "video"}},
                    {"id": "services-1", "type": "features", "props": {"title": "Our Services", "subtitle": "What we do best", "columns": 3, "variant": "cards"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Ready to Start Your Project?", "primaryCta": "Get Free Consultation"}}
                ]
            }
        ]
    },

    # Blog Templates
    "blog-modern": {
        "id": "blog-modern",
        "name": "Modern Blog",
        "description": "Clean and modern blog layout for writers and content creators",
        "category": "blog",
        "thumbnail": "/templates/blog-modern.png",
        "tags": ["blog", "content", "writer", "articles"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "BlogName", "links": [{"label": "Articles", "href": "/articles"}, {"label": "Categories", "href": "/categories"}, {"label": "About", "href": "/about"}, {"label": "Subscribe", "href": "#subscribe"}], "variant": "centered"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Welcome to My Blog", "subtitle": "Thoughts, stories and ideas", "variant": "minimal", "alignment": "center"}},
                    {"id": "newsletter-1", "type": "newsletter", "props": {"title": "Subscribe to Newsletter", "subtitle": "Get the latest posts delivered to your inbox"}}
                ]
            }
        ]
    }
}

# Section Templates (reusable sections)
SECTION_TEMPLATES = {
    "hero-gradient": {
        "id": "hero-gradient",
        "name": "Gradient Hero",
        "category": "hero",
        "element": {"type": "hero", "props": {"backgroundType": "gradient", "alignment": "center"}}
    },
    "hero-video": {
        "id": "hero-video",
        "name": "Video Hero",
        "category": "hero",
        "element": {"type": "hero", "props": {"backgroundType": "video", "alignment": "left"}}
    },
    "features-grid": {
        "id": "features-grid",
        "name": "Features Grid",
        "category": "features",
        "element": {"type": "features", "props": {"columns": 3, "variant": "cards"}}
    },
    "pricing-toggle": {
        "id": "pricing-toggle",
        "name": "Pricing with Toggle",
        "category": "pricing",
        "element": {"type": "pricing", "props": {"showToggle": True, "columns": 3}}
    },
    "testimonials-carousel": {
        "id": "testimonials-carousel",
        "name": "Testimonials Carousel",
        "category": "testimonials",
        "element": {"type": "testimonial", "props": {"variant": "carousel"}}
    },
    "cta-newsletter": {
        "id": "cta-newsletter",
        "name": "Newsletter CTA",
        "category": "cta",
        "element": {"type": "newsletter", "props": {"variant": "centered"}}
    }
}


class TemplateService:
    """Enhanced Template service for V2 with comprehensive functionality"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def list_templates(
        self,
        page: int = 1,
        per_page: int = 20,
        category: Optional[str] = None,
        search: Optional[str] = None,
        is_premium: Optional[bool] = None,
        sort_by: str = "popular",
        tags: List[str] = []
    ) -> Dict[str, Any]:
        """List all templates with filtering"""
        
        # Build query
        query = self.db.query(Template)
        
        # Filter by category
        if category:
            query = query.filter(Template.category == category)
        
        # Filter by premium status
        if is_premium is not None:
            query = query.filter(Template.is_premium == is_premium)
        
        # Filter by search
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                Template.name.ilike(search_term) |
                Template.description.ilike(search_term)
            )
        
        # Sort
        if sort_by == "popular":
            query = query.order_by(Template.downloads.desc())
        elif sort_by == "rating":
            query = query.order_by(Template.rating.desc())
        elif sort_by == "newest":
            query = query.order_by(Template.created_at.desc())
        else:
            query = query.order_by(Template.name)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        templates = query.offset((page - 1) * per_page).limit(per_page).all()
        
        # Convert to dict format
        template_list = []
        try:
            for template in templates:
                # Get template pages
                pages = self.db.query(TemplatePage).filter(
                    TemplatePage.template_id == template.id
                ).order_by(TemplatePage.sort_order).all()
                
                template_dict = {
                    "id": template.slug,
                    "name": template.name,
                    "description": template.description,
                    "category": template.category,
                    "thumbnail": template.preview_image,
                    "demo_url": template.demo_url,
                    "tags": [],  # Could be added to database model
                    "downloads": template.downloads,
                    "rating": template.rating / 20.0,  # Convert back to 0-5 scale
                    "isPremium": template.is_premium,
                    "price": template.price,
                    "config": template.config,
                    "pages_config": template.pages_config,
                    "pages": [
                        {
                            "name": page.title,
                            "slug": page.slug,
                            "elements": page.content.get("elements", []),
                            "content": page.content,
                            "is_homepage": page.is_homepage
                        }
                        for page in pages
                    ],
                    "created_at": template.created_at,
                    "updated_at": template.updated_at
                }
                template_list.append(template_dict)
        except Exception as db_error:
            print(f"Warning: Could not query database templates: {db_error}")
            template_list = []
        
        # If no database templates, return premade templates
        if not template_list:
            template_list = []
            for template_id, template in PREMADE_TEMPLATES.items():
                if category and template.get("category") != category:
                    continue
                if search and search.lower() not in template.get("name", "").lower():
                    continue
                template_list.append(template)
        
        # Get categories
        try:
            categories = self.db.query(Template.category).distinct().all()
            categories = [cat[0] for cat in categories]
        except:
            categories = list(set(t.get("category") for t in PREMADE_TEMPLATES.values()))
        
        # Featured templates (top 6 by downloads or first 6 premade)
        try:
            featured_query = self.db.query(Template).order_by(Template.downloads.desc()).limit(6)
            featured = []
            for template in featured_query.all():
                featured.append({
                    "id": template.slug,
                    "name": template.name,
                    "description": template.description,
                    "category": template.category,
                    "thumbnail": template.preview_image,
                    "rating": template.rating / 20.0
                })
        except:
            featured = list(PREMADE_TEMPLATES.values())[:6]
        
        return {
            "templates": template_list,
            "total": total if template_list else len(PREMADE_TEMPLATES),
            "page": page,
            "per_page": per_page,
            "categories": categories,
            "featured": featured
        }
    
    async def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get a single template by ID"""
        try:
            template = self.db.query(Template).filter(Template.slug == template_id).first()
            if template:
                # Get template pages
                pages = self.db.query(TemplatePage).filter(
                    TemplatePage.template_id == template.id
                ).order_by(TemplatePage.sort_order).all()
                
                return {
                    "id": template.slug,
                    "name": template.name,
                    "description": template.description,
                    "category": template.category,
                    "thumbnail": template.preview_image,
                    "demo_url": template.demo_url,
                    "tags": [],  # Could be added to database model
                    "downloads": template.downloads,
                    "rating": template.rating / 20.0,
                    "isPremium": template.is_premium,
                    "price": template.price,
                    "config": template.config,
                    "pages_config": template.pages_config,
                    "pages": [
                        {
                            "name": page.title,
                            "slug": page.slug,
                            "elements": page.content.get("elements", []),
                            "content": page.content,
                            "is_homepage": page.is_homepage
                        }
                        for page in pages
                    ],
                    "created_at": template.created_at,
                    "updated_at": template.updated_at,
                    "database_template": True  # Flag to indicate this is from database
                }
        except:
            pass
        
        # Fallback to hardcoded templates
        return PREMADE_TEMPLATES.get(template_id)
    
    async def get_categories(self) -> List[Dict[str, Any]]:
        """Get all template categories with counts"""
        try:
            # Try to get from database first
            db_categories = self.db.query(Template.category).distinct().all()
            if db_categories:
                categories = {}
                for cat in db_categories:
                    cat_name = cat[0]
                    count = self.db.query(Template).filter(Template.category == cat_name).count()
                    categories[cat_name] = {
                        "name": cat_name,
                        "count": count,
                        "icon": self._get_category_icon(cat_name)
                    }
                return list(categories.values())
        except:
            pass
        
        # Fallback to premade templates
        categories = {}
        for template in PREMADE_TEMPLATES.values():
            cat = template["category"]
            if cat not in categories:
                categories[cat] = {"name": cat, "count": 0, "icon": self._get_category_icon(cat)}
            categories[cat]["count"] += 1
        
        return list(categories.values())
    
    async def get_featured_templates(self, limit: int = 6) -> List[Dict[str, Any]]:
        """Get featured templates"""
        try:
            # Try database first
            templates = self.db.query(Template).order_by(Template.downloads.desc()).limit(limit).all()
            if templates:
                return [
                    {
                        "id": t.slug,
                        "name": t.name,
                        "description": t.description,
                        "category": t.category,
                        "thumbnail": t.preview_image,
                        "rating": t.rating / 20.0
                    }
                    for t in templates
                ]
        except:
            pass
        
        # Fallback to premade
        return list(PREMADE_TEMPLATES.values())[:limit]
    
    async def get_section_templates(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get section templates"""
        sections = list(SECTION_TEMPLATES.values())
        if category:
            sections = [s for s in sections if s["category"] == category]
        return sections
    
    async def install_template(
        self,
        template: Dict[str, Any],
        user_id: str,
        app_name: str,
        app_description: Optional[str] = None,
        customizations: Dict[str, Any] = {}
    ) -> Dict[str, Any]:
        """Install a template as a new app"""
        
        # Apply customizations to template
        pages_config = self._apply_customizations(template.get("pages", []), customizations)
        
        # Create app record (simplified - actual implementation would use database)
        app = {
            "id": str(uuid.uuid4()),
            "name": app_name,
            "description": app_description or template.get("description", ""),
            "user_id": user_id,
            "template_id": template.get("id"),
            "pages": pages_config,
            "created_at": datetime.utcnow().isoformat(),
            "slug": app_name.lower().replace(" ", "-")
        }
        
        return app
    
    async def increment_views(self, template_id: str):
        """Increment template view count"""
        try:
            template = self.db.query(Template).filter(Template.slug == template_id).first()
            if template:
                template.downloads += 1
                self.db.commit()
        except:
            pass  # Ignore errors for premade templates
    
    async def rate_template(
        self,
        template_id: str,
        user_id: str,
        rating: int,
        review: Optional[str] = None
    ) -> Dict[str, Any]:
        """Rate a template"""
        return {"success": True, "rating": rating}
    
    async def generate_preview(
        self,
        template: Dict[str, Any],
        customizations: Dict[str, Any] = {}
    ) -> str:
        """Generate a preview URL for template"""
        return f"/preview/{template.get('id')}"
    
    async def create_template(
        self,
        creator_id: str,
        name: str,
        description: Optional[str],
        category: str,
        config: Dict[str, Any],
        pages_config: Dict[str, Any],
        is_premium: bool = False,
        price: int = 0,
        preview_image: Optional[str] = None,
        demo_url: Optional[str] = None
    ) -> Template:
        """Create a new template"""
        from slugify import slugify
        
        # Generate unique slug
        base_slug = slugify(name)
        slug = base_slug
        counter = 1
        while self.db.query(Template).filter(Template.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        template = Template(
            name=name,
            slug=slug,
            description=description,
            category=category,
            preview_image=preview_image,
            demo_url=demo_url,
            config=config,
            pages_config=pages_config,
            is_premium=is_premium,
            price=price,
            creator_id=creator_id
        )
        
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        
        return template
    
    async def update_template(
        self,
        template_id: str,
        user_id: str,
        **updates
    ) -> Optional[Template]:
        """Update an existing template"""
        template = self.db.query(Template).filter(Template.slug == template_id).first()
        
        if not template or str(template.creator_id) != user_id:
            return None
        
        # Update slug if name changed
        if 'name' in updates and updates['name'] != template.name:
            from slugify import slugify
            base_slug = slugify(updates['name'])
            slug = base_slug
            counter = 1
            while self.db.query(Template).filter(
                Template.slug == slug,
                Template.id != template.id
            ).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            updates['slug'] = slug
        
        for key, value in updates.items():
            if hasattr(template, key) and value is not None:
                setattr(template, key, value)
        
        self.db.commit()
        self.db.refresh(template)
        
        return template
    
    async def delete_template(
        self,
        template_id: str,
        user_id: str
    ) -> bool:
        """Delete a template"""
        template = self.db.query(Template).filter(Template.slug == template_id).first()
        
        if not template or str(template.creator_id) != user_id:
            return False
        
        # Delete associated pages first
        self.db.query(TemplatePage).filter(TemplatePage.template_id == template.id).delete()
        
        # Delete template
        self.db.delete(template)
        self.db.commit()
        
        return True
    
    async def create_template_page(
        self,
        template_id: str,
        user_id: str,
        title: str,
        slug: str,
        content: Dict[str, Any],
        meta_title: Optional[str] = None,
        meta_description: Optional[str] = None,
        meta_keywords: Optional[str] = None,
        og_image: Optional[str] = None,
        is_homepage: bool = False,
        sort_order: int = 0
    ) -> Optional[TemplatePage]:
        """Create a new page for a template"""
        template = self.db.query(Template).filter(Template.slug == template_id).first()
        
        if not template or str(template.creator_id) != user_id:
            return None
        
        # Check if slug already exists for this template
        existing_page = self.db.query(TemplatePage).filter(
            TemplatePage.template_id == template.id,
            TemplatePage.slug == slug
        ).first()
        
        if existing_page:
            raise ValidationError(f"Page with slug '{slug}' already exists for this template")
        
        page = TemplatePage(
            title=title,
            slug=slug,
            content=content,
            meta_title=meta_title,
            meta_description=meta_description,
            meta_keywords=meta_keywords,
            og_image=og_image,
            is_homepage=is_homepage,
            sort_order=sort_order,
            template_id=template.id
        )
        
        self.db.add(page)
        self.db.commit()
        self.db.refresh(page)
        
        return page
    
    async def update_template_page(
        self,
        template_id: str,
        page_id: str,
        user_id: str,
        **updates
    ) -> Optional[TemplatePage]:
        """Update a template page"""
        template = self.db.query(Template).filter(Template.slug == template_id).first()
        
        if not template or str(template.creator_id) != user_id:
            return None
        
        page = self.db.query(TemplatePage).filter(
            TemplatePage.id == page_id,
            TemplatePage.template_id == template.id
        ).first()
        
        if not page:
            return None
        
        # Check slug uniqueness if slug is being updated
        if 'slug' in updates and updates['slug'] != page.slug:
            existing_page = self.db.query(TemplatePage).filter(
                TemplatePage.template_id == template.id,
                TemplatePage.slug == updates['slug'],
                TemplatePage.id != page.id
            ).first()
            
            if existing_page:
                raise ValidationError(f"Page with slug '{updates['slug']}' already exists for this template")
        
        for key, value in updates.items():
            if hasattr(page, key) and value is not None:
                setattr(page, key, value)
        
        self.db.commit()
        self.db.refresh(page)
        
        return page
    
    async def delete_template_page(
        self,
        template_id: str,
        page_id: str,
        user_id: str
    ) -> bool:
        """Delete a template page"""
        template = self.db.query(Template).filter(Template.slug == template_id).first()
        
        if not template or str(template.creator_id) != user_id:
            return False
        
        page = self.db.query(TemplatePage).filter(
            TemplatePage.id == page_id,
            TemplatePage.template_id == template.id
        ).first()
        
        if not page:
            return False
        
        self.db.delete(page)
        self.db.commit()
        
        return True

    def _apply_customizations(
        self,
        pages: List[Dict[str, Any]],
        customizations: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Apply customizations to template pages"""
        
        # Deep copy pages
        import copy
        pages = copy.deepcopy(pages)
        
        # Apply brand customizations
        brand = customizations.get("brand", {})
        colors = customizations.get("colors", {})
        
        for page in pages:
            for element in page.get("elements", []):
                props = element.get("props", {})
                
                # Replace logo
                if "logo" in props and brand.get("name"):
                    props["logo"] = brand["name"]
                
                # Replace placeholder text
                if brand.get("tagline") and "subtitle" in props:
                    if "placeholder" in props.get("subtitle", "").lower():
                        props["subtitle"] = brand["tagline"]
        
        return pages
    
    def _get_category_icon(self, category: str) -> str:
        """Get icon for category"""
        icons = {
            "landing": "Rocket",
            "portfolio": "Briefcase",
            "ecommerce": "ShoppingCart",
            "business": "Building",
            "blog": "FileText",
            "restaurant": "Utensils",
            "event": "Calendar",
            "saas": "Cloud",
            "agency": "Palette",
            "real-estate": "Home"
        }
        return icons.get(category, "Layout")
    
    # Legacy methods for V1 compatibility
    def list_templates_legacy(
        self,
        category: str = None,
        is_premium: bool = None,
        page: int = 1,
        per_page: int = 20
    ) -> tuple[List[Template], int]:
        """List templates with filtering and pagination (legacy method)"""
        query = self.db.query(Template)
        
        if category:
            query = query.filter(Template.category == category)
        
        if is_premium is not None:
            query = query.filter(Template.is_premium == is_premium)
        
        total = query.count()
        templates = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return templates, total
    
    def get_template_legacy(self, template_id: str) -> Optional[Template]:
        """Get template by ID (legacy method)"""
        return self.db.query(Template).filter(Template.id == template_id).first()
    
    def get_template_by_slug(self, slug: str) -> Optional[Template]:
        """Get template by slug"""
        return self.db.query(Template).filter(Template.slug == slug).first()
    
    def get_template_pages(self, template_id: str) -> List[TemplatePage]:
        """Get all pages for a template"""
        return self.db.query(TemplatePage).filter(
            TemplatePage.template_id == template_id
        ).order_by(TemplatePage.sort_order).all()
    
    def get_categories_legacy(self) -> List[str]:
        """Get all template categories (legacy method)"""
        try:
            result = self.db.query(Template.category).distinct().all()
            return [row[0] for row in result]
        except:
            return list(set(t.get("category") for t in PREMADE_TEMPLATES.values()))