import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const diretorioBackend = fileURLToPath(new URL('../../', import.meta.url));
const arquivoBanco = join(diretorioBackend, 'data', 'obrasense.json');

const tabelas = [
  'usuarios',
  'prestadores',
  'servicos',
  'solicitacoes',
  'propostas',
  'obras',
  'atualizacoes',
  'produtos',
  'etapas',
];

function bancoVazio() {
  return {
    ...Object.fromEntries(tabelas.map((tabela) => [tabela, []])),
    _ids: Object.fromEntries(tabelas.map((tabela) => [tabela, 1])),
  };
}

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

function validarBanco(banco) {
  if (!banco || typeof banco !== 'object' || tabelas.some((tabela) => !Array.isArray(banco[tabela]))) {
    throw new Error(`O arquivo ${arquivoBanco} não contém uma estrutura válida do banco JSON.`);
  }
  banco._ids ??= Object.fromEntries(tabelas.map((tabela) => [
    tabela,
    banco[tabela].reduce((maior, item) => Math.max(maior, item.id), 0) + 1,
  ]));
  for (const tabela of tabelas) {
    const maiorId = banco[tabela].reduce((maior, item) => Math.max(maior, item.id), 0);
    if (!Number.isSafeInteger(banco._ids[tabela]) || banco._ids[tabela] <= maiorId) {
      throw new Error(`O contador de IDs da tabela ${tabela} é inválido no banco JSON.`);
    }
  }
}

let estado;
let filaEscrita = Promise.resolve();

export async function inicializarBanco() {
  await mkdir(dirname(arquivoBanco), { recursive: true });

  try {
    const conteudo = await readFile(arquivoBanco, 'utf8');
    estado = JSON.parse(conteudo);
    validarBanco(estado);
  } catch (erro) {
    if (erro.code !== 'ENOENT') {
      throw new Error(`Não foi possível carregar o banco JSON em ${arquivoBanco}.`, { cause: erro });
    }

    estado = bancoVazio();
    await gravarBanco(estado);
  }

  console.log(`Banco JSON carregado em ${arquivoBanco}.`);
}

export async function fecharBanco() {
  await filaEscrita;
}

export function lerBanco() {
  if (!estado) throw new Error('O banco JSON ainda não foi inicializado.');
  return clonar(estado);
}

export async function transacionar(operacao) {
  const execucao = filaEscrita.then(async () => {
    if (!estado) throw new Error('O banco JSON ainda não foi inicializado.');

    const rascunho = clonar(estado);
    const resultado = await operacao(rascunho);
    await gravarBanco(rascunho);
    estado = rascunho;
    return resultado;
  });

  filaEscrita = execucao.catch(() => {});
  return execucao;
}

export function novoRegistro(banco, tabela, dados) {
  const registros = banco[tabela];
  if (!registros) throw new Error(`Tabela JSON desconhecida: ${tabela}.`);

  const registro = { id: banco._ids[tabela]++, ...dados };
  const agora = new Date().toISOString();
  if (['usuarios', 'solicitacoes', 'propostas', 'atualizacoes', 'produtos'].includes(tabela)) {
    registro.criadoEm ??= agora;
  }
  if (tabela === 'etapas') {
    registro.criadoEm ??= agora;
    registro.atualizadoEm ??= agora;
  }
  if (tabela === 'solicitacoes') registro.status ??= 'ABERTA';
  if (tabela === 'propostas') registro.status ??= 'PENDENTE';
  if (tabela === 'obras') {
    registro.status ??= 'EM_ANDAMENTO';
    registro.valorGasto ??= 0;
    registro.progresso ??= 0;
  }
  if (tabela === 'etapas') registro.status ??= 'PLANEJADA';

  registros.push(registro);
  return registro;
}

export function atualizarRegistro(banco, tabela, id, dados) {
  const registro = banco[tabela]?.find((item) => item.id === id);
  if (!registro) return null;

  Object.assign(registro, dados);
  if (tabela === 'etapas') registro.atualizadoEm = new Date().toISOString();
  return registro;
}

export function removerRegistro(banco, tabela, id) {
  const registros = banco[tabela];
  const indice = registros?.findIndex((item) => item.id === id) ?? -1;
  if (indice < 0) return null;
  return registros.splice(indice, 1)[0];
}

async function gravarBanco(banco) {
  const temporario = `${arquivoBanco}.tmp`;
  await writeFile(temporario, `${JSON.stringify(banco, null, 2)}\n`, 'utf8');
  await rename(temporario, arquivoBanco);
}
