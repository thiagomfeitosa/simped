/**
 * Fórmula 6 de docs/fase-0/formulas.md: soro de manutenção pela regra de Holliday-Segar.
 *
 * Aqui está só a conta. QUANDO a regra se aplica (ex.: RN usa outras tabelas de oferta hídrica)
 * é decisão clínica, que fica no banco de dados/casos, com fonte.
 */

import { ErroDeCalculo, exigirPositivo } from './validacao';

/**
 * Volume em 24 h (mL/dia):
 * - até 10 kg: 100 mL/kg
 * - 10 a 20 kg: 1000 mL + 50 mL/kg acima de 10
 * - acima de 20 kg: 1500 mL + 20 mL/kg acima de 20
 */
export function hollidaySegarMlDia(pesoKg: number): number {
  exigirPositivo(pesoKg, 'Peso');
  if (pesoKg <= 10) return 100 * pesoKg;
  if (pesoKg <= 20) return 1000 + 50 * (pesoKg - 10);
  return 1500 + 20 * (pesoKg - 20);
}

/** Vazão (mL/h) para correr um volume em 24 horas. */
export function vazaoEm24h(volumeMl: number): number {
  exigirPositivo(volumeMl, 'Volume');
  return volumeMl / 24;
}

/** Vazão (mL/h) para correr um volume num tempo em minutos. Ex.: 12 mL em 30 min = 24 mL/h. */
export function vazaoDoVolume(volumeMl: number, tempoMinutos: number): number {
  exigirPositivo(volumeMl, 'Volume');
  exigirPositivo(tempoMinutos, 'Tempo');
  return (volumeMl * 60) / tempoMinutos;
}

/**
 * Divide um volume numa proporção (ex.: soro 4:1 → [4, 1]).
 * Devolve uma parte para cada número da proporção ([4, 1] → [SG, SF]), na mesma ordem.
 */
export function dividirEmProporcao<const T extends readonly number[]>(
  volumeTotalMl: number,
  partes: T,
): { -readonly [K in keyof T]: number } {
  exigirPositivo(volumeTotalMl, 'Volume total');
  if (partes.length === 0) throw new ErroDeCalculo('Informe ao menos uma parte da proporção.');
  partes.forEach((p) => exigirPositivo(p, 'Parte da proporção'));
  const soma = partes.reduce((s, p) => s + p, 0);
  return partes.map((p) => (volumeTotalMl * p) / soma) as { -readonly [K in keyof T]: number };
}
