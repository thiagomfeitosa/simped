/**
 * Erros e checagens de entrada comuns a todos os cálculos.
 * Um valor impossível (peso zero, concentração negativa, campo vazio) gera um erro
 * com mensagem em português, em vez de um resultado sem sentido.
 */

export class ErroDeCalculo extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroDeCalculo';
  }
}

/** Exige um número maior que zero (ex.: peso, concentração, volume final). */
export function exigirPositivo(valor: number, nome: string): void {
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new ErroDeCalculo(`${nome} deve ser um número maior que zero (recebido: ${valor}).`);
  }
}

/** Exige um número igual ou maior que zero (ex.: volume de soro que pode ser 0). */
export function exigirNaoNegativo(valor: number, nome: string): void {
  if (!Number.isFinite(valor) || valor < 0) {
    throw new ErroDeCalculo(`${nome} não pode ser negativo (recebido: ${valor}).`);
  }
}

/**
 * Arredonda para exibição (ex.: 11.700000000000001 → 11,7).
 * Os cálculos devolvem o valor exato; quem mostra na tela decide as casas decimais.
 */
export function arredondar(valor: number, casasDecimais: number): number {
  const fator = 10 ** casasDecimais;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}
