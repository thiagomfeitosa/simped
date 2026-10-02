/**
 * Boca do RN aberta (chorando), vista de frente: lábios, gengivas, palato e língua.
 * Achados: pérolas de Epstein, monilíase (sapinho), freio lingual curto.
 */

import { useId } from 'react';
import type { TomDePele } from '../../neonatal/exame';
import { FiltrosPele } from '../FiltrosPele';
import { idSvg, misturar, PALETAS, pontosFixos } from '../pele';

export type AchadoBoca = 'normal' | 'perolas-epstein' | 'sapinho' | 'freio-curto';

export function BocaDetalhe({ achado, tom = 'claro' }: { achado: AchadoBoca; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const mucosa = p.mucosa;
  const gengiva = misturar(mucosa, '#ffd6dc', 0.35);
  const palato = misturar(mucosa, '#f6c3c8', 0.3);
  const lingua = misturar(mucosa, '#ff8f9c', 0.25);
  const freio = achado === 'freio-curto';
  const r = pontosFixos(23, 80);
  return (
    <svg viewBox="0 0 300 240" className="ilustracao detalhe-boca" role="img" aria-label={`Boca do RN aberta: ${achado}`}>
      <FiltrosPele id={id} paleta={p} />
      <defs>
        <radialGradient id={id('fundo-boca')} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#5a1622" />
          <stop offset="1" stopColor="#2a070d" />
        </radialGradient>
        <radialGradient id={id('lingua')} cx="45%" cy="35%" r="70%">
          <stop offset="0" stopColor={misturar(lingua, '#ffffff', 0.25)} />
          <stop offset="1" stopColor={misturar(lingua, '#7a1c2c', 0.35)} />
        </radialGradient>
      </defs>
      <rect width="300" height="240" fill={`url(#${id('volume-suave')})`} filter={`url(#${id('textura')})`} />
      {/* lábios */}
      <ellipse cx="150" cy="122" rx="112" ry="88" fill={p.labio} />
      <ellipse cx="150" cy="118" rx="100" ry="76" fill={misturar(p.labio, mucosa, 0.5)} />
      {/* cavidade */}
      <ellipse cx="150" cy="120" rx="92" ry="68" fill={`url(#${id('fundo-boca')})`} />
      {/* palato com rugas e rafe mediana */}
      <path d="M 66 96 C 80 54, 220 54, 234 96 C 210 84, 90 84, 66 96 Z" fill={palato} />
      <path d="M 150 60 L 150 90" stroke={misturar(palato, '#ffffff', 0.4)} strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <g key={i} stroke={misturar(palato, '#8a2a3a', 0.25)} strokeWidth="1.6" fill="none" opacity="0.7">
          <path d={`M 146 ${66 + i * 7} q -14 2 -24 8`} />
          <path d={`M 154 ${66 + i * 7} q 14 2 24 8`} />
        </g>
      ))}
      {/* gengivas superior e inferior */}
      <path d="M 60 102 C 84 82, 216 82, 240 102 C 216 94, 84 94, 60 102 Z" fill={gengiva} />
      <path d="M 70 164 C 100 186, 200 186, 230 164 C 204 176, 96 176, 70 164 Z" fill={gengiva} />
      {/* língua */}
      {freio ? (
        <g>
          {/* língua levantada ao chorar, ponta em coração, freio curto e grosso */}
          <path d="M 96 168 C 92 130, 120 112, 142 116 Q 150 124 158 116 C 180 112, 208 130, 204 168 Z" fill={`url(#${id('lingua')})`} />
          <path d="M 142 116 Q 150 128 158 116" fill="none" stroke={misturar(lingua, '#5a1020', 0.4)} strokeWidth="2" />
          <path d="M 144 122 L 140 170 L 160 170 L 156 122 Z" fill={misturar(lingua, '#f7c9cf', 0.45)} stroke={misturar(lingua, '#7a2a36', 0.3)} />
          <path d="M 150 124 L 150 168" stroke={misturar(lingua, '#7a2a36', 0.4)} strokeWidth="1" />
        </g>
      ) : (
        <g>
          <path d="M 84 168 C 84 128, 216 128, 216 168 C 190 182, 110 182, 84 168 Z" fill={`url(#${id('lingua')})`} />
          <path d="M 150 140 L 150 170" stroke={misturar(lingua, '#7a1c2c', 0.3)} strokeWidth="2" opacity="0.6" />
          <ellipse cx="128" cy="146" rx="20" ry="6" fill="#fff" opacity="0.18" />
        </g>
      )}
      {achado === 'perolas-epstein' &&
        [66, 74, 81, 69].map((y, i) => (
          <g key={i}>
            <circle cx={150 + (i === 3 ? 7 : i === 2 ? -6 : 0)} cy={y} r={3.6 - i * 0.3} fill="#fffdf5" stroke="#efe6cf" strokeWidth="0.6" />
            <circle cx={149 + (i === 3 ? 7 : i === 2 ? -6 : 0)} cy={y - 1} r={1.1} fill="#fff" />
          </g>
        ))}
      {achado === 'sapinho' && (
        <g fill="#fbf8ee" stroke="#e8e0c8" strokeWidth="0.6">
          {Array.from({ length: 26 }, (_, i) => {
            const naLingua = i < 14;
            const x = naLingua ? 100 + r[i]! * 100 : i % 2 === 0 ? 70 + r[i]! * 14 : 216 + r[i]! * 14;
            const y = naLingua ? 146 + r[i + 30]! * 22 : 108 + r[i + 30]! * 50;
            const w = 4 + r[i + 50]! * 6;
            return <path key={i} d={`M ${x - w} ${y} q ${w * 0.4} ${-w * 0.9} ${w} ${-w * 0.2} q ${w * 0.8} ${w * 0.1} ${w} ${w * 0.6} q ${-w * 0.6} ${w * 0.7} ${-w * 1.4} ${w * 0.3} z`} />;
          })}
          <path d="M 64 168 C 80 172, 96 174, 110 172" fill="none" stroke="#fbf8ee" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
