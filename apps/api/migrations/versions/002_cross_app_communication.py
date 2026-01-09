"""
Cross-App Communication Tables
Add tables for cross-app communication, data sharing, and events

Revision ID: 002_cross_app_communication
Revises: 001_initial_schema
Create Date: 2024-01-09 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers
revision = '002_cross_app_communication'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade():
    """Add cross-app communication tables"""
    
    # Shared Collections table
    op.create_table(
        'shared_collections',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('collection_id', UUID(as_uuid=True), sa.ForeignKey('app_collections.id'), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('visibility', sa.String(50), default='private', nullable=False),
        sa.Column('allowed_apps', JSONB, default=sa.text("'[]'::jsonb")),
        sa.Column('permissions', JSONB, default=sa.text("'{}'::jsonb")),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_active', sa.Boolean, default=True)
    )
    
    # Indexes for shared collections
    op.create_index('idx_shared_collection_owner', 'shared_collections', ['owner_id'])
    op.create_index('idx_shared_collection_visibility', 'shared_collections', ['visibility'])
    op.create_index('idx_shared_collection_active', 'shared_collections', ['is_active'])
    
    # App Connections table
    op.create_table(
        'app_connections',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('source_app_id', UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('target_app_id', UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('connection_type', sa.String(50), nullable=False),
        sa.Column('config', JSONB, default=sa.text("'{}'::jsonb")),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_active', sa.Boolean, default=True)
    )
    
    # Indexes for app connections
    op.create_index('idx_app_connection_source', 'app_connections', ['source_app_id'])
    op.create_index('idx_app_connection_target', 'app_connections', ['target_app_id'])
    op.create_index('idx_app_connection_type', 'app_connections', ['connection_type'])
    op.create_index('idx_app_connection_active', 'app_connections', ['is_active'])
    
    # Cross-App Events table
    op.create_table(
        'cross_app_events',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('source_app_id', UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('target_app_id', UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('event_data', JSONB, default=sa.text("'{}'::jsonb")),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('processed_at', sa.DateTime, nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True)
    )
    
    # Indexes for cross-app events
    op.create_index('idx_cross_app_event_source', 'cross_app_events', ['source_app_id'])
    op.create_index('idx_cross_app_event_target', 'cross_app_events', ['target_app_id'])
    op.create_index('idx_cross_app_event_type', 'cross_app_events', ['event_type'])
    op.create_index('idx_cross_app_event_status', 'cross_app_events', ['status'])
    op.create_index('idx_cross_app_event_created', 'cross_app_events', ['created_at'])
    
    # App Messages table
    op.create_table(
        'app_messages',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('from_app_id', UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('to_app_id', UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('message_type', sa.String(100), nullable=False),
        sa.Column('subject', sa.String(255), nullable=True),
        sa.Column('payload', JSONB, default=sa.text("'{}'::jsonb")),
        sa.Column('is_read', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('read_at', sa.DateTime, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True)
    )
    
    # Indexes for app messages
    op.create_index('idx_app_message_from', 'app_messages', ['from_app_id'])
    op.create_index('idx_app_message_to', 'app_messages', ['to_app_id'])
    op.create_index('idx_app_message_type', 'app_messages', ['message_type'])
    op.create_index('idx_app_message_read', 'app_messages', ['is_read'])
    op.create_index('idx_app_message_created', 'app_messages', ['created_at'])
    
    # Data Sync Jobs table
    op.create_table(
        'data_sync_jobs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('source_app_id', UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('target_app_id', UUID(as_uuid=True), sa.ForeignKey('apps.id'), nullable=False),
        sa.Column('source_collection_id', UUID(as_uuid=True), sa.ForeignKey('app_collections.id'), nullable=False),
        sa.Column('target_collection_id', UUID(as_uuid=True), sa.ForeignKey('app_collections.id'), nullable=False),
        sa.Column('sync_type', sa.String(50), default='one_way'),
        sa.Column('field_mappings', JSONB, default=sa.text("'{}'::jsonb")),
        sa.Column('sync_frequency', sa.String(50), default='manual'),
        sa.Column('last_sync_at', sa.DateTime, nullable=True),
        sa.Column('next_sync_at', sa.DateTime, nullable=True),
        sa.Column('sync_status', sa.String(50), default='active'),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_active', sa.Boolean, default=True)
    )
    
    # Indexes for data sync jobs
    op.create_index('idx_data_sync_source', 'data_sync_jobs', ['source_app_id'])
    op.create_index('idx_data_sync_target', 'data_sync_jobs', ['target_app_id'])
    op.create_index('idx_data_sync_status', 'data_sync_jobs', ['sync_status'])
    op.create_index('idx_data_sync_frequency', 'data_sync_jobs', ['sync_frequency'])
    op.create_index('idx_data_sync_next', 'data_sync_jobs', ['next_sync_at'])


def downgrade():
    """Remove cross-app communication tables"""
    
    # Drop indexes first
    op.drop_index('idx_data_sync_next')
    op.drop_index('idx_data_sync_frequency')
    op.drop_index('idx_data_sync_status')
    op.drop_index('idx_data_sync_target')
    op.drop_index('idx_data_sync_source')
    
    op.drop_index('idx_app_message_created')
    op.drop_index('idx_app_message_read')
    op.drop_index('idx_app_message_type')
    op.drop_index('idx_app_message_to')
    op.drop_index('idx_app_message_from')
    
    op.drop_index('idx_cross_app_event_created')
    op.drop_index('idx_cross_app_event_status')
    op.drop_index('idx_cross_app_event_type')
    op.drop_index('idx_cross_app_event_target')
    op.drop_index('idx_cross_app_event_source')
    
    op.drop_index('idx_app_connection_active')
    op.drop_index('idx_app_connection_type')
    op.drop_index('idx_app_connection_target')
    op.drop_index('idx_app_connection_source')
    
    op.drop_index('idx_shared_collection_active')
    op.drop_index('idx_shared_collection_visibility')
    op.drop_index('idx_shared_collection_owner')
    
    # Drop tables
    op.drop_table('data_sync_jobs')
    op.drop_table('app_messages')
    op.drop_table('cross_app_events')
    op.drop_table('app_connections')
    op.drop_table('shared_collections')