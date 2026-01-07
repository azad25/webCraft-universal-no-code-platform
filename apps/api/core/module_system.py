"""
WebCraft Modular Plugin System
Enables dynamic feature loading and extensibility
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Type, Callable
from dataclasses import dataclass, field
from enum import Enum
import importlib
import os
import json
from datetime import datetime
import asyncio


class ModuleType(Enum):
    WIDGET = "widget"
    INTEGRATION = "integration"
    PAYMENT = "payment"
    AI_PROVIDER = "ai_provider"
    STORAGE = "storage"
    AUTH = "auth"
    ANALYTICS = "analytics"
    SEO = "seo"
    ECOMMERCE = "ecommerce"
    CRM = "crm"
    ERP = "erp"
    WORKFLOW = "workflow"
    NOTIFICATION = "notification"
    EXPORT = "export"


@dataclass
class ModuleMetadata:
    """Metadata for a module"""
    id: str
    name: str
    version: str
    type: ModuleType
    description: str
    author: str
    dependencies: List[str] = field(default_factory=list)
    config_schema: Dict[str, Any] = field(default_factory=dict)
    permissions: List[str] = field(default_factory=list)
    is_premium: bool = False
    price: float = 0.0
    icon: str = ""
    tags: List[str] = field(default_factory=list)


class BaseModule(ABC):
    """Base class for all modules"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self._initialized = False
        self._hooks: Dict[str, List[Callable]] = {}
    
    @property
    @abstractmethod
    def metadata(self) -> ModuleMetadata:
        """Return module metadata"""
        pass
    
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the module"""
        pass
    
    @abstractmethod
    async def shutdown(self) -> bool:
        """Cleanup when module is disabled"""
        pass
    
    def register_hook(self, event: str, callback: Callable):
        """Register a hook for an event"""
        if event not in self._hooks:
            self._hooks[event] = []
        self._hooks[event].append(callback)
    
    async def trigger_hook(self, event: str, data: Any = None) -> List[Any]:
        """Trigger all callbacks for an event"""
        results = []
        for callback in self._hooks.get(event, []):
            if asyncio.iscoroutinefunction(callback):
                result = await callback(data)
            else:
                result = callback(data)
            results.append(result)
        return results
    
    def get_routes(self) -> List[Any]:
        """Return FastAPI routes for this module"""
        return []
    
    def get_frontend_components(self) -> Dict[str, Any]:
        """Return frontend component definitions"""
        return {}


class ModuleRegistry:
    """Central registry for all modules"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._modules: Dict[str, BaseModule] = {}
            cls._instance._module_classes: Dict[str, Type[BaseModule]] = {}
            cls._instance._hooks: Dict[str, List[Callable]] = {}
        return cls._instance
    
    def register_module_class(self, module_class: Type[BaseModule]):
        """Register a module class"""
        temp_instance = module_class.__new__(module_class)
        if hasattr(temp_instance, 'metadata'):
            metadata = temp_instance.metadata
            self._module_classes[metadata.id] = module_class
    
    async def enable_module(self, module_id: str, config: Dict = None) -> bool:
        """Enable and initialize a module"""
        if module_id not in self._module_classes:
            raise ValueError(f"Module {module_id} not found")
        
        if module_id in self._modules:
            return True  # Already enabled
        
        module_class = self._module_classes[module_id]
        module = module_class(config)
        
        # Check dependencies
        for dep_id in module.metadata.dependencies:
            if dep_id not in self._modules:
                raise ValueError(f"Dependency {dep_id} not enabled")
        
        success = await module.initialize()
        if success:
            self._modules[module_id] = module
            await self._trigger_global_hook("module.enabled", module)
        return success
    
    async def disable_module(self, module_id: str) -> bool:
        """Disable a module"""
        if module_id not in self._modules:
            return True
        
        module = self._modules[module_id]
        
        # Check if other modules depend on this
        for other_id, other_module in self._modules.items():
            if module_id in other_module.metadata.dependencies:
                raise ValueError(f"Module {other_id} depends on {module_id}")
        
        success = await module.shutdown()
        if success:
            del self._modules[module_id]
            await self._trigger_global_hook("module.disabled", module)
        return success
    
    def get_module(self, module_id: str) -> Optional[BaseModule]:
        """Get an enabled module"""
        return self._modules.get(module_id)
    
    def get_all_modules(self) -> Dict[str, BaseModule]:
        """Get all enabled modules"""
        return self._modules.copy()
    
    def get_available_modules(self) -> List[ModuleMetadata]:
        """Get all available module metadata"""
        result = []
        for module_class in self._module_classes.values():
            temp = module_class.__new__(module_class)
            result.append(temp.metadata)
        return result
    
    def get_modules_by_type(self, module_type: ModuleType) -> List[BaseModule]:
        """Get all enabled modules of a specific type"""
        return [m for m in self._modules.values() 
                if m.metadata.type == module_type]
    
    def register_global_hook(self, event: str, callback: Callable):
        """Register a global hook"""
        if event not in self._hooks:
            self._hooks[event] = []
        self._hooks[event].append(callback)
    
    async def _trigger_global_hook(self, event: str, data: Any = None):
        """Trigger global hooks"""
        for callback in self._hooks.get(event, []):
            if asyncio.iscoroutinefunction(callback):
                await callback(data)
            else:
                callback(data)


# Global registry instance
module_registry = ModuleRegistry()
