let obras = [];


// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarSidebar();
        configurarFiltros();

        configurarFormularioNovaObra();
        configurarModalResumo();


        document
            .getElementById(
                "btn-nova-obra"
            )
            ?.addEventListener(
                "click",
                abrirModalNovaObra
            );


        await carregarObras();

        renderizarPagina();

    }
);


// ======================================================
// API
// ======================================================

async function carregarObras() {

    try {

        obras =
            await apiGet(
                "/obras"
            );


        console.log(
            "Obras carregadas:",
            obras
        );


    } catch (erro) {

        console.error(
            "Erro ao buscar obras:",
            erro
        );


        obras = [];


        mostrarErro(
            "Não foi possível carregar as obras."
        );

    }

}


// ======================================================
// RENDERIZAÇÃO GERAL
// ======================================================

function renderizarPagina() {

    renderizarResumo();

    renderizarObras();

}


// ======================================================
// RESUMO
// ======================================================

function renderizarResumo() {

    const total =
        obras.length;


    const planejamento =
        obras.filter(
            obra =>
                obra.status ===
                "planejamento"
        ).length;


    const andamento =
        obras.filter(
            obra =>
                obra.status ===
                "andamento"
        ).length;


    const concluidas =
        obras.filter(
            obra =>
                obra.status ===
                "concluida"
        ).length;


    document.getElementById(
        "resumo-total"
    ).textContent =
        total;


    document.getElementById(
        "resumo-planejamento"
    ).textContent =
        planejamento;


    document.getElementById(
        "resumo-andamento"
    ).textContent =
        andamento;


    document.getElementById(
        "resumo-concluidas"
    ).textContent =
        concluidas;

}


// ======================================================
// LISTAGEM DE OBRAS
// ======================================================

function renderizarObras() {

    const lista =
        document.getElementById(
            "lista-obras-page"
        );


    if (!lista) {
        return;
    }


    const busca =
        document
            .getElementById(
                "busca-obras"
            )
            .value
            .trim()
            .toLowerCase();


    const status =
        document.getElementById(
            "filtro-status"
        ).value;


    const tipo =
        document.getElementById(
            "filtro-tipo"
        ).value;


    const filtradas =
        obras.filter(
            obra => {

                const texto =
                    `${obra.nome} ${obra.endereco}`
                        .toLowerCase();


                const bateBusca =
                    !busca ||
                    texto.includes(
                        busca
                    );


                const bateStatus =
                    !status ||
                    obra.status ===
                        status;


                const bateTipo =
                    !tipo ||
                    obra.tipo_obra ===
                        tipo;


                return (
                    bateBusca &&
                    bateStatus &&
                    bateTipo
                );

            }
        );


    if (
        filtradas.length === 0
    ) {

        lista.innerHTML = `
            <div class="empty-state">
                Nenhuma obra encontrada.
            </div>
        `;


        return;

    }


    lista.innerHTML =
        filtradas
            .map(
                obra => `
                    <article class="obra-card">

                        <div class="obra-card-header">

                            <div class="obra-identidade">

                                <span class="obra-icon">

                                    <span class="material-symbols-outlined">
                                        architecture
                                    </span>

                                </span>


                                <div>

                                    <h3>
                                        ${obra.nome}
                                    </h3>

                                    <p>
                                        ${obra.endereco}
                                    </p>

                                </div>

                            </div>


                            <span
                                class="status-badge ${obra.status}"
                            >
                                ${formatarStatus(
                                    obra.status
                                )}
                            </span>

                        </div>


                        <div class="obra-card-info">

                            <div>

                                <span>
                                    Tipo
                                </span>

                                <strong>
                                    ${formatarTipo(
                                        obra.tipo_obra
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Início
                                </span>

                                <strong>
                                    ${formatarData(
                                        obra.data_inicio
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Previsão
                                </span>

                                <strong>
                                    ${formatarData(
                                        obra.data_previsao_conclusao
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Orçamento
                                </span>

                                <strong>
                                    ${formatarMoeda(
                                        obra.orcamento_previsto
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div class="obra-card-footer">

                            <button
                                class="text-button"
                                type="button"
                                onclick="abrirObra(${obra.id})"
                            >
                                Abrir obra

                                <span class="material-symbols-outlined">
                                    arrow_forward
                                </span>
                            </button>

                        </div>

                    </article>
                `
            )
            .join("");

}


// ======================================================
// FILTROS
// ======================================================

function configurarFiltros() {

    document
        .getElementById(
            "busca-obras"
        )
        ?.addEventListener(
            "input",
            renderizarObras
        );


    document
        .getElementById(
            "filtro-status"
        )
        ?.addEventListener(
            "change",
            renderizarObras
        );


    document
        .getElementById(
            "filtro-tipo"
        )
        ?.addEventListener(
            "change",
            renderizarObras
        );

}


// ======================================================
// SIDEBAR
// ======================================================

function configurarSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const botao =
        document.getElementById(
            "btn-toggle"
        );


    if (
        !sidebar ||
        !botao
    ) {
        return;
    }


    const recolhida =
        localStorage.getItem(
            "obraFacil.sidebarCollapsed"
        ) === "true";


    sidebar.classList.toggle(
        "collapsed",
        recolhida
    );


    botao.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "collapsed"
            );


            localStorage.setItem(
                "obraFacil.sidebarCollapsed",
                sidebar.classList.contains(
                    "collapsed"
                )
            );

        }
    );

}


// ======================================================
// FORMATADORES
// ======================================================

function formatarTipo(tipo) {

    const tipos = {

        construcao:
            "Construção",

        reforma:
            "Reforma"

    };


    return (
        tipos[tipo] ??
        tipo ??
        "—"
    );

}


function formatarStatus(status) {

    const statusMap = {

        planejamento:
            "Planejamento",

        andamento:
            "Em andamento",

        pausada:
            "Pausada",

        concluida:
            "Concluída"

    };


    return (
        statusMap[status] ??
        status ??
        "—"
    );

}


function formatarData(data) {

    if (!data) {
        return "—";
    }


    const [
        ano,
        mes,
        dia
    ] =
        data.split("-");


    return `${dia}/${mes}/${ano}`;

}


function formatarMoeda(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return "—";

    }


    return new Intl.NumberFormat(
        "pt-BR",
        {
            style:
                "currency",

            currency:
                "BRL"
        }
    ).format(
        Number(valor)
    );

}


// ======================================================
// MODAL RESUMO DA OBRA
// ======================================================

function abrirObra(id) {

    const obra =
        obras.find(
            item =>
                item.id === id
        );


    if (!obra) {

        console.error(
            "Obra não encontrada:",
            id
        );


        return;

    }


    document.getElementById(
        "modal-obra-nome"
    ).textContent =
        obra.nome;


    document.getElementById(
        "modal-obra-endereco"
    ).textContent =
        obra.endereco;


    document.getElementById(
        "modal-obra-tipo"
    ).textContent =
        formatarTipo(
            obra.tipo_obra
        );


    document.getElementById(
        "modal-obra-inicio"
    ).textContent =
        formatarData(
            obra.data_inicio
        );


    document.getElementById(
        "modal-obra-previsao"
    ).textContent =
        formatarData(
            obra.data_previsao_conclusao
        );


    document.getElementById(
        "modal-obra-orcamento"
    ).textContent =
        formatarMoeda(
            obra.orcamento_previsto
        );


    document.getElementById(
        "modal-obra-id"
    ).textContent =
        `#${obra.id}`;


    const status =
        document.getElementById(
            "modal-obra-status"
        );


    status.textContent =
        formatarStatus(
            obra.status
        );


    status.className =
        `status-badge ${obra.status}`;


    /*
        Botão que entra na página
        completa da obra.
    */

    document.getElementById(
        "btn-ver-detalhes-obra"
    ).onclick =
        () => {

            window.location.href =
                `detalhe/index.html?id=${obra.id}`;

        };


    const modal =
        document.getElementById(
            "modal-resumo-obra"
        );


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function fecharResumoObra() {

    const modal =
        document.getElementById(
            "modal-resumo-obra"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


function configurarModalResumo() {

    const modal =
        document.getElementById(
            "modal-resumo-obra"
        );


    if (!modal) {
        return;
    }


    modal.addEventListener(
        "click",
        evento => {

            if (
                evento.target === modal
            ) {

                fecharResumoObra();

            }

        }
    );


    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Escape" &&
                modal.classList.contains(
                    "open"
                )
            ) {

                fecharResumoObra();

            }

        }
    );

}


// ======================================================
// ERRO
// ======================================================

function mostrarErro(mensagem) {

    const lista =
        document.getElementById(
            "lista-obras-page"
        );


    if (!lista) {
        return;
    }


    lista.innerHTML = `
        <div class="empty-state">
            ${mensagem}
        </div>
    `;

}


// ======================================================
// NOVA OBRA - ABRIR MODAL
// ======================================================

function abrirModalNovaObra() {

    const modal =
        document.getElementById(
            "modal-nova-obra"
        );


    const form =
        document.getElementById(
            "form-nova-obra"
        );


    const erro =
        document.getElementById(
            "nova-obra-erro"
        );


    if (
        !modal ||
        !form
    ) {

        console.error(
            "Modal de nova obra não encontrado no HTML."
        );


        return;

    }


    form.reset();


    if (erro) {

        erro.textContent =
            "";

    }


    const campoInicio =
        document.getElementById(
            "obra-data-inicio"
        );


    if (campoInicio) {

        campoInicio.value =
            new Date()
                .toISOString()
                .split("T")[0];

    }


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    setTimeout(
        () => {

            document.getElementById(
                "obra-nome"
            )?.focus();

        },
        100
    );

}


// ======================================================
// NOVA OBRA - FECHAR MODAL
// ======================================================

function fecharModalNovaObra() {

    const modal =
        document.getElementById(
            "modal-nova-obra"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


// ======================================================
// NOVA OBRA - SALVAR
// ======================================================

function configurarFormularioNovaObra() {

    const form =
        document.getElementById(
            "form-nova-obra"
        );


    const modal =
        document.getElementById(
            "modal-nova-obra"
        );


    if (
        !form ||
        !modal
    ) {

        console.warn(
            "Formulário de nova obra não encontrado."
        );


        return;

    }


    form.addEventListener(
        "submit",
        async evento => {

            evento.preventDefault();


            const botao =
                document.getElementById(
                    "btn-salvar-obra"
                );


            const erro =
                document.getElementById(
                    "nova-obra-erro"
                );


            if (erro) {

                erro.textContent =
                    "";

            }


            const orcamento =
                document.getElementById(
                    "obra-orcamento"
                ).value;


            const previsao =
                document.getElementById(
                    "obra-data-previsao"
                ).value;


            const dados = {

                nome:
                    document
                        .getElementById(
                            "obra-nome"
                        )
                        .value
                        .trim(),

                tipo_obra:
                    document
                        .getElementById(
                            "obra-tipo"
                        )
                        .value,

                endereco:
                    document
                        .getElementById(
                            "obra-endereco"
                        )
                        .value
                        .trim(),

                data_inicio:
                    document
                        .getElementById(
                            "obra-data-inicio"
                        )
                        .value,

                data_previsao_conclusao:
                    previsao ||
                    null,

                orcamento_previsto:
                    orcamento
                        ? Number(
                            orcamento
                        )
                        : null,

                latitude:
                    null,

                longitude:
                    null

            };


            console.log(
                "Cadastrando obra:",
                dados
            );


            try {

                if (botao) {

                    botao.disabled =
                        true;


                    botao.innerHTML = `
                        <span class="material-symbols-outlined">
                            progress_activity
                        </span>

                        Salvando...
                    `;

                }


                /*
                    shared/api.js decide automaticamente:

                    Local:
                    127.0.0.1:8000

                    Netlify:
                    API do Render
                */

                const novaObra =
                    await apiPost(
                        "/obras",
                        dados
                    );


                console.log(
                    "Obra cadastrada:",
                    novaObra
                );


                fecharModalNovaObra();


                /*
                    Busca novamente a fonte
                    oficial no banco.
                */

                await carregarObras();


                /*
                    Atualiza:
                    - total
                    - planejamento
                    - andamento
                    - concluídas
                    - cards
                */

                renderizarPagina();


            } catch (erroApi) {

                console.error(
                    "Erro ao cadastrar obra:",
                    erroApi
                );


                if (erro) {

                    erro.textContent =
                        "Não foi possível cadastrar a obra. Verifique os dados e tente novamente.";

                }


            } finally {

                if (botao) {

                    botao.disabled =
                        false;


                    botao.innerHTML = `
                        <span class="material-symbols-outlined">
                            save
                        </span>

                        Cadastrar obra
                    `;

                }

            }

        }
    );


    // Clicar fora fecha o modal

    modal.addEventListener(
        "click",
        evento => {

            if (
                evento.target === modal
            ) {

                fecharModalNovaObra();

            }

        }
    );


    // ESC fecha

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Escape" &&
                modal.classList.contains(
                    "open"
                )
            ) {

                fecharModalNovaObra();

            }

        }
    );

}