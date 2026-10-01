/**
 * Seções da folha de prescrição, na ordem oficial do CLAUDE.md.
 */

export type SecaoId =
  | 'oxigenoterapia'
  | 'dieta'
  | 'volemia'
  | 'antimicrobianos'
  | 'medicacoes'
  | 'exames'
  | 'cuidados'
  | 'sinan';

export interface DefinicaoSecao {
  id: SecaoId;
  numero: number;
  titulo: string;
  /** Só entra quando se aplica ao caso. */
  seAplicavel?: boolean;
  /** Aceita item de medicação estruturado (seções 4, 5 e 6). */
  aceitaMedicacao?: boolean;
}

/** Seções 2 a 9 (a 1, identificação, vem do paciente). */
export const SECOES: readonly DefinicaoSecao[] = [
  { id: 'oxigenoterapia', numero: 2, titulo: 'Oxigenoterapia', seAplicavel: true },
  { id: 'dieta', numero: 3, titulo: 'Dieta' },
  { id: 'volemia', numero: 4, titulo: 'Reposição volêmica e glicose', aceitaMedicacao: true },
  { id: 'antimicrobianos', numero: 5, titulo: 'Antibióticos / antiparasitários / ARV', aceitaMedicacao: true },
  { id: 'medicacoes', numero: 6, titulo: 'Demais medicações', aceitaMedicacao: true },
  { id: 'exames', numero: 7, titulo: 'Exames solicitados' },
  { id: 'cuidados', numero: 8, titulo: 'Orientações / cuidados' },
  { id: 'sinan', numero: 9, titulo: 'Notificação SINAN', seAplicavel: true },
];
