/**
 * Regras de alerta de segurança da folha: interações/incompatibilidades e reatividade cruzada de alergia.
 * ⚠️ TUDO "A VALIDAR": exemplos escritos pelo assistente para o alerta funcionar; conferir na fonte.
 * As etiquetas são o id da medicação, as `classes` do banco (src/dados/medicacoes/) e as das soluções
 * (src/dados/solucoes.ts).
 */

import type { CondicoesDaRegra, Fonte, StatusValidacao } from './medicacoes/tipos';

export interface RegraInteracao {
  id: string;
  etiquetaA: string;
  etiquetaB: string;
  /** Só vale para pacientes que cumprem as condições (ex.: idade < 28 dias). */
  condicoes?: CondicoesDaRegra;
  texto: string;
  gravidade: 'alta' | 'media';
  fonte: Fonte;
  status: StatusValidacao;
}

export const INTERACOES: readonly RegraInteracao[] = [
  {
    id: 'ceftriaxona-calcio-rn',
    etiquetaA: 'ceftriaxona',
    etiquetaB: 'calcio',
    condicoes: { idadeDias: { ate: 28 } },
    texto: 'Ceftriaxona + cálcio EV em RN com menos de 28 dias: risco de precipitação. Não prescrever juntos.',
    gravidade: 'alta',
    fonte: { codigo: 'BULA' },
    status: 'A_VALIDAR',
  },
];

export interface ReatividadeCruzada {
  /** Alergia registrada no paciente (comparada sem acento e sem plural). */
  alergia: string;
  etiqueta: string;
  texto: string;
  status: StatusValidacao;
}

export const REATIVIDADE_CRUZADA: readonly ReatividadeCruzada[] = [
  {
    alergia: 'penicilinas',
    etiqueta: 'cefalosporinas',
    texto: 'Paciente alérgico a penicilinas: possível reatividade cruzada com cefalosporinas.',
    status: 'A_VALIDAR',
  },
  {
    alergia: 'betalactamicos',
    etiqueta: 'betalactamicos',
    texto: 'Paciente alérgico a betalactâmicos.',
    status: 'A_VALIDAR',
  },
];
