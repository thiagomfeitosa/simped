/**
 * Configurações que mudam de hospital para hospital.
 * Para incluir outro hospital, copie o bloco da Santa Casa e troque os valores.
 */

export interface ConfiguracaoHospital {
  id: string;
  nome: string;
  /** Volume final da seringa da BIC (mL): medicação + SF completando até este volume. */
  volumeFinalBicMl: number;
  /** De onde veio a informação. */
  fonte: string;
}

export const HOSPITAIS = {
  santaCasa: {
    id: 'santa-casa',
    nome: 'Santa Casa',
    volumeFinalBicMl: 12,
    fonte: 'Rotina do alojamento conjunto, informada pelo usuário (docs/fase-0/formulas.md, item 7)',
  },
} as const satisfies Record<string, ConfiguracaoHospital>;
