#!/usr/bin/env python3
"""
Test script to verify user separation in development mode
"""

import requests
import json

API_BASE = "http://localhost:8000"

def test_user_separation():
    """Test that different dev users see different apps"""
    
    # Test with two different dev users
    users = [
        {"id": "alice", "token": "dev-bypass-token-alice"},
        {"id": "bob", "token": "dev-bypass-token-bob"}
    ]
    
    print("🧪 Testing user separation in development mode...")
    print("=" * 50)
    
    for user in users:
        print(f"\n👤 Testing user: {user['id']}")
        print("-" * 30)
        
        headers = {
            "Authorization": f"Bearer {user['token']}",
            "Content-Type": "application/json"
        }
        
        # Create an app for this user
        app_data = {
            "name": f"{user['id'].title()}'s Test App",
            "description": f"Test app created by {user['id']}",
            "app_type": "website"
        }
        
        try:
            # Create app
            create_response = requests.post(
                f"{API_BASE}/api/apps",
                headers=headers,
                json=app_data
            )
            
            if create_response.status_code == 200:
                app = create_response.json()
                print(f"✅ Created app: {app['name']} (ID: {app['id']})")
            else:
                print(f"❌ Failed to create app: {create_response.status_code}")
                print(f"   Response: {create_response.text}")
                continue
            
            # List apps for this user
            list_response = requests.get(
                f"{API_BASE}/api/apps",
                headers=headers
            )
            
            if list_response.status_code == 200:
                apps_data = list_response.json()
                apps = apps_data.get('apps', [])
                print(f"📱 User {user['id']} has {len(apps)} app(s):")
                for app in apps:
                    print(f"   - {app['name']} (ID: {app['id']})")
            else:
                print(f"❌ Failed to list apps: {list_response.status_code}")
                print(f"   Response: {list_response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Could not connect to API server. Make sure it's running on localhost:8000")
            return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    print("\n" + "=" * 50)
    print("✅ Test completed! Check that each user has different apps.")
    print("💡 If users see the same apps, the fix didn't work.")
    return True

if __name__ == "__main__":
    test_user_separation()