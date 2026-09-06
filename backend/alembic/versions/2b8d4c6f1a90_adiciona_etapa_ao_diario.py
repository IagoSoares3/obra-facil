"""adiciona etapa ao diario

Revision ID: 2b8d4c6f1a90
Revises: 9f7c2d1a8b34
Create Date: 2026-09-06 18:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2b8d4c6f1a90"
down_revision: Union[str, Sequence[str], None] = "9f7c2d1a8b34"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "diarios_obra",
        sa.Column(
            "etapa",
            sa.String(length=150),
            nullable=True
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column(
        "diarios_obra",
        "etapa"
    )
