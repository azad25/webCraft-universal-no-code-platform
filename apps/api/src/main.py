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

# Import all domain models to ensure proper relationship resolution
import src.domains

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting WebCraft API v2...")
    
    # Only initialize database when running V2 standalone
    # When V2 is imported by V1, skip database initialization to avoid conflicts
    try:
        import inspect
        frame = inspect.currentframe()
        # Check if we're being called from V1's main.py
        is_imported_by_v1 = False
        while frame:
            if 'main.py' in frame.f_code.co_filename and 'apps/api/main.py' in frame.f_code.co_filename:
                is_imported_by_v1 = True
                break
            frame = frame.f_back
        
        if not is_imported_by_v1:
            logger.info("Running V2 standalone - initializing database...")
            
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
        else:
            logger.info("V2 imported by V1 - skipping database initialization")
            
    except Exception as e:
        logger.error(f"Failed to initialize V2: {e}")
    
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
        # Note: No lifespan when imported by V1 to avoid table conflicts
    )
    
    # Import domain routers (only working ones to avoid import errors)
    try:
        from src.domains.auth.router import router as auth_router
        app.include_router(auth_router, prefix="/auth", tags=["Authentication v2"])
    except ImportError as e:
        logger.warning(f"Could not import auth router: {e}")
    
    try:
        from src.domains.apps.router import router as apps_router
        app.include_router(apps_router, prefix="/apps", tags=["Apps v2"])
    except ImportError as e:
        logger.warning(f"Could not import apps router: {e}")
    
    try:
        from src.domains.templates.router import router as templates_router
        app.include_router(templates_router, prefix="/templates", tags=["Templates v2"])
    except ImportError as e:
        logger.warning(f"Could not import templates router: {e}")
    
    try:
        from src.domains.links.router import router as links_router
        app.include_router(links_router, tags=["Links v2"])
    except ImportError as e:
        logger.warning(f"Could not import links router: {e}")
    
    try:
        from src.domains.push.router import router as push_router
        app.include_router(push_router, tags=["Push Notifications v2"])
    except ImportError as e:
        logger.warning(f"Could not import push router: {e}")
    
    try:
        from src.domains.storage.router import router as storage_router
        app.include_router(storage_router, tags=["Storage v2"])
    except ImportError as e:
        logger.warning(f"Could not import storage router: {e}")
    
    try:
        from src.domains.relations.router import router as relations_router
        app.include_router(relations_router, tags=["Relations v2"])
    except ImportError as e:
        logger.warning(f"Could not import relations router: {e}")
    
    try:
        from src.domains.scheduler.router import router as scheduler_router
        app.include_router(scheduler_router, tags=["Scheduler v2"])
    except ImportError as e:
        logger.warning(f"Could not import scheduler router: {e}")
    
    try:
        from src.domains.incoming.router import router as incoming_router
        app.include_router(incoming_router, tags=["Incoming Webhooks v2"])
    except ImportError as e:
        logger.warning(f"Could not import incoming router: {e}")
    
    # Add other working routers as they become available
    try:
        from src.domains.media.router import router as media_router
        app.include_router(media_router, tags=["Media v2"])
    except ImportError as e:
        logger.warning(f"Could not import media router: {e}")
    
    try:
        from src.domains.pages.router import router as pages_router
        app.include_router(pages_router, tags=["Pages v2"])
    except ImportError as e:
        logger.warning(f"Could not import pages router: {e}")
    
    try:
        from src.domains.widgets.router import router as widgets_router
        app.include_router(widgets_router, tags=["Widgets v2"])
    except ImportError as e:
        logger.warning(f"Could not import widgets router: {e}")
    
    try:
        from src.domains.custom_assets.router import router as custom_assets_router
        app.include_router(custom_assets_router, tags=["Custom Assets v2"])
    except ImportError as e:
        logger.warning(f"Could not import custom assets router: {e}")
    
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
    
    # Import and include routers with error handling
    try:
        from src.domains.auth.router import router as auth_router
        app.include_router(auth_router, prefix="/auth", tags=["Authentication v2"])
    except ImportError as e:
        logger.warning(f"Could not import auth router: {e}")
    
    try:
        from src.domains.apps.router import router as apps_router
        app.include_router(apps_router, prefix="/apps", tags=["Apps v2"])
    except ImportError as e:
        logger.warning(f"Could not import apps router: {e}")
    
    try:
        from src.domains.templates.router import router as templates_router
        app.include_router(templates_router, prefix="/templates", tags=["Templates v2"])
    except ImportError as e:
        logger.warning(f"Could not import templates router: {e}")
    
    try:
        from src.domains.preview.router import router as preview_router
        app.include_router(preview_router, tags=["Preview v2"])
    except ImportError as e:
        logger.warning(f"Could not import preview router: {e}")
    
    try:
        from src.domains.custom_assets.router import router as custom_assets_router
        app.include_router(custom_assets_router, tags=["Custom Assets v2"])
    except ImportError as e:
        logger.warning(f"Could not import custom assets router: {e}")
    
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
