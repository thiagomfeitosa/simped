import { useState } from 'react';
import type { TomDePele } from '../../neonatal/exame';
import { AvisoValidar, SeletorTom, Subabas } from '../comum/Pecas';
import { ConsultaPuericultura, Hebiatria } from './ConsultaHebiatria';
import { Desenvolvimento } from './Desenvolvimento';
import { ExameFisicoAB } from './ExameFisicoAB';
import { Receitas } from './Receitas';
import { Vacinas } from './Vacinas';

type Parte = 'receitas' | 'exame' | 'vacinas' | 'desenvolvimento' | 'consulta' | 'hebiatria';

const PARTES: readonly { id: Parte; rotulo: string }[] = [
  { id: 'receitas', rotulo: '💊 Receitas de problemas comuns' },
  { id: 'exame', rotulo: '🔍 Exame físico' },
  { id: 'vacinas', rotulo: '💉 Vacinas' },
  { id: 'desenvolvimento', rotulo: '🧸 Desenvolvimento' },
  { id: 'consulta', rotulo: '📋 Consulta de puericultura' },
  { id: 'hebiatria', rotulo: '🧑 Hebiatria' },
];

/**
 * Aba Atenção básica (puericultura e hebiatria): receitas de problemas comuns com a conta conferida,
 * exame físico ilustrado (otoscopia, garganta, pele, hidratação, meníngeos), vacinas, marcos do
 * desenvolvimento, roteiro da consulta de puericultura e consulta do adolescente.
 */
export function AtencaoBasica() {
  const [parte, setParte] = useState<Parte>('receitas');
  const [tom, setTom] = useState<TomDePele>('claro');
  return (
    <div className="pagina-simples atencao-basica">
      <header className="cabecalho">
        <h1>🩺 Atenção básica</h1>
        <Subabas partes={PARTES} atual={parte} aoEscolher={setParte} rotulo="Parte da aba Atenção básica" />
        {(parte === 'exame' || parte === 'desenvolvimento') && <SeletorTom tom={tom} aoMudar={setTom} />}
      </header>
      <AvisoValidar>Doses, calendário vacinal, marcos e condutas: A VALIDAR (SBP, MS, AAP).</AvisoValidar>
      <div hidden={parte !== 'receitas'}>
        <Receitas />
      </div>
      <div hidden={parte !== 'exame'}>
        <ExameFisicoAB tom={tom} />
      </div>
      <div hidden={parte !== 'vacinas'}>
        <Vacinas />
      </div>
      <div hidden={parte !== 'desenvolvimento'}>
        <Desenvolvimento tom={tom} />
      </div>
      <div hidden={parte !== 'consulta'}>
        <ConsultaPuericultura />
      </div>
      <div hidden={parte !== 'hebiatria'}>
        <Hebiatria />
      </div>
    </div>
  );
}
