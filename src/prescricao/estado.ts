/**
 * Estado da folha de prescrição (sem tela): seções na ordem oficial e as ações do aluno.
 * Funções puras: recebem o estado e uma ação, devolvem o novo estado.
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
}

/** Seções 2 a 9 (a 1, identificação, vem do paciente). Ordem do CLAUDE.md. */
export const SECOES: readonly DefinicaoSecao[] = [
  { id: 'oxigenoterapia', numero: 2, titulo: 'Oxigenoterapia', seAplicavel: true },
  { id: 'dieta', numero: 3, titulo: 'Dieta' },
  { id: 'volemia', numero: 4, titulo: 'Reposição volêmica e glicose' },
  { id: 'antimicrobianos', numero: 5, titulo: 'Antibióticos / antiparasitários / ARV' },
  { id: 'medicacoes', numero: 6, titulo: 'Demais medicações' },
  { id: 'exames', numero: 7, titulo: 'Exames solicitados' },
  { id: 'cuidados', numero: 8, titulo: 'Orientações / cuidados' },
  { id: 'sinan', numero: 9, titulo: 'Notificação SINAN', seAplicavel: true },
];

export interface ItemPrescricao {
  id: number;
  texto: string;
}

export interface EstadoPrescricao {
  itens: Record<SecaoId, ItemPrescricao[]>;
  proximoId: number;
}

export type AcaoPrescricao =
  | { tipo: 'adicionar'; secao: SecaoId; texto?: string }
  | { tipo: 'editar'; secao: SecaoId; id: number; texto: string }
  | { tipo: 'remover'; secao: SecaoId; id: number }
  | { tipo: 'limpar' };

export function prescricaoVazia(): EstadoPrescricao {
  const itens = Object.fromEntries(SECOES.map((s) => [s.id, []])) as unknown as Record<SecaoId, ItemPrescricao[]>;
  return { itens, proximoId: 1 };
}

export function reduzirPrescricao(estado: EstadoPrescricao, acao: AcaoPrescricao): EstadoPrescricao {
  switch (acao.tipo) {
    case 'adicionar':
      return {
        itens: {
          ...estado.itens,
          [acao.secao]: [...estado.itens[acao.secao], { id: estado.proximoId, texto: acao.texto ?? '' }],
        },
        proximoId: estado.proximoId + 1,
      };
    case 'editar':
      return {
        ...estado,
        itens: {
          ...estado.itens,
          [acao.secao]: estado.itens[acao.secao].map((item) =>
            item.id === acao.id ? { ...item, texto: acao.texto } : item,
          ),
        },
      };
    case 'remover':
      return {
        ...estado,
        itens: {
          ...estado.itens,
          [acao.secao]: estado.itens[acao.secao].filter((item) => item.id !== acao.id),
        },
      };
    case 'limpar':
      return prescricaoVazia();
  }
}

/** Numeração contínua dos itens na folha (1, 2, 3...), seguindo a ordem das seções. */
export function numerarItens(estado: EstadoPrescricao): Map<number, number> {
  const numeros = new Map<number, number>();
  let n = 1;
  for (const secao of SECOES) {
    for (const item of estado.itens[secao.id]) numeros.set(item.id, n++);
  }
  return numeros;
}
