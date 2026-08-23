import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


load_dotenv()


# ======================================================
# CONEXÃO COM BANCO
# ======================================================

DATABASE_URL = os.getenv("DATABASE_URL")


# Se não existir DATABASE_URL,
# usa as configurações locais do .env
if not DATABASE_URL:

    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")

    DATABASE_URL = (
        f"postgresql+psycopg://"
        f"{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )


# Se o Render entregar:
# postgresql://usuario:senha@host/banco
#
# convertemos para o driver psycopg que já usamos
if DATABASE_URL.startswith("postgresql://"):

    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1
    )


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


class Base(DeclarativeBase):
    pass


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()