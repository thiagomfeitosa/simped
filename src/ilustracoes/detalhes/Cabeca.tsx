/**
 * Cabeça do RN: perfil (à esquerda) e corte das camadas do couro cabeludo (à direita).
 * O corte mostra ONDE fica o líquido — é o que diferencia bossa, cefalo-hematoma e hematoma subgaleal:
 * - bossa: edema no tecido subcutâneo, passa por cima da sutura;
 * - cefalo-hematoma: sangue embaixo do periósteo, para na sutura (o periósteo prende ali);
 * - subgaleal: sangue entre a gálea e o periósteo, espaço grande, cruza suturas.
 */

import { useId } from 'react';
import type { TomDePele } from '../../neonatal/exame';
import { FiltrosPele } from '../FiltrosPele';
import { idSvg, misturar, PALETAS } from '../pele';

export type AchadoCabeca = 'normal' | 'bossa' | 'cefalo-hematoma' | 'cavalgamento' | 'subgaleal' | 'fontanela-abaulada';

const PERFIL =
  'M 40 70 C 50 34, 110 24, 136 54 C 148 70, 150 96, 146 112 C 150 118, 158 124, 156 132 C 154 138, 148 138, 146 140 C 150 146, 148 152, 144 154 C 146 160, 142 168, 132 170 C 120 176, 110 186, 104 204 L 58 204 C 44 188, 30 168, 28 140 C 24 112, 30 88, 40 70 Z';
const PERFIL_MOLDADO =
  'M 30 64 C 30 30, 104 20, 136 54 C 148 70, 150 96, 146 112 C 150 118, 158 124, 156 132 C 154 138, 148 138, 146 140 C 150 146, 148 152, 144 154 C 146 160, 142 168, 132 170 C 120 176, 110 186, 104 204 L 58 204 C 44 188, 30 168, 26 140 C 20 112, 14 82, 30 64 Z';

const CAMADAS = [
  { nome: 'Pele', y: 40, h: 16, cor: '' },
  { nome: 'Subcutâneo', y: 56, h: 12, cor: '#f6e2b8' },
  { nome: 'Gálea', y: 68, h: 4, cor: '#e9e6ee' },
  { nome: 'Espaço subgaleal', y: 72, h: 6, cor: '#f8eef0' },
  { nome: 'Periósteo', y: 78, h: 3, cor: '#e7a6a6' },
  { nome: 'Osso', y: 81, h: 20, cor: '#efe0bf' },
  { nome: 'Dura-máter', y: 101, h: 4, cor: '#c7c2cf' },
  { nome: 'Cérebro', y: 105, h: 80, cor: '#efd3d6' },
];

const X0 = 190;
const X1 = 300;
const SUTURA = 245;

export function CabecaDetalhe({ achado, tom = 'claro' }: { achado: AchadoCabeca; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const sangue = '#7d1622';
  const edema = misturar(p.luz, '#fff3e0', 0.45);
  const dy = (nome: string) => CAMADAS.find((c) => c.nome === nome)!;

  // inchaço visto de fora (perfil)
  const inchaco: Record<AchadoCabeca, string | null> = {
    normal: null,
    bossa: 'M 26 92 C 18 50, 60 18, 116 26 C 96 30, 54 44, 44 74 C 40 82, 34 88, 26 92 Z',
    'cefalo-hematoma': 'M 50 50 C 54 24, 96 14, 106 32 C 94 34, 70 38, 50 50 Z',
    cavalgamento: null,
    subgaleal: 'M 140 56 C 110 6, 30 14, 18 80 C 10 120, 18 160, 40 184 C 28 150, 26 110, 36 82 C 46 52, 100 30, 140 56 Z',
    'fontanela-abaulada': 'M 92 28 C 98 14, 120 16, 124 34 C 114 30, 102 28, 92 28 Z',
  };

  return (
    <svg viewBox="0 0 400 230" className="ilustracao detalhe-cabeca" role="img" aria-label={`Cabeça do RN de perfil e corte do couro cabeludo: ${achado}`}>
      <FiltrosPele id={id} paleta={p} />
      <rect width="400" height="230" fill="#f6f1fc" />
      {/* PERFIL */}
      <g filter={`url(#${id('textura')})`}>
        <path d={achado === 'cavalgamento' ? PERFIL_MOLDADO : PERFIL} fill={`url(#${id('volume')})`} />
        {inchaco[achado] && (
          <path
            d={inchaco[achado]!}
            fill={achado === 'bossa' ? misturar(p.base, '#e9b0b8', 0.35) : misturar(p.base, '#5a3a7a', achado === 'subgaleal' ? 0.32 : 0.22)}
            stroke={p.sombra}
            strokeOpacity="0.4"
          />
        )}
      </g>
      <ellipse cx="80" cy="128" rx="11" ry="17" fill={p.base} stroke={p.contorno} strokeOpacity="0.5" />
      <path d="M 82 118 q -6 10 0 20" fill="none" stroke={p.sombra} strokeWidth="2" opacity="0.6" />
      <path d="M 118 108 Q 128 114 138 108" fill="none" stroke={p.contorno} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 144 146 q 4 2 2 6" fill="none" stroke={p.labio} strokeWidth="3" strokeLinecap="round" />
      {/* suturas (tracejado) */}
      <g fill="none" stroke="#4b2580" strokeWidth="1.6" strokeDasharray="4 3" opacity="0.75">
        <path d="M 106 30 C 104 56, 108 80, 114 100" />
        <path d="M 40 66 C 46 92, 50 118, 54 142" />
      </g>
      {achado === 'cavalgamento' && <path d="M 102 32 l 8 -2 M 104 50 l 8 -2" stroke="#4b2580" strokeWidth="2.5" />}
      {achado === 'subgaleal' && (
        <g fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.55">
          <path d="M 40 70 q 10 -6 20 0 t 20 0" />
          <path d="M 30 110 q 8 -6 16 0 t 16 0" />
        </g>
      )}
      <text x="12" y="222" fontSize="10" fill="#4b2580">- - - suturas</text>

      {/* CORTE DAS CAMADAS */}
      <rect x={X0} y={30} width={X1 - X0} height={160} rx={6} fill="#fff" stroke="#d8c7f2" />
      {CAMADAS.map((c) => (
        <rect key={c.nome} x={X0} y={c.y} width={X1 - X0} height={c.h} fill={c.nome === 'Pele' ? p.base : c.cor} />
      ))}
      {/* sutura no osso; o periósteo mergulha e se prende nela */}
      {achado !== 'fontanela-abaulada' && <rect x={SUTURA - 2} y={dy('Osso').y} width={4} height={dy('Osso').h} fill="#f8eef0" />}
      <path d={`M ${SUTURA - 2} ${dy('Periósteo').y + 3} l 2 8 l 2 -8`} fill="#e7a6a6" />
      {/* trabéculas do osso */}
      <g fill="#d9c08e" opacity="0.7">
        {Array.from({ length: 22 }, (_, i) => (
          <circle key={i} cx={X0 + 6 + ((i * 23) % 104)} cy={dy('Osso').y + 5 + ((i * 7) % 12)} r={1.4} />
        ))}
      </g>

      {achado === 'bossa' && (
        <path d={`M ${X0} ${dy('Subcutâneo').y + 2} C ${X0 + 30} ${dy('Subcutâneo').y - 16}, ${X1 - 30} ${dy('Subcutâneo').y - 16}, ${X1} ${dy('Subcutâneo').y + 2} L ${X1} ${dy('Gálea').y} L ${X0} ${dy('Gálea').y} Z`} fill={edema} stroke="#e3b0a0" />
      )}
      {achado === 'cefalo-hematoma' && (
        <path d={`M ${X0 + 8} ${dy('Osso').y} C ${X0 + 18} ${dy('Periósteo').y - 18}, ${SUTURA - 14} ${dy('Periósteo').y - 18}, ${SUTURA - 2} ${dy('Osso').y} Z`} fill={sangue} />
      )}
      {achado === 'subgaleal' && (
        <path d={`M ${X0} ${dy('Espaço subgaleal').y - 8} C ${X0 + 40} ${dy('Espaço subgaleal').y - 18}, ${X1 - 40} ${dy('Espaço subgaleal').y - 18}, ${X1} ${dy('Espaço subgaleal').y - 8} L ${X1} ${dy('Periósteo').y} L ${X0} ${dy('Periósteo').y} Z`} fill={sangue} />
      )}
      {achado === 'cavalgamento' && (
        <g>
          <rect x={SUTURA - 2} y={dy('Osso').y} width={4} height={dy('Osso').h} fill={dy('Osso').cor} />
          <path d={`M ${SUTURA - 14} ${dy('Osso').y - 4} L ${SUTURA + 8} ${dy('Osso').y - 4} L ${SUTURA + 8} ${dy('Osso').y + 12} L ${SUTURA - 14} ${dy('Osso').y + 12} Z`} fill="#e8d4a6" stroke="#b99a5c" />
        </g>
      )}
      {achado === 'fontanela-abaulada' && (
        <g>
          <rect x={SUTURA - 22} y={dy('Osso').y} width={44} height={dy('Osso').h} fill="#efd3d6" />
          <path d={`M ${SUTURA - 22} ${dy('Osso').y} C ${SUTURA - 14} ${dy('Pele').y - 4}, ${SUTURA + 14} ${dy('Pele').y - 4}, ${SUTURA + 22} ${dy('Osso').y}`} fill="#efd3d6" stroke="#c98a90" />
          <path d={`M ${SUTURA - 26} ${dy('Pele').y} C ${SUTURA - 14} ${dy('Pele').y - 14}, ${SUTURA + 14} ${dy('Pele').y - 14}, ${SUTURA + 26} ${dy('Pele').y}`} fill={p.base} />
        </g>
      )}
      {/* nomes das camadas */}
      <g fontSize="9" fill="#2e1450">
        {CAMADAS.map((c, i) => {
          const yRotulo = 40 + i * 19 + (i === CAMADAS.length - 1 ? 14 : 0);
          return (
            <g key={c.nome}>
              <path d={`M ${X1 - 6} ${c.y + c.h / 2} L ${X1 + 8} ${yRotulo - 3} L ${X1 + 12} ${yRotulo - 3}`} fill="none" stroke="#9b74d4" strokeWidth="0.8" />
              <text x={X1 + 14} y={yRotulo}>
                {c.nome}
              </text>
            </g>
          );
        })}
        <text x={SUTURA - 18} y={dy('Cérebro').y + 40} fill="#4b2580">
          sutura
        </text>
        <path d={`M ${SUTURA} ${dy('Cérebro').y + 30} L ${SUTURA} ${dy('Dura-máter').y + 2}`} stroke="#4b2580" strokeWidth="1" />
      </g>
    </svg>
  );
}
