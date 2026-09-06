from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


if TYPE_CHECKING:
    from app.models.material_obra import MaterialObra


class MovimentoMaterial(Base):
    __tablename__ = "movimentos_material"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    material_id: Mapped[int] = mapped_column(
        ForeignKey(
            "materiais_obra.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    tipo: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    quantidade: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False
    )

    data: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True
    )

    etapa: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    observacao: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    material: Mapped["MaterialObra"] = relationship(
        back_populates="movimentos"
    )
