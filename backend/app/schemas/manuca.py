from pydantic import BaseModel, Field


class ManucaRequest(BaseModel):
    obra_id: int

    mensagem: str = Field(
        min_length=1,
        max_length=4000
    )


class ManucaResponse(BaseModel):
    resposta: str