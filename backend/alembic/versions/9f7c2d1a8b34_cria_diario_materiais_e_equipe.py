"""cria diario materiais e equipe

Revision ID: 9f7c2d1a8b34
Revises: 61d9902b8795
Create Date: 2026-09-06 02:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9f7c2d1a8b34"
down_revision: Union[str, Sequence[str], None] = "61d9902b8795"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "diarios_obra",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("obra_id", sa.Integer(), nullable=False),
        sa.Column("data", sa.Date(), nullable=False),
        sa.Column("clima", sa.String(length=20), nullable=False),
        sa.Column("quantidade_pessoas", sa.Integer(), nullable=False),
        sa.Column("servicos_executados", sa.Text(), nullable=False),
        sa.Column("materiais_utilizados", sa.Text(), nullable=True),
        sa.Column("ocorrencias", sa.Text(), nullable=True),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False
        ),
        sa.CheckConstraint(
            "clima in ('sol', 'chuva', 'nublado')",
            name="ck_diarios_obra_clima"
        ),
        sa.CheckConstraint(
            "quantidade_pessoas >= 0",
            name="ck_diarios_obra_quantidade_pessoas"
        ),
        sa.ForeignKeyConstraint(
            ["obra_id"],
            ["obras.id"],
            ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(
        op.f("ix_diarios_obra_data"),
        "diarios_obra",
        ["data"],
        unique=False
    )
    op.create_index(
        op.f("ix_diarios_obra_obra_id"),
        "diarios_obra",
        ["obra_id"],
        unique=False
    )

    op.create_table(
        "materiais_obra",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("obra_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("unidade", sa.String(length=20), nullable=False),
        sa.Column(
            "estoque_minimo",
            sa.Numeric(precision=14, scale=2),
            nullable=False
        ),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False
        ),
        sa.CheckConstraint(
            "estoque_minimo >= 0",
            name="ck_materiais_obra_estoque_minimo"
        ),
        sa.ForeignKeyConstraint(
            ["obra_id"],
            ["obras.id"],
            ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(
        op.f("ix_materiais_obra_obra_id"),
        "materiais_obra",
        ["obra_id"],
        unique=False
    )

    op.create_table(
        "pessoas_equipe",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("obra_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("funcao", sa.String(length=80), nullable=True),
        sa.Column("contato", sa.String(length=80), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["obra_id"],
            ["obras.id"],
            ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(
        op.f("ix_pessoas_equipe_obra_id"),
        "pessoas_equipe",
        ["obra_id"],
        unique=False
    )

    op.create_table(
        "movimentos_material",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("material_id", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column(
            "quantidade",
            sa.Numeric(precision=14, scale=2),
            nullable=False
        ),
        sa.Column("data", sa.Date(), nullable=False),
        sa.Column("etapa", sa.String(length=150), nullable=True),
        sa.Column("observacao", sa.Text(), nullable=True),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False
        ),
        sa.CheckConstraint(
            "tipo in ('entrada', 'saida')",
            name="ck_movimentos_material_tipo"
        ),
        sa.CheckConstraint(
            "quantidade > 0",
            name="ck_movimentos_material_quantidade"
        ),
        sa.ForeignKeyConstraint(
            ["material_id"],
            ["materiais_obra.id"],
            ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(
        op.f("ix_movimentos_material_data"),
        "movimentos_material",
        ["data"],
        unique=False
    )
    op.create_index(
        op.f("ix_movimentos_material_material_id"),
        "movimentos_material",
        ["material_id"],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_movimentos_material_material_id"),
        table_name="movimentos_material"
    )
    op.drop_index(
        op.f("ix_movimentos_material_data"),
        table_name="movimentos_material"
    )
    op.drop_table("movimentos_material")

    op.drop_index(
        op.f("ix_pessoas_equipe_obra_id"),
        table_name="pessoas_equipe"
    )
    op.drop_table("pessoas_equipe")

    op.drop_index(
        op.f("ix_materiais_obra_obra_id"),
        table_name="materiais_obra"
    )
    op.drop_table("materiais_obra")

    op.drop_index(
        op.f("ix_diarios_obra_obra_id"),
        table_name="diarios_obra"
    )
    op.drop_index(
        op.f("ix_diarios_obra_data"),
        table_name="diarios_obra"
    )
    op.drop_table("diarios_obra")
