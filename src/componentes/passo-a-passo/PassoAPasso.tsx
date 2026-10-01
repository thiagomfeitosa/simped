import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Roteiro } from '../../dados/roteiros/tipos';
import { montarFolha, montarRascunho } from '../../logica/progresso';
import { CartaoExplicacao } from './CartaoExplicacao';
import { Cena } from './cenas/Cena';
import { FolhaPrescricao, Rascunho } from './Papeis';
import { PrescricaoComCalculos } from './PrescricaoComCalculos';
import { TrilhaDeSetas } from './TrilhaDeSetas';

export type Direcao = 'avancar' | 'voltar';

/**
 * Tela "Passo a passo": trilha de setas + animação + explicação + folha/rascunho.
 * Avançar e voltar só mudam o número da etapa; todo o resto é calculado a partir dele.
 * A última etapa (automática) mostra a prescrição inteira com os cálculos.
 */
export function PassoAPasso({ roteiro }: { roteiro: Roteiro }) {
  const [indice, setIndice] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const [direcao, setDirecao] = useState<Direcao>('avancar');
  // Etapa cuja conta já mostrou o resultado (o rascunho só "escreve" a conta depois disso).
  const [contaProntaDe, setContaProntaDe] = useState<string | null>(null);
  const total = roteiro.etapas.length;
  // todo roteiro tem etapas (no mínimo a final; ver progresso.test.ts)
  const etapa = roteiro.etapas[indice]!;
  const ehFinal = etapa.cena.tipo === 'prescricao-final';

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
      // aba escondida (o aluno está no modo "Prescrever"): não mexe nas etapas
      if (raiz.current?.offsetParent === null) return;
      if (ev.key === 'ArrowRight') irPara(indice + 1);
      if (ev.key === 'ArrowLeft') irPara(indice - 1);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [indice, irPara]);

  const aoMudarConta = useCallback((completa: boolean) => setContaProntaDe(completa ? etapa.id : null), [etapa.id]);

  const folha = useMemo(() => montarFolha(roteiro, indice), [roteiro, indice]);
  const rascunho = useMemo(() => montarRascunho(roteiro, indice), [roteiro, indice]);
  const ocultarContaAtual = !!etapa.conta && contaProntaDe !== etapa.id;

  return (
    <div className="passo-a-passo" ref={raiz}>
      <TrilhaDeSetas etapas={roteiro.etapas} atual={indice} aoEscolher={irPara} />

      {ehFinal ? (
        <PrescricaoComCalculos key={etapa.id} roteiro={roteiro} etapa={etapa} direcao={direcao} aoIrParaEtapa={irPara} />
      ) : (
        <div className="palco">
          <Cena etapa={etapa} direcao={direcao} />
          <CartaoExplicacao etapa={etapa} direcao={direcao} numero={indice + 1} total={total} aoMudarConta={aoMudarConta} />
        </div>
      )}

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

      {!ehFinal && (
        <div className="papeis">
          <Rascunho linhas={rascunho} idEtapaAtual={etapa.id} ocultarAtual={ocultarContaAtual} />
          <FolhaPrescricao roteiro={roteiro} folha={folha} secaoAtual={etapa.secao} />
        </div>
      )}
    </div>
  );
}
