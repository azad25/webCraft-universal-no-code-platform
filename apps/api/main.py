"""
WebCraft Universal No-Code Platform API
Main FastAPI application with modular architecture
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
import uvicorn
import time
from contextlib import asynccontextmanager

# Import v1 routers (existing)
from routers import auth, apps, templates, ai, mobile_api
from routers import widgets, seo, modules, content_api
from routers import automations, export, pages, integrations
from routers import data_sources, scrapers, media
from routers import collections, analytics, payment, preview
from routers import graphql, webhooks, notifications, sdk, setup, live_apps
from routers import actions, data_flow  # New enhanced routers
from routers import custom_assets  # Custom assets router
from routers import cross_app  # Cross-app communication router
from middleware.rate_limiting import RateLimitMiddleware
from core.database import init_db
from core.redis_client import init_redis
from core.kafka_client import init_kafka
from core.module_system import module_registry
from middleware.seo_middleware import SEOMiddleware
from middleware.ai_crawler_middleware import AICrawlerMiddleware

# Import v2 app from restructured backend
try:
    from src.main import v2_app
    HAS_V2_APP = True
    print("✓ V2 API loaded successfully")
except ImportError as e:
    print(f"⚠ Warning: Could not import v2 app: {e}")
    HAS_V2_APP = False


async def init_modules():
    """Initialize the module system"""
    from modules import register_builtin_modules
    register_builtin_modules()
    
    # Enable core modules by default
    core_modules = [
        "core.widgets",
        "core.integrations", 
        "core.analytics",
        "core.ai_providers",
        "core.storage",
        "core.notifications",
        "core.data_sources",
        "core.web_scraper"
    ]
    for module_id in core_modules:
        try:
            await module_registry.enable_module(module_id)
        except Exception as e:
            print(f"Failed to enable {module_id}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    # Initialize database
    await init_db()
    
    # Initialize Redis
    await init_redis()
    
    # Initialize Kafka
    await init_kafka()
    
    # Initialize module system
    await init_modules()
    
    # Initialize scheduler for automations
    try:
        from services.scheduler_service import init_scheduler, shutdown_scheduler
        await init_scheduler()
        print("✓ Automation scheduler initialized")
    except Exception as e:
        print(f"⚠ Failed to initialize scheduler: {e}")
    
    # Register module routes dynamically
    for module in module_registry.get_all_modules().values():
        for router in module.get_routes():
            app.include_router(router, prefix="/api/v1")
    
    print("✓ WebCraft API started successfully")
    print(f"  - V1 API: /api/v1/*")
    if HAS_V2_APP:
        print(f"  - V2 API: /api/v2/*")
    
    yield
    
    # Cleanup on shutdown
    print("Shutting down WebCraft API...")
    
    # Shutdown scheduler
    try:
        from services.scheduler_service import shutdown_scheduler
        await shutdown_scheduler()
    except:
        pass


# Create FastAPI app with comprehensive configuration
app = FastAPI(
    title="WebCraft Universal Platform API",
    description="""
    ## WebCraft API - Build Anything, Deploy Everywhere
    
    A comprehensive no-code platform API that enables building:
    - **Business Apps**: ERP, CRM, Project Management
    - **E-commerce**: Online stores, Inventory systems
    - **Content Sites**: Blogs, Portfolios, Documentation
    - **Service Platforms**: Booking, Delivery, Marketplaces
    - **Mobile Apps**: iOS/Android via API integration
    
    ### Key Features:
    - 🚀 **SEO Optimized**: AI-crawler friendly with structured data
    - 📱 **Mobile Ready**: Complete REST/GraphQL APIs for mobile development
    - 🤖 **AI Powered**: Content generation, design assistance
    - 🔌 **Integrations**: 100+ third-party service connections
    - 🌐 **Multi-tenant**: Isolated data and customization
    - ⚡ **Real-time**: WebSocket support for live collaboration
    
    ### API Versions:
    - **v1**: Stable production API (all existing endpoints)
    - **v2**: Domain-driven architecture with enhanced features
    
    ### Authentication:
    - JWT Bearer tokens
    - OAuth2 (Google, GitHub, Microsoft)
    - API Keys for server-to-server
    
    ### Rate Limits:
    - Free tier: 1000 requests/hour
    - Pro tier: 10,000 requests/hour
    - Enterprise: Unlimited
    """,
    version="2.0.0",
    contact={
        "name": "WebCraft API Support",
        "url": "https://webcraft.dev/support",
        "email": "api@webcraft.dev",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    servers=[
        {"url": "https://api.webcraft.dev", "description": "Production server"},
        {"url": "https://staging-api.webcraft.dev", "description": "Staging server"},
        {"url": "http://localhost:8000", "description": "Development server"},
    ],
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Add middleware stack
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(SEOMiddleware)
app.add_middleware(AICrawlerMiddleware)
app.add_middleware(RateLimitMiddleware)


# Performance monitoring middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-API-Version"] = "2.0.0"
    return response


# Health check endpoints
@app.get("/health", tags=["System"])
async def health_check():
    """System health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "timestamp": time.time(),
        "services": {
            "database": "connected",
            "redis": "connected",
            "kafka": "connected"
        },
        "api_versions": {
            "v1": "available",
            "v2": "available" if HAS_V2_APP else "unavailable"
        }
    }


@app.get("/", tags=["System"])
async def root():
    """API root endpoint with platform information"""
    return {
        "message": "Welcome to WebCraft Universal Platform API",
        "version": "2.0.0",
        "documentation": "/docs",
        "graphql": "/graphql",
        "websocket": "/ws",
        "api_versions": {
            "v1": "/api/v1 - Stable production API",
            "v2": "/api/v2 - Domain-driven architecture" if HAS_V2_APP else "Not available"
        },
        "features": [
            "Universal app builder",
            "SEO optimized",
            "Mobile-friendly APIs",
            "AI-powered content generation",
            "Real-time collaboration",
            "Multi-tenant architecture"
        ]
    }


# ============================================
# V1 API ROUTES (Existing - Preserved)
# ============================================

# Core API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(apps.router, prefix="/api/v1/apps", tags=["App Builder"])
app.include_router(templates.router, prefix="/api/v1/templates", tags=["Templates"])
app.include_router(widgets.router, prefix="/api/v1/widgets", tags=["Widgets"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI Services"])
app.include_router(seo.router, prefix="/api/v1/seo", tags=["SEO & Marketing"])
app.include_router(modules.router, prefix="/api/v1/modules", tags=["Modules"])
app.include_router(content_api.router, prefix="/api/v1/content", tags=["Content API"])
app.include_router(automations.router, prefix="/api/v1", tags=["Automations"])
app.include_router(export.router, prefix="/api/v1", tags=["Export"])
app.include_router(pages.router, prefix="/api/v1", tags=["Pages"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["Integrations"])

# Data Sources and Web Scrapers
app.include_router(data_sources.router, prefix="/api/v1", tags=["Data Sources"])
app.include_router(scrapers.router, prefix="/api/v1", tags=["Web Scrapers"])

# Enhanced Actions & Events System
app.include_router(actions.router, prefix="/api/v1", tags=["Actions & Events"])

# Advanced Data Flow Management
app.include_router(data_flow.router, prefix="/api/v1", tags=["Data Flow"])

# Custom Assets (HTML, CSS, JS, Media)
app.include_router(custom_assets.router, prefix="/api/v1", tags=["Custom Assets"])

# Cross-App Communication
app.include_router(cross_app.router, prefix="/api/v1", tags=["Cross-App Communication"])

# Media Manager
app.include_router(media.router, prefix="/api/v1", tags=["Media"])

# Collections (User Database)
app.include_router(collections.router, prefix="/api/v1", tags=["Collections"])

# Mobile-specific API endpoints
app.include_router(mobile_api.router, prefix="/api/v1/mobile", tags=["Mobile API"])

# Analytics
app.include_router(analytics.router, prefix="/api/v1", tags=["Analytics"])

# Payment & Billing
app.include_router(payment.router, prefix="/api/v1/billing", tags=["Billing"])

# Preview
app.include_router(preview.router, prefix="/api/v1", tags=["Preview"])

# Live Apps (Deployed Apps)
app.include_router(live_apps.router, prefix="/api/v1", tags=["Live Apps"])

# GraphQL
app.include_router(graphql.router, tags=["GraphQL"])

# Webhooks
app.include_router(webhooks.router, prefix="/api/v1", tags=["Webhooks"])

# Notifications
app.include_router(notifications.router, prefix="/api/v1", tags=["Notifications"])

# SDK Generator
app.include_router(sdk.router, tags=["SDK"])

# Setup & Installation
app.include_router(setup.router, prefix="/api/v1", tags=["Setup"])


# ============================================
# V2 API ROUTES (New Domain-Driven Architecture)
# ============================================

if HAS_V2_APP:
    # Mount the entire v2 app under /api/v2
    app.mount("/api/v2", v2_app)


# Custom OpenAPI schema for better documentation
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="WebCraft Universal Platform API",
        version="2.0.0",
        description=app.description,
        routes=app.routes,
    )
    
    # Add custom schema extensions for mobile SDKs
    openapi_schema["x-mobile-sdks"] = {
        "ios": "https://github.com/webcraft/ios-sdk",
        "android": "https://github.com/webcraft/android-sdk",
        "react-native": "https://github.com/webcraft/react-native-sdk",
        "flutter": "https://github.com/webcraft/flutter-sdk"
    }
    
    # Add SEO-friendly metadata
    openapi_schema["x-seo-features"] = [
        "Structured data generation",
        "Meta tag optimization",
        "Sitemap generation",
        "AI crawler optimization",
        "Core Web Vitals monitoring"
    ]
    
    # Add API version info
    openapi_schema["x-api-versions"] = {
        "v1": {
            "status": "stable",
            "description": "Production API with all existing endpoints"
        },
        "v2": {
            "status": "available" if HAS_V2_APP else "unavailable",
            "description": "Domain-driven architecture with enhanced features"
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": str(request.url.path),
            "method": request.method,
            "timestamp": time.time()
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "timestamp": time.time()
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
