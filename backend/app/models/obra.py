from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


if TYPE_CHECKING:
    from app.models.diario_obra import DiarioObra
    from app.models.etapa_obra import EtapaObra
    from app.models.material_obra import MaterialObra
    from app.models.pessoa_equipe import PessoaEquipe


class Obra(Base):
    __tablename__ = "obras"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    nome: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    tipo_obra: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    endereco: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    data_inicio: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    data_previsao_conclusao: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    data_conclusao: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="planejamento"
    )

    orcamento_previsto: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True
    )

    latitude: Mapped[Decimal | None] = mapped_column(
        Numeric(9, 6),
        nullable=True
    )

    longitude: Mapped[Decimal | None] = mapped_column(
        Numeric(9, 6),
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

    etapas: Mapped[list["EtapaObra"]] = relationship(
        back_populates="obra",
        cascade="all, delete-orphan",
        order_by="EtapaObra.ordem"
    )

    diarios: Mapped[list["DiarioObra"]] = relationship(
        back_populates="obra",
        cascade="all, delete-orphan",
        order_by="DiarioObra.data.desc()"
    )

    materiais: Mapped[list["MaterialObra"]] = relationship(
        back_populates="obra",
        cascade="all, delete-orphan",
        order_by="MaterialObra.nome"
    )

    equipe: Mapped[list["PessoaEquipe"]] = relationship(
        back_populates="obra",
        cascade="all, delete-orphan",
        order_by="PessoaEquipe.nome"
    )
