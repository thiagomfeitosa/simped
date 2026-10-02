/**
 * Fase 2 — laboratório ligado ao paciente: valores "normais" de partida e limites físicos.
 * ⚠️ TUDO "A VALIDAR": valores habituais de livro-texto, escritos pelo assistente.
 *
 * Valor de partida: quando o caso não informa um exame, mas algo no caso mexe nele
 * (ex.: o professor dispara uma convulsão e o lactato sobe), o resultado parte daqui.
 */

import type { VariavelLab } from '../casos/tipos';
import type { StatusValidacao } from './medicacoes/tipos';

/** Valores normais de partida (sangue venoso e arterial usam o mesmo, exceto a pCO₂). */
export const LAB_NORMAL: Record<VariavelLab, number> = {
  pco2: 40,
  hco3: 24,
  lactato: 1,
  k: 4.2,
  na: 140,
  cl: 104,
  bhb: 0.2,
};

/** pCO₂ normal de partida por tipo de gasometria (a venosa é ~6 mmHg maior). */
export const PCO2_NORMAL: Record<'gasometria-arterial' | 'gasometria-venosa', number> = {
  'gasometria-arterial': 40,
  'gasometria-venosa': 46,
};

/** Limites físicos (nada passa disso, por mais que as mudanças se somem). */
export const LIMITES_LAB: Record<VariavelLab, [number, number]> = {
  pco2: [8, 150],
  hco3: [2, 60],
  lactato: [0.3, 30],
  k: [1.5, 10],
  na: [100, 190],
  cl: [70, 140],
  bhb: [0, 15],
};

/** De que exame do caso sai o valor inicial de cada variável (na ordem de preferência). */
export const ORIGEM_LAB: Record<VariavelLab, readonly string[]> = {
  pco2: ['gasometria-arterial', 'gasometria-venosa'],
  hco3: ['gasometria-arterial', 'gasometria-venosa'],
  lactato: ['gasometria-arterial', 'gasometria-venosa'],
  k: ['eletrolitos'],
  na: ['eletrolitos'],
  cl: ['eletrolitos'],
  bhb: ['cetonemia'],
};

export const STATUS_LABORATORIO_DINAMICO: StatusValidacao = 'A_VALIDAR';
