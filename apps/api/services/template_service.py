"""
Template Service
Handles template management, installation, and premade page templates
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import json

from services.additional_templates import ADDITIONAL_TEMPLATES

# Premade page templates with widget configurations
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
                        "id": "logos-1",
                        "type": "logo-cloud",
                        "props": {
                            "title": "Trusted by leading companies",
                            "logos": [
                                {"name": "TechCorp", "image": "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=60&fit=crop"},
                                {"name": "InnovateLab", "image": "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=60&fit=crop"},
                                {"name": "FutureWorks", "image": "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=60&fit=crop"},
                                {"name": "CloudTech", "image": "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=60&fit=crop"},
                                {"name": "DataFlow", "image": "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=60&fit=crop"}
                            ],
                            "variant": "grayscale"
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
                                },
                                {
                                    "icon": "Users", 
                                    "title": "Team Collaboration", 
                                    "description": "Work together seamlessly with real-time collaboration and role-based permissions"
                                },
                                {
                                    "icon": "BarChart", 
                                    "title": "Advanced Analytics", 
                                    "description": "Get deep insights with comprehensive analytics and custom reporting dashboards"
                                },
                                {
                                    "icon": "Headphones", 
                                    "title": "24/7 Support", 
                                    "description": "Round-the-clock expert support to help you succeed at every step"
                                }
                            ]
                        }
                    },
                    {
                        "id": "stats-1",
                        "type": "stats",
                        "props": {
                            "title": "Trusted by thousands worldwide",
                            "stats": [
                                {"value": "10,000+", "label": "Active Users", "icon": "Users"},
                                {"value": "99.9%", "label": "Uptime", "icon": "Activity"},
                                {"value": "24/7", "label": "Support", "icon": "Headphones"},
                                {"value": "50+", "label": "Integrations", "icon": "Puzzle"}
                            ],
                            "variant": "centered",
                            "animated": True
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
                                },
                                {
                                    "name": "Enterprise", 
                                    "price": "Custom", 
                                    "period": "", 
                                    "description": "For large organizations with custom needs",
                                    "features": [
                                        "Everything in Pro", 
                                        "Custom Integrations", 
                                        "Dedicated Support", 
                                        "SLA Guarantee",
                                        "Unlimited Storage",
                                        "Advanced Security",
                                        "Custom Training"
                                    ], 
                                    "cta": "Contact Sales",
                                    "popular": False
                                }
                            ]
                        }
                    },
                    {
                        "id": "testimonials-1",
                        "type": "testimonial",
                        "props": {
                            "title": "What our customers say",
                            "subtitle": "Don't just take our word for it - hear from some of our satisfied customers",
                            "variant": "grid",
                            "testimonials": [
                                {
                                    "quote": "This platform completely transformed how we build and deploy applications. The speed and reliability are unmatched.",
                                    "author": "Sarah Johnson",
                                    "role": "CTO, TechCorp",
                                    "avatar": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
                                    "rating": 5
                                },
                                {
                                    "quote": "Best investment we've made this year. The ROI was immediate and the support team is incredible.",
                                    "author": "Michael Chen",
                                    "role": "Founder, StartupXYZ",
                                    "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
                                    "rating": 5
                                },
                                {
                                    "quote": "The integration capabilities saved us months of development time. Highly recommended for any growing business.",
                                    "author": "Emily Rodriguez",
                                    "role": "Product Manager, InnovateLab",
                                    "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
                                    "rating": 5
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
                    },
                    {
                        "id": "footer-1",
                        "type": "footer",
                        "props": {
                            "logo": "StartupPro",
                            "logoImage": "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=40&h=40&fit=crop",
                            "description": "The all-in-one platform to launch your next big idea.",
                            "columns": [
                                {
                                    "title": "Product", 
                                    "links": [
                                        {"label": "Features", "href": "#features"}, 
                                        {"label": "Pricing", "href": "#pricing"}, 
                                        {"label": "Integrations", "href": "#integrations"},
                                        {"label": "API", "href": "/api"}
                                    ]
                                },
                                {
                                    "title": "Company", 
                                    "links": [
                                        {"label": "About", "href": "/about"}, 
                                        {"label": "Blog", "href": "/blog"}, 
                                        {"label": "Careers", "href": "/careers"},
                                        {"label": "Press", "href": "/press"}
                                    ]
                                },
                                {
                                    "title": "Support", 
                                    "links": [
                                        {"label": "Help Center", "href": "/help"}, 
                                        {"label": "Contact", "href": "/contact"}, 
                                        {"label": "Status", "href": "/status"},
                                        {"label": "Community", "href": "/community"}
                                    ]
                                }
                            ],
                            "socialLinks": [
                                {"platform": "twitter", "url": "https://twitter.com/startuppro"},
                                {"platform": "linkedin", "url": "https://linkedin.com/company/startuppro"},
                                {"platform": "github", "url": "https://github.com/startuppro"}
                            ],
                            "copyright": "© 2024 StartupPro. All rights reserved.",
                            "showNewsletter": True
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
                        "id": "about-1",
                        "type": "columns",
                        "props": {"columns": 2},
                        "children": [
                            {"type": "image", "props": {"src": "", "alt": "About me"}},
                            {"type": "text", "props": {"content": "About section content..."}}
                        ]
                    },
                    {
                        "id": "contact-1",
                        "type": "contact",
                        "props": {"title": "Let's Work Together", "email": "hello@example.com", "showForm": True}
                    },
                    {
                        "id": "footer-1",
                        "type": "footer",
                        "props": {"variant": "minimal", "socialLinks": []}
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
                    {"id": "products-1", "type": "product", "props": {"name": "Premium Headphones", "price": 199.99, "originalPrice": 249.99, "layout": "card", "showAddToCart": True, "showWishlist": True, "showRating": True}},
                    {"id": "products-2", "type": "product", "props": {"name": "Wireless Mouse", "price": 49.99, "layout": "card", "showAddToCart": True, "showWishlist": True, "showRating": True}},
                    {"id": "products-3", "type": "product", "props": {"name": "Mechanical Keyboard", "price": 129.99, "originalPrice": 159.99, "layout": "card", "showAddToCart": True, "showWishlist": True, "showRating": True}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Join Our Newsletter", "subtitle": "Get 10% off your first order", "variant": "newsletter"}},
                    {"id": "features-1", "type": "features", "props": {"columns": 4, "variant": "icons", "features": [{"icon": "Truck", "title": "Free Shipping"}, {"icon": "RefreshCw", "title": "Easy Returns"}, {"icon": "Shield", "title": "Secure Payment"}, {"icon": "Headphones", "title": "24/7 Support"}]}},
                    {"id": "footer-1", "type": "footer", "props": {"showNewsletter": True, "showPaymentIcons": True}}
                ]
            },
            {
                "name": "Shop",
                "slug": "shop",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ShopName", "showCart": True, "showSearch": True}},
                    {"id": "breadcrumb-1", "type": "breadcrumb", "props": {"items": [{"label": "Home", "href": "/"}, {"label": "Shop", "href": "/shop"}]}},
                    {"id": "products-1", "type": "product", "props": {"layout": "grid", "columns": 4, "showFilters": True}},
                    {"id": "footer-1", "type": "footer", "props": {}}
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
                    {"id": "logos-1", "type": "logo-cloud", "props": {"title": "Trusted by Industry Leaders"}},
                    {"id": "services-1", "type": "features", "props": {"title": "Our Services", "subtitle": "What we do best", "columns": 3, "variant": "cards"}},
                    {"id": "stats-1", "type": "stats", "props": {"variant": "background", "stats": [{"value": "500+", "label": "Projects Completed"}, {"value": "150+", "label": "Happy Clients"}, {"value": "15+", "label": "Years Experience"}, {"value": "50+", "label": "Team Members"}]}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "Client Success Stories", "variant": "carousel"}},
                    {"id": "team-1", "type": "team", "props": {"title": "Meet Our Team", "members": []}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Ready to Start Your Project?", "primaryCta": "Get Free Consultation"}},
                    {"id": "footer-1", "type": "footer", "props": {"variant": "detailed"}}
                ]
            },
            {
                "name": "About",
                "slug": "about",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "CompanyName"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "About Us", "subtitle": "Our story and mission", "variant": "simple"}},
                    {"id": "content-1", "type": "columns", "props": {"columns": 2}},
                    {"id": "timeline-1", "type": "timeline", "props": {"title": "Our Journey", "items": []}},
                    {"id": "team-1", "type": "team", "props": {"title": "Leadership Team"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            },
            {
                "name": "Contact",
                "slug": "contact",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "CompanyName"}},
                    {"id": "contact-1", "type": "contact", "props": {"title": "Get in Touch", "showMap": True, "showForm": True}},
                    {"id": "footer-1", "type": "footer", "props": {}}
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
                    {"id": "featured-1", "type": "card", "props": {"title": "Featured Post", "variant": "featured"}},
                    {"id": "posts-1", "type": "list", "props": {"title": "Latest Articles", "layout": "grid", "columns": 3}},
                    {"id": "newsletter-1", "type": "newsletter", "props": {"title": "Subscribe to Newsletter", "subtitle": "Get the latest posts delivered to your inbox"}},
                    {"id": "footer-1", "type": "footer", "props": {"variant": "simple"}}
                ]
            }
        ]
    },
    
    # Restaurant Templates
    "restaurant-menu": {
        "id": "restaurant-menu",
        "name": "Restaurant & Menu",
        "description": "Beautiful restaurant website with menu, reservations, and gallery",
        "category": "restaurant",
        "thumbnail": "/templates/restaurant-menu.png",
        "tags": ["restaurant", "food", "menu", "reservations"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Restaurant", "links": [{"label": "Menu", "href": "/menu"}, {"label": "About", "href": "/about"}, {"label": "Gallery", "href": "/gallery"}, {"label": "Contact", "href": "/contact"}], "ctaText": "Reserve Table", "variant": "overlay"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Fine Dining Experience", "subtitle": "Discover culinary excellence", "primaryCta": "View Menu", "secondaryCta": "Book a Table", "backgroundType": "video"}},
                    {"id": "about-1", "type": "columns", "props": {"columns": 2}},
                    {"id": "menu-preview-1", "type": "tabs", "props": {"title": "Our Menu", "tabs": [{"label": "Starters", "content": ""}, {"label": "Mains", "content": ""}, {"label": "Desserts", "content": ""}]}},
                    {"id": "gallery-1", "type": "gallery", "props": {"title": "Gallery", "layout": "grid"}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "What Our Guests Say"}},
                    {"id": "hours-1", "type": "stats", "props": {"title": "Opening Hours", "variant": "simple"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Make a Reservation", "primaryCta": "Book Now"}},
                    {"id": "footer-1", "type": "footer", "props": {"showMap": True}}
                ]
            }
        ]
    },
    
    # Event/Conference Templates
    "event-conference": {
        "id": "event-conference",
        "name": "Event & Conference",
        "description": "Event landing page with schedule, speakers, and registration",
        "category": "event",
        "thumbnail": "/templates/event-conference.png",
        "tags": ["event", "conference", "summit", "meetup"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "banner-1", "type": "banner", "props": {"text": "🎫 Early bird tickets available - Save 30%!", "variant": "gradient"}},
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "EventName 2024", "links": [{"label": "Speakers", "href": "#speakers"}, {"label": "Schedule", "href": "#schedule"}, {"label": "Venue", "href": "#venue"}, {"label": "Sponsors", "href": "#sponsors"}], "ctaText": "Get Tickets"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "The Future of Tech", "subtitle": "March 15-17, 2024 • San Francisco", "primaryCta": "Register Now", "secondaryCta": "View Schedule"}},
                    {"id": "countdown-1", "type": "countdown", "props": {"targetDate": "2024-03-15T09:00:00", "title": "Event Starts In"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "50+", "label": "Speakers"}, {"value": "3", "label": "Days"}, {"value": "2000+", "label": "Attendees"}, {"value": "100+", "label": "Sessions"}]}},
                    {"id": "speakers-1", "type": "team", "props": {"title": "Featured Speakers", "variant": "speakers"}},
                    {"id": "schedule-1", "type": "tabs", "props": {"title": "Event Schedule", "tabs": [{"label": "Day 1", "content": ""}, {"label": "Day 2", "content": ""}, {"label": "Day 3", "content": ""}]}},
                    {"id": "pricing-1", "type": "pricing", "props": {"title": "Ticket Options", "plans": [{"name": "Standard", "price": "$299"}, {"name": "VIP", "price": "$599", "highlighted": True}, {"name": "Group (5+)", "price": "$249/each"}]}},
                    {"id": "sponsors-1", "type": "logo-cloud", "props": {"title": "Our Sponsors"}},
                    {"id": "venue-1", "type": "map", "props": {"title": "Venue Location"}},
                    {"id": "faq-1", "type": "faq", "props": {"title": "Frequently Asked Questions"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Don't Miss Out!", "subtitle": "Limited seats available", "primaryCta": "Get Your Ticket"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            }
        ]
    },

    # SaaS Product Templates
    "saas-product": {
        "id": "saas-product",
        "name": "SaaS Product Page",
        "description": "Feature-rich SaaS product landing page with demos and pricing",
        "category": "saas",
        "thumbnail": "/templates/saas-product.png",
        "tags": ["saas", "software", "product", "app"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ProductName", "links": [{"label": "Features", "href": "#features"}, {"label": "Pricing", "href": "#pricing"}, {"label": "Docs", "href": "/docs"}, {"label": "Blog", "href": "/blog"}], "ctaText": "Start Free", "secondaryCta": "Sign In"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "The Modern Way to Build", "subtitle": "Ship faster with our all-in-one platform", "primaryCta": "Start Free Trial", "secondaryCta": "Book Demo", "showProductImage": True}},
                    {"id": "logos-1", "type": "logo-cloud", "props": {"title": "Powering teams at"}},
                    {"id": "features-1", "type": "features", "props": {"title": "Why Choose Us", "columns": 3, "variant": "detailed"}},
                    {"id": "comparison-1", "type": "comparison", "props": {"title": "See How We Compare", "competitors": ["Us", "Competitor A", "Competitor B"]}},
                    {"id": "video-1", "type": "video", "props": {"title": "See It In Action", "videoType": "youtube", "videoId": ""}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "Loved by Developers", "variant": "grid"}},
                    {"id": "pricing-1", "type": "pricing", "props": {"title": "Simple Pricing", "showToggle": True}},
                    {"id": "faq-1", "type": "faq", "props": {"title": "Common Questions"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Ready to Get Started?", "primaryCta": "Start Free Trial", "subtitle": "No credit card required"}},
                    {"id": "footer-1", "type": "footer", "props": {"variant": "detailed"}}
                ]
            }
        ]
    },
    
    # Agency Templates
    "agency-digital": {
        "id": "agency-digital",
        "name": "Digital Agency",
        "description": "Creative digital agency website with portfolio and services",
        "category": "agency",
        "thumbnail": "/templates/agency-digital.png",
        "tags": ["agency", "digital", "creative", "marketing"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "AgencyName", "links": [{"label": "Work", "href": "/work"}, {"label": "Services", "href": "/services"}, {"label": "About", "href": "/about"}, {"label": "Contact", "href": "/contact"}], "variant": "dark"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "We Create Digital Experiences", "subtitle": "Award-winning agency for brands that want to stand out", "primaryCta": "View Our Work", "variant": "fullscreen"}},
                    {"id": "work-1", "type": "gallery", "props": {"title": "Selected Work", "layout": "featured", "showCategories": True}},
                    {"id": "services-1", "type": "accordion", "props": {"title": "What We Do", "items": [{"title": "Brand Strategy", "content": ""}, {"title": "Web Design", "content": ""}, {"title": "Development", "content": ""}, {"title": "Marketing", "content": ""}]}},
                    {"id": "process-1", "type": "steps", "props": {"title": "Our Process", "steps": [{"title": "Discover", "description": ""}, {"title": "Design", "description": ""}, {"title": "Develop", "description": ""}, {"title": "Deliver", "description": ""}]}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"variant": "large"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Have a Project in Mind?", "primaryCta": "Let's Talk", "variant": "dark"}},
                    {"id": "footer-1", "type": "footer", "props": {"variant": "dark"}}
                ]
            }
        ]
    },
    
    # Real Estate Templates
    "real-estate": {
        "id": "real-estate",
        "name": "Real Estate Listings",
        "description": "Property listings website with search and property details",
        "category": "real-estate",
        "thumbnail": "/templates/real-estate.png",
        "tags": ["real-estate", "property", "listings", "homes"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "RealtyPro", "links": [{"label": "Buy", "href": "/buy"}, {"label": "Rent", "href": "/rent"}, {"label": "Sell", "href": "/sell"}, {"label": "Agents", "href": "/agents"}], "ctaText": "List Property"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Find Your Dream Home", "subtitle": "Search thousands of properties", "showSearch": True, "backgroundType": "image"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "10K+", "label": "Properties"}, {"value": "5K+", "label": "Happy Clients"}, {"value": "500+", "label": "Agents"}, {"value": "50+", "label": "Cities"}]}},
                    {"id": "featured-1", "type": "card", "props": {"title": "Featured Properties", "layout": "grid", "columns": 3}},
                    {"id": "services-1", "type": "features", "props": {"title": "Our Services", "columns": 3}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "Client Stories"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Ready to Find Your Home?", "primaryCta": "Browse Properties"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
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
    },
    "faq-accordion": {
        "id": "faq-accordion",
        "name": "FAQ Accordion",
        "category": "faq",
        "element": {"type": "faq", "props": {"variant": "accordion"}}
    },
    "team-grid": {
        "id": "team-grid",
        "name": "Team Grid",
        "category": "team",
        "element": {"type": "team", "props": {"columns": 4, "showSocial": True}}
    },
    "contact-split": {
        "id": "contact-split",
        "name": "Contact Split",
        "category": "contact",
        "element": {"type": "contact", "props": {"showMap": True, "showForm": True, "layout": "split"}}
    },
    "stats-counter": {
        "id": "stats-counter",
        "name": "Stats Counter",
        "category": "stats",
        "element": {"type": "stats", "props": {"animated": True, "columns": 4}}
    }
}

# Merge additional templates into PREMADE_TEMPLATES
PREMADE_TEMPLATES.update(ADDITIONAL_TEMPLATES)


class TemplateService:
    """Service for managing templates"""
    
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
        
        from core.database import Template, TemplatePage
        
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
        
        # Get categories
        categories = self.db.query(Template.category).distinct().all()
        categories = [cat[0] for cat in categories]
        
        # Featured templates (top 6 by downloads)
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
        
        return {
            "templates": template_list,
            "total": total,
            "page": page,
            "per_page": per_page,
            "categories": categories,
            "featured": featured
        }
    
    async def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get a single template by ID"""
        from core.database import Template, TemplatePage
        
        template = self.db.query(Template).filter(Template.slug == template_id).first()
        if not template:
            # Only fallback to hardcoded templates if not found in database
            return PREMADE_TEMPLATES.get(template_id)
        
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
    
    async def get_categories(self) -> List[Dict[str, Any]]:
        """Get all template categories with counts"""
        categories = {}
        for template in PREMADE_TEMPLATES.values():
            cat = template["category"]
            if cat not in categories:
                categories[cat] = {"name": cat, "count": 0, "icon": self._get_category_icon(cat)}
            categories[cat]["count"] += 1
        
        return list(categories.values())
    
    async def get_featured_templates(self, limit: int = 6) -> List[Dict[str, Any]]:
        """Get featured templates"""
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
        pass  # Would update database
    
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
        tags: List[str] = []
    ):
        """Create a new template"""
        template = {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": description,
            "category": category,
            "config": config,
            "pages": pages_config,
            "is_premium": is_premium,
            "price": price,
            "tags": tags,
            "creator_id": creator_id,
            "created_at": datetime.utcnow().isoformat()
        }
        return template
    
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
