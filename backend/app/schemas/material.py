from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class MovimentoMaterialCreate(BaseModel):
    tipo: Literal["entrada", "saida"]

    quantidade: Decimal = Field(
        gt=0
    )

    data: date
    etapa: str | None = None
    observacao: str | None = None


class MovimentoMaterialResponse(BaseModel):
    id: int
    material_id: int
    tipo: str
    quantidade: Decimal
    data: date
    etapa: str | None
    observacao: str | None
    criado_em: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class MaterialObraCreate(BaseModel):
    nome: str = Field(
        min_length=1
    )

    unidade: str = Field(
        default="un",
        min_length=1,
        max_length=20
    )

    estoque_minimo: Decimal = Field(
        default=0,
        ge=0
    )


class MaterialObraResponse(BaseModel):
    id: int
    obra_id: int
    nome: str
    unidade: str
    estoque_minimo: Decimal
    saldo_atual: Decimal
    em_alerta: bool
    movimentos: list[MovimentoMaterialResponse] = Field(
        default_factory=list
    )
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
