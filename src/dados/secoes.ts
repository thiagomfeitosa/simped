import type { SecaoPrescricao } from './roteiros/tipos';

export interface InfoSecao {
  numero: number | null;
  nome: string;
  /** Cor da seção na trilha e na folha (variável CSS). */
  cor: string;
}

/** Ordem oficial da folha de prescrição (CLAUDE.md) + a etapa final de revisão. */
export const SECOES: Record<SecaoPrescricao, InfoSecao> = {
  identificacao: { numero: 1, nome: 'Identificação', cor: 'var(--secao-1)' },
  oxigenoterapia: { numero: 2, nome: 'Oxigenoterapia', cor: 'var(--secao-2)' },
  dieta: { numero: 3, nome: 'Dieta', cor: 'var(--secao-3)' },
  hidratacao: { numero: 4, nome: 'Reposição volêmica e glicose', cor: 'var(--secao-4)' },
  antimicrobianos: { numero: 5, nome: 'Antibióticos / antiparasitários / ARV', cor: 'var(--secao-5)' },
  demais: { numero: 6, nome: 'Demais medicações', cor: 'var(--secao-6)' },
  exames: { numero: 7, nome: 'Exames solicitados', cor: 'var(--secao-7)' },
  orientacoes: { numero: 8, nome: 'Orientações / cuidados', cor: 'var(--secao-8)' },
  sinan: { numero: 9, nome: 'Notificação SINAN', cor: 'var(--secao-9)' },
  revisao: { numero: null, nome: 'Revisão final', cor: 'var(--secao-revisao)' },
};

export const ORDEM_SECOES = Object.keys(SECOES) as SecaoPrescricao[];

/** Seções que aparecem na folha (a revisão não é uma seção da folha). */
export const SECOES_DA_FOLHA = ORDEM_SECOES.filter((s) => s !== 'revisao');
