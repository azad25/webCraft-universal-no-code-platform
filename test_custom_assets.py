#!/usr/bin/env python3

import requests
import json
import sys

# Test the custom assets API
API_BASE = "http://192.168.0.109:8000/api/v1"
AUTH_TOKEN = "admin-test-token"  # Use the development test token

def test_custom_assets():
    print("🧪 Testing Custom Assets API...")
    
    # Test data - using an existing app ID
    test_app_id = "3c74739c-83ea-454c-8ebe-26821f3886d1"  # Updated Test App
    
    # Test 1: Create HTML asset
    print("\n1. Creating HTML asset...")
    html_asset_data = {
        "name": "Custom Header",
        "type": "html",
        "content": "<div class='custom-header'><h1>Welcome to My App</h1></div>",
        "is_global": False,
        "metadata": {"description": "Custom header component"}
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/apps/{test_app_id}/assets",
            json=html_asset_data,
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            asset = response.json()
            print(f"✅ HTML asset created: {asset['id']}")
            html_asset_id = asset['id']
        else:
            print(f"❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 2: Create CSS asset
    print("\n2. Creating CSS asset...")
    css_asset_data = {
        "name": "Custom Styles",
        "type": "css",
        "content": ".custom-header { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); padding: 2rem; color: white; }",
        "is_global": True,
        "metadata": {"description": "Global styles for the app"}
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/apps/{test_app_id}/assets",
            json=css_asset_data,
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            asset = response.json()
            print(f"✅ CSS asset created: {asset['id']}")
            css_asset_id = asset['id']
        else:
            print(f"❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 3: Create JavaScript asset
    print("\n3. Creating JavaScript asset...")
    js_asset_data = {
        "name": "Interactive Features",
        "type": "js",
        "content": "console.log('Custom JavaScript loaded!'); document.addEventListener('DOMContentLoaded', function() { console.log('DOM ready'); });",
        "is_global": False,
        "metadata": {"description": "Custom JavaScript for interactivity"}
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/apps/{test_app_id}/assets",
            json=js_asset_data,
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            asset = response.json()
            print(f"✅ JavaScript asset created: {asset['id']}")
            js_asset_id = asset['id']
        else:
            print(f"❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 4: Get all assets
    print("\n4. Getting all assets...")
    try:
        response = requests.get(
            f"{API_BASE}/apps/{test_app_id}/assets",
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['total']} assets")
            for asset in data['assets']:
                print(f"  - {asset['name']} ({asset['type']}) - Global: {asset['is_global']}")
        else:
            print(f"❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 5: Update an asset
    print("\n5. Updating HTML asset...")
    update_data = {
        "name": "Updated Custom Header",
        "content": "<div class='custom-header updated'><h1>Welcome to My Updated App</h1><p>Now with more content!</p></div>",
        "metadata": {"description": "Updated custom header component", "version": "1.1"}
    }
    
    try:
        response = requests.put(
            f"{API_BASE}/apps/{test_app_id}/assets/{html_asset_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            asset = response.json()
            print(f"✅ Asset updated: {asset['name']}")
        else:
            print(f"❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 6: Get assets by type
    print("\n6. Getting CSS assets only...")
    try:
        response = requests.get(
            f"{API_BASE}/apps/{test_app_id}/assets?asset_type=css",
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['total']} CSS assets")
            for asset in data['assets']:
                print(f"  - {asset['name']}")
        else:
            print(f"❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 7: Get global assets
    print("\n7. Getting global assets...")
    try:
        response = requests.get(
            f"{API_BASE}/apps/{test_app_id}/assets?is_global=true",
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['total']} global assets")
            for asset in data['assets']:
                print(f"  - {asset['name']} ({asset['type']})")
        else:
            print(f"❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 8: Delete an asset
    print("\n8. Deleting JavaScript asset...")
    try:
        response = requests.delete(
            f"{API_BASE}/apps/{test_app_id}/assets/{js_asset_id}",
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Asset deleted successfully")
        else:
            print(f"❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    print("\n🎉 All custom assets API tests passed!")
    return True

if __name__ == "__main__":
    success = test_custom_assets()
    sys.exit(0 if success else 1)