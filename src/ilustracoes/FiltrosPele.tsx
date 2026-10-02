/**
 * Filtros e gradientes comuns das ilustrações: textura fina da pele (grão), desfoque
 * para sombras e brilhos suaves e o gradiente de "volume" (luz de cima à esquerda).
 * Cada ilustração põe um <FiltrosPele> dentro do seu <svg> com o próprio prefixo de id.
 */

import type { PaletaPele } from './pele';

export function FiltrosPele({ id, paleta }: { id: (nome: string) => string; paleta: PaletaPele }) {
  return (
    <defs>
      {/* grão da pele: ruído muito fino, só onde há desenho */}
      <filter id={id('textura')} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="ruido" />
        <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.22  0 0 0 0 0.18  0.28 0 0 0 -0.08" result="grao" />
        <feComposite in="grao" in2="SourceAlpha" operator="in" result="graoNoDesenho" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="graoNoDesenho" />
        </feMerge>
      </filter>
      <filter id={id('borrar')} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id={id('borrar-forte')} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="8" />
      </filter>
      <filter id={id('borrar-leve')} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2" />
      </filter>
      {/* volume: centro mais claro, bordas na cor da sombra */}
      <radialGradient id={id('volume')} cx="42%" cy="36%" r="70%">
        <stop offset="0" stopColor={paleta.luz} />
        <stop offset="0.55" stopColor={paleta.base} />
        <stop offset="1" stopColor={paleta.sombra} />
      </radialGradient>
      <radialGradient id={id('volume-suave')} cx="45%" cy="40%" r="75%">
        <stop offset="0" stopColor={paleta.luz} />
        <stop offset="0.7" stopColor={paleta.base} />
        <stop offset="1" stopColor={paleta.sombra} />
      </radialGradient>
      <radialGradient id={id('rubor')} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor={paleta.rubor} stopOpacity="0.55" />
        <stop offset="1" stopColor={paleta.rubor} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('brilho')} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Lençol lilás com dobras suaves (fundo das ilustrações do RN). */
export function Lencol({ largura, altura, id }: { largura: number; altura: number; id: (nome: string) => string }) {
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={id('lencol')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4eefc" />
          <stop offset="0.6" stopColor="#e7dcf6" />
          <stop offset="1" stopColor="#d9c9f0" />
        </linearGradient>
      </defs>
      <rect width={largura} height={altura} fill={`url(#${id('lencol')})`} />
      <g fill="none" stroke="#c7b2e6" strokeWidth="3" opacity="0.45" filter={`url(#${id('borrar')})`}>
        <path d={`M -10 ${altura * 0.18} C ${largura * 0.3} ${altura * 0.1}, ${largura * 0.6} ${altura * 0.28}, ${largura + 10} ${altura * 0.16}`} />
        <path d={`M -10 ${altura * 0.78} C ${largura * 0.25} ${altura * 0.7}, ${largura * 0.7} ${altura * 0.9}, ${largura + 10} ${altura * 0.76}`} />
        <path d={`M ${largura * 0.08} -10 C ${largura * 0.02} ${altura * 0.4}, ${largura * 0.12} ${altura * 0.7}, ${largura * 0.05} ${altura + 10}`} />
      </g>
      <g fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" filter={`url(#${id('borrar')})`}>
        <path d={`M -10 ${altura * 0.2} C ${largura * 0.3} ${altura * 0.12}, ${largura * 0.6} ${altura * 0.3}, ${largura + 10} ${altura * 0.18}`} />
      </g>
    </g>
  );
}
