/**
 * B9 — Efeito adverso quando a dose passa da faixa (sobredose), por medicação.
 * Vale quando o arquivo do caso não diz outra coisa (RespostaAMedicacao.sobredose).
 *
 * ⚠️ TUDO A VALIDAR: efeitos escritos pelo assistente, só para o paciente reagir de forma didática.
 * As mudanças são VARIAÇÕES ('soma'): "+40 na FC" vale para qualquer idade.
 */

import type { MudancaDeEstado, MudancaDeSinal, NomeSinal } from '../casos/tipos';
import type { StatusValidacao } from './medicacoes/tipos';

export interface EfeitoSobredose {
  descricao: string;
  mudancas: MudancaDeSinal[];
  mudancasDeEstado?: MudancaDeEstado[];
  status: StatusValidacao;
}

/** Variação de um sinal: começa depois de `atrasoMin` e leva `duracaoMin`. */
function soma(sinal: NomeSinal, delta: number, atrasoMin: number, duracaoMin: number): MudancaDeSinal {
  return { sinal, alvo: delta, atrasoMin, duracaoMin, modo: 'soma' };
}

const AV: StatusValidacao = 'A_VALIDAR';

const BETA2: EfeitoSobredose = {
  descricao: 'Taquicardia e tremores (beta-2 em excesso).',
  mudancas: [soma('fc', 40, 2, 8), soma('paSistolica', 10, 2, 8)],
  status: AV,
};

const CORTICOIDE: EfeitoSobredose = {
  descricao: 'Hiperglicemia e aumento da PA.',
  mudancas: [soma('glicemiaMgDl', 60, 30, 120), soma('paSistolica', 10, 30, 120)],
  status: AV,
};

const GLICOSE: EfeitoSobredose = {
  descricao: 'Hiperglicemia.',
  mudancas: [soma('glicemiaMgDl', 150, 0, 15)],
  status: AV,
};

const VOLUME: EfeitoSobredose = {
  descricao: 'Sobrecarga de volume: taquipneia e queda da saturação.',
  mudancas: [soma('fr', 10, 20, 60), soma('spo2', -4, 20, 60)],
  status: AV,
};

export const EFEITOS_SOBREDOSE: Readonly<Record<string, EfeitoSobredose>> = {
  adrenalina: {
    descricao: 'Taquicardia importante e hipertensão.',
    mudancas: [soma('fc', 50, 0, 2), soma('paSistolica', 30, 0, 2), soma('paDiastolica', 15, 0, 2)],
    status: AV,
  },
  salbutamol: BETA2,
  fenoterol: BETA2,
  salmeterol: BETA2,
  ipratropio: { descricao: 'Taquicardia leve.', mudancas: [soma('fc', 15, 5, 15)], status: AV },
  adenosina: {
    descricao: 'Assistolia transitória mais longa, depois volta.',
    mudancas: [{ sinal: 'fc', alvo: 30, atrasoMin: 0, duracaoMin: 0 }],
    mudancasDeEstado: [
      { campo: 'ritmo', valor: 'assistolia', atrasoMin: 0 },
      { campo: 'ritmo', valor: 'sinusal', atrasoMin: 1 },
    ],
    status: AV,
  },
  amiodarona: {
    descricao: 'Bradicardia e hipotensão.',
    mudancas: [soma('fc', -40, 2, 5), soma('paSistolica', -20, 2, 5), soma('paDiastolica', -10, 2, 5)],
    status: AV,
  },
  kcl: {
    descricao: 'Hipercalemia: arritmia ventricular.',
    mudancas: [],
    mudancasDeEstado: [{ campo: 'ritmo', valor: 'tv', atrasoMin: 3 }],
    status: AV,
  },
  'gluconato-calcio': { descricao: 'Bradicardia.', mudancas: [soma('fc', -30, 0, 3)], status: AV },
  'insulina-regular': { descricao: 'Hipoglicemia.', mudancas: [soma('glicemiaMgDl', -150, 15, 60)], status: AV },
  glucagon: { descricao: 'Hiperglicemia e vômitos.', mudancas: [soma('glicemiaMgDl', 80, 10, 30)], status: AV },
  flumazenil: {
    descricao: 'Agitação e risco de convulsão.',
    mudancas: [soma('fc', 20, 1, 5), soma('glasgow', -4, 3, 2)],
    status: AV,
  },
  dipirona: { descricao: 'Hipotensão.', mudancas: [soma('paSistolica', -15, 10, 20), soma('paDiastolica', -8, 10, 20)], status: AV },
  vancomicina: {
    descricao: 'Síndrome do homem vermelho: hipotensão e taquicardia.',
    mudancas: [soma('paSistolica', -15, 5, 10), soma('fc', 15, 5, 10)],
    status: AV,
  },
  hidrocortisona: CORTICOIDE,
  metilprednisolona: CORTICOIDE,
  dexametasona: CORTICOIDE,
  prednisolona: CORTICOIDE,
  prednisona: CORTICOIDE,
  sg5: GLICOSE,
  sg10: GLICOSE,
  g25: GLICOSE,
  g50: GLICOSE,
  sf09: VOLUME,
  soro: VOLUME,
};
