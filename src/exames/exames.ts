/**
 * Pedidos de exame (sem tela): o resultado fica pronto depois do tempo do exame no relógio do caso,
 * com os valores que estão no arquivo do caso. Marca o que está fora da referência (A VALIDAR).
 */

import type { CasoClinico } from '../casos/tipos';
import { type Analito, type Exame, examePorId } from '../dados/exames';

export interface PedidoExame {
  id: number;
  exameId: string;
  pedidoNoMinuto: number;
}

export type SituacaoPedido = 'aguardando' | 'pronto';

export interface LinhaResultado {
  analito: Analito;
  valor: number;
  /** '↑' acima, '↓' abaixo, '' dentro (ou sem referência). */
  marca: '↑' | '↓' | '';
}

export interface ResultadoPedido {
  exame: Exame;
  situacao: SituacaoPedido;
  /** Minuto do caso em que o resultado sai. */
  prontoNoMinuto: number;
  /** Só quando pronto. */
  linhas: LinhaResultado[];
  laudo?: string;
  /** Pronto, mas o caso não tem resultado para este exame. */
  semResultadoNoCaso: boolean;
}

export function marcaDeReferencia(valor: number, referencia: Analito['referencia']): LinhaResultado['marca'] {
  if (!referencia) return '';
  if (referencia.min !== undefined && valor < referencia.min) return '↓';
  if (referencia.max !== undefined && valor > referencia.max) return '↑';
  return '';
}

export function resultadoDoPedido(pedido: PedidoExame, caso: CasoClinico, agoraMin: number): ResultadoPedido | null {
  const exame = examePorId(pedido.exameId);
  if (!exame) return null;
  const prontoNoMinuto = pedido.pedidoNoMinuto + exame.tempoResultadoMin;
  if (agoraMin < prontoNoMinuto) {
    return { exame, situacao: 'aguardando', prontoNoMinuto, linhas: [], semResultadoNoCaso: false };
  }
  const resultado = caso.resultadosExames?.[exame.id];
  const linhas: LinhaResultado[] = [];
  for (const analito of exame.analitos) {
    const valor = resultado?.valores?.[analito.id];
    if (valor !== undefined) linhas.push({ analito, valor, marca: marcaDeReferencia(valor, analito.referencia) });
  }
  return {
    exame,
    situacao: 'pronto',
    prontoNoMinuto,
    linhas,
    ...(resultado?.laudo !== undefined && { laudo: resultado.laudo }),
    semResultadoNoCaso: linhas.length === 0 && resultado?.laudo === undefined,
  };
}

/** Valores de um exame pronto como mapa (ex.: para a leitura da gasometria). */
export function valoresDoResultado(resultado: ResultadoPedido): Record<string, number> {
  return Object.fromEntries(resultado.linhas.map((l) => [l.analito.id, l.valor]));
}
