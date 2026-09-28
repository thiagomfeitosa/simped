import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Roteiro } from '../../dados/roteiros/tipos';
import { montarFolha, montarRascunho } from '../../logica/progresso';
import { CartaoExplicacao } from './CartaoExplicacao';
import { Cena } from './cenas/Cena';
import { FolhaPrescricao, Rascunho } from './Papeis';
import { TrilhaDeSetas } from './TrilhaDeSetas';

export type Direcao = 'avancar' | 'voltar';

/**
 * Tela "Passo a passo": trilha de setas + animação + explicação + folha/rascunho.
 * Avançar e voltar só mudam o número da etapa; todo o resto é calculado a partir dele.
 */
export function PassoAPasso({ roteiro }: { roteiro: Roteiro }) {
  const [indice, setIndice] = useState(0);
  const [direcao, setDirecao] = useState<Direcao>('avancar');
  const total = roteiro.etapas.length;
  const etapa = roteiro.etapas[indice];

  const irPara = useCallback(
    (novo: number) => {
      if (novo < 0 || novo >= total || novo === indice) return;
      setDirecao(novo > indice ? 'avancar' : 'voltar');
      setIndice(novo);
    },
    [indice, total],
  );

  // Setas do teclado: → avança, ← volta
  useEffect(() => {
    const aoTeclar = (ev: KeyboardEvent) => {
      const alvo = ev.target as HTMLElement | null;
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
      if (ev.key === 'ArrowRight') irPara(indice + 1);
      if (ev.key === 'ArrowLeft') irPara(indice - 1);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [indice, irPara]);

  const folha = useMemo(() => montarFolha(roteiro, indice), [roteiro, indice]);
  const rascunho = useMemo(() => montarRascunho(roteiro, indice), [roteiro, indice]);

  return (
    <div className="passo-a-passo">
      <TrilhaDeSetas etapas={roteiro.etapas} atual={indice} aoEscolher={irPara} />

      <div className="palco">
        <Cena etapa={etapa} direcao={direcao} />
        <CartaoExplicacao etapa={etapa} direcao={direcao} numero={indice + 1} total={total} />
      </div>

      <div className="navegacao">
        <button type="button" className="botao-nav voltar" onClick={() => irPara(indice - 1)} disabled={indice === 0}>
          <span className="botao-nav-seta" aria-hidden="true">
            ◀
          </span>
          Voltar
        </button>
        <div className="progresso" aria-hidden="true">
          <div className="progresso-trilho">
            <div className="progresso-barra" style={{ width: `${((indice + 1) / total) * 100}%` }} />
          </div>
          <span className="progresso-texto">
            Etapa <b>{indice + 1}</b> de {total} · dica: use as setas ← → do teclado
          </span>
        </div>
        <button type="button" className="botao-nav avancar" onClick={() => irPara(indice + 1)} disabled={indice === total - 1}>
          Avançar
          <span className="botao-nav-seta" aria-hidden="true">
            ▶
          </span>
        </button>
      </div>

      <div className="papeis">
        <Rascunho linhas={rascunho} idEtapaAtual={etapa.id} />
        <FolhaPrescricao roteiro={roteiro} folha={folha} secaoAtual={etapa.secao} />
      </div>
    </div>
  );
}
