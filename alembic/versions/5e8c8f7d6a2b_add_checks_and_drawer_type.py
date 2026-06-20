"""add checks and drawer type

Revision ID: 5e8c8f7d6a2b
Revises: b1eccc6417f6
Create Date: 2026-06-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5e8c8f7d6a2b'
down_revision: Union[str, Sequence[str], None] = 'b1eccc6417f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


drawer_type_enum = sa.Enum('cards', 'checks', name='drawer_type')
carnet_size_enum = sa.Enum('25', '50', name='carnet_size')


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    drawer_type_enum.create(bind, checkfirst=True)
    carnet_size_enum.create(bind, checkfirst=True)

    op.add_column(
        'drawers',
        sa.Column(
            'drawer_type',
            drawer_type_enum,
            nullable=False,
            server_default='cards',
        ),
    )

    op.create_table(
        'checks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('check_number', sa.String(), nullable=False),
        sa.Column('montant', sa.Numeric(12, 2), nullable=False),
        sa.Column('carnet_size', carnet_size_enum, nullable=False),
        sa.Column('client_name', sa.String(), nullable=False),
        sa.Column('row', sa.Integer(), nullable=False),
        sa.Column('col', sa.Integer(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('drawer_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['drawer_id'], ['drawers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_checks_id'), 'checks', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_checks_id'), table_name='checks')
    op.drop_table('checks')
    op.drop_column('drawers', 'drawer_type')

    bind = op.get_bind()
    carnet_size_enum.drop(bind, checkfirst=True)
    drawer_type_enum.drop(bind, checkfirst=True)
