#!/usr/bin/env python3
"""
Comprehensive V2 API Testing Script
Tests all major V2 API endpoints and compares with V1 functionality
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# API Configuration
BASE_URL = "http://localhost:8000"
V1_BASE = f"{BASE_URL}/api/v1"
V2_BASE = f"{BASE_URL}/api/v2"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.v1_token = None
        self.v2_token = None
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
    
    def test_health_endpoints(self):
        """Test health check endpoints"""
        print("\n=== Testing Health Endpoints ===")
        
        # Test main health endpoint
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                v1_available = data.get("api_versions", {}).get("v1") == "available"
                v2_available = data.get("api_versions", {}).get("v2") == "available"
                
                self.log_result("v1", "/health (v1 status)", v1_available)
                self.log_result("v2", "/health (v2 status)", v2_available)
                
                print(f"  Services: {data.get('services', {})}")
                print(f"  API Versions: {data.get('api_versions', {})}")
            else:
                self.log_result("v1", "/health", False, f"Status {response.status_code}")
                self.log_result("v2", "/health", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v1", "/health", False, str(e))
            self.log_result("v2", "/health", False, str(e))
    
    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n=== Testing Authentication Endpoints ===")
        
        # Test user registration
        test_user = {
            "email": f"test_{int(time.time())}@example.com",
            "username": f"testuser_{int(time.time())}",
            "password": "testpassword123",
            "full_name": "Test User",
            "terms_accepted": True
        }
        
        # Test V1 Auth
        try:
            # Register
            response = self.session.post(f"{V1_BASE}/auth/register", json=test_user)
            if response.status_code in [200, 201]:
                self.log_result("v1", "/auth/register", True)
                
                # Login
                login_data = {"email": test_user["email"], "password": test_user["password"]}
                response = self.session.post(f"{V1_BASE}/auth/login", json=login_data)
                if response.status_code == 200:
                    self.v1_token = response.json().get("access_token")
                    self.log_result("v1", "/auth/login", True)
                    
                    # Test /me endpoint
                    headers = {"Authorization": f"Bearer {self.v1_token}"}
                    response = self.session.get(f"{V1_BASE}/auth/me", headers=headers)
                    self.log_result("v1", "/auth/me", response.status_code == 200)
                else:
                    self.log_result("v1", "/auth/login", False, f"Status {response.status_code}")
            else:
                self.log_result("v1", "/auth/register", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v1", "/auth/*", False, str(e))
        
        # Test V2 Auth
        try:
            # Register
            response = self.session.post(f"{V2_BASE}/auth/register", json=test_user)
            if response.status_code in [200, 201]:
                self.log_result("v2", "/auth/register", True)
                
                # Login
                login_data = {"email": test_user["email"], "password": test_user["password"]}
                response = self.session.post(f"{V2_BASE}/auth/login", json=login_data)
                if response.status_code == 200:
                    self.v2_token = response.json().get("access_token")
                    self.log_result("v2", "/auth/login", True)
                    
                    # Test /me endpoint
                    headers = {"Authorization": f"Bearer {self.v2_token}"}
                    response = self.session.get(f"{V2_BASE}/auth/me", headers=headers)
                    self.log_result("v2", "/auth/me", response.status_code == 200)
                else:
                    self.log_result("v2", "/auth/login", False, f"Status {response.status_code}")
            else:
                self.log_result("v2", "/auth/register", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v2", "/auth/*", False, str(e))
    
    def test_apps_endpoints(self):
        """Test apps management endpoints"""
        print("\n=== Testing Apps Endpoints ===")
        
        if not self.v1_token or not self.v2_token:
            print("Skipping apps tests - authentication failed")
            return
        
        app_data = {
            "name": f"Test App {int(time.time())}",
            "description": "Test application",
            "app_type": "website",
            "template_id": None
        }
        
        # Test V1 Apps
        try:
            headers = {"Authorization": f"Bearer {self.v1_token}"}
            
            # List apps
            response = self.session.get(f"{V1_BASE}/apps/", headers=headers)
            self.log_result("v1", "/apps/ (list)", response.status_code == 200)
            
            # Create app
            response = self.session.post(f"{V1_BASE}/apps/", json=app_data, headers=headers)
            if response.status_code in [200, 201]:
                app_id = response.json().get("id")
                self.log_result("v1", "/apps/ (create)", True)
                
                # Get app
                response = self.session.get(f"{V1_BASE}/apps/{app_id}", headers=headers)
                self.log_result("v1", f"/apps/{app_id} (get)", response.status_code == 200)
                
                # Update app
                update_data = {"name": f"Updated {app_data['name']}"}
                response = self.session.put(f"{V1_BASE}/apps/{app_id}", json=update_data, headers=headers)
                self.log_result("v1", f"/apps/{app_id} (update)", response.status_code == 200)
            else:
                self.log_result("v1", "/apps/ (create)", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v1", "/apps/*", False, str(e))
        
        # Test V2 Apps
        try:
            headers = {"Authorization": f"Bearer {self.v2_token}"}
            
            # List apps
            response = self.session.get(f"{V2_BASE}/apps/", headers=headers)
            self.log_result("v2", "/apps/ (list)", response.status_code == 200)
            
            # Create app
            response = self.session.post(f"{V2_BASE}/apps/", json=app_data, headers=headers)
            if response.status_code in [200, 201]:
                app_id = response.json().get("id")
                self.log_result("v2", "/apps/ (create)", True)
                
                # Get app
                response = self.session.get(f"{V2_BASE}/apps/{app_id}", headers=headers)
                self.log_result("v2", f"/apps/{app_id} (get)", response.status_code == 200)
                
                # Update app
                update_data = {"name": f"Updated {app_data['name']}"}
                response = self.session.put(f"{V2_BASE}/apps/{app_id}", json=update_data, headers=headers)
                self.log_result("v2", f"/apps/{app_id} (update)", response.status_code == 200)
            else:
                self.log_result("v2", "/apps/ (create)", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("v2", "/apps/*", False, str(e))
    
    def test_templates_endpoints(self):
        """Test templates endpoints"""
        print("\n=== Testing Templates Endpoints ===")
        
        # Test V1 Templates
        try:
            response = self.session.get(f"{V1_BASE}/templates/")
            self.log_result("v1", "/templates/ (list)", response.status_code == 200)
            
            if response.status_code == 200:
                templates = response.json()
                if templates and len(templates) > 0:
                    template_id = templates[0].get("id")
                    response = self.session.get(f"{V1_BASE}/templates/{template_id}")
                    self.log_result("v1", f"/templates/{template_id} (get)", response.status_code == 200)
        except Exception as e:
            self.log_result("v1", "/templates/*", False, str(e))
        
        # Test V2 Templates
        try:
            response = self.session.get(f"{V2_BASE}/templates/")
            self.log_result("v2", "/templates/ (list)", response.status_code == 200)
            
            if response.status_code == 200:
                templates = response.json()
                if templates and len(templates) > 0:
                    template_id = templates[0].get("id")
                    response = self.session.get(f"{V2_BASE}/templates/{template_id}")
                    self.log_result("v2", f"/templates/{template_id} (get)", response.status_code == 200)
        except Exception as e:
            self.log_result("v2", "/templates/*", False, str(e))
    
    def test_ai_endpoints(self):
        """Test AI endpoints"""
        print("\n=== Testing AI Endpoints ===")
        
        # Test V1 AI
        try:
            if self.v1_token:
                headers = {"Authorization": f"Bearer {self.v1_token}"}
                response = self.session.get(f"{V1_BASE}/ai/providers", headers=headers)
                self.log_result("v1", "/ai/providers", response.status_code == 200)
                
                # Test content generation
                content_data = {"prompt": "Generate a welcome message", "content_type": "text"}
                response = self.session.post(f"{V1_BASE}/ai/generate-content", json=content_data, headers=headers)
                self.log_result("v1", "/ai/generate-content", response.status_code in [200, 201])
            else:
                self.log_result("v1", "/ai/providers", False, "No auth token")
                self.log_result("v1", "/ai/generate-content", False, "No auth token")
        except Exception as e:
            self.log_result("v1", "/ai/*", False, str(e))
        
        # Test V2 AI
        try:
            if self.v2_token:
                headers = {"Authorization": f"Bearer {self.v2_token}"}
                response = self.session.get(f"{V2_BASE}/ai/providers", headers=headers)
                self.log_result("v2", "/ai/providers", response.status_code == 200)
                
                # Test content generation
                content_data = {"prompt": "Generate a welcome message", "content_type": "text"}
                response = self.session.post(f"{V2_BASE}/ai/generate-content", json=content_data, headers=headers)
                self.log_result("v2", "/ai/generate-content", response.status_code in [200, 201])
            else:
                self.log_result("v2", "/ai/providers", False, "No auth token")
                self.log_result("v2", "/ai/generate-content", False, "No auth token")
        except Exception as e:
            self.log_result("v2", "/ai/*", False, str(e))
    
    def test_integrations_endpoints(self):
        """Test integrations endpoints"""
        print("\n=== Testing Integrations Endpoints ===")
        
        # Test V1 Integrations
        try:
            if self.v1_token:
                headers = {"Authorization": f"Bearer {self.v1_token}"}
                response = self.session.get(f"{V1_BASE}/integrations/available", headers=headers)
                self.log_result("v1", "/integrations/available", response.status_code == 200)
            else:
                self.log_result("v1", "/integrations/available", False, "No auth token")
        except Exception as e:
            self.log_result("v1", "/integrations/*", False, str(e))
        
        # Test V2 Integrations
        try:
            if self.v2_token:
                headers = {"Authorization": f"Bearer {self.v2_token}"}
                response = self.session.get(f"{V2_BASE}/integrations/available", headers=headers)
                self.log_result("v2", "/integrations/available", response.status_code == 200)
            else:
                self.log_result("v2", "/integrations/available", False, "No auth token")
        except Exception as e:
            self.log_result("v2", "/integrations/*", False, str(e))
    
    def compare_endpoint_coverage(self):
        """Compare endpoint coverage between V1 and V2"""
        print("\n=== Comparing Endpoint Coverage ===")
        
        try:
            # Get V1 endpoints
            v1_response = self.session.get(f"{BASE_URL}/openapi.json")
            v1_paths = set(v1_response.json()["paths"].keys()) if v1_response.status_code == 200 else set()
            
            # Get V2 endpoints
            v2_response = self.session.get(f"{V2_BASE}/openapi.json")
            v2_paths = set(v2_response.json()["paths"].keys()) if v2_response.status_code == 200 else set()
            
            print(f"V1 Endpoints: {len(v1_paths)}")
            print(f"V2 Endpoints: {len(v2_paths)}")
            
            # Find V1 endpoints that might be missing in V2
            v1_api_paths = {path.replace("/api/v1", "") for path in v1_paths if path.startswith("/api/v1")}
            missing_in_v2 = v1_api_paths - v2_paths
            
            if missing_in_v2:
                print(f"\nEndpoints in V1 but not in V2 ({len(missing_in_v2)}):")
                for path in sorted(missing_in_v2)[:10]:  # Show first 10
                    print(f"  - {path}")
                if len(missing_in_v2) > 10:
                    print(f"  ... and {len(missing_in_v2) - 10} more")
            
            # Find V2-only endpoints
            v2_only = v2_paths - v1_api_paths
            if v2_only:
                print(f"\nNew endpoints in V2 ({len(v2_only)}):")
                for path in sorted(v2_only)[:10]:  # Show first 10
                    print(f"  + {path}")
                if len(v2_only) > 10:
                    print(f"  ... and {len(v2_only) - 10} more")
            
        except Exception as e:
            print(f"Error comparing endpoints: {e}")
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Comprehensive V2 API Testing")
        print("=" * 50)
        
        self.test_health_endpoints()
        self.test_auth_endpoints()
        self.test_apps_endpoints()
        self.test_templates_endpoints()
        self.test_ai_endpoints()
        self.test_integrations_endpoints()
        self.compare_endpoint_coverage()
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        for version in ["v1", "v2"]:
            results = self.test_results[version]
            total = results["passed"] + results["failed"]
            success_rate = (results["passed"] / total * 100) if total > 0 else 0
            
            print(f"\n{version.upper()} API Results:")
            print(f"  ✓ Passed: {results['passed']}")
            print(f"  ✗ Failed: {results['failed']}")
            print(f"  📈 Success Rate: {success_rate:.1f}%")
            
            if results["errors"]:
                print(f"  🔍 Errors:")
                for error in results["errors"][:5]:  # Show first 5 errors
                    print(f"    - {error}")
                if len(results["errors"]) > 5:
                    print(f"    ... and {len(results['errors']) - 5} more")
        
        # Overall assessment
        v1_success = self.test_results["v1"]["passed"] / (self.test_results["v1"]["passed"] + self.test_results["v1"]["failed"]) * 100 if (self.test_results["v1"]["passed"] + self.test_results["v1"]["failed"]) > 0 else 0
        v2_success = self.test_results["v2"]["passed"] / (self.test_results["v2"]["passed"] + self.test_results["v2"]["failed"]) * 100 if (self.test_results["v2"]["passed"] + self.test_results["v2"]["failed"]) > 0 else 0
        
        print(f"\n🎯 OVERALL ASSESSMENT:")
        if v2_success >= v1_success and v2_success > 80:
            print("✅ V2 API is working well and ready for use!")
        elif v2_success >= 60:
            print("⚠️  V2 API is functional but needs some fixes")
        else:
            print("❌ V2 API needs significant work before it's ready")
        
        print(f"\n🔗 Access the APIs:")
        print(f"  V1 Docs: {BASE_URL}/docs")
        print(f"  V2 Docs: {BASE_URL}/api/v2/docs")


if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()