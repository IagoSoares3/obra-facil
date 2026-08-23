const API_URL = "http://127.0.0.1:8000";


async function apiGet(endpoint) {
    const resposta = await fetch(
        `${API_URL}${endpoint}`
    );

    if (!resposta.ok) {
        throw new Error(
            `Erro ${resposta.status} ao buscar ${endpoint}`
        );
    }

    return resposta.json();
}


async function apiPost(endpoint, dados) {
    const resposta = await fetch(
        `${API_URL}${endpoint}`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(dados)
        }
    );

    if (!resposta.ok) {
        const erro = await resposta.json();

        throw new Error(
            JSON.stringify(erro)
        );
    }

    return resposta.json();
}