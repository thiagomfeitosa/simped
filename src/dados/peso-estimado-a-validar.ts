/**
 * Peso estimado pela idade, para a emergência sem balança.
 * ⚠️ A VALIDAR: fórmulas de conhecimento geral do assistente (APLS), não estão no rascunho.
 * Sempre pesar assim que possível: a estimativa erra bastante em crianças magras ou obesas.
 */
import type { StatusValidacao } from './medicacoes/tipos';

export interface FaixaPesoEstimado {
  /** Até esta idade (em meses, inclusive). */
  ateMeses: number;
  /** Texto da fórmula, para mostrar ao aluno. */
  formula: string;
  /** Usa a idade em meses (lactente) ou em anos. */
  usa: 'meses' | 'anos';
  multiplicador: number;
  soma: number;
}

/** APLS (atualização de 2011). */
export const PESO_ESTIMADO_APLS: readonly FaixaPesoEstimado[] = [
  { ateMeses: 12, formula: '(0,5 × idade em meses) + 4', usa: 'meses', multiplicador: 0.5, soma: 4 },
  { ateMeses: 71, formula: '(2 × idade em anos) + 8', usa: 'anos', multiplicador: 2, soma: 8 },
  { ateMeses: 155, formula: '(3 × idade em anos) + 7', usa: 'anos', multiplicador: 3, soma: 7 },
];

/** Fórmula antiga (1 a 10 anos): (idade + 4) × 2. */
export const PESO_ESTIMADO_ANTIGA = { deAnos: 1, ateAnos: 10, formula: '(idade em anos + 4) × 2' } as const;

export const STATUS_PESO_ESTIMADO: StatusValidacao = 'A_VALIDAR';
export const FONTE_PESO_ESTIMADO = 'APLS (não está no rascunho)';
