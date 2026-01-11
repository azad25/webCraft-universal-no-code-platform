#!/usr/bin/env python3
"""
Test Media API Integration
Tests the media manager API endpoints
"""

import requests
import json
import os
from io import BytesIO

# API base URL
BASE_URL = "http://192.168.0.109:8000/api/v1"

def test_media_api():
    """Test media API endpoints"""
    
    print("🧪 Testing Media API Integration...")
    
    # Test app ID (you may need to adjust this)
    app_id = "test-app-123"
    
    try:
        # 1. Test listing media (should return empty initially)
        print("\n1. Testing media list...")
        response = requests.get(f"{BASE_URL}/media/list/{app_id}")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            media_list = response.json()
            print(f"Media count: {len(media_list)}")
            print("✅ Media list endpoint working")
        else:
            print(f"❌ Media list failed: {response.text}")
        
        # 2. Test adding URL media
        print("\n2. Testing URL media...")
        url_data = {
            "app_id": app_id,
            "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
            "name": "Test Image"
        }
        response = requests.post(f"{BASE_URL}/media/url", json=url_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ URL media endpoint working")
                media_id = result["media"]["id"]
                print(f"Created media ID: {media_id}")
            else:
                print(f"❌ URL media failed: {result.get('error')}")
        else:
            print(f"❌ URL media failed: {response.text}")
        
        # 3. Test adding embed
        print("\n3. Testing embed media...")
        embed_data = {
            "app_id": app_id,
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
        response = requests.post(f"{BASE_URL}/media/embed", json=embed_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Embed media endpoint working")
                print(f"Provider: {result['media']['metadata'].get('provider')}")
            else:
                print(f"❌ Embed media failed: {result.get('error')}")
        else:
            print(f"❌ Embed media failed: {response.text}")
        
        # 4. Test adding code snippet
        print("\n4. Testing code snippet...")
        code_data = {
            "app_id": app_id,
            "name": "Hello World",
            "code": "console.log('Hello, World!');",
            "language": "javascript"
        }
        response = requests.post(f"{BASE_URL}/media/code", json=code_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Code snippet endpoint working")
            else:
                print(f"❌ Code snippet failed: {result.get('error')}")
        else:
            print(f"❌ Code snippet failed: {response.text}")
        
        # 5. Test folder creation
        print("\n5. Testing folder creation...")
        folder_data = {
            "app_id": app_id,
            "name": "Test Folder"
        }
        response = requests.post(f"{BASE_URL}/media/folders", json=folder_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            folder = response.json()
            print("✅ Folder creation working")
            print(f"Folder ID: {folder['id']}")
        else:
            print(f"❌ Folder creation failed: {response.text}")
        
        # 6. Test listing folders
        print("\n6. Testing folder list...")
        response = requests.get(f"{BASE_URL}/media/folders/{app_id}")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            folders = response.json()
            print(f"Folder count: {len(folders)}")
            print("✅ Folder list endpoint working")
        else:
            print(f"❌ Folder list failed: {response.text}")
        
        # 7. Final media list to see all created items
        print("\n7. Final media list...")
        response = requests.get(f"{BASE_URL}/media/list/{app_id}")
        if response.status_code == 200:
            media_list = response.json()
            print(f"Total media items: {len(media_list)}")
            for item in media_list:
                print(f"  - {item['name']} ({item['type']})")
            print("✅ All media items listed successfully")
        
        print("\n🎉 Media API integration test completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API server. Make sure it's running on localhost:8000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_media_api()