/**
 * Contas de eletrólitos (mEq) usadas nos casos (docs/fase-0/casos-clinicos.md, casos 10 e 15)
 * e nos roteiros do Passo a passo (hiponatremia, hipocalemia, desidratação).
 * As fórmulas são as do rascunho: A VALIDAR com a fonte (fator 1,6 e 0,6 × peso).
 */

import { ErroDeCalculo, exigirPositivo } from './validacao';

/**
 * Quantos mg de cada sal correspondem a 1 mEq (massa molar; sais monovalentes).
 * São dados de QUÍMICA, não doses: NaCl = 23 + 35,5; KCl = 39 + 35,5.
 */
export const MG_POR_MEQ = {
  NaCl: 58.5,
  KCl: 74.5,
} as const;

/** Água corporal total aproximada usada nas fórmulas de sódio (fração do peso). A VALIDAR. */
export const FRACAO_AGUA_CORPORAL_PADRAO = 0.6;

/**
 * mEq por mL de uma solução de sal a X%.
 * X% = X g em 100 mL = X × 10 mg em 1 mL → divide pelos mg de 1 mEq.
 * Ex.: NaCl 3% → 30 ÷ 58,5 ≈ 0,513 mEq/mL; KCl 19,1% → 191 ÷ 74,5 ≈ 2,56 mEq/mL.
 */
export function meqPorMl(percentual: number, mgPorMeq: number): number {
  exigirPositivo(percentual, 'Concentração (%)');
  exigirPositivo(mgPorMeq, 'mg por mEq');
  return (percentual * 10) / mgPorMeq;
}

/** Concentração em mEq/L: mEq ÷ volume (mL) × 1000. */
export function meqPorLitro(meq: number, volumeMl: number): number {
  exigirPositivo(meq, 'mEq');
  exigirPositivo(volumeMl, 'Volume');
  return (meq * 1000) / volumeMl;
}

/**
 * Menor volume (mL) em que uma quantidade de eletrólito pode ser diluída
 * sem passar da concentração máxima (mEq/L): mEq ÷ máximo × 1000.
 */
export function volumeMinimoDiluicao(meq: number, concentracaoMaximaMeqL: number): number {
  exigirPositivo(meq, 'mEq');
  exigirPositivo(concentracaoMaximaMeqL, 'Concentração máxima');
  return (meq * 1000) / concentracaoMaximaMeqL;
}

/** Velocidade de infusão em mEq/kg/h: mEq ÷ horas ÷ peso. */
export function meqPorKgPorHora(meq: number, tempoHoras: number, pesoKg: number): number {
  exigirPositivo(meq, 'mEq');
  exigirPositivo(tempoHoras, 'Tempo');
  exigirPositivo(pesoKg, 'Peso');
  return meq / tempoHoras / pesoKg;
}

/** Sódio corrigido pela glicemia = Na + 1,6 × (glicemia − 100) ÷ 100. */
export function sodioCorrigido(sodio: number, glicemiaMgDl: number): number {
  exigirPositivo(sodio, 'Sódio');
  exigirPositivo(glicemiaMgDl, 'Glicemia');
  return sodio + (1.6 * (glicemiaMgDl - 100)) / 100;
}

/**
 * mEq de sódio para ir do Na atual ao desejado = (desejado − atual) × fração de água (0,6) × peso.
 * O Na desejado precisa ser maior que o atual (para baixar o sódio a conta é outra).
 */
export function deficitDeSodio(entrada: {
  sodioAtual: number;
  sodioDesejado: number;
  pesoKg: number;
  fracaoAgua?: number;
}): number {
  const { sodioAtual, sodioDesejado, pesoKg, fracaoAgua = FRACAO_AGUA_CORPORAL_PADRAO } = entrada;
  exigirPositivo(sodioAtual, 'Na atual');
  exigirPositivo(sodioDesejado, 'Na desejado');
  exigirPositivo(pesoKg, 'Peso');
  exigirPositivo(fracaoAgua, 'Fração de água corporal');
  if (sodioDesejado <= sodioAtual) throw new ErroDeCalculo('O Na desejado deve ser maior que o Na atual.');
  return (sodioDesejado - sodioAtual) * fracaoAgua * pesoKg;
}

/**
 * Quanto o Na sérico deve subir (mEq/L) com uma quantidade de sódio infundida.
 * É a mesma fórmula do déficit, "de trás para frente": mEq ÷ (fração de água × peso).
 * Estimativa grosseira — o que manda é o sódio dosado.
 */
export function subidaEstimadaSodio(meqInfundidos: number, pesoKg: number, fracaoAgua = FRACAO_AGUA_CORPORAL_PADRAO): number {
  exigirPositivo(meqInfundidos, 'mEq infundidos');
  exigirPositivo(pesoKg, 'Peso');
  exigirPositivo(fracaoAgua, 'Fração de água corporal');
  return meqInfundidos / (fracaoAgua * pesoKg);
}
