import { createContext, useContext } from 'react';

/**
 * Velocidade das animações. Todos os tempos (em JS e no CSS, via --ritmo)
 * são multiplicados pelo fator: 1,6 = 60% mais devagar.
 */
export type Ritmo = 'devagar' | 'normal' | 'rapido';

export const OPCOES_RITMO: { id: Ritmo; rotulo: string; fator: number }[] = [
  { id: 'devagar', rotulo: 'Devagar', fator: 1.6 },
  { id: 'normal', rotulo: 'Normal', fator: 1 },
  { id: 'rapido', rotulo: 'Rápido', fator: 0.55 },
];

export const RITMO_PADRAO: Ritmo = 'normal';

export function fatorDoRitmo(ritmo: Ritmo): number {
  return OPCOES_RITMO.find((o) => o.id === ritmo)?.fator ?? 1;
}

export const RitmoContexto = createContext(1);

/** Fator de tempo atual (multiplique os milissegundos por ele). */
export function useRitmo(): number {
  return useContext(RitmoContexto);
}
