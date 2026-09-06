from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.material_obra import MaterialObra
from app.models.movimento_material import MovimentoMaterial
from app.models.obra import Obra
from app.schemas.material import (
    MaterialObraCreate,
    MaterialObraResponse,
    MovimentoMaterialCreate,
    MovimentoMaterialResponse,
)


router = APIRouter(
    prefix="/obras/{obra_id}/materiais",
    tags=["Materiais"]
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


def buscar_material_ou_404(
    obra_id: int,
    material_id: int,
    db: Session
) -> MaterialObra:
    material = (
        db.query(MaterialObra)
        .filter(
            MaterialObra.id == material_id,
            MaterialObra.obra_id == obra_id
        )
        .first()
    )

    if not material:
        raise HTTPException(
            status_code=404,
            detail="Material não encontrado nesta obra."
        )

    return material


@router.get(
    "",
    response_model=list[MaterialObraResponse]
)
def listar_materiais(
    obra_id: int,
    db: Session = Depends(get_db)
):
    buscar_obra_ou_404(
        obra_id,
        db
    )

    return (
        db.query(MaterialObra)
        .filter(MaterialObra.obra_id == obra_id)
        .order_by(MaterialObra.nome)
        .all()
    )


@router.post(
    "",
    response_model=MaterialObraResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_material(
    obra_id: int,
    dados: MaterialObraCreate,
    db: Session = Depends(get_db)
):
    buscar_obra_ou_404(
        obra_id,
        db
    )

    material = MaterialObra(
        obra_id=obra_id,
        nome=dados.nome.strip(),
        unidade=dados.unidade.strip(),
        estoque_minimo=dados.estoque_minimo
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    return material


@router.get(
    "/{material_id}/movimentos",
    response_model=list[MovimentoMaterialResponse]
)
def listar_movimentos(
    obra_id: int,
    material_id: int,
    db: Session = Depends(get_db)
):
    buscar_material_ou_404(
        obra_id,
        material_id,
        db
    )

    return (
        db.query(MovimentoMaterial)
        .filter(MovimentoMaterial.material_id == material_id)
        .order_by(
            MovimentoMaterial.data.desc(),
            MovimentoMaterial.id.desc()
        )
        .all()
    )


@router.post(
    "/{material_id}/movimentos",
    response_model=MovimentoMaterialResponse,
    status_code=status.HTTP_201_CREATED
)
def registrar_movimento(
    obra_id: int,
    material_id: int,
    dados: MovimentoMaterialCreate,
    db: Session = Depends(get_db)
):
    buscar_material_ou_404(
        obra_id,
        material_id,
        db
    )

    movimento = MovimentoMaterial(
        material_id=material_id,
        tipo=dados.tipo,
        quantidade=dados.quantidade,
        data=dados.data,
        etapa=dados.etapa,
        observacao=dados.observacao
    )

    db.add(movimento)
    db.commit()
    db.refresh(movimento)

    return movimento
