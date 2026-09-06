from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diario_obra import DiarioObra
from app.models.obra import Obra
from app.schemas.diario import DiarioObraCreate, DiarioObraResponse


router = APIRouter(
    prefix="/obras/{obra_id}/diarios",
    tags=["Diario de Obra"]
)


def buscar_obra_ou_404(
    obra_id: int,
    db: Session
) -> Obra:
    obra = (
        db.query(Obra)
        .filter(Obra.id == obra_id)
        .first()
    )

    if not obra:
        raise HTTPException(
            status_code=404,
            detail="Obra não encontrada."
        )

    return obra


@router.get(
    "",
    response_model=list[DiarioObraResponse]
)
def listar_diarios(
    obra_id: int,
    db: Session = Depends(get_db)
):
    buscar_obra_ou_404(
        obra_id,
        db
    )

    return (
        db.query(DiarioObra)
        .filter(DiarioObra.obra_id == obra_id)
        .order_by(
            DiarioObra.data.desc(),
            DiarioObra.id.desc()
        )
        .all()
    )


@router.post(
    "",
    response_model=DiarioObraResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_diario(
    obra_id: int,
    dados: DiarioObraCreate,
    db: Session = Depends(get_db)
):
    buscar_obra_ou_404(
        obra_id,
        db
    )

    diario = DiarioObra(
        obra_id=obra_id,
        data=dados.data,
        clima=dados.clima,
        quantidade_pessoas=dados.quantidade_pessoas,
        etapa=dados.etapa,
        servicos_executados=dados.servicos_executados,
        materiais_utilizados=dados.materiais_utilizados,
        ocorrencias=dados.ocorrencias
    )

    db.add(diario)
    db.commit()
    db.refresh(diario)

    return diario
