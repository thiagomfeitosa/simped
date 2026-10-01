import { useEffect, useState } from 'react';
import type { CenaRegua as TipoCenaRegua, Regua, TomFaixa } from '../../../dados/roteiros/tipos';
import { fmt } from '../../../logica/formatacao';
import { useRitmo } from '../ritmo';
import { prefereMenosMovimento, useNumeroAnimado } from '../useNumeroAnimado';

export const CORES_TOM: Record<TomFaixa, string> = {
  normal: 'var(--tom-normal)',
  atencao: 'var(--tom-atencao)',
  perigo: 'var(--tom-perigo)',
  info: 'var(--tom-info)',
};

/** Uma ou mais réguas de exame; o ponteiro "anda" até o valor do paciente. */
export function CenaRegua({ cena }: { cena: TipoCenaRegua }) {
  return (
    <div className="cena-regua">
      {cena.reguas.map((r, i) => (
        <ReguaExame key={`${r.titulo}-${i}`} regua={r} ordem={i} />
      ))}
      {cena.legenda && <p className="regua-legenda">{cena.legenda}</p>}
    </div>
  );
}

function ReguaExame({ regua, ordem }: { regua: Regua; ordem: number }) {
  const fator = useRitmo();
  const { minimo, maximo, faixas, valor, valorInicial, marcos = [], casas = 1 } = regua;
  const partida = valorInicial ?? minimo;
  const [alvo, setAlvo] = useState(prefereMenosMovimento() ? valor : partida);
  const [visivel, setVisivel] = useState(valorInicial !== undefined || prefereMenosMovimento());

  useEffect(() => {
    const espera = (700 + ordem * 1100) * fator;
    const t1 = window.setTimeout(() => setVisivel(true), espera);
    const t2 = window.setTimeout(() => setAlvo(valor), espera + (valorInicial !== undefined ? 900 : 150) * fator);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [valor, valorInicial, ordem, fator]);

  const numero = useNumeroAnimado(alvo, 1500 * fator, partida);
  const pct = (v: number) => ((Math.min(maximo, Math.max(minimo, v)) - minimo) / (maximo - minimo)) * 100;
  const foraDaEscala = valor > maximo || valor < minimo;

  let inicioFaixa = minimo;
  const segmentos = faixas.map((f) => {
    const seg = { ...f, de: inicioFaixa };
    inicioFaixa = f.ate;
    return seg;
  });
  const faixaDoValor = segmentos.find((s) => valor >= s.de && valor < s.ate) ?? segmentos[segmentos.length - 1];
  const limites = [...new Set([minimo, ...faixas.map((f) => f.ate)])].filter((v) => v <= maximo);

  return (
    <div className="regua" style={{ animationDelay: `${ordem * 1100 * fator}ms` }}>
      <div className="regua-cabecalho">
        <strong>{regua.titulo}</strong>
        <span className={`regua-valor ${visivel ? 'visivel' : ''}`} style={{ color: faixaDoValor && CORES_TOM[faixaDoValor.tom] }}>
          {fmt(numero, casas)} {regua.unidade}
          {foraDaEscala && ' (fora da escala)'}
        </span>
      </div>

      <div className="regua-corpo">
        <div className="regua-trilho">
          {segmentos.map((s) => (
            <div
              key={`${s.de}-${s.ate}`}
              className="regua-faixa"
              style={{ left: `${pct(s.de)}%`, width: `${pct(s.ate) - pct(s.de)}%`, background: CORES_TOM[s.tom] }}
              title={s.rotulo}
            />
          ))}
        </div>

        {marcos.map((m) => (
          <div key={m.rotulo} className="regua-marco" style={{ left: `${pct(m.valor)}%` }}>
            <span>{m.rotulo}</span>
          </div>
        ))}

        <div className={`regua-ponteiro ${visivel ? 'visivel' : ''}`} style={{ left: `${pct(alvo)}%` }}>
          <span className="regua-ponteiro-seta" />
          {regua.rotuloValor && <span className="regua-ponteiro-rotulo">{regua.rotuloValor}</span>}
        </div>

        <div className="regua-numeros" aria-hidden="true">
          {limites.map((v) => (
            <span key={v} style={{ left: `${pct(v)}%` }}>
              {fmt(v, casas)}
            </span>
          ))}
        </div>
      </div>

      <ul className="regua-faixas-legenda">
        {segmentos.map((s) => (
          <li key={`${s.de}-${s.ate}`} className={s === faixaDoValor && visivel ? 'atual' : ''}>
            <span className="regua-chip" style={{ background: CORES_TOM[s.tom] }} />
            {s.rotulo}
          </li>
        ))}
      </ul>
    </div>
  );
}
