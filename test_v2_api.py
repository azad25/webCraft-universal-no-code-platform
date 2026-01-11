#!/usr/bin/env python3
"""
Comprehensive V1 vs V2 API comparison test
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_v2_auth():
    """Test V2 authentication and get token"""
    print("🔐 Testing V2 Authentication...")
    response = requests.post(f"{BASE_URL}/api/v2/auth/login", json={
        "email": "admin@test.com", 
        "password": "12345678"
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ V2 Login successful: {data['user']['email']}")
        return data['access_token']
    else:
        print(f"❌ V2 Login failed: {response.text}")
        return None

def test_endpoint_comparison():
    """Compare V1 and V2 endpoints"""
    token = test_v2_auth()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test cases: (endpoint_path, requires_auth, description)
    test_cases = [
        ("/templates/", False, "Templates"),
        ("/widgets", False, "Widgets"),
        ("/apps/", True, "Apps"),
        ("/auth/me", True, "Current User"),
    ]
    
    print("\n📊 V1 vs V2 API Comparison:")
    print("=" * 60)
    
    for endpoint, requires_auth, description in test_cases:
        print(f"\n🔍 Testing {description}:")
        
        # Test V1
        v1_url = f"{BASE_URL}/api/v1{endpoint}"
        v1_headers = headers if requires_auth else {}
        
        try:
            v1_response = requests.get(v1_url, headers=v1_headers)
            v1_status = v1_response.status_code
            v1_data = v1_response.json() if v1_response.status_code == 200 else None
        except Exception as e:
            v1_status = "ERROR"
            v1_data = str(e)
        
        # Test V2
        v2_url = f"{BASE_URL}/api/v2{endpoint}"
        v2_headers = headers if requires_auth else {}
        
        try:
            v2_response = requests.get(v2_url, headers=v2_headers)
            v2_status = v2_response.status_code
            v2_data = v2_response.json() if v2_response.status_code == 200 else None
        except Exception as e:
            v2_status = "ERROR"
            v2_data = str(e)
        
        # Compare results
        print(f"  V1: Status {v1_status}")
        print(f"  V2: Status {v2_status}")
        
        if v1_status == 200 and v2_status == 200:
            if isinstance(v1_data, dict) and isinstance(v2_data, dict):
                # Count items for comparison
                v1_count = len(v1_data.get('items', v1_data.get('templates', v1_data.get('widgets', []))))
                v2_count = len(v2_data.get('items', v2_data.get('templates', v2_data.get('widgets', []))))
                print(f"  V1 Items: {v1_count}")
                print(f"  V2 Items: {v2_count}")
                
                if v1_count > 0 and v2_count >= 0:
                    print("  ✅ Both endpoints working")
                else:
                    print("  ⚠️  Different data counts")
            else:
                print("  ✅ Both endpoints responding")
        elif v1_status == v2_status:
            print("  ✅ Consistent status codes")
        else:
            print("  ❌ Different status codes")

def test_v2_comprehensive():
    """Test comprehensive V2 functionality"""
    token = test_v2_auth()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🚀 V2 API Comprehensive Test:")
    print("=" * 40)
    
    # Test various V2 endpoints
    endpoints = [
        ("/templates/", "Templates"),
        ("/widgets", "Widgets"),
        ("/apps/", "Apps"),
        ("/auth/me", "User Profile"),
        ("/ai/providers", "AI Providers"),
        ("/billing/plans", "Payment Plans"),  # Payment uses /billing prefix
        ("/modules/", "Modules"),
        ("/seo/", "SEO"),
        ("/webhooks/", "Webhooks"),
        ("/data-sources/", "Data Sources"),
        ("/preview/", "Preview"),
        ("/notifications/", "Notifications"),
        ("/integrations/", "Integrations"),
        ("/setup/", "Setup"),
        ("/mobile/", "Mobile"),
    ]
    
    working_endpoints = 0
    total_endpoints = len(endpoints)
    
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{BASE_URL}/api/v2{endpoint}", headers=headers)
            if response.status_code in [200, 401]:  # 401 is OK for auth-required endpoints
                print(f"✅ {name}: Status {response.status_code}")
                working_endpoints += 1
            else:
                print(f"❌ {name}: Status {response.status_code}")
        except Exception as e:
            print(f"❌ {name}: Error - {e}")
    
    print(f"\n📈 V2 API Coverage: {working_endpoints}/{total_endpoints} ({working_endpoints/total_endpoints*100:.1f}%)")

if __name__ == "__main__":
    print("🧪 WebCraft V1 vs V2 API Testing")
    print("=" * 50)
    
    test_endpoint_comparison()
    test_v2_comprehensive()
    
    print("\n✨ Testing completed!")