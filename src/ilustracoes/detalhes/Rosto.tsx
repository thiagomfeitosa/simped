/**
 * Rosto do RN de perto (de frente). Achados: milium, nevo simples ("bicada da cegonha"),
 * hemorragia subconjuntival (olhos abertos), fissura labial.
 */

import { useId } from 'react';
import type { TomDePele } from '../../neonatal/exame';
import { FiltrosPele } from '../FiltrosPele';
import { idSvg, misturar, PALETAS, pontosFixos } from '../pele';

export type AchadoRosto = 'normal' | 'milium' | 'nevo-simples' | 'hemorragia-subconjuntival' | 'fenda-labial';

function OlhoAberto({ cx, cy, lado, hemorragia, paleta }: { cx: number; cy: number; lado: 1 | -1; hemorragia: boolean; paleta: (typeof PALETAS)['claro'] }) {
  const olho = `M ${cx - 26} ${cy} C ${cx - 14} ${cy - 15}, ${cx + 14} ${cy - 15}, ${cx + 26} ${cy} C ${cx + 14} ${cy + 11}, ${cx - 14} ${cy + 11}, ${cx - 26} ${cy} Z`;
  return (
    <g>
      <path d={olho} fill="#f7f4f0" stroke={paleta.contorno} strokeWidth="1.5" />
      {hemorragia && (
        <path d={`M ${cx + 6 * lado} ${cy - 9} C ${cx + 22 * lado} ${cy - 8}, ${cx + 25 * lado} ${cy + 2}, ${cx + 8 * lado} ${cy + 8} C ${cx + 14 * lado} ${cy}, ${cx + 14 * lado} ${cy - 4}, ${cx + 6 * lado} ${cy - 9} Z`} fill="#c8102e" opacity="0.85" />
      )}
      <circle cx={cx} cy={cy - 1} r={11} fill="#3a2a3e" />
      <circle cx={cx} cy={cy - 1} r={11} fill="none" stroke="#1a1020" strokeWidth="1.5" />
      <circle cx={cx} cy={cy - 1} r={5} fill="#0b0608" />
      <circle cx={cx - 3.5} cy={cy - 4.5} r={2.6} fill="#fff" opacity="0.9" />
      <path d={`M ${cx - 26} ${cy} C ${cx - 14} ${cy - 15}, ${cx + 14} ${cy - 15}, ${cx + 26} ${cy}`} fill="none" stroke={paleta.contorno} strokeWidth="2.5" />
      {[-18, -10, -2, 6, 14].map((d) => (
        <path key={d} d={`M ${cx + d} ${cy - 10 + Math.abs(d) * 0.12} l ${-1 + d * 0.05} -5`} stroke={paleta.contorno} strokeWidth="1.1" />
      ))}
    </g>
  );
}

export function RostoDetalhe({ achado, tom = 'claro' }: { achado: AchadoRosto; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const aberto = achado === 'hemorragia-subconjuntival';
  const pts = pontosFixos(17, 120);
  return (
    <svg viewBox="0 0 300 260" className="ilustracao detalhe-rosto" role="img" aria-label={`Rosto do RN de perto: ${achado}`}>
      <FiltrosPele id={id} paleta={p} />
      <rect width="300" height="260" fill="#efe6fa" />
      <g filter={`url(#${id('textura')})`}>
        <ellipse cx="150" cy="168" rx="142" ry="166" fill={`url(#${id('volume')})`} />
        <ellipse cx="150" cy="60" rx="90" ry="40" fill={p.luz} opacity="0.35" filter={`url(#${id('borrar-forte')})`} />
      </g>
      <circle cx="78" cy="168" r="30" fill={`url(#${id('rubor')})`} />
      <circle cx="222" cy="168" r="30" fill={`url(#${id('rubor')})`} />
      {/* sobrancelhas */}
      <path d="M 70 88 Q 100 76 128 86" fill="none" stroke={p.sombra} strokeWidth="4" opacity="0.35" strokeLinecap="round" />
      <path d="M 172 86 Q 200 76 230 88" fill="none" stroke={p.sombra} strokeWidth="4" opacity="0.35" strokeLinecap="round" />
      {/* nevo simples: pálpebras e glabela */}
      {achado === 'nevo-simples' && (
        <g fill="#e2667a" opacity={tom === 'negro' ? 0.3 : 0.45} filter={`url(#${id('borrar')})`}>
          <ellipse cx="150" cy="84" rx="16" ry="22" />
          <ellipse cx="100" cy="104" rx="26" ry="10" />
          <ellipse cx="200" cy="104" rx="26" ry="10" />
        </g>
      )}
      {/* olhos */}
      {aberto ? (
        <>
          <OlhoAberto cx={100} cy={118} lado={-1} hemorragia paleta={p} />
          <OlhoAberto cx={200} cy={118} lado={1} hemorragia={false} paleta={p} />
        </>
      ) : (
        <g fill="none" strokeLinecap="round">
          <ellipse cx="100" cy="108" rx="28" ry="12" fill={p.luz} opacity="0.5" stroke="none" />
          <ellipse cx="200" cy="108" rx="28" ry="12" fill={p.luz} opacity="0.5" stroke="none" />
          <path d="M 74 118 Q 100 132 126 118" stroke={p.contorno} strokeWidth="3" />
          <path d="M 174 118 Q 200 132 226 118" stroke={p.contorno} strokeWidth="3" />
          {[80, 90, 100, 110, 120].map((x) => (
            <path key={x} d={`M ${x} ${124 + (x === 100 ? 2 : 0)} l -1.5 6`} stroke={p.contorno} strokeWidth="1.3" />
          ))}
          {[180, 190, 200, 210, 220].map((x) => (
            <path key={x} d={`M ${x} ${124 + (x === 200 ? 2 : 0)} l 1.5 6`} stroke={p.contorno} strokeWidth="1.3" />
          ))}
        </g>
      )}
      {/* nariz */}
      <ellipse cx="150" cy="160" rx="20" ry="16" fill={p.luz} opacity="0.65" filter={`url(#${id('borrar-leve')})`} />
      <path d="M 128 172 Q 150 188 172 172" fill="none" stroke={p.sombra} strokeWidth="2.5" opacity="0.7" />
      {achado === 'fenda-labial' ? (
        <>
          {/* narina do lado da fissura alargada e achatada */}
          <ellipse cx="136" cy="175" rx="9" ry="4" fill={p.contorno} opacity="0.85" transform="rotate(-18 136 175)" />
          <ellipse cx="160" cy="174" rx="5" ry="3.4" fill={p.contorno} opacity="0.85" />
          {/* lábio superior com fenda à direita do bebê (esquerda de quem olha), indo até a narina */}
          <path d="M 112 208 Q 120 200 128 201 Q 131 194 132 184 Q 136 182 140 184 Q 142 196 146 203 Q 160 198 172 202 Q 182 200 190 208 Q 170 220 150 219 Q 128 220 112 208 Z" fill={p.labio} />
          <path d="M 128 201 Q 131 194 132 184 Q 136 181 140 184 Q 142 196 146 203 Q 138 208 128 201 Z" fill={misturar(p.mucosa, '#5a1020', 0.45)} />
          <path d="M 116 210 Q 150 223 186 210" fill="none" stroke={p.contorno} strokeWidth="1.5" opacity="0.6" />
        </>
      ) : (
        <>
          <ellipse cx="141" cy="174" rx="5" ry="3.4" fill={p.contorno} opacity="0.85" />
          <ellipse cx="159" cy="174" rx="5" ry="3.4" fill={p.contorno} opacity="0.85" />
          <path d="M 150 182 L 150 198" stroke={p.sombra} strokeWidth="5" opacity="0.18" strokeLinecap="round" />
          <path d="M 116 208 Q 132 198 150 203 Q 168 198 184 208 Q 168 220 150 220 Q 132 220 116 208 Z" fill={p.labio} />
          <path d="M 118 209 Q 150 214 182 209" fill="none" stroke={p.contorno} strokeWidth="1.5" opacity="0.6" />
          <ellipse cx="142" cy="205" rx="8" ry="2.5" fill="#fff" opacity="0.25" />
        </>
      )}
      {/* milium: pontinhos brancos no nariz, queixo e testa */}
      {achado === 'milium' &&
        Array.from({ length: 34 }, (_, i) => {
          const zona = i % 3;
          const x = zona === 0 ? 132 + pts[i]! * 36 : zona === 1 ? 128 + pts[i]! * 44 : 110 + pts[i]! * 80;
          const y = zona === 0 ? 150 + pts[i + 40]! * 26 : zona === 1 ? 226 + pts[i + 40]! * 16 : 50 + pts[i + 40]! * 22;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={1.6 + pts[i + 80]! * 1.2} fill="#fffbe9" stroke="#efe2b8" strokeWidth="0.5" />
              <circle cx={x - 0.5} cy={y - 0.5} r={0.6} fill="#fff" />
            </g>
          );
        })}
    </svg>
  );
}
