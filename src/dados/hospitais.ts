/**
 * Configurações que mudam de hospital para hospital.
 * Para incluir outro hospital, copie o bloco da Santa Casa e troque os valores.
 */

import type { StatusValidacao } from './medicacoes/tipos';

export interface ConfiguracaoHospital {
  id: string;
  nome: string;
  /** Volume final da seringa da BIC (mL): medicação + SF completando até este volume. */
  volumeFinalBicMl: number;
  /**
   * Horários padrão de cada intervalo (aprazamento), "HH:MM".
   * Ex.: 8/8h → 06:00, 14:00, 22:00. Intervalo sem lista = começa em `horaInicial`.
   */
  aprazamento: Partial<Record<number, string[]>>;
  /** Hora da primeira dose quando o intervalo não tem lista própria. */
  horaInicial: string;
  /** De onde veio a informação. */
  fonte: string;
  /** O aprazamento ainda não foi conferido com o hospital. */
  statusAprazamento: StatusValidacao;
}

export const HOSPITAIS = {
  santaCasa: {
    id: 'santa-casa',
    nome: 'Santa Casa',
    volumeFinalBicMl: 12,
    // ⚠️ A VALIDAR: horários fictícios até o usuário trazer a rotina da enfermagem
    aprazamento: {
      4: ['06:00', '10:00', '14:00', '18:00', '22:00', '02:00'],
      6: ['06:00', '12:00', '18:00', '24:00'],
      8: ['06:00', '14:00', '22:00'],
      12: ['08:00', '20:00'],
      24: ['08:00'],
    },
    horaInicial: '06:00',
    fonte: 'Rotina do alojamento conjunto, informada pelo usuário (docs/fase-0/formulas.md, item 7)',
    statusAprazamento: 'A_VALIDAR',
  },
  generico: {
    id: 'generico',
    nome: 'Hospital genérico (exemplo)',
    volumeFinalBicMl: 20,
    aprazamento: {},
    horaInicial: '08:00',
    fonte: 'Valores fictícios, só para treinar a troca de hospital (A VALIDAR)',
    statusAprazamento: 'A_VALIDAR',
  },
} as const satisfies Record<string, ConfiguracaoHospital>;

export type IdHospital = keyof typeof HOSPITAIS;

export const LISTA_HOSPITAIS: readonly ConfiguracaoHospital[] = Object.values(HOSPITAIS);

export function hospitalPorId(id: string): ConfiguracaoHospital {
  return LISTA_HOSPITAIS.find((h) => h.id === id) ?? HOSPITAIS.santaCasa;
}
