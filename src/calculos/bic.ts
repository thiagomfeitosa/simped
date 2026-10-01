/**
 * Fórmula 7 de docs/fase-0/formulas.md: fator de correção da BIC
 * (rediluição para um volume final fixo na seringa).
 *
 * O volume final vem da configuração do hospital (src/dados/hospitais.ts);
 * na Santa Casa é 12 mL. O volume da medicação é retirado do volume final
 * e o restante é completado com soro fisiológico.
 */

import { exigirPositivo } from './validacao';

export type ResultadoBic =
  | {
      aplicavel: true;
      volumeMedicacaoMl: number;
      /** SF a completar = volume final − volume da medicação. */
      volumeSoroMl: number;
      volumeFinalMl: number;
      /** Quantidade de droga ÷ volume final. Só existe se a quantidade de droga foi informada. */
      concentracaoFinal?: number;
    }
  | {
      aplicavel: false;
      /** Explicação para mostrar ao aluno. */
      motivo: string;
    };

export function prepararSeringaBic(entrada: {
  volumeMedicacaoMl: number;
  volumeFinalMl: number;
  /** Quantidade de droga na seringa (mg, UI, mEq...), para calcular a concentração final. */
  quantidadeDeDroga?: number;
}): ResultadoBic {
  const { volumeMedicacaoMl, volumeFinalMl, quantidadeDeDroga } = entrada;
  exigirPositivo(volumeMedicacaoMl, 'Volume da medicação');
  exigirPositivo(volumeFinalMl, 'Volume final da BIC');
  if (quantidadeDeDroga !== undefined) exigirPositivo(quantidadeDeDroga, 'Quantidade de droga');

  if (volumeMedicacaoMl > volumeFinalMl) {
    return {
      aplicavel: false,
      motivo:
        `O volume da medicação (${volumeMedicacaoMl} mL) é maior que o volume final da BIC ` +
        `(${volumeFinalMl} mL): a regra de completar com SF não se aplica.`,
    };
  }

  return {
    aplicavel: true,
    volumeMedicacaoMl,
    volumeSoroMl: volumeFinalMl - volumeMedicacaoMl,
    volumeFinalMl,
    ...(quantidadeDeDroga !== undefined && {
      concentracaoFinal: quantidadeDeDroga / volumeFinalMl,
    }),
  };
}
