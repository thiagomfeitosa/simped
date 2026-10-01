/**
 * Fórmula 3 de docs/fase-0/formulas.md: diluição e rediluição (C1 × V1 = C2 × V2).
 * C = concentração (por mL, qualquer unidade de droga); V = volume em mL.
 */

import { ErroDeCalculo, exigirPositivo } from './validacao';

export interface ResultadoDiluicao {
  /** Concentração final (C2). */
  concentracaoFinal: number;
  /** Volume de diluente a acrescentar (V2 − V1), em mL. */
  volumeDiluenteMl: number;
}

/**
 * Aspira V1 de uma solução de concentração C1 e completa com diluente até V2.
 * Resultado: C2 = C1 × V1 ÷ V2.
 */
export function diluir(entrada: {
  concentracaoInicial: number;
  volumeAspiradoMl: number;
  volumeFinalMl: number;
}): ResultadoDiluicao {
  const { concentracaoInicial, volumeAspiradoMl, volumeFinalMl } = entrada;
  exigirPositivo(concentracaoInicial, 'Concentração inicial');
  exigirPositivo(volumeAspiradoMl, 'Volume aspirado');
  exigirPositivo(volumeFinalMl, 'Volume final');
  if (volumeFinalMl < volumeAspiradoMl) {
    throw new ErroDeCalculo(
      `O volume final (${volumeFinalMl} mL) não pode ser menor que o volume aspirado (${volumeAspiradoMl} mL).`,
    );
  }
  return {
    concentracaoFinal: (concentracaoInicial * volumeAspiradoMl) / volumeFinalMl,
    volumeDiluenteMl: volumeFinalMl - volumeAspiradoMl,
  };
}

/**
 * Caminho inverso: quanto aspirar (V1) para obter a concentração desejada (C2) no volume final (V2).
 * V1 = C2 × V2 ÷ C1.
 */
export function volumeParaConcentracaoDesejada(entrada: {
  concentracaoInicial: number;
  concentracaoDesejada: number;
  volumeFinalMl: number;
}): { volumeAspiradoMl: number; volumeDiluenteMl: number } {
  const { concentracaoInicial, concentracaoDesejada, volumeFinalMl } = entrada;
  exigirPositivo(concentracaoInicial, 'Concentração inicial');
  exigirPositivo(concentracaoDesejada, 'Concentração desejada');
  exigirPositivo(volumeFinalMl, 'Volume final');
  if (concentracaoDesejada > concentracaoInicial) {
    throw new ErroDeCalculo(
      'Diluir só diminui a concentração: a desejada não pode ser maior que a inicial.',
    );
  }
  const volumeAspiradoMl = (concentracaoDesejada * volumeFinalMl) / concentracaoInicial;
  return { volumeAspiradoMl, volumeDiluenteMl: volumeFinalMl - volumeAspiradoMl };
}

export interface EtapaDeDiluicao {
  volumeAspiradoMl: number;
  volumeFinalMl: number;
}

/**
 * Diluição seguida de rediluição(ões): cada etapa parte da solução da etapa anterior.
 * Ex.: aspira 1 mL da 1ª diluição e completa até 10 mL.
 * Devolve o resultado de cada etapa, para o programa conferir uma a uma.
 */
export function diluirEmEtapas(
  concentracaoInicial: number,
  etapas: readonly EtapaDeDiluicao[],
): ResultadoDiluicao[] {
  if (etapas.length === 0) {
    throw new ErroDeCalculo('Informe pelo menos uma etapa de diluição.');
  }
  const resultados: ResultadoDiluicao[] = [];
  let concentracaoAtual = concentracaoInicial;
  for (const etapa of etapas) {
    const resultado = diluir({ concentracaoInicial: concentracaoAtual, ...etapa });
    resultados.push(resultado);
    concentracaoAtual = resultado.concentracaoFinal;
  }
  return resultados;
}
