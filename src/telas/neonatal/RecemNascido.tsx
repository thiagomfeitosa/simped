import { useState } from 'react';
import type { TomDePele } from '../../neonatal/exame';
import { AvisoValidar, SeletorTom, Subabas } from '../comum/Pecas';
import { AtlasRN } from './AtlasRN';
import { EscoresRN } from './EscoresRN';
import { ExameAlojamento } from './ExameAlojamento';
import { IdadeGestacional } from './IdadeGestacional';
import { Maturidade, type ResultadoGuardado } from './Maturidade';

type Parte = 'ig' | 'maturidade' | 'exame' | 'atlas' | 'escores';

const PARTES: readonly { id: Parte; rotulo: string }[] = [
  { id: 'maturidade', rotulo: '🧮 Capurro e New Ballard' },
  { id: 'ig', rotulo: '📅 Idade gestacional' },
  { id: 'exame', rotulo: '🩺 Exame no alojamento conjunto' },
  { id: 'atlas', rotulo: '🖼️ Atlas do RN' },
  { id: 'escores', rotulo: '📊 Apgar e Silverman' },
];

/**
 * Aba Recém-nascido: idade gestacional (datas e exame: Capurro, New Ballard), exame físico no
 * alojamento conjunto com RN virtual, atlas ilustrado de achados e escores (Apgar, Silverman).
 * Todas as partes ficam montadas (trocar de parte não apaga o que foi marcado).
 */
export function RecemNascido() {
  const [parte, setParte] = useState<Parte>('maturidade');
  const [tom, setTom] = useState<TomDePele>('claro');
  const [exame, setExame] = useState<ResultadoGuardado | null>(null);
  return (
    <div className="pagina-simples recem-nascido">
      <header className="cabecalho">
        <h1>👶 Recém-nascido</h1>
        <Subabas partes={PARTES} atual={parte} aoEscolher={setParte} rotulo="Parte da aba Recém-nascido" />
        {(parte === 'maturidade' || parte === 'atlas') && <SeletorTom tom={tom} aoMudar={setTom} />}
      </header>
      <AvisoValidar>Escores, faixas e condutas: A VALIDAR (Capurro 1978, Ballard 1991, MS 2014, SBP).</AvisoValidar>
      <div hidden={parte !== 'maturidade'}>
        <Maturidade tom={tom} aoCalcular={setExame} />
      </div>
      <div hidden={parte !== 'ig'}>
        <IdadeGestacional exame={exame} />
      </div>
      <div hidden={parte !== 'exame'}>
        <ExameAlojamento />
      </div>
      <div hidden={parte !== 'atlas'}>
        <AtlasRN tom={tom} />
      </div>
      <div hidden={parte !== 'escores'}>
        <EscoresRN />
      </div>
    </div>
  );
}
