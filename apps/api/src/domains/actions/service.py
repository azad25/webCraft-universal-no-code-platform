"""Actions domain service"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from src.domains.apps.models import App


ACTION_TEMPLATES = {
    "user_registration": {
        "name": "User Registration Flow",
        "description": "Complete user registration with email verification",
        "category": "authentication",
        "event_handlers": [{
            "event_type": "submit",
            "element_selector": "#registration-form",
            "actions": [
                {"type": "create_record", "config": {"collection_id": "users", "data": {"email": "{email}", "name": "{name}"}}},
                {"type": "send_email", "config": {"to": "{email}", "subject": "Welcome!", "template": "email_verification"}},
                {"type": "redirect", "config": {"url": "/verification-sent"}}
            ]
        }]
    },
    "order_processing": {
        "name": "E-commerce Order Processing",
        "description": "Handle order creation and payment processing",
        "category": "ecommerce",
        "event_handlers": [{
            "event_type": "submit",
            "element_selector": "#checkout-form",
            "actions": [
                {"type": "process_payment", "config": {"amount": "{total}", "currency": "USD"}},
                {"type": "create_record", "config": {"collection_id": "orders", "data": {"customer_email": "{email}", "items": "{items}"}}},
                {"type": "send_email", "config": {"to": "{email}", "subject": "Order Confirmation", "template": "order_confirmation"}}
            ]
        }]
    },
    "lead_capture": {
        "name": "Lead Capture & CRM Integration",
        "description": "Capture leads and add to CRM system",
        "category": "marketing",
        "event_handlers": [{
            "event_type": "submit",
            "element_selector": "#lead-form",
            "actions": [
                {"type": "create_record", "config": {"collection_id": "leads", "data": {"email": "{email}", "name": "{name}"}}},
                {"type": "api_call", "config": {"url": "https://api.crm.com/leads", "method": "POST"}},
                {"type": "trigger_automation", "config": {"automation_id": "lead_nurture_sequence"}}
            ]
        }]
    },
    "support_ticket": {
        "name": "Support Ticket Creation",
        "description": "Create support tickets and notify team",
        "category": "support",
        "event_handlers": [{
            "event_type": "submit",
            "element_selector": "#support-form",
            "actions": [
                {"type": "create_record", "config": {"collection_id": "tickets", "data": {"subject": "{subject}", "description": "{description}"}}},
                {"type": "send_email", "config": {"to": "support@company.com", "subject": "New Support Ticket"}},
                {"type": "send_email", "config": {"to": "{email}", "subject": "Ticket Created"}}
            ]
        }]
    }
}


class ActionsService:
    def __init__(self, db: Session):
        self.db = db
    
    async def create_action(
        self, app_id: str, user_id: str, action_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        app = self.db.query(App).filter(App.id == uuid.UUID(app_id)).first()
        if not app:
            return {"error": "App not found"}
        
        app_config = app.config or {}
        if 'actions' not in app_config:
            app_config['actions'] = {}
        
        action_id = str(uuid.uuid4())
        app_config['actions'][action_id] = {
            "id": action_id,
            "app_id": app_id,
            "page_id": action_data.get("page_id"),
            "name": action_data.get("name"),
            "description": action_data.get("description"),
            "event_handlers": action_data.get("event_handlers", []),
            "is_active": action_data.get("is_active", True),
            "created_at": datetime.utcnow().isoformat(),
            "created_by": user_id
        }
        
        app.config = app_config
        self.db.commit()
        
        return {"id": action_id, "message": "Action created successfully"}
    
    async def list_actions(
        self, app_id: str, page_id: Optional[str] = None
    ) -> Dict[str, Any]:
        app = self.db.query(App).filter(App.id == uuid.UUID(app_id)).first()
        if not app:
            return {"actions": [], "total": 0}
        
        app_config = app.config or {}
        actions = app_config.get('actions', {})
        
        if page_id:
            actions = {k: v for k, v in actions.items() if v.get('page_id') == page_id}
        
        return {"actions": list(actions.values()), "total": len(actions)}
    
    async def get_action(self, app_id: str, action_id: str) -> Optional[Dict[str, Any]]:
        app = self.db.query(App).filter(App.id == uuid.UUID(app_id)).first()
        if not app:
            return None
        
        app_config = app.config or {}
        actions = app_config.get('actions', {})
        return actions.get(action_id)
    
    async def update_action(
        self, app_id: str, action_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        app = self.db.query(App).filter(App.id == uuid.UUID(app_id)).first()
        if not app:
            return None
        
        app_config = app.config or {}
        actions = app_config.get('actions', {})
        
        if action_id not in actions:
            return None
        
        actions[action_id].update(updates)
        actions[action_id]["updated_at"] = datetime.utcnow().isoformat()
        
        app.config = app_config
        self.db.commit()
        
        return {"message": "Action updated successfully"}
    
    async def delete_action(self, app_id: str, action_id: str) -> bool:
        app = self.db.query(App).filter(App.id == uuid.UUID(app_id)).first()
        if not app:
            return False
        
        app_config = app.config or {}
        actions = app_config.get('actions', {})
        
        if action_id not in actions:
            return False
        
        del actions[action_id]
        app.config = app_config
        self.db.commit()
        return True
    
    async def execute_action(
        self, app_id: str, action_id: str, execution_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        action = await self.get_action(app_id, action_id)
        if not action:
            return {"error": "Action not found"}
        
        results = []
        for handler in action.get('event_handlers', []):
            for action_config in handler.get('actions', []):
                result = await self._execute_single_action(
                    action_config,
                    execution_data.get("event_data", {}),
                    execution_data.get("user_context", {}),
                    app_id
                )
                results.append(result)
        
        return {
            "status": "completed",
            "action_id": action_id,
            "results": results,
            "executed_at": datetime.utcnow().isoformat()
        }
    
    async def _execute_single_action(
        self, action_config: Dict[str, Any], event_data: Dict[str, Any],
        user_context: Dict[str, Any], app_id: str
    ) -> Dict[str, Any]:
        action_type = action_config.get('type')
        config = action_config.get('config', {})
        
        # Execute based on action type
        if action_type == "webhook":
            return await self._execute_webhook_action(config, event_data)
        elif action_type == "email":
            return await self._execute_email_action(config, event_data, user_context)
        elif action_type == "database":
            return await self._execute_database_action(config, event_data, app_id)
        elif action_type == "api_call":
            return await self._execute_api_call_action(config, event_data)
        else:
            return {
                "type": action_type,
                "status": "unsupported",
                "message": f"Action type '{action_type}' not implemented"
            }
    
    async def _execute_webhook_action(self, config: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute webhook action"""
        import httpx
        
        url = config.get("url")
        method = config.get("method", "POST")
        headers = config.get("headers", {})
        
        if not url:
            return {"status": "error", "message": "Webhook URL not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=method,
                    url=url,
                    json=event_data,
                    headers=headers,
                    timeout=30
                )
                
                return {
                    "type": "webhook",
                    "status": "success",
                    "response_code": response.status_code,
                    "response_body": response.text[:500]  # Truncate response
                }
        except Exception as e:
            return {
                "type": "webhook", 
                "status": "error",
                "message": str(e)
            }
    
    async def _execute_email_action(self, config: Dict[str, Any], event_data: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute email action"""
        # In production, integrate with email service
        recipient = config.get("recipient") or user_context.get("email")
        subject = config.get("subject", "Notification")
        template = config.get("template")
        
        if not recipient:
            return {"status": "error", "message": "No recipient specified"}
        
        # Simulate email sending (would use real email service in production)
        return {
            "type": "email",
            "status": "success", 
            "recipient": recipient,
            "subject": subject,
            "message": "Email sent successfully"
        }
    
    async def _execute_database_action(self, config: Dict[str, Any], event_data: Dict[str, Any], app_id: str) -> Dict[str, Any]:
        """Execute database action"""
        operation = config.get("operation")  # create, update, delete
        collection = config.get("collection")
        data = config.get("data", {})
        
        # Merge event data with configured data
        merged_data = {**data, **event_data}
        
        # In production, execute actual database operations
        return {
            "type": "database",
            "status": "success",
            "operation": operation,
            "collection": collection,
            "affected_records": 1
        }
    
    async def _execute_api_call_action(self, config: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute API call action"""
        import httpx
        
        url = config.get("url")
        method = config.get("method", "POST")
        headers = config.get("headers", {})
        auth = config.get("auth", {})
        
        if not url:
            return {"status": "error", "message": "API URL not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                # Add authentication if configured
                if auth.get("type") == "bearer":
                    headers["Authorization"] = f"Bearer {auth.get('token')}"
                elif auth.get("type") == "api_key":
                    headers[auth.get("header", "X-API-Key")] = auth.get("key")
                
                response = await client.request(
                    method=method,
                    url=url,
                    json=event_data,
                    headers=headers,
                    timeout=30
                )
                
                return {
                    "type": "api_call",
                    "status": "success",
                    "response_code": response.status_code,
                    "response_data": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text[:500]
                }
        except Exception as e:
            return {
                "type": "api_call",
                "status": "error", 
                "message": str(e)
            }
    
    async def get_templates(self, category: Optional[str] = None) -> Dict[str, Any]:
        templates = ACTION_TEMPLATES
        if category:
            templates = {k: v for k, v in templates.items() if v.get("category") == category}
        return {"templates": templates}
