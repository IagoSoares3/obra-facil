let obras = [];
let materiais = [];


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarSidebarPadrao();
        configurarFiltros();
        configurarModalMaterial();
        configurarModalMovimento();

        await carregarDados();

    }
);


async function carregarDados() {

    try {

        obras =
            await apiGet(
                "/obras"
            );


        await carregarMateriais();

        preencherSelectObras(
            "filtro-obra",
            "Todas as obras"
        );

        preencherSelectObras(
            "material-obra",
            "Selecione uma obra"
        );

        preencherSelectObras(
            "movimento-obra",
            "Selecione uma obra"
        );

        renderizarPagina();


    } catch (erro) {

        console.error(
            "Erro ao carregar materiais:",
            erro
        );

        mostrarToast(
            "Não foi possível carregar os materiais."
        );

    }
}


async function carregarMateriais() {

    const respostas =
        await Promise.all(
            obras.map(
                async obra => {

                    try {

                        const itens =
                            await apiGet(
                                `/obras/${obra.id}/materiais`
                            );


                        return itens.map(
                            material => ({
                                ...material,
                                obra_nome: obra.nome
                            })
                        );


                    } catch (erro) {

                        console.error(
                            "Erro ao carregar materiais da obra:",
                            obra.id,
                            erro
                        );

                        return [];

                    }
                }
            )
        );


    materiais =
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
        "busca-materiais",
        "filtro-obra",
        "filtro-status"
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


function configurarModalMaterial() {

    document
        .getElementById(
            "btn-novo-material"
        )
        ?.addEventListener(
            "click",
            abrirModalMaterial
        );


    document
        .getElementById(
            "form-material"
        )
        ?.addEventListener(
            "submit",
            salvarMaterial
        );


    configurarFechamentoModal(
        "modal-material",
        fecharModalMaterial
    );

}


function configurarModalMovimento() {

    document
        .getElementById(
            "btn-novo-movimento"
        )
        ?.addEventListener(
            "click",
            abrirModalMovimento
        );


    document
        .getElementById(
            "movimento-obra"
        )
        ?.addEventListener(
            "change",
            atualizarSelectMateriaisDoMovimento
        );


    document
        .getElementById(
            "form-movimento"
        )
        ?.addEventListener(
            "submit",
            salvarMovimento
        );


    configurarFechamentoModal(
        "modal-movimento",
        fecharModalMovimento
    );

}


function configurarFechamentoModal(
    id,
    fechar
) {

    const modal =
        document.getElementById(
            id
        );


    modal?.addEventListener(
        "click",
        evento => {

            if (evento.target === modal) {

                fechar();

            }

        }
    );


    document.addEventListener(
        "keydown",
        evento => {

            if (evento.key === "Escape") {

                fechar();

            }

        }
    );

}


function abrirModalMaterial() {

    if (obras.length === 0) {

        mostrarToast(
            "Cadastre uma obra antes de cadastrar materiais."
        );

        return;

    }


    document
        .getElementById(
            "form-material"
        )
        .reset();


    setValor(
        "material-unidade",
        "un"
    );


    setTexto(
        "material-erro",
        ""
    );


    abrirModal(
        "modal-material"
    );

}


function fecharModalMaterial() {

    fecharModal(
        "modal-material"
    );

}


function abrirModalMovimento() {

    if (materiais.length === 0) {

        mostrarToast(
            "Cadastre um material antes de registrar movimento."
        );

        return;

    }


    document
        .getElementById(
            "form-movimento"
        )
        .reset();


    setValor(
        "movimento-data",
        formatarDataInputHoje()
    );


    setTexto(
        "movimento-erro",
        ""
    );


    atualizarSelectMateriaisDoMovimento();

    abrirModal(
        "modal-movimento"
    );

}


function fecharModalMovimento() {

    fecharModal(
        "modal-movimento"
    );

}


async function salvarMaterial(evento) {

    evento.preventDefault();


    const obraId =
        document.getElementById(
            "material-obra"
        ).value;


    const erro =
        document.getElementById(
            "material-erro"
        );


    const botao =
        document.getElementById(
            "btn-salvar-material"
        );


    erro.textContent =
        "";


    if (!obraId) {

        erro.textContent =
            "Selecione uma obra.";

        return;

    }


    const dados = {
        nome: lerTexto("material-nome"),
        unidade: lerTexto("material-unidade"),
        estoque_minimo: Number(document.getElementById("material-minimo").value) || 0
    };


    try {

        alternarBotaoSalvando(
            botao,
            "Salvando..."
        );


        await apiPost(
            `/obras/${obraId}/materiais`,
            dados
        );


        fecharModalMaterial();

        await carregarMateriais();

        renderizarPagina();

        mostrarToast(
            "Material cadastrado."
        );


    } catch (erroApi) {

        console.error(
            "Erro ao salvar material:",
            erroApi
        );


        erro.textContent =
            "Não foi possível salvar o material.";


    } finally {

        restaurarBotao(
            botao
        );

    }

}


async function salvarMovimento(evento) {

    evento.preventDefault();


    const obraId =
        document.getElementById(
            "movimento-obra"
        ).value;


    const materialId =
        document.getElementById(
            "movimento-material"
        ).value;


    const erro =
        document.getElementById(
            "movimento-erro"
        );


    const botao =
        document.getElementById(
            "btn-salvar-movimento"
        );


    erro.textContent =
        "";


    if (!obraId || !materialId) {

        erro.textContent =
            "Selecione a obra e o material.";

        return;

    }


    const dados = {
        tipo: document.getElementById("movimento-tipo").value,
        quantidade: Number(document.getElementById("movimento-quantidade").value),
        data: document.getElementById("movimento-data").value,
        etapa: lerTextoOuNulo("movimento-etapa"),
        observacao: lerTextoOuNulo("movimento-observacao")
    };


    try {

        alternarBotaoSalvando(
            botao,
            "Registrando..."
        );


        await apiPost(
            `/obras/${obraId}/materiais/${materialId}/movimentos`,
            dados
        );


        fecharModalMovimento();

        await carregarMateriais();

        renderizarPagina();

        mostrarToast(
            "Movimento registrado."
        );


    } catch (erroApi) {

        console.error(
            "Erro ao registrar movimento:",
            erroApi
        );


        erro.textContent =
            "Não foi possível registrar o movimento.";


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

    const obrasComEstoque =
        new Set(
            materiais.map(
                material =>
                    material.obra_id
            )
        );


    const movimentos =
        materiais.reduce(
            (total, material) =>
                total +
                (
                    material.movimentos || []
                ).length,
            0
        );


    setTexto(
        "resumo-total",
        materiais.length
    );


    setTexto(
        "resumo-alertas",
        materiais.filter(
            material =>
                material.em_alerta
        ).length
    );


    setTexto(
        "resumo-obras",
        obrasComEstoque.size
    );


    setTexto(
        "resumo-movimentos",
        movimentos
    );

}


function renderizarLista() {

    const lista =
        document.getElementById(
            "lista-materiais"
        );


    const busca =
        lerFiltro(
            "busca-materiais"
        );


    const obraId =
        document.getElementById(
            "filtro-obra"
        ).value;


    const status =
        document.getElementById(
            "filtro-status"
        ).value;


    const filtrados =
        materiais.filter(
            material => {

                const movimentos =
                    material.movimentos || [];


                const textoMovimentos =
                    movimentos
                        .map(
                            movimento =>
                                `${movimento.etapa || ""} ${movimento.observacao || ""}`
                        )
                        .join(" ");


                const texto =
                    `${material.nome} ${material.unidade} ${material.obra_nome} ${textoMovimentos}`
                        .toLowerCase();


                const statusMaterial =
                    material.em_alerta
                        ? "alerta"
                        : "ok";


                return (
                    (!busca || texto.includes(busca)) &&
                    (!obraId || String(material.obra_id) === obraId) &&
                    (!status || statusMaterial === status)
                );

            }
        );


    if (filtrados.length === 0) {

        lista.innerHTML = `
            <div class="empty-state">
                Nenhum material encontrado.
            </div>
        `;

        return;

    }


    lista.innerHTML =
        filtrados
            .map(
                material => {

                    const movimentos =
                        material.movimentos || [];


                    const ultimos =
                        movimentos.slice(
                            0,
                            3
                        );


                    return `
                        <article class="operacional-card">
                            <div class="operacional-card-header">
                                <div class="operacional-identidade">
                                    <span class="operacional-icon">
                                        <span class="material-symbols-outlined">
                                            inventory_2
                                        </span>
                                    </span>

                                    <div>
                                        <h3>${escaparHtml(material.nome)}</h3>
                                        <p>${escaparHtml(material.obra_nome)}</p>
                                    </div>
                                </div>

                                <div class="chip-row">
                                    <span class="status-chip ${material.em_alerta ? "alerta" : "ok"}">
                                        <span class="material-symbols-outlined">
                                            ${material.em_alerta ? "warning" : "check_circle"}
                                        </span>
                                        ${material.em_alerta ? "Atenção" : "Ok"}
                                    </span>
                                </div>
                            </div>

                            <div class="operacional-info-grid">
                                <div>
                                    <span>Saldo</span>
                                    <strong>${formatarQuantidade(material.saldo_atual)} ${escaparHtml(material.unidade)}</strong>
                                </div>

                                <div>
                                    <span>Mínimo</span>
                                    <strong>${formatarQuantidade(material.estoque_minimo)} ${escaparHtml(material.unidade)}</strong>
                                </div>

                                <div>
                                    <span>Movimentos</span>
                                    <strong>${movimentos.length}</strong>
                                </div>

                                <div>
                                    <span>Obra</span>
                                    <strong>${escaparHtml(material.obra_nome)}</strong>
                                </div>
                            </div>

                            <div class="movimentos-list">
                                ${ultimos.length === 0 ? `
                                    <div class="empty-state">
                                        Sem movimentos registrados.
                                    </div>
                                ` : ultimos
                                    .map(
                                        movimento => `
                                            <div class="movimento-row">
                                                <span class="movimento-chip ${movimento.tipo}">
                                                    ${formatarTipoMovimento(movimento.tipo)}
                                                </span>

                                                <strong>
                                                    ${formatarQuantidade(movimento.quantidade)} ${escaparHtml(material.unidade)}
                                                </strong>

                                                <span>
                                                    ${formatarData(movimento.data)}
                                                </span>
                                            </div>
                                        `
                                    )
                                    .join("")
                                }
                            </div>

                            <div class="operacional-card-footer">
                                <button
                                    class="text-button"
                                    type="button"
                                    onclick="abrirObra(${material.obra_id})"
                                >
                                    Abrir obra
                                    <span class="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </div>
                        </article>
                    `;

                }
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


function atualizarSelectMateriaisDoMovimento() {

    const obraId =
        document.getElementById(
            "movimento-obra"
        ).value;


    const select =
        document.getElementById(
            "movimento-material"
        );


    if (!select) {
        return;
    }


    const materiaisDaObra =
        obraId
            ? materiais.filter(
                material =>
                    String(material.obra_id) === obraId
            )
            : materiais;


    select.innerHTML = `
        <option value="">Selecione um material</option>
        ${materiaisDaObra
            .map(
                material => `
                    <option value="${material.id}">
                        ${escaparHtml(material.nome)} (${escaparHtml(material.unidade)})
                    </option>
                `
            )
            .join("")}
    `;

}


function abrirObra(obraId) {

    window.location.href =
        `../obras/detalhe/index.html?id=${obraId}&tab=materiais`;

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
