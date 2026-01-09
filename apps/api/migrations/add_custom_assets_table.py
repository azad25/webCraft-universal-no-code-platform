"""
Migration: Add custom_assets table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, create_engine
import os

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://webcraft:password@postgres:5432/webcraft_db')
engine = create_engine(DATABASE_URL)

def upgrade():
    """Add custom_assets table"""
    
    with engine.connect() as conn:
        # Create custom_assets table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS custom_assets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
                page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(20) NOT NULL,
                content TEXT,
                url VARCHAR(500),
                size INTEGER,
                is_global BOOLEAN DEFAULT FALSE,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Create indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_custom_asset_app ON custom_assets(app_id);
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_custom_asset_type ON custom_assets(type);
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_custom_asset_page ON custom_assets(page_id);
        """))
        
        # Create updated_at trigger
        conn.execute(text("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        """))
        
        conn.execute(text("""
            CREATE TRIGGER update_custom_assets_updated_at 
            BEFORE UPDATE ON custom_assets 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """))
        
        conn.commit()
        print("✅ Custom assets table created successfully")

def downgrade():
    """Remove custom_assets table"""
    
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS custom_assets CASCADE;"))
        conn.commit()
        print("✅ Custom assets table removed successfully")

if __name__ == "__main__":
    upgrade()