/**
 * Seções da folha de prescrição, na ordem oficial (CLAUDE.md).
 * LISTA ÚNICA: o Passo a passo, o Prescrever, o editor de casos e o relatório usam todos esta mesma lista.
 */

/** As 9 seções da folha. */
export type SecaoDaFolha =
  | 'identificacao'
  | 'oxigenoterapia'
  | 'dieta'
  | 'volemia'
  | 'antimicrobianos'
  | 'medicacoes'
  | 'exames'
  | 'cuidados'
  | 'sinan';

/** Seções em que o aluno escreve (2 a 9). A 1, identificação, vem do paciente. */
export type SecaoId = Exclude<SecaoDaFolha, 'identificacao'>;

/** Etapas do Passo a passo que não são seções da folha: a revisão e a prescrição com os cálculos. */
export type EtapaExtra = 'revisao' | 'final';

/** Onde uma etapa do Passo a passo acontece: uma seção da folha ou uma etapa extra. */
export type SecaoPrescricao = SecaoDaFolha | EtapaExtra;

export interface DefinicaoSecao<Id extends string = SecaoId> {
  id: Id;
  numero: number;
  titulo: string;
  /** Cor da seção na trilha e na folha (variável CSS). */
  cor: string;
  /** Só entra quando se aplica ao caso. */
  seAplicavel?: boolean;
  /** Aceita item de medicação estruturado (seções 4, 5 e 6). */
  aceitaMedicacao?: boolean;
}

/** As 9 seções, na ordem oficial. */
export const SECOES_DA_FOLHA: readonly DefinicaoSecao<SecaoDaFolha>[] = [
  { id: 'identificacao', numero: 1, titulo: 'Identificação', cor: 'var(--secao-1)' },
  { id: 'oxigenoterapia', numero: 2, titulo: 'Oxigenoterapia', cor: 'var(--secao-2)', seAplicavel: true },
  { id: 'dieta', numero: 3, titulo: 'Dieta', cor: 'var(--secao-3)' },
  {
    id: 'volemia',
    numero: 4,
    titulo: 'Reposição volêmica, glicose e eletrólitos',
    cor: 'var(--secao-4)',
    aceitaMedicacao: true,
  },
  {
    id: 'antimicrobianos',
    numero: 5,
    titulo: 'Antibióticos / antiparasitários / ARV',
    cor: 'var(--secao-5)',
    aceitaMedicacao: true,
  },
  { id: 'medicacoes', numero: 6, titulo: 'Demais medicações', cor: 'var(--secao-6)', aceitaMedicacao: true },
  { id: 'exames', numero: 7, titulo: 'Exames solicitados', cor: 'var(--secao-7)' },
  { id: 'cuidados', numero: 8, titulo: 'Orientações / cuidados', cor: 'var(--secao-8)' },
  { id: 'sinan', numero: 9, titulo: 'Notificação SINAN', cor: 'var(--secao-9)', seAplicavel: true },
];

/** Seções 2 a 9, onde o aluno escreve. */
export const SECOES: readonly DefinicaoSecao<SecaoId>[] = SECOES_DA_FOLHA.filter(
  (s): s is DefinicaoSecao<SecaoId> => s.id !== 'identificacao',
);

/** Ids das 9 seções, na ordem. */
export const ORDEM_DA_FOLHA: readonly SecaoDaFolha[] = SECOES_DA_FOLHA.map((s) => s.id);

export interface InfoSecao {
  /** Número na folha; as etapas extras não têm número. */
  numero: number | null;
  nome: string;
  cor: string;
}

/** Nome, número e cor de qualquer seção ou etapa extra (usado pelo Passo a passo). */
export const INFO_SECAO: Record<SecaoPrescricao, InfoSecao> = {
  ...(Object.fromEntries(SECOES_DA_FOLHA.map((s) => [s.id, { numero: s.numero, nome: s.titulo, cor: s.cor }])) as Record<
    SecaoDaFolha,
    InfoSecao
  >),
  revisao: { numero: null, nome: 'Revisão final', cor: 'var(--secao-revisao)' },
  final: { numero: null, nome: 'Prescrição com os cálculos', cor: 'var(--secao-final)' },
};
