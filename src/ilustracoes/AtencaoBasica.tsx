/**
 * Desenhos do exame físico da atenção básica:
 * - Otoscopia (visão pelo otoscópio): normal, OMA, otite com efusão, otite externa, perfuração;
 * - Oroscopia (garganta): normal, faringite viral, amigdalite bacteriana, herpangina, mononucleose,
 *   língua em framboesa;
 * - Rosto de criança hidratada × desidratada; sinal da prega (animado);
 * - Sinais meníngeos (rigidez de nuca, Kernig, Brudzinski).
 */

import { type CSSProperties, useId } from 'react';
import type { TomDePele } from '../neonatal/exame';
import { FiltrosPele } from './FiltrosPele';
import { capsula, type Ponto } from './formas';
import { idSvg, misturar, PALETAS, pontosFixos } from './pele';

// ---- Otoscopia ------------------------------------------------------------------------

export type AchadoOtoscopia = 'normal' | 'oma' | 'ome' | 'otite-externa' | 'perfuracao';

export function Otoscopia({ achado }: { achado: AchadoOtoscopia }) {
  const id = idSvg(useId());
  const externa = achado === 'otite-externa';
  const raioConduto = externa ? 54 : 92;
  const mt = { cx: 120, cy: 122, rx: externa ? 34 : 70, ry: externa ? 30 : 62 };
  const cores: Record<AchadoOtoscopia, [string, string]> = {
    normal: ['#e3e2df', '#a9aeb5'],
    oma: ['#f2c37a', '#c23a2c'],
    ome: ['#f0cf86', '#b98a3a'],
    'otite-externa': ['#d9b0a0', '#9a6a5a'],
    perfuracao: ['#e8a28a', '#a8483a'],
  };
  const r = pontosFixos(31, 40);
  return (
    <svg viewBox="0 0 240 240" className="ilustracao otoscopia" role="img" aria-label={`Otoscopia: ${achado}`}>
      <defs>
        <radialGradient id={id('conduto')} cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor={externa ? '#c9564a' : '#e9b9a2'} />
          <stop offset="0.85" stopColor={externa ? '#9a2f2a' : '#c98a72'} />
          <stop offset="1" stopColor="#3a1a12" />
        </radialGradient>
        <radialGradient id={id('mt')} cx={achado === 'oma' ? '50%' : '42%'} cy={achado === 'oma' ? '50%' : '40%'} r="65%">
          <stop offset="0" stopColor={cores[achado][0]} />
          <stop offset="1" stopColor={cores[achado][1]} />
        </radialGradient>
        <clipPath id={id('campo')}>
          <circle cx="120" cy="120" r="104" />
        </clipPath>
        <clipPath id={id('membrana')}>
          <ellipse {...mt} />
        </clipPath>
        <filter id={id('suave')}>
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <rect width="240" height="240" fill="#0b0709" />
      <g clipPath={`url(#${id('campo')})`}>
        <circle cx="120" cy="120" r="104" fill="#3a1a12" />
        <circle cx="120" cy="122" r={raioConduto + 14} fill={`url(#${id('conduto')})`} />
        {externa && (
          <g fill="#f3ecd2" opacity="0.9">
            {r.slice(0, 10).map((v, i) => (
              <ellipse key={i} cx={70 + v * 100} cy={150 + r[i + 10]! * 30} rx={6 + r[i + 20]! * 6} ry={3} transform={`rotate(${v * 90} ${70 + v * 100} ${150 + r[i + 10]! * 30})`} />
            ))}
          </g>
        )}
        <ellipse {...mt} fill={`url(#${id('mt')})`} />
        <g clipPath={`url(#${id('membrana')})`}>
          {achado === 'normal' && (
            <>
              {/* cabo do martelo, processo curto, pars flácida e triângulo luminoso */}
              <path d="M 120 124 L 108 80" stroke="#f6f2e8" strokeWidth="5" strokeLinecap="round" />
              <circle cx="106" cy="76" r="5" fill="#fbf8ef" />
              <path d="M 92 66 Q 106 58 124 64" fill="none" stroke="#c9a5a0" strokeWidth="2" opacity="0.6" />
              <path d="M 122 128 L 152 172 L 136 176 Z" fill="#ffffff" opacity="0.85" filter={`url(#${id('suave')})`} />
              <ellipse cx={mt.cx} cy={mt.cy} rx={mt.rx} ry={mt.ry} fill="none" stroke="#8e939a" strokeWidth="3" opacity="0.5" />
            </>
          )}
          {achado === 'oma' && (
            <>
              <ellipse cx="124" cy="120" rx="44" ry="38" fill="#f7d68a" opacity="0.7" filter={`url(#${id('suave')})`} />
              <ellipse cx="112" cy="104" rx="16" ry="10" fill="#fff" opacity="0.45" filter={`url(#${id('suave')})`} />
              <g stroke="#a3121c" strokeWidth="1.6" fill="none" opacity="0.8">
                <path d="M 60 120 q 10 -8 18 -2 t 16 -6" />
                <path d="M 172 90 q -8 10 -18 8" />
                <path d="M 150 176 q -6 -8 -16 -6" />
              </g>
            </>
          )}
          {achado === 'ome' && (
            <>
              <path d="M 120 124 L 112 74" stroke="#fff6e8" strokeWidth="6" strokeLinecap="round" />
              <circle cx="111" cy="70" r="6" fill="#fffaf0" />
              <path d="M 50 136 Q 120 128 190 138" fill="none" stroke="#7a5418" strokeWidth="2.4" />
              <rect x="40" y="137" width="160" height="60" fill="#c8913a" opacity="0.35" />
              {[
                [92, 112, 7],
                [140, 106, 5],
                [158, 118, 6],
                [76, 120, 4],
              ].map(([x, y, rr], i) => (
                <circle key={i} cx={x} cy={y} r={rr} fill="none" stroke="#fff7dc" strokeWidth="1.6" opacity="0.9" />
              ))}
            </>
          )}
          {achado === 'perfuracao' && (
            <>
              <ellipse cx="132" cy="134" rx="16" ry="13" fill="#2a0c0a" />
              <ellipse cx="132" cy="134" rx="16" ry="13" fill="none" stroke="#f6d9c8" strokeWidth="2" />
              <path d="M 30 190 Q 120 150 210 190 L 210 240 L 30 240 Z" fill="#e6d06a" opacity="0.9" />
            </>
          )}
        </g>
        {achado === 'perfuracao' && <path d="M 40 196 Q 120 166 200 196 L 200 230 L 40 230 Z" fill="#e2c95a" opacity="0.85" />}
        {/* reflexo da luz do otoscópio */}
        <circle cx="120" cy="120" r="104" fill="none" stroke="#000" strokeWidth="18" opacity="0.5" />
      </g>
      <circle cx="120" cy="120" r="106" fill="none" stroke="#2e1450" strokeWidth="6" />
      <text x="12" y="232" fontSize="10" fill="#d8c7f2">
        ouvido direito · anterior →
      </text>
    </svg>
  );
}

// ---- Garganta -------------------------------------------------------------------------

export type AchadoGarganta = 'normal' | 'faringite-viral' | 'amigdalite-bacteriana' | 'herpangina' | 'mononucleose' | 'framboesa';

export function Garganta({ achado, tom = 'claro' }: { achado: AchadoGarganta; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const r = pontosFixos(41, 120);
  if (achado === 'framboesa') {
    return (
      <svg viewBox="0 0 260 220" className="ilustracao garganta" role="img" aria-label="Língua em framboesa">
        <FiltrosPele id={id} paleta={p} />
        <rect width="260" height="220" fill={`url(#${id('volume-suave')})`} filter={`url(#${id('textura')})`} />
        <ellipse cx="130" cy="80" rx="84" ry="44" fill={p.labio} />
        <ellipse cx="130" cy="80" rx="72" ry="32" fill="#3a0a10" />
        <path d="M 78 84 C 76 160, 184 160, 182 84 Z" fill="#d8283c" />
        <path d="M 78 84 C 76 160, 184 160, 182 84" fill="none" stroke="#9a1424" strokeWidth="2" />
        {r.slice(0, 70).map((v, i) => {
          const x = 88 + v * 84;
          const y = 92 + r[i + 70 > 119 ? i : i + 40]! * 50;
          return <circle key={i} cx={x} cy={y} r={2.2} fill="#ff6b7d" stroke="#a8182a" strokeWidth="0.6" />;
        })}
        <path d="M 130 92 L 130 140" stroke="#a8182a" strokeWidth="2" opacity="0.5" />
      </svg>
    );
  }
  const inflamado = achado !== 'normal';
  const mucosa = inflamado ? '#e2545e' : '#ee9aa2';
  const fundo = achado === 'faringite-viral' || achado === 'amigdalite-bacteriana' ? '#c8323e' : inflamado ? '#d65a64' : '#e48890';
  const amigdala = achado === 'mononucleose' ? 34 : achado === 'amigdalite-bacteriana' ? 28 : achado === 'normal' ? 14 : 18;
  return (
    <svg viewBox="0 0 260 220" className="ilustracao garganta" role="img" aria-label={`Oroscopia: ${achado}`}>
      <FiltrosPele id={id} paleta={p} />
      <rect width="260" height="220" fill={`url(#${id('volume-suave')})`} filter={`url(#${id('textura')})`} />
      {/* lábios e boca aberta */}
      <ellipse cx="130" cy="110" rx="118" ry="98" fill={p.labio} />
      <ellipse cx="130" cy="110" rx="106" ry="86" fill="#2a070c" />
      {/* parede posterior da faringe */}
      <ellipse cx="130" cy="112" rx="56" ry="50" fill={fundo} />
      {achado === 'faringite-viral' &&
        r.slice(0, 16).map((v, i) => <circle key={i} cx={96 + v * 68} cy={86 + r[i + 20]! * 50} r={3} fill="#ef7f88" stroke="#b82a36" strokeWidth="0.6" />)}
      {/* palato mole e úvula */}
      <path d="M 30 70 C 60 20, 200 20, 230 70 C 200 56, 168 52, 146 66 L 140 92 C 136 104, 124 104, 120 92 L 114 66 C 92 52, 60 56, 30 70 Z" fill={mucosa} />
      <path d="M 120 92 C 124 104, 136 104, 140 92" fill="none" stroke={misturar(mucosa, '#5a0a14', 0.4)} strokeWidth="2" />
      {/* pilares e amígdalas */}
      {[-1, 1].map((lado) => {
        const cx = 130 + lado * 64;
        return (
          <g key={lado}>
            <path d={`M ${130 + lado * 34} 66 C ${130 + lado * 50} 110, ${130 + lado * 50} 150, ${130 + lado * 40} 176`} fill="none" stroke={misturar(mucosa, '#7a1020', 0.25)} strokeWidth="9" strokeLinecap="round" />
            <ellipse cx={cx - lado * (amigdala - 14) * 0.6} cy={124} rx={amigdala} ry={amigdala * 1.25} fill={`url(#${id('amigdala')})`} stroke="#9a2030" strokeWidth="1" />
            {/* criptas */}
            {[0, 1, 2].map((k) => (
              <path key={k} d={`M ${cx - lado * (amigdala - 14) * 0.6 - 6} ${112 + k * 10} q 6 3 12 0`} stroke="#8a1a28" strokeWidth="1.2" fill="none" opacity="0.6" />
            ))}
            {achado === 'amigdalite-bacteriana' &&
              [0, 1, 2, 3].map((k) => (
                <path
                  key={k}
                  d={`M ${cx - lado * 8 + (r[k + lado + 2]! - 0.5) * 18} ${110 + k * 9} q 6 -4 12 0 q -4 6 -12 0 Z`}
                  fill="#f6eec2"
                  stroke="#e0cf8a"
                  strokeWidth="0.6"
                />
              ))}
            {achado === 'mononucleose' && <ellipse cx={cx - lado * 12} cy={124} rx={22} ry={30} fill="#d9d6cc" opacity="0.85" />}
          </g>
        );
      })}
      {achado === 'amigdalite-bacteriana' &&
        r.slice(30, 52).map((v, i) => <circle key={i} cx={70 + v * 120} cy={40 + r[i + 60]! * 22} r={1.6} fill="#8a0a1a" />)}
      {achado === 'herpangina' &&
        r.slice(60, 72).map((v, i) => {
          const x = 60 + v * 140;
          const y = 44 + r[i + 80]! * 34;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={5} fill="#c8102e" opacity="0.6" />
              <circle cx={x} cy={y} r={2.6} fill="#fbf4e0" />
            </g>
          );
        })}
      <defs>
        <radialGradient id={id('amigdala')} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor={inflamado ? '#f27c86' : '#f7b3ba'} />
          <stop offset="1" stopColor={inflamado ? '#b8202e' : '#d77a84'} />
        </radialGradient>
      </defs>
      {/* língua abaixada pelo abaixador */}
      <path d="M 40 170 C 70 140, 190 140, 220 170 L 220 210 L 40 210 Z" fill="#e6828e" />
      <rect x="70" y="150" width="120" height="16" rx="8" fill="#e9d6b0" stroke="#c9b48a" />
    </svg>
  );
}

// ---- Criança hidratada × desidratada -----------------------------------------------------

export function CriancaRosto({ estado, tom = 'claro' }: { estado: 'hidratada' | 'desidratada'; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const seca = estado === 'desidratada';
  const olho = (cx: number) => (
    <g>
      {seca && <ellipse cx={cx} cy={106} rx={26} ry={18} fill={misturar(p.sombra, '#3a2050', 0.3)} opacity="0.6" filter={`url(#${id('borrar')})`} />}
      <path d={`M ${cx - 20} 106 C ${cx - 10} ${seca ? 96 : 92}, ${cx + 10} ${seca ? 96 : 92}, ${cx + 20} 106 C ${cx + 10} 114, ${cx - 10} 114, ${cx - 20} 106 Z`} fill="#f7f4f0" stroke={p.contorno} strokeWidth="1.4" />
      <circle cx={cx} cy={104} r={8.5} fill="#3e2a1e" />
      <circle cx={cx} cy={104} r={4} fill="#0a0604" />
      <circle cx={cx - 3} cy={101} r={2} fill="#fff" opacity={seca ? 0.4 : 0.95} />
      {!seca && <path d={`M ${cx + 14} 112 q 3 8 0 14`} stroke="#bfe3ff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />}
    </g>
  );
  return (
    <svg viewBox="0 0 260 240" className="ilustracao crianca-rosto" role="img" aria-label={seca ? 'Criança desidratada: olhos fundos, sem lágrimas, lábios secos' : 'Criança hidratada: olhos normais, lágrimas, boca úmida'}>
      <FiltrosPele id={id} paleta={p} />
      <rect width="260" height="240" fill="#f6f1fc" />
      <g filter={`url(#${id('textura')})`}>
        <ellipse cx="44" cy="124" rx="16" ry="24" fill={`url(#${id('volume-suave')})`} />
        <ellipse cx="216" cy="124" rx="16" ry="24" fill={`url(#${id('volume-suave')})`} />
        <ellipse cx="130" cy="124" rx="90" ry="104" fill={`url(#${id('volume')})`} />
      </g>
      <path d="M 44 92 C 40 26, 220 26, 216 92 C 200 54, 160 40, 130 44 C 100 40, 60 54, 44 92 Z" fill={p.cabelo} />
      {!seca && (
        <>
          <circle cx="82" cy="148" r="20" fill={`url(#${id('rubor')})`} />
          <circle cx="178" cy="148" r="20" fill={`url(#${id('rubor')})`} />
        </>
      )}
      {olho(94)}
      {olho(166)}
      <path d="M 74 84 Q 94 76 112 82" fill="none" stroke={p.cabelo} strokeWidth="3" opacity="0.6" />
      <path d="M 148 82 Q 166 76 186 84" fill="none" stroke={p.cabelo} strokeWidth="3" opacity="0.6" />
      <ellipse cx="130" cy="138" rx="12" ry="9" fill={p.luz} opacity="0.6" />
      <path d="M 120 146 q 10 6 20 0" fill="none" stroke={p.sombra} strokeWidth="2" />
      {/* boca */}
      <path d="M 106 178 Q 130 170 154 178 Q 130 194 106 178 Z" fill={seca ? misturar(p.labio, '#d8c8c0', 0.45) : p.labio} />
      {seca ? (
        <g stroke={p.contorno} strokeWidth="0.9" opacity="0.7">
          {[114, 122, 130, 138, 146].map((x) => (
            <path key={x} d={`M ${x} 177 l 1 5`} />
          ))}
        </g>
      ) : (
        <ellipse cx="124" cy="176" rx="10" ry="2.4" fill="#fff" opacity="0.6" />
      )}
    </svg>
  );
}

/** Sinal da prega: a pele do abdome é pinçada e solta; volta rápido (normal) ou devagar. */
export function SinalDaPrega({ lenta, tom = 'claro' }: { lenta: boolean; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const estilo = { '--volta-prega': lenta ? '2.6s' : '0.5s' } as CSSProperties;
  return (
    <svg viewBox="0 0 260 180" className={`ilustracao sinal-prega ${lenta ? 'lenta' : 'rapida'}`} role="img" aria-label={lenta ? 'Sinal da prega: a pele volta muito devagar (mais de 2 segundos)' : 'Sinal da prega: a pele volta logo'} style={estilo}>
      <FiltrosPele id={id} paleta={p} />
      <rect width="260" height="180" fill="#f6f1fc" />
      <rect x="10" y="90" width="240" height="80" rx="16" fill={`url(#${id('volume-suave')})`} filter={`url(#${id('textura')})`} />
      <g className="prega-dobra">
        <path d="M 100 92 C 112 40, 148 40, 160 92 Z" fill={`url(#${id('volume')})`} />
        <path d="M 130 52 L 130 90" stroke={p.sombra} strokeWidth="2" opacity="0.6" />
      </g>
      <g className="prega-dedos" fill={misturar(p.base, '#ffffff', 0.15)} stroke={p.contorno} strokeOpacity="0.4">
        <path d={capsula({ x: 70, y: 20 }, { x: 108, y: 62 }, 22, 18)} />
        <path d={capsula({ x: 190, y: 20 }, { x: 152, y: 62 }, 22, 18)} />
      </g>
      <text x="130" y="176" fontSize="11" textAnchor="middle" fill="#4b2580">
        {lenta ? 'volta em mais de 2 s' : 'volta na hora'}
      </text>
    </svg>
  );
}

// ---- Sinais meníngeos -----------------------------------------------------------------

export function SinalMeningeo({ achado, tom = 'claro' }: { achado: 'nuca' | 'kernig' | 'brudzinski'; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const membro = (a: Ponto, b: Ponto, w1: number, w2 = w1, cor?: string) => <path d={capsula(a, b, w1, w2)} fill={cor ?? `url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.3" />;
  // criança deitada de lado na maca (vista lateral), cabeça à esquerda
  const quadril = { x: 150, y: 128 };
  const ombro = { x: 70, y: 124 };
  const cabeca = achado === 'nuca' || achado === 'brudzinski' ? { x: 50, y: 100 } : { x: 42, y: 118 };
  const joelho = achado === 'kernig' ? { x: 152, y: 70 } : achado === 'brudzinski' ? { x: 180, y: 96 } : { x: 196, y: 128 };
  const pe = achado === 'kernig' ? { x: 196, y: 58 } : achado === 'brudzinski' ? { x: 214, y: 128 } : { x: 238, y: 126 };
  return (
    <svg viewBox="0 0 260 180" className="ilustracao sinal-meningeo" role="img" aria-label={`Sinal meníngeo: ${achado}`}>
      <FiltrosPele id={id} paleta={p} />
      <defs>
        <marker id={id('seta')} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#c2413b" />
        </marker>
      </defs>
      <rect width="260" height="180" fill="#f6f1fc" />
      <rect x="10" y="140" width="240" height="14" rx="6" fill="#d8c7f2" />
      {membro(quadril, joelho, 24, 20, '#b99be6')}
      {membro(joelho, pe, 18, 14)}
      {membro(ombro, quadril, 40, 36, '#9b74d4')}
      <circle cx={cabeca.x} cy={cabeca.y} r={22} fill={`url(#${id('volume')})`} stroke={p.contorno} strokeOpacity="0.3" />
      <path d={`M ${cabeca.x - 10} ${cabeca.y - 2} q 4 3 8 0`} stroke={p.contorno} strokeWidth="1.6" fill="none" />
      {/* mão do examinador e setas */}
      {achado !== 'kernig' && (
        <g>
          <ellipse cx={cabeca.x - 18} cy={cabeca.y + 12} rx={16} ry={10} fill={misturar(PALETAS.moreno.base, '#ffffff', 0.2)} stroke={p.contorno} strokeOpacity="0.4" />
          <path d={`M ${cabeca.x - 24} ${cabeca.y - 30} q 30 -10 46 10`} fill="none" stroke="#c2413b" strokeWidth="2.4" markerEnd={`url(#${id('seta')})`} />
        </g>
      )}
      {achado === 'kernig' && <path d="M 206 76 q 24 20 18 50" fill="none" stroke="#c2413b" strokeWidth="2.4" markerEnd={`url(#${id('seta')})`} />}
      {achado === 'brudzinski' && <path d="M 196 70 q -16 -6 -26 10" fill="none" stroke="#c2413b" strokeWidth="2.4" markerEnd={`url(#${id('seta')})`} />}
      <text x="14" y="172" fontSize="10" fill="#4b2580">
        {achado === 'nuca' ? 'fletir o pescoço: resistência e dor' : achado === 'kernig' ? 'quadril a 90°: estender o joelho dói' : 'fletir o pescoço: os joelhos dobram sozinhos'}
      </text>
    </svg>
  );
}
