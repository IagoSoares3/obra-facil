const ESTA_LOCAL =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";


const API_URL = ESTA_LOCAL
    ? "http://127.0.0.1:8000"
    : "https://obra-facil-61gc.onrender.com";


let obras = [];
let diarios = [];
let materiais = [];
let atividades = [];

let toastTimer;


// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarSidebar();
        configurarPerfil();
        configurarMenu();
        atualizarCabecalho();
        configurarFormularioNovaObra();

        await carregarObras();
        await carregarDadosOperacionais();

        renderizarDashboard();

    }
);


// ======================================================
// API
// ======================================================

async function carregarObras() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/obras`
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro ${resposta.status} ao carregar obras`
            );

        }


        obras =
            await resposta.json();


        console.log(
            "Obras carregadas do banco:"
        );

        console.table(
            obras
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar obras:",
            erro
        );


        obras = [];


        mostrarToast(
            "Não foi possível carregar as obras do servidor."
        );

    }

}


async function carregarDadosOperacionais() {

    const respostas =
        await Promise.all(
            obras.map(
                async (obra) => {

                    const resultado = {
                        diarios: [],
                        materiais: []
                    };


                    try {

                        resultado.diarios =
                            await fetchJson(
                                `/obras/${obra.id}/diarios`
                            );


                    } catch (erro) {

                        console.error(
                            "Erro ao carregar diários da obra:",
                            obra.id,
                            erro
                        );

                    }


                    try {

                        resultado.materiais =
                            await fetchJson(
                                `/obras/${obra.id}/materiais`
                            );


                    } catch (erro) {

                        console.error(
                            "Erro ao carregar materiais da obra:",
                            obra.id,
                            erro
                        );

                    }


                    resultado.diarios =
                        resultado.diarios.map(
                            (diario) => ({
                                ...diario,
                                obra_nome: obra.nome
                            })
                        );


                    resultado.materiais =
                        resultado.materiais.map(
                            (material) => ({
                                ...material,
                                obra_nome: obra.nome
                            })
                        );


                    return resultado;

                }
            )
        );


    diarios =
        respostas
            .flatMap(
                (resultado) =>
                    resultado.diarios
            )
            .sort(
                (a, b) =>
                    b.data.localeCompare(
                        a.data
                    ) ||
                    b.id -
                    a.id
            );


    materiais =
        respostas.flatMap(
            (resultado) =>
                resultado.materiais
        );


    atividades =
        diarios
            .slice(
                0,
                5
            )
            .map(
                (diario) => ({
                    icone: "edit_note",
                    titulo: diario.obra_nome,
                    detalhe: diario.servicos_executados,
                    horario: formatarData(
                        diario.data
                    )
                })
            );

}


async function fetchJson(endpoint) {

    const resposta =
        await fetch(
            `${API_URL}${endpoint}`
        );


    if (!resposta.ok) {

        throw new Error(
            `Erro ${resposta.status} ao buscar ${endpoint}`
        );

    }


    return resposta.json();

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


    if (!sidebar || !botao) {
        return;
    }


    const sidebarRecolhida =
        localStorage.getItem(
            "obraFacil.sidebarCollapsed"
        ) === "true";


    sidebar.classList.toggle(
        "collapsed",
        sidebarRecolhida
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
// PERFIL
// ======================================================

function configurarPerfil() {

    const profileWrap =
        document.querySelector(
            ".profile-wrap"
        );


    const botao =
        document.getElementById(
            "btn-profile"
        );


    if (!profileWrap || !botao) {
        return;
    }


    botao.addEventListener(
        "click",
        (evento) => {

            evento.stopPropagation();


            const aberto =
                profileWrap.classList.toggle(
                    "open"
                );


            botao.setAttribute(
                "aria-expanded",
                String(aberto)
            );

        }
    );


    document.addEventListener(
        "click",
        (evento) => {

            if (
                !profileWrap.contains(
                    evento.target
                )
            ) {

                profileWrap.classList.remove(
                    "open"
                );


                botao.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );

}


// ======================================================
// MENU
// ======================================================

function configurarMenu() {

    const itens =
        document.querySelectorAll(
            ".menu-item[data-section]"
        );


    const titulo =
        document.getElementById(
            "page-title"
        );


    itens.forEach(
        (item) => {

            item.addEventListener(
                "click",
                (evento) => {

                    evento.preventDefault();


                    itens.forEach(
                        (outroItem) => {

                            outroItem.classList.remove(
                                "active"
                            );

                        }
                    );


                    item.classList.add(
                        "active"
                    );


                    const secao =
                        item.dataset.section;


                    titulo.textContent =
                        secao;


                    if (
                        secao !==
                        "Visão Geral"
                    ) {

                        mostrarToast(
                            `${secao}: tela pronta para ser conectada.`
                        );

                    }

                }
            );

        }
    );

}


// ======================================================
// CABEÇALHO
// ======================================================

function atualizarCabecalho() {

    const agora =
        new Date();


    const hora =
        agora.getHours();


    const saudacao =
        hora < 12
            ? "Bom dia"
            : hora < 18
            ? "Boa tarde"
            : "Boa noite";


    document.getElementById(
        "saudacao"
    ).textContent =
        `${saudacao}, Engenheiro`;


    document.getElementById(
        "data-atual"
    ).textContent =
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "short"
            }
        ).format(
            agora
        );

}


// ======================================================
// DASHBOARD
// ======================================================

function renderizarDashboard() {

    renderizarMetricas();
    renderizarObras();
    renderizarPendencias();
    renderizarAtividades();

}


// ======================================================
// MÉTRICAS
// ======================================================

function renderizarMetricas() {

    const obrasAtivas =
        obras.filter(
            (obra) =>
                obra.status !==
                "concluida"
        );


    const quantidade =
        obras.length;


    document.getElementById(
        "dash-andamento"
    ).textContent =
        obrasAtivas.length;


    document.getElementById(
        "dash-total-label"
    ).textContent =
        quantidade === 1
            ? "1 obra cadastrada"
            : `${quantidade} obras cadastradas`;


    const hoje =
        formatarDataInputHoje();


    const diariosHoje =
        diarios.filter(
            (diario) =>
                diario.data === hoje
        );


    const pessoasHoje =
        diariosHoje.reduce(
            (total, diario) =>
                total +
                Number(
                    diario.quantidade_pessoas
                ),
            0
        );


    const alertasMateriais =
        materiais.filter(
            (material) =>
                material.em_alerta
        );


    document.getElementById(
        "dash-diarios"
    ).textContent =
        diariosHoje.length;


    document.getElementById(
        "dash-pessoas"
    ).textContent =
        pessoasHoje;


    document.getElementById(
        "dash-alertas"
    ).textContent =
        alertasMateriais.length;

}


// ======================================================
// OBRAS
// ======================================================

function renderizarObras() {

    const lista =
        document.getElementById(
            "lista-obras"
        );


    if (!lista) {
        return;
    }


    if (obras.length === 0) {

        lista.innerHTML = `
            <div class="empty-state">
                Nenhuma obra cadastrada ainda.
            </div>
        `;


        return;

    }


    const obrasOrdenadas =
        [...obras].sort(
            (a, b) =>
                b.id - a.id
        );


    lista.innerHTML =
        obrasOrdenadas
            .map(
                (obra) => {

                    const tipo =
                        formatarTipoObra(
                            obra.tipo_obra
                        );


                    const status =
                        formatarStatus(
                            obra.status
                        );


                    return `
                        <button
                            class="work-row"
                            type="button"
                            onclick="abrirDetalhes(${obra.id})"
                        >

                            <span class="work-main">

                                <span class="work-symbol">
                                    <span class="material-symbols-outlined">
                                        architecture
                                    </span>
                                </span>

                                <span class="work-copy">

                                    <span class="work-name">
                                        ${obra.nome}
                                    </span>

                                    <span class="work-responsible">
                                        ${obra.endereco}
                                    </span>

                                </span>

                            </span>


                            <span class="work-meta">

                                <span class="work-meta-label">
                                    Tipo
                                </span>

                                <span class="work-meta-value">
                                    ${tipo}
                                </span>

                            </span>


                            <span class="work-meta">

                                <span class="work-meta-label">
                                    Início
                                </span>

                                <span class="work-meta-value">
                                    ${formatarData(
                                        obra.data_inicio
                                    )}
                                </span>

                            </span>


                            <span
                                class="status-badge ${obra.status}"
                            >
                                ${status}
                            </span>


                            <span
                                class="material-symbols-outlined work-arrow"
                            >
                                chevron_right
                            </span>

                        </button>
                    `;

                }
            )
            .join("");

}


// ======================================================
// PENDÊNCIAS
// ======================================================

function renderizarPendencias() {

    const lista =
        document.getElementById(
            "lista-pendencias"
        );


    const contador =
        document.getElementById(
            "pendencias-count"
        );


    const alertas =
        materiais.filter(
            (material) =>
                material.em_alerta
        );


    if (contador) {
        contador.textContent =
            alertas.length;
    }


    if (!lista) {
        return;
    }


    if (alertas.length === 0) {

        lista.innerHTML = `
            <div class="empty-state">
                Nenhuma pendência registrada.
            </div>
        `;

        return;

    }


    lista.innerHTML =
        alertas
            .slice(
                0,
                4
            )
            .map(
                (material) => `
                    <div class="attention-item">
                        <span class="attention-dot warning">
                            <span class="material-symbols-outlined">
                                inventory
                            </span>
                        </span>

                        <span class="attention-copy">
                            <strong>
                                ${material.nome}
                            </strong>

                            <span>
                                ${material.obra_nome}: saldo ${formatarQuantidade(
                                    material.saldo_atual
                                )} ${material.unidade}
                            </span>
                        </span>
                    </div>
                `
            )
            .join("");

}


// ======================================================
// ATIVIDADES
// ======================================================

function renderizarAtividades() {

    const lista =
        document.getElementById(
            "lista-atividades"
        );


    if (!lista) {
        return;
    }


    if (atividades.length === 0) {

        lista.innerHTML = `
            <div class="empty-state">
                Nenhuma atividade registrada ainda.
            </div>
        `;


        return;

    }


    lista.innerHTML =
        atividades
            .map(
                (atividade) => `
                    <div class="activity-item">

                        <span class="activity-icon">
                            <span class="material-symbols-outlined">
                                ${atividade.icone}
                            </span>
                        </span>

                        <span class="activity-copy">

                            <strong>
                                ${atividade.titulo}
                            </strong>

                            <span>
                                ${atividade.detalhe}
                            </span>

                        </span>

                        <time class="activity-time">
                            ${atividade.horario}
                        </time>

                    </div>
                `
            )
            .join("");

}


// ======================================================
// FORMATADORES
// ======================================================

function formatarTipoObra(tipo) {

    const tipos = {

        construcao:
            "Construção",

        reforma:
            "Reforma"

    };


    return (
        tipos[tipo] ??
        tipo
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
        status
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


// ======================================================
// AÇÕES
// ======================================================

function abrirDetalhes(idObra) {

    window.location.href =
        `pages/obras/detalhe/index.html?id=${idObra}`;

}


function novaObra() {

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


    form.reset();


    erro.textContent = "";


    // Data de início preenchida com hoje

    document.getElementById(
        "obra-data-inicio"
    ).value =
        new Date()
            .toISOString()
            .split("T")[0];


    modal.classList.add(
        "open"
    );


    document.body.classList.add(
        "modal-open"
    );


    setTimeout(
        () => {

            document.getElementById(
                "obra-nome"
            ).focus();

        },
        100
    );

}


function fecharModalNovaObra() {

    document
        .getElementById(
            "modal-nova-obra"
        )
        .classList
        .remove(
            "open"
        );


    document.body.classList.remove(
        "modal-open"
    );

}


function novoDiario() {

    window.location.href =
        "pages/diario/index.html";

}


function formatarQuantidade(valor) {

    return new Intl.NumberFormat(
        "pt-BR",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    ).format(
        Number(valor) || 0
    );

}


function formatarDataInputHoje() {

    const hoje =
        new Date();


    const ano =
        hoje.getFullYear();


    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            hoje.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${ano}-${mes}-${dia}`;

}


function verPerfil() {

    mostrarToast(
        "Abrindo seu perfil..."
    );

}


function sairApp() {

    const confirmou =
        window.confirm(
            "Tem certeza que deseja sair do sistema?"
        );


    if (confirmou) {

        mostrarToast(
            "Sessão encerrada. Redirecionando..."
        );

    }

}


// ======================================================
// TOAST
// ======================================================

function mostrarToast(mensagem) {

    const toast =
        document.getElementById(
            "toast"
        );


    const texto =
        document.getElementById(
            "toast-text"
        );


    if (!toast || !texto) {
        return;
    }


    texto.textContent =
        mensagem;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2600
        );

}


// ======================================================
// FORMULÁRIO - NOVA OBRA
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


    if (!form || !modal) {
        return;
    }


    form.addEventListener(
        "submit",
        async (evento) => {

            evento.preventDefault();


            const botao =
                document.getElementById(
                    "btn-salvar-obra"
                );


            const erro =
                document.getElementById(
                    "nova-obra-erro"
                );


            erro.textContent = "";


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
                    previsao || null,

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
                "Enviando nova obra:",
                dados
            );


            try {

                botao.disabled =
                    true;


                botao.innerHTML = `
                    <span class="material-symbols-outlined">
                        progress_activity
                    </span>

                    Salvando...
                `;


                const resposta =
                    await fetch(
                        `${API_URL}/obras`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    dados
                                )
                        }
                    );


                if (!resposta.ok) {

                    const detalhe =
                        await resposta.json();


                    console.error(
                        "Erro da API:",
                        detalhe
                    );


                    throw new Error(
                        "Não foi possível cadastrar a obra."
                    );

                }


                const novaObra =
                    await resposta.json();


                console.log(
                    "Obra cadastrada:",
                    novaObra
                );


                fecharModalNovaObra();


                /*
                    Busca novamente no banco.

                    Não estamos simplesmente
                    adicionando no array manualmente.

                    Recarregamos a fonte oficial.
                */

                await carregarObras();
                await carregarDadosOperacionais();


                renderizarDashboard();


                mostrarToast(
                    `Obra "${novaObra.nome}" cadastrada com sucesso.`
                );


            } catch (erroApi) {

                console.error(
                    "Erro ao cadastrar obra:",
                    erroApi
                );


                erro.textContent =
                    "Não foi possível cadastrar a obra. Verifique os dados e tente novamente.";


            } finally {

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
    );


    /*
        Clicar fora do modal fecha.
    */

    modal.addEventListener(
        "click",
        (evento) => {

            if (
                evento.target === modal
            ) {

                fecharModalNovaObra();

            }

        }
    );


    /*
        ESC fecha o modal.
    */

    document.addEventListener(
        "keydown",
        (evento) => {

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
