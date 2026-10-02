/**
 * Umbigo do RN de perto. Achados: coto normal (com corte mostrando 2 artérias e 1 veia),
 * artéria umbilical única (corte), onfalite, granuloma umbilical, hérnia umbilical.
 */

import { useId } from 'react';
import type { TomDePele } from '../../neonatal/exame';
import { FiltrosPele } from '../FiltrosPele';
import { idSvg, misturar, PALETAS } from '../pele';

export type AchadoUmbigo = 'coto-normal' | 'arteria-unica' | 'onfalite' | 'granuloma' | 'hernia';

/** Corte transversal do cordão: geleia de Wharton com a veia (grande) e as artérias (pequenas, parede grossa). */
function CorteCordao({ arterias, x, y, legenda = true }: { arterias: 1 | 2; x: number; y: number; legenda?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={34} fill="#f3edd2" stroke="#c9b98a" strokeWidth="2" />
      <ellipse cx={x - 2} cy={y - 8} rx={14} ry={11} fill="#8e2a3e" stroke="#c48a95" strokeWidth="2.5" />
      <ellipse cx={x - 2} cy={y - 8} rx={9} ry={6} fill="#5a0f1f" />
      {[...(arterias === 2 ? [-14, 14] : [12])].map((dx) => (
        <g key={dx}>
          <circle cx={x + dx} cy={y + 14} r={7.5} fill="#e6c6c9" stroke="#b05a6a" strokeWidth="3" />
          <circle cx={x + dx} cy={y + 14} r={2.5} fill="#7a1422" />
        </g>
      ))}
      {legenda && (
        <text x={x} y={y + 50} fontSize="10" textAnchor="middle" fill="#2e1450">
          {arterias === 2 ? '1 veia + 2 artérias' : '1 veia + 1 artéria'}
        </text>
      )}
    </g>
  );
}

export function UmbigoDetalhe({ achado, tom = 'claro' }: { achado: AchadoUmbigo; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const comCoto = achado === 'coto-normal' || achado === 'onfalite';
  return (
    <svg viewBox="0 0 300 220" className="ilustracao detalhe-umbigo" role="img" aria-label={`Umbigo do RN: ${achado}`}>
      <FiltrosPele id={id} paleta={p} />
      <defs>
        <radialGradient id={id('vermelhidao')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#c7231f" stopOpacity="0.8" />
          <stop offset="0.65" stopColor="#d9443a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#d9443a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('granuloma')} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffb3bf" />
          <stop offset="0.6" stopColor="#e5536b" />
          <stop offset="1" stopColor="#a3243a" />
        </radialGradient>
      </defs>
      <rect width="300" height="220" fill={`url(#${id('volume-suave')})`} filter={`url(#${id('textura')})`} />
      {achado === 'arteria-unica' ? (
        <g>
          <rect width="300" height="220" fill="#f6f1fc" />
          <CorteCordao arterias={2} x={80} y={96} />
          <CorteCordao arterias={1} x={220} y={96} />
          <text x="80" y="30" fontSize="12" fontWeight="700" textAnchor="middle" fill="#22935a">
            Normal
          </text>
          <text x="220" y="30" fontSize="12" fontWeight="700" textAnchor="middle" fill="#c2413b">
            Artéria única
          </text>
        </g>
      ) : (
        <g>
          {achado === 'onfalite' && (
            <>
              <circle cx="150" cy="118" r="78" fill={`url(#${id('vermelhidao')})`} />
              <circle cx="150" cy="118" r="50" fill={p.luz} opacity="0.25" filter={`url(#${id('borrar')})`} />
            </>
          )}
          {achado === 'hernia' && (
            <g>
              <ellipse cx="156" cy="128" rx="46" ry="40" fill={p.sombra} opacity="0.45" filter={`url(#${id('borrar')})`} />
              <ellipse cx="150" cy="118" rx="44" ry="40" fill={`url(#${id('volume')})`} />
              <ellipse cx="138" cy="104" rx="16" ry="10" fill="#fff" opacity="0.3" filter={`url(#${id('borrar')})`} />
              <path d="M 144 116 q 6 8 12 0" fill="none" stroke={p.contorno} strokeWidth="2" opacity="0.6" />
            </g>
          )}
          {achado !== 'hernia' && (
            <>
              {/* anel umbilical */}
              <ellipse cx="150" cy="122" rx="22" ry="16" fill={p.sombra} opacity="0.6" filter={`url(#${id('borrar-leve')})`} />
              <ellipse cx="150" cy="120" rx="16" ry="11" fill={misturar(p.sombra, p.contorno, 0.4)} />
            </>
          )}
          {comCoto && (
            <g>
              {/* coto secando, preso pelo clampe */}
              <path d="M 140 120 C 132 90, 136 60, 148 44 C 160 50, 168 86, 162 120 Z" fill={achado === 'onfalite' ? '#9a7a3a' : '#b8a060'} stroke="#7a6230" />
              <path d="M 146 112 C 142 92, 144 70, 150 52" fill="none" stroke="#6e5a2c" strokeWidth="1.5" opacity="0.6" />
              <rect x="124" y="58" width="56" height="14" rx="4" fill="#cbb6ee" stroke="#8f72c4" transform="rotate(-8 152 65)" />
              {achado === 'onfalite' && (
                <g fill="#e6d48a" stroke="#c9b45e" strokeWidth="0.8">
                  <path d="M 136 124 C 128 132, 134 142, 146 138 C 150 134, 144 126, 136 124 Z" />
                  <path d="M 158 126 C 170 128, 170 140, 160 140 C 154 136, 154 130, 158 126 Z" />
                </g>
              )}
            </g>
          )}
          {achado === 'granuloma' && (
            <g>
              <ellipse cx="150" cy="120" rx="11" ry="8.5" fill={`url(#${id('granuloma')})`} />
              <ellipse cx="147" cy="117" rx="4" ry="2.2" fill="#fff" opacity="0.8" />
              <path d="M 140 128 q 10 6 20 0" fill="none" stroke="#f3e6c8" strokeWidth="2" opacity="0.8" />
            </g>
          )}
          {achado === 'coto-normal' && (
            <g>
              <rect x="212" y="138" width="80" height="78" rx="8" fill="#ffffffd9" stroke="#d8c7f2" />
              <g transform="translate(252 170) scale(0.62) translate(-80 -96)">
                <CorteCordao arterias={2} x={80} y={96} legenda={false} />
              </g>
              <text x="252" y="212" fontSize="9" textAnchor="middle" fill="#2e1450">
                corte do cordão
              </text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
