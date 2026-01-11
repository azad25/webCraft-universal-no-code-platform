"""
WebCraft API v2 - Domain-Driven Architecture
Main FastAPI application with structured domain modules
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time

from src.core.config import settings
from src.core.database import engine, Base
from src.middleware.rate_limiting import RateLimitMiddleware
from src.common.exceptions import AppException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting WebCraft API v2...")
    
    # Create V2 database schema
    try:
        from src.migrations.create_v2_schema import create_v2_schema
        create_v2_schema()
    except Exception as e:
        logger.error(f"Failed to create V2 schema: {e}")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Seed initial data
    from src.domains.templates.seed_data import seed_templates
    from src.domains.auth.seed_data import seed_users
    from src.core.database import SessionLocal
    
    db = SessionLocal()
    try:
        seed_users(db)
        seed_templates(db)
    except Exception as e:
        logger.error(f"Failed to seed data: {e}")
    finally:
        db.close()
    
    yield
    
    logger.info("Shutting down WebCraft API v2...")


def create_v2_app() -> FastAPI:
    """Create and configure FastAPI application for v2 routes"""
    
    app = FastAPI(
        title="WebCraft API v2",
        description="Domain-driven architecture API for WebCraft platform",
        version="2.0.0",
        docs_url="/docs",  # Enable docs for V2
        redoc_url="/redoc",
        openapi_url="/openapi.json"
    )
    
    # Import domain routers (all available ones)
    from src.domains.auth.router import router as auth_router
    from src.domains.apps.router import router as apps_router
    from src.domains.templates.router import router as templates_router
    from src.domains.widgets.router import router as widgets_router
    from src.domains.pages.router import router as pages_router
    from src.domains.media.router import router as media_router
    from src.domains.collections.router import router as collections_router
    from src.domains.data_sources.router import router as data_sources_router
    from src.domains.scrapers.router import router as scrapers_router
    from src.domains.ai.router import router as ai_router
    from src.domains.analytics.router import router as analytics_router
    from src.domains.automation.router import router as automation_router
    from src.domains.actions.router import router as actions_router
    from src.domains.custom_assets.router import router as custom_assets_router
    from src.domains.cross_app.router import router as cross_app_router
    from src.domains.data_flow.router import router as data_flow_router
    from src.domains.export.router import router as export_router
    from src.domains.integrations.router import router as integrations_router
    from src.domains.notifications.router import router as notifications_router
    from src.domains.payment.router import router as payment_router
    from src.domains.preview.router import router as preview_router
    from src.domains.seo.router import router as seo_router
    from src.domains.billing.router import router as billing_router
    from src.domains.webhooks.router import router as webhooks_router
    from src.domains.ecommerce.router import router as ecommerce_router
    from src.domains.mobile.router import router as mobile_router
    from src.domains.crm.router import router as crm_router
    from src.domains.graphql.router import router as graphql_router
    from src.domains.setup.router import router as setup_router
    from src.domains.content_api.router import router as content_api_router
    from src.domains.live_apps.router import router as live_apps_router
    from src.domains.modules.router import router as modules_router
    from src.domains.sdk.router import router as sdk_router
    from src.domains.widget_layers.router import router as widget_layers_router
    
    # Include domain routers (some have their own prefixes, others need them)
    app.include_router(auth_router, prefix="/auth", tags=["Authentication v2"])
    app.include_router(apps_router, prefix="/apps", tags=["Apps v2"])
    app.include_router(templates_router, prefix="/templates", tags=["Templates v2"])
    app.include_router(widgets_router, tags=["Widgets v2"])  # Has own prefix
    app.include_router(pages_router, tags=["Pages v2"])  # Has own prefix with app_id
    app.include_router(media_router, tags=["Media v2"])  # Has own prefix with app_id
    app.include_router(collections_router, tags=["Collections v2"])  # Has own prefix with app_id
    app.include_router(data_sources_router, tags=["Data Sources v2"])  # Has own prefix
    app.include_router(scrapers_router, tags=["Scrapers v2"])  # Has own prefix with app_id
    app.include_router(ai_router, tags=["AI v2"])  # Has own prefix
    app.include_router(analytics_router, tags=["Analytics v2"])  # Has own prefix with app_id
    app.include_router(automation_router, tags=["Automation v2"])  # Has own prefix with app_id
    app.include_router(actions_router, tags=["Actions v2"])  # Has own prefix
    app.include_router(custom_assets_router, tags=["Custom Assets v2"])  # Has own prefix with app_id
    app.include_router(cross_app_router, tags=["Cross-App v2"])  # Has own prefix
    app.include_router(data_flow_router, tags=["Data Flow v2"])  # Has own prefix with app_id
    app.include_router(export_router, prefix="/export", tags=["Export v2"])
    app.include_router(integrations_router, tags=["Integrations v2"])  # Has own prefix
    app.include_router(notifications_router, tags=["Notifications v2"])  # Has own prefix
    app.include_router(payment_router, tags=["Payment v2"])  # Has own prefix (/billing)
    app.include_router(preview_router, tags=["Preview v2"])  # Has own prefix
    app.include_router(seo_router, tags=["SEO v2"])  # Has own prefix
    app.include_router(billing_router, prefix="/billing", tags=["Billing v2"])
    app.include_router(webhooks_router, tags=["Webhooks v2"])  # Has own prefix
    app.include_router(ecommerce_router, prefix="/ecommerce", tags=["E-commerce v2"])
    app.include_router(mobile_router, tags=["Mobile v2"])  # Has own prefix
    app.include_router(crm_router, tags=["CRM v2"])  # Has own prefix with app_id
    app.include_router(graphql_router, tags=["GraphQL v2"])  # Has own prefix
    app.include_router(setup_router, tags=["Setup v2"])  # Has own prefix
    app.include_router(content_api_router, tags=["Content API v2"])  # Has own prefix
    app.include_router(live_apps_router, tags=["Live Apps v2"])  # Has own prefix
    app.include_router(modules_router, tags=["Modules v2"])  # Has own prefix
    app.include_router(sdk_router, tags=["SDK v2"])  # Has own prefix
    app.include_router(widget_layers_router, tags=["Widget Layers v2"])  # Has own prefix with app_id
    
    # Exception handlers
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.error_code,
                "message": exc.message,
                "details": exc.details
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred"
            }
        )
    
    return app


# Create the v2 application instance
v2_app = create_v2_app()


# Standalone app for testing
def create_standalone_app() -> FastAPI:
    """Create standalone app for direct testing"""
    
    app = FastAPI(
        title="WebCraft Universal No-Code Platform API v2",
        description="A comprehensive API for building websites, web apps, and business tools",
        version="2.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Rate limiting middleware
    app.add_middleware(RateLimitMiddleware)
    
    # Exception handlers
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.error_code,
                "message": exc.message,
                "details": exc.details
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred"
            }
        )
    
    # Health check
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": "2.0.0", "architecture": "domain-driven"}
    
    return app


# For direct execution
app = create_standalone_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8001,  # Different port for testing
        reload=True,
        log_level="info"
    )
