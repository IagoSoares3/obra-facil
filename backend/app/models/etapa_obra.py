from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, TYPE_CHECKING

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.obra import Obra

class EtapaObra(Base):
    __tablename__ = "etapas_obra"

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

    descricao: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    ordem: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="nao_iniciada"
    )

    percentual_conclusao: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    data_inicio_prevista: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    data_fim_prevista: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    data_inicio_real: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    data_fim_real: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
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
        back_populates="etapas"
    )