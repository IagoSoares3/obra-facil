from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.obra import Obra
from app.models.pessoa_equipe import PessoaEquipe
from app.schemas.equipe import PessoaEquipeCreate, PessoaEquipeResponse


router = APIRouter(
    prefix="/obras/{obra_id}/equipe",
    tags=["Equipe"]
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
    response_model=list[PessoaEquipeResponse]
)
def listar_equipe(
    obra_id: int,
    db: Session = Depends(get_db)
):
    buscar_obra_ou_404(
        obra_id,
        db
    )

    return (
        db.query(PessoaEquipe)
        .filter(PessoaEquipe.obra_id == obra_id)
        .order_by(PessoaEquipe.nome)
        .all()
    )


@router.post(
    "",
    response_model=PessoaEquipeResponse,
    status_code=status.HTTP_201_CREATED
)
def adicionar_pessoa(
    obra_id: int,
    dados: PessoaEquipeCreate,
    db: Session = Depends(get_db)
):
    buscar_obra_ou_404(
        obra_id,
        db
    )

    pessoa = PessoaEquipe(
        obra_id=obra_id,
        nome=dados.nome.strip(),
        funcao=dados.funcao,
        contato=dados.contato,
        ativo=dados.ativo
    )

    db.add(pessoa)
    db.commit()
    db.refresh(pessoa)

    return pessoa
