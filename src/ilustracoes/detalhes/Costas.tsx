/**
 * Dorso do RN de bruços (região lombossacra e nádegas), visto de trás.
 * Achados: mancha mongólica, fosseta sacral simples, tufo de pelos (disrafismo oculto).
 */

import { useId } from 'react';
import type { TomDePele } from '../../neonatal/exame';
import { FiltrosPele, Lencol } from '../FiltrosPele';
import { idSvg, misturar, PALETAS, pontosFixos } from '../pele';

export type AchadoCostas = 'normal' | 'mancha-mongolica' | 'fosseta-simples' | 'tufo-pelos';

export function CostasDetalhe({ achado, tom = 'claro' }: { achado: AchadoCostas; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const r = pontosFixos(5, 60);
  return (
    <svg viewBox="0 0 300 240" className="ilustracao detalhe-costas" role="img" aria-label={`Dorso e região sacral do RN: ${achado}`}>
      <FiltrosPele id={id} paleta={p} />
      <Lencol largura={300} altura={240} id={id} />
      <g filter={`url(#${id('textura')})`}>
        {/* costas e nádegas */}
        <path d="M 48 0 L 252 0 C 248 50, 236 96, 238 128 C 268 150, 274 214, 230 236 L 70 236 C 26 214, 32 150, 62 128 C 64 96, 52 50, 48 0 Z" fill={`url(#${id('volume-suave')})`} />
        {/* nádegas */}
        <ellipse cx="106" cy="190" rx="58" ry="50" fill={`url(#${id('volume')})`} />
        <ellipse cx="194" cy="190" rx="58" ry="50" fill={`url(#${id('volume')})`} />
        <ellipse cx="96" cy="176" rx="26" ry="20" fill={p.luz} opacity="0.4" filter={`url(#${id('borrar')})`} />
        <ellipse cx="184" cy="176" rx="26" ry="20" fill={p.luz} opacity="0.4" filter={`url(#${id('borrar')})`} />
      </g>
      {/* coluna e sulco interglúteo */}
      <path d="M 150 0 L 150 140" stroke={p.sombra} strokeWidth="4" opacity="0.35" filter={`url(#${id('borrar-leve')})`} />
      <path d="M 150 156 C 148 186, 150 214, 150 240" stroke={p.contorno} strokeWidth="3" opacity="0.75" />
      <path d="M 96 132 q 54 22 108 0" fill="none" stroke={p.sombra} strokeWidth="2" opacity="0.3" />
      {achado === 'mancha-mongolica' && (
        <g style={{ mixBlendMode: 'multiply' }} filter={`url(#${id('borrar-forte')})`}>
          <ellipse cx="146" cy="146" rx="60" ry="36" fill={misturar('#3f6aa8', p.base, 0.3)} opacity={tom === 'claro' ? 0.42 : 0.48} />
          <ellipse cx="192" cy="186" rx="34" ry="24" fill={misturar('#3f6aa8', p.base, 0.3)} opacity={tom === 'claro' ? 0.32 : 0.4} />
        </g>
      )}
      {achado === 'fosseta-simples' && (
        <g>
          <ellipse cx="150" cy="176" rx="3.6" ry="2.6" fill={p.contorno} opacity="0.8" />
          <ellipse cx="150" cy="175" rx="1.6" ry="1" fill={misturar(p.mucosa, p.base, 0.4)} />
        </g>
      )}
      {achado === 'tufo-pelos' && (
        <g>
          <ellipse cx="150" cy="104" rx="26" ry="16" fill="#d65a5a" opacity="0.35" filter={`url(#${id('borrar')})`} />
          <g stroke={tom === 'claro' ? '#3a2614' : '#120a06'} strokeWidth="1.2" strokeLinecap="round" fill="none">
            {Array.from({ length: 46 }, (_, i) => {
              const x = 136 + r[i]! * 28;
              const y = 92 + r[i + 1]! * 22;
              return <path key={i} d={`M ${x} ${y} q ${4 + r[i + 2]! * 6} ${-6 - r[i + 3]! * 8} ${10 + r[i + 4]! * 6} ${-10}`} />;
            })}
          </g>
        </g>
      )}
    </svg>
  );
}
