/**
 * Soluções usadas para montar soro (seção 4 da folha): quanto de glicose e de eletrólitos cada mL tem.
 * ⚠️ TUDO "A VALIDAR": valores habituais escritos pelo assistente, para o app funcionar enquanto o usuário
 * levanta as apresentações da Santa Casa (concentração de cada ampola/bolsa, com fonte).
 */

import type { StatusValidacao } from './medicacoes/tipos';

export interface Solucao {
  id: string;
  nome: string;
  /** 'base' = bolsa/frasco de soro; 'aditivo' = ampola acrescentada ao soro. */
  tipo: 'base' | 'aditivo';
  /** Gramas de glicose em 100 mL (= %). */
  glicosePct?: number;
  sodioMEqPorMl?: number;
  potassioMEqPorMl?: number;
  calcioMEqPorMl?: number;
  /** Etiquetas para interações (ex.: ['calcio']). */
  classes?: string[];
  status: StatusValidacao;
  observacao?: string;
}

export const SOLUCOES: readonly Solucao[] = [
  { id: 'sg5', nome: 'SG 5%', tipo: 'base', glicosePct: 5, status: 'A_VALIDAR' },
  { id: 'sg10', nome: 'SG 10%', tipo: 'base', glicosePct: 10, status: 'A_VALIDAR' },
  { id: 'sf09', nome: 'SF 0,9%', tipo: 'base', sodioMEqPorMl: 0.154, status: 'A_VALIDAR' },
  {
    id: 'ringer-lactato',
    nome: 'Ringer lactato',
    tipo: 'base',
    sodioMEqPorMl: 0.13,
    potassioMEqPorMl: 0.004,
    calcioMEqPorMl: 0.003,
    classes: ['calcio'],
    status: 'A_VALIDAR',
  },
  { id: 'g25', nome: 'Glicose 25%', tipo: 'aditivo', glicosePct: 25, status: 'A_VALIDAR' },
  { id: 'g50', nome: 'Glicose 50%', tipo: 'aditivo', glicosePct: 50, status: 'A_VALIDAR' },
  {
    id: 'nacl20',
    nome: 'NaCl 20%',
    tipo: 'aditivo',
    sodioMEqPorMl: 3.4,
    status: 'A_VALIDAR',
    observacao: '20 g/100 mL ÷ 58,5 ≈ 3,4 mEq/mL.',
  },
  { id: 'nacl10', nome: 'NaCl 10%', tipo: 'aditivo', sodioMEqPorMl: 1.7, status: 'A_VALIDAR' },
  {
    id: 'kcl191',
    nome: 'KCl 19,1%',
    tipo: 'aditivo',
    potassioMEqPorMl: 2.5,
    status: 'A_VALIDAR',
    observacao: '19,1 g/100 mL ÷ 74,5 ≈ 2,56 mEq/mL; na prática costuma-se usar 2,5 mEq/mL (A VALIDAR).',
  },
  { id: 'kcl10', nome: 'KCl 10%', tipo: 'aditivo', potassioMEqPorMl: 1.34, status: 'A_VALIDAR' },
  {
    id: 'gluconato-ca10',
    nome: 'Gluconato de cálcio 10%',
    tipo: 'aditivo',
    calcioMEqPorMl: 0.46,
    classes: ['calcio'],
    status: 'A_VALIDAR',
  },
];

export function solucaoPorId(id: string): Solucao | undefined {
  return SOLUCOES.find((s) => s.id === id);
}

/**
 * Referências para comparar o soro montado. ⚠️ A VALIDAR: só aparecem como informação,
 * nunca corrigem o aluno (as metas dependem da idade, do quadro e da fonte).
 */
export const REFERENCIAS_SORO = {
  sodioMEqKgDia: { min: 2, max: 4 },
  potassioMEqKgDia: { min: 1, max: 3 },
  vigMgKgMin: { min: 4, max: 8 },
  /** Osmolaridade a partir da qual muitos serviços evitam veia periférica (mOsm/L). */
  osmolaridadePerifericaMax: 900,
  /** Concentração de potássio acima da qual se pede acesso central (mEq/L). */
  potassioPerifericoMaxMEqL: 40,
  /** Velocidade de infusão de potássio (mEq/kg/h). */
  potassioMaxMEqKgH: 0.5,
  status: 'A_VALIDAR' as StatusValidacao,
};
