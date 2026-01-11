#!/usr/bin/env python3
"""
Simple API connection test
"""

import requests
import json

# API base URL
BASE_URL = "http://192.168.0.109:8000"

def test_connection():
    """Test basic API connection"""
    
    print("🔗 Testing API connection...")
    
    try:
        # Test health endpoint
        print(f"Testing: {BASE_URL}/health")
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ API server is running")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.text}")
        
        # Test root endpoint
        print(f"\nTesting: {BASE_URL}/")
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Root endpoint working")
            data = response.json()
            print(f"API Version: {data.get('version')}")
        else:
            print(f"❌ Root endpoint failed: {response.text}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection failed: {e}")
        print("Make sure the API server is running on 192.168.0.109:8000")
    except requests.exceptions.Timeout as e:
        print(f"❌ Request timed out: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_connection()