/**
 * Fórmulas de cálculo da prescrição (ver docs/fase-0/formulas.md).
 *
 * Módulo PURO: só matemática, sem telas e sem doses.
 * As doses virão do banco de medicações, sempre com fonte.
 */

/** Resultado de uma conta que pode não se aplicar (ex.: dados inválidos). */
export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };

function positivo(nome: string, valor: number): string | null {
  if (!Number.isFinite(valor) || valor <= 0) return `${nome} deve ser um número maior que zero.`;
  return null;
}

function primeiroErro(...erros: (string | null)[]): string | null {
  return erros.find((e) => e !== null) ?? null;
}

// 1. Dose por peso -----------------------------------------------------------

export interface DoseTotal {
  /** Dose que será dada (já limitada pela dose máxima, se houver). */
  dose: number;
  /** Dose calculada antes de aplicar a dose máxima. */
  doseCalculada: number;
  /** true quando a dose calculada passou da máxima e foi limitada. */
  limitadaPelaMaxima: boolean;
}

export function doseTotal(dosePorKg: number, pesoKg: number, doseMaxima?: number): Resultado<DoseTotal> {
  const erro = primeiroErro(
    positivo('A dose por kg', dosePorKg),
    positivo('O peso', pesoKg),
    doseMaxima === undefined ? null : positivo('A dose máxima', doseMaxima),
  );
  if (erro) return { ok: false, erro };

  const doseCalculada = dosePorKg * pesoKg;
  const limitada = doseMaxima !== undefined && doseCalculada > doseMaxima;
  return {
    ok: true,
    valor: { dose: limitada ? doseMaxima : doseCalculada, doseCalculada, limitadaPelaMaxima: limitada },
  };
}

// 2. Volume a aspirar --------------------------------------------------------

/** Volume (mL) = dose ÷ concentração. Ex.: mg ÷ (mg/mL) = mL. */
export function volumeAspirar(dose: number, concentracaoPorMl: number): Resultado<number> {
  const erro = primeiroErro(positivo('A dose', dose), positivo('A concentração', concentracaoPorMl));
  if (erro) return { ok: false, erro };
  return { ok: true, valor: dose / concentracaoPorMl };
}

// 3. Diluição e rediluição (C1 × V1 = C2 × V2) -------------------------------

export interface Diluicao {
  /** Concentração depois de completar até o volume final. */
  concentracaoFinal: number;
  /** Volume de diluente a acrescentar (volume final − volume aspirado). */
  volumeDiluente: number;
}

/**
 * Aspira `volumeAspirado` mL de uma solução com `concentracaoInicial` e completa até `volumeFinal` mL.
 * Para rediluir, chame de novo usando a concentração final da etapa anterior.
 */
export function diluir(concentracaoInicial: number, volumeAspirado: number, volumeFinal: number): Resultado<Diluicao> {
  const erro = primeiroErro(
    positivo('A concentração inicial', concentracaoInicial),
    positivo('O volume aspirado', volumeAspirado),
    positivo('O volume final', volumeFinal),
  );
  if (erro) return { ok: false, erro };
  if (volumeAspirado > volumeFinal) {
    return { ok: false, erro: 'O volume aspirado não pode ser maior que o volume final.' };
  }
  return {
    ok: true,
    valor: {
      concentracaoFinal: (concentracaoInicial * volumeAspirado) / volumeFinal,
      volumeDiluente: volumeFinal - volumeAspirado,
    },
  };
}

// 4. Infusão contínua (mcg/kg/min ↔ mL/h) ------------------------------------

/** mL/h = dose (mcg/kg/min) × peso × 60 ÷ concentração (mcg/mL). */
export function infusaoMlPorHora(doseMcgKgMin: number, pesoKg: number, concentracaoMcgMl: number): Resultado<number> {
  const erro = primeiroErro(
    positivo('A dose', doseMcgKgMin),
    positivo('O peso', pesoKg),
    positivo('A concentração', concentracaoMcgMl),
  );
  if (erro) return { ok: false, erro };
  return { ok: true, valor: (doseMcgKgMin * pesoKg * 60) / concentracaoMcgMl };
}

/** dose (mcg/kg/min) = mL/h × concentração (mcg/mL) ÷ (peso × 60). */
export function infusaoMcgKgMin(mlPorHora: number, pesoKg: number, concentracaoMcgMl: number): Resultado<number> {
  const erro = primeiroErro(
    positivo('A vazão', mlPorHora),
    positivo('O peso', pesoKg),
    positivo('A concentração', concentracaoMcgMl),
  );
  if (erro) return { ok: false, erro };
  return { ok: true, valor: (mlPorHora * concentracaoMcgMl) / (pesoKg * 60) };
}

// 5. Velocidade de infusão de glicose (VIG) ----------------------------------

/** VIG (mg/kg/min) = vazão (mL/h) × concentração de glicose (%) ÷ (6 × peso). */
export function vig(mlPorHora: number, glicosePercentual: number, pesoKg: number): Resultado<number> {
  const erro = primeiroErro(
    positivo('A vazão', mlPorHora),
    positivo('A concentração de glicose', glicosePercentual),
    positivo('O peso', pesoKg),
  );
  if (erro) return { ok: false, erro };
  return { ok: true, valor: (mlPorHora * glicosePercentual) / (6 * pesoKg) };
}

// 6. Soro de manutenção (Holliday-Segar) -------------------------------------

export interface HollidaySegar {
  mlPorDia: number;
  mlPorHora: number;
}

export function hollidaySegar(pesoKg: number): Resultado<HollidaySegar> {
  const erro = positivo('O peso', pesoKg);
  if (erro) return { ok: false, erro };

  let mlPorDia: number;
  if (pesoKg <= 10) mlPorDia = 100 * pesoKg;
  else if (pesoKg <= 20) mlPorDia = 1000 + 50 * (pesoKg - 10);
  else mlPorDia = 1500 + 20 * (pesoKg - 20);

  return { ok: true, valor: { mlPorDia, mlPorHora: mlPorDia / 24 } };
}

// 7. Fator de correção da BIC (volume final fixo) ----------------------------

export interface Bic {
  /** Soro fisiológico a completar = volume final − volume da medicação. */
  volumeSF: number;
  /** Quantidade de droga ÷ volume final. */
  concentracaoFinal: number;
}

/**
 * Regra do volume final fixo (Santa Casa: 12 mL; configurável por hospital).
 * `quantidadeDroga` é a quantidade contida no volume da medicação (mg, UI, mEq...).
 */
export function fatorBic(volumeMedicacao: number, quantidadeDroga: number, volumeFinal: number): Resultado<Bic> {
  const erro = primeiroErro(
    positivo('O volume da medicação', volumeMedicacao),
    positivo('A quantidade de droga', quantidadeDroga),
    positivo('O volume final', volumeFinal),
  );
  if (erro) return { ok: false, erro };
  if (volumeMedicacao > volumeFinal) {
    return {
      ok: false,
      erro: `O volume da medicação (${volumeMedicacao} mL) passa do volume final de ${volumeFinal} mL: a regra não se aplica.`,
    };
  }
  return {
    ok: true,
    valor: {
      volumeSF: volumeFinal - volumeMedicacao,
      concentracaoFinal: quantidadeDroga / volumeFinal,
    },
  };
}
