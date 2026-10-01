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

// 8. Eletrólitos (mEq) ----------------------------------------------------------

/**
 * Quantos mg de cada sal correspondem a 1 mEq (massa molar; sais monovalentes).
 * São dados de QUÍMICA, não doses: NaCl = 23 + 35,5; KCl = 39 + 35,5.
 */
export const MG_POR_MEQ = {
  NaCl: 58.5,
  KCl: 74.5,
} as const;

/**
 * mEq por mL de uma solução de sal a X%.
 * X% = X g em 100 mL = X × 10 mg em 1 mL → divide pelos mg de 1 mEq.
 * Ex.: NaCl 3% → 30 ÷ 58,5 ≈ 0,513 mEq/mL; KCl 19,1% → 191 ÷ 74,5 ≈ 2,56 mEq/mL.
 */
export function meqPorMl(percentual: number, mgPorMeq: number): number {
  exigirPositivo('Concentração (%)', percentual);
  exigirPositivo('mg por mEq', mgPorMeq);
  return arredondar((percentual * 10) / mgPorMeq);
}

/** Concentração em mEq/L: mEq ÷ volume (mL) × 1000. */
export function meqPorLitro(meq: number, volumeMl: number): number {
  exigirPositivo('mEq', meq);
  exigirPositivo('Volume', volumeMl);
  return arredondar((meq * 1000) / volumeMl);
}

/**
 * Menor volume (mL) em que uma quantidade de eletrólito pode ser diluída
 * sem passar da concentração máxima (mEq/L): mEq ÷ máximo × 1000.
 */
export function volumeMinimoDiluicao(meq: number, concentracaoMaximaMeqL: number): number {
  exigirPositivo('mEq', meq);
  exigirPositivo('Concentração máxima', concentracaoMaximaMeqL);
  return arredondar((meq * 1000) / concentracaoMaximaMeqL);
}

/** Água corporal total aproximada usada nas fórmulas de sódio (fração do peso). */
export const FRACAO_AGUA_CORPORAL_PADRAO = 0.6;

/**
 * Déficit de sódio (mEq) para levar o Na sérico de "atual" até "desejado":
 * (Na desejado − Na atual) × fração de água corporal × peso.
 */
export function deficitSodio(naDesejado: number, naAtual: number, pesoKg: number, fracaoAgua = FRACAO_AGUA_CORPORAL_PADRAO): number {
  exigirPositivo('Na desejado', naDesejado);
  exigirPositivo('Na atual', naAtual);
  exigirPositivo('Peso', pesoKg);
  exigirPositivo('Fração de água corporal', fracaoAgua);
  if (naDesejado <= naAtual) throw new Error('O Na desejado deve ser maior que o Na atual.');
  return arredondar((naDesejado - naAtual) * fracaoAgua * pesoKg);
}

/**
 * Quanto o Na sérico deve subir (mEq/L) com uma quantidade de sódio infundida.
 * É a mesma fórmula do déficit, "de trás para frente": mEq ÷ (fração de água × peso).
 * Estimativa grosseira — o que manda é o sódio dosado.
 */
export function subidaEstimadaSodio(meqInfundidos: number, pesoKg: number, fracaoAgua = FRACAO_AGUA_CORPORAL_PADRAO): number {
  exigirPositivo('mEq infundidos', meqInfundidos);
  exigirPositivo('Peso', pesoKg);
  exigirPositivo('Fração de água corporal', fracaoAgua);
  return arredondar(meqInfundidos / (fracaoAgua * pesoKg));
}

/** Velocidade de infusão em mEq/kg/h: mEq ÷ horas ÷ peso. */
export function meqPorKgPorHora(meq: number, tempoHoras: number, pesoKg: number): number {
  exigirPositivo('mEq', meq);
  exigirPositivo('Tempo', tempoHoras);
  exigirPositivo('Peso', pesoKg);
  return arredondar(meq / tempoHoras / pesoKg);
}

// 9. Diluição: quanto do concentrado usar -------------------------------------

/**
 * C1 × V1 = C2 × V2 resolvida para V1: quanto aspirar da solução concentrada
 * para obter V2 mL na concentração C2. Ex.: NaCl 3% a partir do 20%, 20 mL → 3 mL.
 */
export function volumeDoConcentrado(c1: number, c2: number, v2: number): number {
  exigirPositivo('C1', c1);
  exigirPositivo('C2', c2);
  exigirPositivo('V2', v2);
  if (c2 > c1) throw new Error('A concentração final (C2) não pode ser maior que a inicial (C1).');
  return arredondar((c2 * v2) / c1);
}

/**
 * Divide um volume numa proporção (ex.: soro 4:1 → [4, 1]).
 * Devolve o volume de cada parte, na mesma ordem.
 */
// Devolve uma parte para cada número da proporção ([4, 1] → [SG, SF]), na mesma ordem.
export function dividirEmProporcao<const T extends readonly number[]>(
  volumeTotalMl: number,
  partes: T,
): { -readonly [K in keyof T]: number } {
  exigirPositivo('Volume total', volumeTotalMl);
  if (partes.length === 0) throw new Error('Informe ao menos uma parte da proporção.');
  partes.forEach((p) => exigirPositivo('Parte da proporção', p));
  const soma = partes.reduce((s, p) => s + p, 0);
  return partes.map((p) => arredondar((volumeTotalMl * p) / soma)) as { -readonly [K in keyof T]: number };
}

// 10. Recém-nascido ---------------------------------------------------------------

/** Horas de vida = dias completos × 24 + horas. */
export function horasDeVida(dias: number, horas = 0): number {
  if (!Number.isFinite(dias) || dias < 0) throw new Error(`Dias deve ser zero ou mais (recebido: ${dias}).`);
  if (!Number.isFinite(horas) || horas < 0 || horas >= 24) throw new Error(`Horas deve estar entre 0 e 23 (recebido: ${horas}).`);
  return dias * 24 + horas;
}

/** Perda de peso (%) = (peso de nascimento − peso atual) ÷ peso de nascimento × 100. */
export function percentualPerdaPeso(pesoNascimento: number, pesoAtual: number): number {
  exigirPositivo('Peso de nascimento', pesoNascimento);
  exigirPositivo('Peso atual', pesoAtual);
  return arredondar(((pesoNascimento - pesoAtual) / pesoNascimento) * 100, 2);
}
