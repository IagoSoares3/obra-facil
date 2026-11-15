import { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { carregarObrasSalvas } from '../data/obras';
import './BuscaObras.css';

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

export default function BuscaObras({ obras }) {
  const navigate = useNavigate();
  const idLista = useId();
  const [consulta, setConsulta] = useState('');
  const [aberta, setAberta] = useState(false);
  const [opcaoAtiva, setOpcaoAtiva] = useState(0);
  const obrasDisponiveis = obras ?? carregarObrasSalvas();
  const termo = normalizarTexto(consulta.trim());

  const resultados = useMemo(() => {
    if (!termo) return [];

    return obrasDisponiveis
      .map((obra) => {
        const campos = [obra.nome, obra.responsavel, obra.cidade, obra.status]
          .filter(Boolean)
          .map(normalizarTexto);
        const corresponde = campos.some((campo) => campo.includes(termo));
        const comecaPeloTermo = normalizarTexto(obra.nome).startsWith(termo);
        return { obra, corresponde, comecaPeloTermo };
      })
      .filter((resultado) => resultado.corresponde)
      .sort((a, b) => Number(b.comecaPeloTermo) - Number(a.comecaPeloTermo))
      .slice(0, 6)
      .map(({ obra }) => obra);
  }, [obrasDisponiveis, termo]);

  function abrirObra(obra) {
    setAberta(false);
    setConsulta('');
    navigate(`/obras/${encodeURIComponent(obra.id)}`);
  }

  function tratarTecla(evento) {
    if (evento.key === 'Escape') {
      setAberta(false);
      setOpcaoAtiva(0);
      return;
    }

    if (!resultados.length) return;
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      setAberta(true);
      setOpcaoAtiva((atual) => (atual + 1) % resultados.length);
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      setAberta(true);
      setOpcaoAtiva((atual) => (atual - 1 + resultados.length) % resultados.length);
    } else if (evento.key === 'Enter' && aberta) {
      evento.preventDefault();
      abrirObra(resultados[opcaoAtiva]);
    }
  }

  return (
    <div className="topbar-search busca-obras">
      <span className="material-symbols-outlined" aria-hidden="true">search</span>
      <input
        type="search"
        value={consulta}
        placeholder="Buscar uma obra..."
        role="combobox"
        aria-label="Buscar obras por nome, responsável, cidade ou status"
        aria-autocomplete="list"
        aria-expanded={aberta && Boolean(termo)}
        aria-controls={idLista}
        aria-activedescendant={aberta && resultados.length ? `${idLista}-${opcaoAtiva}` : undefined}
        autoComplete="off"
        onChange={(evento) => {
          setConsulta(evento.target.value);
          setOpcaoAtiva(0);
          setAberta(true);
        }}
        onFocus={() => {
          if (termo) setAberta(true);
        }}
        onBlur={() => setAberta(false)}
        onKeyDown={tratarTecla}
      />
      {aberta && termo && (
        <div className="busca-obras-resultados" id={idLista} role="listbox" aria-label="Obras encontradas">
          {resultados.length ? resultados.map((obra, indice) => (
            <button
              type="button"
              role="option"
              id={`${idLista}-${indice}`}
              aria-selected={indice === opcaoAtiva}
              className="busca-obras-opcao"
              key={obra.id}
              onPointerDown={(evento) => evento.preventDefault()}
              onClick={() => abrirObra(obra)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">construction</span>
              <span className="busca-obras-detalhes">
                <strong>{obra.nome}</strong>
                <small>{[obra.responsavel, obra.cidade, obra.status].filter(Boolean).join(' · ')}</small>
              </span>
              <span className="material-symbols-outlined busca-obras-ir" aria-hidden="true">arrow_forward</span>
            </button>
          )) : (
            <p className="busca-obras-vazia" role="status">Nenhuma obra encontrada para “{consulta.trim()}”.</p>
          )}
        </div>
      )}
    </div>
  );
}
