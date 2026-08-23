from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.obra import Obra
from app.schemas.obra import ObraCreate, ObraResponse

router = APIRouter(
    prefix="/obras",
    tags=["Obras"]
)

@router.post(
    "",
    response_model=ObraResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_obra(
    dados: ObraCreate,
    db: Session = Depends(get_db)
):
    nova_obra = Obra(
        nome=dados.nome,
        tipo_obra=dados.tipo_obra,
        endereco=dados.endereco,
        data_inicio=dados.data_inicio,
        data_previsao_conclusao=dados.data_previsao_conclusao,
        orcamento_previsto=dados.orcamento_previsto,
        latitude=dados.latitude,
        longitude=dados.longitude,
    )

    db.add(nova_obra)
    db.commit()
    db.refresh(nova_obra)

    return nova_obra

@router.get(
    "",
    response_model=list[ObraResponse]
)
def listar_obras(
    db: Session = Depends(get_db)
):
    obras = db.query(Obra).order_by(Obra.id.desc()).all()

    return obras

@router.get(
    "/{obra_id}",
    response_model=ObraResponse
)
def buscar_obra(
    obra_id: int,
    db: Session = Depends(get_db)
):
    obra = (
        db.query(Obra)
        .filter(Obra.id == obra_id)
        .first()
    )

    if not obra:
        raise HTTPException(
            status_code=404,
            detail="Obra não encontrada"
        )

    return obra