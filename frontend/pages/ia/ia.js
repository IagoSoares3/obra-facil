let obras = [];
let obraSelecionada = null;
let contextoAtual = {
    diarios: [],
    equipe: [],
    materiais: []
};
let mensagens = [];
let enviando = false;


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarSidebarPadrao();
        configurarEventos();
        renderizarMensagemInicial();

        await carregarObras();

    }
);


function configurarEventos() {

    document
        .getElementById(
            "manuca-obra"
        )
        ?.addEventListener(
            "change",
            async (evento) => {

                await selecionarObra(
                    evento.target.value
                );

            }
        );


    document
        .getElementById(
            "form-manuca"
        )
        ?.addEventListener(
            "submit",
            enviarMensagem
        );


    document
        .getElementById(
            "manuca-mensagem"
        )
        ?.addEventListener(
            "keydown",
            (evento) => {

                if (
                    evento.key === "Enter" &&
                    !evento.shiftKey
                ) {

                    evento.preventDefault();

                    document
                        .getElementById(
                            "form-manuca"
                        )
                        ?.requestSubmit();

                }

            }
        );


    document
        .getElementById(
            "btn-limpar-chat"
        )
        ?.addEventListener(
            "click",
            () => {

                mensagens = [];
                renderizarMensagemInicial();

                mostrarToast(
                    "Conversa limpa."
                );

            }
        );


    document
        .querySelectorAll(
            "[data-prompt]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        setValor(
                            "manuca-mensagem",
                            botao.dataset.prompt
                        );

                        document
                            .getElementById(
                                "form-manuca"
                            )
                            ?.requestSubmit();

                    }
                );

            }
        );

}


async function carregarObras() {

    try {

        obras =
            await apiGet(
                "/obras"
            );


        preencherSelectObras();

        const parametros =
            new URLSearchParams(
                window.location.search
            );


        const obraId =
            parametros.get(
                "obra_id"
            ) ||
            parametros.get(
                "id"
            ) ||
            obras[0]?.id;


        if (obraId) {

            setValor(
                "manuca-obra",
                obraId
            );

            await selecionarObra(
                obraId
            );

        } else {

            atualizarStatus(
                "Nenhuma obra cadastrada."
            );

            renderizarContexto();

        }

    } catch (erro) {

        console.error(
            "Erro ao carregar obras para o Manuca:",
            erro
        );

        atualizarStatus(
            "Não foi possível carregar as obras."
        );

        mostrarToast(
            "Não foi possível carregar a IA."
        );

    }

}


function preencherSelectObras() {

    const select =
        document.getElementById(
            "manuca-obra"
        );


    if (!select) {
        return;
    }


    if (obras.length === 0) {

        select.innerHTML = `
            <option value="">
                Nenhuma obra cadastrada
            </option>
        `;

        return;

    }


    select.innerHTML =
        obras
            .map(
                obra => `
                    <option value="${obra.id}">
                        ${escaparHtml(obra.nome)}
                    </option>
                `
            )
            .join("");

}


async function selecionarObra(obraId) {

    const obraAnteriorId =
        obraSelecionada?.id;


    obraSelecionada =
        obras.find(
            obra =>
                String(obra.id) === String(obraId)
        ) || null;


    contextoAtual = {
        diarios: [],
        equipe: [],
        materiais: []
    };


    if (!obraSelecionada) {

        atualizarStatus(
            "Selecione uma obra."
        );

        renderizarContexto();
        return;

    }


    if (
        obraAnteriorId &&
        String(obraAnteriorId) !== String(obraSelecionada.id)
    ) {

        renderizarMensagemInicial();

    }


    atualizarStatus(
        `Contexto ativo: ${obraSelecionada.nome}`
    );

    renderizarContexto(
        true
    );


    try {

        const [
            diarios,
            equipe,
            materiais
        ] =
            await Promise.all(
                [
                    apiGet(
                        `/obras/${obraSelecionada.id}/diarios`
                    ),
                    apiGet(
                        `/obras/${obraSelecionada.id}/equipe`
                    ),
                    apiGet(
                        `/obras/${obraSelecionada.id}/materiais`
                    )
                ]
            );


        contextoAtual = {
            diarios,
            equipe,
            materiais
        };

        renderizarContexto();

    } catch (erro) {

        console.error(
            "Erro ao carregar contexto do Manuca:",
            erro
        );

        renderizarContexto();

        mostrarToast(
            "Alguns dados da obra não foram carregados."
        );

    }

}


async function enviarMensagem(evento) {

    evento?.preventDefault();


    if (enviando) {
        return;
    }


    if (!obraSelecionada) {

        mostrarToast(
            "Selecione uma obra para conversar com o Manuca."
        );

        return;

    }


    const input =
        document.getElementById(
            "manuca-mensagem"
        );


    const texto =
        input.value.trim();


    if (!texto) {
        return;
    }


    const historico =
        mensagens
            .slice(-8)
            .map(
                mensagem => ({
                    papel:
                        mensagem.autor === "usuario"
                            ? "usuario"
                            : "manuca",
                    texto:
                        mensagem.texto
                })
            );


    input.value = "";

    adicionarMensagem(
        "usuario",
        texto
    );

    const carregandoId =
        adicionarMensagemCarregando();


    try {

        enviando = true;
        alternarEnvio(
            true
        );


        const resposta =
            await apiPost(
                "/ia/manuca",
                {
                    obra_id: obraSelecionada.id,
                    mensagem: texto,
                    historico
                }
            );


        removerMensagem(
            carregandoId
        );

        adicionarMensagem(
            "manuca",
            resposta.resposta
        );

    } catch (erro) {

        console.error(
            "Erro ao conversar com Manuca:",
            erro
        );

        removerMensagem(
            carregandoId
        );

        adicionarMensagem(
            "manuca",
            "Não consegui consultar a IA agora. Verifique a chave Gemini e a conexão do backend."
        );

        mostrarToast(
            "Manuca não respondeu agora."
        );

    } finally {

        enviando = false;
        alternarEnvio(
            false
        );

        input.focus();

    }

}


function renderizarMensagemInicial() {

    mensagens = [];

    const lista =
        document.getElementById(
            "manuca-mensagens"
        );


    if (!lista) {
        return;
    }


    lista.innerHTML = `
        <article class="ia-message manuca">
            <span class="ia-avatar pequeno">
                <span class="material-symbols-outlined">
                    auto_awesome
                </span>
            </span>

            <div class="ia-bubble">
                <strong>Manuca</strong>
                <p>Pronto para analisar a obra selecionada.</p>
            </div>
        </article>
    `;

}


function adicionarMensagem(
    autor,
    texto
) {

    const lista =
        document.getElementById(
            "manuca-mensagens"
        );


    if (!lista) {
        return null;
    }


    const id =
        `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;


    const mensagem = {
        id,
        autor,
        texto
    };


    mensagens.push(
        mensagem
    );


    lista.insertAdjacentHTML(
        "beforeend",
        montarMensagemHtml(
            mensagem
        )
    );

    rolarMensagens();

    return id;

}


function adicionarMensagemCarregando() {

    const lista =
        document.getElementById(
            "manuca-mensagens"
        );


    const id =
        `typing-${Date.now()}`;


    lista.insertAdjacentHTML(
        "beforeend",
        `
            <article class="ia-message manuca" data-id="${id}">
                <span class="ia-avatar pequeno">
                    <span class="material-symbols-outlined">
                        auto_awesome
                    </span>
                </span>

                <div class="ia-bubble">
                    <strong>Manuca</strong>
                    <div class="ia-typing" aria-label="Manuca pensando">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </article>
        `
    );

    rolarMensagens();

    return id;

}


function removerMensagem(id) {

    document
        .querySelector(
            `[data-id="${id}"]`
        )
        ?.remove();

}


function montarMensagemHtml(mensagem) {

    const ehUsuario =
        mensagem.autor === "usuario";


    return `
        <article
            class="ia-message ${ehUsuario ? "usuario" : "manuca"}"
            data-id="${mensagem.id}"
        >
            <span class="ia-avatar pequeno ${ehUsuario ? "usuario" : ""}">
                <span class="material-symbols-outlined">
                    ${ehUsuario ? "person" : "auto_awesome"}
                </span>
            </span>

            <div class="ia-bubble">
                <strong>${ehUsuario ? "Você" : "Manuca"}</strong>
                ${formatarTextoResposta(mensagem.texto)}
            </div>
        </article>
    `;

}


function formatarTextoResposta(texto) {

    return String(
        texto || ""
    )
        .split(/\n{2,}/)
        .map(
            bloco => `
                <p>
                    ${escaparHtml(bloco).replace(/\n/g, "<br>")}
                </p>
            `
        )
        .join("");

}


function renderizarContexto(carregando = false) {

    const painel =
        document.getElementById(
            "manuca-contexto"
        );


    if (!painel) {
        return;
    }


    if (!obraSelecionada) {

        painel.innerHTML = `
            <div class="empty-state">
                Nenhuma obra selecionada.
            </div>
        `;

        return;

    }


    const diarios =
        contextoAtual.diarios || [];


    const equipe =
        contextoAtual.equipe || [];


    const materiais =
        contextoAtual.materiais || [];


    const ultimoDiario =
        diarios[0];


    const pessoasAtivas =
        equipe.filter(
            pessoa =>
                pessoa.ativo
        ).length;


    const materiaisAlerta =
        materiais.filter(
            material =>
                material.em_alerta
        );


    const etapas =
        obterEtapasPorTipo(
            obraSelecionada.tipo_obra
        );


    painel.innerHTML = `
        <div class="ia-context-card">
            <h4>${escaparHtml(obraSelecionada.nome)}</h4>

            <div class="ia-context-row">
                <span>Tipo</span>
                <strong>${formatarTipoObra(obraSelecionada.tipo_obra)}</strong>
            </div>

            <div class="ia-context-row">
                <span>Status</span>
                <strong>${formatarStatusObra(obraSelecionada.status)}</strong>
            </div>

            <div class="ia-context-row">
                <span>Início</span>
                <strong>${formatarData(obraSelecionada.data_inicio)}</strong>
            </div>

            <div class="ia-context-row">
                <span>Último diário</span>
                <strong>${ultimoDiario ? formatarData(ultimoDiario.data) : "—"}</strong>
            </div>

            <button
                class="text-button"
                type="button"
                onclick="abrirObraSelecionada()"
            >
                Abrir obra
                <span class="material-symbols-outlined">arrow_forward</span>
            </button>
        </div>

        <div class="ia-context-card">
            <h4>Operação</h4>

            <div class="ia-context-row">
                <span>Diários</span>
                <strong>${carregando ? "..." : diarios.length}</strong>
            </div>

            <div class="ia-context-row">
                <span>Equipe ativa</span>
                <strong>${carregando ? "..." : pessoasAtivas}</strong>
            </div>

            <div class="ia-context-row">
                <span>Materiais</span>
                <strong>${carregando ? "..." : materiais.length}</strong>
            </div>

            <div class="ia-context-row">
                <span>Alertas</span>
                <strong class="${materiaisAlerta.length ? "ia-context-alert" : "ia-context-ok"}">
                    ${carregando ? "..." : materiaisAlerta.length}
                </strong>
            </div>
        </div>

        <div class="ia-context-card">
            <h4>Hierarquia</h4>

            <div class="ia-context-list">
                ${HIERARQUIA_OBRA
                    .map(
                        nivel => `
                            <span>${escaparHtml(nivel)}</span>
                        `
                    )
                    .join("")}
            </div>
        </div>

        <div class="ia-context-card">
            <h4>Etapas</h4>

            <div class="ia-context-list">
                ${etapas
                    .slice(0, 8)
                    .map(
                        etapa => `
                            <span>${escaparHtml(etapa)}</span>
                        `
                    )
                    .join("")}
            </div>
        </div>
    `;

}


function abrirObraSelecionada() {

    if (!obraSelecionada) {
        return;
    }


    window.location.href =
        `../obras/detalhe/index.html?id=${obraSelecionada.id}`;

}


function alternarEnvio(ativo) {

    const botao =
        document.getElementById(
            "btn-enviar-manuca"
        );


    const input =
        document.getElementById(
            "manuca-mensagem"
        );


    if (botao) {

        botao.disabled =
            ativo;

        botao.innerHTML =
            ativo
                ? `
                    <span class="material-symbols-outlined">
                        progress_activity
                    </span>
                `
                : `
                    <span class="material-symbols-outlined">
                        send
                    </span>
                `;

    }


    if (input) {

        input.disabled =
            ativo;

    }

}


function atualizarStatus(texto) {

    setTexto(
        "manuca-status",
        texto
    );

}


function rolarMensagens() {

    const lista =
        document.getElementById(
            "manuca-mensagens"
        );


    if (!lista) {
        return;
    }


    lista.scrollTop =
        lista.scrollHeight;

}


function formatarTipoObra(tipo) {

    const tipos = {
        construcao: "Construção",
        reforma: "Reforma"
    };


    return tipos[tipo] ?? tipo ?? "—";

}


function formatarStatusObra(status) {

    const statusMap = {
        planejamento: "Planejamento",
        andamento: "Em andamento",
        pausada: "Pausada",
        concluida: "Concluída"
    };


    return statusMap[status] ?? status ?? "—";

}
