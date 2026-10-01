import { Fragment, useEffect, useState } from 'react';
import type { CenaMultiplicacao as TipoCenaMultiplicacao } from '../../../dados/roteiros/tipos';
import { arredondar } from '../../../calculos';
import { fmt } from '../../../logica/formatacao';
import { useRitmo } from '../ritmo';
import { prefereMenosMovimento, useNumeroAnimado } from '../useNumeroAnimado';

/** Tempo entre um bloco e outro; com muitos blocos (peso alto) fica mais rápido. */
const INTERVALO_MAXIMO_MS = 700;
const DURACAO_TOTAL_MS = 4200;
const ESPERA_INICIAL_MS = 1000;

interface Bloco {
  kg: number;
  valorPorKg: number;
  faixa: number;
  /** Número do kg (1º, 2º…) — só para blocos inteiros. */
  ordem: number;
}

/** Um bloco por kg; com `faixas`, cada faixa de peso tem o seu valor (ex.: Holliday-Segar). */
export function montarBlocos(cena: TipoCenaMultiplicacao): Bloco[] {
  const faixas = cena.faixas ?? [{ kg: cena.pesoKg, valorPorKg: cena.valorPorKg }];
  const blocos: Bloco[] = [];
  let ordem = 0;
  faixas.forEach((f, faixa) => {
    const inteiros = Math.floor(f.kg + 1e-9);
    const fracao = arredondar(f.kg - inteiros, 2);
    for (let i = 0; i < inteiros; i++) blocos.push({ kg: 1, valorPorKg: f.valorPorKg, faixa, ordem: ++ordem });
    if (fracao > 0) blocos.push({ kg: fracao, valorPorKg: f.valorPorKg, faixa, ordem });
  });
  return blocos;
}

/**
 * "Dose × peso" desenhado: cada bloco é 1 kg do paciente com a sua parte da dose.
 * Os blocos acendem um a um e a soma vai crescendo até o total.
 */
export function CenaMultiplicacao({ cena }: { cena: TipoCenaMultiplicacao }) {
  const fator = useRitmo();
  const blocos = montarBlocos(cena);

  const intervalo = Math.min(INTERVALO_MAXIMO_MS, DURACAO_TOTAL_MS / blocos.length) * fator;
  const [acesos, setAcesos] = useState(prefereMenosMovimento() ? blocos.length : 0);
  useEffect(() => {
    if (acesos >= blocos.length) return;
    const t = window.setTimeout(() => setAcesos((n) => n + 1), acesos === 0 ? ESPERA_INICIAL_MS * fator : intervalo);
    return () => window.clearTimeout(t);
  }, [acesos, blocos.length, intervalo, fator]);

  const somaParcial = blocos.slice(0, acesos).reduce((s, b) => s + b.kg * b.valorPorKg, 0);
  const soma = useNumeroAnimado(somaParcial, Math.max(120, intervalo - 40), 0);
  const terminou = acesos >= blocos.length;
  const menorValor = Math.min(...blocos.map((b) => b.valorPorKg));
  const casas = menorValor < 1 ? 3 : 1;

  return (
    <div className="cena-multiplicacao">
      <p className="mult-legenda">
        {cena.faixas ? (
          cena.faixas.map((f, i) => (
            <Fragment key={i}>
              {i > 0 && <span className="mult-mais"> + </span>}
              <span className={`mult-faixa faixa-${i}`}>
                <strong>
                  {fmt(f.valorPorKg, 3)} {cena.unidade}
                </strong>{' '}
                <span className="mult-x">×</span> <strong>{fmt(f.kg)} kg</strong>
              </span>
            </Fragment>
          ))
        ) : (
          <>
            <strong>
              {fmt(cena.valorPorKg, 3)} {cena.unidade}
            </strong>{' '}
            para cada kg <span className="mult-x">×</span> <strong>{fmt(cena.pesoKg)} kg</strong>
          </>
        )}
      </p>

      <div className={`mult-blocos ${blocos.length > 6 ? 'muitos' : ''} ${blocos.length > 12 ? 'muitissimos' : ''}`}>
        {blocos.map((b, i) => (
          <div
            key={i}
            className={`mult-bloco faixa-${b.faixa} ${i < acesos ? 'aceso' : ''} ${b.kg < 1 ? 'parcial' : ''}`}
            style={{ animationDelay: `${i * 90 * fator}ms`, ['--fracao' as string]: b.kg }}
          >
            <span className="mult-kg">{b.kg < 1 ? `${fmt(b.kg)} kg` : `${b.ordem}º kg`}</span>
            <span className="mult-valor">
              {fmt(b.kg * b.valorPorKg, 3)} {cena.unidade}
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
