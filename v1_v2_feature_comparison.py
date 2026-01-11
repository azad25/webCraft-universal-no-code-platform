#!/usr/bin/env python3
"""
V1 vs V2 Feature Comparison Script
Analyzes endpoint coverage and feature parity
"""

import requests
import json
from collections import defaultdict

def get_endpoints(base_url):
    """Get all endpoints from OpenAPI spec"""
    try:
        response = requests.get(f"{base_url}/openapi.json")
        if response.status_code == 200:
            return set(response.json()["paths"].keys())
        return set()
    except:
        return set()

def categorize_endpoints(endpoints, prefix=""):
    """Categorize endpoints by domain"""
    categories = defaultdict(list)
    
    for endpoint in endpoints:
        # Remove prefix if present
        clean_endpoint = endpoint.replace(prefix, "") if prefix else endpoint
        
        # Extract domain from endpoint
        parts = clean_endpoint.strip("/").split("/")
        if len(parts) > 0:
            domain = parts[0]
            categories[domain].append(clean_endpoint)
    
    return dict(categories)

def main():
    base_url = "http://localhost:8000"
    
    print("🔍 V1 vs V2 API Feature Comparison")
    print("=" * 50)
    
    # Get V1 endpoints
    v1_endpoints = get_endpoints(base_url)
    v1_api_endpoints = {ep.replace("/api/v1", "") for ep in v1_endpoints if ep.startswith("/api/v1")}
    
    # Get V2 endpoints  
    v2_endpoints = get_endpoints(f"{base_url}/api/v2")
    
    print(f"📊 Endpoint Counts:")
    print(f"  V1 Total: {len(v1_endpoints)}")
    print(f"  V1 API: {len(v1_api_endpoints)}")
    print(f"  V2 API: {len(v2_endpoints)}")
    
    # Categorize endpoints
    v1_categories = categorize_endpoints(v1_api_endpoints)
    v2_categories = categorize_endpoints(v2_endpoints)
    
    print(f"\n📋 Domain Coverage Comparison:")
    print("-" * 50)
    
    all_domains = set(v1_categories.keys()) | set(v2_categories.keys())
    
    for domain in sorted(all_domains):
        v1_count = len(v1_categories.get(domain, []))
        v2_count = len(v2_categories.get(domain, []))
        
        if v1_count > 0 and v2_count > 0:
            status = "✅ Both"
            if v2_count >= v1_count:
                status += f" (V2 enhanced: +{v2_count - v1_count})"
        elif v1_count > 0 and v2_count == 0:
            status = "❌ Missing in V2"
        elif v1_count == 0 and v2_count > 0:
            status = "✨ New in V2"
        else:
            status = "❓ Unknown"
        
        print(f"  {domain:20} | V1: {v1_count:2d} | V2: {v2_count:2d} | {status}")
    
    # Find missing endpoints
    missing_in_v2 = v1_api_endpoints - v2_endpoints
    new_in_v2 = v2_endpoints - v1_api_endpoints
    
    print(f"\n❌ V1 Features Missing in V2 ({len(missing_in_v2)}):")
    if missing_in_v2:
        missing_categories = categorize_endpoints(missing_in_v2)
        for domain, endpoints in sorted(missing_categories.items()):
            print(f"\n  📁 {domain.upper()}:")
            for endpoint in sorted(endpoints)[:5]:  # Show first 5
                print(f"    - {endpoint}")
            if len(endpoints) > 5:
                print(f"    ... and {len(endpoints) - 5} more")
    
    print(f"\n✨ New V2 Features ({len(new_in_v2)}):")
    if new_in_v2:
        new_categories = categorize_endpoints(new_in_v2)
        for domain, endpoints in sorted(new_categories.items()):
            print(f"\n  📁 {domain.upper()}:")
            for endpoint in sorted(endpoints)[:5]:  # Show first 5
                print(f"    + {endpoint}")
            if len(endpoints) > 5:
                print(f"    ... and {len(endpoints) - 5} more")
    
    # Calculate coverage percentage
    total_v1_features = len(v1_api_endpoints)
    covered_features = len(v1_api_endpoints & v2_endpoints)
    coverage_percent = (covered_features / total_v1_features * 100) if total_v1_features > 0 else 0
    
    print(f"\n📈 V2 Feature Coverage:")
    print(f"  Covered: {covered_features}/{total_v1_features} ({coverage_percent:.1f}%)")
    print(f"  Missing: {len(missing_in_v2)} features")
    print(f"  Enhanced: {len(new_in_v2)} new features")
    
    # Overall assessment
    print(f"\n🎯 ASSESSMENT:")
    if coverage_percent >= 90:
        print("✅ V2 has excellent feature parity with V1")
    elif coverage_percent >= 75:
        print("⚠️  V2 has good feature coverage but some gaps exist")
    elif coverage_percent >= 50:
        print("⚠️  V2 covers most core features but significant gaps remain")
    else:
        print("❌ V2 needs substantial work to match V1 features")
    
    print(f"\n🔗 Access Points:")
    print(f"  V1 Docs: {base_url}/docs")
    print(f"  V2 Docs: {base_url}/api/v2/docs")

if __name__ == "__main__":
    main()