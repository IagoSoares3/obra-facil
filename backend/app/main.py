from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.routers.diarios import router as diarios_router
from app.routers.equipe import router as equipe_router
from app.routers.materiais import router as materiais_router
from app.routers.obras import router as obras_router
from app.routers.manuca import router as manuca_router


app = FastAPI(
    title="Obra Fácil API",
    description="API da plataforma Obra Fácil",
    version="1.0.0"
)


# Permite o frontend acessar a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
        "https://genuine-narwhal-aadffc.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra as rotas de obras
app.include_router(obras_router)
app.include_router(diarios_router)
app.include_router(materiais_router)
app.include_router(equipe_router)
app.include_router(manuca_router)


@app.get("/")
def inicio():
    return {
        "sistema": "Obra Fácil",
        "status": "online"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }


@app.get("/teste-banco")
def teste_banco():
    with engine.connect() as conexao:
        resultado = conexao.execute(
            text("SELECT version();")
        )

        versao = resultado.scalar()

    return {
        "status": "conectado",
        "postgresql": versao
    }
