"""
Base Module Classes and Interfaces
"""

from abc import abstractmethod
from typing import Dict, List, Any, Optional
from core.module_system import BaseModule, ModuleMetadata, ModuleType
from fastapi import APIRouter


class WidgetModuleBase(BaseModule):
    """Base class for widget modules"""
    
    @abstractmethod
    def get_widget_definitions(self) -> List[Dict[str, Any]]:
        """Return widget definitions for the frontend"""
        pass
    
    @abstractmethod
    def render_widget(self, widget_type: str, props: Dict) -> str:
        """Server-side render a widget"""
        pass


class IntegrationModuleBase(BaseModule):
    """Base class for third-party integrations"""
    
    @abstractmethod
    async def connect(self, credentials: Dict[str, Any]) -> bool:
        """Connect to the third-party service"""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnect from the service"""
        pass
    
    @abstractmethod
    async def sync(self) -> Dict[str, Any]:
        """Sync data with the service"""
        pass
    
    @abstractmethod
    def get_oauth_url(self) -> Optional[str]:
        """Get OAuth URL if applicable"""
        pass


class PaymentModuleBase(BaseModule):
    """Base class for payment processors"""
    
    @abstractmethod
    async def create_payment(self, amount: int, currency: str, metadata: Dict) -> Dict:
        """Create a payment intent"""
        pass
    
    @abstractmethod
    async def capture_payment(self, payment_id: str) -> Dict:
        """Capture a payment"""
        pass
    
    @abstractmethod
    async def refund_payment(self, payment_id: str, amount: Optional[int]) -> Dict:
        """Refund a payment"""
        pass
    
    @abstractmethod
    async def create_subscription(self, plan_id: str, customer_id: str) -> Dict:
        """Create a subscription"""
        pass


class AIProviderModuleBase(BaseModule):
    """Base class for AI providers"""
    
    @abstractmethod
    async def generate_text(self, prompt: str, options: Dict) -> str:
        """Generate text content"""
        pass
    
    @abstractmethod
    async def generate_image(self, prompt: str, options: Dict) -> str:
        """Generate an image"""
        pass
    
    @abstractmethod
    async def analyze_content(self, content: str) -> Dict:
        """Analyze content"""
        pass


class StorageModuleBase(BaseModule):
    """Base class for storage providers"""
    
    @abstractmethod
    async def upload(self, file: bytes, path: str, metadata: Dict) -> str:
        """Upload a file and return URL"""
        pass
    
    @abstractmethod
    async def download(self, path: str) -> bytes:
        """Download a file"""
        pass
    
    @abstractmethod
    async def delete(self, path: str) -> bool:
        """Delete a file"""
        pass
    
    @abstractmethod
    async def list_files(self, prefix: str) -> List[Dict]:
        """List files with prefix"""
        pass


class AnalyticsModuleBase(BaseModule):
    """Base class for analytics providers"""
    
    @abstractmethod
    async def track_event(self, event: str, properties: Dict) -> bool:
        """Track an event"""
        pass
    
    @abstractmethod
    async def track_pageview(self, page: str, properties: Dict) -> bool:
        """Track a pageview"""
        pass
    
    @abstractmethod
    async def get_metrics(self, metric: str, period: str) -> Dict:
        """Get analytics metrics"""
        pass


class WorkflowModuleBase(BaseModule):
    """Base class for workflow automation"""
    
    @abstractmethod
    async def create_workflow(self, definition: Dict) -> str:
        """Create a workflow"""
        pass
    
    @abstractmethod
    async def execute_workflow(self, workflow_id: str, input: Dict) -> Dict:
        """Execute a workflow"""
        pass
    
    @abstractmethod
    async def get_workflow_status(self, execution_id: str) -> Dict:
        """Get workflow execution status"""
        pass
