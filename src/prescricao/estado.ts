/**
 * Estado da folha de prescrição (sem tela): seções na ordem oficial e as ações do aluno.
 * Funções puras: recebem o estado e uma ação, devolvem o novo estado.
 */

import { type CamposMedicacao, camposVazios } from './itemMedicacao';
import { SECOES, type SecaoId } from './secoes';

export { type DefinicaoSecao, SECOES, type SecaoId } from './secoes';

/** Item escrito à mão (texto livre). */
export interface ItemTexto {
  id: number;
  tipo: 'texto';
  texto: string;
}

/** Item de medicação estruturado (medicação → apresentação → dose → via → intervalo). */
export interface ItemMedicacao {
  id: number;
  tipo: 'medicacao';
  campos: CamposMedicacao;
}

export type ItemPrescricao = ItemTexto | ItemMedicacao;

export interface EstadoPrescricao {
  itens: Record<SecaoId, ItemPrescricao[]>;
  proximoId: number;
}

export type AcaoPrescricao =
  | { tipo: 'adicionar'; secao: SecaoId; texto?: string }
  | { tipo: 'editar'; secao: SecaoId; id: number; texto: string }
  | { tipo: 'adicionarMedicacao'; secao: SecaoId; campos?: CamposMedicacao }
  | { tipo: 'editarMedicacao'; secao: SecaoId; id: number; campos: CamposMedicacao }
  | { tipo: 'remover'; secao: SecaoId; id: number }
  | { tipo: 'limpar' };

export function prescricaoVazia(): EstadoPrescricao {
  const itens = Object.fromEntries(SECOES.map((s) => [s.id, []])) as unknown as Record<SecaoId, ItemPrescricao[]>;
  return { itens, proximoId: 1 };
}

function incluir(estado: EstadoPrescricao, secao: SecaoId, item: ItemPrescricao): EstadoPrescricao {
  return {
    itens: { ...estado.itens, [secao]: [...estado.itens[secao], item] },
    proximoId: estado.proximoId + 1,
  };
}

function trocar(
  estado: EstadoPrescricao,
  secao: SecaoId,
  mudar: (item: ItemPrescricao) => ItemPrescricao,
): EstadoPrescricao {
  return { ...estado, itens: { ...estado.itens, [secao]: estado.itens[secao].map(mudar) } };
}

export function reduzirPrescricao(estado: EstadoPrescricao, acao: AcaoPrescricao): EstadoPrescricao {
  switch (acao.tipo) {
    case 'adicionar':
      return incluir(estado, acao.secao, { id: estado.proximoId, tipo: 'texto', texto: acao.texto ?? '' });
    case 'editar':
      return trocar(estado, acao.secao, (item) =>
        item.id === acao.id && item.tipo === 'texto' ? { ...item, texto: acao.texto } : item,
      );
    case 'adicionarMedicacao':
      return incluir(estado, acao.secao, {
        id: estado.proximoId,
        tipo: 'medicacao',
        campos: acao.campos ?? camposVazios(),
      });
    case 'editarMedicacao':
      return trocar(estado, acao.secao, (item) =>
        item.id === acao.id && item.tipo === 'medicacao' ? { ...item, campos: acao.campos } : item,
      );
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
