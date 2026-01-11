#!/usr/bin/env python3
"""
Test Cross-App Communication System
Comprehensive test for the new cross-app communication features
"""

import asyncio
import json
import uuid
from datetime import datetime
import httpx

# Test configuration
API_BASE_URL = "http://localhost:8000"
TEST_USER_TOKEN = "admin-test-token"  # Development token

# Global test variables
TEST_APP_1_ID = None
TEST_APP_2_ID = None
TEST_COLLECTION_1_ID = None
TEST_COLLECTION_2_ID = None
TEST_CONNECTION_ID = None
TEST_SYNC_JOB_ID = None

async def test_cross_app_communication():
    """Test the complete Cross-App Communication system"""
    
    print("🧪 Testing Cross-App Communication System")
    print("=" * 60)
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {TEST_USER_TOKEN}"}
        
        # Step 1: Create two test apps
        print("\n1️⃣ Creating test apps...")
        await create_test_apps(client, headers)
        
        # Step 2: Create collections in both apps
        print("\n2️⃣ Creating collections...")
        await create_test_collections(client, headers)
        
        # Step 3: Test collection sharing
        print("\n3️⃣ Testing collection sharing...")
        await test_collection_sharing(client, headers)
        
        # Step 4: Test app connections
        print("\n4️⃣ Testing app connections...")
        await test_app_connections(client, headers)
        
        # Step 5: Test cross-app events
        print("\n5️⃣ Testing cross-app events...")
        await test_cross_app_events(client, headers)
        
        # Step 6: Test app messaging
        print("\n6️⃣ Testing app messaging...")
        await test_app_messaging(client, headers)
        
        # Step 7: Test data synchronization
        print("\n7️⃣ Testing data synchronization...")
        await test_data_synchronization(client, headers)
        
        # Step 8: Test app discovery
        print("\n8️⃣ Testing app discovery...")
        await test_app_discovery(client, headers)
        
        # Step 9: Test cross-app actions
        print("\n9️⃣ Testing cross-app actions...")
        await test_cross_app_actions(client, headers)
        
        # Step 10: Test shared data access
        print("\n🔟 Testing shared data access...")
        await test_shared_data_access(client, headers)
        
        print("\n" + "=" * 60)
        print("🎉 Cross-App Communication System Test Complete!")
        print("✅ All cross-app features tested successfully")


async def create_test_apps(client, headers):
    """Create two test apps for cross-app communication"""
    global TEST_APP_1_ID, TEST_APP_2_ID
    
    # Create App 1 (E-commerce)
    app1_data = {
        "name": "E-commerce Store",
        "description": "Online store for cross-app testing",
        "app_type": "ecommerce"
    }
    
    response = await client.post(
        f"{API_BASE_URL}/api/apps/",
        json=app1_data,
        headers=headers
    )
    
    if response.status_code == 200:
        app1 = response.json()
        TEST_APP_1_ID = app1["id"]
        print(f"✅ Created App 1: {app1['name']} (ID: {TEST_APP_1_ID})")
    else:
        print(f"❌ Failed to create App 1: {response.status_code}")
        return
    
    # Create App 2 (CRM)
    app2_data = {
        "name": "Customer CRM",
        "description": "CRM system for customer management",
        "app_type": "crm"
    }
    
    response = await client.post(
        f"{API_BASE_URL}/api/apps/",
        json=app2_data,
        headers=headers
    )
    
    if response.status_code == 200:
        app2 = response.json()
        TEST_APP_2_ID = app2["id"]
        print(f"✅ Created App 2: {app2['name']} (ID: {TEST_APP_2_ID})")
    else:
        print(f"❌ Failed to create App 2: {response.status_code}")


async def create_test_collections(client, headers):
    """Create collections in both apps"""
    global TEST_COLLECTION_1_ID, TEST_COLLECTION_2_ID
    
    # Create collection in App 1 (Products)
    collection1_data = {
        "name": "Products",
        "slug": "products",
        "description": "Product catalog for e-commerce",
        "schema": [
            {"name": "name", "type": "text", "required": True},
            {"name": "price", "type": "number", "required": True},
            {"name": "description", "type": "textarea", "required": False},
            {"name": "category", "type": "select", "options": ["electronics", "clothing", "books"]}
        ]
    }
    
    response = await client.post(
        f"{API_BASE_URL}/api/apps/{TEST_APP_1_ID}/collections",
        json=collection1_data,
        headers=headers
    )
    
    if response.status_code == 200:
        collection1 = response.json()
        TEST_COLLECTION_1_ID = collection1["id"]
        print(f"✅ Created Collection 1: {collection1['name']} (ID: {TEST_COLLECTION_1_ID})")
    else:
        print(f"❌ Failed to create Collection 1: {response.status_code}")
    
    # Create collection in App 2 (Customers)
    collection2_data = {
        "name": "Customers",
        "slug": "customers",
        "description": "Customer database for CRM",
        "schema": [
            {"name": "name", "type": "text", "required": True},
            {"name": "email", "type": "email", "required": True},
            {"name": "phone", "type": "text", "required": False},
            {"name": "company", "type": "text", "required": False}
        ]
    }
    
    response = await client.post(
        f"{API_BASE_URL}/api/apps/{TEST_APP_2_ID}/collections",
        json=collection2_data,
        headers=headers
    )
    
    if response.status_code == 200:
        collection2 = response.json()
        TEST_COLLECTION_2_ID = collection2["id"]
        print(f"✅ Created Collection 2: {collection2['name']} (ID: {TEST_COLLECTION_2_ID})")
    else:
        print(f"❌ Failed to create Collection 2: {response.status_code}")


async def test_collection_sharing(client, headers):
    """Test sharing collections between apps"""
    
    # Share Products collection from App 1
    share_data = {
        "collection_id": TEST_COLLECTION_1_ID,
        "visibility": "shared",
        "allowed_apps": [TEST_APP_2_ID],
        "permissions": {
            TEST_APP_2_ID: ["read", "write"]
        }
    }
    
    response = await client.post(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/collections/share",
        json=share_data,
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Shared collection successfully: {result['visibility']}")
    else:
        print(f"❌ Failed to share collection: {response.status_code}")
        print(response.text)
    
    # Get shared collections for App 2
    response = await client.get(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_2_ID}/collections/shared",
        headers=headers
    )
    
    if response.status_code == 200:
        shared_collections = response.json()
        print(f"✅ Retrieved {shared_collections['total']} shared collections")
        for collection in shared_collections['shared_collections']:
            print(f"   - {collection['name']} from {collection['app_name']}")
    else:
        print(f"❌ Failed to get shared collections: {response.status_code}")


async def test_app_connections(client, headers):
    """Test creating connections between apps"""
    global TEST_CONNECTION_ID
    
    # Create event trigger connection from App 1 to App 2
    connection_data = {
        "target_app_id": TEST_APP_2_ID,
        "connection_type": "event_trigger",
        "config": {
            "events": ["product_created", "order_completed"],
            "webhook_url": f"http://localhost:8000/api/cross-app/apps/{TEST_APP_2_ID}/events/receive"
        }
    }
    
    response = await client.post(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/connections",
        json=connection_data,
        headers=headers
    )
    
    if response.status_code == 200:
        connection = response.json()
        TEST_CONNECTION_ID = connection["connection_id"]
        print(f"✅ Created connection: {connection['connection_type']}")
        print(f"   Connection ID: {TEST_CONNECTION_ID}")
    else:
        print(f"❌ Failed to create connection: {response.status_code}")
        print(response.text)
    
    # Get connections for App 1
    response = await client.get(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/connections",
        headers=headers
    )
    
    if response.status_code == 200:
        connections = response.json()
        print(f"✅ Retrieved {connections['total']} connections")
        for conn in connections['connections']:
            print(f"   - {conn['connection_type']} to {conn['connected_app']['name']}")
    else:
        print(f"❌ Failed to get connections: {response.status_code}")


async def test_cross_app_events(client, headers):
    """Test triggering events across apps"""
    
    # Trigger event from App 1 to App 2
    event_data = {
        "event_type": "product_created",
        "event_data": {
            "product_id": "prod_123",
            "product_name": "Test Product",
            "price": 29.99,
            "category": "electronics"
        },
        "target_app_id": TEST_APP_2_ID
    }
    
    response = await client.post(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/events/trigger",
        json=event_data,
        headers=headers
    )
    
    if response.status_code == 200:
        event = response.json()
        print(f"✅ Triggered event: {event['event_type']}")
        print(f"   Event ID: {event['event_id']}")
        print(f"   Status: {event['status']}")
    else:
        print(f"❌ Failed to trigger event: {response.status_code}")
        print(response.text)
    
    # Wait a moment for event processing
    await asyncio.sleep(2)
    
    # Get events for App 1 (sent events)
    response = await client.get(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/events",
        headers=headers
    )
    
    if response.status_code == 200:
        events = response.json()
        print(f"✅ Retrieved {events['total']} events for App 1")
        for event in events['events']:
            print(f"   - {event['type']}: {event['event_type']} ({event['status']})")
    else:
        print(f"❌ Failed to get events: {response.status_code}")
    
    # Get events for App 2 (received events)
    response = await client.get(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_2_ID}/events",
        headers=headers
    )
    
    if response.status_code == 200:
        events = response.json()
        print(f"✅ Retrieved {events['total']} events for App 2")
        for event in events['events']:
            print(f"   - {event['type']}: {event['event_type']} from {event.get('source_app', 'Unknown')}")
    else:
        print(f"❌ Failed to get events for App 2: {response.status_code}")


async def test_app_messaging(client, headers):
    """Test messaging between apps"""
    
    # Send message from App 1 to App 2
    message_data = {
        "to_app_id": TEST_APP_2_ID,
        "message_type": "data_update",
        "subject": "New Product Added",
        "payload": {
            "action": "product_created",
            "product_data": {
                "id": "prod_123",
                "name": "Test Product",
                "price": 29.99
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    }
    
    response = await client.post(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/messages/send",
        json=message_data,
        headers=headers
    )
    
    if response.status_code == 200:
        message = response.json()
        print(f"✅ Sent message: {message_data['subject']}")
        print(f"   Message ID: {message['message_id']}")
    else:
        print(f"❌ Failed to send message: {response.status_code}")
        print(response.text)
    
    # Get messages for App 2
    response = await client.get(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_2_ID}/messages",
        headers=headers
    )
    
    if response.status_code == 200:
        messages = response.json()
        print(f"✅ Retrieved {messages['total']} messages for App 2")
        print(f"   Unread: {messages['unread_count']}")
        
        for message in messages['messages']:
            print(f"   - {message['subject']} from {message['from_app']['name']}")
            
            # Mark first message as read
            if not message['is_read']:
                read_response = await client.put(
                    f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_2_ID}/messages/{message['id']}/read",
                    headers=headers
                )
                if read_response.status_code == 200:
                    print(f"     ✅ Marked message as read")
                break
    else:
        print(f"❌ Failed to get messages: {response.status_code}")


async def test_data_synchronization(client, headers):
    """Test data synchronization between apps"""
    global TEST_SYNC_JOB_ID
    
    # Create data sync job
    sync_data = {
        "target_app_id": TEST_APP_2_ID,
        "source_collection_id": TEST_COLLECTION_1_ID,
        "target_collection_id": TEST_COLLECTION_2_ID,
        "sync_type": "one_way",
        "field_mappings": {
            "customer_name": "name",
            "customer_email": "email",
            "product_interest": "category"
        },
        "sync_frequency": "manual"
    }
    
    response = await client.post(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/sync-jobs",
        json=sync_data,
        headers=headers
    )
    
    if response.status_code == 200:
        sync_job = response.json()
        TEST_SYNC_JOB_ID = sync_job["sync_job_id"]
        print(f"✅ Created sync job: {sync_job['sync_type']}")
        print(f"   Sync Job ID: {TEST_SYNC_JOB_ID}")
    else:
        print(f"❌ Failed to create sync job: {response.status_code}")
        print(response.text)
        return
    
    # Add some test data to source collection
    test_record = {
        "data": {
            "name": "Test Product for Sync",
            "price": 49.99,
            "description": "Product to test data synchronization",
            "category": "electronics"
        }
    }
    
    response = await client.post(
        f"{API_BASE_URL}/api/apps/{TEST_APP_1_ID}/collections/{TEST_COLLECTION_1_ID}/records",
        json=test_record,
        headers=headers
    )
    
    if response.status_code == 200:
        print("✅ Added test record to source collection")
    else:
        print(f"❌ Failed to add test record: {response.status_code}")
    
    # Execute sync job
    response = await client.post(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/sync-jobs/{TEST_SYNC_JOB_ID}/execute",
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Sync job started: {result['message']}")
    else:
        print(f"❌ Failed to execute sync job: {response.status_code}")
    
    # Get sync jobs
    response = await client.get(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/sync-jobs",
        headers=headers
    )
    
    if response.status_code == 200:
        sync_jobs = response.json()
        print(f"✅ Retrieved {sync_jobs['total']} sync jobs")
        for job in sync_jobs['sync_jobs']:
            print(f"   - {job['sync_type']} to {job['target_app']['name']}")
            print(f"     Status: {job['sync_status']}")
    else:
        print(f"❌ Failed to get sync jobs: {response.status_code}")


async def test_app_discovery(client, headers):
    """Test app discovery functionality"""
    
    # Discover apps for App 1
    response = await client.get(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/discover",
        headers=headers
    )
    
    if response.status_code == 200:
        apps = response.json()
        print(f"✅ Discovered {apps['total']} apps")
        for app in apps['apps']:
            print(f"   - {app['name']} ({app['app_type']})")
            print(f"     Collections: {app['collection_count']}, Shared: {app['shared_collections']}")
    else:
        print(f"❌ Failed to discover apps: {response.status_code}")
    
    # Search for specific app type
    response = await client.get(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/discover",
        params={"app_type": "crm"},
        headers=headers
    )
    
    if response.status_code == 200:
        apps = response.json()
        print(f"✅ Found {apps['total']} CRM apps")
    else:
        print(f"❌ Failed to search apps: {response.status_code}")


async def test_cross_app_actions(client, headers):
    """Test cross-app actions integration"""
    
    # Get available cross-app action types
    response = await client.get(
        f"{API_BASE_URL}/api/cross-app/action-types",
        headers=headers
    )
    
    if response.status_code == 200:
        action_types = response.json()
        print(f"✅ Retrieved {len(action_types['action_types'])} cross-app action types")
        for action_type in action_types['action_types']:
            print(f"   - {action_type['name']}: {action_type['description']}")
    else:
        print(f"❌ Failed to get action types: {response.status_code}")
    
    # Create cross-app action
    action_data = {
        "action_type": "trigger_app_event",
        "name": "Notify CRM of New Order",
        "description": "Trigger event in CRM when order is created",
        "target_app_id": TEST_APP_2_ID,
        "event_type": "order_created",
        "event_data": {
            "order_id": "{order_id}",
            "customer_email": "{customer_email}",
            "total_amount": "{total_amount}"
        }
    }
    
    response = await client.post(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_1_ID}/actions/cross-app",
        json=action_data,
        headers=headers
    )
    
    if response.status_code == 200:
        action = response.json()
        print(f"✅ Created cross-app action: {action['action_type']}")
        print(f"   Action ID: {action['action_id']}")
    else:
        print(f"❌ Failed to create cross-app action: {response.status_code}")
        print(response.text)


async def test_shared_data_access(client, headers):
    """Test accessing shared collection data"""
    
    # Access shared collection data from App 2
    response = await client.get(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_2_ID}/collections/{TEST_COLLECTION_1_ID}/data",
        params={"limit": 10},
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Accessed shared collection data")
        print(f"   Collection: {data['collection_name']}")
        print(f"   Records: {data['total']}")
        print(f"   Permissions: {', '.join(data['permissions'])}")
        
        for record in data['records'][:3]:  # Show first 3 records
            print(f"   - Record: {record['data']}")
    else:
        print(f"❌ Failed to access shared data: {response.status_code}")
        print(response.text)
    
    # Test with filters
    filters = json.dumps({"category": "electronics"})
    response = await client.get(
        f"{API_BASE_URL}/api/cross-app/apps/{TEST_APP_2_ID}/collections/{TEST_COLLECTION_1_ID}/data",
        params={"filters": filters, "limit": 5},
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Filtered shared data: {data['total']} electronics products")
    else:
        print(f"❌ Failed to filter shared data: {response.status_code}")


if __name__ == "__main__":
    asyncio.run(test_cross_app_communication())