import { useEffect, useRef } from 'react';
import { nomeDaTecla } from '../../configuracoes/configuracoes';
import { useConfiguracoes } from '../../configuracoes/ContextoConfiguracoes';
import { RCP } from '../../dados/parada-rcp-a-validar';
import { quemFez } from '../../parada/equipe';
import type { FaixaRitmo, TipoMarca } from '../../parada/rcp';
import { useCodigo } from './contexto';

/** Campo onde se escreve texto livre: as teclas da RCP não são capturadas ali. */
function escrevendoTexto(alvo: EventTarget | null): boolean {
  const el = alvo as HTMLElement | null;
  if (!el || !el.tagName) return false;
  if (el.isContentEditable || el.tagName === 'TEXTAREA') return true;
  return el.tagName === 'INPUT' && !el.hasAttribute('data-numero') && !['checkbox', 'radio', 'button'].includes((el as HTMLInputElement).type);
}

/**
 * Teclas da RCP: cada aperto da tecla da compressão/ventilação conta uma vez (segurar não conta).
 * Em campo de número (mL, J) as teclas também valem; em campo de texto livre, não.
 */
export function useTeclasRcp(ativo: boolean, aoApertar: (tipo: TipoMarca) => void) {
  const { config } = useConfiguracoes();
  const aoApertarRef = useRef(aoApertar);
  aoApertarRef.current = aoApertar;
  useEffect(() => {
    if (!ativo) return;
    const tipoDa = (e: KeyboardEvent): TipoMarca | null => {
      if (e.ctrlKey || e.metaKey || e.altKey || escrevendoTexto(e.target)) return null;
      return e.code === config.teclaCompressao ? 'compressao' : e.code === config.teclaVentilacao ? 'ventilacao' : null;
    };
    const desce = (e: KeyboardEvent) => {
      const tipo = tipoDa(e);
      if (!tipo) return;
      e.preventDefault();
      if (!e.repeat) aoApertarRef.current(tipo);
    };
    // o Espaço "solto" num botão focado também clicaria nele
    const sobe = (e: KeyboardEvent) => {
      if (tipoDa(e)) e.preventDefault();
    };
    window.addEventListener('keydown', desce);
    window.addEventListener('keyup', sobe);
    return () => {
      window.removeEventListener('keydown', desce);
      window.removeEventListener('keyup', sobe);
    };
  }, [ativo, config.teclaCompressao, config.teclaVentilacao]);
}

const NOME_FAIXA: Record<FaixaRitmo, string> = { lenta: 'mais rápido', boa: 'no ritmo', rapida: 'mais devagar' };

/** Régua da frequência com a faixa-alvo pintada. */
function Regua({ valor, alvo, de, ate, rotulo }: { valor: number | null; alvo: { min: number; max: number }; de: number; ate: number; rotulo: string }) {
  const pos = (x: number) => `${Math.min(100, Math.max(0, ((x - de) / (ate - de)) * 100))}%`;
  return (
    <span className="regua-rcp" role="img" aria-label={`${rotulo}: ${valor === null ? 'sem medida' : `${Math.round(valor)} por minuto`}; alvo ${alvo.min} a ${alvo.max}`}>
      <span className="regua-alvo" style={{ left: pos(alvo.min), width: `calc(${pos(alvo.max)} - ${pos(alvo.min)})` }} />
      {valor !== null && <span className="regua-ponteiro" style={{ left: pos(valor) }} />}
    </span>
  );
}

/** Botão grande: aperta com o mouse/dedo (vários dedos ao mesmo tempo no tablet) ou pelo teclado. */
function BotaoRcp({ tipo, rotulo, tecla, total, aoApertar }: { tipo: TipoMarca; rotulo: string; tecla: string; total: number; aoApertar: (t: TipoMarca) => void }) {
  return (
    <button
      type="button"
      className={`botao-rcp botao-rcp-${tipo}`}
      onPointerDown={(e) => {
        e.preventDefault();
        aoApertar(tipo);
      }}
      onClick={(e) => {
        // clique vindo do teclado (Enter num botão focado)
        if (e.detail === 0) aoApertar(tipo);
      }}
    >
      <span key={total} className="pulso" aria-hidden="true" />
      {rotulo} <kbd>{nomeDaTecla(tecla)}</kbd>
    </button>
  );
}

/**
 * Faixa da RCP (logo abaixo da cena, na tela de quem comprime ou ventila): botões grandes, frequência,
 * contagem da série e os avisos (pausar para ventilar, ventilação fora da hora, hiperventilação).
 */
export function FaixaRcp({ comprime, ventila, aoApertar }: { comprime: boolean; ventila: boolean; aoApertar: (t: TipoMarca) => void }) {
  const { rcp, relacao, membros, compressorDaVez, pausado, estado, s } = useCodigo();
  const { config } = useConfiguracoes();
  if (!rcp || (!comprime && !ventila)) return null;
  const carga = estado.carregadoJ;
  return (
    <section className={`faixa-rcp fase-${rcp.fase}`} aria-label="RCP">
      {pausado && <p className="aviso-rcp">⏸ Relógio pausado: as teclas não contam.</p>}
      {carga !== undefined && <p className="aviso-rcp perigo">⚡ Desfibrilador carregado ({carga} J): afastem-se — mãos fora do tórax!</p>}
      {comprime && (
        <div className={`pad-rcp${rcp.faixaCompressao ? ` faixa-${rcp.faixaCompressao}` : ''}`} aria-label="Compressões">
          <BotaoRcp tipo="compressao" rotulo="🫀 Comprimir" tecla={config.teclaCompressao} total={rcp.compressoes} aoApertar={aoApertar} />
          <div className="leitura-rcp">
            <strong aria-label="Frequência das compressões">{rcp.freqCompressao === null ? '—' : `${Math.round(rcp.freqCompressao)}/min`}</strong>
            {rcp.faixaCompressao && <span className="selo">{NOME_FAIXA[rcp.faixaCompressao]}</span>}
            <Regua valor={rcp.freqCompressao} alvo={RCP.compressoesPorMin} de={60} ate={160} rotulo="Frequência das compressões" />
            <span aria-label="Série de compressões">{rcp.modo === 'sincronizado' ? `Série ${rcp.serie}/${relacao}` : 'Contínuas (via aérea avançada)'}</span>
            <small>
              {rcp.compressoes} no total · vez de {quemFez(compressorDaVez, membros)}
            </small>
          </div>
          {rcp.avisoCompressao && <p className="aviso-rcp">{rcp.avisoCompressao}</p>}
        </div>
      )}
      {ventila && (
        <div className={`pad-rcp${rcp.faixaVentilacao ? ` faixa-${rcp.faixaVentilacao}` : ''}${rcp.fase === 'ventilar' ? ' vez' : ''}`} aria-label="Ventilações">
          <BotaoRcp tipo="ventilacao" rotulo="🫁 Ventilar" tecla={config.teclaVentilacao} total={rcp.ventilacoes} aoApertar={aoApertar} />
          <div className="leitura-rcp">
            {rcp.modo === 'sincronizado' ? (
              <>
                <strong aria-label="Ventilações na pausa">
                  {rcp.ventilacoesNaPausa}/{RCP.ventilacoesPorPausa}
                </strong>
                <span>
                  {relacao}:{RCP.ventilacoesPorPausa} — ventile na pausa
                </span>
              </>
            ) : (
              <>
                <strong aria-label="Frequência das ventilações">{rcp.freqVentilacao === null ? '—' : `${Math.round(rcp.freqVentilacao)}/min`}</strong>
                {rcp.faixaVentilacao && <span className="selo">{NOME_FAIXA[rcp.faixaVentilacao]}</span>}
                <Regua valor={rcp.freqVentilacao} alvo={RCP.ventilacoesPorMinComVia} de={0} ate={50} rotulo="Frequência das ventilações" />
                <span>1 a cada 2–3 s</span>
              </>
            )}
            <small>{rcp.ventilacoes} no total</small>
          </div>
          {rcp.avisoVentilacao && <p className="aviso-rcp">{rcp.avisoVentilacao}</p>}
        </div>
      )}
      {s.sala.marcas.length === 0 && !pausado && (
        <p className="nota dica-rcp">
          {comprime && `Aperte ${nomeDaTecla(config.teclaCompressao)} a cada compressão. `}
          {ventila && `Aperte ${nomeDaTecla(config.teclaVentilacao)} a cada ventilação.`}
        </p>
      )}
    </section>
  );
}
