/**
 * Fórmulas de cálculo da prescrição (ver docs/fase-0/formulas.md).
 *
 * Aqui só existe MATEMÁTICA. Nenhuma dose está escrita neste arquivo:
 * as doses vêm sempre do banco de medicações/roteiros, com fonte.
 * Este módulo não depende de telas, para poder ser testado sozinho (Vitest).
 */

/** Arredonda para evitar sujeira de ponto flutuante (ex.: 0,30000000000000004). */
export function arredondar(valor: number, casas = 4): number {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

function exigirPositivo(nome: string, valor: number): void {
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error(`${nome} deve ser um número maior que zero (recebido: ${valor}).`);
  }
}

// 1. Dose por peso -----------------------------------------------------------

export interface ResultadoDosePorPeso {
  /** Dose que de fato será dada (já limitada pela dose máxima, se houver). */
  doseTotal: number;
  /** Dose calculada antes de aplicar o limite. */
  doseCalculada: number;
  /** Verdadeiro quando a dose máxima foi aplicada. */
  limitadaPelaMaxima: boolean;
}

/** Dose total = dose por kg × peso. Se passar da dose máxima, usa a máxima. */
export function dosePorPeso(dosePorKg: number, pesoKg: number, doseMaxima?: number): ResultadoDosePorPeso {
  exigirPositivo('Dose por kg', dosePorKg);
  exigirPositivo('Peso', pesoKg);
  const doseCalculada = arredondar(dosePorKg * pesoKg);
  const limitadaPelaMaxima = doseMaxima !== undefined && doseCalculada > doseMaxima;
  return {
    doseTotal: limitadaPelaMaxima ? doseMaxima : doseCalculada,
    doseCalculada,
    limitadaPelaMaxima,
  };
}

// 2. Volume a aspirar --------------------------------------------------------

/** Volume (mL) = dose ÷ concentração (ex.: mg ÷ mg/mL). */
export function volumeAAspirar(dose: number, concentracaoPorMl: number): number {
  exigirPositivo('Dose', dose);
  exigirPositivo('Concentração', concentracaoPorMl);
  return arredondar(dose / concentracaoPorMl);
}

// 3. Diluição e rediluição (C1 × V1 = C2 × V2) --------------------------------

/** Concentração depois de diluir um pó/solução: quantidade ÷ volume final. */
export function concentracao(quantidade: number, volumeMl: number): number {
  exigirPositivo('Quantidade', quantidade);
  exigirPositivo('Volume', volumeMl);
  return arredondar(quantidade / volumeMl);
}

/** C2 = C1 × V1 ÷ V2. */
export function concentracaoFinalDiluicao(c1: number, v1: number, v2: number): number {
  exigirPositivo('C1', c1);
  exigirPositivo('V1', v1);
  exigirPositivo('V2', v2);
  if (v2 < v1) throw new Error('O volume final (V2) não pode ser menor que o volume aspirado (V1).');
  return arredondar((c1 * v1) / v2);
}

// 4. Fator de correção da BIC (volume final fixo) -----------------------------

export interface ResultadoBic {
  /** Volume de soro fisiológico para completar até o volume final. */
  volumeSF: number;
  /** Volume final na seringa da BIC. */
  volumeFinal: number;
  /** Concentração final da solução na BIC. */
  concentracaoFinal: number;
  /** Falso quando o volume da medicação já passa do volume final (a regra não se aplica). */
  aplicavel: boolean;
}

/**
 * Regra do volume final fixo (Santa Casa: 12 mL; cada hospital pode configurar).
 * SF = volume final − volume da medicação.
 */
export function fatorCorrecaoBic(volumeMedicacaoMl: number, quantidadeDroga: number, volumeFinalMl = 12): ResultadoBic {
  exigirPositivo('Volume da medicação', volumeMedicacaoMl);
  exigirPositivo('Quantidade da droga', quantidadeDroga);
  exigirPositivo('Volume final', volumeFinalMl);
  const aplicavel = volumeMedicacaoMl <= volumeFinalMl;
  return {
    volumeSF: aplicavel ? arredondar(volumeFinalMl - volumeMedicacaoMl) : 0,
    volumeFinal: volumeFinalMl,
    concentracaoFinal: arredondar(quantidadeDroga / volumeFinalMl),
    aplicavel,
  };
}

// 5. Vazão ------------------------------------------------------------------

/** Vazão (mL/h) = volume ÷ tempo em horas. */
export function vazaoMlPorHora(volumeMl: number, tempoMinutos: number): number {
  exigirPositivo('Volume', volumeMl);
  exigirPositivo('Tempo', tempoMinutos);
  return arredondar((volumeMl * 60) / tempoMinutos);
}

/** Infusão contínua: mL/h = dose (mcg/kg/min) × peso × 60 ÷ concentração (mcg/mL). */
export function infusaoContinuaMlPorHora(doseMcgKgMin: number, pesoKg: number, concentracaoMcgMl: number): number {
  exigirPositivo('Dose', doseMcgKgMin);
  exigirPositivo('Peso', pesoKg);
  exigirPositivo('Concentração', concentracaoMcgMl);
  return arredondar((doseMcgKgMin * pesoKg * 60) / concentracaoMcgMl);
}

// 6. Glicose ----------------------------------------------------------------

/** VIG (mg/kg/min) = vazão (mL/h) × glicose (%) ÷ (6 × peso). */
export function vig(vazaoMlH: number, glicosePercentual: number, pesoKg: number): number {
  exigirPositivo('Vazão', vazaoMlH);
  exigirPositivo('Concentração de glicose', glicosePercentual);
  exigirPositivo('Peso', pesoKg);
  return arredondar((vazaoMlH * glicosePercentual) / (6 * pesoKg));
}

// 7. Soro de manutenção (Holliday-Segar) --------------------------------------

/** Volume de manutenção em 24 h pela regra de Holliday-Segar. */
export function hollidaySegar(pesoKg: number): number {
  exigirPositivo('Peso', pesoKg);
  if (pesoKg <= 10) return arredondar(pesoKg * 100);
  if (pesoKg <= 20) return arredondar(1000 + (pesoKg - 10) * 50);
  return arredondar(1500 + (pesoKg - 20) * 20);
}
