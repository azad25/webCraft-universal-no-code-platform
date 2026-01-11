"""
Seed data for V2 templates
"""

import uuid
from sqlalchemy.orm import Session
from .models import Template, TemplatePage


def seed_templates(db: Session):
    """Seed initial templates for V2"""
    
    # Check if templates already exist
    if db.query(Template).first():
        return
    
    # Get the first user as the default creator
    from src.domains.auth.models import User
    default_creator = db.query(User).first()
    if not default_creator:
        print("No users found, skipping template seeding")
        return
    
    default_creator_id = default_creator.id
    
    templates_data = [
        {
            "id": uuid.uuid4(),
            "name": "Blank",
            "slug": "blank",
            "description": "Start from scratch",
            "category": "basic",
            "is_premium": False,
            "price": 0,
            "downloads": 0,
            "creator_id": default_creator_id,
            "config": {},
            "pages_config": {}
        },
        {
            "id": uuid.uuid4(),
            "name": "Business Website",
            "slug": "business",
            "description": "Professional business template",
            "category": "business",
            "is_premium": False,
            "price": 0,
            "downloads": 100,
            "creator_id": default_creator_id,
            "config": {
                "theme": {
                    "colors": {
                        "primary": "#2563eb",
                        "secondary": "#64748b"
                    }
                }
            },
            "pages_config": {}
        },
        {
            "id": uuid.uuid4(),
            "name": "E-commerce Store",
            "slug": "ecommerce",
            "description": "Online store template",
            "category": "ecommerce",
            "is_premium": True,
            "price": 29,
            "downloads": 50,
            "creator_id": default_creator_id,
            "config": {
                "theme": {
                    "colors": {
                        "primary": "#059669",
                        "secondary": "#6b7280"
                    }
                }
            },
            "pages_config": {}
        },
        {
            "id": uuid.uuid4(),
            "name": "Portfolio",
            "slug": "portfolio",
            "description": "Showcase your work",
            "category": "portfolio",
            "is_premium": False,
            "price": 0,
            "downloads": 75,
            "creator_id": default_creator_id,
            "config": {},
            "pages_config": {}
        },
        {
            "id": uuid.uuid4(),
            "name": "Blog",
            "slug": "blog",
            "description": "Personal or professional blog",
            "category": "content",
            "is_premium": False,
            "price": 0,
            "downloads": 60,
            "creator_id": default_creator_id,
            "config": {},
            "pages_config": {}
        },
        {
            "id": uuid.uuid4(),
            "name": "Landing Page",
            "slug": "landing",
            "description": "High-converting landing page",
            "category": "marketing",
            "is_premium": False,
            "price": 0,
            "downloads": 120,
            "creator_id": default_creator_id,
            "config": {},
            "pages_config": {}
        }
    ]
    
    for template_data in templates_data:
        template = Template(**template_data)
        db.add(template)
    
    db.commit()
    print("✓ V2 Templates seeded successfully")