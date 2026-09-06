from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PessoaEquipeCreate(BaseModel):
    nome: str = Field(
        min_length=1
    )

    funcao: str | None = None
    contato: str | None = None
    ativo: bool = True


class PessoaEquipeResponse(BaseModel):
    id: int
    obra_id: int
    nome: str
    funcao: str | None
    contato: str | None
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
