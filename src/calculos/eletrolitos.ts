/**
 * Contas de eletrólitos que aparecem nos casos (docs/fase-0/casos-clinicos.md, casos 10 e 15).
 * As fórmulas são as do rascunho: A VALIDAR com a fonte (fator 1,6 e 0,6 × peso).
 */

import { exigirPositivo } from './validacao';

/** Sódio corrigido pela glicemia = Na + 1,6 × (glicemia − 100) ÷ 100. */
export function sodioCorrigido(sodio: number, glicemiaMgDl: number): number {
  exigirPositivo(sodio, 'Sódio');
  exigirPositivo(glicemiaMgDl, 'Glicemia');
  return sodio + (1.6 * (glicemiaMgDl - 100)) / 100;
}

/** mEq de sódio para ir do Na atual ao desejado = (desejado − atual) × 0,6 × peso. */
export function deficitDeSodio(entrada: { sodioAtual: number; sodioDesejado: number; pesoKg: number }): number {
  exigirPositivo(entrada.pesoKg, 'Peso');
  return (entrada.sodioDesejado - entrada.sodioAtual) * 0.6 * entrada.pesoKg;
}
