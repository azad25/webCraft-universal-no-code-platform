"""
Action Execution Service
Handles the execution of actions triggered by widget events
"""

import asyncio
import aiohttp
import json
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_

from core.database import (
    App, User, AppCollection, AppRecord, 
    DataSource, DataSourceEndpoint, WebScraper
)


class ActionExecutionService:
    """Service for executing widget actions and events"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def execute_widget_action(
        self,
        app_id: str,
        widget_id: str,
        action_config: Dict[str, Any],
        event_data: Dict[str, Any],
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a widget action"""
        
        try:
            action_type = action_config.get('type')
            config = action_config.get('config', {})
            
            # Replace placeholders in config with event data
            resolved_config = self._resolve_placeholders(config, event_data, user_context)
            
            # Execute based on action type
            if action_type == 'navigate':
                return await self._handle_navigate(resolved_config, event_data)
            
            elif action_type == 'create_record':
                return await self._handle_create_record(resolved_config, app_id)
            
            elif action_type == 'update_record':
                return await self._handle_update_record(resolved_config, app_id)
            
            elif action_type == 'delete_record':
                return await self._handle_delete_record(resolved_config, app_id)
            
            elif action_type == 'query_data':
                return await self._handle_query_data(resolved_config, app_id)
            
            elif action_type == 'send_email':
                return await self._handle_send_email(resolved_config, user_context)
            
            elif action_type == 'send_sms':
                return await self._handle_send_sms(resolved_config, user_context)
            
            elif action_type == 'api_call':
                return await self._handle_api_call(resolved_config)
            
            elif action_type == 'webhook_call':
                return await self._handle_webhook_call(resolved_config)
            
            elif action_type == 'show_message':
                return await self._handle_show_message(resolved_config)
            
            elif action_type == 'update_element':
                return await self._handle_update_element(resolved_config, widget_id)
            
            elif action_type == 'toggle_visibility':
                return await self._handle_toggle_visibility(resolved_config)
            
            elif action_type == 'open_modal':
                return await self._handle_open_modal(resolved_config)
            
            elif action_type == 'close_modal':
                return await self._handle_close_modal(resolved_config)
            
            elif action_type == 'redirect':
                return await self._handle_redirect(resolved_config)
            
            elif action_type == 'delay':
                return await self._handle_delay(resolved_config)
            
            elif action_type == 'condition':
                return await self._handle_condition(resolved_config, event_data, user_context)
            
            elif action_type == 'loop':
                return await self._handle_loop(resolved_config, event_data, user_context)
            
            elif action_type == 'trigger_automation':
                return await self._handle_trigger_automation(resolved_config, app_id, event_data)
            
            else:
                return {
                    'success': False,
                    'error': f'Unknown action type: {action_type}'
                }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'action_type': action_type
            }
    
    def _resolve_placeholders(
        self, 
        config: Dict[str, Any], 
        event_data: Dict[str, Any], 
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Replace placeholders in config with actual values"""
        
        def replace_value(value):
            if isinstance(value, str):
                # Replace event data placeholders
                for key, val in event_data.items():
                    value = value.replace(f'{{{key}}}', str(val))
                
                # Replace user context placeholders
                for key, val in user_context.items():
                    value = value.replace(f'{{user.{key}}}', str(val))
                
                # Replace system placeholders
                value = value.replace('{timestamp}', datetime.utcnow().isoformat())
                value = value.replace('{uuid}', str(uuid.uuid4()))
                
                return value
            
            elif isinstance(value, dict):
                return {k: replace_value(v) for k, v in value.items()}
            
            elif isinstance(value, list):
                return [replace_value(item) for item in value]
            
            return value
        
        return replace_value(config)
    
    async def _handle_navigate(self, config: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle navigation action"""
        url = config.get('url', '#')
        open_in_new_tab = config.get('open_in_new_tab', False)
        
        return {
            'success': True,
            'action': 'navigate',
            'url': url,
            'open_in_new_tab': open_in_new_tab
        }
    
    async def _handle_create_record(self, config: Dict[str, Any], app_id: str) -> Dict[str, Any]:
        """Handle record creation"""
        collection_id = config.get('collection_id')
        data = config.get('data', {})
        
        if not collection_id:
            return {'success': False, 'error': 'collection_id is required'}
        
        try:
            # Verify collection exists and belongs to app
            collection = self.db.query(AppCollection).filter(
                and_(
                    AppCollection.id == uuid.UUID(collection_id),
                    AppCollection.app_id == uuid.UUID(app_id)
                )
            ).first()
            
            if not collection:
                return {'success': False, 'error': 'Collection not found'}
            
            # Create record
            record = AppRecord(
                collection_id=uuid.UUID(collection_id),
                data=data,
                search_text=' '.join(str(v) for v in data.values() if v)
            )
            
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
            
            return {
                'success': True,
                'action': 'create_record',
                'record_id': str(record.id),
                'data': record.data
            }
        
        except Exception as e:
            self.db.rollback()
            return {'success': False, 'error': str(e)}
    
    async def _handle_update_record(self, config: Dict[str, Any], app_id: str) -> Dict[str, Any]:
        """Handle record update"""
        record_id = config.get('record_id')
        data = config.get('data', {})
        
        if not record_id:
            return {'success': False, 'error': 'record_id is required'}
        
        try:
            # Find record and verify it belongs to app
            record = self.db.query(AppRecord).join(AppCollection).filter(
                and_(
                    AppRecord.id == uuid.UUID(record_id),
                    AppCollection.app_id == uuid.UUID(app_id)
                )
            ).first()
            
            if not record:
                return {'success': False, 'error': 'Record not found'}
            
            # Update record
            record.data = {**record.data, **data}
            record.search_text = ' '.join(str(v) for v in record.data.values() if v)
            record.updated_at = datetime.utcnow()
            
            self.db.commit()
            
            return {
                'success': True,
                'action': 'update_record',
                'record_id': str(record.id),
                'data': record.data
            }
        
        except Exception as e:
            self.db.rollback()
            return {'success': False, 'error': str(e)}
    
    async def _handle_delete_record(self, config: Dict[str, Any], app_id: str) -> Dict[str, Any]:
        """Handle record deletion"""
        record_id = config.get('record_id')
        soft_delete = config.get('soft_delete', True)
        
        if not record_id:
            return {'success': False, 'error': 'record_id is required'}
        
        try:
            # Find record and verify it belongs to app
            record = self.db.query(AppRecord).join(AppCollection).filter(
                and_(
                    AppRecord.id == uuid.UUID(record_id),
                    AppCollection.app_id == uuid.UUID(app_id)
                )
            ).first()
            
            if not record:
                return {'success': False, 'error': 'Record not found'}
            
            if soft_delete:
                record.is_active = False
                record.updated_at = datetime.utcnow()
            else:
                self.db.delete(record)
            
            self.db.commit()
            
            return {
                'success': True,
                'action': 'delete_record',
                'record_id': str(record.id),
                'soft_delete': soft_delete
            }
        
        except Exception as e:
            self.db.rollback()
            return {'success': False, 'error': str(e)}
    
    async def _handle_query_data(self, config: Dict[str, Any], app_id: str) -> Dict[str, Any]:
        """Handle data query"""
        collection_id = config.get('collection_id')
        filters = config.get('filters', {})
        limit = config.get('limit', 100)
        offset = config.get('offset', 0)
        
        if not collection_id:
            return {'success': False, 'error': 'collection_id is required'}
        
        try:
            # Verify collection exists and belongs to app
            collection = self.db.query(AppCollection).filter(
                and_(
                    AppCollection.id == uuid.UUID(collection_id),
                    AppCollection.app_id == uuid.UUID(app_id)
                )
            ).first()
            
            if not collection:
                return {'success': False, 'error': 'Collection not found'}
            
            # Build query
            query = self.db.query(AppRecord).filter(
                and_(
                    AppRecord.collection_id == uuid.UUID(collection_id),
                    AppRecord.is_active == True
                )
            )
            
            # Apply filters
            for field, value in filters.items():
                if isinstance(value, dict):
                    # Handle operators like {'$gt': 10}, {'$contains': 'text'}
                    for op, op_value in value.items():
                        if op == '$gt':
                            query = query.filter(AppRecord.data[field].astext.cast(float) > op_value)
                        elif op == '$lt':
                            query = query.filter(AppRecord.data[field].astext.cast(float) < op_value)
                        elif op == '$contains':
                            query = query.filter(AppRecord.data[field].astext.ilike(f'%{op_value}%'))
                        elif op == '$eq':
                            query = query.filter(AppRecord.data[field].astext == str(op_value))
                else:
                    # Simple equality filter
                    query = query.filter(AppRecord.data[field].astext == str(value))
            
            # Apply pagination
            records = query.offset(offset).limit(limit).all()
            total = query.count()
            
            return {
                'success': True,
                'action': 'query_data',
                'data': [record.data for record in records],
                'total': total,
                'limit': limit,
                'offset': offset
            }
        
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_send_email(self, config: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle email sending"""
        to_email = config.get('to')
        subject = config.get('subject', 'Notification')
        body = config.get('body', '')
        template = config.get('template')
        
        if not to_email:
            return {'success': False, 'error': 'to email is required'}
        
        # Here you would integrate with your email service (SendGrid, AWS SES, etc.)
        # For now, we'll just log the email
        print(f"📧 Sending email to {to_email}: {subject}")
        print(f"Body: {body}")
        
        return {
            'success': True,
            'action': 'send_email',
            'to': to_email,
            'subject': subject,
            'sent_at': datetime.utcnow().isoformat()
        }
    
    async def _handle_send_sms(self, config: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle SMS sending"""
        phone = config.get('phone')
        message = config.get('message', '')
        
        if not phone:
            return {'success': False, 'error': 'phone number is required'}
        
        # Here you would integrate with your SMS service (Twilio, AWS SNS, etc.)
        # For now, we'll just log the SMS
        print(f"📱 Sending SMS to {phone}: {message}")
        
        return {
            'success': True,
            'action': 'send_sms',
            'phone': phone,
            'message': message,
            'sent_at': datetime.utcnow().isoformat()
        }
    
    async def _handle_api_call(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Handle API call"""
        url = config.get('url')
        method = config.get('method', 'POST')
        headers = config.get('headers', {})
        body = config.get('body', {})
        timeout = config.get('timeout', 30)
        
        if not url:
            return {'success': False, 'error': 'url is required'}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=body if method in ['POST', 'PUT', 'PATCH'] else None,
                    timeout=aiohttp.ClientTimeout(total=timeout)
                ) as response:
                    response_data = await response.text()
                    
                    # Try to parse as JSON
                    try:
                        response_data = json.loads(response_data)
                    except:
                        pass
                    
                    return {
                        'success': response.status < 400,
                        'action': 'api_call',
                        'status_code': response.status,
                        'response': response_data,
                        'url': url,
                        'method': method
                    }
        
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_webhook_call(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Handle webhook call"""
        return await self._handle_api_call(config)
    
    async def _handle_show_message(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Handle show message action"""
        message = config.get('message', 'Action completed')
        type = config.get('type', 'info')  # info, success, warning, error
        duration = config.get('duration', 5000)
        
        return {
            'success': True,
            'action': 'show_message',
            'message': message,
            'type': type,
            'duration': duration
        }
    
    async def _handle_update_element(self, config: Dict[str, Any], widget_id: str) -> Dict[str, Any]:
        """Handle element update action"""
        target_element = config.get('target_element', widget_id)
        updates = config.get('updates', {})
        
        return {
            'success': True,
            'action': 'update_element',
            'target_element': target_element,
            'updates': updates
        }
    
    async def _handle_toggle_visibility(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Handle toggle visibility action"""
        target_element = config.get('target_element')
        visible = config.get('visible')
        
        if not target_element:
            return {'success': False, 'error': 'target_element is required'}
        
        return {
            'success': True,
            'action': 'toggle_visibility',
            'target_element': target_element,
            'visible': visible
        }
    
    async def _handle_open_modal(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Handle open modal action"""
        modal_id = config.get('modal_id')
        content = config.get('content', {})
        
        return {
            'success': True,
            'action': 'open_modal',
            'modal_id': modal_id,
            'content': content
        }
    
    async def _handle_close_modal(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Handle close modal action"""
        modal_id = config.get('modal_id')
        
        return {
            'success': True,
            'action': 'close_modal',
            'modal_id': modal_id
        }
    
    async def _handle_redirect(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Handle redirect action"""
        url = config.get('url', '/')
        delay = config.get('delay', 0)
        
        if delay > 0:
            await asyncio.sleep(min(delay, 10))  # Max 10 seconds
        
        return {
            'success': True,
            'action': 'redirect',
            'url': url,
            'delay': delay
        }
    
    async def _handle_delay(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Handle delay action"""
        seconds = config.get('seconds', 1)
        max_delay = min(seconds, 300)  # Max 5 minutes
        
        await asyncio.sleep(max_delay)
        
        return {
            'success': True,
            'action': 'delay',
            'seconds': max_delay
        }
    
    async def _handle_condition(
        self, 
        config: Dict[str, Any], 
        event_data: Dict[str, Any], 
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle conditional action"""
        condition = config.get('condition')
        true_actions = config.get('true_actions', [])
        false_actions = config.get('false_actions', [])
        
        if not condition:
            return {'success': False, 'error': 'condition is required'}
        
        # Evaluate condition (simple implementation)
        result = self._evaluate_condition(condition, event_data, user_context)
        
        actions_to_execute = true_actions if result else false_actions
        
        return {
            'success': True,
            'action': 'condition',
            'condition_result': result,
            'actions_to_execute': len(actions_to_execute)
        }
    
    async def _handle_loop(
        self, 
        config: Dict[str, Any], 
        event_data: Dict[str, Any], 
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle loop action"""
        iterations = config.get('iterations', 1)
        max_iterations = min(iterations, 100)  # Safety limit
        actions = config.get('actions', [])
        
        executed_count = 0
        for i in range(max_iterations):
            # Execute actions in loop
            executed_count += 1
            # Here you would execute the actions
        
        return {
            'success': True,
            'action': 'loop',
            'executed_iterations': executed_count,
            'actions_per_iteration': len(actions)
        }
    
    async def _handle_trigger_automation(
        self, 
        config: Dict[str, Any], 
        app_id: str, 
        event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle trigger automation action"""
        automation_id = config.get('automation_id')
        
        if not automation_id:
            return {'success': False, 'error': 'automation_id is required'}
        
        # Here you would trigger the automation
        # For now, we'll just return success
        return {
            'success': True,
            'action': 'trigger_automation',
            'automation_id': automation_id,
            'triggered_at': datetime.utcnow().isoformat()
        }
    
    def _evaluate_condition(
        self, 
        condition: Dict[str, Any], 
        event_data: Dict[str, Any], 
        user_context: Dict[str, Any]
    ) -> bool:
        """Evaluate a condition"""
        # Simple condition evaluation
        # Format: {"field": "email", "operator": "equals", "value": "test@example.com"}
        
        field = condition.get('field')
        operator = condition.get('operator')
        expected_value = condition.get('value')
        
        if not all([field, operator]):
            return False
        
        # Get actual value from event data or user context
        actual_value = event_data.get(field) or user_context.get(field)
        
        if operator == 'equals':
            return actual_value == expected_value
        elif operator == 'not_equals':
            return actual_value != expected_value
        elif operator == 'contains':
            return expected_value in str(actual_value) if actual_value else False
        elif operator == 'greater_than':
            try:
                return float(actual_value) > float(expected_value)
            except:
                return False
        elif operator == 'less_than':
            try:
                return float(actual_value) < float(expected_value)
            except:
                return False
        elif operator == 'is_empty':
            return not actual_value
        elif operator == 'is_not_empty':
            return bool(actual_value)
        
        return False


class EventManager:
    """Manages event handling and action execution"""
    
    def __init__(self, db: Session):
        self.db = db
        self.action_service = ActionExecutionService(db)
    
    async def handle_widget_event(
        self,
        app_id: str,
        widget_id: str,
        event_type: str,
        event_data: Dict[str, Any],
        user_context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Handle a widget event and execute associated actions"""
        
        # Get app and its actions
        app = self.db.query(App).filter(App.id == uuid.UUID(app_id)).first()
        if not app:
            return [{'success': False, 'error': 'App not found'}]
        
        app_config = app.config or {}
        actions = app_config.get('actions', {})
        
        results = []
        
        # Find actions that match this event
        for action_id, action in actions.items():
            if not action.get('is_active', True):
                continue
            
            for handler in action.get('event_handlers', []):
                if handler.get('event_type') == event_type:
                    # Check if this handler applies to this widget
                    element_selector = handler.get('element_selector')
                    if element_selector:
                        # Simple selector matching
                        if f"#{widget_id}" not in element_selector and f".{widget_id}" not in element_selector:
                            continue
                    
                    # Execute all actions in this handler
                    for action_config in handler.get('actions', []):
                        result = await self.action_service.execute_widget_action(
                            app_id=app_id,
                            widget_id=widget_id,
                            action_config=action_config,
                            event_data=event_data,
                            user_context=user_context
                        )
                        
                        result['action_id'] = action_id
                        result['handler_event_type'] = event_type
                        results.append(result)
        
        return results