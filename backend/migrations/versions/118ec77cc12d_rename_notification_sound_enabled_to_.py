"""rename notification_sound_enabled to notifications_enabled

Revision ID: 118ec77cc12d
Revises: 2b31227aabdf
Create Date: 2026-02-26 00:26:00.536110

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '118ec77cc12d'
down_revision: Union[str, None] = '2b31227aabdf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'user_settings',
        'notification_sound_enabled',
        new_column_name='notifications_enabled',
    )


def downgrade() -> None:
    op.alter_column(
        'user_settings',
        'notifications_enabled',
        new_column_name='notification_sound_enabled',
    )
