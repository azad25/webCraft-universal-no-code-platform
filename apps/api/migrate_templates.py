#!/usr/bin/env python3
"""
Migrate hardcoded templates to database
"""

import sys
import os
sys.path.append('/app')

from sqlalchemy.orm import Session
from core.database import SessionLocal, Template, TemplatePage, User
from services.template_service import PREMADE_TEMPLATES
from datetime import datetime
from slugify import slugify

def migrate_templates():
    """Migrate hardcoded templates to database"""
    db = SessionLocal()
    
    try:
        # Get or create admin user as template creator
        admin_user = db.query(User).filter(User.email == "admin@test.com").first()
        if not admin_user:
            print("❌ Admin user not found. Please create admin@test.com user first.")
            return
        
        print(f"🔄 Migrating {len(PREMADE_TEMPLATES)} templates to database...")
        
        for template_id, template_data in PREMADE_TEMPLATES.items():
            # Check if template already exists
            existing = db.query(Template).filter(Template.slug == template_id).first()
            if existing:
                print(f"⏭️ Template '{template_id}' already exists, skipping...")
                continue
            
            # Create template record
            template = Template(
                name=template_data.get("name", template_id.replace("-", " ").title()),
                slug=template_id,
                description=template_data.get("description", ""),
                category=template_data.get("category", "website"),
                preview_image=template_data.get("thumbnail"),
                demo_url=template_data.get("demo_url"),
                config=template_data.get("config", {}),
                pages_config=template_data.get("pages_config", {}),
                is_premium=template_data.get("isPremium", False),
                price=template_data.get("price", 0),
                downloads=template_data.get("downloads", 0),
                rating=int(template_data.get("rating", 4.5) * 20),  # Convert to 0-100 scale
                creator_id=admin_user.id
            )
            
            db.add(template)
            db.flush()  # Get the template ID
            
            # Create template pages
            pages = template_data.get("pages", [])
            pages_config = template_data.get("pages_config", {})
            
            if pages_config:
                # Use pages_config structure
                for page_key, page_data in pages_config.items():
                    template_page = TemplatePage(
                        template_id=template.id,
                        title=page_data.get("title", page_key.title()),
                        slug=page_key,
                        content=page_data.get("content", {}),
                        is_homepage=page_data.get("is_homepage", page_key == "home"),
                        meta_title=page_data.get("title", page_key.title()),
                        meta_description=f"{template.name} - {page_data.get('title', page_key.title())}"
                    )
                    db.add(template_page)
            elif pages:
                # Use pages structure
                for i, page_data in enumerate(pages):
                    elements = page_data.get("elements", [])
                    template_page = TemplatePage(
                        template_id=template.id,
                        title=page_data.get("name", "Home"),
                        slug=page_data.get("slug", "home"),
                        content={"elements": elements},
                        is_homepage=page_data.get("slug") == "home" or i == 0,
                        meta_title=page_data.get("name", "Home"),
                        meta_description=f"{template.name} - {page_data.get('name', 'Home')}",
                        sort_order=i
                    )
                    db.add(template_page)
            else:
                # Create default homepage
                template_page = TemplatePage(
                    template_id=template.id,
                    title="Home",
                    slug="home",
                    content={"elements": []},
                    is_homepage=True,
                    meta_title="Home",
                    meta_description=f"{template.name} - Home"
                )
                db.add(template_page)
            
            print(f"✅ Migrated template: {template.name}")
        
        db.commit()
        print(f"🎉 Successfully migrated all templates to database!")
        
        # Show summary
        total_templates = db.query(Template).count()
        total_pages = db.query(TemplatePage).count()
        print(f"📊 Database now contains:")
        print(f"   - {total_templates} templates")
        print(f"   - {total_pages} template pages")
        
    except Exception as e:
        print(f"❌ Error migrating templates: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_templates()