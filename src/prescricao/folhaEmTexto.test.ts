import { describe, expect, it } from 'vitest';
import { BANCO_MEDICACOES } from '../dados/medicacoes';
import { prescricaoVazia, reduzirPrescricao } from './estado';
import { folhaEmTexto } from './folhaEmTexto';

describe('folha em texto', () => {
  it('numera os itens na ordem das seções', () => {
    let e = prescricaoVazia();
    e = reduzirPrescricao(e, { tipo: 'adicionar', secao: 'cuidados', texto: 'Cabeceira elevada' });
    e = reduzirPrescricao(e, { tipo: 'adicionar', secao: 'dieta', texto: 'Jejum' });
    e = reduzirPrescricao(e, { tipo: 'adicionarMedicacao', secao: 'medicacoes' });
    const folha = folhaEmTexto(e, BANCO_MEDICACOES);
    expect(folha).toHaveLength(8);
    expect(folha.find((s) => s.numero === 3)!.itens).toEqual([{ numero: 1, texto: 'Jejum' }]);
    expect(folha.find((s) => s.numero === 6)!.itens[0]).toEqual({ numero: 2, texto: '(medicação ainda incompleta)' });
    expect(folha.find((s) => s.numero === 8)!.itens[0]!.numero).toBe(3);
  });
});
