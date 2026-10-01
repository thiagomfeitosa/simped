/**
 * Os "tempos" de uma conta, na ordem em que aparecem ligados por setas:
 * fórmula → com os números → (passos intermediários) → resultado.
 * Funções puras, para o botão de desfazer/refazer de cada conta.
 */
import type { Conta } from '../dados/roteiros/tipos';

export type TipoTempo = 'formula' | 'substituicao' | 'passo' | 'resultado';

export interface TempoDaConta {
  tipo: TipoTempo;
  rotulo: string;
  texto: string;
}

export function temposDaConta(conta: Conta): TempoDaConta[] {
  return [
    { tipo: 'formula', rotulo: 'Fórmula', texto: conta.formula },
    { tipo: 'substituicao', rotulo: 'Com os números', texto: conta.substituicao },
    ...(conta.passos ?? []).map((texto) => ({ tipo: 'passo' as const, rotulo: 'Continuando', texto })),
    { tipo: 'resultado', rotulo: 'Resultado', texto: conta.resultado },
  ];
}

/** A fórmula nunca some: desfazer para no 1º tempo. */
export const MINIMO_VISIVEIS = 1;

export function desfazerTempo(visiveis: number): number {
  return Math.max(MINIMO_VISIVEIS, visiveis - 1);
}

export function refazerTempo(visiveis: number, total: number): number {
  return Math.min(total, visiveis + 1);
}
