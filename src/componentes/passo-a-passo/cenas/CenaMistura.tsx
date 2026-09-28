import { useEffect, useState } from 'react';
import type { CenaMistura as TipoCenaMistura } from '../../../dados/roteiros/tipos';
import { fmt } from '../../../logica/formatacao';
import { useRitmo } from '../ritmo';
import { prefereMenosMovimento, useNumeroAnimado } from '../useNumeroAnimado';
import { CORES_LIQUIDO } from './CenaBancada';
import { CORES_TOM } from './CenaRegua';

// Geometria da bolsa (SVG)
const BASE = 300;
const ALTURA_MAX = 214;
const X = 150;
const LARGURA = 124;
const ALTURA_MINIMA_CAMADA = 6;
const ESPACO_ROTULOS = 30;

/**
 * Bolsa que recebe os componentes de uma mistura, um de cada vez (de baixo para cima).
 * No fim mostra a composição (ex.: Na⁺ e K⁺ em mEq/L).
 */
export function CenaMistura({ cena }: { cena: TipoCenaMistura }) {
  const fator = useRitmo();
  const { componentes, jaPresentes = 0, resumo = [] } = cena;
  const n = componentes.length;
  const [presentes, setPresentes] = useState(prefereMenosMovimento() ? n : Math.min(jaPresentes, n));
  useEffect(() => {
    if (presentes >= n) return;
    const t = window.setTimeout(() => setPresentes((p) => p + 1), (presentes === jaPresentes ? 800 : 1500) * fator);
    return () => window.clearTimeout(t);
  }, [presentes, n, jaPresentes, fator]);

  const totalFinal = componentes.reduce((s, c) => s + c.volumeMl, 0);
  const totalAgora = componentes.slice(0, presentes).reduce((s, c) => s + c.volumeMl, 0);
  const totalAnimado = useNumeroAnimado(totalAgora, 1100 * fator, componentes.slice(0, jaPresentes).reduce((s, c) => s + c.volumeMl, 0));

  // Altura de cada camada (proporcional ao volume; camadas pequenas ganham um mínimo para aparecer).
  const alturas = componentes.map((c) => Math.max(ALTURA_MINIMA_CAMADA, (c.volumeMl / totalFinal) * ALTURA_MAX));
  const escala = ALTURA_MAX / alturas.reduce((s, h) => s + h, 0);
  const camadas = componentes.map((c, i) => {
    const h = alturas[i] * escala;
    const abaixo = alturas.slice(0, i).reduce((s, a) => s + a * escala, 0);
    return { ...c, h, abaixo, presente: i < presentes };
  });
  const topoAgora = BASE - camadas.filter((c) => c.presente).reduce((s, c) => s + c.h, 0);

  // Rótulos à direita, afastados uns dos outros para não encavalar.
  const posRotulos: number[] = [];
  camadas.forEach((c, i) => {
    let y = BASE - c.abaixo - c.h / 2;
    if (i > 0) y = Math.min(y, posRotulos[i - 1] - ESPACO_ROTULOS);
    posRotulos.push(y);
  });
  const menor = Math.min(...posRotulos);
  if (menor < 40) {
    const ajuste = 40 - menor;
    posRotulos.forEach((_, i) => (posRotulos[i] += ajuste));
  }

  const terminou = presentes >= n;

  return (
    <div className="cena-mistura">
      <svg className="mistura-svg" viewBox="0 0 520 340" role="img" aria-label={`${cena.recipiente}: ${componentes.map((c) => c.rotulo).join(' + ')}`}>
        <defs>
          <clipPath id="clip-bolsa-mistura">
            <path d={`M${X} 70 H${X + LARGURA} V${BASE - 30} Q${X + LARGURA} ${BASE} ${X + LARGURA - 34} ${BASE} H${X + 34} Q${X} ${BASE} ${X} ${BASE - 30} Z`} />
          </clipPath>
        </defs>

        {/* gancho e bolsa */}
        <path className="mistura-gancho" d={`M${X + LARGURA / 2} 30 V52 M${X + LARGURA / 2 - 14} 52 H${X + LARGURA / 2 + 14}`} />
        <g clipPath="url(#clip-bolsa-mistura)">
          {camadas.map((c, i) => (
            <rect
              key={i}
              className="liquido"
              x={X - 2}
              y={BASE - ALTURA_MAX}
              width={LARGURA + 4}
              height={ALTURA_MAX}
              fill={CORES_LIQUIDO[c.cor]}
              style={{ transform: `translateY(${-c.abaixo}px) scaleY(${c.presente ? c.h / ALTURA_MAX : 0})` }}
            />
          ))}
        </g>
        <path className="mistura-bolsa" d={`M${X} 56 H${X + LARGURA} V${BASE - 30} Q${X + LARGURA} ${BASE + 2} ${X + LARGURA - 34} ${BASE + 2} H${X + 34} Q${X} ${BASE + 2} ${X} ${BASE - 30} Z`} />
        <rect className="vidro" x={X + LARGURA / 2 - 9} y={BASE + 2} width={18} height={26} rx={5} />

        {/* volume total no topo do líquido */}
        {totalAgora > 0 && (
          <g className="total-seringa" style={{ transform: `translateY(${topoAgora}px)` }}>
            <path d={`M${X - 8} 0 L${X - 18} -7 L${X - 18} 7 Z`} />
            <text x={X - 22} y={5} textAnchor="end">
              {fmt(totalAnimado, 1)} mL
            </text>
          </g>
        )}

        {/* rótulos das camadas */}
        {camadas.map((c, i) =>
          c.presente ? (
            <g key={`r${i}`} className="mistura-rotulo surgir">
              <path d={`M${X + LARGURA - 6} ${BASE - c.abaixo - c.h / 2} L${X + LARGURA + 26} ${posRotulos[i]} H${X + LARGURA + 36}`} />
              <circle cx={X + LARGURA - 6} cy={BASE - c.abaixo - c.h / 2} r={3} fill={CORES_LIQUIDO[c.cor]} />
              <text x={X + LARGURA + 42} y={posRotulos[i] + 5}>
                {c.rotulo}
              </text>
            </g>
          ) : null,
        )}

        <text className="rotulo-forte" x={X + LARGURA / 2} y={20} textAnchor="middle">
          {cena.recipiente}
        </text>
      </svg>

      {resumo.length > 0 && (
        <dl className={`mistura-resumo ${terminou ? 'visivel' : ''}`}>
          {resumo.map((r) => (
            <div key={r.rotulo} style={{ borderColor: r.tom ? CORES_TOM[r.tom] : undefined }}>
              <dt>{r.rotulo}</dt>
              <dd style={{ color: r.tom ? CORES_TOM[r.tom] : undefined }}>{r.valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
