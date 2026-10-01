import { describe, expect, it } from 'vitest';
import { numerarItens, prescricaoVazia, reduzirPrescricao, SECOES } from './estado';

describe('folha de prescrição', () => {
  it('tem as seções 2 a 9 na ordem oficial', () => {
    expect(SECOES.map((s) => s.numero)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('começa vazia', () => {
    const estado = prescricaoVazia();
    expect(Object.values(estado.itens).every((lista) => lista.length === 0)).toBe(true);
  });

  it('adiciona, edita e remove itens', () => {
    let estado = prescricaoVazia();
    estado = reduzirPrescricao(estado, { tipo: 'adicionar', secao: 'dieta', texto: 'Dieta livre' });
    estado = reduzirPrescricao(estado, { tipo: 'adicionar', secao: 'cuidados' });
    expect(estado.itens.dieta).toEqual([{ id: 1, texto: 'Dieta livre' }]);

    estado = reduzirPrescricao(estado, { tipo: 'editar', secao: 'cuidados', id: 2, texto: 'Sinais vitais 4/4h' });
    expect(estado.itens.cuidados[0]?.texto).toBe('Sinais vitais 4/4h');

    estado = reduzirPrescricao(estado, { tipo: 'remover', secao: 'dieta', id: 1 });
    expect(estado.itens.dieta).toEqual([]);
  });

  it('numera os itens na ordem da folha, não na ordem em que foram escritos', () => {
    let estado = prescricaoVazia();
    estado = reduzirPrescricao(estado, { tipo: 'adicionar', secao: 'cuidados', texto: 'escrito primeiro' });
    estado = reduzirPrescricao(estado, { tipo: 'adicionar', secao: 'dieta', texto: 'escrito depois' });
    const numeros = numerarItens(estado);
    expect(numeros.get(2)).toBe(1); // dieta (seção 3) vem antes
    expect(numeros.get(1)).toBe(2); // cuidados (seção 8)
  });

  it('limpar volta à folha vazia', () => {
    let estado = reduzirPrescricao(prescricaoVazia(), { tipo: 'adicionar', secao: 'dieta' });
    estado = reduzirPrescricao(estado, { tipo: 'limpar' });
    expect(estado).toEqual(prescricaoVazia());
  });
});
