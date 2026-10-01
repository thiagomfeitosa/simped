/**
 * Pontos de corte de idade e classificação do RN (docs/fase-0/faixas-etarias.md).
 * ⚠️ TUDO "A VALIDAR": tabela montada pelo assistente; o usuário confere no documento original.
 * Ficam aqui, isolados, para serem corrigidos sem mexer nas contas (src/paciente/variaveis.ts).
 */

import type { CodigoFonte, FaixaEtaria, StatusValidacao } from './medicacoes/tipos';

/** Fonte usada para dar NOME à faixa etária na tela. As doses nunca dependem do nome, só dos números. */
export type FonteDeFaixa = Extract<CodigoFonte, 'SBP' | 'MS' | 'AAP' | 'PALS'> | 'OMS';

export const FONTES_DE_FAIXA: readonly FonteDeFaixa[] = ['SBP', 'OMS', 'MS', 'AAP', 'PALS'];

/** Uma faixa: vale da idade mínima (inclusive) até a máxima (exclusive), em dias de vida. */
export interface FaixaNomeada {
  nome: string;
  /** Dias de vida completos (inclusive). */
  deDias: number;
  /** Dias de vida completos (exclusive). Vazio = sem limite. */
  ateDias?: number;
  /** PALS: a criança vira "adulto" na puberdade, não numa idade. */
  ateAPuberdade?: boolean;
}

const ANO = 365.25;

export interface TabelaDeFaixas {
  fonte: FonteDeFaixa;
  faixas: FaixaNomeada[];
  status: StatusValidacao;
  observacao?: string;
}

export const FAIXAS_POR_FONTE: Record<FonteDeFaixa, TabelaDeFaixas> = {
  SBP: {
    fonte: 'SBP',
    status: 'A_VALIDAR',
    faixas: [
      { nome: 'Recém-nascido', deDias: 0, ateDias: 28 },
      { nome: 'Lactente', deDias: 28, ateDias: 2 * ANO },
      { nome: 'Pré-escolar', deDias: 2 * ANO, ateDias: 7 * ANO },
      { nome: 'Escolar', deDias: 7 * ANO, ateDias: 10 * ANO },
      { nome: 'Adolescente', deDias: 10 * ANO, ateDias: 20 * ANO },
      { nome: 'Adulto', deDias: 20 * ANO },
    ],
  },
  OMS: {
    fonte: 'OMS',
    status: 'A_VALIDAR',
    faixas: [
      { nome: 'Neonato', deDias: 0, ateDias: 28 },
      { nome: 'Lactente', deDias: 28, ateDias: ANO },
      { nome: 'Criança', deDias: ANO, ateDias: 10 * ANO },
      { nome: 'Adolescente', deDias: 10 * ANO, ateDias: 20 * ANO },
      { nome: 'Adulto', deDias: 20 * ANO },
    ],
  },
  MS: {
    fonte: 'MS',
    status: 'A_VALIDAR',
    faixas: [
      { nome: 'Recém-nascido', deDias: 0, ateDias: 28 },
      { nome: 'Criança (< 1 ano)', deDias: 28, ateDias: ANO },
      { nome: 'Criança', deDias: ANO, ateDias: 10 * ANO },
      { nome: 'Adolescente', deDias: 10 * ANO, ateDias: 20 * ANO },
      { nome: 'Adulto', deDias: 20 * ANO },
    ],
  },
  AAP: {
    fonte: 'AAP',
    status: 'A_VALIDAR',
    faixas: [
      { nome: 'Neonato', deDias: 0, ateDias: 28 },
      { nome: 'Lactente (infancy)', deDias: 28, ateDias: ANO },
      { nome: 'Primeira infância', deDias: ANO, ateDias: 5 * ANO },
      { nome: 'Infância média', deDias: 5 * ANO, ateDias: 11 * ANO },
      { nome: 'Adolescente', deDias: 11 * ANO, ateDias: 22 * ANO },
      { nome: 'Adulto', deDias: 22 * ANO },
    ],
  },
  PALS: {
    fonte: 'PALS',
    status: 'A_VALIDAR',
    observacao: 'Depois da puberdade, o PALS manda usar o protocolo de adulto.',
    faixas: [
      { nome: 'Neonato', deDias: 0, ateDias: 28 },
      { nome: 'Lactente (infant)', deDias: 28, ateDias: ANO },
      { nome: 'Criança (child)', deDias: ANO, ateAPuberdade: true },
      { nome: 'Adulto (pós-puberdade)', deDias: ANO },
    ],
  },
};

/**
 * Faixa usada pelas regras de dose do banco ('RN' | 'crianca' | 'adolescente').
 * PROVISÓRIO, A VALIDAR: segue o doses-rascunho.md (criança = 28 dias a 11 anos; adolescente ≥ 12 anos).
 * Quando cada dose for reescrita com os números da sua fonte, esta tabela deixa de ser usada.
 */
export const FAIXA_DAS_DOSES = {
  rnAteDias: 28,
  adolescenteAPartirDeAnos: 12,
  status: 'A_VALIDAR' as StatusValidacao,
};

export function faixaDasDoses(idadeDias: number, idadeAnos: number): FaixaEtaria {
  if (idadeDias < FAIXA_DAS_DOSES.rnAteDias) return 'RN';
  if (idadeAnos >= FAIXA_DAS_DOSES.adolescenteAPartirDeAnos) return 'adolescente';
  return 'crianca';
}

/** Classificação pela idade gestacional ao nascer (OMS), em semanas completas. A VALIDAR. */
export const CLASSIFICACAO_IG: readonly { ateSemanas: number; nome: string }[] = [
  { ateSemanas: 28, nome: 'Pré-termo extremo' },
  { ateSemanas: 32, nome: 'Muito pré-termo' },
  { ateSemanas: 37, nome: 'Pré-termo moderado a tardio' },
  { ateSemanas: 42, nome: 'Termo' },
  { ateSemanas: Infinity, nome: 'Pós-termo' },
];

/** Classificação pelo peso ao nascer (OMS), em gramas. A VALIDAR. */
export const CLASSIFICACAO_PESO_NASCER: readonly { abaixoDeG: number; nome: string }[] = [
  { abaixoDeG: 1000, nome: 'Extremo baixo peso' },
  { abaixoDeG: 1500, nome: 'Muito baixo peso' },
  { abaixoDeG: 2500, nome: 'Baixo peso' },
  { abaixoDeG: Infinity, nome: 'Peso adequado (≥ 2.500 g)' },
];

/** Prematuro: IG ao nascer abaixo deste valor (semanas). */
export const PREMATURO_ABAIXO_DE_SEMANAS = 37;

/** Até que idade cronológica se mostra a idade corrigida do prematuro (anos). A VALIDAR (2 a 3 anos). */
export const IDADE_CORRIGIDA_ATE_ANOS = 3;

/** Termo de referência para a idade corrigida: 40 semanas. */
export const TERMO_SEMANAS = 40;
