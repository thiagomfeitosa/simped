/**
 * Conferência da resposta do aluno contra o valor correto, com margem de arredondamento.
 */

import type { ResultadoBic } from './bic';

export interface Tolerancia {
  /** Fração do valor correto aceita como erro de arredondamento (0,01 = 1%). */
  relativa: number;
  /** Diferença absoluta aceita, na mesma unidade do valor (ex.: 0,05 mL). */
  absoluta: number;
}

/**
 * Margem PROVISÓRIA: 1% do valor correto.
 * A DEFINIR com o usuário (quanto de arredondamento aceitar em mL, mg, UI...).
 */
export const TOLERANCIA_PADRAO: Tolerancia = { relativa: 0.01, absoluta: 0 };

// Folga mínima para ignorar ruído de ponto flutuante (ex.: 11.700000000000001).
const RUIDO_NUMERICO = 1e-9;

export interface ResultadoConferencia {
  correto: boolean;
  resposta: number;
  esperado: number;
  /** resposta − esperado (positivo = aluno pôs a mais). */
  diferenca: number;
}

/** Aceita a resposta se a diferença for até o maior entre a margem relativa e a absoluta. */
export function conferirValor(
  resposta: number,
  esperado: number,
  tolerancia: Tolerancia = TOLERANCIA_PADRAO,
): ResultadoConferencia {
  const diferenca = resposta - esperado;
  const margem = Math.max(tolerancia.relativa * Math.abs(esperado), tolerancia.absoluta);
  return {
    correto: Number.isFinite(resposta) && Math.abs(diferenca) <= margem + RUIDO_NUMERICO,
    resposta,
    esperado,
    diferenca,
  };
}

export interface RespostaBicDoAluno {
  volumeMedicacaoMl: number;
  volumeSoroMl: number;
  concentracaoFinal?: number;
}

export interface ConferenciaBic {
  volumeMedicacao: ResultadoConferencia;
  volumeSoro: ResultadoConferencia;
  /** A soma escrita pelo aluno (medicação + SF) bate com o volume final configurado? */
  somaIgualVolumeFinal: ResultadoConferencia;
  /** Só existe quando o gabarito e o aluno informam concentração final. */
  concentracaoFinal?: ResultadoConferencia;
  tudoCerto: boolean;
}

/**
 * Confere os 4 pontos da seringa da BIC (formulas.md, item 7):
 * (1) volume da medicação, (2) volume de SF, (3) soma = volume final, (4) concentração final.
 */
export function conferirSeringaBic(
  resposta: RespostaBicDoAluno,
  gabarito: Extract<ResultadoBic, { aplicavel: true }>,
  tolerancia: Tolerancia = TOLERANCIA_PADRAO,
): ConferenciaBic {
  const volumeMedicacao = conferirValor(resposta.volumeMedicacaoMl, gabarito.volumeMedicacaoMl, tolerancia);
  const volumeSoro = conferirValor(resposta.volumeSoroMl, gabarito.volumeSoroMl, tolerancia);
  const somaIgualVolumeFinal = conferirValor(
    resposta.volumeMedicacaoMl + resposta.volumeSoroMl,
    gabarito.volumeFinalMl,
    tolerancia,
  );
  const concentracaoFinal =
    resposta.concentracaoFinal !== undefined && gabarito.concentracaoFinal !== undefined
      ? conferirValor(resposta.concentracaoFinal, gabarito.concentracaoFinal, tolerancia)
      : undefined;

  const itens = [volumeMedicacao, volumeSoro, somaIgualVolumeFinal, concentracaoFinal];
  return {
    volumeMedicacao,
    volumeSoro,
    somaIgualVolumeFinal,
    ...(concentracaoFinal && { concentracaoFinal }),
    tudoCerto: itens.every((item) => item === undefined || item.correto),
  };
}
