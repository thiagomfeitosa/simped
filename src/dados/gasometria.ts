/**
 * Valores de referência e pontos de corte usados na leitura guiada da gasometria.
 * ⚠️ TUDO "A VALIDAR": valores habituais de livro-texto, escritos pelo assistente.
 * As fórmulas de compensação (Winter etc.) foram feitas para gasometria ARTERIAL.
 */

import type { StatusValidacao } from './medicacoes/tipos';

export interface ReferenciaGasometria {
  ph: { min: number; max: number };
  pco2: { min: number; max: number };
  hco3: { min: number; max: number };
}

export const REFERENCIA_GASOMETRIA: Record<'arterial' | 'venosa', ReferenciaGasometria> = {
  arterial: { ph: { min: 7.35, max: 7.45 }, pco2: { min: 35, max: 45 }, hco3: { min: 22, max: 26 } },
  venosa: { ph: { min: 7.32, max: 7.42 }, pco2: { min: 41, max: 51 }, hco3: { min: 22, max: 26 } },
};

export const PARAMETROS_GASOMETRIA = {
  /** Valores "normais" usados nas fórmulas de compensação. */
  pco2Normal: 40,
  hco3Normal: 24,
  /** Margem das fórmulas de compensação (± mmHg ou ± mEq/L). */
  margemCompensacao: 2,
  /** Ânion gap normal e margem. */
  anionGapNormal: 12,
  anionGapMargem: 2,
  /** Delta/delta: abaixo de 1 = acidose de AG normal associada; acima de 2 = alcalose metabólica associada. */
  deltaRelacaoMin: 1,
  deltaRelacaoMax: 2,
  lactatoMax: 2,
  status: 'A_VALIDAR' as StatusValidacao,
};
