let obraAtual = null;
let toastTimer = null;


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarSidebar();
        configurarTabs();
        configurarRegistroObra();

        await carregarObra();

    }
);


// ======================================================
// CARREGAR OBRA
// ======================================================

async function carregarObra() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );


    const obraId =
        parametros.get("id");


    if (!obraId) {

        mostrarErro(
            "Nenhuma obra foi informada."
        );

        return;
    }


    try {

        obraAtual =
            await apiGet(
                `/obras/${obraId}`
            );


        preencherObra(
            obraAtual
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar obra:",
            erro
        );


        mostrarErro(
            "A obra solicitada não foi encontrada ou o servidor está indisponível."
        );

    }
}


// ======================================================
// PREENCHER A TELA
// ======================================================

function preencherObra(obra) {

    document.getElementById(
        "obra-loading"
    ).hidden = true;


    document.getElementById(
        "obra-error"
    ).hidden = true;


    document.getElementById(
        "obra-conteudo"
    ).hidden = false;


    // Título da aba

    document.title =
        `${obra.nome} | Obra Fácil`;


    // Nome

    setTexto(
        "topbar-obra-nome",
        obra.nome
    );


    setTexto(
        "obra-nome",
        obra.nome
    );


    // Endereço

    setTexto(
        "obra-endereco",
        obra.endereco
    );


    // Manuca

    setTexto(
        "manuca-obra-nome",
        obra.nome
    );


    // Tipo

    const tipo =
        formatarTipo(
            obra.tipo_obra
        );


    setTexto(
        "obra-tipo",
        tipo
    );


    setTexto(
        "obra-tipo-info",
        tipo
    );


    // Status

    const statusTexto =
        formatarStatus(
            obra.status
        );


    const badge =
        document.getElementById(
            "obra-status"
        );


    badge.textContent =
        statusTexto;


    badge.className =
        `status-badge ${obra.status}`;


    setTexto(
        "obra-status-info",
        statusTexto
    );


    // Datas

    setTexto(
        "obra-inicio",
        formatarData(
            obra.data_inicio
        )
    );


    setTexto(
        "obra-previsao",
        formatarData(
            obra.data_previsao_conclusao
        )
    );


    setTexto(
        "obra-conclusao",
        formatarData(
            obra.data_conclusao
        )
    );


    // Orçamento

    setTexto(
        "obra-orcamento",
        formatarMoeda(
            obra.orcamento_previsto
        )
    );


    // ID

    setTexto(
        "obra-id",
        `#${obra.id}`
    );


    // Prazo

    setTexto(
        "obra-prazo",
        calcularPrazo(
            obra.data_inicio,
            obra.data_previsao_conclusao
        )
    );


    /*
        Esses indicadores ficam zerados por enquanto.

        Depois eles virão dos módulos reais:
        - Equipe
        - Materiais
        - Diário
        - Etapas
    */

    atualizarIndicadoresOperacionais({
        equipe: 0,
        materiais: 0,
        registros: 0,
        progresso: 0
    });

}


// ======================================================
// INDICADORES OPERACIONAIS
// ======================================================

function atualizarIndicadoresOperacionais({
    equipe = 0,
    materiais = 0,
    registros = 0,
    progresso = 0
}) {

    const percentual =
        Math.max(
            0,
            Math.min(
                100,
                Number(progresso) || 0
            )
        );


    setTexto(
        "operacao-equipe",
        equipe
    );


    setTexto(
        "operacao-materiais",
        materiais
    );


    setTexto(
        "operacao-registros",
        registros
    );


    setTexto(
        "operacao-progresso",
        `${percentual}%`
    );


    setTexto(
        "progresso-percentual",
        `${percentual}%`
    );


    const barra =
        document.getElementById(
            "progresso-barra-preenchimento"
        );


    if (barra) {

        barra.style.width =
            `${percentual}%`;

    }

}


// ======================================================
// TABS
// ======================================================

function configurarTabs() {

    document
        .querySelectorAll(
            ".obra-tab"
        )
        .forEach(
            tab => {

                tab.addEventListener(
                    "click",
                    () => {

                        abrirTab(
                            tab.dataset.tab
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-abrir-tab]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        abrirTab(
                            botao.dataset.abrirTab
                        );

                    }
                );

            }
        );
}


function abrirTab(nome) {

    document
        .querySelectorAll(
            ".obra-tab"
        )
        .forEach(
            tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.tab === nome
                );

            }
        );


    document
        .querySelectorAll(
            ".obra-tab-content"
        )
        .forEach(
            conteudo => {

                conteudo.classList.toggle(
                    "active",
                    conteudo.dataset.tabContent === nome
                );

            }
        );


    const alvo =
        document.querySelector(
            `.obra-tab[data-tab="${nome}"]`
        );


    if (alvo) {

        alvo.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest"
        });

    }

}


// ======================================================
// REGISTRO DA OBRA
// ======================================================

function configurarRegistroObra() {

    const modal =
        document.getElementById(
            "modal-registro-obra"
        );


    const form =
        document.getElementById(
            "form-registro-obra"
        );


    if (!modal || !form) {
        return;
    }


    form.addEventListener(
        "submit",
        (evento) => {

            evento.preventDefault();


            /*
                Ainda não temos endpoint para diário.

                Então não vamos salvar fake/localmente.
                Quando criarmos o backend, esse submit
                chamará a API.
            */

            mostrarToast(
                "Interface pronta. Agora precisamos criar o endpoint de registros no backend para salvar no banco."
            );

        }
    );


    // Clicar fora fecha

    modal.addEventListener(
        "click",
        (evento) => {

            if (
                evento.target === modal
            ) {

                fecharRegistroObra();

            }

        }
    );


    // ESC fecha modal/painel

    document.addEventListener(
        "keydown",
        (evento) => {

            if (
                evento.key !== "Escape"
            ) {
                return;
            }


            if (
                modal.classList.contains(
                    "open"
                )
            ) {

                fecharRegistroObra();

            }


            const manuca =
                document.getElementById(
                    "manuca-overlay"
                );


            if (
                manuca &&
                manuca.classList.contains(
                    "open"
                )
            ) {

                fecharManuca();

            }

        }
    );
}


function abrirRegistroObra() {

    const modal =
        document.getElementById(
            "modal-registro-obra"
        );


    const form =
        document.getElementById(
            "form-registro-obra"
        );


    if (!modal || !form) {
        return;
    }


    form.reset();


    const campoData =
        document.getElementById(
            "registro-data"
        );


    if (campoData) {

        campoData.value =
            formatarDataInputHoje();

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

}


function fecharRegistroObra() {

    const modal =
        document.getElementById(
            "modal-registro-obra"
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
// MANUCA IA
// SOMENTE INTERFACE POR ENQUANTO
// ======================================================

function abrirManuca() {

    const overlay =
        document.getElementById(
            "manuca-overlay"
        );


    if (!overlay) {
        return;
    }


    overlay.classList.add(
        "open"
    );


    overlay.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function fecharManuca() {

    const overlay =
        document.getElementById(
            "manuca-overlay"
        );


    if (!overlay) {
        return;
    }


    overlay.classList.remove(
        "open"
    );


    overlay.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


function fecharManucaPorFora(evento) {

    if (
        evento.target ===
        document.getElementById(
            "manuca-overlay"
        )
    ) {

        fecharManuca();

    }

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

function setTexto(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            valor ?? "—";

    }

}


function formatarTipo(tipo) {

    const tipos = {
        construcao: "Construção",
        reforma: "Reforma"
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
            style: "currency",
            currency: "BRL"
        }
    ).format(
        Number(valor)
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


// ======================================================
// PRAZO
// ======================================================

function calcularPrazo(
    inicio,
    previsao
) {

    if (
        !inicio ||
        !previsao
    ) {

        return "—";

    }


    const dataInicio =
        new Date(
            `${inicio}T00:00:00`
        );


    const dataFim =
        new Date(
            `${previsao}T00:00:00`
        );


    const diferenca =
        dataFim -
        dataInicio;


    const dias =
        Math.ceil(
            diferenca /
            (
                1000 *
                60 *
                60 *
                24
            )
        );


    if (dias < 0) {

        return "Data inválida";

    }


    if (dias === 1) {

        return "1 dia";

    }


    if (dias < 30) {

        return `${dias} dias`;

    }


    const meses =
        Math.round(
            dias / 30
        );


    return `${meses} meses`;

}


// ======================================================
// ERRO
// ======================================================

function mostrarErro(mensagem) {

    document.getElementById(
        "obra-loading"
    ).hidden = true;


    document.getElementById(
        "obra-conteudo"
    ).hidden = true;


    const erro =
        document.getElementById(
            "obra-error"
        );


    erro.hidden =
        false;


    setTexto(
        "obra-error-text",
        mensagem
    );

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
            3000
        );

}