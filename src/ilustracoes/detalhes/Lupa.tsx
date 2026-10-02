/**
 * Moldura de "lupa" para os detalhes de pele: tudo o que estiver dentro fica recortado no círculo,
 * com aro lilás e reflexo de vidro.
 */

import type { ReactNode } from 'react';

export function Lupa({ id, cx = 150, cy = 110, r = 96, children }: { id: (n: string) => string; cx?: number; cy?: number; r?: number; children: ReactNode }) {
  return (
    <g>
      <defs>
        <clipPath id={id('lupa')}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <radialGradient id={id('vidro')} cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#2e1450" stopOpacity="0.18" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id('lupa')})`}>{children}</g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id('vidro')})`} pointerEvents="none" />
      <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#6d3fb2" strokeWidth="9" />
      <circle cx={cx} cy={cy} r={r + 9} fill="none" stroke="#4b2580" strokeWidth="1.5" opacity="0.6" />
      <path d={`M ${cx - r * 0.55} ${cy - r * 0.62} A ${r * 0.85} ${r * 0.85} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.85}`} fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
    </g>
  );
}
