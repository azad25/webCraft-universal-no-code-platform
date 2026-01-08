"""
Live Apps API Routes
Serves deployed apps on custom domains and subdomains
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import json
import os

from core.database import get_db, App, Page
from services.deployment_service import DeploymentService

router = APIRouter()


@router.get("/app/{app_slug}")
@router.get("/app/{app_slug}/{page_slug}")
async def serve_live_app(
    request: Request,
    app_slug: str,
    page_slug: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Serve a live deployed app
    
    This endpoint serves the actual deployed app that users access via their custom domains
    or subdomains. It renders the app exactly as designed in the editor.
    """
    
    # Find the app by slug
    app = db.query(App).filter(
        App.slug == app_slug,
        App.is_published == True
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found or not published")
    
    # Get the requested page or homepage
    if page_slug:
        page = db.query(Page).filter(
            Page.app_id == app.id,
            Page.slug == page_slug,
            Page.is_published == True
        ).first()
    else:
        page = db.query(Page).filter(
            Page.app_id == app.id,
            Page.is_homepage == True,
            Page.is_published == True
        ).first()
    
    if not page:
        # If no specific page found, get the first published page
        page = db.query(Page).filter(
            Page.app_id == app.id,
            Page.is_published == True
        ).first()
    
    if not page:
        raise HTTPException(status_code=404, detail="No published pages found")
    
    # Get all pages for navigation
    all_pages = db.query(Page).filter(
        Page.app_id == app.id,
        Page.is_published == True
    ).all()
    
    # Generate the live app HTML
    html_content = await generate_live_app_html(app, page, all_pages, request)
    
    return HTMLResponse(content=html_content)


@router.get("/api/app/{app_slug}/data")
async def get_live_app_data(
    app_slug: str,
    db: Session = Depends(get_db)
):
    """
    Get app data for client-side rendering
    
    This endpoint provides the app configuration and page data
    for single-page applications or dynamic rendering.
    """
    
    app = db.query(App).filter(
        App.slug == app_slug,
        App.is_published == True
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Get all published pages
    pages = db.query(Page).filter(
        Page.app_id == app.id,
        Page.is_published == True
    ).all()
    
    return {
        "app": {
            "id": str(app.id),
            "name": app.name,
            "slug": app.slug,
            "app_type": app.app_type,
            "config": app.config,
            "theme_config": app.theme_config,
            "seo_config": app.seo_config
        },
        "pages": [
            {
                "id": str(page.id),
                "title": page.title,
                "slug": page.slug,
                "content": page.content,
                "is_homepage": page.is_homepage,
                "meta_title": page.meta_title,
                "meta_description": page.meta_description
            }
            for page in pages
        ]
    }


async def generate_live_app_html(app: App, page: Page, all_pages: list, request: Request) -> str:
    """
    Generate the complete HTML for a live app
    
    This creates a fully functional HTML page that renders the app
    exactly as designed in the editor, with all widgets and styling.
    """
    
    # Get elements from app config or page content
    elements = app.config.get('elements', []) or page.content.get('elements', [])
    
    # Get theme configuration
    theme_config = app.theme_config or {}
    
    # Get SEO configuration
    seo_config = app.seo_config or {}
    
    # Build navigation menu
    nav_items = []
    for p in all_pages:
        nav_items.append({
            "title": p.title,
            "slug": p.slug,
            "url": f"/app/{app.slug}" if p.is_homepage else f"/app/{app.slug}/{p.slug}",
            "active": p.id == page.id
        })
    
    # Generate CSS for elements
    element_styles = generate_element_styles(elements, theme_config)
    
    # Generate HTML for elements
    element_html = generate_element_html(elements, theme_config)
    
    # Get the base URL for assets
    base_url = str(request.base_url).rstrip('/')
    
    html_template = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{page.meta_title or page.title or app.name}</title>
    <meta name="description" content="{page.meta_description or seo_config.get('description', '')}">
    
    <!-- SEO Meta Tags -->
    <meta property="og:title" content="{page.meta_title or page.title or app.name}">
    <meta property="og:description" content="{page.meta_description or seo_config.get('description', '')}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{request.url}">
    
    <!-- Favicon -->
    <link rel="icon" href="{base_url}/favicon.ico">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Custom Styles -->
    <style>
        {element_styles}
        
        /* Theme Styles */
        :root {{
            --primary-color: {theme_config.get('primaryColor', '#3b82f6')};
            --secondary-color: {theme_config.get('secondaryColor', '#64748b')};
            --accent-color: {theme_config.get('accentColor', '#f59e0b')};
            --background-color: {theme_config.get('backgroundColor', '#ffffff')};
            --text-color: {theme_config.get('textColor', '#1f2937')};
        }}
        
        body {{
            font-family: {theme_config.get('fontFamily', 'Inter, system-ui, sans-serif')};
            background-color: var(--background-color);
            color: var(--text-color);
        }}
        
        .webcraft-app {{
            min-height: 100vh;
            position: relative;
        }}
        
        .webcraft-element {{
            position: absolute;
        }}
        
        /* Responsive Design */
        @media (max-width: 768px) {{
            .webcraft-element {{
                position: relative !important;
                width: 100% !important;
                left: 0 !important;
                margin-bottom: 1rem;
            }}
        }}
    </style>
    
    <!-- Analytics -->
    {generate_analytics_code(app, seo_config)}
</head>
<body>
    <!-- Navigation (if app has multiple pages) -->
    {generate_navigation_html(nav_items, app) if len(all_pages) > 1 else ''}
    
    <!-- Main App Content -->
    <div class="webcraft-app" id="webcraft-app">
        {element_html}
    </div>
    
    <!-- Footer -->
    <div class="webcraft-footer text-center py-4 text-sm text-gray-500 border-t mt-8">
        <p>Powered by <a href="https://webcraft.dev" class="text-blue-600 hover:underline">WebCraft</a></p>
    </div>
    
    <!-- JavaScript -->
    <script>
        // App Configuration
        window.WEBCRAFT_APP = {json.dumps({
            'id': str(app.id),
            'name': app.name,
            'slug': app.slug,
            'config': app.config,
            'theme': theme_config,
            'currentPage': page.slug
        })};
        
        // Interactive Elements
        {generate_interactive_js(elements)}
        
        // Form Handling
        {generate_form_js(app)}
        
        // Analytics
        {generate_analytics_js(app, seo_config)}
    </script>
</body>
</html>
"""
    
    return html_template


def generate_element_styles(elements: list, theme_config: dict) -> str:
    """Generate CSS styles for all elements"""
    
    styles = []
    
    for element in elements:
        element_id = element.get('id', '')
        position = element.get('position', {})
        size = element.get('size', {})
        style = element.get('style', {})
        
        css_rules = []
        
        # Position and size
        if position.get('x') is not None:
            css_rules.append(f"left: {position['x']}px")
        if position.get('y') is not None:
            css_rules.append(f"top: {position['y']}px")
        if size.get('width'):
            css_rules.append(f"width: {size['width']}px")
        if size.get('height'):
            css_rules.append(f"height: {size['height']}px")
        
        # Custom styles
        for prop, value in style.items():
            css_prop = prop.replace('_', '-')
            css_rules.append(f"{css_prop}: {value}")
        
        if css_rules:
            styles.append(f"#{element_id} {{ {'; '.join(css_rules)} }}")
    
    return '\n'.join(styles)


def generate_element_html(elements: list, theme_config: dict) -> str:
    """Generate HTML for all elements"""
    
    html_parts = []
    
    for element in elements:
        element_type = element.get('type', '')
        element_id = element.get('id', '')
        props = element.get('props', {})
        
        # Generate HTML based on element type
        if element_type == 'hero':
            html_parts.append(generate_hero_html(element_id, props, theme_config))
        elif element_type == 'text':
            html_parts.append(generate_text_html(element_id, props))
        elif element_type == 'button':
            html_parts.append(generate_button_html(element_id, props, theme_config))
        elif element_type == 'image':
            html_parts.append(generate_image_html(element_id, props))
        elif element_type == 'form':
            html_parts.append(generate_form_html(element_id, props))
        elif element_type == 'navbar':
            html_parts.append(generate_navbar_html(element_id, props, theme_config))
        elif element_type == 'footer':
            html_parts.append(generate_footer_html(element_id, props, theme_config))
        else:
            # Generic element
            html_parts.append(f'<div id="{element_id}" class="webcraft-element">{props.get("content", "")}</div>')
    
    return '\n'.join(html_parts)


def generate_hero_html(element_id: str, props: dict, theme_config: dict) -> str:
    """Generate HTML for hero element"""
    
    title = props.get('title', 'Welcome')
    subtitle = props.get('subtitle', '')
    button_text = props.get('buttonText', 'Get Started')
    button_url = props.get('buttonUrl', '#')
    background_image = props.get('backgroundImage', '')
    
    bg_style = f'background-image: url({background_image});' if background_image else ''
    
    return f"""
    <div id="{element_id}" class="webcraft-element hero-section bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-6" style="{bg_style}">
        <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl md:text-6xl font-bold mb-6">{title}</h1>
            {f'<p class="text-xl md:text-2xl mb-8 opacity-90">{subtitle}</p>' if subtitle else ''}
            {f'<a href="{button_url}" class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">{button_text}</a>' if button_text else ''}
        </div>
    </div>
    """


def generate_text_html(element_id: str, props: dict) -> str:
    """Generate HTML for text element"""
    
    content = props.get('content', 'Sample text')
    alignment = props.get('alignment', 'left')
    
    return f"""
    <div id="{element_id}" class="webcraft-element text-element py-6 px-6">
        <div class="max-w-4xl mx-auto">
            <div class="prose prose-lg max-w-none text-{alignment}">
                <p>{content}</p>
            </div>
        </div>
    </div>
    """


def generate_button_html(element_id: str, props: dict, theme_config: dict) -> str:
    """Generate HTML for button element"""
    
    text = props.get('text', 'Button')
    url = props.get('url', '#')
    style = props.get('style', 'primary')
    
    button_class = 'bg-blue-600 text-white hover:bg-blue-700' if style == 'primary' else 'bg-gray-200 text-gray-800 hover:bg-gray-300'
    
    return f"""
    <div id="{element_id}" class="webcraft-element button-element py-6 px-6">
        <div class="max-w-4xl mx-auto text-center">
            <a href="{url}" class="{button_class} px-6 py-3 rounded-lg font-semibold transition-colors inline-block">
                {text}
            </a>
        </div>
    </div>
    """


def generate_image_html(element_id: str, props: dict) -> str:
    """Generate HTML for image element"""
    
    src = props.get('src', '')
    alt = props.get('alt', 'Image')
    
    return f"""
    <div id="{element_id}" class="webcraft-element image-element py-6 px-6">
        <div class="max-w-4xl mx-auto">
            <img src="{src}" alt="{alt}" class="w-full h-auto rounded-lg shadow-lg">
        </div>
    </div>
    """


def generate_form_html(element_id: str, props: dict) -> str:
    """Generate HTML for form element"""
    
    title = props.get('title', 'Contact Form')
    fields = props.get('fields', [])
    
    field_html = []
    for field in fields:
        field_name = field.get('name', '')
        field_label = field.get('label', '')
        field_type = field.get('type', 'text')
        required = field.get('required', False)
        
        if field_type == 'textarea':
            field_html.append(f"""
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">{field_label}</label>
                    <textarea name="{field_name}" class="w-full p-3 border border-gray-300 rounded-lg" {'required' if required else ''}></textarea>
                </div>
            """)
        else:
            field_html.append(f"""
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">{field_label}</label>
                    <input type="{field_type}" name="{field_name}" class="w-full p-3 border border-gray-300 rounded-lg" {'required' if required else ''}>
                </div>
            """)
    
    return f"""
    <div id="{element_id}" class="webcraft-element form-element py-12 px-6 bg-gray-50">
        <div class="max-w-2xl mx-auto">
            <form class="bg-white p-8 rounded-lg shadow-sm" onsubmit="handleFormSubmit(event, '{element_id}')">
                <h3 class="text-2xl font-bold mb-6">{title}</h3>
                {''.join(field_html)}
                <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Submit
                </button>
            </form>
        </div>
    </div>
    """


def generate_navbar_html(element_id: str, props: dict, theme_config: dict) -> str:
    """Generate HTML for navbar element"""
    
    brand = props.get('brand', 'Brand')
    links = props.get('links', [])
    
    link_html = []
    for link in links:
        link_html.append(f'<a href="{link.get("url", "#")}" class="text-gray-600 hover:text-gray-900 px-3 py-2">{link.get("text", "Link")}</a>')
    
    return f"""
    <nav id="{element_id}" class="webcraft-element navbar-element bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex justify-between items-center py-4">
                <div class="text-xl font-bold text-gray-900">{brand}</div>
                <div class="hidden md:flex space-x-4">
                    {''.join(link_html)}
                </div>
            </div>
        </div>
    </nav>
    """


def generate_footer_html(element_id: str, props: dict, theme_config: dict) -> str:
    """Generate HTML for footer element"""
    
    content = props.get('content', 'Footer content')
    
    return f"""
    <footer id="{element_id}" class="webcraft-element footer-element bg-gray-900 text-white py-12 px-6">
        <div class="max-w-7xl mx-auto text-center">
            <p>{content}</p>
        </div>
    </footer>
    """


def generate_navigation_html(nav_items: list, app: App) -> str:
    """Generate navigation HTML for multi-page apps"""
    
    if not nav_items:
        return ''
    
    nav_links = []
    for item in nav_items:
        active_class = 'bg-blue-100 text-blue-700' if item['active'] else 'text-gray-600 hover:text-gray-900'
        nav_links.append(f'<a href="{item["url"]}" class="{active_class} px-3 py-2 rounded-lg">{item["title"]}</a>')
    
    return f"""
    <nav class="bg-white shadow-sm border-b sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex justify-between items-center py-4">
                <div class="text-xl font-bold text-gray-900">{app.name}</div>
                <div class="flex space-x-2">
                    {''.join(nav_links)}
                </div>
            </div>
        </div>
    </nav>
    """


def generate_analytics_code(app: App, seo_config: dict) -> str:
    """Generate analytics tracking code"""
    
    google_analytics_id = seo_config.get('googleAnalyticsId', '')
    
    if google_analytics_id:
        return f"""
        <!-- Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id={google_analytics_id}"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){{dataLayer.push(arguments);}}
            gtag('js', new Date());
            gtag('config', '{google_analytics_id}');
        </script>
        """
    
    return ''


def generate_interactive_js(elements: list) -> str:
    """Generate JavaScript for interactive elements"""
    
    return """
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Mobile menu toggle (if needed)
    const mobileMenuButton = document.querySelector('[data-mobile-menu-button]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    """


def generate_form_js(app: App) -> str:
    """Generate JavaScript for form handling"""
    
    return f"""
    // Form submission handler
    function handleFormSubmit(event, formId) {{
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Submit to WebCraft form handler
        fetch('/api/v1/apps/{app.id}/forms/submit', {{
            method: 'POST',
            headers: {{
                'Content-Type': 'application/json',
            }},
            body: JSON.stringify({{
                formId: formId,
                data: data,
                timestamp: new Date().toISOString()
            }})
        }})
        .then(response => response.json())
        .then(result => {{
            if (result.success) {{
                alert('Form submitted successfully!');
                form.reset();
            }} else {{
                alert('Error submitting form. Please try again.');
            }}
        }})
        .catch(error => {{
            console.error('Form submission error:', error);
            alert('Error submitting form. Please try again.');
        }});
    }}
    """


def generate_analytics_js(app: App, seo_config: dict) -> str:
    """Generate JavaScript for analytics tracking"""
    
    return f"""
    // Page view tracking
    if (typeof gtag !== 'undefined') {{
        gtag('event', 'page_view', {{
            'page_title': document.title,
            'page_location': window.location.href,
            'app_id': '{app.id}',
            'app_name': '{app.name}'
        }});
    }}
    
    // Custom event tracking
    function trackEvent(eventName, parameters = {{}}) {{
        if (typeof gtag !== 'undefined') {{
            gtag('event', eventName, {{
                'app_id': '{app.id}',
                ...parameters
            }});
        }}
    }}
    
    // Track button clicks
    document.querySelectorAll('a, button').forEach(element => {{
        element.addEventListener('click', function() {{
            trackEvent('click', {{
                'element_type': this.tagName.toLowerCase(),
                'element_text': this.textContent.trim(),
                'element_href': this.href || ''
            }});
        }});
    }});
    """