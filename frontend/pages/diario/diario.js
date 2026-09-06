let obras = [];
let diarios = [];


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarSidebarPadrao();
        configurarFiltros();
        configurarModalDiario();

        await carregarDados();

    }
);


async function carregarDados() {

    try {

        obras =
            await apiGet(
                "/obras"
            );


        await carregarDiarios();

        preencherSelectObras(
            "filtro-obra",
            "Todas as obras"
        );

        preencherSelectObras(
            "diario-obra",
            "Selecione uma obra"
        );

        renderizarPagina();


    } catch (erro) {

        console.error(
            "Erro ao carregar diário:",
            erro
        );

        mostrarToast(
            "Não foi possível carregar o diário."
        );

    }
}


async function carregarDiarios() {

    const respostas =
        await Promise.all(
            obras.map(
                async obra => {

                    try {

                        const registros =
                            await apiGet(
                                `/obras/${obra.id}/diarios`
                            );


                        return registros.map(
                            registro => ({
                                ...registro,
                                obra_nome: obra.nome,
                                obra_endereco: obra.endereco
                            })
                        );


                    } catch (erro) {

                        console.error(
                            "Erro ao carregar registros da obra:",
                            obra.id,
                            erro
                        );

                        return [];

                    }
                }
            )
        );


    diarios =
        respostas
            .flat()
            .sort(
                (a, b) =>
                    b.data.localeCompare(
                        a.data
                    ) ||
                    b.id -
                    a.id
            );

}


function configurarFiltros() {

    [
        "busca-diario",
        "filtro-obra",
        "filtro-data",
        "filtro-etapa",
        "filtro-clima"
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


function configurarModalDiario() {

    document
        .getElementById(
            "btn-novo-diario"
        )
        ?.addEventListener(
            "click",
            abrirModalDiario
        );


    document
        .getElementById(
            "form-diario"
        )
        ?.addEventListener(
            "submit",
            salvarDiario
        );


    document
        .getElementById(
            "diario-obra"
        )
        ?.addEventListener(
            "change",
            atualizarEtapasDoRegistro
        );


    const modal =
        document.getElementById(
            "modal-diario"
        );


    modal?.addEventListener(
        "click",
        evento => {

            if (evento.target === modal) {

                fecharModalDiario();

            }

        }
    );


    document.addEventListener(
        "keydown",
        evento => {

            if (evento.key === "Escape") {

                fecharModalDiario();

            }

        }
    );

}


function abrirModalDiario() {

    if (obras.length === 0) {

        mostrarToast(
            "Cadastre uma obra antes de registrar o diário."
        );

        return;

    }


    document
        .getElementById(
            "form-diario"
        )
        .reset();


    setValor(
        "diario-data",
        formatarDataInputHoje()
    );


    setValor(
        "diario-clima",
        "sol"
    );


    atualizarEtapasDoRegistro();


    setTexto(
        "diario-erro",
        ""
    );


    abrirModal(
        "modal-diario"
    );

}


function fecharModalDiario() {

    fecharModal(
        "modal-diario"
    );

}


async function salvarDiario(evento) {

    evento.preventDefault();


    const obraId =
        document.getElementById(
            "diario-obra"
        ).value;


    const erro =
        document.getElementById(
            "diario-erro"
        );


    const botao =
        document.getElementById(
            "btn-salvar-diario"
        );


    erro.textContent =
        "";


    if (!obraId) {

        erro.textContent =
            "Selecione uma obra.";

        return;

    }


    const dados = {
        data: document.getElementById("diario-data").value,
        clima: document.getElementById("diario-clima").value,
        quantidade_pessoas: Number(document.getElementById("diario-pessoas").value) || 0,
        etapa: lerTextoOuNulo("diario-etapa"),
        servicos_executados: lerTexto("diario-servicos"),
        materiais_utilizados: lerTextoOuNulo("diario-materiais"),
        ocorrencias: lerTextoOuNulo("diario-ocorrencias")
    };


    try {

        alternarBotaoSalvando(
            botao,
            "Salvando..."
        );


        await apiPost(
            `/obras/${obraId}/diarios`,
            dados
        );


        fecharModalDiario();

        await carregarDiarios();

        renderizarPagina();

        mostrarToast(
            "Registro do diário salvo."
        );


    } catch (erroApi) {

        console.error(
            "Erro ao salvar diário:",
            erroApi
        );


        erro.textContent =
            "Não foi possível salvar o registro.";


    } finally {

        restaurarBotao(
            botao
        );

    }

}


function renderizarPagina() {

    preencherFiltroEtapas();
    renderizarGuiaEtapas();
    renderizarResumo();
    renderizarLista();

}


function renderizarResumo() {

    const hoje =
        formatarDataInputHoje();


    const registrosHoje =
        diarios.filter(
            diario =>
                diario.data === hoje
        );


    const pessoasHoje =
        registrosHoje.reduce(
            (total, diario) =>
                total +
                Number(
                    diario.quantidade_pessoas
                ),
            0
        );


    setTexto(
        "resumo-total",
        diarios.length
    );


    setTexto(
        "resumo-hoje",
        registrosHoje.length
    );


    setTexto(
        "resumo-pessoas",
        pessoasHoje
    );


    setTexto(
        "resumo-ocorrencias",
        diarios.filter(
            diario =>
                diario.ocorrencias
        ).length
    );

}


function renderizarLista() {

    renderizarGuiaEtapas();


    const lista =
        document.getElementById(
            "lista-diarios"
        );


    const busca =
        lerFiltro(
            "busca-diario"
        );


    const obraId =
        document.getElementById(
            "filtro-obra"
        ).value;


    const data =
        document.getElementById(
            "filtro-data"
        ).value;


    const etapa =
        document.getElementById(
            "filtro-etapa"
        ).value;


    const clima =
        document.getElementById(
            "filtro-clima"
        ).value;


    const filtrados =
        diarios.filter(
            diario => {

                const texto =
                    [
                        diario.obra_nome,
                        diario.obra_endereco,
                        diario.servicos_executados,
                        diario.etapa,
                        diario.materiais_utilizados,
                        diario.ocorrencias
                    ]
                        .join(" ")
                        .toLowerCase();


                return (
                    (!busca || texto.includes(busca)) &&
                    (!obraId || String(diario.obra_id) === obraId) &&
                    (!data || diario.data === data) &&
                    (!etapa || diario.etapa === etapa) &&
                    (!clima || diario.clima === clima)
                );

            }
        );


    if (filtrados.length === 0) {

        lista.innerHTML = `
            <div class="empty-state">
                Nenhum registro encontrado.
            </div>
        `;

        return;

    }


    lista.innerHTML =
        filtrados
            .map(
                diario => `
                    <article class="operacional-card">
                        <div class="operacional-card-header">
                            <div class="operacional-identidade">
                                <span class="operacional-icon">
                                    <span class="material-symbols-outlined">
                                        edit_note
                                    </span>
                                </span>

                                <div>
                                    <h3>${escaparHtml(diario.obra_nome)}</h3>
                                    <p>${formatarData(diario.data)} · ${escaparHtml(diario.etapa || "Sem etapa")}</p>
                                </div>
                            </div>

                            <div class="chip-row">
                                <span class="clima-chip ${diario.clima}">
                                    <span class="material-symbols-outlined">
                                        ${iconeClima(diario.clima)}
                                    </span>
                                    ${formatarClima(diario.clima)}
                                </span>

                                <span class="status-chip ok">
                                    <span class="material-symbols-outlined">
                                        groups
                                    </span>
                                    ${diario.quantidade_pessoas}
                                </span>
                            </div>
                        </div>

                        <div class="registro-bloco">
                            <span>Serviços executados</span>
                            <p>${escaparHtml(diario.servicos_executados)}</p>
                        </div>

                        ${diario.materiais_utilizados ? `
                            <div class="registro-bloco">
                                <span>Materiais utilizados</span>
                                <p>${escaparHtml(diario.materiais_utilizados)}</p>
                            </div>
                        ` : ""}

                        ${diario.ocorrencias ? `
                            <div class="registro-alerta">
                                <div class="registro-bloco">
                                    <span>Ocorrências e observações</span>
                                    <p>${escaparHtml(diario.ocorrencias)}</p>
                                </div>
                            </div>
                        ` : ""}

                        <div class="operacional-card-footer">
                            <button
                                class="text-button"
                                type="button"
                                onclick="abrirObra(${diario.obra_id})"
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


function preencherFiltroEtapas() {

    const select =
        document.getElementById(
            "filtro-etapa"
        );


    if (!select) {
        return;
    }


    const valorAtual =
        select.value;


    const etapas =
        [
            ...new Set(
                [
                    ...obterTodasEtapas(),
                    ...diarios
                        .map(
                            diario =>
                                diario.etapa
                        )
                        .filter(Boolean)
                ]
            )
        ];


    select.innerHTML = `
        <option value="">Todas as etapas</option>
        ${etapas
            .map(
                etapa => `
                    <option value="${escaparHtml(etapa)}">
                        ${escaparHtml(etapa)}
                    </option>
                `
            )
            .join("")}
    `;


    if (etapas.includes(valorAtual)) {

        select.value =
            valorAtual;

    }

}


function atualizarEtapasDoRegistro() {

    const selectObra =
        document.getElementById(
            "diario-obra"
        );


    const selectEtapa =
        document.getElementById(
            "diario-etapa"
        );


    if (!selectObra || !selectEtapa) {
        return;
    }


    const obra =
        obras.find(
            item =>
                String(item.id) ===
                selectObra.value
        );


    const etapas =
        obterEtapasPorTipo(
            obra?.tipo_obra
        );


    selectEtapa.innerHTML = `
        <option value="">Selecione uma etapa</option>
        ${etapas
            .map(
                etapa => `
                    <option value="${escaparHtml(etapa)}">
                        ${escaparHtml(etapa)}
                    </option>
                `
            )
            .join("")}
    `;

}


function renderizarGuiaEtapas() {

    const lista =
        document.getElementById(
            "lista-etapas-guia"
        );


    if (!lista) {
        return;
    }


    const obraId =
        document.getElementById(
            "filtro-obra"
        ).value;


    const obra =
        obras.find(
            item =>
                String(item.id) === obraId
        );


    const etapas =
        obterEtapasPorTipo(
            obra?.tipo_obra
        );


    const etapaAtual =
        document.getElementById(
            "filtro-etapa"
        ).value;


    lista.innerHTML =
        etapas
            .map(
                (etapa, indice) => `
                    <button
                        class="diario-etapa-item ${etapaAtual === etapa ? "active" : ""}"
                        type="button"
                        onclick="filtrarPorEtapa('${encodeURIComponent(etapa)}')"
                    >
                        <span>${String(indice + 1).padStart(2, "0")}</span>
                        <strong>${escaparHtml(etapa)}</strong>
                    </button>
                `
            )
            .join("");

}


function filtrarPorEtapa(etapaCodificada) {

    const etapa =
        decodeURIComponent(
            etapaCodificada
        );


    setValor(
        "filtro-etapa",
        etapa
    );


    renderizarGuiaEtapas();
    renderizarLista();

}


function abrirObra(obraId) {

    window.location.href =
        `../obras/detalhe/index.html?id=${obraId}&tab=diario`;

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
