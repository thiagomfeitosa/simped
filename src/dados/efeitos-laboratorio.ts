/**
 * Fase 2 — efeito de algumas medicações nos EXAMES (gasometria e eletrólitos), em qualquer caso.
 * Vale quando a resposta do caso para essa medicação não diz nada sobre exames
 * (o arquivo do caso sempre manda; ver src/casos/clinicos/).
 *
 * ⚠️ TUDO "A VALIDAR": tamanhos e tempos escritos pelo assistente, só para o exame reagir
 * de forma didática. Não são doses. 'soma' = variação somada ao valor do momento.
 */

import type { MudancaDeSinal, NomeVariavel } from '../casos/tipos';
import type { StatusValidacao } from './medicacoes/tipos';

export interface EfeitoLaboratorio {
  descricao: string;
  mudancas: MudancaDeSinal[];
  status: StatusValidacao;
}

function soma(sinal: NomeVariavel, delta: number, atrasoMin: number, duracaoMin: number): MudancaDeSinal {
  return { sinal, alvo: delta, atrasoMin, duracaoMin, modo: 'soma' };
}

const AV: StatusValidacao = 'A_VALIDAR';

export const EFEITOS_LABORATORIO: Readonly<Record<string, EfeitoLaboratorio>> = {
  'bicarbonato-sodio': {
    descricao: 'HCO₃⁻ sobe em minutos; o potássio cai um pouco (entra na célula) e o sódio sobe.',
    mudancas: [soma('hco3', 5, 0, 15), soma('k', -0.3, 0, 30), soma('na', 2, 0, 15)],
    status: AV,
  },
  'insulina-regular': {
    descricao: 'O potássio cai (a insulina leva o K para dentro das células).',
    mudancas: [soma('k', -0.6, 15, 60)],
    status: AV,
  },
  salbutamol: {
    descricao: 'O potássio cai um pouco (beta-2 leva o K para dentro das células).',
    mudancas: [soma('k', -0.5, 15, 30)],
    status: AV,
  },
  kcl: {
    descricao: 'O potássio sobe.',
    mudancas: [soma('k', 0.4, 0, 60)],
    status: AV,
  },
};
