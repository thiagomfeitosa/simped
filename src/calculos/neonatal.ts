/**
 * Contas do recém-nascido usadas nos roteiros (icterícia): horas de vida e perda de peso.
 */

import { ErroDeCalculo, exigirPositivo } from './validacao';

/** Horas de vida = dias completos × 24 + horas. */
export function horasDeVida(dias: number, horas = 0): number {
  if (!Number.isFinite(dias) || dias < 0) throw new ErroDeCalculo(`Dias deve ser zero ou mais (recebido: ${dias}).`);
  if (!Number.isFinite(horas) || horas < 0 || horas >= 24) {
    throw new ErroDeCalculo(`Horas deve estar entre 0 e 23 (recebido: ${horas}).`);
  }
  return dias * 24 + horas;
}

/** Perda de peso (%) = (peso de nascimento − peso atual) ÷ peso de nascimento × 100. */
export function percentualPerdaPeso(pesoNascimento: number, pesoAtual: number): number {
  exigirPositivo(pesoNascimento, 'Peso de nascimento');
  exigirPositivo(pesoAtual, 'Peso atual');
  return ((pesoNascimento - pesoAtual) / pesoNascimento) * 100;
}
