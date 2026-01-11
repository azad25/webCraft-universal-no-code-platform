#!/usr/bin/env python3
"""
Test Media Manager Integration
Simple test to verify the media manager components work together
"""

import sys
import os

def test_media_api_import():
    """Test that media API can be imported"""
    print("🧪 Testing Media API Import...")
    
    try:
        # Add the apps/api directory to Python path
        sys.path.insert(0, os.path.join(os.getcwd(), 'apps', 'api'))
        
        # Test importing the media router
        from routers.media import router, MediaItem, MediaType
        print("✅ Media router imported successfully")
        
        # Test creating a media item
        media_item = MediaItem(
            id="test-123",
            app_id="app-123",
            type=MediaType.IMAGE,
            name="test.jpg",
            url="https://example.com/test.jpg",
            tags=[],
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z"
        )
        print("✅ MediaItem model works correctly")
        print(f"   - ID: {media_item.id}")
        print(f"   - Type: {media_item.type}")
        print(f"   - Name: {media_item.name}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_frontend_components():
    """Test that frontend components exist"""
    print("\n🧪 Testing Frontend Components...")
    
    try:
        # Check if media manager components exist
        media_manager_path = "apps/web/components/media/media-manager.tsx"
        media_api_path = "apps/web/lib/media-api.ts"
        
        if os.path.exists(media_manager_path):
            print("✅ Media Manager component exists")
        else:
            print("❌ Media Manager component missing")
            return False
            
        if os.path.exists(media_api_path):
            print("✅ Media API client exists")
        else:
            print("❌ Media API client missing")
            return False
            
        # Check if the old media manager was fixed
        old_media_manager_path = "apps/web/components/editor/media-manager.tsx"
        if os.path.exists(old_media_manager_path):
            print("✅ Editor Media Manager component exists")
        else:
            print("❌ Editor Media Manager component missing")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Frontend test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Media Manager Integration\n")
    
    # Test backend
    backend_ok = test_media_api_import()
    
    # Test frontend
    frontend_ok = test_frontend_components()
    
    print(f"\n📊 Test Results:")
    print(f"   Backend API: {'✅ PASS' if backend_ok else '❌ FAIL'}")
    print(f"   Frontend Components: {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    
    if backend_ok and frontend_ok:
        print("\n🎉 All tests passed! Media Manager integration is ready.")
        print("\n📝 Next Steps:")
        print("   1. Start the API server: docker-compose up api")
        print("   2. Start the web app: docker-compose up web")
        print("   3. Test the media manager in the browser")
        return True
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)