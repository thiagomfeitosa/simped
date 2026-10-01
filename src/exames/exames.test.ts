import { describe, expect, it } from 'vitest';
import { casoDemonstracao } from '../casos/demonstracao';
import type { CasoClinico } from '../casos/tipos';
import { marcaDeReferencia, resultadoDoPedido } from './exames';

const caso: CasoClinico = {
  ...casoDemonstracao,
  resultadosExames: {
    hemograma: { valores: { hb: 12, leucocitos: 22000, plaquetas: 90000 }, status: 'A_VALIDAR' },
    'rx-torax': { laudo: 'Sem alterações.', status: 'A_VALIDAR' },
  },
};

describe('pedidos de exame', () => {
  it('fica aguardando até o tempo do exame passar (hemograma: 60 min)', () => {
    const pedido = { id: 1, exameId: 'hemograma', pedidoNoMinuto: 10 };
    expect(resultadoDoPedido(pedido, caso, 69)?.situacao).toBe('aguardando');
    const pronto = resultadoDoPedido(pedido, caso, 70)!;
    expect(pronto.situacao).toBe('pronto');
    expect(pronto.linhas.map((l) => [l.analito.id, l.valor, l.marca])).toEqual([
      ['hb', 12, ''],
      ['leucocitos', 22000, '↑'],
      ['plaquetas', 90000, '↓'],
    ]);
  });

  it('laudo em texto', () => {
    const r = resultadoDoPedido({ id: 2, exameId: 'rx-torax', pedidoNoMinuto: 0 }, caso, 30)!;
    expect(r.laudo).toBe('Sem alterações.');
    expect(r.semResultadoNoCaso).toBe(false);
  });

  it('exame sem resultado no caso', () => {
    const r = resultadoDoPedido({ id: 3, exameId: 'pcr', pedidoNoMinuto: 0 }, caso, 60)!;
    expect(r.semResultadoNoCaso).toBe(true);
  });

  it('exame desconhecido', () => {
    expect(resultadoDoPedido({ id: 4, exameId: 'nao-existe', pedidoNoMinuto: 0 }, caso, 60)).toBeNull();
  });

  it('marca de referência', () => {
    expect(marcaDeReferencia(5, { min: 3, max: 4 })).toBe('↑');
    expect(marcaDeReferencia(2, { min: 3 })).toBe('↓');
    expect(marcaDeReferencia(2, undefined)).toBe('');
  });
});
