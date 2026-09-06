from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


if TYPE_CHECKING:
    from app.models.obra import Obra


class DiarioObra(Base):
    __tablename__ = "diarios_obra"

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

    data: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True
    )

    clima: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="sol"
    )

    quantidade_pessoas: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    etapa: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    servicos_executados: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    materiais_utilizados: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    ocorrencias: Mapped[str | None] = mapped_column(
        Text,
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
        back_populates="diarios"
    )
