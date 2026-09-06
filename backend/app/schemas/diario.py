from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DiarioObraCreate(BaseModel):
    data: date
    clima: Literal["sol", "chuva", "nublado"] = "sol"

    quantidade_pessoas: int = Field(
        default=0,
        ge=0
    )

    etapa: str | None = None

    servicos_executados: str = Field(
        min_length=1
    )

    materiais_utilizados: str | None = None
    ocorrencias: str | None = None


class DiarioObraResponse(BaseModel):
    id: int
    obra_id: int
    data: date
    clima: str
    quantidade_pessoas: int
    etapa: str | None
    servicos_executados: str
    materiais_utilizados: str | None
    ocorrencias: str | None
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
