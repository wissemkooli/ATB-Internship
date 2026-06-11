"""add_create_to_auditactiontype

Revision ID: d09bf318491e
Revises: 3f44437ffdbe
Create Date: 2026-06-11 17:53:46.322748

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd09bf318491e'
down_revision: Union[str, Sequence[str], None] = '3f44437ffdbe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
