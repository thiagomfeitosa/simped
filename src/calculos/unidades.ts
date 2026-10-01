/**
 * Conversão entre unidades de massa (g, mg, mcg).
 * UI e mEq não são massa e não se convertem aqui: a conversão delas depende da droga
 * e fica no banco de medicações, com fonte.
 */

import { ErroDeCalculo } from './validacao';

export type UnidadeDeMassa = 'g' | 'mg' | 'mcg';

const MICROGRAMAS_POR_UNIDADE: Record<UnidadeDeMassa, number> = {
  g: 1_000_000,
  mg: 1_000,
  mcg: 1,
};

/** Ex.: converterMassa(1, 'mg', 'mcg') → 1000. */
export function converterMassa(valor: number, de: UnidadeDeMassa, para: UnidadeDeMassa): number {
  if (!Number.isFinite(valor)) {
    throw new ErroDeCalculo(`Valor inválido para conversão: ${valor}.`);
  }
  return (valor * MICROGRAMAS_POR_UNIDADE[de]) / MICROGRAMAS_POR_UNIDADE[para];
}
