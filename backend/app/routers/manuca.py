import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.material_obra import MaterialObra
from app.models.obra import Obra
from app.schemas.manuca import ManucaRequest, ManucaResponse


router = APIRouter(
    prefix="/ia/manuca",
    tags=["Manuca IA"]
)


# ======================================================
# PERSONALIDADE / REGRAS DO MANUCA
# ======================================================

MODELO_PADRAO_GEMINI = "gemini-3.8-flash"


ETAPAS_CONSTRUCAO = [
    "Preparação da obra",
    "Fundação",
    "Estrutura",
    "Alvenaria / Vedação",
    "Cobertura",
    "Instalações prediais",
    "Revestimentos",
    "Esquadrias",
    "Pisos e revestimentos finais",
    "Forros e acabamentos de teto",
    "Pintura",
    "Louças, metais e equipamentos",
    "Instalações e acabamentos finais",
    "Área externa",
    "Testes e inspeções",
    "Limpeza final e entrega",
]


ETAPAS_REFORMA = [
    "Levantamento da situação existente",
    "Definição do que será reformado",
    "Projetos e planejamento",
    "Proteção e preparação do local",
    "Demolição / remoção",
    "Adequações estruturais",
    "Alvenaria e alterações de layout",
    "Instalações",
    "Impermeabilização",
    "Revestimentos",
    "Pisos",
    "Forros",
    "Esquadrias e portas",
    "Pintura",
    "Louças, metais e acessórios",
    "Marcenaria e acabamentos",
    "Área externa",
    "Testes e inspeção",
    "Correção das pendências",
    "Limpeza pós-obra e entrega",
]


HIERARQUIA_OBRA = [
    "Proprietário / Cliente",
    "Responsável técnico",
    "Engenheiro de obra / Residente",
    "Mestre de obras",
    "Encarregado de obras",
    "Oficial especializado",
    "Servente / Ajudante",
]


SYSTEM_INSTRUCTION = """
Você é o Manuca IA, assistente inteligente da plataforma Obra Fácil.

Sua função é auxiliar usuários na gestão, organização e
acompanhamento operacional de obras e reformas.

Você pode ajudar com:

- análise geral da obra;
- planejamento;
- cronograma;
- etapas de execução;
- materiais;
- equipe;
- orçamento;
- riscos;
- qualidade;
- produtividade;
- segurança operacional;
- registro fotográfico e documental;
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

7. Quando identificar um possível problema, explique em linguagem simples:
   - o que chamou atenção;
   - por que pode ser um risco;
   - quais ações podem ser avaliadas.

8. Use a hierarquia de obra para orientar comunicação,
responsabilidade e encaminhamento de pendências.

9. Quando sugerir próximos passos, organize por etapa da obra
quando houver informação suficiente.

10. Não substitua engenheiros, arquitetos ou responsáveis
técnicos em decisões estruturais, elétricas, hidráulicas
ou relacionadas à segurança.

11. Não dê laudo, ART, RRT, dimensionamento ou decisão técnica
fechada. Recomende validação com responsável técnico quando
houver impacto estrutural, legal, elétrico, hidráulico ou de segurança.

12. Seu nome é Manuca IA.
"""


# ======================================================
# CONTEXTO DA OBRA
# ======================================================

def texto_curto(
    valor,
    limite: int = 360
) -> str:

    texto = (
        str(
            valor or ""
        ).strip()
    )

    if not texto:
        return "Não informado"

    if len(texto) <= limite:
        return texto

    return f"{texto[:limite].rstrip()}..."


def valor_ou_nao_informado(valor) -> str:

    if valor is None or valor == "":
        return "Não informado"

    return str(valor)


def obter_etapas_referencia(tipo_obra: str) -> list[str]:

    if tipo_obra == "reforma":
        return ETAPAS_REFORMA

    return ETAPAS_CONSTRUCAO


def montar_linhas(
    itens: list[str],
    vazio: str
) -> str:

    if not itens:
        return vazio

    return "\n".join(
        itens
    )


def montar_contexto_obra(obra: Obra) -> str:

    diarios = (
        sorted(
            list(obra.diarios),
            key=lambda diario: (
                diario.data,
                diario.id
            ),
            reverse=True
        )
    )


    equipe = (
        sorted(
            list(obra.equipe),
            key=lambda pessoa: (
                not pessoa.ativo,
                pessoa.nome.lower()
            )
        )
    )


    materiais = (
        sorted(
            list(obra.materiais),
            key=lambda material: (
                not material.em_alerta,
                material.nome.lower()
            )
        )
    )


    movimentos = []

    for material in materiais:
        for movimento in material.movimentos[:3]:
            movimentos.append(
                (
                    movimento.data,
                    movimento.id,
                    material,
                    movimento
                )
            )

    movimentos.sort(
        key=lambda item: (
            item[0],
            item[1]
        ),
        reverse=True
    )


    etapas_referencia = (
        obter_etapas_referencia(
            obra.tipo_obra
        )
    )


    linhas_diarios = (
        [
            (
                f"- {diario.data} | clima: {diario.clima} | "
                f"pessoas: {diario.quantidade_pessoas} | "
                f"etapa: {diario.etapa or 'Não informada'} | "
                f"serviços: {texto_curto(diario.servicos_executados, 420)} | "
                f"materiais: {texto_curto(diario.materiais_utilizados, 180)} | "
                f"ocorrências: {texto_curto(diario.ocorrencias, 220)}"
            )
            for diario in diarios[:10]
        ]
    )


    linhas_equipe = (
        [
            (
                f"- {pessoa.nome} | função: {pessoa.funcao or 'Não informada'} | "
                f"status: {'ativo' if pessoa.ativo else 'inativo'}"
            )
            for pessoa in equipe[:20]
        ]
    )


    linhas_materiais = (
        [
            (
                f"- {material.nome} | unidade: {material.unidade} | "
                f"saldo: {material.saldo_atual} | mínimo: {material.estoque_minimo} | "
                f"alerta: {'sim' if material.em_alerta else 'não'}"
            )
            for material in materiais[:20]
        ]
    )


    linhas_movimentos = (
        [
            (
                f"- {movimento.data} | {material.nome} | "
                f"{movimento.tipo}: {movimento.quantidade} {material.unidade} | "
                f"etapa: {movimento.etapa or 'Não informada'} | "
                f"obs: {texto_curto(movimento.observacao, 180)}"
            )
            for _, _, material, movimento in movimentos[:12]
        ]
    )


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
{valor_ou_nao_informado(obra.orcamento_previsto)}

Latitude:
{obra.latitude or "Não informada"}

Longitude:
{obra.longitude or "Não informada"}

HIERARQUIA DE REFERÊNCIA PARA COMUNICAÇÃO E RESPONSABILIDADE
{montar_linhas([f"- {nivel}" for nivel in HIERARQUIA_OBRA], "Não informada")}

ETAPAS DE REFERÊNCIA PARA ESTE TIPO DE OBRA
{montar_linhas([f"- {etapa}" for etapa in etapas_referencia], "Não informadas")}

RESUMO QUANTITATIVO DOS MÓDULOS
- Registros de diário: {len(diarios)}
- Pessoas na equipe: {len(equipe)}
- Pessoas ativas: {len([pessoa for pessoa in equipe if pessoa.ativo])}
- Materiais cadastrados: {len(materiais)}
- Materiais em alerta: {len([material for material in materiais if material.em_alerta])}

ÚLTIMOS REGISTROS DE DIÁRIO
{montar_linhas(linhas_diarios, "Nenhum diário cadastrado.")}

EQUIPE CADASTRADA
{montar_linhas(linhas_equipe, "Nenhuma pessoa cadastrada na equipe.")}

MATERIAIS CADASTRADOS
{montar_linhas(linhas_materiais, "Nenhum material cadastrado.")}

MOVIMENTOS RECENTES DE MATERIAIS
{montar_linhas(linhas_movimentos, "Nenhum movimento de material cadastrado.")}

ORIENTAÇÃO DE USO DO CONTEXTO
- Use somente fatos que aparecem acima como dados confirmados.
- Recomendações podem ser feitas, mas devem ser marcadas como recomendação.
- Se uma informação não existir, diga que ainda não foi cadastrada.
- Não invente quantidades, custos, funcionários, materiais ou progresso.
"""


def montar_historico_conversa(dados: ManucaRequest) -> str:

    if not dados.historico:
        return "Sem histórico anterior nesta conversa."

    linhas = (
        [
            f"{mensagem.papel}: {texto_curto(mensagem.texto, 650)}"
            for mensagem in dados.historico[-10:]
        ]
    )

    return "\n".join(
        linhas
    )


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


    modelo = (
        os.getenv(
            "GEMINI_MODEL",
            MODELO_PADRAO_GEMINI
        )
    )


    # --------------------------------------------------
    # BUSCA OBRA
    # --------------------------------------------------

    obra = (
        db.query(Obra)
        .options(
            selectinload(Obra.diarios),
            selectinload(Obra.equipe),
            selectinload(Obra.materiais)
                .selectinload(MaterialObra.movimentos)
        )
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

    historico = (
        montar_historico_conversa(
            dados
        )
    )

    prompt = f"""
{contexto}

HISTÓRICO RECENTE DA CONVERSA
{historico}

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
            model=modelo,
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
