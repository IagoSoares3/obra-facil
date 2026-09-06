let obras = [];
let equipe = [];


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarSidebarPadrao();
        configurarFiltros();
        configurarModalEquipe();

        await carregarDados();

    }
);


async function carregarDados() {

    try {

        obras =
            await apiGet(
                "/obras"
            );


        await carregarEquipe();

        preencherSelectObras(
            "filtro-obra",
            "Todas as obras"
        );

        preencherSelectObras(
            "equipe-obra",
            "Selecione uma obra"
        );

        preencherFiltroFuncoes();
        preencherSugestoesFuncoes();
        renderizarHierarquia();
        renderizarPagina();


    } catch (erro) {

        console.error(
            "Erro ao carregar equipe:",
            erro
        );

        mostrarToast(
            "Não foi possível carregar a equipe."
        );

    }
}


async function carregarEquipe() {

    const respostas =
        await Promise.all(
            obras.map(
                async obra => {

                    try {

                        const pessoas =
                            await apiGet(
                                `/obras/${obra.id}/equipe`
                            );


                        return pessoas.map(
                            pessoa => ({
                                ...pessoa,
                                obra_nome: obra.nome
                            })
                        );


                    } catch (erro) {

                        console.error(
                            "Erro ao carregar equipe da obra:",
                            obra.id,
                            erro
                        );

                        return [];

                    }
                }
            )
        );


    equipe =
        respostas
            .flat()
            .sort(
                (a, b) =>
                    a.nome.localeCompare(
                        b.nome,
                        "pt-BR"
                    )
            );

}


function configurarFiltros() {

    [
        "busca-equipe",
        "filtro-obra",
        "filtro-funcao"
    ].forEach(
        id => {

            document
                .getElementById(
                    id
                )
                ?.addEventListener(
                    "input",
                    renderizarLista
                );

            document
                .getElementById(
                    id
                )
                ?.addEventListener(
                    "change",
                    renderizarLista
                );

        }
    );

}


function configurarModalEquipe() {

    document
        .getElementById(
            "btn-nova-pessoa"
        )
        ?.addEventListener(
            "click",
            abrirModalEquipe
        );


    document
        .getElementById(
            "form-equipe"
        )
        ?.addEventListener(
            "submit",
            salvarPessoa
        );


    const modal =
        document.getElementById(
            "modal-equipe"
        );


    modal?.addEventListener(
        "click",
        evento => {

            if (evento.target === modal) {

                fecharModalEquipe();

            }

        }
    );


    document.addEventListener(
        "keydown",
        evento => {

            if (evento.key === "Escape") {

                fecharModalEquipe();

            }

        }
    );

}


function abrirModalEquipe() {

    if (obras.length === 0) {

        mostrarToast(
            "Cadastre uma obra antes de adicionar equipe."
        );

        return;

    }


    document
        .getElementById(
            "form-equipe"
        )
        .reset();


    setTexto(
        "equipe-erro",
        ""
    );


    abrirModal(
        "modal-equipe"
    );

}


function fecharModalEquipe() {

    fecharModal(
        "modal-equipe"
    );

}


async function salvarPessoa(evento) {

    evento.preventDefault();


    const obraId =
        document.getElementById(
            "equipe-obra"
        ).value;


    const erro =
        document.getElementById(
            "equipe-erro"
        );


    const botao =
        document.getElementById(
            "btn-salvar-equipe"
        );


    erro.textContent =
        "";


    if (!obraId) {

        erro.textContent =
            "Selecione uma obra.";

        return;

    }


    const dados = {
        nome: lerTexto("equipe-nome"),
        funcao: lerTextoOuNulo("equipe-funcao"),
        contato: lerTextoOuNulo("equipe-contato"),
        ativo: true
    };


    try {

        alternarBotaoSalvando(
            botao,
            "Salvando..."
        );


        await apiPost(
            `/obras/${obraId}/equipe`,
            dados
        );


        fecharModalEquipe();

        await carregarEquipe();

        preencherFiltroFuncoes();
        preencherSugestoesFuncoes();
        renderizarPagina();

        mostrarToast(
            "Pessoa adicionada à equipe."
        );


    } catch (erroApi) {

        console.error(
            "Erro ao salvar pessoa:",
            erroApi
        );


        erro.textContent =
            "Não foi possível salvar a pessoa.";


    } finally {

        restaurarBotao(
            botao
        );

    }

}


function renderizarPagina() {

    renderizarResumo();
    renderizarLista();

}


function renderizarResumo() {

    const obrasComEquipe =
        new Set(
            equipe.map(
                pessoa =>
                    pessoa.obra_id
            )
        );


    const funcoes =
        new Set(
            equipe
                .map(
                    pessoa =>
                        pessoa.funcao
                )
                .filter(Boolean)
        );


    setTexto(
        "resumo-total",
        equipe.length
    );


    setTexto(
        "resumo-ativas",
        equipe.filter(
            pessoa =>
                pessoa.ativo
        ).length
    );


    setTexto(
        "resumo-funcoes",
        funcoes.size
    );


    setTexto(
        "resumo-obras",
        obrasComEquipe.size
    );

}


function renderizarHierarquia() {

    const lista =
        document.getElementById(
            "lista-hierarquia"
        );


    if (!lista) {
        return;
    }


    lista.innerHTML =
        HIERARQUIA_OBRA
            .map(
                (nivel, indice) => `
                    <div class="hierarquia-item">
                        <span>${indice + 1}</span>
                        <strong>${escaparHtml(nivel)}</strong>
                    </div>
                `
            )
            .join("");

}


function renderizarLista() {

    const lista =
        document.getElementById(
            "lista-equipe"
        );


    const busca =
        lerFiltro(
            "busca-equipe"
        );


    const obraId =
        document.getElementById(
            "filtro-obra"
        ).value;


    const funcao =
        document.getElementById(
            "filtro-funcao"
        ).value;


    const filtrados =
        equipe.filter(
            pessoa => {

                const texto =
                    `${pessoa.nome} ${pessoa.funcao || ""} ${pessoa.contato || ""} ${pessoa.obra_nome}`
                        .toLowerCase();


                return (
                    (!busca || texto.includes(busca)) &&
                    (!obraId || String(pessoa.obra_id) === obraId) &&
                    (!funcao || pessoa.funcao === funcao)
                );

            }
        );


    if (filtrados.length === 0) {

        lista.innerHTML = `
            <div class="empty-state">
                Nenhuma pessoa encontrada.
            </div>
        `;

        return;

    }


    lista.innerHTML =
        filtrados
            .map(
                pessoa => `
                    <article class="operacional-card">
                        <div class="operacional-card-header">
                            <div class="operacional-identidade">
                                <span class="avatar-iniciais">
                                    ${obterIniciais(pessoa.nome)}
                                </span>

                                <div>
                                    <h3>${escaparHtml(pessoa.nome)}</h3>
                                    <p>${escaparHtml(pessoa.obra_nome)}</p>
                                </div>
                            </div>

                            <div class="chip-row">
                                <span class="status-chip ${pessoa.ativo ? "ok" : "alerta"}">
                                    <span class="material-symbols-outlined">
                                        ${pessoa.ativo ? "check_circle" : "pause_circle"}
                                    </span>
                                    ${pessoa.ativo ? "Ativo" : "Inativo"}
                                </span>
                            </div>
                        </div>

                        <div class="operacional-info-grid">
                            <div>
                                <span>Função</span>
                                <strong>${escaparHtml(pessoa.funcao || "Não informada")}</strong>
                            </div>

                            <div>
                                <span>Contato</span>
                                <strong>${escaparHtml(pessoa.contato || "Sem contato")}</strong>
                            </div>

                            <div>
                                <span>Obra</span>
                                <strong>${escaparHtml(pessoa.obra_nome)}</strong>
                            </div>

                            <div>
                                <span>Cadastro</span>
                                <strong>${formatarData(pessoa.criado_em.slice(0, 10))}</strong>
                            </div>
                        </div>

                        <div class="operacional-card-footer">
                            <button
                                class="text-button"
                                type="button"
                                onclick="abrirObra(${pessoa.obra_id})"
                            >
                                Abrir obra
                                <span class="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                    </article>
                `
            )
            .join("");

}


function preencherSelectObras(
    id,
    placeholder
) {

    const select =
        document.getElementById(
            id
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">${placeholder}</option>
        ${obras
            .map(
                obra => `
                    <option value="${obra.id}">
                        ${escaparHtml(obra.nome)}
                    </option>
                `
            )
            .join("")}
    `;

}


function preencherFiltroFuncoes() {

    const select =
        document.getElementById(
            "filtro-funcao"
        );


    if (!select) {
        return;
    }


    const funcoes =
        [
            ...new Set(
                equipe
                    .map(
                        pessoa =>
                            pessoa.funcao
                    )
                    .filter(Boolean)
            )
        ].sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "pt-BR"
                )
        );


    const valorAtual =
        select.value;


    select.innerHTML = `
        <option value="">Todas as funções</option>
        ${funcoes
            .map(
                funcao => `
                    <option value="${escaparHtml(funcao)}">
                        ${escaparHtml(funcao)}
                    </option>
                `
            )
            .join("")}
    `;


    if (funcoes.includes(valorAtual)) {

        select.value =
            valorAtual;

    }

}


function preencherSugestoesFuncoes() {

    const datalist =
        document.getElementById(
            "funcoes-equipe-list"
        );


    if (!datalist) {
        return;
    }


    datalist.innerHTML =
        FUNCOES_EQUIPE
            .map(
                funcao => `
                    <option value="${escaparHtml(funcao)}"></option>
                `
            )
            .join("");

}


function abrirObra(obraId) {

    window.location.href =
        `../obras/detalhe/index.html?id=${obraId}&tab=equipe`;

}


function lerFiltro(id) {

    return document
        .getElementById(
            id
        )
        .value
        .trim()
        .toLowerCase();

}
