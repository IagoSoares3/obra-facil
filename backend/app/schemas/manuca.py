from typing import Literal

from pydantic import BaseModel, Field


class ManucaMensagem(BaseModel):
    papel: Literal["usuario", "manuca"]

    texto: str = Field(
        min_length=1,
        max_length=4000
    )


class ManucaRequest(BaseModel):
    obra_id: int

    mensagem: str = Field(
        min_length=1,
        max_length=4000
    )

    historico: list[ManucaMensagem] = Field(
        default_factory=list,
        max_length=10
    )


class ManucaResponse(BaseModel):
    resposta: str
