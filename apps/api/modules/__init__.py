"""
WebCraft Modules Package
All pluggable modules are registered here
"""

from core.module_system import module_registry, ModuleType

# Import and register all built-in modules
def register_builtin_modules():
    """Register all built-in modules"""
    from modules.widgets import WidgetModule
    from modules.integrations import IntegrationModule
    from modules.ecommerce import EcommerceModule
    from modules.crm import CRMModule
    from modules.analytics import AnalyticsModule
    from modules.ai_providers import AIProviderModule
    from modules.storage import StorageModule
    from modules.workflow import WorkflowModule
    from modules.notifications import NotificationModule
    from modules.data_sources import DataSourceModule
    from modules.web_scraper import WebScraperModule
    
    modules = [
        WidgetModule,
        IntegrationModule,
        EcommerceModule,
        CRMModule,
        AnalyticsModule,
        AIProviderModule,
        StorageModule,
        WorkflowModule,
        NotificationModule,
        DataSourceModule,
        WebScraperModule,
    ]
    
    for module_class in modules:
        module_registry.register_module_class(module_class)


def get_module_routes():
    """Get all routes from enabled modules"""
    routes = []
    for module in module_registry.get_all_modules().values():
        routes.extend(module.get_routes())
    return routes
