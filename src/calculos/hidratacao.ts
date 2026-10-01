/**
 * Fórmula 6 de docs/fase-0/formulas.md: soro de manutenção pela regra de Holliday-Segar.
 *
 * Aqui está só a conta. QUANDO a regra se aplica (ex.: RN usa outras tabelas de oferta hídrica)
 * é decisão clínica, que fica no banco de dados/casos, com fonte.
 */

import { exigirPositivo } from './validacao';

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
