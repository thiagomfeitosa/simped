import { useEffect, useRef } from 'react';
import type { Etapa, SecaoPrescricao } from '../../dados/roteiros/tipos';
import { SECOES } from '../../dados/secoes';

interface Grupo {
  secao: SecaoPrescricao;
  itens: { etapa: Etapa; indice: number }[];
}

function agrupar(etapas: Etapa[]): Grupo[] {
  const grupos: Grupo[] = [];
  etapas.forEach((etapa, indice) => {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.secao === etapa.secao) ultimo.itens.push({ etapa, indice });
    else grupos.push({ secao: etapa.secao, itens: [{ etapa, indice }] });
  });
  return grupos;
}

/** Trilha de setas no topo: cada seta é uma etapa, agrupadas pela seção da folha. Clicáveis. */
export function TrilhaDeSetas({ etapas, atual, aoEscolher }: { etapas: Etapa[]; atual: number; aoEscolher: (i: number) => void }) {
  // Centraliza a seta atual rolando só a trilha (sem mexer na página).
  const refTrilha = useRef<HTMLElement>(null);
  const refAtual = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const trilha = refTrilha.current;
    const seta = refAtual.current;
    if (!trilha || !seta) return;
    const deslocamento = seta.getBoundingClientRect().left - trilha.getBoundingClientRect().left;
    trilha.scrollTo({ left: trilha.scrollLeft + deslocamento - trilha.clientWidth / 2 + seta.clientWidth / 2, behavior: 'smooth' });
  }, [atual]);

  return (
    <nav ref={refTrilha} className="trilha" aria-label="Etapas">
      {agrupar(etapas).map((grupo) => {
        const info = SECOES[grupo.secao];
        return (
          <div key={`${grupo.secao}-${grupo.itens[0].indice}`} className="trilha-grupo" style={{ ['--cor-secao' as string]: info.cor }}>
            <span className="trilha-secao" title={info.nome}>
              {info.numero ? `${info.numero}. ` : ''}
              {info.nome}
            </span>
            <div className="trilha-setas">
              {grupo.itens.map(({ etapa, indice }) => {
                const estado = indice < atual ? 'feita' : indice === atual ? 'atual' : 'futura';
                return (
                  <button
                    key={etapa.id}
                    ref={indice === atual ? refAtual : undefined}
                    type="button"
                    className={`seta seta-${estado} ${indice === 0 ? 'primeira' : ''}`}
                    onClick={() => aoEscolher(indice)}
                    aria-current={indice === atual ? 'step' : undefined}
                    title={etapa.titulo}
                  >
                    <span className="seta-numero">{indice + 1}</span>
                    <span className="seta-texto">{etapa.curto}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
