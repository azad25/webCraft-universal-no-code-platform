#!/usr/bin/env python3
"""
Fix V2 Schemas and Test All Features
Comprehensive testing with correct V2 schemas
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# API Configuration
BASE_URL = "http://localhost:8000"
V2_BASE = f"{BASE_URL}/api/v2"

class V2SchemaFixer:
    def __init__(self):
        self.session = requests.Session()
        self.v2_token = None
        self.test_app_id = None
        self.results = {"passed": 0, "failed": 0, "errors": []}
    
    def log_result(self, test_name: str, success: bool, error: str = None):
        """Log test result"""
        if success:
            self.results["passed"] += 1
            print(f"✓ {test_name}")
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {error}")
            print(f"✗ {test_name} - {error}")
    
    def setup_auth_and_app(self):
        """Setup authentication and test app"""
        print("=== Setting up Authentication & App ===")
        
        # Register and login
        test_user = {
            "email": f"schema_fix_{int(time.time())}@example.com",
            "username": f"schema_fix_{int(time.time())}",
            "password": "testpassword123",
            "full_name": "Schema Fix User",
            "terms_accepted": True
        }
        
        try:
            # Register
            response = self.session.post(f"{V2_BASE}/auth/register", json=test_user)
            if response.status_code in [200, 201]:
                # Login
                login_data = {"email": test_user["email"], "password": test_user["password"]}
                response = self.session.post(f"{V2_BASE}/auth/login", json=login_data)
                if response.status_code == 200:
                    self.v2_token = response.json().get("access_token")
                    
                    # Create test app
                    app_data = {
                        "name": f"Schema Fix App {int(time.time())}",
                        "description": "App for schema testing",
                        "app_type": "website"
                    }
                    headers = {"Authorization": f"Bearer {self.v2_token}"}
                    response = self.session.post(f"{V2_BASE}/apps/", json=app_data, headers=headers)
                    if response.status_code in [200, 201]:
                        self.test_app_id = response.json().get("id")
                        print(f"✓ Setup complete - App ID: {self.test_app_id}")
                        return True
        except Exception as e:
            print(f"✗ Setup failed: {e}")
        
        return False
    
    def test_data_sources_with_correct_schema(self):
        """Test data sources with correct V2 schema"""
        print("\n=== Testing Data Sources (Correct Schema) ===")
        
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        
        # Test 1: Create data source with correct schema
        ds_data = {
            "name": "Test API Source",
            "description": "Test REST API data source",
            "base_url": "https://jsonplaceholder.typicode.com",
            "auth_type": "none",
            "default_headers": {"Content-Type": "application/json"},
            "rate_limit": 60,
            "timeout": 30,
            "cache_ttl": 300
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/data-sources?app_id={self.test_app_id}", json=ds_data, headers=headers)
            success = response.status_code in [200, 201]
            error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
            self.log_result("Data Sources - Create (Correct Schema)", success, error)
            
            if success:
                ds_id = response.json().get("id")
                
                # Test 2: Create endpoint for the data source
                endpoint_data = {
                    "name": "Get Posts",
                    "path": "/posts",
                    "method": "GET",
                    "query_params": {"_limit": "10"},
                    "headers": {},
                    "response_mapping": {"id": "id", "title": "title", "body": "content"}
                }
                
                response = self.session.post(f"{V2_BASE}/data-sources/{ds_id}/endpoints", json=endpoint_data, headers=headers)
                success = response.status_code in [200, 201]
                error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
                self.log_result("Data Sources - Create Endpoint", success, error)
                
                # Test 3: Test data source connection
                response = self.session.post(f"{V2_BASE}/data-sources/{ds_id}/test", headers=headers)
                success = response.status_code in [200, 201]
                error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
                self.log_result("Data Sources - Test Connection", success, error)
        
        except Exception as e:
            self.log_result("Data Sources - Create (Correct Schema)", False, str(e))
    
    def test_actions_with_correct_schema(self):
        """Test actions with correct V2 schema"""
        print("\n=== Testing Actions (Correct Schema) ===")
        
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        
        # Test 1: Create webhook action
        action_data = {
            "name": "Test Webhook Action",
            "action_type": "webhook",
            "description": "Test webhook action with correct schema",
            "trigger_config": {
                "event_type": "form_submit",
                "conditions": []
            },
            "config": {
                "url": "https://httpbin.org/post",
                "method": "POST",
                "headers": {"Content-Type": "application/json"},
                "body_template": {"message": "Hello from WebCraft"}
            },
            "is_enabled": True
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/actions/apps/{self.test_app_id}", json=action_data, headers=headers)
            success = response.status_code in [200, 201]
            error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
            self.log_result("Actions - Create Webhook", success, error)
            
            if success:
                action_id = response.json().get("id")
                
                # Test 2: Execute action
                exec_data = {
                    "input_data": {"form_field": "test_value"},
                    "context": {"user_id": "test_user"}
                }
                
                response = self.session.post(f"{V2_BASE}/actions/apps/{self.test_app_id}/{action_id}/execute", json=exec_data, headers=headers)
                success = response.status_code in [200, 201]
                error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
                self.log_result("Actions - Execute", success, error)
        
        except Exception as e:
            self.log_result("Actions - Create Webhook", False, str(e))
        
        # Test 3: Create email action
        email_action_data = {
            "name": "Test Email Action",
            "action_type": "email",
            "description": "Test email action",
            "trigger_config": {
                "event_type": "user_signup"
            },
            "config": {
                "to": "test@example.com",
                "subject": "Welcome!",
                "template": "welcome_email",
                "variables": {"user_name": "{{user.name}}"}
            },
            "is_enabled": True
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/actions/apps/{self.test_app_id}", json=email_action_data, headers=headers)
            success = response.status_code in [200, 201]
            error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
            self.log_result("Actions - Create Email", success, error)
        
        except Exception as e:
            self.log_result("Actions - Create Email", False, str(e))
    
    def test_webhooks_with_correct_schema(self):
        """Test webhooks with correct V2 schema"""
        print("\n=== Testing Webhooks (Correct Schema) ===")
        
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        
        # Test 1: Create webhook
        webhook_data = {
            "name": "Test Webhook",
            "url": "https://httpbin.org/post",
            "events": ["form_submit", "user_signup", "order_created"],
            "secret": "webhook_secret_123",
            "is_active": True,
            "retry_config": {
                "max_retries": 3,
                "retry_delay": 5
            }
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/webhooks/apps/{self.test_app_id}", json=webhook_data, headers=headers)
            success = response.status_code in [200, 201]
            error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
            self.log_result("Webhooks - Create", success, error)
            
            if success:
                webhook_id = response.json().get("id")
                
                # Test 2: Test webhook
                test_data = {"test_payload": "webhook_test"}
                response = self.session.post(f"{V2_BASE}/webhooks/apps/{self.test_app_id}/{webhook_id}/test", json=test_data, headers=headers)
                success = response.status_code in [200, 201]
                error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
                self.log_result("Webhooks - Test", success, error)
        
        except Exception as e:
            self.log_result("Webhooks - Create", False, str(e))
    
    def test_automation_with_correct_schema(self):
        """Test automation with correct V2 schema"""
        print("\n=== Testing Automation (Correct Schema) ===")
        
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        
        # Test 1: Create automation
        automation_data = {
            "name": "Welcome Email Automation",
            "description": "Send welcome email to new users",
            "trigger": {
                "type": "event",
                "event_type": "user_signup",
                "conditions": [
                    {
                        "field": "user.email_verified",
                        "operator": "equals",
                        "value": True
                    }
                ]
            },
            "actions": [
                {
                    "type": "email",
                    "config": {
                        "template": "welcome_email",
                        "to": "{{user.email}}",
                        "subject": "Welcome to WebCraft!",
                        "variables": {
                            "user_name": "{{user.name}}",
                            "app_name": "{{app.name}}"
                        }
                    },
                    "delay": 0
                },
                {
                    "type": "webhook",
                    "config": {
                        "url": "https://analytics.example.com/track",
                        "method": "POST",
                        "body": {
                            "event": "user_welcomed",
                            "user_id": "{{user.id}}"
                        }
                    },
                    "delay": 300
                }
            ],
            "is_enabled": True,
            "schedule": {
                "type": "immediate"
            }
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/apps/{self.test_app_id}/automations", json=automation_data, headers=headers)
            success = response.status_code in [200, 201]
            error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
            self.log_result("Automation - Create", success, error)
            
            if success:
                automation_id = response.json().get("id")
                
                # Test 2: Execute automation manually
                exec_data = {
                    "trigger_data": {
                        "user": {
                            "id": "test_user_123",
                            "email": "test@example.com",
                            "name": "Test User",
                            "email_verified": True
                        },
                        "app": {
                            "name": "Test App"
                        }
                    }
                }
                
                response = self.session.post(f"{V2_BASE}/apps/{self.test_app_id}/automations/{automation_id}/execute", json=exec_data, headers=headers)
                success = response.status_code in [200, 201]
                error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
                self.log_result("Automation - Execute", success, error)
                
                # Test 3: Toggle automation
                response = self.session.post(f"{V2_BASE}/apps/{self.test_app_id}/automations/{automation_id}/toggle", headers=headers)
                success = response.status_code in [200, 201]
                error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
                self.log_result("Automation - Toggle", success, error)
        
        except Exception as e:
            self.log_result("Automation - Create", False, str(e))
    
    def test_integrations_with_correct_schema(self):
        """Test integrations with correct V2 schema"""
        print("\n=== Testing Integrations (Correct Schema) ===")
        
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        
        # Test 1: Connect Stripe integration
        stripe_data = {
            "provider": "stripe",
            "config": {
                "api_key": "sk_test_fake_key_for_testing_only",
                "webhook_endpoint": f"https://myapp.com/webhooks/stripe",
                "currency": "usd"
            }
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/integrations/apps/{self.test_app_id}/connect", json=stripe_data, headers=headers)
            success = response.status_code in [200, 201]
            error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
            self.log_result("Integrations - Connect Stripe", success, error)
        
        except Exception as e:
            self.log_result("Integrations - Connect Stripe", False, str(e))
        
        # Test 2: Connect Mailchimp integration
        mailchimp_data = {
            "provider": "mailchimp",
            "config": {
                "api_key": "fake_mailchimp_key_for_testing",
                "server": "us1",
                "list_id": "test_list_123"
            }
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/integrations/apps/{self.test_app_id}/connect", json=mailchimp_data, headers=headers)
            success = response.status_code in [200, 201]
            error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
            self.log_result("Integrations - Connect Mailchimp", success, error)
        
        except Exception as e:
            self.log_result("Integrations - Connect Mailchimp", False, str(e))
    
    def test_advanced_v2_features(self):
        """Test advanced V2-specific features"""
        print("\n=== Testing Advanced V2 Features ===")
        
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        
        # Test 1: CRM Contact creation
        contact_data = {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "+1234567890",
            "company": "Test Company",
            "tags": ["lead", "interested"],
            "custom_fields": {
                "source": "website",
                "budget": "10000"
            }
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/apps/{self.test_app_id}/crm/contacts", json=contact_data, headers=headers)
            success = response.status_code in [200, 201]
            error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
            self.log_result("CRM - Create Contact", success, error)
        
        except Exception as e:
            self.log_result("CRM - Create Contact", False, str(e))
        
        # Test 2: E-commerce Product creation
        product_data = {
            "name": "Test Product",
            "description": "A test product for V2 testing",
            "price": 29.99,
            "currency": "USD",
            "sku": "TEST-PROD-001",
            "inventory": {
                "track_quantity": True,
                "quantity": 100,
                "low_stock_threshold": 10
            },
            "images": ["https://example.com/product.jpg"],
            "categories": ["electronics", "gadgets"],
            "is_active": True
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/ecommerce/apps/{self.test_app_id}/ecommerce/products", json=product_data, headers=headers)
            success = response.status_code in [200, 201]
            error = f"Status {response.status_code}: {response.text[:200]}" if not success else None
            self.log_result("E-commerce - Create Product", success, error)
        
        except Exception as e:
            self.log_result("E-commerce - Create Product", False, str(e))
    
    def run_comprehensive_test(self):
        """Run comprehensive V2 feature test with correct schemas"""
        print("🚀 Starting V2 Comprehensive Feature Test")
        print("=" * 60)
        
        if not self.setup_auth_and_app():
            print("❌ Setup failed. Cannot proceed.")
            return
        
        # Run all tests
        self.test_data_sources_with_correct_schema()
        self.test_actions_with_correct_schema()
        self.test_webhooks_with_correct_schema()
        self.test_automation_with_correct_schema()
        self.test_integrations_with_correct_schema()
        self.test_advanced_v2_features()
        
        # Print results
        print("\n" + "=" * 60)
        print("📊 V2 COMPREHENSIVE TEST RESULTS")
        print("=" * 60)
        
        total = self.results["passed"] + self.results["failed"]
        success_rate = (self.results["passed"] / total * 100) if total > 0 else 0
        
        print(f"\n📈 Test Statistics:")
        print(f"  Total Tests: {total}")
        print(f"  ✅ Passed: {self.results['passed']}")
        print(f"  ❌ Failed: {self.results['failed']}")
        print(f"  📊 Success Rate: {success_rate:.1f}%")
        
        if self.results["errors"]:
            print(f"\n❌ Failed Tests:")
            for error in self.results["errors"][:5]:
                print(f"  - {error}")
            if len(self.results["errors"]) > 5:
                print(f"  ... and {len(self.results['errors']) - 5} more")
        
        print(f"\n🎯 V2 API ASSESSMENT:")
        if success_rate >= 90:
            print("🎉 EXCELLENT! V2 API is production-ready!")
        elif success_rate >= 75:
            print("✅ GOOD! V2 API is mostly functional.")
        elif success_rate >= 50:
            print("⚠️  PARTIAL! V2 API needs some fixes.")
        else:
            print("❌ NEEDS WORK! V2 API requires significant fixes.")
        
        return success_rate


if __name__ == "__main__":
    fixer = V2SchemaFixer()
    success_rate = fixer.run_comprehensive_test()
    
    if success_rate >= 75:
        print(f"\n🎉 V2 API SUCCESS! ({success_rate:.1f}%)")
    else:
        print(f"\n⚠️  V2 API needs improvement ({success_rate:.1f}%)")