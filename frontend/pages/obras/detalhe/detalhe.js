let obraAtual = null;
let diarios = [];
let materiais = [];
let equipe = [];
let toastTimer = null;


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarSidebar();
        configurarTabs();
        configurarRegistroObra();
        configurarFormularioEquipe();
        configurarFormularioMaterial();
        configurarFormularioMovimento();
        configurarFiltroDiario();
        preencherDatasPadrao();

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


        await carregarDadosOperacionais();


        const tabInicial =
            parametros.get(
                "tab"
            );


        if (tabInicial) {

            abrirTab(
                tabInicial
            );

        }


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


async function carregarDadosOperacionais() {

    if (!obraAtual) {
        return;
    }


    await Promise.all(
        [
            carregarDiarios(),
            carregarMateriais(),
            carregarEquipe()
        ]
    );


    renderizarDadosOperacionais();

}


async function carregarDiarios() {

    try {

        diarios =
            await apiGet(
                `/obras/${obraAtual.id}/diarios`
            );


    } catch (erro) {

        console.error(
            "Erro ao carregar diários:",
            erro
        );


        diarios = [];

        mostrarToast(
            "Não foi possível carregar o diário desta obra."
        );

    }
}


async function carregarMateriais() {

    try {

        materiais =
            await apiGet(
                `/obras/${obraAtual.id}/materiais`
            );


    } catch (erro) {

        console.error(
            "Erro ao carregar materiais:",
            erro
        );


        materiais = [];

        mostrarToast(
            "Não foi possível carregar os materiais desta obra."
        );

    }
}


async function carregarEquipe() {

    try {

        equipe =
            await apiGet(
                `/obras/${obraAtual.id}/equipe`
            );


    } catch (erro) {

        console.error(
            "Erro ao carregar equipe:",
            erro
        );


        equipe = [];

        mostrarToast(
            "Não foi possível carregar a equipe desta obra."
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


    document.title =
        `${obra.nome} | Obra Fácil`;


    setTexto(
        "topbar-obra-nome",
        obra.nome
    );


    setTexto(
        "obra-nome",
        obra.nome
    );


    setTexto(
        "obra-endereco",
        obra.endereco
    );


    setTexto(
        "manuca-obra-nome",
        obra.nome
    );


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


    const statusTexto =
        formatarStatus(
            obra.status
        );


    const badge =
        document.getElementById(
            "obra-status"
        );


    if (badge) {

        badge.textContent =
            statusTexto;


        badge.className =
            `status-badge ${obra.status}`;

    }


    setTexto(
        "obra-status-info",
        statusTexto
    );


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


    setTexto(
        "obra-orcamento",
        formatarMoeda(
            obra.orcamento_previsto
        )
    );


    setTexto(
        "obra-id",
        `#${obra.id}`
    );


    setTexto(
        "obra-prazo",
        calcularPrazo(
            obra.data_inicio,
            obra.data_previsao_conclusao
        )
    );


    atualizarIndicadoresOperacionais();

}


function renderizarDadosOperacionais() {

    renderizarDiarios();
    renderizarEquipe();
    renderizarMateriais();
    atualizarIndicadoresOperacionais();

}


// ======================================================
// INDICADORES OPERACIONAIS
// ======================================================

function atualizarIndicadoresOperacionais() {

    const diarioHoje =
        diarios.find(
            diario =>
                diario.data ===
                formatarDataInputHoje()
        );


    const equipeHoje =
        diarioHoje
            ? diarioHoje.quantidade_pessoas
            : 0;


    setTexto(
        "operacao-equipe",
        equipeHoje
    );


    setTexto(
        "operacao-materiais",
        materiais.length
    );


    setTexto(
        "operacao-registros",
        diarios.length
    );


    const progresso =
        0;


    setTexto(
        "operacao-progresso",
        `${progresso}%`
    );


    setTexto(
        "progresso-percentual",
        `${progresso}%`
    );


    const barra =
        document.getElementById(
            "progresso-barra-preenchimento"
        );


    if (barra) {

        barra.style.width =
            `${progresso}%`;

    }

}


// ======================================================
// DIARIO
// ======================================================

function configurarFiltroDiario() {

    document
        .getElementById(
            "diario-filtro-data"
        )
        ?.addEventListener(
            "change",
            renderizarDiarios
        );

}


function limparFiltroDiario() {

    const campo =
        document.getElementById(
            "diario-filtro-data"
        );


    if (campo) {

        campo.value =
            "";

    }


    renderizarDiarios();

}


function renderizarDiarios() {

    const lista =
        document.getElementById(
            "lista-diarios"
        );


    if (!lista) {
        return;
    }


    const filtroData =
        document.getElementById(
            "diario-filtro-data"
        )?.value;


    const diariosFiltrados =
        filtroData
            ? diarios.filter(
                diario =>
                    diario.data === filtroData
            )
            : diarios;


    if (diariosFiltrados.length === 0) {

        lista.innerHTML = `
            <div class="empty-state">
                Nenhum registro encontrado.
            </div>
        `;

        return;

    }


    lista.innerHTML =
        diariosFiltrados
            .map(
                diario => `
                    <article class="diario-card">
                        <header class="diario-card-header">
                            <div>
                                <span class="section-kicker">
                                    ${formatarData(diario.data)}
                                </span>

                                <h4>
                                    Registro do dia
                                </h4>
                            </div>

                            <div class="diario-tags">
                                <span class="clima-badge ${diario.clima}">
                                    <span class="material-symbols-outlined">
                                        ${iconeClima(diario.clima)}
                                    </span>

                                    ${formatarClima(diario.clima)}
                                </span>

                                <span class="pessoas-badge">
                                    <span class="material-symbols-outlined">
                                        groups
                                    </span>

                                    ${diario.quantidade_pessoas}
                                </span>
                            </div>
                        </header>

                        <div class="diario-bloco">
                            <span>Serviços executados</span>
                            <p>${escaparHtml(diario.servicos_executados)}</p>
                        </div>

                        ${diario.materiais_utilizados ? `
                            <div class="diario-bloco">
                                <span>Materiais utilizados</span>
                                <p>${escaparHtml(diario.materiais_utilizados)}</p>
                            </div>
                        ` : ""}

                        ${diario.ocorrencias ? `
                            <div class="diario-bloco ocorrencia">
                                <span>Ocorrências e observações</span>
                                <p>${escaparHtml(diario.ocorrencias)}</p>
                            </div>
                        ` : ""}
                    </article>
                `
            )
            .join("");

}


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
        async (evento) => {

            evento.preventDefault();


            if (!obraAtual) {

                mostrarToast(
                    "Carregue uma obra antes de salvar o diário."
                );

                return;

            }


            const erro =
                document.getElementById(
                    "registro-erro"
                );


            const botao =
                document.getElementById(
                    "btn-salvar-registro"
                );


            if (erro) {

                erro.textContent =
                    "";

            }


            const quantidadePessoas =
                Number(
                    document.getElementById(
                        "registro-equipe"
                    ).value
                ) || 0;


            const dados = {

                data:
                    document.getElementById(
                        "registro-data"
                    ).value,

                clima:
                    document.getElementById(
                        "registro-clima"
                    ).value,

                quantidade_pessoas:
                    quantidadePessoas,

                servicos_executados:
                    lerTexto(
                        "registro-servicos"
                    ),

                materiais_utilizados:
                    lerTextoOuNulo(
                        "registro-materiais"
                    ),

                ocorrencias:
                    lerTextoOuNulo(
                        "registro-ocorrencias"
                    )

            };


            try {

                alternarBotaoSalvando(
                    botao,
                    "Salvando..."
                );


                const diario =
                    await apiPost(
                        `/obras/${obraAtual.id}/diarios`,
                        dados
                    );


                fecharRegistroObra();

                await carregarDiarios();

                renderizarDiarios();
                atualizarIndicadoresOperacionais();

                mostrarToast(
                    `Registro de ${formatarData(diario.data)} salvo.`
                );


            } catch (erroApi) {

                console.error(
                    "Erro ao salvar diário:",
                    erroApi
                );


                if (erro) {

                    erro.textContent =
                        "Não foi possível salvar o registro. Verifique os dados e tente novamente.";

                }


            } finally {

                restaurarBotao(
                    botao
                );

            }

        }
    );


    modal.addEventListener(
        "click",
        (evento) => {

            if (evento.target === modal) {

                fecharRegistroObra();

            }

        }
    );


    document.addEventListener(
        "keydown",
        (evento) => {

            if (evento.key !== "Escape") {
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


    setValor(
        "registro-data",
        formatarDataInputHoje()
    );


    setValor(
        "registro-clima",
        "sol"
    );


    setTexto(
        "registro-erro",
        ""
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
// EQUIPE
// ======================================================

function configurarFormularioEquipe() {

    const form =
        document.getElementById(
            "form-equipe"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (evento) => {

            evento.preventDefault();


            if (!obraAtual) {
                return;
            }


            const erro =
                document.getElementById(
                    "equipe-erro"
                );


            const botao =
                document.getElementById(
                    "btn-salvar-equipe"
                );


            if (erro) {

                erro.textContent =
                    "";

            }


            const dados = {

                nome:
                    lerTexto(
                        "equipe-nome"
                    ),

                funcao:
                    lerTextoOuNulo(
                        "equipe-funcao"
                    ),

                contato:
                    lerTextoOuNulo(
                        "equipe-contato"
                    ),

                ativo:
                    true

            };


            try {

                alternarBotaoSalvando(
                    botao,
                    "Salvando..."
                );


                await apiPost(
                    `/obras/${obraAtual.id}/equipe`,
                    dados
                );


                form.reset();

                await carregarEquipe();

                renderizarEquipe();

                mostrarToast(
                    "Pessoa adicionada à equipe."
                );


            } catch (erroApi) {

                console.error(
                    "Erro ao salvar pessoa:",
                    erroApi
                );


                if (erro) {

                    erro.textContent =
                        "Não foi possível salvar a pessoa da equipe.";

                }


            } finally {

                restaurarBotao(
                    botao
                );

            }

        }
    );
}


function renderizarEquipe() {

    const lista =
        document.getElementById(
            "lista-equipe"
        );


    if (!lista) {
        return;
    }


    if (equipe.length === 0) {

        lista.innerHTML = `
            <div class="empty-state">
                Nenhuma pessoa vinculada.
            </div>
        `;

        return;

    }


    lista.innerHTML =
        equipe
            .map(
                pessoa => `
                    <article class="equipe-item">
                        <span class="equipe-avatar">
                            ${obterIniciais(pessoa.nome)}
                        </span>

                        <div class="equipe-copy">
                            <strong>${escaparHtml(pessoa.nome)}</strong>
                            <span>${escaparHtml(pessoa.funcao || "Função não informada")}</span>
                        </div>

                        <span class="equipe-contato">
                            ${escaparHtml(pessoa.contato || "Sem contato")}
                        </span>
                    </article>
                `
            )
            .join("");

}


// ======================================================
// MATERIAIS
// ======================================================

function configurarFormularioMaterial() {

    const form =
        document.getElementById(
            "form-material"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (evento) => {

            evento.preventDefault();


            if (!obraAtual) {
                return;
            }


            const erro =
                document.getElementById(
                    "material-erro"
                );


            const botao =
                document.getElementById(
                    "btn-salvar-material"
                );


            if (erro) {

                erro.textContent =
                    "";

            }


            const estoqueMinimo =
                Number(
                    document.getElementById(
                        "material-minimo"
                    ).value
                ) || 0;


            const dados = {

                nome:
                    lerTexto(
                        "material-nome"
                    ),

                unidade:
                    lerTexto(
                        "material-unidade"
                    ),

                estoque_minimo:
                    estoqueMinimo

            };


            try {

                alternarBotaoSalvando(
                    botao,
                    "Salvando..."
                );


                const material =
                    await apiPost(
                        `/obras/${obraAtual.id}/materiais`,
                        dados
                    );


                form.reset();

                setValor(
                    "material-unidade",
                    "un"
                );

                await carregarMateriais();

                renderizarMateriais(
                    material.id
                );

                atualizarIndicadoresOperacionais();

                mostrarToast(
                    "Material cadastrado."
                );


            } catch (erroApi) {

                console.error(
                    "Erro ao salvar material:",
                    erroApi
                );


                if (erro) {

                    erro.textContent =
                        "Não foi possível salvar o material.";

                }


            } finally {

                restaurarBotao(
                    botao
                );

            }

        }
    );
}


function configurarFormularioMovimento() {

    const form =
        document.getElementById(
            "form-movimento-material"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (evento) => {

            evento.preventDefault();


            if (!obraAtual) {
                return;
            }


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


            if (erro) {

                erro.textContent =
                    "";

            }


            if (!materialId) {

                if (erro) {

                    erro.textContent =
                        "Selecione um material para movimentar.";

                }

                return;

            }


            const dados = {

                tipo:
                    document.getElementById(
                        "movimento-tipo"
                    ).value,

                quantidade:
                    Number(
                        document.getElementById(
                            "movimento-quantidade"
                        ).value
                    ),

                data:
                    document.getElementById(
                        "movimento-data"
                    ).value,

                etapa:
                    lerTextoOuNulo(
                        "movimento-etapa"
                    ),

                observacao:
                    lerTextoOuNulo(
                        "movimento-observacao"
                    )

            };


            try {

                alternarBotaoSalvando(
                    botao,
                    "Registrando..."
                );


                await apiPost(
                    `/obras/${obraAtual.id}/materiais/${materialId}/movimentos`,
                    dados
                );


                form.reset();

                setValor(
                    "movimento-data",
                    formatarDataInputHoje()
                );

                setValor(
                    "movimento-material",
                    materialId
                );

                await carregarMateriais();

                renderizarMateriais(
                    Number(materialId)
                );

                atualizarIndicadoresOperacionais();

                mostrarToast(
                    "Movimento de material registrado."
                );


            } catch (erroApi) {

                console.error(
                    "Erro ao registrar movimento:",
                    erroApi
                );


                if (erro) {

                    erro.textContent =
                        "Não foi possível registrar o movimento.";

                }


            } finally {

                restaurarBotao(
                    botao
                );

            }

        }
    );
}


function renderizarMateriais(
    materialSelecionado = null
) {

    atualizarSelectMateriais(
        materialSelecionado
    );


    const lista =
        document.getElementById(
            "lista-materiais"
        );


    if (!lista) {
        return;
    }


    if (materiais.length === 0) {

        lista.innerHTML = `
            <div class="empty-state">
                Nenhum material cadastrado.
            </div>
        `;

        return;

    }


    lista.innerHTML =
        materiais
            .map(
                material => {

                    const movimentos =
                        material.movimentos || [];


                    const ultimosMovimentos =
                        movimentos.slice(
                            0,
                            3
                        );


                    return `
                        <article class="material-card ${material.em_alerta ? "alerta" : ""}">
                            <header class="material-card-header">
                                <div>
                                    <span class="section-kicker">
                                        ${escaparHtml(material.unidade)}
                                    </span>

                                    <h4>
                                        ${escaparHtml(material.nome)}
                                    </h4>
                                </div>

                                <span class="material-saldo">
                                    ${formatarQuantidade(material.saldo_atual)}
                                </span>
                            </header>

                            <div class="material-info-grid">
                                <div>
                                    <span>Estoque mínimo</span>
                                    <strong>${formatarQuantidade(material.estoque_minimo)}</strong>
                                </div>

                                <div>
                                    <span>Status</span>
                                    <strong>${material.em_alerta ? "Atenção" : "Ok"}</strong>
                                </div>
                            </div>

                            <div class="material-movimentos">
                                ${ultimosMovimentos.length === 0 ? `
                                    <div class="movimento-vazio">
                                        Sem movimentos registrados.
                                    </div>
                                ` : ultimosMovimentos
                                    .map(
                                        movimento => `
                                            <div class="movimento-item">
                                                <span class="movimento-badge ${movimento.tipo}">
                                                    ${formatarTipoMovimento(movimento.tipo)}
                                                </span>

                                                <strong>
                                                    ${formatarQuantidade(movimento.quantidade)}
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
                        </article>
                    `;

                }
            )
            .join("");

}


function atualizarSelectMateriais(
    materialSelecionado = null
) {

    const select =
        document.getElementById(
            "movimento-material"
        );


    if (!select) {
        return;
    }


    const valorAtual =
        materialSelecionado ??
        select.value;


    select.innerHTML = `
        <option value="">
            Selecione um material
        </option>
        ${materiais
            .map(
                material => `
                    <option value="${material.id}">
                        ${escaparHtml(material.nome)} (${escaparHtml(material.unidade)})
                    </option>
                `
            )
            .join("")}
    `;


    if (
        valorAtual &&
        materiais.some(
            material =>
                Number(material.id) ===
                Number(valorAtual)
        )
    ) {

        select.value =
            valorAtual;

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

    const alvo =
        document.querySelector(
            `.obra-tab[data-tab="${nome}"]`
        );


    if (!alvo) {
        return;
    }


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


    alvo.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest"
    });

}


// ======================================================
// MANUCA IA
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
// UTILITARIOS DE FORMULARIO
// ======================================================

function preencherDatasPadrao() {

    const hoje =
        formatarDataInputHoje();


    setValor(
        "registro-data",
        hoje
    );


    setValor(
        "movimento-data",
        hoje
    );

}


function focarCampo(id) {

    document
        .getElementById(
            id
        )
        ?.focus();

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
