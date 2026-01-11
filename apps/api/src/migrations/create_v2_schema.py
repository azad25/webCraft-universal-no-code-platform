"""
Create V2 database schema using the existing V1 migrations
"""

import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Direct database URL for V2
DATABASE_V2_URL = os.getenv('DATABASE_V2_URL', 'postgresql://webcraft:password@postgres:5432/webcraft_v2_db')

def create_v2_schema():
    """Create V2 database schema using V1 migrations"""
    
    # Connect to V2 database
    engine = create_engine(DATABASE_V2_URL)
    
    with engine.connect() as conn:
        # Enable UUID extension
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        
        # ===== MIGRATION 001: Initial Schema =====
        
        # Users table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS users_v2 (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                full_name VARCHAR(255),
                hashed_password VARCHAR(255),
                is_verified BOOLEAN DEFAULT FALSE,
                is_premium BOOLEAN DEFAULT FALSE,
                avatar_url VARCHAR(500),
                google_id VARCHAR(100) UNIQUE,
                github_id VARCHAR(100) UNIQUE,
                microsoft_id VARCHAR(100) UNIQUE,
                subscription_tier VARCHAR(50) DEFAULT 'free',
                subscription_expires TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Organizations table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS organizations_v2 (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                logo_url VARCHAR(500),
                website VARCHAR(500),
                owner_id UUID REFERENCES users_v2(id) NOT NULL,
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Templates table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS templates (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                category VARCHAR(100) NOT NULL,
                preview_image VARCHAR(500),
                demo_url VARCHAR(500),
                config JSONB DEFAULT '{}',
                pages_config JSONB DEFAULT '{}',
                is_premium BOOLEAN DEFAULT FALSE,
                price INTEGER DEFAULT 0,
                downloads INTEGER DEFAULT 0,
                rating INTEGER DEFAULT 0,
                creator_id UUID REFERENCES users(id) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Apps table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS apps (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) NOT NULL,
                description TEXT,
                app_type VARCHAR(100) NOT NULL,
                owner_id UUID REFERENCES users(id) NOT NULL,
                organization_id UUID REFERENCES organizations(id),
                config JSONB DEFAULT '{}',
                theme_config JSONB DEFAULT '{}',
                seo_config JSONB DEFAULT '{}',
                is_published BOOLEAN DEFAULT FALSE,
                custom_domain VARCHAR(255),
                subdomain VARCHAR(100) UNIQUE,
                template_id UUID REFERENCES templates(id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Pages table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS pages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(100) NOT NULL,
                content JSONB DEFAULT '{}',
                meta_title VARCHAR(255),
                meta_description TEXT,
                meta_keywords VARCHAR(500),
                og_image VARCHAR(500),
                is_homepage BOOLEAN DEFAULT FALSE,
                is_published BOOLEAN DEFAULT TRUE,
                password_protected BOOLEAN DEFAULT FALSE,
                password_hash VARCHAR(255),
                app_id UUID REFERENCES apps(id) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Widgets table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS widgets (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                category VARCHAR(100) NOT NULL,
                config_schema JSONB DEFAULT '{}',
                default_config JSONB DEFAULT '{}',
                component_code TEXT,
                is_premium BOOLEAN DEFAULT FALSE,
                price INTEGER DEFAULT 0,
                downloads INTEGER DEFAULT 0,
                rating INTEGER DEFAULT 0,
                creator_id UUID REFERENCES users(id) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # App Widgets table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS app_widgets (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                config JSONB DEFAULT '{}',
                position JSONB DEFAULT '{}',
                app_id UUID REFERENCES apps(id) NOT NULL,
                widget_id UUID REFERENCES widgets(id) NOT NULL,
                page_id UUID REFERENCES pages(id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # App Collections table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS app_collections (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) NOT NULL,
                description TEXT,
                icon VARCHAR(50) DEFAULT 'database',
                color VARCHAR(20) DEFAULT '#6366f1',
                schema JSONB DEFAULT '[]',
                settings JSONB DEFAULT '{}',
                indexes JSONB DEFAULT '[]',
                validation_rules JSONB DEFAULT '{}',
                webhooks JSONB DEFAULT '[]',
                app_id UUID REFERENCES apps(id) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # App Records table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS app_records (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                data JSONB DEFAULT '{}',
                search_text TEXT,
                sort_order INTEGER DEFAULT 0,
                collection_id UUID REFERENCES app_collections(id) NOT NULL,
                created_by_id UUID REFERENCES users(id),
                updated_by_id UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # API Keys table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS api_keys (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                key_hash VARCHAR(255) UNIQUE NOT NULL,
                key_prefix VARCHAR(20) NOT NULL,
                scopes JSONB DEFAULT '[]',
                rate_limit INTEGER DEFAULT 1000,
                last_used TIMESTAMP,
                usage_count INTEGER DEFAULT 0,
                expires_at TIMESTAMP,
                user_id UUID REFERENCES users(id) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Data Sources table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS data_sources (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                base_url VARCHAR(500) NOT NULL,
                auth_type VARCHAR(50) DEFAULT 'none',
                auth_config JSONB DEFAULT '{}',
                default_headers JSONB DEFAULT '{}',
                rate_limit INTEGER DEFAULT 60,
                timeout INTEGER DEFAULT 30,
                retry_count INTEGER DEFAULT 3,
                cache_ttl INTEGER DEFAULT 300,
                is_connected BOOLEAN DEFAULT FALSE,
                last_tested TIMESTAMP,
                last_error TEXT,
                app_id UUID REFERENCES apps(id) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Data Source Endpoints table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS data_source_endpoints (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                path VARCHAR(500) NOT NULL,
                method VARCHAR(10) DEFAULT 'GET',
                query_params JSONB DEFAULT '{}',
                body_template JSONB,
                headers JSONB DEFAULT '{}',
                response_mapping JSONB,
                pagination_config JSONB,
                data_source_id UUID REFERENCES data_sources(id) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Web Scrapers table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS web_scrapers (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                url VARCHAR(500) NOT NULL,
                fields JSONB NOT NULL,
                pagination_config JSONB,
                headers JSONB DEFAULT '{}',
                cookies JSONB DEFAULT '{}',
                delay_ms INTEGER DEFAULT 1000,
                max_pages INTEGER DEFAULT 10,
                timeout INTEGER DEFAULT 30,
                user_agent VARCHAR(500),
                respect_robots BOOLEAN DEFAULT TRUE,
                cache_ttl INTEGER DEFAULT 3600,
                schedule VARCHAR(100),
                is_scheduled BOOLEAN DEFAULT FALSE,
                status VARCHAR(20) DEFAULT 'idle',
                last_run TIMESTAMP,
                last_error TEXT,
                run_count INTEGER DEFAULT 0,
                app_id UUID REFERENCES apps(id) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Automations table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS automations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                trigger_type VARCHAR(50) NOT NULL,
                trigger_config JSONB DEFAULT '{}',
                workflow_steps JSONB DEFAULT '[]',
                is_enabled BOOLEAN DEFAULT TRUE,
                last_executed_at TIMESTAMP,
                execution_count INTEGER DEFAULT 0,
                app_id UUID REFERENCES apps(id) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # ===== MIGRATION 002: Cross-App Communication =====
        
        # Shared Collections table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS shared_collections (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                collection_id UUID REFERENCES app_collections(id) NOT NULL,
                owner_id UUID REFERENCES users(id) NOT NULL,
                visibility VARCHAR(50) DEFAULT 'private' NOT NULL,
                allowed_apps JSONB DEFAULT '[]',
                permissions JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # App Connections table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS app_connections (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                source_app_id UUID REFERENCES apps(id) NOT NULL,
                target_app_id UUID REFERENCES apps(id) NOT NULL,
                connection_type VARCHAR(50) NOT NULL,
                config JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Cross-App Events table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS cross_app_events (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                source_app_id UUID REFERENCES apps(id) NOT NULL,
                target_app_id UUID REFERENCES apps(id),
                event_type VARCHAR(100) NOT NULL,
                event_data JSONB DEFAULT '{}',
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                processed_at TIMESTAMP,
                error_message TEXT,
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # App Messages table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS app_messages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                from_app_id UUID REFERENCES apps(id) NOT NULL,
                to_app_id UUID REFERENCES apps(id) NOT NULL,
                message_type VARCHAR(100) NOT NULL,
                subject VARCHAR(255),
                payload JSONB DEFAULT '{}',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                read_at TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Data Sync Jobs table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS data_sync_jobs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                source_app_id UUID REFERENCES apps(id) NOT NULL,
                target_app_id UUID REFERENCES apps(id) NOT NULL,
                source_collection_id UUID REFERENCES app_collections(id) NOT NULL,
                target_collection_id UUID REFERENCES app_collections(id) NOT NULL,
                sync_type VARCHAR(50) DEFAULT 'one_way',
                field_mappings JSONB DEFAULT '{}',
                sync_frequency VARCHAR(50) DEFAULT 'manual',
                last_sync_at TIMESTAMP,
                next_sync_at TIMESTAMP,
                sync_status VARCHAR(50) DEFAULT 'active',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        '''))
        
        # Create all indexes
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_app_owner_slug ON apps(owner_id, slug);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_page_app_slug ON pages(app_id, slug);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_collection_app ON app_collections(app_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_record_collection ON app_records(collection_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_datasource_app ON data_sources(app_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_scraper_app ON web_scrapers(app_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_automation_app ON automations(app_id);'))
        
        # Cross-app communication indexes
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_shared_collection_owner ON shared_collections(owner_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_app_connection_source ON app_connections(source_app_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_app_connection_target ON app_connections(target_app_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_cross_app_event_source ON cross_app_events(source_app_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_cross_app_event_target ON cross_app_events(target_app_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_app_message_from ON app_messages(from_app_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_app_message_to ON app_messages(to_app_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_data_sync_source ON data_sync_jobs(source_app_id);'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_data_sync_target ON data_sync_jobs(target_app_id);'))
        
        conn.commit()
        print("✓ V2 database schema created successfully with all migrations")

if __name__ == "__main__":
    create_v2_schema()