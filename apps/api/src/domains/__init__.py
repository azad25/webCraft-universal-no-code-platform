# Domain modules - each domain is a self-contained business capability
# Following Domain-Driven Design principles

# Import all models to ensure proper SQLAlchemy relationship resolution
# Order matters for foreign key relationships

def import_all_models():
    """Import all domain models to ensure proper relationship resolution"""
    try:
        # Import models in dependency order to avoid circular references
        
        # 1. First import base models with no foreign key dependencies
        from src.domains.templates.models import Template, TemplateCategory
        
        # 2. Import User model (referenced by many others)
        from src.domains.auth.models import User, APIKey, PasswordResetToken, EmailVerificationToken, RefreshToken
        
        # 3. Import automation models BEFORE App model to ensure Automation class is available
        from src.domains.automation.models import Automation, AutomationLog
        
        # 4. Import App model (referenced by many others)  
        from src.domains.apps.models import App, PreviewSession
        
        # 5. Import models that depend on User and App
        from src.domains.ai.models import AIRequest, AITemplate, AIUsageStats
        from src.domains.pages.models import Page
        from src.domains.widgets.models import Widget, AppWidget
        from src.domains.media.models import MediaItem, MediaFolder
        from src.domains.collections.models import Collection, CollectionRecord, CollectionRelation
        from src.domains.data_sources.models import DataSource, DataSourceEndpoint, DataSourceCache, WidgetDataBinding
        from src.domains.scrapers.models import WebScraper, ScraperResult
        from src.domains.links.models import AppLink, LinkGroup, LinkGroupItem, LinkRedirect, LinkAnalytics
        from src.domains.push.models import PushSubscription, PushNotification, PushDelivery
        from src.domains.integrations.models import Integration, IntegrationLog
        from src.domains.custom_assets.models import CustomAsset
        
        # 6. Import optional models
        try:
            from src.domains.storage.models import StorageFile, StorageFolder
        except ImportError:
            pass
            
        try:
            from src.domains.relations.models import Relation
        except ImportError:
            pass
            
        try:
            from src.domains.scheduler.models import ScheduledJob, JobExecution
        except ImportError:
            pass
        
        # 7. Force SQLAlchemy to configure all mappers after imports
        from sqlalchemy.orm import configure_mappers
        try:
            configure_mappers()
            print("✓ All V2 domain models imported and configured successfully")
        except Exception as e:
            print(f"Warning: SQLAlchemy mapper configuration issue: {e}")
            # Try to continue anyway - some relationships might still work
            
    except ImportError as e:
        print(f"Warning: Could not import some models: {e}")
    except Exception as e:
        print(f"Error importing models: {e}")

# Import models when this module is loaded
import_all_models()
