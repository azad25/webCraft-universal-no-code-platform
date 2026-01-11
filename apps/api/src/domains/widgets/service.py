"""
Widgets domain service
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from .models import Widget


# Built-in widget definitions
BUILTIN_WIDGETS = [
    # Layout Widgets
    {"id": "container", "name": "Container", "slug": "container", "category": "layout", "icon": "square", "description": "A flexible container for grouping elements"},
    {"id": "columns", "name": "Columns", "slug": "columns", "category": "layout", "icon": "columns", "description": "Multi-column layout"},
    {"id": "section", "name": "Section", "slug": "section", "category": "layout", "icon": "layout", "description": "Full-width section container"},
    {"id": "spacer", "name": "Spacer", "slug": "spacer", "category": "layout", "icon": "move-vertical", "description": "Add vertical spacing"},
    {"id": "divider", "name": "Divider", "slug": "divider", "category": "layout", "icon": "minus", "description": "Horizontal divider line"},
    
    # Content Widgets
    {"id": "text", "name": "Text", "slug": "text", "category": "content", "icon": "type", "description": "Rich text content"},
    {"id": "heading", "name": "Heading", "slug": "heading", "category": "content", "icon": "heading", "description": "Heading text (H1-H6)"},
    {"id": "image", "name": "Image", "slug": "image", "category": "content", "icon": "image", "description": "Image with responsive options"},
    {"id": "video", "name": "Video", "slug": "video", "category": "content", "icon": "video", "description": "Video player"},
    {"id": "audio", "name": "Audio", "slug": "audio", "category": "content", "icon": "music", "description": "Audio player"},
    {"id": "gallery", "name": "Gallery", "slug": "gallery", "category": "content", "icon": "grid", "description": "Image gallery"},
    {"id": "embed", "name": "Embed", "slug": "embed", "category": "content", "icon": "code", "description": "Embed external content"},
    
    # Navigation Widgets
    {"id": "navbar", "name": "Navbar", "slug": "navbar", "category": "navigation", "icon": "menu", "description": "Navigation bar"},
    {"id": "footer", "name": "Footer", "slug": "footer", "category": "navigation", "icon": "layout", "description": "Page footer"},
    {"id": "breadcrumb", "name": "Breadcrumb", "slug": "breadcrumb", "category": "navigation", "icon": "chevrons-right", "description": "Breadcrumb navigation"},
    {"id": "tabs", "name": "Tabs", "slug": "tabs", "category": "navigation", "icon": "folder", "description": "Tabbed content"},
    {"id": "sidebar", "name": "Sidebar", "slug": "sidebar", "category": "navigation", "icon": "sidebar", "description": "Side navigation"},
    
    # Interactive Widgets
    {"id": "button", "name": "Button", "slug": "button", "category": "interactive", "icon": "mouse-pointer", "description": "Clickable button"},
    {"id": "form", "name": "Form", "slug": "form", "category": "interactive", "icon": "file-text", "description": "Form container"},
    {"id": "input", "name": "Input", "slug": "input", "category": "interactive", "icon": "edit", "description": "Text input field"},
    {"id": "search", "name": "Search", "slug": "search", "category": "interactive", "icon": "search", "description": "Search input"},
    {"id": "calendar", "name": "Calendar", "slug": "calendar", "category": "interactive", "icon": "calendar", "description": "Date picker"},
    {"id": "rating", "name": "Rating", "slug": "rating", "category": "interactive", "icon": "star", "description": "Star rating"},
    
    # Business Widgets
    {"id": "hero", "name": "Hero", "slug": "hero", "category": "business", "icon": "layout", "description": "Hero section"},
    {"id": "cta", "name": "CTA", "slug": "cta", "category": "business", "icon": "zap", "description": "Call to action"},
    {"id": "features", "name": "Features", "slug": "features", "category": "business", "icon": "grid", "description": "Feature showcase"},
    {"id": "testimonials", "name": "Testimonials", "slug": "testimonials", "category": "business", "icon": "message-circle", "description": "Customer testimonials"},
    {"id": "team", "name": "Team", "slug": "team", "category": "business", "icon": "users", "description": "Team members"},
    {"id": "pricing", "name": "Pricing", "slug": "pricing", "category": "business", "icon": "dollar-sign", "description": "Pricing tables"},
    
    # E-commerce Widgets
    {"id": "product", "name": "Product", "slug": "product", "category": "ecommerce", "icon": "shopping-bag", "description": "Product card"},
    {"id": "cart", "name": "Cart", "slug": "cart", "category": "ecommerce", "icon": "shopping-cart", "description": "Shopping cart"},
    {"id": "checkout", "name": "Checkout", "slug": "checkout", "category": "ecommerce", "icon": "credit-card", "description": "Checkout form"},
    
    # Data Widgets
    {"id": "table", "name": "Table", "slug": "table", "category": "data", "icon": "table", "description": "Data table"},
    {"id": "chart", "name": "Chart", "slug": "chart", "category": "data", "icon": "bar-chart", "description": "Data visualization"},
    {"id": "stats", "name": "Stats", "slug": "stats", "category": "data", "icon": "trending-up", "description": "Statistics display"},
    {"id": "progress", "name": "Progress", "slug": "progress", "category": "data", "icon": "loader", "description": "Progress bar"},
    
    # Marketing Widgets
    {"id": "newsletter", "name": "Newsletter", "slug": "newsletter", "category": "marketing", "icon": "mail", "description": "Newsletter signup"},
    {"id": "social", "name": "Social", "slug": "social", "category": "marketing", "icon": "share-2", "description": "Social media links"},
    {"id": "banner", "name": "Banner", "slug": "banner", "category": "marketing", "icon": "flag", "description": "Promotional banner"},
    {"id": "countdown", "name": "Countdown", "slug": "countdown", "category": "marketing", "icon": "clock", "description": "Countdown timer"},
    
    # Advanced Widgets
    {"id": "code", "name": "Code", "slug": "code", "category": "advanced", "icon": "code", "description": "Code block"},
    {"id": "map", "name": "Map", "slug": "map", "category": "advanced", "icon": "map-pin", "description": "Interactive map"},
    {"id": "timeline", "name": "Timeline", "slug": "timeline", "category": "advanced", "icon": "git-branch", "description": "Timeline display"},
    {"id": "faq", "name": "FAQ", "slug": "faq", "category": "advanced", "icon": "help-circle", "description": "FAQ accordion"},
    {"id": "accordion", "name": "Accordion", "slug": "accordion", "category": "advanced", "icon": "chevrons-down", "description": "Collapsible sections"},
]

WIDGET_CATEGORIES = [
    {"id": "layout", "name": "Layout", "slug": "layout", "icon": "layout", "description": "Layout and structure widgets"},
    {"id": "content", "name": "Content", "slug": "content", "icon": "file-text", "description": "Content display widgets"},
    {"id": "navigation", "name": "Navigation", "slug": "navigation", "icon": "menu", "description": "Navigation widgets"},
    {"id": "interactive", "name": "Interactive", "slug": "interactive", "icon": "mouse-pointer", "description": "Interactive elements"},
    {"id": "business", "name": "Business", "slug": "business", "icon": "briefcase", "description": "Business components"},
    {"id": "ecommerce", "name": "E-commerce", "slug": "ecommerce", "icon": "shopping-cart", "description": "E-commerce widgets"},
    {"id": "data", "name": "Data", "slug": "data", "icon": "database", "description": "Data display widgets"},
    {"id": "marketing", "name": "Marketing", "slug": "marketing", "icon": "megaphone", "description": "Marketing widgets"},
    {"id": "advanced", "name": "Advanced", "slug": "advanced", "icon": "settings", "description": "Advanced widgets"},
]


class WidgetService:
    """Widget service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all_widgets(
        self, 
        category: str = None, 
        search: str = None,
        is_premium: bool = None
    ) -> List[Dict[str, Any]]:
        """Get all available widgets"""
        widgets = BUILTIN_WIDGETS.copy()
        
        # Filter by category
        if category:
            widgets = [w for w in widgets if w.get("category") == category]
        
        # Filter by search
        if search:
            search_lower = search.lower()
            widgets = [w for w in widgets if search_lower in w.get("name", "").lower() or search_lower in w.get("description", "").lower()]
        
        # Filter by premium status
        if is_premium is not None:
            widgets = [w for w in widgets if w.get("is_premium", False) == is_premium]
        
        # Add default fields
        for widget in widgets:
            widget.setdefault("is_premium", False)
            widget.setdefault("price", 0)
            widget.setdefault("downloads", 0)
            widget.setdefault("rating", 0.0)
            widget.setdefault("config_schema", {})
            widget.setdefault("default_config", {})
        
        return widgets
    
    def get_categories(self) -> List[Dict[str, Any]]:
        """Get widget categories"""
        categories = []
        for cat in WIDGET_CATEGORIES:
            cat_copy = cat.copy()
            cat_copy["widget_count"] = len([w for w in BUILTIN_WIDGETS if w.get("category") == cat["slug"]])
            categories.append(cat_copy)
        return categories
    
    def get_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Get widget by slug"""
        for widget in BUILTIN_WIDGETS:
            if widget.get("slug") == slug:
                widget_copy = widget.copy()
                widget_copy.setdefault("is_premium", False)
                widget_copy.setdefault("price", 0)
                widget_copy.setdefault("downloads", 0)
                widget_copy.setdefault("rating", 0.0)
                widget_copy.setdefault("config_schema", {})
                widget_copy.setdefault("default_config", {})
                return widget_copy
        return None
    
    def get_widget_config(self, slug: str) -> Optional[Dict[str, Any]]:
        """Get widget configuration schema"""
        widget = self.get_by_slug(slug)
        if not widget:
            return None
        
        return {
            "widget_slug": slug,
            "schema": widget.get("config_schema", {}),
            "default_values": widget.get("default_config", {})
        }