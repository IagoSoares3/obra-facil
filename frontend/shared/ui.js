let toastTimerGlobal = null;


const ETAPAS_CONSTRUCAO = [
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
    "Limpeza final e entrega"
];


const ETAPAS_REFORMA = [
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
    "Limpeza pós-obra e entrega"
];


const HIERARQUIA_OBRA = [
    "Proprietário / Cliente",
    "Responsável técnico",
    "Engenheiro de obra / Residente",
    "Mestre de obras",
    "Encarregado de obras",
    "Oficial especializado",
    "Servente / Ajudante"
];


const FUNCOES_EQUIPE = [
    "Proprietário / Cliente",
    "Responsável técnico",
    "Engenheiro",
    "Arquiteto",
    "Engenheiro residente",
    "Mestre de obras",
    "Encarregado",
    "Pedreiro",
    "Carpinteiro",
    "Armador",
    "Eletricista",
    "Encanador",
    "Bombeiro hidráulico",
    "Gesseiro",
    "Drywallista",
    "Azulejista",
    "Pintor",
    "Serralheiro",
    "Vidraceiro",
    "Marceneiro",
    "Servente",
    "Ajudante"
];


function obterEtapasPorTipo(tipoObra) {

    if (tipoObra === "reforma") {

        return ETAPAS_REFORMA;

    }


    return ETAPAS_CONSTRUCAO;

}


function obterTodasEtapas() {

    return [
        ...new Set(
            [
                ...ETAPAS_CONSTRUCAO,
                ...ETAPAS_REFORMA
            ]
        )
    ];

}


function configurarSidebarPadrao() {

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


function abrirModal(id) {

    const modal =
        document.getElementById(
            id
        );


    if (!modal) {
        return;
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


function fecharModal(id) {

    const modal =
        document.getElementById(
            id
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
        toastTimerGlobal
    );


    toastTimerGlobal =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2800
        );

}


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


function setValor(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.value =
            valor ?? "";

    }

}


function lerTexto(id) {

    return document
        .getElementById(
            id
        )
        .value
        .trim();

}


function lerTextoOuNulo(id) {

    const valor =
        lerTexto(
            id
        );


    return valor || null;

}


function alternarBotaoSalvando(
    botao,
    texto
) {

    if (!botao) {
        return;
    }


    botao.dataset.originalHtml =
        botao.innerHTML;


    botao.disabled =
        true;


    botao.innerHTML = `
        <span class="material-symbols-outlined">
            progress_activity
        </span>

        ${texto}
    `;

}


function restaurarBotao(botao) {

    if (!botao) {
        return;
    }


    botao.disabled =
        false;


    if (botao.dataset.originalHtml) {

        botao.innerHTML =
            botao.dataset.originalHtml;

    }

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


function formatarClima(clima) {

    const climas = {
        sol: "Sol",
        chuva: "Chuva",
        nublado: "Nublado"
    };


    return climas[clima] ?? clima ?? "—";

}


function iconeClima(clima) {

    const icones = {
        sol: "wb_sunny",
        chuva: "rainy",
        nublado: "cloud"
    };


    return icones[clima] ?? "partly_cloudy_day";

}


function formatarTipoMovimento(tipo) {

    const tipos = {
        entrada: "Entrada",
        saida: "Saída"
    };


    return tipos[tipo] ?? tipo ?? "—";

}


function obterIniciais(nome) {

    return String(
        nome || "?"
    )
        .trim()
        .split(/\s+/)
        .slice(
            0,
            2
        )
        .map(
            parte =>
                parte[0]
        )
        .join("")
        .toUpperCase();

}


function escaparHtml(valor) {

    const mapa = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
    };


    return String(
        valor ?? ""
    ).replace(
        /[&<>"']/g,
        caractere =>
            mapa[caractere]
    );

}
