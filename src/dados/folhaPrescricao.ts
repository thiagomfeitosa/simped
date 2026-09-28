/** Ordem oficial das seções da folha de prescrição (ver CLAUDE.md). */
export interface SecaoFolha {
  id: string;
  titulo: string;
  /** Seção que só aparece em alguns casos. */
  seAplicavel?: boolean;
}

export const SECOES_FOLHA: SecaoFolha[] = [
  { id: 'identificacao', titulo: 'Identificação do paciente' },
  { id: 'oxigenoterapia', titulo: 'Oxigenoterapia', seAplicavel: true },
  { id: 'dieta', titulo: 'Dieta' },
  { id: 'volume-glicose', titulo: 'Reposição volêmica e glicose' },
  { id: 'antimicrobianos', titulo: 'Antibióticos / antiparasitários / ARV' },
  { id: 'demais', titulo: 'Demais medicações' },
  { id: 'exames', titulo: 'Exames solicitados' },
  { id: 'orientacoes', titulo: 'Orientações / cuidados' },
  { id: 'sinan', titulo: 'Notificação SINAN', seAplicavel: true },
];
