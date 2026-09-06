from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


if TYPE_CHECKING:
    from app.models.obra import Obra


class PessoaEquipe(Base):
    __tablename__ = "pessoas_equipe"

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

    funcao: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True
    )

    contato: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True
    )

    ativo: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
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
        back_populates="equipe"
    )
