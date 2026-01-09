"""Rename metadata column to asset_metadata in custom_assets table

Revision ID: rename_metadata_to_asset_metadata
Revises: add_custom_assets_table
Create Date: 2026-01-09 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'rename_metadata_to_asset_metadata'
down_revision = 'add_custom_assets_table'
branch_labels = None
depends_on = None


def upgrade():
    # Rename metadata column to asset_metadata to avoid SQLAlchemy reserved word conflict
    op.alter_column('custom_assets', 'metadata', new_column_name='asset_metadata')


def downgrade():
    # Rename asset_metadata column back to metadata
    op.alter_column('custom_assets', 'asset_metadata', new_column_name='metadata')