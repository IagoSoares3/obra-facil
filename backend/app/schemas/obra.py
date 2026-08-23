from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ObraCreate(BaseModel):
    nome: str
    tipo_obra: str
    endereco: str
    data_inicio: date

    data_previsao_conclusao: date | None = None
    orcamento_previsto: Decimal | None = None

    latitude: Decimal | None = None
    longitude: Decimal | None = None


class ObraResponse(BaseModel):
    id: int
    nome: str
    tipo_obra: str
    endereco: str

    data_inicio: date
    data_previsao_conclusao: date | None
    data_conclusao: date | None

    status: str

    orcamento_previsto: Decimal | None

    latitude: Decimal | None
    longitude: Decimal | None

    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(
        from_attributes=True
    )