#!/usr/bin/env python3
"""
Create a test app for admin@test.com user
"""

import requests
import json

def create_test_app():
    """Create a test app using the API"""
    
    # API endpoint
    base_url = "http://192.168.0.109:8000"  # Updated to match our setup
    
    # Test app data
    app_data = {
        "name": "Test App",
        "description": "A test application for development",
        "app_type": "website",
        "config": {
            "theme": "modern",
            "layout": "responsive"
        },
        "theme_config": {
            "primaryColor": "#3b82f6",
            "fontFamily": "Inter"
        }
    }
    
    # Headers with admin token
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer admin-test-token"
    }
    
    try:
        # Create the app
        response = requests.post(
            f"{base_url}/api/v1/apps",
            json=app_data,
            headers=headers
        )
        
        if response.status_code == 200 or response.status_code == 201:
            app = response.json()
            print(f"✅ Created test app:")
            print(f"   ID: {app['id']}")
            print(f"   Name: {app['name']}")
            print(f"   Type: {app['app_type']}")
            print(f"   Slug: {app['slug']}")
            return app
        else:
            print(f"❌ Failed to create app: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API server. Make sure it's running on http://localhost:8000")
        return None
    except Exception as e:
        print(f"❌ Error creating app: {e}")
        return None

def list_apps():
    """List all apps for admin@test.com user"""
    
    base_url = "http://192.168.0.109:8000"
    headers = {
        "Authorization": "Bearer admin-test-token"
    }
    
    try:
        response = requests.get(f"{base_url}/api/v1/apps", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            apps = data.get('apps', [])
            print(f"📱 Found {len(apps)} apps for admin@test.com:")
            for app in apps:
                print(f"   - {app['name']} (ID: {app['id']}, Type: {app['app_type']})")
            return apps
        else:
            print(f"❌ Failed to list apps: {response.status_code}")
            print(f"   Response: {response.text}")
            return []
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API server. Make sure it's running on http://localhost:8000")
        return []
    except Exception as e:
        print(f"❌ Error listing apps: {e}")
        return []

if __name__ == "__main__":
    print("🔧 Testing app creation for admin@test.com...")
    
    # First, list existing apps
    existing_apps = list_apps()
    
    # Create a test app if none exist
    if not existing_apps:
        print("\n🆕 Creating a test app...")
        create_test_app()
    else:
        print(f"\n✅ User already has {len(existing_apps)} apps")