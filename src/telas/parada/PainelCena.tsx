import { type RefObject, useEffect, useRef, useState } from 'react';
import { type CenaRcp, montarCena } from '../../parada/cena';
import { estadoDaParada } from '../../parada/parada';
import { compressorDaVez, rcpPelasTeclas, relogioDaSala, tempoDoRelogio } from '../../parada/sala';
import { DesenhoCenaRcp } from './CenaRcp';
import { type ContextoCodigo, rcpNoTempo, useCodigo } from './contexto';

/** Gaveta: a cena aparece ou fica escondida nesta tela ("0" = escondida). */
const CHAVE_MOSTRAR = 'simped.parada.cena';

function lerMostrar(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_MOSTRAR) !== '0';
  } catch {
    return true;
  }
}

function gravarMostrar(mostrar: boolean) {
  try {
    window.localStorage.setItem(CHAVE_MOSTRAR, mostrar ? '1' : '0');
  } catch {
    // sem armazenamento: vale só até fechar
  }
}

const CONSULTA_MOVIMENTO = '(prefers-reduced-motion: reduce)';

/** Quem pediu "reduzir movimento" no sistema (Mac: Ajustes → Acessibilidade → Tela). */
export function useMenosMovimento(): boolean {
  const [menos, setMenos] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(CONSULTA_MOVIMENTO).matches === true);
  useEffect(() => {
    const m = window.matchMedia?.(CONSULTA_MOVIMENTO);
    if (!m) return;
    const aoMudar = () => setMenos(m.matches);
    m.addEventListener?.('change', aoMudar);
    return () => m.removeEventListener?.('change', aoMudar);
  }, []);
  return menos;
}

/**
 * Cena sem movimento ("reduzir movimento"): mostra quem faz o quê, com as mãos no meio do gesto,
 * mas o tórax não sobe e desce sem parar e o choque não pisca.
 */
export function semMovimento(c: CenaRcp): CenaRcp {
  const comprime = c.avatares.some((a) => a.acao === 'comprimindo');
  const ventila = c.avatares.some((a) => a.acao === 'ventilando');
  return {
    ...c,
    compressao: comprime ? 0.5 : 0,
    expansao: ventila ? 0.5 : 0,
    choque: 0,
    avatares: c.avatares.map((a) => (a.acao === 'comprimindo' || a.acao === 'ventilando' ? { ...a, fase: 0.5 } : a)),
  };
}

/** Cena agora (ao vivo): só o tempo e o estado do código andam a cada quadro; a RCP vem da última conta da tela. */
export function cenaAoVivo(ctx: ContextoCodigo, agoraMs: number): CenaRcp {
  const { s, cenario } = ctx;
  const tS = tempoDoRelogio(relogioDaSala(s.sala), agoraMs);
  return montarCena({
    cenario,
    eventos: s.sala.eventos,
    marcas: s.sala.marcas,
    tS,
    membros: ctx.membros,
    estado: estadoDaParada(cenario, s.sala.eventos, tS),
    rcp: ctx.rcp,
    relacao: ctx.relacao,
    compressorDaVez: ctx.compressorDaVez,
    pausado: ctx.pausado,
  });
}

/** Cena num tempo qualquer, com tudo recalculado nesse tempo (rever o código; tela de espera). */
export function cenaNoTempo(ctx: ContextoCodigo, tS: number, pausado = false): CenaRcp {
  const { s, cenario, relacao } = ctx;
  const estado = estadoDaParada(cenario, s.sala.eventos, tS);
  return montarCena({
    cenario,
    eventos: s.sala.eventos,
    marcas: s.sala.marcas,
    tS,
    membros: ctx.membros,
    estado,
    rcp: rcpPelasTeclas(s.sala) ? rcpNoTempo(s.sala, estado, relacao, tS) : null,
    relacao,
    // o revezamento sai só da sala (todas as telas que estiveram no código), não das janelas abertas agora:
    // rever depois que um colega fechou a janela mostra o mesmo compressor que estava no tórax
    compressorDaVez: compressorDaVez(s.sala, estado.ciclo.numero, new Set(Object.keys(s.sala.telas))),
    pausado,
  });
}

/**
 * Laço da animação: redesenha a 60 quadros/s só enquanto `andando` e o painel está à vista
 * (aba aberta, janela na frente). O resto do app continua redesenhando 5 vezes por segundo.
 */
export function useQuadros(alvo: RefObject<HTMLElement | null>, andando: boolean) {
  const [, setQuadro] = useState(0);
  useEffect(() => {
    if (!andando) return;
    let quadro = 0;
    let espera = 0;
    const passo = () => {
      const el = alvo.current;
      // aba escondida (as abas ficam abertas) ou janela atrás: não redesenha e confere de novo só 4 vezes por segundo
      if (!el || el.offsetParent === null || document.visibilityState === 'hidden') {
        espera = window.setTimeout(passo, 250);
        return;
      }
      setQuadro((q) => (q + 1) % 1_000_000);
      quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(quadro);
      window.clearTimeout(espera);
    };
  }, [alvo, andando]);
}

/**
 * Cena da RCP ao vivo, para todos (cada membro na sua tela e quem só assiste). Tudo sai da sala:
 * cada tela monta a mesma cena da mesma lista de eventos e marcas (src/parada/cena.ts).
 * A legenda (o que acontece agora) vem embaixo do desenho. `recolhivel`: botão para esconder
 * (a escolha fica guardada nesta tela).
 */
export function PainelCena({ tamanho = 'normal', recolhivel = true }: { tamanho?: 'normal' | 'grande'; recolhivel?: boolean }) {
  const ctx = useCodigo();
  const alvo = useRef<HTMLElement>(null);
  const [mostrarEscolhido, setMostrar] = useState(lerMostrar);
  const mostrar = !recolhivel || mostrarEscolhido;
  const menos = useMenosMovimento();
  useQuadros(alvo, mostrar && !ctx.pausado && !menos);

  const trocar = () => {
    gravarMostrar(!mostrar);
    setMostrar(!mostrar);
  };

  if (!mostrar) {
    return (
      <section ref={alvo} className="painel-cena recolhida" aria-label="Cena da RCP">
        <button type="button" className="botao-discreto" aria-expanded={false} onClick={trocar}>
          🎬 Mostrar a cena da RCP
        </button>
      </section>
    );
  }

  const viva = cenaAoVivo(ctx, Date.now());
  const cena = menos ? semMovimento(viva) : viva;
  return (
    <section ref={alvo} className={`painel-cena tamanho-${tamanho}`} aria-label="Cena da RCP" data-compressao={cena.compressao.toFixed(2)}>
      {recolhivel && (
        <div className="painel-cena-topo">
          <span className="painel-cena-titulo">🎬 Cena da RCP</span>
          <button type="button" className="botao-discreto" aria-expanded onClick={trocar}>
            Esconder a cena
          </button>
        </div>
      )}
      <div className="painel-cena-desenho">
        <DesenhoCenaRcp cena={cena} tamanho={tamanho} />
      </div>
    </section>
  );
}
