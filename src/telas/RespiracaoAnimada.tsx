import type { CSSProperties } from 'react';
import { NOME_PADRAO_RESPIRATORIO, type PadraoRespiratorio } from '../casos/tipos';

/** O que cada padrão mostra na figura (desenho didático, A VALIDAR). */
const DESCRICAO: Record<PadraoRespiratorio, string> = {
  normal: 'Tórax sobe e desce suave e regular.',
  taquipneia: 'Respiração rápida e curta.',
  desconforto: 'Rápida, com tiragem (pele "afunda" entre as costelas e embaixo delas) e batimento de asa do nariz.',
  kussmaul: 'Profunda, ampla e regular — o corpo "sopra" CO₂ para compensar a acidose.',
  bradipneia: 'Respiração lenta.',
  gasping: 'Suspiros curtos e raros, com pausas longas: sinal de parada iminente.',
  apneia: 'Sem movimento respiratório.',
  assistida: 'Tórax sobe a cada aperto da bolsa (ou ciclo do ventilador).',
};

/** Amplitude da expansão do tórax por padrão. */
const AMPLITUDE: Record<PadraoRespiratorio, number> = {
  normal: 0.06,
  taquipneia: 0.045,
  desconforto: 0.04,
  kussmaul: 0.13,
  bradipneia: 0.06,
  gasping: 0.09,
  apneia: 0,
  assistida: 0.07,
};

/**
 * Fase 2 — respiração animada: tórax de frente que respira no ritmo da FR, com a forma
 * do padrão respiratório (tiragem, Kussmaul, gasping…).
 */
export function RespiracaoAnimada({ padrao, fr }: { padrao: PadraoRespiratorio; fr: number }) {
  const parado = padrao === 'apneia' || !(fr > 0);
  // gasping: um suspiro a cada ~5 s, mesmo que a FR anotada seja outra
  const duracaoS = parado ? 0 : padrao === 'gasping' ? Math.max(5, 60 / fr) : 60 / fr;
  const estilo = {
    '--duracao-resp': `${duracaoS.toFixed(2)}s`,
    '--amplitude-resp': AMPLITUDE[padrao],
  } as CSSProperties;

  return (
    <figure className={`respiracao-animada padrao-${padrao}${parado ? ' parado' : ''}`} style={estilo} aria-label="Respiração animada">
      <svg viewBox="0 0 120 120" role="img" aria-label={`${NOME_PADRAO_RESPIRATORIO[padrao]}: ${DESCRICAO[padrao]}`}>
        {/* cabeça e nariz (batimento de asa nasal no desconforto) */}
        <circle cx={60} cy={20} r={14} className="resp-pele" />
        <g className="resp-nariz">
          <circle cx={56} cy={23} r={1.6} />
          <circle cx={64} cy={23} r={1.6} />
        </g>
        {/* tórax que expande */}
        <g className="resp-torax">
          <path d="M30 42 Q60 34 90 42 L94 96 Q60 106 26 96 Z" className="resp-pele" />
          {/* costelas */}
          {[52, 61, 70, 79].map((y) => (
            <path key={y} d={`M36 ${y} Q60 ${y - 6} 84 ${y}`} className="resp-costela" />
          ))}
          {/* tiragem: afunda entre as costelas e embaixo do gradil */}
          <g className="resp-tiragem">
            {[56.5, 65.5, 74.5].map((y) => (
              <path key={y} d={`M44 ${y} Q60 ${y - 3} 76 ${y}`} />
            ))}
            <path d="M42 90 Q60 82 78 90" />
          </g>
        </g>
        {/* bolsa (ventilação assistida) */}
        {padrao === 'assistida' && (
          <g className="resp-bolsa">
            <ellipse cx={100} cy={14} rx={14} ry={8} />
            <path d="M86 15 L74 20" />
          </g>
        )}
      </svg>
      <figcaption>
        <strong>{NOME_PADRAO_RESPIRATORIO[padrao]}</strong> — {DESCRICAO[padrao]}
      </figcaption>
    </figure>
  );
}
