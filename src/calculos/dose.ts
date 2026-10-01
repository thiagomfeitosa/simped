/**
 * Fórmulas 1 e 2 de docs/fase-0/formulas.md: dose por peso e volume a aspirar.
 *
 * Unidades: a dose e a concentração precisam estar na MESMA unidade de droga
 * (mg com mg/mL, UI com UI/mL, mEq com mEq/mL). Volumes sempre em mL.
 */

import { exigirPositivo } from './validacao';

export interface ResultadoDoseTotal {
  /** Dose a ser dada: a calculada ou, se passou do limite, a dose máxima. */
  dose: number;
  /** Dose por kg × peso, antes de aplicar o limite. */
  doseCalculada: number;
  /** Verdadeiro quando a dose calculada passou da máxima e foi limitada (o aluno deve ser avisado). */
  limitadaPelaMaxima: boolean;
}

/** Dose total = dose por kg × peso, limitada à dose máxima quando informada. */
export function doseTotal(entrada: {
  dosePorKg: number;
  pesoKg: number;
  doseMaxima?: number;
}): ResultadoDoseTotal {
  const { dosePorKg, pesoKg, doseMaxima } = entrada;
  exigirPositivo(dosePorKg, 'Dose por kg');
  exigirPositivo(pesoKg, 'Peso');
  if (doseMaxima !== undefined) exigirPositivo(doseMaxima, 'Dose máxima');

  const doseCalculada = dosePorKg * pesoKg;
  const limitadaPelaMaxima = doseMaxima !== undefined && doseCalculada > doseMaxima;
  return {
    dose: limitadaPelaMaxima ? doseMaxima : doseCalculada,
    doseCalculada,
    limitadaPelaMaxima,
  };
}

/** Volume a aspirar (mL) = dose ÷ concentração da apresentação (por mL). */
export function volumeAspirar(entrada: { dose: number; concentracao: number }): number {
  exigirPositivo(entrada.dose, 'Dose');
  exigirPositivo(entrada.concentracao, 'Concentração');
  return entrada.dose / entrada.concentracao;
}

/**
 * Concentração (por mL) = quantidade de droga ÷ volume (mL).
 * Serve para a reconstituição de um pó (ex.: frasco de pó + X mL de diluente)
 * e para qualquer solução cuja quantidade total e volume sejam conhecidos.
 */
export function concentracao(entrada: { quantidade: number; volumeMl: number }): number {
  exigirPositivo(entrada.quantidade, 'Quantidade de droga');
  exigirPositivo(entrada.volumeMl, 'Volume');
  return entrada.quantidade / entrada.volumeMl;
}
