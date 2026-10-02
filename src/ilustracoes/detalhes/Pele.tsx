/**
 * Pele vista na lupa: o fundo é a pele (com grão e lanugo) e por cima vêm as lesões.
 * Usado no atlas do RN e no exame físico da atenção básica (exantemas, piodermites...).
 */

import { type ReactNode, useId } from 'react';
import type { TomDePele } from '../../neonatal/exame';
import { FiltrosPele } from '../FiltrosPele';
import { idSvg, misturar, PALETAS, pontosFixos } from '../pele';
import { Lupa } from './Lupa';

export type LesaoPele =
  | 'normal'
  | 'eritema-toxico'
  | 'cutis-marmorata'
  | 'miliaria'
  | 'pustulose'
  | 'descamacao'
  | 'petequias'
  | 'hemangioma'
  | 'vinho-do-porto'
  // atenção básica
  | 'sarampo'
  | 'varicela'
  | 'escarlatina'
  | 'roseola'
  | 'impetigo'
  | 'escabiose'
  | 'molusco'
  | 'dermatite-atopica'
  | 'urticaria'
  | 'tinha';

const CX = 150;
const CY = 110;
const R = 96;

/** Pontos dentro do círculo da lupa (sempre os mesmos para a mesma semente). */
function espalhar(semente: number, quantos: number, margem = 6): { x: number; y: number; t: number }[] {
  const r = pontosFixos(semente, quantos * 12);
  const pts: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i < r.length - 2 && pts.length < quantos; i += 3) {
    const x = CX - R + r[i]! * 2 * R;
    const y = CY - R + r[i + 1]! * 2 * R;
    if (Math.hypot(x - CX, y - CY) < R - margem) pts.push({ x, y, t: r[i + 2]! });
  }
  return pts;
}

export function PeleDetalhe({ achado, tom = 'claro', titulo }: { achado: LesaoPele; tom?: TomDePele; titulo?: string }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const escuro = tom === 'negro';
  const borrar = (n: 'borrar' | 'borrar-leve' | 'borrar-forte') => `url(#${id(n)})`;
  const vermelho = escuro ? '#7a2420' : '#d23b33';
  let lesoes: ReactNode = null;

  switch (achado) {
    case 'eritema-toxico':
      lesoes = espalhar(3, 9, 18).map((s, i) => (
        <g key={i}>
          <path
            d={`M ${s.x - 16} ${s.y} C ${s.x - 15} ${s.y - 14}, ${s.x + 12} ${s.y - 17}, ${s.x + 17} ${s.y - 2} C ${s.x + 19} ${s.y + 12}, ${s.x - 6} ${s.y + 18}, ${s.x - 16} ${s.y} Z`}
            fill={vermelho}
            opacity={escuro ? 0.35 : 0.42}
            filter={borrar('borrar')}
            transform={`rotate(${s.t * 180} ${s.x} ${s.y})`}
          />
          <circle cx={s.x} cy={s.y} r={3.4} fill="#fff4cc" stroke="#e8cf7a" strokeWidth="0.8" />
          <circle cx={s.x - 1} cy={s.y - 1} r={1.1} fill="#fff" />
        </g>
      ));
      break;
    case 'cutis-marmorata':
      lesoes = <rect x={CX - R} y={CY - R} width={2 * R} height={2 * R} fill="#7f4f98" opacity={escuro ? 0.45 : 0.55} filter={`url(#${id('marmore')})`} style={{ mixBlendMode: 'multiply' }} />;
      break;
    case 'miliaria':
      lesoes = espalhar(5, 70, 4).map((s, i) => (
        <g key={i}>
          {s.t < 0.3 && <circle cx={s.x} cy={s.y} r={4} fill={vermelho} opacity="0.25" filter={borrar('borrar-leve')} />}
          <circle cx={s.x} cy={s.y} r={1.6 + s.t * 1.2} fill="#fff" opacity="0.55" stroke={misturar(p.base, '#ffffff', 0.5)} strokeWidth="0.5" />
          <circle cx={s.x - 0.6} cy={s.y - 0.6} r={0.6} fill="#fff" />
        </g>
      ));
      break;
    case 'pustulose':
      lesoes = espalhar(8, 14, 12).map((s, i) =>
        s.t < 0.4 ? (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={4.5} fill="#fbf5df" stroke="#e7d9a8" strokeWidth="0.8" />
            <circle cx={s.x - 1.2} cy={s.y - 1.2} r={1.4} fill="#fff" />
          </g>
        ) : (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={6 + s.t * 3} fill={misturar(p.base, '#1c0e07', 0.45)} opacity="0.8" filter={borrar('borrar-leve')} />
            <circle cx={s.x} cy={s.y} r={6 + s.t * 3} fill="none" stroke="#efe6d8" strokeWidth="1.6" strokeDasharray="2 1.5" opacity="0.85" />
          </g>
        ),
      );
      break;
    case 'descamacao':
      lesoes = espalhar(9, 22, 0).map((s, i) => (
        <g key={i} transform={`rotate(${s.t * 360} ${s.x} ${s.y})`}>
          <path d={`M ${s.x - 14} ${s.y - 4} Q ${s.x - 2} ${s.y - 10} ${s.x + 8} ${s.y - 9} Q ${s.x + 14} ${s.y - 3} ${s.x + 15} ${s.y + 3} Q ${s.x + 4} ${s.y + 8} ${s.x - 3} ${s.y + 9} Z`} fill={misturar(p.luz, '#ffffff', 0.2)} opacity="0.7" />
          <path d={`M ${s.x + 8} ${s.y - 9} Q ${s.x + 14} ${s.y - 3} ${s.x + 15} ${s.y + 3} Q ${s.x + 4} ${s.y + 8} ${s.x - 3} ${s.y + 9}`} fill="none" stroke={p.sombra} strokeWidth="1.4" opacity="0.5" filter={borrar('borrar-leve')} />
          <path d={`M ${s.x - 20} ${s.y + 16} l 14 -4 l 10 6`} fill="none" stroke={p.contorno} strokeWidth="0.8" opacity="0.45" />
        </g>
      ));
      break;
    case 'petequias':
      lesoes = espalhar(12, 90, 2).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={0.9 + s.t * 1.3} fill={escuro ? '#3e0c14' : '#8c1530'} opacity="0.9" />);
      break;
    case 'hemangioma':
      lesoes = (
        <g>
          <ellipse cx={CX + 4} cy={CY + 12} rx={50} ry={36} fill={p.sombra} opacity="0.45" filter={borrar('borrar')} />
          {[
            [CX - 18, CY - 4, 26],
            [CX + 14, CY - 10, 28],
            [CX + 2, CY + 14, 30],
            [CX - 26, CY + 18, 20],
            [CX + 30, CY + 14, 20],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={`url(#${id('morango')})`} />
          ))}
          {espalhar(14, 40, 40).map((s, i) => (
            <circle key={i} cx={s.x * 0.5 + CX * 0.5} cy={s.y * 0.45 + CY * 0.55} r={1.4} fill="#7a0a17" opacity="0.5" />
          ))}
          <ellipse cx={CX - 14} cy={CY - 16} rx={12} ry={6} fill="#fff" opacity="0.45" filter={borrar('borrar-leve')} />
        </g>
      );
      break;
    case 'vinho-do-porto':
      lesoes = (
        <path
          d={`M ${CX - 90} ${CY - 70} C ${CX - 40} ${CY - 80}, ${CX - 10} ${CY - 40}, ${CX + 20} ${CY - 50} C ${CX + 50} ${CY - 58}, ${CX + 40} ${CY - 6}, ${CX + 10} ${CY + 14} C ${CX - 10} ${CY + 30}, ${CX + 30} ${CY + 60}, ${CX - 10} ${CY + 80} C ${CX - 50} ${CY + 96}, ${CX - 100} ${CY + 40}, ${CX - 96} ${CY} Z`}
          fill={escuro ? '#4a0f2a' : '#9b2347'}
          opacity={escuro ? 0.6 : 0.62}
          style={{ mixBlendMode: 'multiply' }}
        />
      );
      break;
    case 'sarampo':
      lesoes = espalhar(21, 60, 0).map((s, i) => (
        <ellipse key={i} cx={s.x} cy={s.y} rx={6 + s.t * 9} ry={5 + s.t * 7} fill={vermelho} opacity={escuro ? 0.42 : 0.48} filter={borrar('borrar-leve')} transform={`rotate(${s.t * 90} ${s.x} ${s.y})`} />
      ));
      break;
    case 'varicela':
      lesoes = espalhar(23, 16, 14).map((s, i) => {
        const fase = i % 4; // mácula, pápula, vesícula ("gota de orvalho"), crosta
        return (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={10} fill={vermelho} opacity={escuro ? 0.35 : 0.45} filter={borrar('borrar-leve')} />
            {fase === 1 && <circle cx={s.x} cy={s.y} r={4.5} fill={misturar(vermelho, p.base, 0.3)} opacity="0.9" />}
            {fase === 2 && (
              <g>
                <circle cx={s.x} cy={s.y} r={5.5} fill="#fdfaf0" opacity="0.75" stroke="#f1e6c8" strokeWidth="0.6" />
                <circle cx={s.x - 1.8} cy={s.y - 1.8} r={1.6} fill="#fff" />
              </g>
            )}
            {fase === 3 && <circle cx={s.x} cy={s.y} r={5} fill="#6b3b1e" opacity="0.9" />}
          </g>
        );
      });
      break;
    case 'escarlatina':
      lesoes = (
        <g>
          <rect x={CX - R} y={CY - R} width={2 * R} height={2 * R} fill={vermelho} opacity={escuro ? 0.22 : 0.3} />
          {espalhar(25, 260, 0).map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={0.9 + s.t * 0.8} fill={escuro ? '#5e1816' : '#b8261f'} opacity="0.7" />
          ))}
        </g>
      );
      break;
    case 'roseola':
      lesoes = espalhar(27, 30, 6).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={3 + s.t * 4} fill="#e57f8f" opacity={escuro ? 0.35 : 0.5} filter={borrar('borrar-leve')} />);
      break;
    case 'impetigo':
      lesoes = espalhar(29, 5, 30).map((s, i) => (
        <g key={i}>
          <ellipse cx={s.x} cy={s.y} rx={22} ry={16} fill={vermelho} opacity="0.4" filter={borrar('borrar')} />
          <path
            d={`M ${s.x - 14} ${s.y} C ${s.x - 12} ${s.y - 11}, ${s.x + 10} ${s.y - 12}, ${s.x + 15} ${s.y - 2} C ${s.x + 16} ${s.y + 9}, ${s.x - 4} ${s.y + 13}, ${s.x - 14} ${s.y} Z`}
            fill="#d9a13a"
          />
          {[0, 1, 2, 3].map((k) => (
            <circle key={k} cx={s.x - 6 + k * 4} cy={s.y - 3 + (k % 2) * 4} r={2.4} fill="#f2c45a" opacity="0.9" />
          ))}
          <ellipse cx={s.x - 4} cy={s.y - 5} rx={4} ry={2} fill="#fff6d0" opacity="0.7" />
        </g>
      ));
      break;
    case 'escabiose':
      lesoes = (
        <g>
          {espalhar(31, 18, 8).map((s, i) => (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r={3.5} fill={vermelho} opacity="0.65" />
              {i % 3 === 0 && <path d={`M ${s.x} ${s.y} q 8 -6 16 -2 q 6 4 12 -1`} fill="none" stroke={escuro ? '#2a1a12' : '#7a5a4a'} strokeWidth="1.3" strokeLinecap="round" />}
              {i % 4 === 0 && <path d={`M ${s.x - 3} ${s.y - 3} l 6 6 M ${s.x + 3} ${s.y - 3} l -6 6`} stroke="#5a1a14" strokeWidth="0.8" />}
            </g>
          ))}
        </g>
      );
      break;
    case 'molusco':
      lesoes = espalhar(33, 12, 12).map((s, i) => (
        <g key={i}>
          <circle cx={s.x + 2} cy={s.y + 3} r={8 + s.t * 3} fill={p.sombra} opacity="0.45" filter={borrar('borrar-leve')} />
          <circle cx={s.x} cy={s.y} r={8 + s.t * 3} fill={`url(#${id('perola')})`} stroke={misturar(p.base, '#e0b0a8', 0.4)} strokeWidth="0.8" />
          <circle cx={s.x} cy={s.y} r={1.8} fill={p.sombra} opacity="0.8" />
          <ellipse cx={s.x - 3} cy={s.y - 3.5} rx={2.4} ry={1.4} fill="#fff" opacity="0.85" />
        </g>
      ));
      break;
    case 'dermatite-atopica':
      lesoes = (
        <g>
          <path d={`M ${CX - 70} ${CY - 20} C ${CX - 50} ${CY - 66}, ${CX + 30} ${CY - 58}, ${CX + 66} ${CY - 26} C ${CX + 92} ${CY + 4}, ${CX + 50} ${CY + 62}, ${CX - 6} ${CY + 58} C ${CX - 60} ${CY + 56}, ${CX - 84} ${CY + 16}, ${CX - 70} ${CY - 20} Z`} fill={vermelho} opacity={escuro ? 0.3 : 0.34} filter={borrar('borrar')} />
          {/* liquenificação: pele grossa com sulcos cruzados */}
          <g stroke={misturar(p.sombra, vermelho, 0.3)} strokeWidth="1" opacity="0.45">
            {Array.from({ length: 9 }, (_, i) => (
              <path key={`a${i}`} d={`M ${CX - 50 + i * 12} ${CY - 34} l 30 60`} />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <path key={`b${i}`} d={`M ${CX + 50 - i * 12} ${CY - 34} l -30 60`} />
            ))}
          </g>
          {espalhar(35, 26, 30).map((s, i) => (
            <path key={i} d={`M ${s.x - 5} ${s.y} l 10 ${s.t * 4 - 2}`} stroke={misturar(p.luz, '#ffffff', 0.5)} strokeWidth="1.6" opacity="0.7" strokeLinecap="round" />
          ))}
          {espalhar(36, 14, 30).map((s, i) => (
            <path key={i} d={`M ${s.x} ${s.y} l ${4 + s.t * 6} ${-6 - s.t * 5}`} stroke="#8a1c1c" strokeWidth="1" opacity="0.55" />
          ))}
        </g>
      );
      break;
    case 'urticaria':
      lesoes = espalhar(37, 6, 26).map((s, i) => (
        <g key={i}>
          <path d={`M ${s.x - 22} ${s.y} C ${s.x - 20} ${s.y - 20}, ${s.x + 16} ${s.y - 22}, ${s.x + 24} ${s.y - 2} C ${s.x + 28} ${s.y + 16}, ${s.x - 10} ${s.y + 24}, ${s.x - 22} ${s.y} Z`} fill={vermelho} opacity="0.35" filter={borrar('borrar-leve')} />
          <path d={`M ${s.x - 14} ${s.y} C ${s.x - 12} ${s.y - 12}, ${s.x + 10} ${s.y - 14}, ${s.x + 15} ${s.y - 1} C ${s.x + 17} ${s.y + 10}, ${s.x - 6} ${s.y + 15}, ${s.x - 14} ${s.y} Z`} fill={misturar(p.luz, '#fff4f0', 0.5)} opacity="0.7" />
        </g>
      ));
      break;
    case 'tinha':
      lesoes = (
        <g>
          <circle cx={CX} cy={CY} r={52} fill="none" stroke={vermelho} strokeWidth="9" opacity="0.5" filter={borrar('borrar-leve')} />
          <circle cx={CX} cy={CY} r={52} fill="none" stroke={misturar(p.luz, '#ffffff', 0.5)} strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
          <circle cx={CX} cy={CY} r={42} fill={misturar(p.base, p.luz, 0.4)} opacity="0.5" />
        </g>
      );
      break;
    case 'normal':
      lesoes = null;
      break;
  }

  return (
    <svg viewBox="0 0 300 220" className="ilustracao detalhe-pele" role="img" aria-label={titulo ?? `Pele vista de perto: ${achado}`}>
      <FiltrosPele id={id} paleta={p} />
      <defs>
        <radialGradient id={id('perola')} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fffaf6" />
          <stop offset="0.7" stopColor={misturar(p.luz, '#fff1ea', 0.5)} />
          <stop offset="1" stopColor={misturar(p.base, '#e8c0b4', 0.4)} />
        </radialGradient>
        <radialGradient id={id('morango')} cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#ff6a6a" />
          <stop offset="0.6" stopColor="#d81e2e" />
          <stop offset="1" stopColor="#8e0d1f" />
        </radialGradient>
        <filter id={id('marmore')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.045" numOctaves="2" seed="4" result="ruido" />
          <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="alfa" />
          <feComponentTransfer in="alfa" result="rede">
            <feFuncA type="table" tableValues="0 0 0 0 0 0 0 0.5 1 0.5 0 0 0 0 0 0 0" />
          </feComponentTransfer>
          <feGaussianBlur in="rede" stdDeviation="1" result="redeSuave" />
          <feComposite in="SourceGraphic" in2="redeSuave" operator="in" />
        </filter>
      </defs>
      <rect width="300" height="220" fill="#f6f1fc" />
      <Lupa id={id} cx={CX} cy={CY} r={R}>
        <g filter={`url(#${id('textura')})`}>
          <rect x={CX - R} y={CY - R} width={2 * R} height={2 * R} fill={`url(#${id('volume-suave')})`} />
        </g>
        {/* poros e pelinhos (lanugo) */}
        <g stroke={p.cabelo} strokeWidth="0.5" opacity={escuro ? 0.35 : 0.25}>
          {espalhar(41, 40, 0).map((s, i) => (
            <path key={i} d={`M ${s.x} ${s.y} q 3 -2 5 -6`} fill="none" />
          ))}
        </g>
        {lesoes}
      </Lupa>
    </svg>
  );
}
