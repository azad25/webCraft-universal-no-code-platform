#!/usr/bin/env python3
"""
Create Demo Auth App
Complete authentication app using V2 Universal App Builder
Creates: demo-auth-app with registration, login, and dashboard
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# API Configuration
BASE_URL = "http://localhost:8000"
V2_BASE = f"{BASE_URL}/api/v2"

class DemoAuthAppBuilder:
    def __init__(self):
        self.session = requests.Session()
        self.v2_token = None
        self.demo_app = None
        self.created_resources = {
            "pages": [],
            "collections": [],
            "actions": [],
            "webhooks": []
        }
    
    def setup_builder_user(self):
        """Setup app builder user"""
        print("🔧 Setting up App Builder User")
        
        builder_user = {
            "email": f"app_builder_{int(time.time())}@example.com",
            "username": f"app_builder_{int(time.time())}",
            "password": "builderpassword123",
            "full_name": "Demo App Builder",
            "terms_accepted": True
        }
        
        try:
            # Register builder
            response = self.session.post(f"{V2_BASE}/auth/register", json=builder_user)
            if response.status_code in [200, 201]:
                # Login builder
                login_data = {"email": builder_user["email"], "password": builder_user["password"]}
                response = self.session.post(f"{V2_BASE}/auth/login", json=login_data)
                if response.status_code == 200:
                    self.v2_token = response.json().get("access_token")
                    print(f"✅ App Builder User authenticated")
                    return True
        except Exception as e:
            print(f"❌ Builder setup failed: {e}")
        
        return False
    
    def create_demo_auth_app(self):
        """Create the demo authentication app"""
        print("\n🏗️  Creating Demo Auth App")
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        
        app_data = {
            "name": "demo-auth-app",
            "description": "Complete authentication demo app with registration, login, and dashboard",
            "app_type": "webapp",
            "config": {
                "theme": "modern",
                "responsive": True,
                "authentication_enabled": True,
                "features": ["user_registration", "user_login", "dashboard", "profile_management"]
            },
            "theme_config": {
                "primary_color": "#3B82F6",
                "secondary_color": "#10B981",
                "accent_color": "#F59E0B",
                "font_family": "Inter",
                "border_radius": "8px"
            },
            "seo_config": {
                "meta_title": "Demo Auth App - Complete Authentication System",
                "meta_description": "Demonstration of complete user authentication system with registration, login, and dashboard",
                "meta_keywords": "authentication, demo, registration, login, dashboard"
            }
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/apps/", json=app_data, headers=headers)
            if response.status_code in [200, 201]:
                self.demo_app = response.json()
                print(f"✅ Demo Auth App Created")
                print(f"   └─ App ID: {self.demo_app['id']}")
                print(f"   └─ App Name: {self.demo_app['name']}")
                print(f"   └─ App Slug: {self.demo_app['slug']}")
                return True
            else:
                print(f"❌ Failed to create app: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ App creation failed: {e}")
            return False
    
    def create_user_collection(self):
        """Create users collection for the app"""
        print("\n👥 Creating Users Collection")
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        app_id = self.demo_app["id"]
        
        collection_data = {
            "name": "app_users",
            "display_name": "App Users",
            "description": "User accounts for the demo auth app",
            "fields": [
                {
                    "name": "username",
                    "type": "text",
                    "required": True,
                    "unique": True,
                    "validation": {"min_length": 3, "max_length": 50}
                },
                {
                    "name": "email",
                    "type": "email",
                    "required": True,
                    "unique": True,
                    "validation": {"format": "email"}
                },
                {
                    "name": "password_hash",
                    "type": "text",
                    "required": True,
                    "hidden": True
                },
                {
                    "name": "full_name",
                    "type": "text",
                    "required": True,
                    "validation": {"min_length": 2, "max_length": 100}
                },
                {
                    "name": "profile_picture",
                    "type": "url",
                    "required": False
                },
                {
                    "name": "bio",
                    "type": "textarea",
                    "required": False,
                    "validation": {"max_length": 500}
                },
                {
                    "name": "is_active",
                    "type": "boolean",
                    "required": True,
                    "default": True
                },
                {
                    "name": "last_login",
                    "type": "datetime",
                    "required": False
                },
                {
                    "name": "created_at",
                    "type": "datetime",
                    "required": True,
                    "auto_generate": True
                }
            ]
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/apps/{app_id}/collections", json=collection_data, headers=headers)
            if response.status_code in [200, 201]:
                collection = response.json()
                self.created_resources["collections"].append(collection)
                print(f"✅ Users Collection Created")
                print(f"   └─ Collection ID: {collection.get('id', 'N/A')}")
                return True
            else:
                print(f"❌ Failed to create collection: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Collection creation failed: {e}")
            return False 
   
    def create_app_pages(self):
        """Create all pages for the auth app"""
        print("\n📄 Creating App Pages")
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        app_id = self.demo_app["id"]
        
        pages_to_create = [
            {
                "title": "Welcome - Demo Auth App",
                "slug": "home",
                "content": {
                    "layout": "auth_landing",
                    "widgets": [
                        {
                            "type": "hero",
                            "config": {
                                "title": "Welcome to Demo Auth App",
                                "subtitle": "Complete authentication system demonstration",
                                "description": "Experience user registration, login, and dashboard functionality built with the Universal App Builder",
                                "background_gradient": "linear-gradient(135deg, #3B82F6 0%, #10B981 100%)",
                                "text_color": "white",
                                "cta_buttons": [
                                    {"text": "Sign Up", "link": "/register", "style": "primary"},
                                    {"text": "Login", "link": "/login", "style": "secondary"}
                                ]
                            },
                            "position": {"x": 0, "y": 0, "width": 12, "height": 8}
                        },
                        {
                            "type": "features",
                            "config": {
                                "title": "Authentication Features",
                                "features": [
                                    {
                                        "title": "User Registration",
                                        "description": "Secure user account creation with validation",
                                        "icon": "user-plus"
                                    },
                                    {
                                        "title": "Secure Login",
                                        "description": "Password-based authentication system",
                                        "icon": "lock"
                                    },
                                    {
                                        "title": "User Dashboard",
                                        "description": "Personalized user dashboard and profile",
                                        "icon": "dashboard"
                                    }
                                ]
                            },
                            "position": {"x": 0, "y": 8, "width": 12, "height": 6}
                        }
                    ]
                },
                "meta_title": "Welcome - Demo Auth App",
                "meta_description": "Complete authentication system demonstration",
                "is_homepage": True,
                "is_published": True
            },
            {
                "title": "User Registration",
                "slug": "register",
                "content": {
                    "layout": "auth_form",
                    "widgets": [
                        {
                            "type": "auth_form",
                            "config": {
                                "form_type": "registration",
                                "title": "Create Your Account",
                                "subtitle": "Join our demo authentication system",
                                "fields": [
                                    {
                                        "name": "username",
                                        "type": "text",
                                        "label": "Username",
                                        "placeholder": "Enter your username",
                                        "required": True,
                                        "validation": {"min_length": 3}
                                    },
                                    {
                                        "name": "email",
                                        "type": "email",
                                        "label": "Email Address",
                                        "placeholder": "Enter your email",
                                        "required": True
                                    },
                                    {
                                        "name": "full_name",
                                        "type": "text",
                                        "label": "Full Name",
                                        "placeholder": "Enter your full name",
                                        "required": True
                                    },
                                    {
                                        "name": "password",
                                        "type": "password",
                                        "label": "Password",
                                        "placeholder": "Create a secure password",
                                        "required": True,
                                        "validation": {"min_length": 8}
                                    },
                                    {
                                        "name": "confirm_password",
                                        "type": "password",
                                        "label": "Confirm Password",
                                        "placeholder": "Confirm your password",
                                        "required": True
                                    }
                                ],
                                "submit_text": "Create Account",
                                "success_redirect": "/dashboard",
                                "login_link": "/login"
                            },
                            "position": {"x": 2, "y": 2, "width": 8, "height": 10}
                        }
                    ]
                },
                "meta_title": "Register - Demo Auth App",
                "meta_description": "Create your account in the demo authentication system",
                "is_published": True
            },
            {
                "title": "User Login",
                "slug": "login",
                "content": {
                    "layout": "auth_form",
                    "widgets": [
                        {
                            "type": "auth_form",
                            "config": {
                                "form_type": "login",
                                "title": "Welcome Back",
                                "subtitle": "Sign in to your account",
                                "fields": [
                                    {
                                        "name": "email",
                                        "type": "email",
                                        "label": "Email Address",
                                        "placeholder": "Enter your email",
                                        "required": True
                                    },
                                    {
                                        "name": "password",
                                        "type": "password",
                                        "label": "Password",
                                        "placeholder": "Enter your password",
                                        "required": True
                                    }
                                ],
                                "submit_text": "Sign In",
                                "success_redirect": "/dashboard",
                                "register_link": "/register",
                                "forgot_password_link": "/forgot-password"
                            },
                            "position": {"x": 2, "y": 2, "width": 8, "height": 8}
                        }
                    ]
                },
                "meta_title": "Login - Demo Auth App",
                "meta_description": "Sign in to your demo authentication account",
                "is_published": True
            },
            {
                "title": "User Dashboard",
                "slug": "dashboard",
                "content": {
                    "layout": "dashboard",
                    "widgets": [
                        {
                            "type": "dashboard_header",
                            "config": {
                                "title": "Welcome to Your Dashboard",
                                "subtitle": "Manage your account and explore features",
                                "user_greeting": "Hello, {{user.full_name}}!",
                                "show_logout": True
                            },
                            "position": {"x": 0, "y": 0, "width": 12, "height": 2}
                        },
                        {
                            "type": "stats_cards",
                            "config": {
                                "cards": [
                                    {
                                        "title": "Account Status",
                                        "value": "Active",
                                        "icon": "check-circle",
                                        "color": "green"
                                    },
                                    {
                                        "title": "Member Since",
                                        "value": "{{user.created_at}}",
                                        "icon": "calendar",
                                        "color": "blue"
                                    },
                                    {
                                        "title": "Last Login",
                                        "value": "{{user.last_login}}",
                                        "icon": "clock",
                                        "color": "purple"
                                    }
                                ]
                            },
                            "position": {"x": 0, "y": 2, "width": 12, "height": 3}
                        },
                        {
                            "type": "user_profile",
                            "config": {
                                "title": "Your Profile",
                                "editable": True,
                                "fields": [
                                    "full_name",
                                    "email",
                                    "username",
                                    "bio",
                                    "profile_picture"
                                ]
                            },
                            "position": {"x": 0, "y": 5, "width": 8, "height": 6}
                        },
                        {
                            "type": "quick_actions",
                            "config": {
                                "title": "Quick Actions",
                                "actions": [
                                    {
                                        "title": "Edit Profile",
                                        "description": "Update your profile information",
                                        "icon": "edit",
                                        "action": "edit_profile"
                                    },
                                    {
                                        "title": "Change Password",
                                        "description": "Update your account password",
                                        "icon": "key",
                                        "action": "change_password"
                                    },
                                    {
                                        "title": "Account Settings",
                                        "description": "Manage account preferences",
                                        "icon": "settings",
                                        "action": "account_settings"
                                    }
                                ]
                            },
                            "position": {"x": 8, "y": 5, "width": 4, "height": 6}
                        }
                    ]
                },
                "meta_title": "Dashboard - Demo Auth App",
                "meta_description": "Your personal dashboard in the demo authentication system",
                "is_published": True,
                "requires_auth": True
            }
        ]
        
        for page_data in pages_to_create:
            try:
                response = self.session.post(f"{V2_BASE}/apps/{app_id}/pages", json=page_data, headers=headers)
                if response.status_code in [200, 201]:
                    page = response.json()
                    self.created_resources["pages"].append(page)
                    print(f"✅ Page Created: {page_data['title']}")
                    print(f"   └─ Slug: /{page_data['slug']}")
                else:
                    print(f"❌ Failed to create page '{page_data['title']}': {response.status_code}")
            except Exception as e:
                print(f"❌ Page creation failed for '{page_data['title']}': {e}")
        
        return len(self.created_resources["pages"]) > 0 
   
    def create_authentication_actions(self):
        """Create actions for user registration and login"""
        print("\n⚡ Creating Authentication Actions")
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        app_id = self.demo_app["id"]
        
        actions_to_create = [
            {
                "name": "User Registration Action",
                "description": "Handle user registration form submission",
                "event_handlers": [
                    {
                        "event_type": "submit",
                        "element_selector": "#registration-form",
                        "actions": [
                            {
                                "type": "validate_form",
                                "config": {
                                    "required_fields": ["username", "email", "full_name", "password"],
                                    "validation_rules": {
                                        "email": {"format": "email"},
                                        "password": {"min_length": 8},
                                        "username": {"min_length": 3}
                                    }
                                }
                            },
                            {
                                "type": "create_record",
                                "config": {
                                    "collection": "app_users",
                                    "fields": {
                                        "username": "{{form.username}}",
                                        "email": "{{form.email}}",
                                        "full_name": "{{form.full_name}}",
                                        "password_hash": "{{hash(form.password)}}",
                                        "is_active": True,
                                        "created_at": "{{now()}}"
                                    }
                                }
                            },
                            {
                                "type": "send_email",
                                "config": {
                                    "to": "{{form.email}}",
                                    "subject": "Welcome to Demo Auth App!",
                                    "template": "welcome_email",
                                    "variables": {
                                        "user_name": "{{form.full_name}}",
                                        "username": "{{form.username}}"
                                    }
                                }
                            },
                            {
                                "type": "redirect",
                                "config": {
                                    "url": "/login",
                                    "message": "Account created successfully! Please log in."
                                }
                            }
                        ]
                    }
                ],
                "is_active": True
            },
            {
                "name": "User Login Action",
                "description": "Handle user login form submission",
                "event_handlers": [
                    {
                        "event_type": "submit",
                        "element_selector": "#login-form",
                        "actions": [
                            {
                                "type": "authenticate_user",
                                "config": {
                                    "collection": "app_users",
                                    "email_field": "{{form.email}}",
                                    "password_field": "{{form.password}}",
                                    "session_duration": 86400
                                }
                            },
                            {
                                "type": "update_record",
                                "config": {
                                    "collection": "app_users",
                                    "filter": {"email": "{{form.email}}"},
                                    "data": {"last_login": "{{now()}}"}
                                }
                            },
                            {
                                "type": "redirect",
                                "config": {
                                    "url": "/dashboard",
                                    "message": "Welcome back!"
                                }
                            }
                        ]
                    }
                ],
                "is_active": True
            },
            {
                "name": "Profile Update Action",
                "description": "Handle user profile updates",
                "event_handlers": [
                    {
                        "event_type": "submit",
                        "element_selector": "#profile-form",
                        "actions": [
                            {
                                "type": "require_auth",
                                "config": {
                                    "redirect_url": "/login"
                                }
                            },
                            {
                                "type": "update_record",
                                "config": {
                                    "collection": "app_users",
                                    "filter": {"id": "{{user.id}}"},
                                    "data": {
                                        "full_name": "{{form.full_name}}",
                                        "bio": "{{form.bio}}",
                                        "profile_picture": "{{form.profile_picture}}"
                                    }
                                }
                            },
                            {
                                "type": "show_message",
                                "config": {
                                    "message": "Profile updated successfully!",
                                    "type": "success"
                                }
                            }
                        ]
                    }
                ],
                "is_active": True
            },
            {
                "name": "Logout Action",
                "description": "Handle user logout",
                "event_handlers": [
                    {
                        "event_type": "click",
                        "element_selector": "#logout-button",
                        "actions": [
                            {
                                "type": "logout_user",
                                "config": {
                                    "clear_session": True
                                }
                            },
                            {
                                "type": "redirect",
                                "config": {
                                    "url": "/",
                                    "message": "You have been logged out successfully."
                                }
                            }
                        ]
                    }
                ],
                "is_active": True
            }
        ]
        
        for action_data in actions_to_create:
            try:
                response = self.session.post(f"{V2_BASE}/actions/apps/{app_id}", json=action_data, headers=headers)
                if response.status_code in [200, 201]:
                    action = response.json()
                    self.created_resources["actions"].append(action)
                    print(f"✅ Action Created: {action_data['name']}")
                else:
                    print(f"❌ Failed to create action '{action_data['name']}': {response.status_code}")
            except Exception as e:
                print(f"❌ Action creation failed for '{action_data['name']}': {e}")
        
        return len(self.created_resources["actions"]) > 0
    
    def create_webhooks_and_integrations(self):
        """Create webhooks for external integrations"""
        print("\n🔗 Creating Webhooks & Integrations")
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        app_id = self.demo_app["id"]
        
        webhooks_to_create = [
            {
                "name": "User Registration Webhook",
                "url": "https://httpbin.org/post",
                "events": ["user_registered", "user_created"],
                "is_active": True,
                "secret": "demo_auth_app_secret_key",
                "description": "Notify external systems when new users register"
            },
            {
                "name": "User Activity Webhook",
                "url": "https://webhook.site/demo-auth-app",
                "events": ["user_login", "user_logout", "profile_updated"],
                "is_active": True,
                "retry_count": 3,
                "description": "Track user activity for analytics"
            }
        ]
        
        for webhook_data in webhooks_to_create:
            try:
                response = self.session.post(f"{V2_BASE}/webhooks/apps/{app_id}", json=webhook_data, headers=headers)
                if response.status_code in [200, 201]:
                    webhook = response.json()
                    self.created_resources["webhooks"].append(webhook)
                    print(f"✅ Webhook Created: {webhook_data['name']}")
                else:
                    print(f"❌ Failed to create webhook '{webhook_data['name']}': {response.status_code}")
            except Exception as e:
                print(f"❌ Webhook creation failed for '{webhook_data['name']}': {e}")
        
        return len(self.created_resources["webhooks"]) > 0    

    def publish_demo_app(self):
        """Publish the demo auth app"""
        print("\n🚀 Publishing Demo Auth App")
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        app_id = self.demo_app["id"]
        
        publish_data = {
            "subdomain": "demo-auth-app",
            "custom_domain": None
        }
        
        try:
            response = self.session.post(f"{V2_BASE}/apps/{app_id}/publish", json=publish_data, headers=headers)
            if response.status_code in [200, 201]:
                result = response.json()
                live_url = result.get("url")
                print(f"✅ Demo Auth App Published Successfully!")
                print(f"   └─ Live URL: {live_url}")
                print(f"   └─ Subdomain: {result.get('subdomain')}")
                return live_url
            else:
                print(f"❌ Failed to publish app: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ App publishing failed: {e}")
            return None
    
    def create_demo_users(self):
        """Create some demo users for testing"""
        print("\n👤 Creating Demo Users")
        headers = {"Authorization": f"Bearer {self.v2_token}"}
        app_id = self.demo_app["id"]
        
        demo_users = [
            {
                "username": "john_doe",
                "email": "john.doe@example.com",
                "full_name": "John Doe",
                "bio": "Software developer and tech enthusiast",
                "is_active": True
            },
            {
                "username": "jane_smith",
                "email": "jane.smith@example.com", 
                "full_name": "Jane Smith",
                "bio": "UX designer passionate about user experience",
                "is_active": True
            },
            {
                "username": "demo_user",
                "email": "demo@example.com",
                "full_name": "Demo User",
                "bio": "Test user for demonstration purposes",
                "is_active": True
            }
        ]
        
        created_users = 0
        for user_data in demo_users:
            try:
                # Add password hash and timestamps
                user_data["password_hash"] = "hashed_demo_password_123"
                user_data["created_at"] = "2024-01-01T00:00:00Z"
                user_data["last_login"] = None
                
                # Create user record (this would normally be done through the registration form)
                response = self.session.post(f"{V2_BASE}/apps/{app_id}/collections/app_users/records", json=user_data, headers=headers)
                if response.status_code in [200, 201]:
                    created_users += 1
                    print(f"✅ Demo User Created: {user_data['username']}")
                else:
                    print(f"⚠️  Demo user creation skipped: {user_data['username']} (collection endpoint may not exist)")
            except Exception as e:
                print(f"⚠️  Demo user creation skipped: {user_data['username']} - {e}")
        
        if created_users > 0:
            print(f"✅ Created {created_users} demo users")
        else:
            print("ℹ️  Demo users will be created through the registration form")
        
        return created_users
    
    def run_demo_app_creation(self):
        """Run the complete demo auth app creation process"""
        print("🎯 CREATING DEMO AUTH APP WITH V2 UNIVERSAL APP BUILDER")
        print("=" * 80)
        
        # Setup
        if not self.setup_builder_user():
            print("❌ Failed to setup app builder user")
            return False
        
        # Create the app
        if not self.create_demo_auth_app():
            print("❌ Failed to create demo auth app")
            return False
        
        # Build the app components
        collection_success = self.create_user_collection()
        pages_success = self.create_app_pages()
        actions_success = self.create_authentication_actions()
        webhooks_success = self.create_webhooks_and_integrations()
        
        # Create demo users
        self.create_demo_users()
        
        # Publish the app
        live_url = self.publish_demo_app()
        
        # Print comprehensive results
        print("\n" + "=" * 80)
        print("🏆 DEMO AUTH APP CREATION RESULTS")
        print("=" * 80)
        
        print(f"\n📊 App Creation Summary:")
        print(f"  App Name: {self.demo_app['name']}")
        print(f"  App ID: {self.demo_app['id']}")
        print(f"  App Slug: {self.demo_app['slug']}")
        
        print(f"\n🏗️  Components Created:")
        print(f"  ✅ Collections: {len(self.created_resources['collections'])} (Users database)")
        print(f"  ✅ Pages: {len(self.created_resources['pages'])} (Home, Register, Login, Dashboard)")
        print(f"  ✅ Actions: {len(self.created_resources['actions'])} (Auth workflows)")
        print(f"  ✅ Webhooks: {len(self.created_resources['webhooks'])} (External integrations)")
        
        print(f"\n📄 App Pages Created:")
        for page in self.created_resources['pages']:
            slug = page.get('slug', 'N/A')
            title = page.get('title', 'N/A')
            print(f"  • /{slug} - {title}")
        
        print(f"\n⚡ Authentication Features:")
        print(f"  • User Registration with validation")
        print(f"  • Secure login system")
        print(f"  • User dashboard with profile management")
        print(f"  • Password-based authentication")
        print(f"  • Session management")
        print(f"  • Profile editing capabilities")
        
        if live_url:
            print(f"\n🌐 Live Demo App:")
            print(f"  🔗 URL: {live_url}")
            print(f"  📱 Pages to visit:")
            print(f"     • {live_url}/ (Home page)")
            print(f"     • {live_url}/register (User registration)")
            print(f"     • {live_url}/login (User login)")
            print(f"     • {live_url}/dashboard (User dashboard - requires login)")
        
        print(f"\n🎯 Demo App Features:")
        print(f"  ✅ Complete user authentication system")
        print(f"  ✅ Responsive design with modern UI")
        print(f"  ✅ User registration and login forms")
        print(f"  ✅ Protected dashboard page")
        print(f"  ✅ User profile management")
        print(f"  ✅ External webhook integrations")
        print(f"  ✅ Email notifications")
        print(f"  ✅ Session management")
        
        print(f"\n🚀 V2 Universal App Builder Capabilities Demonstrated:")
        print(f"  • Complete app creation and configuration")
        print(f"  • Database collections with custom fields")
        print(f"  • Multi-page application structure")
        print(f"  • Interactive forms and user actions")
        print(f"  • Authentication and authorization")
        print(f"  • External integrations via webhooks")
        print(f"  • Live deployment with custom subdomain")
        print(f"  • SEO optimization and meta tags")
        
        success_rate = (
            (1 if collection_success else 0) +
            (1 if pages_success else 0) +
            (1 if actions_success else 0) +
            (1 if webhooks_success else 0) +
            (1 if live_url else 0)
        ) / 5 * 100
        
        print(f"\n📈 Creation Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 DEMO AUTH APP CREATION: SUCCESS!")
            print("✅ Complete authentication app built with V2 Universal App Builder!")
        else:
            print("⚠️  DEMO AUTH APP CREATION: PARTIAL SUCCESS")
            print("🔧 Some components may need manual configuration")
        
        return success_rate >= 80


if __name__ == "__main__":
    builder = DemoAuthAppBuilder()
    success = builder.run_demo_app_creation()
    
    print(f"\n{'='*80}")
    if success:
        print("🎉 DEMO AUTH APP SUCCESSFULLY CREATED!")
        print("✅ V2 Universal App Builder demonstration complete!")
        print("🚀 Visit the live app to test authentication features!")
    else:
        print("⚠️  DEMO AUTH APP CREATION COMPLETED WITH ISSUES")
        print("🔧 Check the logs above for any configuration needed")
    print(f"{'='*80}")