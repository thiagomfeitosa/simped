/**
 * Gotejamento (soro "no equipo", sem bomba): mL/h ↔ gotas/min.
 * Quantas gotas tem 1 mL depende do equipo: macrogotas (habitual: 20 gotas/mL) e
 * microgotas (habitual: 60 microgotas/mL). Os valores ficam em src/dados/equipos.ts (A VALIDAR).
 */

import { exigirPositivo } from './validacao';

/** gotas/min = mL/h × gotas por mL ÷ 60. Ex.: 60 mL/h em macrogotas (20/mL) = 20 gotas/min. */
export function gotasPorMinuto(vazaoMlPorHora: number, gotasPorMl: number): number {
  exigirPositivo(vazaoMlPorHora, 'Vazão');
  exigirPositivo(gotasPorMl, 'Gotas por mL');
  return (vazaoMlPorHora * gotasPorMl) / 60;
}

/** Caminho inverso: mL/h = gotas/min × 60 ÷ gotas por mL. */
export function vazaoDasGotas(gotasPorMin: number, gotasPorMl: number): number {
  exigirPositivo(gotasPorMin, 'Gotas por minuto');
  exigirPositivo(gotasPorMl, 'Gotas por mL');
  return (gotasPorMin * 60) / gotasPorMl;
}
