#!/usr/bin/env python3
"""
Test script to verify the preview system is working correctly
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
API_BASE = "http://localhost:8000"
WEB_BASE = "http://localhost:3000"

def test_preview_system():
    """Test the complete preview system flow"""
    
    print("🔍 Testing Preview System")
    print("=" * 50)
    
    # Step 1: Get auth token (you'll need to provide this)
    print("\n1. Authentication Test")
    print("-" * 30)
    
    # You'll need to get this from your browser's localStorage
    # or create a test user and login
    auth_token = input("Enter your auth token (from localStorage.accessToken): ").strip()
    
    if not auth_token:
        print("❌ No auth token provided. Please login to the web app first.")
        return False
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    # Step 2: Get list of apps
    print("\n2. Getting Apps List")
    print("-" * 30)
    
    try:
        response = requests.get(f"{API_BASE}/api/apps", headers=headers)
        response.raise_for_status()
        apps_data = response.json()
        
        apps = apps_data.get('apps', [])
        print(f"✅ Found {len(apps)} apps")
        
        if not apps:
            print("❌ No apps found. Please create an app first.")
            return False
            
        # Use the first app
        test_app = apps[0]
        app_id = test_app['id']
        print(f"📱 Using app: {test_app['name']} ({app_id})")
        
    except Exception as e:
        print(f"❌ Failed to get apps: {e}")
        return False
    
    # Step 3: Get app pages
    print("\n3. Getting App Pages")
    print("-" * 30)
    
    try:
        response = requests.get(f"{API_BASE}/api/apps/{app_id}/pages", headers=headers)
        response.raise_for_status()
        pages_data = response.json()
        
        pages = pages_data.get('pages', [])
        print(f"✅ Found {len(pages)} pages")
        
        for page in pages:
            elements_count = len(page.get('content', {}).get('elements', []))
            print(f"  📄 {page['title']} ({page['slug']}) - {elements_count} elements")
            
            if elements_count > 0:
                print(f"    🧩 Elements: {[el.get('type', 'unknown') for el in page.get('content', {}).get('elements', [])]}")
        
    except Exception as e:
        print(f"❌ Failed to get pages: {e}")
        return False
    
    # Step 4: Generate preview
    print("\n4. Generating Preview")
    print("-" * 30)
    
    try:
        response = requests.get(f"{API_BASE}/api/apps/{app_id}/preview", headers=headers)
        response.raise_for_status()
        preview_data = response.json()
        
        preview_token = preview_data.get('token')
        preview_url = preview_data.get('preview_url')
        
        print(f"✅ Preview generated successfully")
        print(f"🔗 Token: {preview_token}")
        print(f"🌐 URL: {preview_url}")
        
    except Exception as e:
        print(f"❌ Failed to generate preview: {e}")
        return False
    
    # Step 5: Test preview data retrieval
    print("\n5. Testing Preview Data Retrieval")
    print("-" * 30)
    
    try:
        response = requests.get(f"{API_BASE}/api/apps/preview/{preview_token}?device=desktop")
        response.raise_for_status()
        preview_content = response.json()
        
        app_info = preview_content.get('app', {})
        pages_info = preview_content.get('pages', [])
        
        print(f"✅ Preview data retrieved successfully")
        print(f"📱 App: {app_info.get('name')} ({app_info.get('app_type')})")
        print(f"📄 Pages: {len(pages_info)}")
        
        for page in pages_info:
            elements = page.get('content', {}).get('elements', [])
            print(f"  📄 {page['title']} - {len(elements)} elements")
            
            for i, element in enumerate(elements[:3]):  # Show first 3 elements
                print(f"    🧩 Element {i+1}: {element.get('type', 'unknown')} at ({element.get('position', {}).get('x', 0)}, {element.get('position', {}).get('y', 0)})")
        
    except Exception as e:
        print(f"❌ Failed to retrieve preview data: {e}")
        return False
    
    # Step 6: Test preview page access
    print("\n6. Testing Preview Page Access")
    print("-" * 30)
    
    try:
        preview_page_url = f"{WEB_BASE}/preview/{preview_token}"
        print(f"🌐 Preview page URL: {preview_page_url}")
        print(f"📱 Mobile preview: {preview_page_url}?device=mobile")
        print(f"📱 Tablet preview: {preview_page_url}?device=tablet")
        print(f"🖥️  Embed preview: {preview_page_url}/embed")
        
        # Test if the preview page loads (basic check)
        response = requests.get(preview_page_url, timeout=10)
        if response.status_code == 200:
            print("✅ Preview page is accessible")
        else:
            print(f"⚠️  Preview page returned status {response.status_code}")
            
    except Exception as e:
        print(f"⚠️  Could not test preview page access: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Preview System Test Complete!")
    print("\nNext steps:")
    print(f"1. Open the preview URL in your browser: {preview_page_url}")
    print("2. Check the browser console for any errors")
    print("3. Verify that elements are rendering correctly")
    print("4. Test different device modes (mobile, tablet, desktop)")
    
    return True

def test_element_structure():
    """Test element structure in a specific app"""
    
    print("\n🧩 Element Structure Analysis")
    print("=" * 50)
    
    auth_token = input("Enter your auth token: ").strip()
    app_id = input("Enter app ID to analyze: ").strip()
    
    if not auth_token or not app_id:
        print("❌ Missing required inputs")
        return
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Get app pages
        response = requests.get(f"{API_BASE}/api/apps/{app_id}/pages", headers=headers)
        response.raise_for_status()
        pages_data = response.json()
        
        pages = pages_data.get('pages', [])
        
        for page in pages:
            print(f"\n📄 Page: {page['title']} ({page['slug']})")
            print(f"   🏠 Homepage: {page.get('is_homepage', False)}")
            print(f"   📝 Published: {page.get('is_published', False)}")
            
            content = page.get('content', {})
            elements = content.get('elements', [])
            
            print(f"   🧩 Elements: {len(elements)}")
            
            for i, element in enumerate(elements):
                print(f"     {i+1}. {element.get('type', 'unknown')} (ID: {element.get('id', 'no-id')})")
                print(f"        📍 Position: {element.get('position', {})}")
                print(f"        📏 Size: {element.get('size', {})}")
                print(f"        🎨 Props: {list(element.get('props', {}).keys())}")
                print(f"        💅 Style: {list(element.get('style', {}).keys())}")
                
                # Show some prop values
                props = element.get('props', {})
                if 'text' in props:
                    print(f"        📝 Text: '{props['text'][:50]}{'...' if len(props.get('text', '')) > 50 else ''}'")
                if 'title' in props:
                    print(f"        🏷️  Title: '{props['title'][:50]}{'...' if len(props.get('title', '')) > 50 else ''}'")
                
    except Exception as e:
        print(f"❌ Failed to analyze elements: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "elements":
        test_element_structure()
    else:
        test_preview_system()