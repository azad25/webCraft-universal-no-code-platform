"""
Seed V2 database with initial data
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Direct database URL for V2
DATABASE_V2_URL = os.getenv('DATABASE_V2_URL', 'postgresql://webcraft:password@postgres:5432/webcraft_v2_db')

def seed_v2_data():
    """Seed V2 database with initial data"""
    
    # Create engine and session
    engine = create_engine(DATABASE_V2_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    with SessionLocal() as db:
        try:
            # Import seed functions
            import sys
            sys.path.append('/app')
            
            from src.domains.auth.seed_data import seed_users
            from src.domains.templates.seed_data import seed_templates
            
            # Seed users first
            print("Seeding V2 users...")
            seed_users(db)
            
            # Seed templates
            print("Seeding V2 templates...")
            seed_templates(db)
            
            print("✓ V2 database seeded successfully")
            
        except Exception as e:
            print(f"Error seeding V2 database: {e}")
            db.rollback()
            raise
        finally:
            db.close()

if __name__ == "__main__":
    seed_v2_data()