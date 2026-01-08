#!/usr/bin/env python3
"""
Create a test user for development
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import SessionLocal, User
from core.auth import AuthService

def create_test_user():
    """Create a verified test user"""
    db = SessionLocal()
    
    try:
        # Create admin user
        admin_email = "admin@test.com"
        existing_user = db.query(User).filter(User.email == admin_email).first()
        if existing_user:
            print("Admin user already exists!")
            # Make sure they're verified
            existing_user.is_verified = True
            existing_user.is_active = True
            db.commit()
            print("Updated existing admin user to be verified and active")
            return
        
        # Create new admin user
        hashed_password = AuthService.get_password_hash("12345678")
        user = User(
            email=admin_email,
            username="admin",
            full_name="Admin User",
            hashed_password=hashed_password,
            is_verified=True,  # Skip email verification for testing
            is_active=True
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"✅ Created admin user:")
        print(f"   Email: {user.email}")
        print(f"   Username: {user.username}")
        print(f"   Password: 12345678")
        print(f"   Verified: {user.is_verified}")
        print(f"   Active: {user.is_active}")
        
        # Also create testuser2 if it doesn't exist
        test_email = "testuser2@example.com"
        existing_test_user = db.query(User).filter(User.email == test_email).first()
        if not existing_test_user:
            hashed_password2 = AuthService.get_password_hash("password123")
            test_user = User(
                email=test_email,
                username="testuser2",
                full_name="Test User 2",
                hashed_password=hashed_password2,
                is_verified=True,
                is_active=True
            )
            
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            
            print(f"✅ Also created test user:")
            print(f"   Email: {test_user.email}")
            print(f"   Username: {test_user.username}")
            print(f"   Password: password123")
        
    except Exception as e:
        print(f"❌ Error creating users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()