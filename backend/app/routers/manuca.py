import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.obra import Obra
from app.schemas.manuca import ManucaRequest, ManucaResponse


router = APIRouter(
    prefix="/ia/manuca",
    tags=["Manuca IA"]
)


# ======================================================
# PERSONALIDADE / REGRAS DO MANUCA
# ======================================================

SYSTEM_INSTRUCTION = """
Você é o Manuca IA, assistente inteligente da plataforma Obra Fácil.

Sua função é auxiliar usuários na gestão e acompanhamento
de obras e reformas.

Você pode ajudar com:

- análise geral da obra;
- planejamento;
- cronograma;
- etapas de execução;
- materiais;
- equipe;
- orçamento;
- riscos;
- organização;
- próximos passos;
- registros da obra.

REGRAS IMPORTANTES:

1. Use os dados cadastrados na plataforma como fonte principal.

2. Nunca invente dados da obra.

3. Quando faltar informação, diga claramente que ainda
não existem dados suficientes cadastrados.

4. Diferencie fatos registrados de recomendações.

5. Responda em português brasileiro.

6. Seja prático e direto.

7. Quando identificar um possível problema, explique:
   - o que chamou atenção;
   - por que pode ser um risco;
   - quais ações podem ser avaliadas.

8. Não substitua engenheiros, arquitetos ou responsáveis
técnicos em decisões estruturais, elétricas, hidráulicas
ou relacionadas à segurança.

9. Seu nome é Manuca IA.
"""


# ======================================================
# CONTEXTO DA OBRA
# ======================================================

def montar_contexto_obra(obra: Obra) -> str:

    return f"""
DADOS CADASTRADOS DA OBRA

ID:
{obra.id}

Nome:
{obra.nome}

Tipo de obra:
{obra.tipo_obra}

Endereço:
{obra.endereco}

Status:
{obra.status}

Data de início:
{obra.data_inicio}

Previsão de conclusão:
{obra.data_previsao_conclusao or "Não informada"}

Data real de conclusão:
{obra.data_conclusao or "Ainda não concluída"}

Orçamento previsto:
{obra.orcamento_previsto or "Não informado"}

Latitude:
{obra.latitude or "Não informada"}

Longitude:
{obra.longitude or "Não informada"}


SITUAÇÃO ATUAL DA PLATAFORMA

O contexto atual do Manuca ainda recebe apenas os dados
principais da obra. Dados detalhados de diário, equipe e
materiais existem em módulos próprios, mas só devem ser
comentados se forem enviados no contexto da pergunta.

Não invente quantidades, custos, funcionários,
materiais ou progresso.
"""


# ======================================================
# ENDPOINT
# ======================================================

@router.post(
    "",
    response_model=ManucaResponse
)
def conversar_com_manuca(
    dados: ManucaRequest,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------
    # CHAVE GEMINI
    # --------------------------------------------------

    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY não configurada."
        )


    # --------------------------------------------------
    # BUSCA OBRA
    # --------------------------------------------------

    obra = (
        db.query(Obra)
        .filter(
            Obra.id == dados.obra_id
        )
        .first()
    )

    if not obra:
        raise HTTPException(
            status_code=404,
            detail="Obra não encontrada."
        )


    # --------------------------------------------------
    # MONTA CONTEXTO
    # --------------------------------------------------

    contexto = montar_contexto_obra(
        obra
    )

    prompt = f"""
{contexto}

PERGUNTA DO USUÁRIO:

{dados.mensagem}
"""


    # --------------------------------------------------
    # GEMINI
    # --------------------------------------------------

    try:

        from google import genai
        from google.genai import types

        client = genai.Client(
            api_key=api_key
        )

        resposta = client.models.generate_content(
            model="gemini-3.7-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                max_output_tokens=1200
            )
        )

        texto = resposta.text

        if not texto:
            raise RuntimeError(
                "Gemini retornou uma resposta vazia."
            )

        return ManucaResponse(
            resposta=texto
        )


    except Exception as erro:

        print(
            "Erro ao consultar Gemini:",
            repr(erro)
        )

        raise HTTPException(
            status_code=500,
            detail="Não foi possível consultar o Manuca IA."
        )
