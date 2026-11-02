"""add_account_fields

Revision ID: 914a1e564f5a
Revises: 03168c578314
Create Date: 2026-11-02 23:39:13.189174

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '914a1e564f5a'
down_revision: Union[str, Sequence[str], None] = '03168c578314'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS institution VARCHAR(100) DEFAULT 'Bank';
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) NOT NULL DEFAULT 'checking';
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2) DEFAULT NULL;
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('accounts', 'is_primary')
    op.drop_column('accounts', 'credit_limit')
    op.drop_column('accounts', 'account_type')
    op.drop_column('accounts', 'institution')
