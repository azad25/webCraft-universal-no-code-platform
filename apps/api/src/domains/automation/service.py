"""
Automation domain service
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from src.common.base_service import BaseService
from src.common.exceptions import NotFoundError, ValidationError
from .models import Automation, AutomationLog, AutomationStatus, TriggerType
from .schemas import AutomationCreate, AutomationUpdate


class AutomationService(BaseService[Automation, AutomationCreate, AutomationUpdate]):
    """Automation service"""
    
    def __init__(self, db: Session):
        super().__init__(Automation, db)
    
    def list_automations(
        self,
        app_id: str,
        is_enabled: Optional[bool] = None,
        trigger_type: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> tuple[List[Automation], int]:
        """List automations for an app"""
        query = self.db.query(Automation).filter(
            Automation.app_id == app_id,
            Automation.is_active == True
        )
        
        if is_enabled is not None:
            query = query.filter(Automation.is_enabled == is_enabled)
        
        if trigger_type:
            query = query.filter(Automation.trigger_type == trigger_type)
        
        total = query.count()
        automations = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return automations, total
    
    def create_automation(
        self,
        app_id: str,
        name: str,
        trigger_type: TriggerType,
        trigger_config: Dict[str, Any],
        workflow_steps: List[Dict[str, Any]],
        description: Optional[str] = None
    ) -> Automation:
        """Create a new automation"""
        automation = Automation(
            id=str(uuid.uuid4()),
            app_id=app_id,
            name=name,
            description=description,
            trigger_type=trigger_type,
            trigger_config=trigger_config,
            workflow_steps=workflow_steps,
            is_enabled=True
        )
        
        self.db.add(automation)
        self.db.commit()
        self.db.refresh(automation)
        
        return automation
    
    def update_automation(
        self,
        automation_id: str,
        app_id: str,
        **data
    ) -> Automation:
        """Update an automation"""
        automation = self.db.query(Automation).filter(
            Automation.id == automation_id,
            Automation.app_id == app_id,
            Automation.is_active == True
        ).first()
        
        if not automation:
            raise NotFoundError("Automation not found")
        
        for key, value in data.items():
            if hasattr(automation, key) and value is not None:
                setattr(automation, key, value)
        
        self.db.commit()
        self.db.refresh(automation)
        
        return automation
    
    def delete_automation(self, automation_id: str, app_id: str) -> bool:
        """Delete an automation (soft delete)"""
        automation = self.db.query(Automation).filter(
            Automation.id == automation_id,
            Automation.app_id == app_id
        ).first()
        
        if not automation:
            raise NotFoundError("Automation not found")
        
        automation.is_active = False
        self.db.commit()
        
        return True
    
    def toggle_automation(self, automation_id: str, app_id: str, enabled: bool) -> Automation:
        """Enable or disable an automation"""
        automation = self.db.query(Automation).filter(
            Automation.id == automation_id,
            Automation.app_id == app_id,
            Automation.is_active == True
        ).first()
        
        if not automation:
            raise NotFoundError("Automation not found")
        
        automation.is_enabled = enabled
        self.db.commit()
        self.db.refresh(automation)
        
        return automation
    
    async def execute_automation(
        self,
        automation_id: str,
        app_id: str,
        trigger_data: Dict[str, Any] = None
    ) -> AutomationLog:
        """Execute an automation"""
        automation = self.db.query(Automation).filter(
            Automation.id == automation_id,
            Automation.app_id == app_id,
            Automation.is_active == True,
            Automation.is_enabled == True
        ).first()
        
        if not automation:
            raise NotFoundError("Automation not found or disabled")
        
        # Create execution log
        log = AutomationLog(
            id=str(uuid.uuid4()),
            automation_id=automation_id,
            status=AutomationStatus.RUNNING,
            trigger_data=trigger_data or {},
            started_at=datetime.utcnow()
        )
        self.db.add(log)
        self.db.commit()
        
        try:
            # Execute workflow steps
            result = await self._execute_workflow(automation.workflow_steps, trigger_data)
            
            log.status = AutomationStatus.COMPLETED
            log.execution_result = result
            log.steps_executed = len(automation.workflow_steps)
            log.completed_at = datetime.utcnow()
            log.duration_ms = int((log.completed_at - log.started_at).total_seconds() * 1000)
            
            # Update automation stats
            automation.last_executed_at = datetime.utcnow()
            automation.execution_count += 1
            
        except Exception as e:
            log.status = AutomationStatus.FAILED
            log.error_message = str(e)
            log.completed_at = datetime.utcnow()
            log.duration_ms = int((log.completed_at - log.started_at).total_seconds() * 1000)
        
        self.db.commit()
        self.db.refresh(log)
        
        return log
    
    async def _execute_workflow(
        self,
        steps: List[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute workflow steps"""
        results = []
        current_context = context or {}
        
        for step in steps:
            step_type = step.get("type")
            step_config = step.get("config", {})
            
            # Execute step based on type
            step_result = await self._execute_step(step_type, step_config, current_context)
            results.append(step_result)
            
            # Update context with step result
            current_context["last_step_result"] = step_result
        
        return {"steps": results, "final_context": current_context}
    
    async def _execute_step(
        self,
        step_type: str,
        config: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a single workflow step"""
        
        if step_type == "condition":
            return await self._execute_condition_step(config, context)
        elif step_type == "action":
            return await self._execute_action_step(config, context)
        elif step_type == "delay":
            return await self._execute_delay_step(config, context)
        elif step_type == "loop":
            return await self._execute_loop_step(config, context)
        elif step_type == "transform":
            return await self._execute_transform_step(config, context)
        else:
            return {
                "type": step_type,
                "status": "unsupported",
                "message": f"Step type '{step_type}' not implemented"
            }
    
    async def _execute_condition_step(self, config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute condition step"""
        condition = config.get("condition", {})
        field = condition.get("field")
        operator = condition.get("operator")
        value = condition.get("value")
        
        if not field or not operator:
            return {"type": "condition", "status": "error", "message": "Invalid condition configuration"}
        
        # Get field value from context
        field_value = context.get(field)
        
        # Evaluate condition
        result = False
        if operator == "equals":
            result = field_value == value
        elif operator == "not_equals":
            result = field_value != value
        elif operator == "greater_than":
            result = field_value > value if isinstance(field_value, (int, float)) else False
        elif operator == "less_than":
            result = field_value < value if isinstance(field_value, (int, float)) else False
        elif operator == "contains":
            result = value in str(field_value) if field_value else False
        
        return {
            "type": "condition",
            "status": "completed",
            "result": result,
            "field": field,
            "operator": operator,
            "value": value,
            "field_value": field_value
        }
    
    async def _execute_action_step(self, config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute action step"""
        action_type = config.get("action_type")
        action_config = config.get("config", {})
        
        # Simple action execution without circular import
        if action_type == "send_email":
            return {
                "type": "action",
                "action_type": action_type,
                "status": "completed",
                "message": f"Email would be sent to {action_config.get('to', 'unknown')}"
            }
        elif action_type == "create_record":
            return {
                "type": "action", 
                "action_type": action_type,
                "status": "completed",
                "message": f"Record would be created in {action_config.get('collection', 'unknown')}"
            }
        elif action_type == "update_record":
            return {
                "type": "action",
                "action_type": action_type, 
                "status": "completed",
                "message": f"Record would be updated in {action_config.get('collection', 'unknown')}"
            }
        elif action_type == "http_request":
            return {
                "type": "action",
                "action_type": action_type,
                "status": "completed", 
                "message": f"HTTP request would be made to {action_config.get('url', 'unknown')}"
            }
        else:
            return {
                "type": "action",
                "action_type": action_type,
                "status": "unsupported",
                "message": f"Action type '{action_type}' not implemented in automation context"
            }
    
    async def _execute_delay_step(self, config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute delay step"""
        import asyncio
        
        delay_seconds = config.get("delay_seconds", 1)
        delay_type = config.get("delay_type", "fixed")  # fixed, random
        
        if delay_type == "random":
            min_delay = config.get("min_delay", 1)
            max_delay = config.get("max_delay", 10)
            # Use deterministic calculation instead of random
            delay_hash = hash(f"{context.get('execution_id', '')}{min_delay}{max_delay}")
            delay_seconds = min_delay + (delay_hash % (max_delay - min_delay + 1))
        
        # In production, this would be handled by a job queue
        # For now, simulate delay with a cap for safety
        actual_delay = min(delay_seconds, 5)  # Cap at 5 seconds for safety
        await asyncio.sleep(actual_delay)
        
        return {
            "type": "delay",
            "status": "completed",
            "delay_seconds": actual_delay,
            "requested_delay": delay_seconds
        }
    
    async def _execute_loop_step(self, config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute loop step"""
        loop_type = config.get("loop_type", "count")  # count, foreach, while
        
        if loop_type == "count":
            count = config.get("count", 1)
            results = []
            
            for i in range(min(count, 10)):  # Cap at 10 iterations for safety
                loop_context = {**context, "loop_index": i}
                # Execute nested steps would go here
                results.append({"iteration": i, "status": "completed"})
            
            return {
                "type": "loop",
                "status": "completed",
                "loop_type": loop_type,
                "iterations": len(results),
                "results": results
            }
        
        return {
            "type": "loop",
            "status": "unsupported",
            "message": f"Loop type '{loop_type}' not implemented"
        }
    
    async def _execute_transform_step(self, config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute transform step"""
        transform_type = config.get("transform_type")
        source_field = config.get("source_field")
        target_field = config.get("target_field")
        
        if not source_field or not target_field:
            return {"type": "transform", "status": "error", "message": "Missing source or target field"}
        
        source_value = context.get(source_field)
        transformed_value = source_value
        
        # Apply transformation
        if transform_type == "uppercase":
            transformed_value = str(source_value).upper() if source_value else ""
        elif transform_type == "lowercase":
            transformed_value = str(source_value).lower() if source_value else ""
        elif transform_type == "trim":
            transformed_value = str(source_value).strip() if source_value else ""
        elif transform_type == "json_parse":
            import json
            try:
                transformed_value = json.loads(source_value) if source_value else {}
            except:
                transformed_value = {}
        
        # Update context
        context[target_field] = transformed_value
        
        return {
            "type": "transform",
            "status": "completed",
            "transform_type": transform_type,
            "source_field": source_field,
            "target_field": target_field,
            "source_value": source_value,
            "transformed_value": transformed_value
        }
    
    def get_automation_logs(
        self,
        automation_id: str,
        page: int = 1,
        per_page: int = 20
    ) -> tuple[List[AutomationLog], int]:
        """Get execution logs for an automation"""
        query = self.db.query(AutomationLog).filter(
            AutomationLog.automation_id == automation_id
        ).order_by(AutomationLog.created_at.desc())
        
        total = query.count()
        logs = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return logs, total
