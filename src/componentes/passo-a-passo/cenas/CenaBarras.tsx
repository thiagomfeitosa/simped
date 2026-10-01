import { useEffect, useState } from 'react';
import type { CenaBarras as TipoCenaBarras } from '../../../dados/roteiros/tipos';
import { fmt } from '../../../logica/formatacao';
import { useRitmo } from '../ritmo';
import { prefereMenosMovimento } from '../useNumeroAnimado';
import { CORES_TOM } from './CenaRegua';

/** Barras horizontais que crescem uma a uma, com uma linha de limite opcional. */
export function CenaBarras({ cena }: { cena: TipoCenaBarras }) {
  const fator = useRitmo();
  const { barras, limite, casas = 2 } = cena;
  const [acesas, setAcesas] = useState(prefereMenosMovimento() ? barras.length : 0);
  useEffect(() => {
    if (acesas >= barras.length) return;
    const t = window.setTimeout(() => setAcesas((n) => n + 1), (acesas === 0 ? 700 : 1300) * fator);
    return () => window.clearTimeout(t);
  }, [acesas, barras.length, fator]);

  const maximo = Math.max(...barras.map((b) => b.valor), limite?.valor ?? 0) * 1.08;
  const pct = (v: number) => (v / maximo) * 100;

  return (
    <div className="cena-barras">
      <p className="barras-titulo">
        {cena.titulo} <span>({cena.unidade})</span>
      </p>
      <div className="barras-area">
        {barras.map((b, i) => (
          <div key={b.rotulo} className={`barra-linha ${i < acesas ? 'acesa' : ''}`}>
            <span className="barra-rotulo">
              {b.rotulo}
              {b.detalhe && <small>{b.detalhe}</small>}
            </span>
            <span className="barra-trilho">
              <span className="barra-cheia" style={{ width: i < acesas ? `${pct(b.valor)}%` : '0%', background: CORES_TOM[b.tom] }} />
              <span className="barra-numero" style={{ left: i < acesas ? `${pct(b.valor)}%` : '0%' }}>
                {fmt(b.valor, casas)}
              </span>
            </span>
          </div>
        ))}
        {limite && (
          <div className="barras-limite" style={{ left: `calc(var(--largura-rotulo) + (100% - var(--largura-rotulo) - var(--folga-direita)) * ${pct(limite.valor) / 100})` }}>
            <span>{limite.rotulo}</span>
          </div>
        )}
      </div>
    </div>
  );
}
