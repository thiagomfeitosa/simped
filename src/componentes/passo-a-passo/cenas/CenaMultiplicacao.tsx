import { useEffect, useState } from 'react';
import type { CenaMultiplicacao as TipoCenaMultiplicacao } from '../../../dados/roteiros/tipos';
import { fmt } from '../../../logica/formatacao';
import { prefereMenosMovimento, useNumeroAnimado } from '../useNumeroAnimado';

/** Tempo entre um bloco e outro; com muitos blocos (peso alto) fica mais rápido. */
const INTERVALO_MAXIMO_MS = 420;
const DURACAO_TOTAL_MS = 2400;

/**
 * "Dose × peso" desenhado: cada bloco é 1 kg do paciente com a sua parte da dose.
 * Os blocos acendem um a um e a soma vai crescendo até o total.
 */
export function CenaMultiplicacao({ cena }: { cena: TipoCenaMultiplicacao }) {
  const inteiros = Math.floor(cena.pesoKg);
  const fracao = Math.round((cena.pesoKg - inteiros) * 100) / 100;
  const blocos = Array.from({ length: inteiros + (fracao > 0 ? 1 : 0) }, (_, i) => (i < inteiros ? 1 : fracao));

  const intervalo = Math.min(INTERVALO_MAXIMO_MS, DURACAO_TOTAL_MS / blocos.length);
  const [acesos, setAcesos] = useState(prefereMenosMovimento() ? blocos.length : 0);
  useEffect(() => {
    if (acesos >= blocos.length) return;
    const t = window.setTimeout(() => setAcesos((n) => n + 1), acesos === 0 ? 700 : intervalo);
    return () => window.clearTimeout(t);
  }, [acesos, blocos.length, intervalo]);

  const somaParcial = blocos.slice(0, acesos).reduce((s, kg) => s + kg * cena.valorPorKg, 0);
  const soma = useNumeroAnimado(somaParcial, intervalo - 40, 0);
  const terminou = acesos >= blocos.length;
  const casas = cena.valorPorKg < 1 ? 3 : 1;

  return (
    <div className="cena-multiplicacao">
      <p className="mult-legenda">
        <strong>
          {fmt(cena.valorPorKg, 3)} {cena.unidade}
        </strong>{' '}
        para cada kg <span className="mult-x">×</span> <strong>{fmt(cena.pesoKg)} kg</strong>
      </p>

      <div className={`mult-blocos ${blocos.length > 6 ? 'muitos' : ''}`}>
        {blocos.map((kg, i) => (
          <div
            key={i}
            className={`mult-bloco ${i < acesos ? 'aceso' : ''} ${kg < 1 ? 'parcial' : ''}`}
            style={{ animationDelay: `${i * 90}ms`, ['--fracao' as string]: kg }}
          >
            <span className="mult-kg">{kg < 1 ? `${fmt(kg)} kg` : `${i + 1}º kg`}</span>
            <span className="mult-valor">
              {fmt(kg * cena.valorPorKg, 3)} {cena.unidade}
            </span>
          </div>
        ))}
      </div>

      <div className="mult-seta" aria-hidden="true">
        <svg viewBox="0 0 40 60" width="34" height="48">
          <path d="M20 4 V48" />
          <path d="M8 38 L20 52 L32 38" />
        </svg>
      </div>

      <div className={`mult-total ${terminou ? 'pronto' : ''}`}>
        <span className="mult-total-numero">
          {fmt(terminou ? cena.total : soma, casas)} {cena.unidade}
        </span>
        <span className="mult-total-rotulo">{terminou ? cena.rotuloTotal : 'somando…'}</span>
      </div>
    </div>
  );
}
