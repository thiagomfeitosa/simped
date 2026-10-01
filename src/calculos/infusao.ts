/**
 * Fórmula 4 de docs/fase-0/formulas.md: infusão contínua (dose/kg/min ou dose/kg/h ↔ mL/h).
 *
 * A dose e a concentração precisam estar na MESMA unidade de droga:
 * mcg/kg/min com mcg/mL; UI/kg/h com UI/mL. Para trocar mg ↔ mcg use converterMassa.
 */

import { exigirPositivo } from './validacao';

/** Unidade de tempo da dose prescrita: por minuto (ex.: mcg/kg/min) ou por hora (ex.: UI/kg/h). */
export type TempoDaDose = 'min' | 'h';

function minutosPorUnidade(por: TempoDaDose): number {
  return por === 'min' ? 60 : 1;
}

/**
 * Vazão da bomba (mL/h) = dose/kg × peso × (60 se a dose for por minuto) ÷ concentração.
 * Ex. (por minuto): mL/h = mcg/kg/min × kg × 60 ÷ mcg/mL.
 */
export function vazaoMlPorHora(entrada: {
  dosePorKg: number;
  pesoKg: number;
  concentracao: number;
  por: TempoDaDose;
}): number {
  const { dosePorKg, pesoKg, concentracao, por } = entrada;
  exigirPositivo(dosePorKg, 'Dose por kg');
  exigirPositivo(pesoKg, 'Peso');
  exigirPositivo(concentracao, 'Concentração');
  return (dosePorKg * pesoKg * minutosPorUnidade(por)) / concentracao;
}

/**
 * Caminho inverso: qual dose/kg (por min ou por h) o paciente recebe com uma vazão em mL/h.
 * Ex. (por minuto): mcg/kg/min = mL/h × mcg/mL ÷ (kg × 60).
 */
export function dosePorKgDaVazao(entrada: {
  vazaoMlPorHora: number;
  concentracao: number;
  pesoKg: number;
  por: TempoDaDose;
}): number {
  const { vazaoMlPorHora, concentracao, pesoKg, por } = entrada;
  exigirPositivo(vazaoMlPorHora, 'Vazão');
  exigirPositivo(concentracao, 'Concentração');
  exigirPositivo(pesoKg, 'Peso');
  return (vazaoMlPorHora * concentracao) / (pesoKg * minutosPorUnidade(por));
}
