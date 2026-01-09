"""Initial database schema

Revision ID: 001
Revises: 
Create Date: 2026-01-08
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('username', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('full_name', sa.String(255)),
        sa.Column('hashed_password', sa.String(255)),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('is_premium', sa.Boolean(), default=False),
        sa.Column('avatar_url', sa.String(500)),
        sa.Column('google_id', sa.String(100), unique=True, nullable=True),
        sa.Column('github_id', sa.String(100), unique=True, nullable=True),
        sa.Column('microsoft_id', sa.String(100), unique=True, nullable=True),
        sa.Column('subscription_tier', sa.String(50), default='free'),
        sa.Column('subscription_expires', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Organizations table
    op.create_table('organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('description', sa.Text()),
        sa.Column('logo_url', sa.String(500)),
        sa.Column('website', sa.String(500)),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('settings', postgresql.JSONB(), default={}),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Templates table
    op.create_table('templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('description', sa.Text()),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('preview_image', sa.String(500)),
        sa.Column('demo_url', sa.String(500)),
        sa.Column('config', postgresql.JSONB(), default={}),
        sa.Column('pages_config', postgresql.JSONB(), default={}),
        sa.Column('is_premium', sa.Boolean(), default=False),
        sa.Column('price', sa.Integer(), default=0),
        sa.Column('downloads', sa.Integer(), default=0),
        sa.Column('rating', sa.Integer(), default=0),
        sa.Column('creator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Apps table
    op.create_table('apps',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False, index=True),
        sa.Column('description', sa.Text()),
        sa.Column('app_type', sa.String(100), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=True),
        sa.Column('config', postgresql.JSONB(), default={}),
        sa.Column('theme_config', postgresql.JSONB(), default={}),
        sa.Column('seo_config', postgresql.JSONB(), default={}),
        sa.Column('is_published', sa.Boolean(), default=False),
        sa.Column('custom_domain', sa.String(255), nullable=True),
        sa.Column('subdomain', sa.String(100), unique=True, nullable=True),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('templates.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_app_owner_slug', 'apps', ['owner_id', 'slug'])

    # Pages table
    op.create_table('pages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('content', postgresql.JSONB(), default={}),
        sa.Column('meta_title', sa.String(255)),
        sa.Column('meta_description', sa.Text()),
        sa.Column('meta_keywords', sa.String(500)),
        sa.Column('og_image', sa.String(500)),
        sa.Column('is_homepage', sa.Boolean(), default=False),
        sa.Column('is_published', sa.Boolean(), default=True),
        sa.Column('password_protected', sa.Boolean(), default=False),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_page_app_slug', 'pages', ['app_id', 'slug'])

    # Widgets table
    op.create_table('widgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('description', sa.Text()),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('config_schema', postgresql.JSONB(), default={}),
        sa.Column('default_config', postgresql.JSONB(), default={}),
        sa.Column('component_code', sa.Text()),
        sa.Column('is_premium', sa.Boolean(), default=False),
        sa.Column('price', sa.Integer(), default=0),
        sa.Column('downloads', sa.Integer(), default=0),
        sa.Column('rating', sa.Integer(), default=0),
        sa.Column('creator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # App Widgets table
    op.create_table('app_widgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('config', postgresql.JSONB(), default={}),
        sa.Column('position', postgresql.JSONB(), default={}),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('widget_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('widgets.id'), nullable=False),
        sa.Column('page_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('pages.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Data Sources table
    op.create_table('data_sources',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('base_url', sa.String(500), nullable=False),
        sa.Column('auth_type', sa.String(50), default='none'),
        sa.Column('auth_config', postgresql.JSONB(), default={}),
        sa.Column('default_headers', postgresql.JSONB(), default={}),
        sa.Column('rate_limit', sa.Integer(), default=60),
        sa.Column('timeout', sa.Integer(), default=30),
        sa.Column('retry_count', sa.Integer(), default=3),
        sa.Column('cache_ttl', sa.Integer(), default=300),
        sa.Column('is_connected', sa.Boolean(), default=False),
        sa.Column('last_tested', sa.DateTime(), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_datasource_app', 'data_sources', ['app_id'])

    # Data Source Endpoints table
    op.create_table('data_source_endpoints',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('path', sa.String(500), nullable=False),
        sa.Column('method', sa.String(10), default='GET'),
        sa.Column('query_params', postgresql.JSONB(), default={}),
        sa.Column('body_template', postgresql.JSONB(), nullable=True),
        sa.Column('headers', postgresql.JSONB(), default={}),
        sa.Column('response_mapping', postgresql.JSONB(), nullable=True),
        sa.Column('pagination_config', postgresql.JSONB(), nullable=True),
        sa.Column('data_source_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('data_sources.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Web Scrapers table
    op.create_table('web_scrapers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('url', sa.String(500), nullable=False),
        sa.Column('fields', postgresql.JSONB(), nullable=False),
        sa.Column('pagination_config', postgresql.JSONB(), nullable=True),
        sa.Column('headers', postgresql.JSONB(), default={}),
        sa.Column('cookies', postgresql.JSONB(), default={}),
        sa.Column('delay_ms', sa.Integer(), default=1000),
        sa.Column('max_pages', sa.Integer(), default=10),
        sa.Column('timeout', sa.Integer(), default=30),
        sa.Column('user_agent', sa.String(500)),
        sa.Column('respect_robots', sa.Boolean(), default=True),
        sa.Column('cache_ttl', sa.Integer(), default=3600),
        sa.Column('schedule', sa.String(100), nullable=True),
        sa.Column('is_scheduled', sa.Boolean(), default=False),
        sa.Column('status', sa.String(20), default='idle'),
        sa.Column('last_run', sa.DateTime(), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('run_count', sa.Integer(), default=0),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_scraper_app', 'web_scrapers', ['app_id'])

    # Automations table
    op.create_table('automations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('trigger_type', sa.String(50), nullable=False),
        sa.Column('trigger_config', postgresql.JSONB(), default={}),
        sa.Column('workflow_steps', postgresql.JSONB(), default=[]),
        sa.Column('is_enabled', sa.Boolean(), default=True),
        sa.Column('last_executed_at', sa.DateTime(), nullable=True),
        sa.Column('execution_count', sa.Integer(), default=0),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_automation_app', 'automations', ['app_id'])

    # Automation Logs table
    op.create_table('automation_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('automation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('automations.id'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('trigger_data', postgresql.JSONB(), default={}),
        sa.Column('execution_result', postgresql.JSONB(), default={}),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), default=0),
        sa.Column('steps_executed', sa.Integer(), default=0),
        sa.Column('started_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Static Exports table
    op.create_table('static_exports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('format', sa.String(20), nullable=False),
        sa.Column('options', postgresql.JSONB(), default={}),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('progress', sa.Integer(), default=0),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(500), nullable=True),
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        sa.Column('download_url', sa.String(500), nullable=True),
        sa.Column('pages_count', sa.Integer(), default=0),
        sa.Column('assets_count', sa.Integer(), default=0),
        sa.Column('lighthouse_score', postgresql.JSONB(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # App Collections table (user databases)
    op.create_table('app_collections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('icon', sa.String(50), default='database'),
        sa.Column('color', sa.String(20), default='#6366f1'),
        sa.Column('schema', postgresql.JSONB(), default=[]),
        sa.Column('settings', postgresql.JSONB(), default={}),
        sa.Column('indexes', postgresql.JSONB(), default=[]),
        sa.Column('validation_rules', postgresql.JSONB(), default={}),
        sa.Column('webhooks', postgresql.JSONB(), default=[]),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_collection_app', 'app_collections', ['app_id'])

    # App Records table (records in user collections)
    op.create_table('app_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('data', postgresql.JSONB(), default={}),
        sa.Column('search_text', sa.Text()),
        sa.Column('sort_order', sa.Integer(), default=0),
        sa.Column('collection_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('app_collections.id'), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('updated_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_record_collection', 'app_records', ['collection_id'])
    op.create_index('idx_record_data', 'app_records', ['data'], postgresql_using='gin')

    # App Files table
    op.create_table('app_files',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('original_filename', sa.String(255), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=False),
        sa.Column('storage_provider', sa.String(50), default='local'),
        sa.Column('storage_path', sa.String(500), nullable=False),
        sa.Column('public_url', sa.String(500), nullable=True),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('thumbnail_url', sa.String(500), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), default={}),
        sa.Column('folder', sa.String(255), default='/'),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('uploaded_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_file_app', 'app_files', ['app_id'])

    # App Forms table
    op.create_table('app_forms',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('fields', postgresql.JSONB(), default=[]),
        sa.Column('settings', postgresql.JSONB(), default={}),
        sa.Column('style', postgresql.JSONB(), default={}),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('submission_count', sa.Integer(), default=0),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_form_app', 'app_forms', ['app_id'])

    # App Form Submissions table
    op.create_table('app_form_submissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('data', postgresql.JSONB(), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('referrer', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), default='new'),
        sa.Column('form_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('app_forms.id'), nullable=False),
        sa.Column('submitted_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_submission_form', 'app_form_submissions', ['form_id'])

    # Organization Members table
    op.create_table('organization_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('role', sa.String(50), default='member'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # API Keys table
    op.create_table('api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('key_hash', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('key_prefix', sa.String(20), nullable=False),
        sa.Column('scopes', postgresql.JSONB(), default=[]),
        sa.Column('rate_limit', sa.Integer(), default=1000),
        sa.Column('last_used', sa.DateTime(), nullable=True),
        sa.Column('usage_count', sa.Integer(), default=0),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Integrations table
    op.create_table('integrations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('provider', sa.String(100), nullable=False),
        sa.Column('config', postgresql.JSONB(), default={}),
        sa.Column('credentials', postgresql.JSONB(), default={}),
        sa.Column('is_connected', sa.Boolean(), default=False),
        sa.Column('last_sync', sa.DateTime(), nullable=True),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # SEO Data table
    op.create_table('seo_data',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('page_speed_score', sa.Integer(), default=0),
        sa.Column('seo_score', sa.Integer(), default=0),
        sa.Column('accessibility_score', sa.Integer(), default=0),
        sa.Column('structured_data', postgresql.JSONB(), default={}),
        sa.Column('meta_tags', postgresql.JSONB(), default={}),
        sa.Column('organic_traffic', sa.Integer(), default=0),
        sa.Column('search_impressions', sa.Integer(), default=0),
        sa.Column('click_through_rate', sa.Integer(), default=0),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Scraper Results table
    op.create_table('scraper_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('scraper_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('web_scrapers.id'), nullable=False),
        sa.Column('data', postgresql.JSONB(), nullable=False),
        sa.Column('url', sa.String(500), nullable=False),
        sa.Column('page_count', sa.Integer(), default=0),
        sa.Column('item_count', sa.Integer(), default=0),
        sa.Column('duration_ms', sa.Integer(), default=0),
        sa.Column('status', sa.String(20), default='completed'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_result_scraper', 'scraper_results', ['scraper_id'])

    # Data Source Cache table
    op.create_table('data_source_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('cache_key', sa.String(64), unique=True, nullable=False, index=True),
        sa.Column('endpoint_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('data_source_endpoints.id'), nullable=False),
        sa.Column('response_data', postgresql.JSONB(), nullable=False),
        sa.Column('request_params', postgresql.JSONB(), default={}),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('hit_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Widget Data Bindings table
    op.create_table('widget_data_bindings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('app_widget_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('app_widgets.id'), nullable=False),
        sa.Column('data_source_endpoint_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('data_source_endpoints.id'), nullable=True),
        sa.Column('scraper_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('web_scrapers.id'), nullable=True),
        sa.Column('binding_type', sa.String(20), nullable=False),
        sa.Column('field_mappings', postgresql.JSONB(), default={}),
        sa.Column('refresh_interval', sa.Integer(), default=0),
        sa.Column('transform_script', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_binding_widget', 'widget_data_bindings', ['app_widget_id'])

    # Notifications table
    op.create_table('notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(50), default='info'),
        sa.Column('category', sa.String(50), default='system'),
        sa.Column('action_url', sa.String(500), nullable=True),
        sa.Column('action_label', sa.String(100), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), default={}),
        sa.Column('is_read', sa.Boolean(), default=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_notification_user', 'notifications', ['user_id'])
    op.create_index('idx_notification_read', 'notifications', ['user_id', 'is_read'])

    # Analytics Events table
    op.create_table('analytics_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('event_name', sa.String(255), nullable=False),
        sa.Column('page_path', sa.String(500)),
        sa.Column('page_title', sa.String(255)),
        sa.Column('referrer', sa.String(500)),
        sa.Column('user_agent', sa.String(500)),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('country', sa.String(2)),
        sa.Column('city', sa.String(100)),
        sa.Column('device_type', sa.String(20)),
        sa.Column('browser', sa.String(50)),
        sa.Column('os', sa.String(50)),
        sa.Column('session_id', sa.String(100)),
        sa.Column('visitor_id', sa.String(100)),
        sa.Column('properties', postgresql.JSONB(), default={}),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_analytics_app', 'analytics_events', ['app_id'])
    op.create_index('idx_analytics_created', 'analytics_events', ['created_at'])
    op.create_index('idx_analytics_event', 'analytics_events', ['app_id', 'event_type'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('analytics_events')
    op.drop_table('notifications')
    op.drop_table('widget_data_bindings')
    op.drop_table('data_source_cache')
    op.drop_table('scraper_results')
    op.drop_table('seo_data')
    op.drop_table('integrations')
    op.drop_table('api_keys')
    op.drop_table('organization_members')
    op.drop_table('app_form_submissions')
    op.drop_table('app_forms')
    op.drop_table('app_files')
    op.drop_table('app_records')
    op.drop_table('app_collections')
    op.drop_table('static_exports')
    op.drop_table('automation_logs')
    op.drop_table('automations')
    op.drop_table('web_scrapers')
    op.drop_table('data_source_endpoints')
    op.drop_table('data_sources')
    op.drop_table('app_widgets')
    op.drop_table('widgets')
    op.drop_table('pages')
    op.drop_table('apps')
    op.drop_table('templates')
    op.drop_table('organizations')
    op.drop_table('users')

    # App Forms table
    op.create_table('app_forms',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('fields', postgresql.JSONB(), default=[]),
        sa.Column('settings', postgresql.JSONB(), default={}),
        sa.Column('style', postgresql.JSONB(), default={}),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('submission_count', sa.Integer(), default=0),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_form_app', 'app_forms', ['app_id'])

    # App Form Submissions table
    op.create_table('app_form_submissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('data', postgresql.JSONB(), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('referrer', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), default='new'),
        sa.Column('form_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('app_forms.id'), nullable=False),
        sa.Column('submitted_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_submission_form', 'app_form_submissions', ['form_id'])

    # Organization Members table
    op.create_table('organization_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('role', sa.String(50), default='member'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # API Keys table
    op.create_table('api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('key_hash', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('key_prefix', sa.String(20), nullable=False),
        sa.Column('scopes', postgresql.JSONB(), default=[]),
        sa.Column('rate_limit', sa.Integer(), default=1000),
        sa.Column('last_used', sa.DateTime(), nullable=True),
        sa.Column('usage_count', sa.Integer(), default=0),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Integrations table
    op.create_table('integrations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('provider', sa.String(100), nullable=False),
        sa.Column('config', postgresql.JSONB(), default={}),
        sa.Column('credentials', postgresql.JSONB(), default={}),
        sa.Column('is_connected', sa.Boolean(), default=False),
        sa.Column('last_sync', sa.DateTime(), nullable=True),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # SEO Data table
    op.create_table('seo_data',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('page_speed_score', sa.Integer(), default=0),
        sa.Column('seo_score', sa.Integer(), default=0),
        sa.Column('accessibility_score', sa.Integer(), default=0),
        sa.Column('structured_data', postgresql.JSONB(), default={}),
        sa.Column('meta_tags', postgresql.JSONB(), default={}),
        sa.Column('organic_traffic', sa.Integer(), default=0),
        sa.Column('search_impressions', sa.Integer(), default=0),
        sa.Column('click_through_rate', sa.Integer(), default=0),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Scraper Results table
    op.create_table('scraper_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('scraper_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('web_scrapers.id'), nullable=False),
        sa.Column('data', postgresql.JSONB(), nullable=False),
        sa.Column('url', sa.String(500), nullable=False),
        sa.Column('page_count', sa.Integer(), default=0),
        sa.Column('item_count', sa.Integer(), default=0),
        sa.Column('duration_ms', sa.Integer(), default=0),
        sa.Column('status', sa.String(20), default='completed'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_result_scraper', 'scraper_results', ['scraper_id'])

    # Data Source Cache table
    op.create_table('data_source_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('cache_key', sa.String(64), unique=True, nullable=False, index=True),
        sa.Column('endpoint_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('data_source_endpoints.id'), nullable=False),
        sa.Column('response_data', postgresql.JSONB(), nullable=False),
        sa.Column('request_params', postgresql.JSONB(), default={}),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('hit_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Widget Data Bindings table
    op.create_table('widget_data_bindings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('app_widget_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('app_widgets.id'), nullable=False),
        sa.Column('data_source_endpoint_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('data_source_endpoints.id'), nullable=True),
        sa.Column('scraper_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('web_scrapers.id'), nullable=True),
        sa.Column('binding_type', sa.String(20), nullable=False),
        sa.Column('field_mappings', postgresql.JSONB(), default={}),
        sa.Column('refresh_interval', sa.Integer(), default=0),
        sa.Column('transform_script', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_binding_widget', 'widget_data_bindings', ['app_widget_id'])

    # App Relations table (for linking records between collections)
    op.create_table('app_relations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('source_collection_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('app_collections.id'), nullable=False),
        sa.Column('source_record_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('app_records.id'), nullable=False),
        sa.Column('source_field', sa.String(100), nullable=False),
        sa.Column('target_collection_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('app_collections.id'), nullable=False),
        sa.Column('target_record_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('app_records.id'), nullable=False),
        sa.Column('relation_type', sa.String(20), default='link'),
        sa.Column('sort_order', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_relation_source', 'app_relations', ['source_collection_id', 'source_record_id'])
    op.create_index('idx_relation_target', 'app_relations', ['target_collection_id', 'target_record_id'])

    # Notifications table
    op.create_table('notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(50), default='info'),
        sa.Column('link', sa.String(500), nullable=True),
        sa.Column('is_read', sa.Boolean(), default=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), default={}),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_notification_user', 'notifications', ['user_id'])
    op.create_index('idx_notification_read', 'notifications', ['user_id', 'is_read'])

    # Analytics Events table
    op.create_table('analytics_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('event_data', postgresql.JSONB(), default={}),
        sa.Column('page_path', sa.String(500), nullable=True),
        sa.Column('session_id', sa.String(100), nullable=True),
        sa.Column('visitor_id', sa.String(100), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('referrer', sa.String(500), nullable=True),
        sa.Column('country', sa.String(2), nullable=True),
        sa.Column('device_type', sa.String(20), nullable=True),
        sa.Column('browser', sa.String(50), nullable=True),
        sa.Column('os', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_analytics_app', 'analytics_events', ['app_id'])
    op.create_index('idx_analytics_event', 'analytics_events', ['app_id', 'event_type'])
    op.create_index('idx_analytics_created', 'analytics_events', ['created_at'])


def downgrade() -> None:
    # Drop tables in reverse order of creation
    op.drop_table('analytics_events')
    op.drop_table('notifications')
    op.drop_table('app_relations')
    op.drop_table('widget_data_bindings')
    op.drop_table('data_source_cache')
    op.drop_table('scraper_results')
    op.drop_table('seo_data')
    op.drop_table('integrations')
    op.drop_table('api_keys')
    op.drop_table('organization_members')
    op.drop_table('app_form_submissions')
    op.drop_table('app_forms')
    op.drop_table('app_files')
    op.drop_table('app_records')
    op.drop_table('app_collections')
    op.drop_table('static_exports')
    op.drop_table('automation_logs')
    op.drop_table('automations')
    op.drop_table('web_scrapers')
    op.drop_table('data_source_endpoints')
    op.drop_table('data_sources')
    op.drop_table('app_widgets')
    op.drop_table('widgets')
    op.drop_table('pages')
    op.drop_table('apps')
    op.drop_table('templates')
    op.drop_table('organizations')
    op.drop_table('users')

    # Integrations table
    op.create_table('integrations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('provider', sa.String(100), nullable=False),
        sa.Column('config', postgresql.JSONB(), default={}),
        sa.Column('credentials', postgresql.JSONB(), default={}),
        sa.Column('is_connected', sa.Boolean(), default=False),
        sa.Column('last_sync', sa.DateTime(), nullable=True),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # SEO Data table
    op.create_table('seo_data',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('page_speed_score', sa.Integer(), default=0),
        sa.Column('seo_score', sa.Integer(), default=0),
        sa.Column('accessibility_score', sa.Integer(), default=0),
        sa.Column('structured_data', postgresql.JSONB(), default={}),
        sa.Column('meta_tags', postgresql.JSONB(), default={}),
        sa.Column('organic_traffic', sa.Integer(), default=0),
        sa.Column('search_impressions', sa.Integer(), default=0),
        sa.Column('click_through_rate', sa.Integer(), default=0),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Scraper Results table
    op.create_table('scraper_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('scraper_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('web_scrapers.id'), nullable=False),
        sa.Column('data', postgresql.JSONB(), nullable=False),
        sa.Column('url', sa.String(500), nullable=False),
        sa.Column('page_count', sa.Integer(), default=0),
        sa.Column('item_count', sa.Integer(), default=0),
        sa.Column('duration_ms', sa.Integer(), default=0),
        sa.Column('status', sa.String(20), default='completed'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_result_scraper', 'scraper_results', ['scraper_id'])

    # Data Source Cache table
    op.create_table('data_source_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('cache_key', sa.String(64), unique=True, nullable=False, index=True),
        sa.Column('endpoint_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('data_source_endpoints.id'), nullable=False),
        sa.Column('response_data', postgresql.JSONB(), nullable=False),
        sa.Column('request_params', postgresql.JSONB(), default={}),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('hit_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )

    # Widget Data Bindings table
    op.create_table('widget_data_bindings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('app_widget_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('app_widgets.id'), nullable=False),
        sa.Column('data_source_endpoint_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('data_source_endpoints.id'), nullable=True),
        sa.Column('scraper_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('web_scrapers.id'), nullable=True),
        sa.Column('binding_type', sa.String(20), nullable=False),
        sa.Column('field_mappings', postgresql.JSONB(), default={}),
        sa.Column('refresh_interval', sa.Integer(), default=0),
        sa.Column('transform_script', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
    )
    op.create_index('idx_binding_widget', 'widget_data_bindings', ['app_widget_id'])

    # Analytics Events table
    op.create_table('analytics_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('app_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('event_name', sa.String(100), nullable=False),
        sa.Column('page_path', sa.String(500)),
        sa.Column('page_title', sa.Str
