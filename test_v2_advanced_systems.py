#!/usr/bin/env python3
"""
V2 Advanced Systems Testing
Tests data sources, actions, events, webhooks, integrations, and automation
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# API Configuration
BASE_URL = "http://localhost:8000"
V1_BASE = f"{BASE_URL}/api/v1"
V2_BASE = f"{BASE_URL}/api/v2"

class AdvancedSystemsTester:
    def __init__(self):
        self.session = requests.Session()
        self.v1_token = None
        self.v2_token = None
        self.test_app_id = None
        self.test_results = {
            "v1": {"passed": 0, "failed": 0, "errors": []},
            "v2": {"passed": 0, "failed": 0, "errors": []}
        }
    
    def log_result(self, version: str, endpoint: str, success: bool, error: str = None):
        """Log test result"""
        if success:
            self.test_results[version]["passed"] += 1
            print(f"✓ {version.upper()} {endpoint}")
        else:
            self.test_results[version]["failed"] += 1
            self.test_results[version]["errors"].append(f"{endpoint}: {error}")
            print(f"✗ {version.upper()} {endpoint} - {error}")
    
    def setup_auth(self):
        """Setup authentication for both V1 and V2"""
        print("=== Setting up Authentication ===")
        
        # Create test user and get tokens
        test_user = {
            "email": f"advtest_{int(time.time())}@example.com",
            "username": f"advtest_{int(time.time())}",
            "password": "testpassword123",
            "full_name": "Advanced Test User",
            "terms_accepted": True
        }
        
        # V1 Auth
        try:
            response = self.session.post(f"{V1_BASE}/auth/register", json=test_user)
            if response.status_code in [200, 201]:
                login_data = {"email": test_user["email"], "password": test_user["password"]}
                response = self.session.post(f"{V1_BASE}/auth/login", json=login_data)
                if response.status_code == 200:
                    self.v1_token = response.json().get("access_token")
                    print("✓ V1 Authentication setup")
        except Exception as e:
            print(f"✗ V1 Authentication failed: {e}")
        
        # V2 Auth
        try:
            response = self.session.post(f"{V2_BASE}/auth/register", json=test_user)
            if response.status_code in [200, 201]:
                login_data = {"email": test_user["email"], "password": test_user["password"]}
                response = self.session.post(f"{V2_BASE}/auth/login", json=login_data)
                if response.status_code == 200:
                    self.v2_token = response.json().get("access_token")
                    print("✓ V2 Authentication setup")
        except Exception as e:
            print(f"✗ V2 Authentication failed: {e}")
    
    def setup_test_app(self):
        """Create a test app for testing"""
        print("\n=== Setting up Test App ===")
        
        app_data = {
            "name": f"Test App {int(time.time())}",
            "description": "Test application for advanced systems",
            "app_type": "website"
        }
        
        if self.v2_token:
            try:
                headers = {"Authorization": f"Bearer {self.v2_token}"}
                response = self.session.post(f"{V2_BASE}/apps/", json=app_data, headers=headers)
                if response.status_code in [200, 201]:
                    self.test_app_id = response.json().get("id")
                    print(f"✓ Test app created: {self.test_app_id}")
                else:
                    print(f"✗ Failed to create test app: {response.status_code}")
            except Exception as e:
                print(f"✗ Test app creation failed: {e}")
    
    def test_data_sources(self):
        """Test data sources functionality"""
        print("\n=== Testing Data Sources ===")
        
        if not self.test_app_id:
            print("Skipping data sources tests - no test app")
            return
        
        # Test V1 Data Sources
        if self.v1_token:
            try:
                headers = {"Authorization": f"Bearer {self.v1_token}"}
                
                # List data sources
                response = self.session.get(f"{V1_BASE}/data-sources", headers=headers)
                self.log_result("v1", "/data-sources (list)", response.status_code == 200)
                
                # Create data source
                ds_data = {
                    "name": "Test API Source",
                    "type": "api",
                    "config": {
                        "url": "https://jsonplaceholder.typicode.com/posts",
                        "method": "GET"
                    }
                }
                response = self.session.post(f"{V1_BASE}/data-sources", json=ds_data, headers=headers)
                self.log_result("v1", "/data-sources (create)", response.status_code in [200, 201])
                
            except Exception as e:
                self.log_result("v1", "/data-sources/*", False, str(e))
        
        # Test V2 Data Sources (correct endpoint structure)
        if self.v2_token:
            try:
                headers = {"Authorization": f"Bearer {self.v2_token}"}
                
                # List data sources (requires app_id parameter)
                response = self.session.get(f"{V2_BASE}/data-sources?app_id={self.test_app_id}", headers=headers)
                self.log_result("v2", "/data-sources (list)", response.status_code == 200)
                
                # Create data source
                ds_data = {
                    "name": "Test API Source V2",
                    "type": "api",
                    "config": {
                        "url": "https://jsonplaceholder.typicode.com/users",
                        "method": "GET"
                    }
                }
                response = self.session.post(f"{V2_BASE}/data-sources?app_id={self.test_app_id}", json=ds_data, headers=headers)
                self.log_result("v2", "/data-sources (create)", response.status_code in [200, 201])
                
            except Exception as e:
                self.log_result("v2", "/data-sources/*", False, str(e))
    
    def test_actions_and_events(self):
        """Test actions and events system"""
        print("\n=== Testing Actions & Events ===")
        
        if not self.test_app_id:
            print("Skipping actions tests - no test app")
            return
        
        # Test V1 Actions
        if self.v1_token:
            try:
                headers = {"Authorization": f"Bearer {self.v1_token}"}
                
                # List actions
                response = self.session.get(f"{V1_BASE}/apps/{self.test_app_id}/actions", headers=headers)
                self.log_result("v1", f"/apps/{self.test_app_id}/actions (list)", response.status_code == 200)
                
                # Create action
                action_data = {
                    "name": "Test Webhook Action",
                    "action_type": "webhook",
                    "trigger_config": {
                        "event": "form_submit"
                    },
                    "config": {
                        "url": "https://webhook.site/test",
                        "method": "POST"
                    }
                }
                response = self.session.post(f"{V1_BASE}/apps/{self.test_app_id}/actions", json=action_data, headers=headers)
                self.log_result("v1", f"/apps/{self.test_app_id}/actions (create)", response.status_code in [200, 201])
                
                if response.status_code in [200, 201]:
                    action_id = response.json().get("id")
                    # Execute action
                    exec_data = {"test_data": "hello world"}
                    response = self.session.post(f"{V1_BASE}/apps/{self.test_app_id}/actions/{action_id}/execute", json=exec_data, headers=headers)
                    self.log_result("v1", f"/apps/{self.test_app_id}/actions/{action_id}/execute", response.status_code == 200)
                
            except Exception as e:
                self.log_result("v1", "/actions/*", False, str(e))
        
        # Test V2 Actions
        if self.v2_token:
            try:
                headers = {"Authorization": f"Bearer {self.v2_token}"}
                
                # List actions
                response = self.session.get(f"{V2_BASE}/actions/apps/{self.test_app_id}", headers=headers)
                self.log_result("v2", f"/actions/apps/{self.test_app_id} (list)", response.status_code == 200)
                
                # Create action
                action_data = {
                    "name": "Test Email Action V2",
                    "action_type": "email",
                    "trigger_config": {
                        "event": "user_signup"
                    },
                    "config": {
                        "to": "test@example.com",
                        "subject": "Welcome!",
                        "template": "welcome_email"
                    }
                }
                response = self.session.post(f"{V2_BASE}/actions/apps/{self.test_app_id}", json=action_data, headers=headers)
                self.log_result("v2", f"/actions/apps/{self.test_app_id} (create)", response.status_code in [200, 201])
                
            except Exception as e:
                self.log_result("v2", "/actions/*", False, str(e))
    
    def test_webhooks(self):
        """Test webhooks functionality"""
        print("\n=== Testing Webhooks ===")
        
        if not self.test_app_id:
            print("Skipping webhooks tests - no test app")
            return
        
        # Test V1 Webhooks
        if self.v1_token:
            try:
                headers = {"Authorization": f"Bearer {self.v1_token}"}
                
                # List webhooks
                response = self.session.get(f"{V1_BASE}/apps/{self.test_app_id}/webhooks", headers=headers)
                self.log_result("v1", f"/apps/{self.test_app_id}/webhooks (list)", response.status_code == 200)
                
                # Create webhook
                webhook_data = {
                    "name": "Test Webhook",
                    "url": "https://webhook.site/test-v1",
                    "events": ["form_submit", "user_signup"],
                    "is_active": True
                }
                response = self.session.post(f"{V1_BASE}/apps/{self.test_app_id}/webhooks", json=webhook_data, headers=headers)
                self.log_result("v1", f"/apps/{self.test_app_id}/webhooks (create)", response.status_code in [200, 201])
                
            except Exception as e:
                self.log_result("v1", "/webhooks/*", False, str(e))
        
        # Test V2 Webhooks
        if self.v2_token:
            try:
                headers = {"Authorization": f"Bearer {self.v2_token}"}
                
                # List webhooks
                response = self.session.get(f"{V2_BASE}/webhooks/apps/{self.test_app_id}", headers=headers)
                self.log_result("v2", f"/webhooks/apps/{self.test_app_id} (list)", response.status_code == 200)
                
                # Create webhook
                webhook_data = {
                    "name": "Test Webhook V2",
                    "url": "https://webhook.site/test-v2",
                    "events": ["order_created", "payment_completed"],
                    "is_active": True
                }
                response = self.session.post(f"{V2_BASE}/webhooks/apps/{self.test_app_id}", json=webhook_data, headers=headers)
                self.log_result("v2", f"/webhooks/apps/{self.test_app_id} (create)", response.status_code in [200, 201])
                
            except Exception as e:
                self.log_result("v2", "/webhooks/*", False, str(e))
    
    def test_automation(self):
        """Test automation functionality"""
        print("\n=== Testing Automation ===")
        
        if not self.test_app_id:
            print("Skipping automation tests - no test app")
            return
        
        # Test V1 Automation
        if self.v1_token:
            try:
                headers = {"Authorization": f"Bearer {self.v1_token}"}
                
                # List automations
                response = self.session.get(f"{V1_BASE}/apps/{self.test_app_id}/automations", headers=headers)
                self.log_result("v1", f"/apps/{self.test_app_id}/automations (list)", response.status_code == 200)
                
                # Create automation
                automation_data = {
                    "name": "Welcome Email Automation",
                    "trigger": {
                        "type": "event",
                        "event": "user_signup"
                    },
                    "actions": [
                        {
                            "type": "email",
                            "config": {
                                "template": "welcome",
                                "to": "{{user.email}}"
                            }
                        }
                    ],
                    "is_enabled": True
                }
                response = self.session.post(f"{V1_BASE}/apps/{self.test_app_id}/automations", json=automation_data, headers=headers)
                self.log_result("v1", f"/apps/{self.test_app_id}/automations (create)", response.status_code in [200, 201])
                
            except Exception as e:
                self.log_result("v1", "/automations/*", False, str(e))
        
        # Test V2 Automation
        if self.v2_token:
            try:
                headers = {"Authorization": f"Bearer {self.v2_token}"}
                
                # List automations
                response = self.session.get(f"{V2_BASE}/apps/{self.test_app_id}/automations", headers=headers)
                self.log_result("v2", f"/apps/{self.test_app_id}/automations (list)", response.status_code == 200)
                
                # Create automation
                automation_data = {
                    "name": "Order Processing Automation V2",
                    "trigger": {
                        "type": "event",
                        "event": "order_created"
                    },
                    "actions": [
                        {
                            "type": "email",
                            "config": {
                                "template": "order_confirmation",
                                "to": "{{order.customer_email}}"
                            }
                        },
                        {
                            "type": "webhook",
                            "config": {
                                "url": "https://api.inventory.com/update",
                                "method": "POST"
                            }
                        }
                    ],
                    "is_enabled": True
                }
                response = self.session.post(f"{V2_BASE}/apps/{self.test_app_id}/automations", json=automation_data, headers=headers)
                self.log_result("v2", f"/apps/{self.test_app_id}/automations (create)", response.status_code in [200, 201])
                
            except Exception as e:
                self.log_result("v2", "/automations/*", False, str(e))
    
    def test_integrations_advanced(self):
        """Test advanced integrations functionality"""
        print("\n=== Testing Advanced Integrations ===")
        
        if not self.test_app_id:
            print("Skipping integrations tests - no test app")
            return
        
        # Test V1 Integrations (correct V1 endpoint structure)
        if self.v1_token:
            try:
                headers = {"Authorization": f"Bearer {self.v1_token}"}
                
                # List app integrations (V1 uses different structure)
                response = self.session.get(f"{V1_BASE}/integrations/available", headers=headers)
                self.log_result("v1", "/integrations/available", response.status_code == 200)
                
            except Exception as e:
                self.log_result("v1", "/integrations/advanced/*", False, str(e))
        
        # Test V2 Integrations (correct V2 endpoint structure)
        if self.v2_token:
            try:
                headers = {"Authorization": f"Bearer {self.v2_token}"}
                
                # List available integrations
                response = self.session.get(f"{V2_BASE}/integrations/available", headers=headers)
                self.log_result("v2", "/integrations/available", response.status_code == 200)
                
                # List app integrations
                response = self.session.get(f"{V2_BASE}/integrations/apps/{self.test_app_id}", headers=headers)
                self.log_result("v2", f"/integrations/apps/{self.test_app_id} (list)", response.status_code == 200)
                
            except Exception as e:
                self.log_result("v2", "/integrations/advanced/*", False, str(e))
    
    def test_cross_app_communication(self):
        """Test cross-app communication (V2 feature)"""
        print("\n=== Testing Cross-App Communication ===")
        
        if not self.test_app_id or not self.v2_token:
            print("Skipping cross-app tests - no test app or V2 token")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.v2_token}"}
            
            # List cross-app connections
            response = self.session.get(f"{V2_BASE}/cross-app/apps/{self.test_app_id}/connections", headers=headers)
            self.log_result("v2", f"/cross-app/apps/{self.test_app_id}/connections (list)", response.status_code == 200)
            
            # Create cross-app action
            cross_app_data = {
                "name": "Sync User Data",
                "target_app_id": "another-app-id",
                "action_type": "data_sync",
                "config": {
                    "sync_fields": ["email", "name", "preferences"],
                    "trigger_event": "user_update"
                }
            }
            response = self.session.post(f"{V2_BASE}/cross-app/apps/{self.test_app_id}/actions", json=cross_app_data, headers=headers)
            self.log_result("v2", f"/cross-app/apps/{self.test_app_id}/actions (create)", response.status_code in [200, 201])
            
        except Exception as e:
            self.log_result("v2", "/cross-app/*", False, str(e))
    
    def run_all_tests(self):
        """Run all advanced systems tests"""
        print("🚀 Starting V2 Advanced Systems Testing")
        print("=" * 60)
        
        self.setup_auth()
        self.setup_test_app()
        
        self.test_data_sources()
        self.test_actions_and_events()
        self.test_webhooks()
        self.test_automation()
        self.test_integrations_advanced()
        self.test_cross_app_communication()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 ADVANCED SYSTEMS TEST SUMMARY")
        print("=" * 60)
        
        for version in ["v1", "v2"]:
            results = self.test_results[version]
            total = results["passed"] + results["failed"]
            success_rate = (results["passed"] / total * 100) if total > 0 else 0
            
            print(f"\n{version.upper()} Advanced Systems Results:")
            print(f"  ✓ Passed: {results['passed']}")
            print(f"  ✗ Failed: {results['failed']}")
            print(f"  📈 Success Rate: {success_rate:.1f}%")
            
            if results["errors"]:
                print(f"  🔍 Errors:")
                for error in results["errors"][:3]:  # Show first 3 errors
                    print(f"    - {error}")
                if len(results["errors"]) > 3:
                    print(f"    ... and {len(results['errors']) - 3} more")
        
        # Overall assessment
        v1_total = self.test_results["v1"]["passed"] + self.test_results["v1"]["failed"]
        v2_total = self.test_results["v2"]["passed"] + self.test_results["v2"]["failed"]
        
        v1_success = (self.test_results["v1"]["passed"] / v1_total * 100) if v1_total > 0 else 0
        v2_success = (self.test_results["v2"]["passed"] / v2_total * 100) if v2_total > 0 else 0
        
        print(f"\n🎯 ADVANCED SYSTEMS ASSESSMENT:")
        if v2_success >= v1_success and v2_success > 70:
            print("✅ V2 advanced systems are working well!")
        elif v2_success >= 50:
            print("⚠️  V2 advanced systems are functional but need some fixes")
        else:
            print("❌ V2 advanced systems need significant work")
        
        print(f"\n📋 System Status:")
        systems = ["Data Sources", "Actions & Events", "Webhooks", "Automation", "Integrations", "Cross-App (V2 only)"]
        for system in systems:
            print(f"  - {system}: Testing completed")


if __name__ == "__main__":
    tester = AdvancedSystemsTester()
    tester.run_all_tests()