#!/usr/bin/env python3
"""
Debug V2 Remaining Issues
Focused debugging for automations, integrations, and actions counting
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# API Configuration
BASE_URL = "http://localhost:8000"
V2_BASE = f"{BASE_URL}/api/v2"

class V2IssuesDebugger:
    def __init__(self):
        self.session = requests.Session()
        self.v2_token = None
        self.test_app_id = None
        self.results = {"passed": 0, "failed": 0, "errors": [], "details": {}}
    
    def log_result(self, test_name: str, success: bool, error: str = None, details: str = None):
        """Log test result"""
        if success:
            self.results["passed"] += 1
            self.results["details"][test_name] = {"status": "✅ PASS", "details": details}
            print(f"✅ {test_name}")
            if details:
                print(f"   └─ {details}")
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {error}")
            self.results["details"][test_name] = {"status": "❌ FAIL", "error": error}
            print(f"❌ {test_name} - {error}")
    
    def setup_debug_session(self):
        """Setup debugging session"""
        print("🔧 Setting up Debug Session")
        
        test_user = {
            "email": f"debug_test_{int(time.time())}@example.com",
            "username": f"debug_test_{int(time.time())}",
            "password": "testpassword123",
            "full_name": "Debug Test User",
            "terms_accepted": True
        }
        
        try:
            # Register and login
            response = self.session.post(f"{V2_BASE}/auth/register", json=test_user)
            if response.status_code in [200, 201]:
                login_data = {"email": test_user["email"], "password": test_user["password"]}
                response = self.session.post(f"{V2_BASE}/auth/login", json=login_data)
                if response.status_code == 200:
                    self.v2_token = response.json().get("access_token")
                    
                    # Create test app
                    app_data = {
                        "name": f"Debug Test App {int(time.time())}",
                        "description": "App for debugging V2 issues",
                        "app_type": "website"
                    }
                    headers = {"Authorization": f"Bearer {self.v2_token}"}
                    response = self.session.post(f"{V2_BASE}/apps/", json=app_data, headers=headers)
                    if response.status_code in [200, 201]:
                        self.test_app_id = response.json().get("id")
                        print(f"✅ Debug Setup complete - App ID: {self.test_app_id}")
                        return True
        except Exception as e:
            print(f"❌ Debug Setup failed: {e}")
        
        return False
    
    def debug_actions_system(self):
        """Debug Actions system in detail"""
        print("\n⚡ Debugging Actions System")
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        
        try:
            # Test 1: Create Action with detailed logging
            action_data = {
                "name": "Debug Test Action",
                "description": "Action for debugging",
                "event_handlers": [
                    {
                        "event_type": "click",
                        "element_selector": "#debug-button",
                        "actions": [
                            {
                                "type": "webhook_call",
                                "config": {
                                    "url": "https://httpbin.org/post",
                                    "method": "POST"
                                }
                            }
                        ]
                    }
                ],
                "is_active": True
            }
            
            print(f"   📤 Creating action with data: {json.dumps(action_data, indent=2)}")
            response = self.session.post(f"{V2_BASE}/actions/apps/{self.test_app_id}", json=action_data, headers=headers)
            
            if response.status_code in [200, 201]:
                action = response.json()
                self.log_result("Actions Debug - Create", True, None, f"Action ID: {action.get('id')}")
                
                # Test 2: List Actions
                list_response = self.session.get(f"{V2_BASE}/actions/apps/{self.test_app_id}", headers=headers)
                if list_response.status_code == 200:
                    actions = list_response.json()
                    self.log_result("Actions Debug - List", True, None, f"Found {len(actions)} actions")
                    
                    # Test 3: Get specific action
                    action_id = action.get('id')
                    if action_id:
                        get_response = self.session.get(f"{V2_BASE}/actions/apps/{self.test_app_id}/{action_id}", headers=headers)
                        self.log_result("Actions Debug - Get", get_response.status_code == 200, f"Status {get_response.status_code}")
                        
                        # Test 4: Update action
                        update_data = {"description": "Updated debug action"}
                        update_response = self.session.put(f"{V2_BASE}/actions/apps/{self.test_app_id}/{action_id}", json=update_data, headers=headers)
                        self.log_result("Actions Debug - Update", update_response.status_code in [200, 201], f"Status {update_response.status_code}")
                        
                        # Test 5: Execute action
                        execute_data = {"action_id": action_id, "event_data": {"test": True}}
                        execute_response = self.session.post(f"{V2_BASE}/actions/apps/{self.test_app_id}/{action_id}/execute", json=execute_data, headers=headers)
                        self.log_result("Actions Debug - Execute", execute_response.status_code in [200, 201, 404], f"Status {execute_response.status_code}")
                else:
                    self.log_result("Actions Debug - List", False, f"Status {list_response.status_code}")
            else:
                self.log_result("Actions Debug - Create", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Actions Debug - System", False, str(e))
    
    def debug_automation_system(self):
        """Debug Automation system in detail"""
        print("\n🤖 Debugging Automation System")
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        
        try:
            # Test 1: Simple automation creation
            simple_automation = {
                "name": "Debug Simple Automation",
                "description": "Simple automation for debugging",
                "trigger_type": "user_signup",
                "trigger_config": {},
                "workflow_steps": [
                    {
                        "id": "step_1",
                        "type": "action",
                        "action_type": "send_email",
                        "config": {
                            "to": "test@example.com",
                            "subject": "Debug Test"
                        },
                        "next_steps": [],
                        "position": {"x": 100, "y": 100}
                    }
                ],
                "is_enabled": True
            }
            
            print(f"   📤 Creating simple automation: {json.dumps(simple_automation, indent=2)}")
            response = self.session.post(f"{V2_BASE}/apps/{self.test_app_id}/automations", json=simple_automation, headers=headers)
            
            if response.status_code in [200, 201]:
                automation = response.json()
                self.log_result("Automation Debug - Create Simple", True, None, f"Automation ID: {automation.get('id')}")
                
                # Test toggle
                auto_id = automation.get('id')
                if auto_id:
                    toggle_response = self.session.post(f"{V2_BASE}/apps/{self.test_app_id}/automations/{auto_id}/toggle", 
                                                      headers=headers, params={"enabled": False})
                    self.log_result("Automation Debug - Toggle", toggle_response.status_code in [200, 201], f"Status {toggle_response.status_code}")
            else:
                print(f"   📥 Response: {response.status_code} - {response.text}")
                self.log_result("Automation Debug - Create Simple", False, f"Status {response.status_code}: {response.text}")
            
            # Test 2: List automations
            list_response = self.session.get(f"{V2_BASE}/apps/{self.test_app_id}/automations", headers=headers)
            if list_response.status_code == 200:
                automations = list_response.json()
                self.log_result("Automation Debug - List", True, None, f"Found {len(automations)} automations")
            else:
                self.log_result("Automation Debug - List", False, f"Status {list_response.status_code}")
                
        except Exception as e:
            self.log_result("Automation Debug - System", False, str(e))
    
    def debug_integrations_system(self):
        """Debug Integrations system in detail"""
        print("\n🔌 Debugging Integrations System")
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        
        try:
            # Test 1: Available integrations
            available_response = self.session.get(f"{V2_BASE}/integrations/available", headers=headers)
            if available_response.status_code == 200:
                available = available_response.json()
                self.log_result("Integrations Debug - Available", True, None, f"Found {len(available)} integrations")
                if available:
                    sample_names = [i.get('name', 'Unknown') for i in available[:3] if isinstance(i, dict)]
                    print(f"   📋 Available integrations: {sample_names}")
            else:
                self.log_result("Integrations Debug - Available", False, f"Status {available_response.status_code}")
            
            # Test 2: Categories
            categories_response = self.session.get(f"{V2_BASE}/integrations/categories", headers=headers)
            self.log_result("Integrations Debug - Categories", categories_response.status_code == 200, f"Status {categories_response.status_code}")
            
            # Test 3: App integrations (the problematic one)
            print(f"   📤 Testing app integrations endpoint: /integrations/apps/{self.test_app_id}/integrations")
            app_integrations_response = self.session.get(f"{V2_BASE}/integrations/apps/{self.test_app_id}/integrations", headers=headers)
            
            if app_integrations_response.status_code == 200:
                app_integrations = app_integrations_response.json()
                self.log_result("Integrations Debug - App List", True, None, f"Found {len(app_integrations)} app integrations")
            else:
                print(f"   📥 Response: {app_integrations_response.status_code} - {app_integrations_response.text}")
                self.log_result("Integrations Debug - App List", False, f"Status {app_integrations_response.status_code}: {app_integrations_response.text}")
            
            # Test 4: Try to connect an integration (if available)
            if available_response.status_code == 200:
                available = available_response.json()
                if available and len(available) > 0:
                    first_integration = available[0]
                    integration_id = first_integration.get("id")
                    if integration_id:
                        connect_data = {
                            "integration_id": integration_id,
                            "config": {"api_key": "test_key", "enabled": True}
                        }
                        print(f"   📤 Testing integration connection: {json.dumps(connect_data, indent=2)}")
                        connect_response = self.session.post(f"{V2_BASE}/integrations/apps/{self.test_app_id}/integrations/connect", 
                                                           json=connect_data, headers=headers)
                        self.log_result("Integrations Debug - Connect", connect_response.status_code in [200, 201, 400, 422], 
                                      f"Status {connect_response.status_code}")
                        
                        if connect_response.status_code not in [200, 201]:
                            print(f"   📥 Connect Response: {connect_response.text}")
                
        except Exception as e:
            self.log_result("Integrations Debug - System", False, str(e))
    
    def debug_publishing_system(self):
        """Debug Publishing system"""
        print("\n📤 Debugging Publishing System")
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        
        try:
            # Test app publishing
            print(f"   📤 Testing app publishing: /apps/{self.test_app_id}/publish")
            publish_data = {
                "custom_domain": None,
                "subdomain": None
            }
            publish_response = self.session.post(f"{V2_BASE}/apps/{self.test_app_id}/publish", json=publish_data, headers=headers)
            
            if publish_response.status_code in [200, 201]:
                self.log_result("Publishing Debug - Publish App", True, None, "App published successfully")
            else:
                print(f"   📥 Publish Response: {publish_response.status_code} - {publish_response.text}")
                self.log_result("Publishing Debug - Publish App", False, f"Status {publish_response.status_code}: {publish_response.text}")
            
            # Test app export - check if it should be POST instead of GET
            print(f"   📤 Testing app export: /apps/{self.test_app_id}/export/static")
            export_response = self.session.post(f"{V2_BASE}/apps/{self.test_app_id}/export/static", headers=headers)
            
            if export_response.status_code == 200:
                self.log_result("Publishing Debug - Export App", True, None, "App export successful")
            else:
                # Try GET method if POST fails
                export_response_get = self.session.get(f"{V2_BASE}/apps/{self.test_app_id}/export/static", headers=headers)
                if export_response_get.status_code == 200:
                    self.log_result("Publishing Debug - Export App", True, None, "App export successful (GET)")
                else:
                    print(f"   📥 Export Response (POST): {export_response.status_code} - {export_response.text}")
                    print(f"   📥 Export Response (GET): {export_response_get.status_code} - {export_response_get.text}")
                    self.log_result("Publishing Debug - Export App", False, f"Status POST:{export_response.status_code} GET:{export_response_get.status_code}")
                
        except Exception as e:
            self.log_result("Publishing Debug - System", False, str(e))
    
    def run_debug_session(self):
        """Run the complete debugging session"""
        print("🔍 V2 REMAINING ISSUES DEBUG SESSION")
        print("=" * 60)
        
        if not self.setup_debug_session():
            print("❌ Debug setup failed. Cannot proceed.")
            return {"success_rate": 0, "issues_found": []}
        
        # Debug all problematic systems
        self.debug_actions_system()
        self.debug_automation_system()
        self.debug_integrations_system()
        self.debug_publishing_system()
        
        # Calculate results
        total = self.results["passed"] + self.results["failed"]
        success_rate = (self.results["passed"] / total * 100) if total > 0 else 0
        
        # Analyze issues
        issues_found = []
        for error in self.results["errors"]:
            if "500" in error:
                issues_found.append("Server Error (500) - Internal service issue")
            elif "422" in error:
                issues_found.append("Schema Error (422) - Request validation issue")
            elif "404" in error:
                issues_found.append("Not Found (404) - Endpoint or resource missing")
            elif "405" in error:
                issues_found.append("Method Not Allowed (405) - HTTP method issue")
        
        # Print debug results
        print("\n" + "=" * 60)
        print("🔍 DEBUG SESSION RESULTS")
        print("=" * 60)
        
        print(f"\n📊 Debug Statistics:")
        print(f"  Total Tests: {total}")
        print(f"  ✅ Passed: {self.results['passed']}")
        print(f"  ❌ Failed: {self.results['failed']}")
        print(f"  🎯 Success Rate: {success_rate:.1f}%")
        
        # Show detailed results
        print(f"\n🔍 Detailed Debug Results:")
        for test_name, details in self.results["details"].items():
            status = details["status"]
            print(f"  {status} {test_name}")
            if details.get("details"):
                print(f"      └─ {details['details']}")
            if details.get("error"):
                print(f"      └─ Error: {details['error']}")
        
        # Show issues found
        if issues_found:
            print(f"\n🚨 Issues Identified:")
            for i, issue in enumerate(set(issues_found), 1):
                print(f"  {i}. {issue}")
        
        # Recommendations
        print(f"\n💡 Debug Recommendations:")
        if any("500" in error for error in self.results["errors"]):
            print(f"  🔧 Check server logs for internal errors")
            print(f"  🔧 Verify database models and relationships")
            print(f"  🔧 Check service dependencies and imports")
        
        if any("422" in error for error in self.results["errors"]):
            print(f"  📝 Review API schemas and validation rules")
            print(f"  📝 Check request/response model compatibility")
            print(f"  📝 Verify required fields and data types")
        
        if any("404" in error or "405" in error for error in self.results["errors"]):
            print(f"  🔗 Check router registration and URL patterns")
            print(f"  🔗 Verify HTTP methods and endpoint paths")
        
        return {
            "success_rate": success_rate,
            "issues_found": list(set(issues_found)),
            "total_tests": total,
            "passed": self.results["passed"],
            "failed": self.results["failed"]
        }


if __name__ == "__main__":
    debugger = V2IssuesDebugger()
    results = debugger.run_debug_session()
    
    print(f"\n{'='*60}")
    print(f"🎯 DEBUG SESSION SUMMARY")
    print(f"{'='*60}")
    print(f"Success Rate: {results['success_rate']:.1f}%")
    print(f"Issues Found: {len(results['issues_found'])}")
    
    if results["success_rate"] >= 90:
        print(f"🎉 EXCELLENT! Most issues resolved!")
    elif results["success_rate"] >= 75:
        print(f"✅ GOOD! Minor issues remain.")
    else:
        print(f"⚠️  NEEDS WORK! Multiple issues to address.")
    print(f"{'='*60}")