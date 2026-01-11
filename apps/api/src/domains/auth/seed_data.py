"""
Seed data for V2 authentication
"""

import uuid
from sqlalchemy.orm import Session
from src.core.security import get_password_hash
from .models import User


def seed_users(db: Session):
    """Seed initial users for V2"""
    
    # Check if users already exist
    if db.query(User).first():
        return
    
    # Create admin user
    admin_user = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        username="admin",
        full_name="Test Admin",
        hashed_password=get_password_hash("12345678"),
        is_verified=True,
        is_premium=True,
        subscription_tier="enterprise"
    )
    
    db.add(admin_user)
    
    # Create test user
    test_user = User(
        id=uuid.uuid4(),
        email="user@test.com",
        username="testuser",
        full_name="Test User",
        hashed_password=get_password_hash("password123"),
        is_verified=True,
        is_premium=False,
        subscription_tier="free"
    )
    
    db.add(test_user)
    
    db.commit()
    print("✓ V2 Users seeded successfully")