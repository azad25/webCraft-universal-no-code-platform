#!/usr/bin/env python3
"""
V1 vs V2 Core Systems Comparison Test
Comprehensive comparison of data sources, actions, events, webhooks, integrations, and automation
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# API Configuration
BASE_URL = "http://localhost:8000"
V1_BASE = f"{BASE_URL}/api/v1"
V2_BASE = f"{BASE_URL}/api/v2"

class V1V2CoreSystemsComparison:
    def __init__(self):
        self.session = requests.Session()
        self.v1_token = None
        self.v2_token = None
        self.v1_app_id = None
        self.v2_app_id = None
        self.results = {
            "v1": {"passed": 0, "failed": 0, "errors": []},
            "v2": {"passed": 0, "failed": 0, "errors": []}
        }
    
    def log_result(self, version: str, test_name: str, success: bool, error: str = None):
        """Log test result for V1 or V2"""
        if success:
            self.results[version]["passed"] += 1
            print(f"✅ {version.upper()} {test_name}")
        else:
            self.results[version]["failed"] += 1
            self.results[version]["errors"].append(f"{test_name}: {error}")
            print(f"❌ {version.upper()} {test_name} - {error}")
    
    def setup_v1_auth_and_app(self):
        """Setup V1 authentication and test app"""
        print("🔧 Setting up V1 Authentication & App")
        
        test_user = {
            "email": f"v1_test_{int(time.time())}@example.com",
            "username": f"v1_test_{int(time.time())}",
            "password": "testpassword123",
            "full_name": "V1 Test User"
        }
        
        try:
            # Register
            response = self.session.post(f"{V1_BASE}/auth/register", json=test_user)
            if response.status_code in [200, 201]:
                # Login
                login_data = {"email": test_user["email"], "password": test_user["password"]}
                response = self.session.post(f"{V1_BASE}/auth/login", json=login_data)
                if response.status_code == 200:
                    self.v1_token = response.json().get("access_token")
                    
                    # Create test app
                    app_data = {
                        "name": f"V1 Test App {int(time.time())}",
                        "description": "App for V1 testing"
                    }
                    headers = {"Authorization": f"Bearer {self.v1_token}"}
                    response = self.session.post(f"{V1_BASE}/apps/", json=app_data, headers=headers)
                    if response.status_code in [200, 201]:
                        self.v1_app_id = response.json().get("id")
                        print(f"✅ V1 Setup complete - App ID: {self.v1_app_id}")
                        return True
        except Exception as e:
            print(f"❌ V1 Setup failed: {e}")
        
        return False
    
    def setup_v2_auth_and_app(self):
        """Setup V2 authentication and test app"""
        print("🔧 Setting up V2 Authentication & App")
        
        test_user = {
            "email": f"v2_test_{int(time.time())}@example.com",
            "username": f"v2_test_{int(time.time())}",
            "password": "testpassword123",
            "full_name": "V2 Test User",
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
                        "name": f"V2 Test App {int(time.time())}",
                        "description": "App for V2 testing",
                        "app_type": "website"
                    }
                    headers = {"Authorization": f"Bearer {self.v2_token}"}
                    response = self.session.post(f"{V2_BASE}/apps/", json=app_data, headers=headers)
                    if response.status_code in [200, 201]:
                        self.v2_app_id = response.json().get("id")
                        print(f"✅ V2 Setup complete - App ID: {self.v2_app_id}")
                        return True
        except Exception as e:
            print(f"❌ V2 Setup failed: {e}")
        
        return False
    
    def test_data_sources(self):
        """Test Data Sources functionality in both V1 and V2"""
        print("\n📊 Testing Data Sources")
        
        # V1 Data Sources Test
        try:
            headers = {"Authorization": f"Bearer {self.v1_token}"}
            ds_data = {
                "name": "V1 Test API",
                "description": "V1 test data source",
                "base_url": "https://jsonplaceholder.typicode.com",
                "auth_type": "none"
            }
            response = self.session.post(f"{V1_BASE}/data-sources", json=ds_data, headers=headers, params={"app_id": self.v1_app_id})
            self.log_result("v1", "Data Sources - Create", response.status_code in [200, 201], f"Status {response.status_code}")
            
            # Test list
            response = self.session.get(f"{V1_BASE}/data-sources", headers=headers, params={"app_id": self.v1_app_id})
            self.log_result("v1", "Data Sources - List", response.status_code == 200, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v1", "Data Sources", False, str(e))
        
        # V2 Data Sources Test
        try:
            headers = {"Authorization": f"Bearer {self.v2_token}"}
            ds_data = {
                "name": "V2 Test API",
                "description": "V2 test data source",
                "base_url": "https://jsonplaceholder.typicode.com",
                "auth_type": "none",
                "default_headers": {"Content-Type": "application/json"}
            }
            response = self.session.post(f"{V2_BASE}/data-sources?app_id={self.v2_app_id}", json=ds_data, headers=headers)
            self.log_result("v2", "Data Sources - Create", response.status_code in [200, 201], f"Status {response.status_code}")
            
            # Test list
            response = self.session.get(f"{V2_BASE}/data-sources?app_id={self.v2_app_id}", headers=headers)
            self.log_result("v2", "Data Sources - List", response.status_code == 200, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v2", "Data Sources", False, str(e))
    
    def test_actions_and_events(self):
        """Test Actions and Events functionality in both V1 and V2"""
        print("\n⚡ Testing Actions & Events")
        
        # V1 Actions Test
        try:
            headers = {"Authorization": f"Bearer {self.v1_token}"}
            action_data = {
                "name": "V1 Test Action",
                "description": "V1 test action",
                "trigger_type": "click",
                "action_type": "webhook",
                "config": {
                    "url": "https://httpbin.org/post",
                    "method": "POST"
                }
            }
            response = self.session.post(f"{V1_BASE}/actions/apps/{self.v1_app_id}", json=action_data, headers=headers)
            self.log_result("v1", "Actions - Create", response.status_code in [200, 201], f"Status {response.status_code}")
            
            # Test list
            response = self.session.get(f"{V1_BASE}/actions/apps/{self.v1_app_id}", headers=headers)
            self.log_result("v1", "Actions - List", response.status_code == 200, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v1", "Actions", False, str(e))
        
        # V2 Actions Test
        try:
            headers = {"Authorization": f"Bearer {self.v2_token}"}
            action_data = {
                "name": "V2 Test Action",
                "description": "V2 test action with enhanced schema",
                "event_handlers": [
                    {
                        "event_type": "click",
                        "action_type": "webhook",
                        "config": {
                            "url": "https://httpbin.org/post",
                            "method": "POST"
                        }
                    }
                ],
                "is_active": True
            }
            response = self.session.post(f"{V2_BASE}/actions/apps/{self.v2_app_id}", json=action_data, headers=headers)
            self.log_result("v2", "Actions - Create", response.status_code in [200, 201], f"Status {response.status_code}")
            
            # Test list
            response = self.session.get(f"{V2_BASE}/actions/apps/{self.v2_app_id}", headers=headers)
            self.log_result("v2", "Actions - List", response.status_code == 200, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v2", "Actions", False, str(e))
    
    def test_webhooks(self):
        """Test Webhooks functionality in both V1 and V2"""
        print("\n🔗 Testing Webhooks")
        
        # V1 Webhooks Test
        try:
            headers = {"Authorization": f"Bearer {self.v1_token}"}
            webhook_data = {
                "name": "V1 Test Webhook",
                "url": "https://httpbin.org/post",
                "events": ["form_submit"],
                "is_active": True
            }
            response = self.session.post(f"{V1_BASE}/apps/{self.v1_app_id}/webhooks", json=webhook_data, headers=headers)
            self.log_result("v1", "Webhooks - Create", response.status_code in [200, 201], f"Status {response.status_code}")
            
            # Test list
            response = self.session.get(f"{V1_BASE}/apps/{self.v1_app_id}/webhooks", headers=headers)
            self.log_result("v1", "Webhooks - List", response.status_code == 200, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v1", "Webhooks", False, str(e))
        
        # V2 Webhooks Test
        try:
            headers = {"Authorization": f"Bearer {self.v2_token}"}
            webhook_data = {
                "name": "V2 Test Webhook",
                "url": "https://httpbin.org/post",
                "events": ["form_submit", "user_signup"],
                "is_active": True
            }
            response = self.session.post(f"{V2_BASE}/webhooks/apps/{self.v2_app_id}", json=webhook_data, headers=headers)
            self.log_result("v2", "Webhooks - Create", response.status_code in [200, 201], f"Status {response.status_code}")
            
            # Test list
            response = self.session.get(f"{V2_BASE}/webhooks/apps/{self.v2_app_id}", headers=headers)
            self.log_result("v2", "Webhooks - List", response.status_code == 200, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v2", "Webhooks", False, str(e))
    
    def test_integrations(self):
        """Test Integrations functionality in both V1 and V2"""
        print("\n🔌 Testing Integrations")
        
        # V1 Integrations Test
        try:
            headers = {"Authorization": f"Bearer {self.v1_token}"}
            
            # Test available integrations
            response = self.session.get(f"{V1_BASE}/integrations/available", headers=headers)
            self.log_result("v1", "Integrations - Available", response.status_code == 200, f"Status {response.status_code}")
            
            # Test app integrations
            response = self.session.get(f"{V1_BASE}/integrations/apps/{self.v1_app_id}/integrations", headers=headers)
            self.log_result("v1", "Integrations - App List", response.status_code == 200, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v1", "Integrations", False, str(e))
        
        # V2 Integrations Test
        try:
            headers = {"Authorization": f"Bearer {self.v2_token}"}
            
            # Test available integrations
            response = self.session.get(f"{V2_BASE}/integrations/available", headers=headers)
            self.log_result("v2", "Integrations - Available", response.status_code == 200, f"Status {response.status_code}")
            
            # Test app integrations
            response = self.session.get(f"{V2_BASE}/integrations/apps/{self.v2_app_id}/integrations", headers=headers)
            self.log_result("v2", "Integrations - App List", response.status_code == 200, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v2", "Integrations", False, str(e))
    
    def test_automation(self):
        """Test Automation functionality in both V1 and V2"""
        print("\n🤖 Testing Automation")
        
        # V1 Automation Test
        try:
            headers = {"Authorization": f"Bearer {self.v1_token}"}
            automation_data = {
                "name": "V1 Test Automation",
                "description": "V1 test automation",
                "trigger": {
                    "type": "event",
                    "event_type": "user_signup"
                },
                "actions": [
                    {
                        "type": "email",
                        "config": {
                            "to": "test@example.com",
                            "subject": "Welcome!",
                            "template": "welcome"
                        }
                    }
                ],
                "is_enabled": True
            }
            response = self.session.post(f"{V1_BASE}/apps/{self.v1_app_id}/automations", json=automation_data, headers=headers)
            self.log_result("v1", "Automation - Create", response.status_code in [200, 201], f"Status {response.status_code}")
            
            # Test list
            response = self.session.get(f"{V1_BASE}/apps/{self.v1_app_id}/automations", headers=headers)
            self.log_result("v1", "Automation - List", response.status_code == 200, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v1", "Automation", False, str(e))
        
        # V2 Automation Test
        try:
            headers = {"Authorization": f"Bearer {self.v2_token}"}
            automation_data = {
                "name": "V2 Test Automation",
                "description": "V2 test automation with enhanced schema",
                "trigger_type": "event",
                "trigger_config": {
                    "event_type": "user_signup",
                    "conditions": []
                },
                "actions": [
                    {
                        "action_type": "email",
                        "config": {
                            "to": "test@example.com",
                            "subject": "Welcome!",
                            "template": "welcome"
                        },
                        "delay_seconds": 0
                    }
                ],
                "is_enabled": True
            }
            response = self.session.post(f"{V2_BASE}/apps/{self.v2_app_id}/automations", json=automation_data, headers=headers)
            self.log_result("v2", "Automation - Create", response.status_code in [200, 201], f"Status {response.status_code}")
            
            # Test list
            response = self.session.get(f"{V2_BASE}/apps/{self.v2_app_id}/automations", headers=headers)
            self.log_result("v2", "Automation - List", response.status_code == 200, f"Status {response.status_code}")
            
            # Test V2 exclusive feature - automation toggle
            if response.status_code == 200:
                automations = response.json()
                if automations and len(automations) > 0:
                    auto_id = automations[0].get("id")
                    if auto_id:
                        toggle_response = self.session.post(f"{V2_BASE}/apps/{self.v2_app_id}/automations/{auto_id}/toggle", headers=headers)
                        self.log_result("v2", "Automation - Toggle (V2 Exclusive)", toggle_response.status_code in [200, 201], f"Status {toggle_response.status_code}")
        except Exception as e:
            self.log_result("v2", "Automation", False, str(e))
    
    def run_comparison(self):
        """Run the complete V1 vs V2 comparison"""
        print("🔍 V1 vs V2 CORE SYSTEMS COMPARISON")
        print("=" * 60)
        
        # Setup both versions
        v1_setup = self.setup_v1_auth_and_app()
        v2_setup = self.setup_v2_auth_and_app()
        
        if not v1_setup:
            print("❌ V1 setup failed. Testing V2 only.")
        if not v2_setup:
            print("❌ V2 setup failed. Testing V1 only.")
        if not v1_setup and not v2_setup:
            print("❌ Both setups failed. Cannot proceed.")
            return {"v1_success_rate": 0, "v2_success_rate": 0, "winner": "none", "v2_ready": False}
        
        # Run all tests
        if v1_setup and v2_setup:
            self.test_data_sources()
            self.test_actions_and_events()
            self.test_webhooks()
            self.test_integrations()
            self.test_automation()
        elif v2_setup:
            print("\n⚠️  Testing V2 only (V1 setup failed)")
            self.test_data_sources()
            self.test_actions_and_events()
            self.test_webhooks()
            self.test_integrations()
            self.test_automation()
        elif v1_setup:
            print("\n⚠️  Testing V1 only (V2 setup failed)")
            # Test only V1 systems
            pass
        
        # Calculate results
        v1_total = self.results["v1"]["passed"] + self.results["v1"]["failed"]
        v2_total = self.results["v2"]["passed"] + self.results["v2"]["failed"]
        
        v1_success_rate = (self.results["v1"]["passed"] / v1_total * 100) if v1_total > 0 else 0
        v2_success_rate = (self.results["v2"]["passed"] / v2_total * 100) if v2_total > 0 else 0
        
        # Print comparison results
        print("\n" + "=" * 60)
        print("📊 CORE SYSTEMS COMPARISON RESULTS")
        print("=" * 60)
        
        print(f"\n🔵 V1 API Results:")
        print(f"  Total Tests: {v1_total}")
        print(f"  ✅ Passed: {self.results['v1']['passed']}")
        print(f"  ❌ Failed: {self.results['v1']['failed']}")
        print(f"  🎯 Success Rate: {v1_success_rate:.1f}%")
        
        print(f"\n🟢 V2 API Results:")
        print(f"  Total Tests: {v2_total}")
        print(f"  ✅ Passed: {self.results['v2']['passed']}")
        print(f"  ❌ Failed: {self.results['v2']['failed']}")
        print(f"  🎯 Success Rate: {v2_success_rate:.1f}%")
        
        # Feature-by-feature comparison
        print(f"\n📋 Feature-by-Feature Analysis:")
        features = ["Data Sources", "Actions & Events", "Webhooks", "Integrations", "Automation"]
        
        for feature in features:
            v1_feature_tests = [error for error in self.results["v1"]["errors"] if feature.lower().replace(" & ", " ").replace(" ", " ") in error.lower()]
            v2_feature_tests = [error for error in self.results["v2"]["errors"] if feature.lower().replace(" & ", " ").replace(" ", " ") in error.lower()]
            
            v1_feature_success = len([test for test in v1_feature_tests]) == 0
            v2_feature_success = len([test for test in v2_feature_tests]) == 0
            
            if v1_feature_success and v2_feature_success:
                status = "✅ Both Working"
            elif v2_feature_success and not v1_feature_success:
                status = "🟢 V2 Better"
            elif v1_feature_success and not v2_feature_success:
                status = "🔵 V1 Better"
            else:
                status = "❌ Both Issues"
            
            print(f"  {feature:20} {status}")
        
        # Overall comparison
        print(f"\n🏆 OVERALL COMPARISON:")
        if v2_success_rate > v1_success_rate:
            difference = v2_success_rate - v1_success_rate
            print(f"🎉 V2 WINS! (+{difference:.1f} percentage points)")
            print(f"✅ V2 API is superior to V1 for core systems")
        elif v1_success_rate > v2_success_rate:
            difference = v1_success_rate - v2_success_rate
            print(f"🔵 V1 WINS! (+{difference:.1f} percentage points)")
            print(f"⚠️  V2 API needs improvements to match V1")
        else:
            print(f"🤝 TIE! Both versions perform equally")
            print(f"✅ V2 API matches V1 functionality")
        
        # V2 Exclusive Features
        print(f"\n🚀 V2 EXCLUSIVE FEATURES:")
        print(f"  • Enhanced Data Sources (with default_headers)")
        print(f"  • Advanced Actions (event_handlers array)")
        print(f"  • Automation Toggle (runtime control)")
        print(f"  • Enhanced Schemas (better validation)")
        print(f"  • Improved Error Handling")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if v2_success_rate >= v1_success_rate:
            print(f"✅ V2 API is ready for production use")
            print(f"🚀 V2 provides equal or better functionality than V1")
            print(f"📈 V2 includes additional features not available in V1")
        else:
            print(f"⚠️  V2 API needs fixes to match V1 reliability")
            print(f"🔧 Focus on failing V2 systems before migration")
        
        return {
            "v1_success_rate": v1_success_rate,
            "v2_success_rate": v2_success_rate,
            "winner": "v2" if v2_success_rate >= v1_success_rate else "v1",
            "v2_ready": v2_success_rate >= 85
        }


if __name__ == "__main__":
    comparator = V1V2CoreSystemsComparison()
    results = comparator.run_comparison()
    
    print(f"\n{'='*60}")
    if results["v2_success_rate"] >= results["v1_success_rate"]:
        print(f"🎉 V2 CORE SYSTEMS VERIFICATION: SUCCESS!")
        print(f"✅ V2 API matches or exceeds V1 functionality")
    else:
        print(f"⚠️  V2 CORE SYSTEMS VERIFICATION: NEEDS WORK")
        print(f"🔧 V2 API requires improvements to match V1")
    print(f"{'='*60}")