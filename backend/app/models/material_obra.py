from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


if TYPE_CHECKING:
    from app.models.movimento_material import MovimentoMaterial
    from app.models.obra import Obra


class MaterialObra(Base):
    __tablename__ = "materiais_obra"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    obra_id: Mapped[int] = mapped_column(
        ForeignKey(
            "obras.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    nome: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    unidade: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="un"
    )

    estoque_minimo: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=0
    )

    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    obra: Mapped["Obra"] = relationship(
        back_populates="materiais"
    )

    movimentos: Mapped[list["MovimentoMaterial"]] = relationship(
        back_populates="material",
        cascade="all, delete-orphan",
        order_by="MovimentoMaterial.data.desc()"
    )

    @property
    def saldo_atual(self) -> Decimal:
        saldo = Decimal("0")

        for movimento in self.movimentos:
            if movimento.tipo == "entrada":
                saldo += movimento.quantidade
            else:
                saldo -= movimento.quantidade

        return saldo

    @property
    def em_alerta(self) -> bool:
        return self.saldo_atual <= self.estoque_minimo
