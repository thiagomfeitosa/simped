/**
 * Fórmula 5 de docs/fase-0/formulas.md: velocidade de infusão de glicose (VIG)
 * e mistura de duas soluções (ex.: SG 5% + glicose 50%) para chegar a uma concentração desejada.
 */

import { ErroDeCalculo, exigirNaoNegativo, exigirPositivo } from './validacao';

/**
 * VIG (mg/kg/min) = vazão (mL/h) × concentração de glicose (%) ÷ (6 × peso em kg).
 * Dedução: % = g/100 mL → mL/h × % × 1000 ÷ 100 ÷ 60 ÷ peso.
 */
export function vig(entrada: {
  vazaoMlPorHora: number;
  concentracaoGlicosePct: number;
  pesoKg: number;
}): number {
  const { vazaoMlPorHora, concentracaoGlicosePct, pesoKg } = entrada;
  exigirPositivo(vazaoMlPorHora, 'Vazão');
  exigirPositivo(concentracaoGlicosePct, 'Concentração de glicose');
  exigirPositivo(pesoKg, 'Peso');
  return (vazaoMlPorHora * concentracaoGlicosePct) / (6 * pesoKg);
}

/** Caminho inverso: vazão (mL/h) = VIG × 6 × peso ÷ concentração de glicose (%). */
export function vazaoParaVig(entrada: {
  vigMgKgMin: number;
  concentracaoGlicosePct: number;
  pesoKg: number;
}): number {
  const { vigMgKgMin, concentracaoGlicosePct, pesoKg } = entrada;
  exigirPositivo(vigMgKgMin, 'VIG');
  exigirPositivo(concentracaoGlicosePct, 'Concentração de glicose');
  exigirPositivo(pesoKg, 'Peso');
  return (vigMgKgMin * 6 * pesoKg) / concentracaoGlicosePct;
}

/**
 * Quanto usar de cada solução para obter o volume final na concentração desejada.
 * Volume da mais concentrada = volume final × (desejada − menor) ÷ (maior − menor).
 * Considera só as duas soluções: o volume de eletrólitos acrescentados ao soro não entra aqui.
 */
export function misturarDuasSolucoes(entrada: {
  concentracaoMenor: number;
  concentracaoMaior: number;
  concentracaoDesejada: number;
  volumeFinalMl: number;
}): { volumeMenorMl: number; volumeMaiorMl: number } {
  const { concentracaoMenor, concentracaoMaior, concentracaoDesejada, volumeFinalMl } = entrada;
  exigirNaoNegativo(concentracaoMenor, 'Concentração da solução menos concentrada');
  exigirPositivo(concentracaoMaior, 'Concentração da solução mais concentrada');
  exigirPositivo(volumeFinalMl, 'Volume final');
  if (concentracaoMaior <= concentracaoMenor) {
    throw new ErroDeCalculo('A solução "maior" precisa ser mais concentrada que a "menor".');
  }
  if (concentracaoDesejada < concentracaoMenor || concentracaoDesejada > concentracaoMaior) {
    throw new ErroDeCalculo(
      `A concentração desejada (${concentracaoDesejada}) precisa estar entre ${concentracaoMenor} e ${concentracaoMaior}.`,
    );
  }
  const volumeMaiorMl =
    (volumeFinalMl * (concentracaoDesejada - concentracaoMenor)) /
    (concentracaoMaior - concentracaoMenor);
  return { volumeMenorMl: volumeFinalMl - volumeMaiorMl, volumeMaiorMl };
}
