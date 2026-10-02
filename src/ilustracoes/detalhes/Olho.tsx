/**
 * Olhos do RN: teste do olhinho (reflexo vermelho no quarto escuro) e conjuntivite neonatal.
 */

import { useId } from 'react';
import type { TomDePele } from '../../neonatal/exame';
import { FiltrosPele } from '../FiltrosPele';
import { idSvg, misturar, PALETAS } from '../pele';

export type AchadoOlho = 'reflexo-normal' | 'leucocoria' | 'conjuntivite';

export function OlhoDetalhe({ achado, tom = 'claro' }: { achado: AchadoOlho; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];

  if (achado === 'conjuntivite') {
    const vermelhidao = misturar(p.base, '#d0505a', tom === 'negro' ? 0.25 : 0.4);
    return (
      <svg viewBox="0 0 300 200" className="ilustracao detalhe-olho" role="img" aria-label="Olho com conjuntivite neonatal: pálpebras inchadas e secreção purulenta">
        <FiltrosPele id={id} paleta={p} />
        <g filter={`url(#${id('textura')})`}>
          <rect width="300" height="200" fill={`url(#${id('volume-suave')})`} />
          {/* sobrancelha e pálpebras inchadas, avermelhadas */}
          <ellipse cx="150" cy="84" rx="98" ry="48" fill={vermelhidao} opacity="0.7" filter={`url(#${id('borrar')})`} />
          <ellipse cx="150" cy="80" rx="86" ry="38" fill={`url(#${id('volume')})`} opacity="0.9" />
          <ellipse cx="150" cy="70" rx="60" ry="18" fill={p.luz} opacity="0.5" filter={`url(#${id('borrar')})`} />
          <ellipse cx="150" cy="128" rx="84" ry="26" fill={vermelhidao} opacity="0.75" filter={`url(#${id('borrar-leve')})`} />
        </g>
        <path d="M 70 26 Q 150 6 230 26" fill="none" stroke={p.sombra} strokeWidth="6" opacity="0.3" strokeLinecap="round" />
        {/* fenda fechada pelo inchaço, com cílios */}
        <path d="M 68 112 Q 150 126 232 110" fill="none" stroke={p.contorno} strokeWidth="3" strokeLinecap="round" />
        {Array.from({ length: 14 }, (_, i) => {
          const x = 76 + i * 11;
          return <path key={i} d={`M ${x} ${114 + Math.sin(i / 2) * 1.5} l ${-1 + i * 0.15} 6`} stroke={p.contorno} strokeWidth="1.3" />;
        })}
        {/* secreção purulenta: no canto interno, nos cílios e escorrendo */}
        <path d="M 210 108 C 226 104, 240 112, 236 124 C 232 140, 226 156, 220 166 C 214 150, 212 134, 204 124 C 198 118, 202 110, 210 108 Z" fill="#d8cc5e" stroke="#b9a640" strokeWidth="1" />
        {[96, 118, 142, 168, 190].map((x, i) => (
          <ellipse key={x} cx={x} cy={118 + (i % 2)} rx={6 + (i % 3) * 2} ry={3.5} fill="#cfc054" stroke="#ad9c3c" strokeWidth="0.8" />
        ))}
        <ellipse cx="214" cy="114" rx="5" ry="2.4" fill="#fff8c8" opacity="0.8" />
      </svg>
    );
  }

  // teste do olhinho: quarto escuro, oftalmoscópio a ~40 cm, os dois olhos
  const olho = (cx: number, branco: boolean) => (
    <g>
      <path d={`M ${cx - 46} 100 C ${cx - 26} 74, ${cx + 26} 74, ${cx + 46} 100 C ${cx + 26} 120, ${cx - 26} 120, ${cx - 46} 100 Z`} fill="#3b3540" />
      <circle cx={cx} cy={98} r={21} fill="#1d1820" />
      <circle cx={cx} cy={98} r={12} fill={`url(#${id(branco ? 'branco' : 'vermelho')})`} />
      <circle cx={cx} cy={98} r={18} fill={`url(#${id(branco ? 'halo-branco' : 'halo')})`} />
      <circle cx={cx - 5} cy={93} r={2.6} fill="#fff" opacity="0.95" />
      <path d={`M ${cx - 46} 100 C ${cx - 26} 74, ${cx + 26} 74, ${cx + 46} 100`} fill="none" stroke="#120c10" strokeWidth="3" />
    </g>
  );
  return (
    <svg viewBox="0 0 300 200" className="ilustracao detalhe-olho" role="img" aria-label={achado === 'leucocoria' ? 'Teste do olhinho: reflexo branco no olho direito do bebê' : 'Teste do olhinho: reflexo vermelho normal nos dois olhos'}>
      <FiltrosPele id={id} paleta={p} />
      <defs>
        <radialGradient id={id('vermelho')} cx="45%" cy="45%" r="60%">
          <stop offset="0" stopColor="#ffb36b" />
          <stop offset="0.5" stopColor="#ef5a2a" />
          <stop offset="1" stopColor="#a0180f" />
        </radialGradient>
        <radialGradient id={id('branco')} cx="45%" cy="45%" r="60%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#ece8dc" />
          <stop offset="1" stopColor="#b9b4a6" />
        </radialGradient>
        <radialGradient id={id('halo')} cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor="#ff6a3a" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ff6a3a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('halo-branco')} cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* rosto no escuro */}
      <rect width="300" height="200" fill={misturar(p.sombra, '#000000', 0.72)} />
      <ellipse cx="150" cy="120" rx="160" ry="120" fill={misturar(p.base, '#000000', 0.62)} filter={`url(#${id('borrar-forte')})`} />
      <ellipse cx="150" cy="150" rx="22" ry="16" fill={misturar(p.luz, '#000000', 0.6)} filter={`url(#${id('borrar')})`} />
      {/* o olho direito do bebê fica à esquerda de quem olha */}
      {olho(88, achado === 'leucocoria')}
      {olho(212, false)}
    </svg>
  );
}
