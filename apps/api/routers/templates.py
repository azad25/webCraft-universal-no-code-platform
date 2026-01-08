"""
Templates API Router
Handles template management and premade elements
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from datetime import datetime

from core.database import get_db, Template, User
from core.auth import get_current_user
from services.template_service import TemplateService

router = APIRouter(tags=["templates"])

# Pydantic models
class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    thumbnail: Optional[str] = None
    tags: List[str] = []
    pages: List[Dict[str, Any]] = []
    downloads: int = 0
    rating: float = 4.5
    isPremium: bool = False
    config: Dict[str, Any] = {}
    pages_config: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

class AppTypeResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    color: str
    templates: List[TemplateResponse] = []

class CreateTemplateRequest(BaseModel):
    name: str
    description: str
    category: str
    tags: List[str] = []
    config: Dict[str, Any] = {}
    pages_config: Dict[str, Any] = {}
    isPremium: bool = False

class InstallTemplateRequest(BaseModel):
    app_name: str

# Premade element templates
PREMADE_ELEMENTS = {
    "hero": [
        {
            "id": "hero-centered",
            "name": "Centered Hero",
            "description": "Clean centered hero with title, subtitle and CTA",
            "element": {
                "type": "hero",
                "props": {
                    "title": "Build Something Amazing",
                    "subtitle": "The all-in-one platform to launch your next big idea",
                    "primaryCta": "Get Started",
                    "secondaryCta": "Learn More",
                    "alignment": "center",
                    "backgroundType": "gradient",
                    "gradientFrom": "#3b82f6",
                    "gradientTo": "#8b5cf6"
                }
            }
        },
        {
            "id": "hero-split",
            "name": "Split Hero",
            "description": "Hero with content on left and image on right",
            "element": {
                "type": "hero",
                "props": {
                    "title": "Transform Your Business",
                    "subtitle": "Powerful tools to help you grow faster than ever before",
                    "primaryCta": "Start Free Trial",
                    "alignment": "left",
                    "showImage": True,
                    "imageUrl": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800",
                    "layout": "split"
                }
            }
        },
        {
            "id": "hero-video",
            "name": "Video Hero",
            "description": "Hero section with background video",
            "element": {
                "type": "hero",
                "props": {
                    "title": "See It In Action",
                    "subtitle": "Watch how we can help you succeed",
                    "primaryCta": "Watch Demo",
                    "backgroundType": "video",
                    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                }
            }
        }
    ],
    "features": [
        {
            "id": "features-grid-3",
            "name": "3-Column Features",
            "description": "Feature grid with icons and descriptions",
            "element": {
                "type": "features",
                "props": {
                    "title": "Everything You Need",
                    "subtitle": "Powerful features to help you succeed",
                    "columns": 3,
                    "features": [
                        {
                            "icon": "Zap",
                            "title": "Lightning Fast",
                            "description": "Built for speed and performance"
                        },
                        {
                            "icon": "Shield",
                            "title": "Secure",
                            "description": "Enterprise-grade security"
                        },
                        {
                            "icon": "Puzzle",
                            "title": "Integrations",
                            "description": "Connect with your favorite tools"
                        }
                    ]
                }
            }
        },
        {
            "id": "features-alternating",
            "name": "Alternating Features",
            "description": "Features with alternating image layout",
            "element": {
                "type": "features",
                "props": {
                    "title": "How It Works",
                    "variant": "alternating",
                    "showImages": True,
                    "features": [
                        {
                            "title": "Easy Setup",
                            "description": "Get started in minutes with our simple setup process",
                            "imageUrl": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600"
                        },
                        {
                            "title": "Powerful Analytics",
                            "description": "Track your progress with detailed analytics and insights",
                            "imageUrl": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600"
                        }
                    ]
                }
            }
        }
    ],
    "pricing": [
        {
            "id": "pricing-3-tier",
            "name": "3-Tier Pricing",
            "description": "Standard 3-tier pricing table",
            "element": {
                "type": "pricing",
                "props": {
                    "title": "Simple Pricing",
                    "subtitle": "Choose the plan that works for you",
                    "plans": [
                        {
                            "name": "Starter",
                            "price": "$9",
                            "period": "/month",
                            "description": "Perfect for getting started",
                            "features": ["5 Projects", "Basic Support", "1GB Storage"],
                            "buttonText": "Get Started"
                        },
                        {
                            "name": "Pro",
                            "price": "$29",
                            "period": "/month",
                            "description": "Best for growing businesses",
                            "features": ["Unlimited Projects", "Priority Support", "10GB Storage", "Advanced Analytics"],
                            "highlighted": True,
                            "buttonText": "Start Free Trial"
                        },
                        {
                            "name": "Enterprise",
                            "price": "Custom",
                            "description": "For large organizations",
                            "features": ["Custom Solutions", "Dedicated Support", "Unlimited Storage", "Custom Integrations"],
                            "buttonText": "Contact Sales"
                        }
                    ]
                }
            }
        }
    ],
    "testimonials": [
        {
            "id": "testimonials-grid",
            "name": "Testimonials Grid",
            "description": "Grid layout of customer testimonials",
            "element": {
                "type": "testimonial",
                "props": {
                    "title": "What Our Customers Say",
                    "variant": "grid",
                    "columns": 3,
                    "testimonials": [
                        {
                            "content": "This product has completely transformed how we work. Highly recommended!",
                            "author": "Sarah Johnson",
                            "role": "CEO, TechCorp",
                            "avatar": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100",
                            "rating": 5
                        },
                        {
                            "content": "Amazing support team and great features. Worth every penny.",
                            "author": "Mike Chen",
                            "role": "Product Manager",
                            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
                            "rating": 5
                        },
                        {
                            "content": "Easy to use and incredibly powerful. Our team loves it!",
                            "author": "Emily Davis",
                            "role": "Designer",
                            "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
                            "rating": 5
                        }
                    ]
                }
            }
        }
    ],
    "cta": [
        {
            "id": "cta-centered",
            "name": "Centered CTA",
            "description": "Simple centered call-to-action",
            "element": {
                "type": "cta",
                "props": {
                    "title": "Ready to Get Started?",
                    "subtitle": "Join thousands of satisfied customers today",
                    "primaryCta": "Start Free Trial",
                    "secondaryCta": "Contact Sales",
                    "alignment": "center",
                    "backgroundType": "gradient"
                }
            }
        },
        {
            "id": "cta-newsletter",
            "name": "Newsletter Signup",
            "description": "Email newsletter subscription form",
            "element": {
                "type": "newsletter",
                "props": {
                    "title": "Subscribe to Our Newsletter",
                    "subtitle": "Get the latest updates delivered to your inbox",
                    "placeholder": "Enter your email address",
                    "buttonText": "Subscribe",
                    "showPrivacyNote": True
                }
            }
        }
    ],
    "contact": [
        {
            "id": "contact-split",
            "name": "Split Contact",
            "description": "Contact form with company info",
            "element": {
                "type": "contact",
                "props": {
                    "title": "Get in Touch",
                    "subtitle": "We'd love to hear from you",
                    "showForm": True,
                    "showInfo": True,
                    "layout": "split",
                    "contactInfo": {
                        "email": "hello@company.com",
                        "phone": "+1 (555) 123-4567",
                        "address": "123 Business St, City, State 12345"
                    }
                }
            }
        }
    ],
    "stats": [
        {
            "id": "stats-simple",
            "name": "Simple Stats",
            "description": "Clean statistics counters",
            "element": {
                "type": "stats",
                "props": {
                    "stats": [
                        {"value": "10K+", "label": "Happy Customers"},
                        {"value": "99.9%", "label": "Uptime"},
                        {"value": "24/7", "label": "Support"},
                        {"value": "50+", "label": "Countries"}
                    ],
                    "animated": True
                }
            }
        }
    ],
    "product": [
        {
            "id": "product-card",
            "name": "Product Card",
            "description": "Standard product card with image, title, price, and add to cart",
            "element": {
                "type": "product",
                "props": {
                    "name": "Premium Product",
                    "price": 99.99,
                    "originalPrice": 129.99,
                    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
                    "layout": "card",
                    "showAddToCart": True,
                    "showWishlist": True,
                    "showRating": True,
                    "rating": 4.5,
                    "reviews": 128
                }
            }
        },
        {
            "id": "product-detailed",
            "name": "Detailed Product View",
            "description": "Comprehensive product view with variants and detailed information",
            "element": {
                "type": "product",
                "props": {
                    "name": "Premium Headphones",
                    "price": 199.99,
                    "originalPrice": 249.99,
                    "layout": "detailed",
                    "showVariants": True,
                    "showQuickView": True,
                    "showShare": True,
                    "variants": [
                        {"name": "Color", "options": ["Black", "White", "Blue"], "selected": "Black"},
                        {"name": "Size", "options": ["Small", "Medium", "Large"], "selected": "Medium"}
                    ]
                }
            }
        }
    ],
    "cart": [
        {
            "id": "cart-sidebar",
            "name": "Shopping Cart Sidebar",
            "description": "Sidebar shopping cart with items and checkout",
            "element": {
                "type": "cart",
                "props": {
                    "layout": "sidebar",
                    "showShipping": True,
                    "showTax": True,
                    "showCoupons": True
                }
            }
        },
        {
            "id": "cart-page",
            "name": "Full Cart Page",
            "description": "Complete shopping cart page with detailed order summary",
            "element": {
                "type": "cart",
                "props": {
                    "layout": "page",
                    "showShipping": True,
                    "showTax": True,
                    "showCoupons": True,
                    "showRecommendations": True
                }
            }
        },
        {
            "id": "cart-mini",
            "name": "Mini Cart",
            "description": "Compact cart widget for headers or sidebars",
            "element": {
                "type": "cart",
                "props": {
                    "layout": "mini"
                }
            }
        }
    ],
    "checkout": [
        {
            "id": "checkout-single",
            "name": "Single Page Checkout",
            "description": "All checkout steps on one page",
            "element": {
                "type": "checkout",
                "props": {
                    "layout": "single-page",
                    "showOrderSummary": True,
                    "showShippingOptions": True,
                    "showPaymentMethods": True,
                    "showGuestCheckout": True
                }
            }
        },
        {
            "id": "checkout-multi",
            "name": "Multi-Step Checkout",
            "description": "Checkout process with multiple steps",
            "element": {
                "type": "checkout",
                "props": {
                    "layout": "multi-step",
                    "showOrderSummary": True,
                    "showShippingOptions": True,
                    "showPaymentMethods": True
                }
            }
        }
    ],
    "calendar": [
        {
            "id": "calendar-month",
            "name": "Monthly Calendar",
            "description": "Full month view calendar with events",
            "element": {
                "type": "calendar",
                "props": {
                    "title": "Event Calendar",
                    "view": "month",
                    "showEventDetails": True,
                    "showAddEvent": True,
                    "allowEventClick": True
                }
            }
        },
        {
            "id": "calendar-agenda",
            "name": "Agenda View",
            "description": "List view of upcoming events",
            "element": {
                "type": "calendar",
                "props": {
                    "title": "Upcoming Events",
                    "view": "agenda",
                    "showEventDetails": True,
                    "allowEventClick": True
                }
            }
        },
        {
            "id": "calendar-mini",
            "name": "Mini Calendar",
            "description": "Compact calendar widget",
            "element": {
                "type": "calendar",
                "props": {
                    "title": "Calendar",
                    "view": "mini",
                    "showEventDetails": False
                }
            }
        }
    ],
    "search": [
        {
            "id": "search-horizontal",
            "name": "Horizontal Search",
            "description": "Full-width search with filters and suggestions",
            "element": {
                "type": "search",
                "props": {
                    "placeholder": "Search...",
                    "layout": "horizontal",
                    "showFilters": True,
                    "showVoiceSearch": True,
                    "showRecentSearches": True
                }
            }
        },
        {
            "id": "search-compact",
            "name": "Compact Search",
            "description": "Simple search input for headers",
            "element": {
                "type": "search",
                "props": {
                    "placeholder": "Search...",
                    "layout": "compact"
                }
            }
        },
        {
            "id": "search-advanced",
            "name": "Advanced Search",
            "description": "Search with location, voice, and image search",
            "element": {
                "type": "search",
                "props": {
                    "placeholder": "Search products, services, or locations...",
                    "layout": "vertical",
                    "showFilters": True,
                    "showVoiceSearch": True,
                    "showImageSearch": True,
                    "showLocationSearch": True,
                    "showRecentSearches": True
                }
            }
        }
    ],
    "map": [
        {
            "id": "map-location",
            "name": "Location Map",
            "description": "Interactive map showing a specific location",
            "element": {
                "type": "map",
                "props": {
                    "title": "Find Us",
                    "address": "1600 Amphitheatre Parkway, Mountain View, CA",
                    "zoom": 15,
                    "showMarker": True,
                    "showControls": True,
                    "height": "400px"
                }
            }
        },
        {
            "id": "map-embedded",
            "name": "Embedded Map",
            "description": "Simple embedded map without controls",
            "element": {
                "type": "map",
                "props": {
                    "address": "Times Square, New York, NY",
                    "zoom": 12,
                    "showMarker": True,
                    "showControls": False,
                    "height": "300px"
                }
            }
        }
    ]
}

# App types with templates
APP_TYPES = {
    "website": {
        "id": "website",
        "name": "Website",
        "description": "Landing pages, portfolios, blogs",
        "icon": "Globe",
        "color": "bg-blue-500",
        "templates": [
            {
                "id": "landing-startup",
                "name": "Startup Landing Page",
                "description": "Modern landing page for startups with hero, features, pricing, and CTA sections",
                "category": "landing",
                "thumbnail": "/templates/landing-startup.png",
                "tags": ["startup", "saas", "modern"],
                "pages_config": {
                    "home": {
                        "title": "Home",
                        "is_homepage": True,
                        "content": {
                            "elements": [
                                {
                                    "id": "hero-1",
                                    "type": "hero",
                                    "position": {"x": 0, "y": 0},
                                    "size": {"width": 1440, "height": 600},
                                    "props": {
                                        "title": "Build Something Amazing",
                                        "subtitle": "The all-in-one platform to launch your next big idea",
                                        "primaryCta": "Get Started",
                                        "secondaryCta": "Learn More",
                                        "alignment": "center",
                                        "backgroundType": "gradient",
                                        "gradientFrom": "#3b82f6",
                                        "gradientTo": "#8b5cf6"
                                    },
                                    "style": {}
                                },
                                {
                                    "id": "features-1",
                                    "type": "features",
                                    "position": {"x": 0, "y": 600},
                                    "size": {"width": 1440, "height": 500},
                                    "props": {
                                        "title": "Everything You Need",
                                        "subtitle": "Powerful features to help you succeed",
                                        "columns": 3,
                                        "features": [
                                            {"icon": "Zap", "title": "Lightning Fast", "description": "Built for speed and performance"},
                                            {"icon": "Shield", "title": "Secure", "description": "Enterprise-grade security"},
                                            {"icon": "Puzzle", "title": "Integrations", "description": "Connect with your favorite tools"}
                                        ]
                                    },
                                    "style": {}
                                },
                                {
                                    "id": "pricing-1",
                                    "type": "pricing",
                                    "position": {"x": 0, "y": 1100},
                                    "size": {"width": 1440, "height": 600},
                                    "props": {
                                        "title": "Simple Pricing",
                                        "subtitle": "Choose the plan that works for you",
                                        "plans": [
                                            {
                                                "name": "Starter",
                                                "price": "$9",
                                                "period": "/month",
                                                "description": "Perfect for getting started",
                                                "features": ["5 Projects", "Basic Support", "1GB Storage"],
                                                "buttonText": "Get Started"
                                            },
                                            {
                                                "name": "Pro",
                                                "price": "$29",
                                                "period": "/month",
                                                "description": "Best for growing businesses",
                                                "features": ["Unlimited Projects", "Priority Support", "10GB Storage", "Advanced Analytics"],
                                                "highlighted": True,
                                                "buttonText": "Start Free Trial"
                                            },
                                            {
                                                "name": "Enterprise",
                                                "price": "Custom",
                                                "description": "For large organizations",
                                                "features": ["Custom Solutions", "Dedicated Support", "Unlimited Storage", "Custom Integrations"],
                                                "buttonText": "Contact Sales"
                                            }
                                        ]
                                    },
                                    "style": {}
                                },
                                {
                                    "id": "cta-1",
                                    "type": "cta",
                                    "position": {"x": 0, "y": 1700},
                                    "size": {"width": 1440, "height": 300},
                                    "props": {
                                        "title": "Ready to Get Started?",
                                        "subtitle": "Join thousands of satisfied customers today",
                                        "primaryCta": "Start Free Trial",
                                        "secondaryCta": "Contact Sales",
                                        "alignment": "center",
                                        "backgroundType": "gradient"
                                    },
                                    "style": {}
                                }
                            ]
                        }
                    }
                },
                "downloads": 1250,
                "rating": 4.8,
                "isPremium": False,
                "config": {},
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
        ]
    },
    "ecommerce": {
        "id": "ecommerce",
        "name": "E-commerce",
        "description": "Online stores, product catalogs",
        "icon": "ShoppingCart",
        "color": "bg-green-500",
        "templates": [
            {
                "id": "ecommerce-store",
                "name": "Modern E-commerce Store",
                "description": "Complete online store with product listings, cart, and checkout",
                "category": "ecommerce",
                "thumbnail": "/templates/ecommerce-store.png",
                "tags": ["ecommerce", "store", "shop"],
                "pages_config": {
                    "home": {
                        "title": "Home",
                        "is_homepage": True,
                        "content": {
                            "elements": [
                                {
                                    "id": "hero-1",
                                    "type": "hero",
                                    "position": {"x": 0, "y": 0},
                                    "size": {"width": 1440, "height": 600},
                                    "props": {
                                        "title": "Shop the Latest Collection",
                                        "subtitle": "Discover amazing products at unbeatable prices",
                                        "primaryCta": "Shop Now",
                                        "secondaryCta": "View Catalog",
                                        "alignment": "center",
                                        "backgroundType": "image",
                                        "imageUrl": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1440"
                                    },
                                    "style": {}
                                },
                                {
                                    "id": "features-1",
                                    "type": "features",
                                    "position": {"x": 0, "y": 600},
                                    "size": {"width": 1440, "height": 400},
                                    "props": {
                                        "title": "Why Shop With Us",
                                        "columns": 4,
                                        "features": [
                                            {"icon": "Truck", "title": "Free Shipping", "description": "On orders over $50"},
                                            {"icon": "Shield", "title": "Secure Payment", "description": "100% secure checkout"},
                                            {"icon": "RotateCcw", "title": "Easy Returns", "description": "30-day return policy"},
                                            {"icon": "Headphones", "title": "24/7 Support", "description": "Always here to help"}
                                        ]
                                    },
                                    "style": {}
                                }
                            ]
                        }
                    }
                },
                "downloads": 2100,
                "rating": 4.9,
                "isPremium": True,
                "config": {},
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
        ]
    },
    "crm": {
        "id": "crm",
        "name": "CRM",
        "description": "Customer management, sales pipeline",
        "icon": "Users",
        "color": "bg-purple-500",
        "templates": []
    },
    "blog": {
        "id": "blog",
        "name": "Blog",
        "description": "Content publishing, articles",
        "icon": "FileText",
        "color": "bg-orange-500",
        "templates": [
            {
                "id": "blog-modern",
                "name": "Modern Blog",
                "description": "Clean and modern blog layout with featured posts",
                "category": "blog",
                "thumbnail": "/templates/blog-modern.png",
                "tags": ["blog", "content", "modern"],
                "pages_config": {
                    "home": {
                        "title": "Home",
                        "is_homepage": True,
                        "content": {
                            "elements": [
                                {
                                    "id": "hero-1",
                                    "type": "hero",
                                    "position": {"x": 0, "y": 0},
                                    "size": {"width": 1440, "height": 500},
                                    "props": {
                                        "title": "Welcome to Our Blog",
                                        "subtitle": "Insights, stories, and updates from our team",
                                        "primaryCta": "Read Latest Posts",
                                        "alignment": "center",
                                        "backgroundType": "gradient",
                                        "gradientFrom": "#f59e0b",
                                        "gradientTo": "#ef4444"
                                    },
                                    "style": {}
                                }
                            ]
                        }
                    }
                },
                "downloads": 890,
                "rating": 4.7,
                "isPremium": False,
                "config": {},
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
        ]
    },
    "booking": {
        "id": "booking",
        "name": "Booking",
        "description": "Appointments, reservations",
        "icon": "Calendar",
        "color": "bg-pink-500",
        "templates": []
    },
    "business": {
        "id": "business",
        "name": "Business App",
        "description": "Custom business tools",
        "icon": "Briefcase",
        "color": "bg-indigo-500",
        "templates": []
    }
}

@router.get("/app-types", response_model=Dict[str, Any])
async def get_app_types(db: Session = Depends(get_db)):
    """Get all app types with their templates"""
    try:
        template_service = TemplateService(db)
        result = await template_service.list_templates(per_page=100)
        
        # Group templates by category to create app types
        app_types = {}
        for template in result["templates"]:
            category = template["category"]
            if category not in app_types:
                app_types[category] = {
                    "id": category,
                    "name": category.replace("-", " ").title(),
                    "description": f"{category.replace('-', ' ').title()} applications and websites",
                    "icon": _get_category_icon(category),
                    "color": _get_category_color(category),
                    "templates": []
                }
            app_types[category]["templates"].append(template)
        
        return {
            "app_types": list(app_types.values()),
            "total": len(app_types)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch app types: {str(e)}"
        )

def _get_category_icon(category: str) -> str:
    """Get icon for category"""
    icons = {
        "landing": "Globe",
        "portfolio": "Briefcase", 
        "ecommerce": "ShoppingCart",
        "business": "Building",
        "blog": "FileText",
        "restaurant": "Utensils",
        "event": "Calendar",
        "saas": "Cloud",
        "agency": "Palette",
        "real-estate": "Home",
        "erp": "BarChart3",
        "lms": "GraduationCap",
        "shop": "Store",
        "crm": "Users",
        "management": "Briefcase",
        "hr": "UserCheck",
        "booking": "Calendar",
        "healthcare": "Heart",
        "fitness": "Dumbbell",
        "hospitality": "Building",
        "education": "BookOpen",
        "beauty": "Sparkles"
    }
    return icons.get(category, "Layout")

def _get_category_color(category: str) -> str:
    """Get color for category"""
    colors = {
        "landing": "bg-blue-500",
        "portfolio": "bg-purple-500",
        "ecommerce": "bg-green-500", 
        "business": "bg-indigo-500",
        "blog": "bg-orange-500",
        "restaurant": "bg-red-500",
        "event": "bg-pink-500",
        "saas": "bg-cyan-500",
        "agency": "bg-violet-500",
        "real-estate": "bg-emerald-500",
        "erp": "bg-slate-500",
        "lms": "bg-amber-500",
        "shop": "bg-teal-500",
        "crm": "bg-rose-500",
        "management": "bg-gray-500",
        "hr": "bg-lime-500",
        "booking": "bg-sky-500",
        "healthcare": "bg-blue-600",
        "fitness": "bg-green-600",
        "hospitality": "bg-purple-600",
        "education": "bg-yellow-500",
        "beauty": "bg-pink-400"
    }
    return colors.get(category, "bg-gray-500")

@router.get("/", response_model=Dict[str, Any])
async def get_templates(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all templates or filter by category"""
    try:
        template_service = TemplateService(db)
        result = await template_service.list_templates(category=category, per_page=100)
        
        return {
            "templates": result["templates"],
            "total": result["total"],
            "categories": result["categories"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch templates: {str(e)}"
        )

@router.get("/elements", response_model=Dict[str, Any])
async def get_premade_elements(category: Optional[str] = None):
    """Get premade element templates"""
    try:
        if category:
            elements = PREMADE_ELEMENTS.get(category, [])
            return {"elements": elements, "category": category}
        
        return {"elements": PREMADE_ELEMENTS, "categories": list(PREMADE_ELEMENTS.keys())}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch elements: {str(e)}"
        )

@router.get("/elements/{category}")
async def get_elements_by_category(category: str):
    """Get elements for a specific category"""
    if category not in PREMADE_ELEMENTS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{category}' not found"
        )
    
    return {
        "category": category,
        "elements": PREMADE_ELEMENTS[category]
    }

@router.post("/{template_id}/install")
async def install_template(
    template_id: str,
    request: InstallTemplateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Install a template as a new app"""
    try:
        template_service = TemplateService(db)
        template = await template_service.get_template(template_id)
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template '{template_id}' not found"
            )
        
        # Use AppBuilderService to create the app with the template
        from services.app_builder import AppBuilderService
        app_builder = AppBuilderService(db)
        
        app = await app_builder.create_app(
            user_id=current_user.id,
            name=request.app_name,
            description=template.get("description", ""),
            app_type=template.get("category", "website"),
            template_id=template_id,
            config=template.get("config", {}),
            theme_config=template.get("theme_config", {})
        )
        
        return {
            "success": True,
            "app_id": str(app.id),
            "message": f"Template '{template_id}' installed as '{request.app_name}'"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to install template: {str(e)}"
        )

@router.get("/{template_id}")
async def get_template(template_id: str, db: Session = Depends(get_db)):
    """Get a specific template"""
    try:
        template_service = TemplateService(db)
        template = await template_service.get_template(template_id)
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template '{template_id}' not found"
            )
        
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch template: {str(e)}"
        )