import { describe, expect, it } from 'vitest';
import { numerarItens, prescricaoVazia, reduzirPrescricao, SECOES } from './estado';
import { camposVazios } from './itemMedicacao';
import { soroVazio } from './soro';

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
    expect(estado.itens.dieta).toEqual([{ id: 1, tipo: 'texto', texto: 'Dieta livre' }]);

    estado = reduzirPrescricao(estado, { tipo: 'editar', secao: 'cuidados', id: 2, texto: 'Sinais vitais 4/4h' });
    expect(estado.itens.cuidados[0]).toMatchObject({ texto: 'Sinais vitais 4/4h' });

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

  it('item de medicação estruturado: adiciona vazio e troca os campos', () => {
    let estado = reduzirPrescricao(prescricaoVazia(), { tipo: 'adicionarMedicacao', secao: 'medicacoes' });
    expect(estado.itens.medicacoes).toEqual([{ id: 1, tipo: 'medicacao', campos: camposVazios() }]);

    const campos = { ...camposVazios('dipirona'), dose: '240' };
    estado = reduzirPrescricao(estado, { tipo: 'editarMedicacao', secao: 'medicacoes', id: 1, campos });
    expect(estado.itens.medicacoes[0]).toEqual({ id: 1, tipo: 'medicacao', campos });
  });

  it('editar texto não mexe em item de medicação (e vice-versa)', () => {
    let estado = reduzirPrescricao(prescricaoVazia(), { tipo: 'adicionarMedicacao', secao: 'medicacoes' });
    estado = reduzirPrescricao(estado, { tipo: 'editar', secao: 'medicacoes', id: 1, texto: 'x' });
    expect(estado.itens.medicacoes[0]).toEqual({ id: 1, tipo: 'medicacao', campos: camposVazios() });

    estado = reduzirPrescricao(estado, { tipo: 'adicionar', secao: 'dieta', texto: 'Dieta livre' });
    estado = reduzirPrescricao(estado, { tipo: 'editarMedicacao', secao: 'dieta', id: 2, campos: camposVazios('x') });
    expect(estado.itens.dieta[0]).toEqual({ id: 2, tipo: 'texto', texto: 'Dieta livre' });
  });

  it('numeração mistura itens de texto e de medicação na ordem da folha', () => {
    let estado = reduzirPrescricao(prescricaoVazia(), { tipo: 'adicionarMedicacao', secao: 'medicacoes' });
    estado = reduzirPrescricao(estado, { tipo: 'adicionarMedicacao', secao: 'antimicrobianos' });
    estado = reduzirPrescricao(estado, { tipo: 'adicionar', secao: 'dieta' });
    const numeros = numerarItens(estado);
    expect([numeros.get(3), numeros.get(2), numeros.get(1)]).toEqual([1, 2, 3]);
  });

  it('limpar volta à folha vazia', () => {
    let estado = reduzirPrescricao(prescricaoVazia(), { tipo: 'adicionar', secao: 'dieta' });
    estado = reduzirPrescricao(estado, { tipo: 'limpar' });
    expect(estado).toEqual(prescricaoVazia());
  });
});

describe('item de soro', () => {
  it('adiciona, edita e numera junto com os outros itens', () => {
    let e = prescricaoVazia();
    e = reduzirPrescricao(e, { tipo: 'adicionarSoro', secao: 'volemia' });
    e = reduzirPrescricao(e, { tipo: 'adicionar', secao: 'dieta', texto: 'Dieta livre' });
    const soro = e.itens.volemia[0]!;
    expect(soro.tipo).toBe('soro');
    e = reduzirPrescricao(e, {
      tipo: 'editarSoro',
      secao: 'volemia',
      id: soro.id,
      campos: { ...soroVazio(), horas: '8' },
    });
    const editado = e.itens.volemia[0]!;
    expect(editado.tipo === 'soro' && editado.campos.horas).toBe('8');
    // dieta (seção 3) vem antes do soro (seção 4)
    expect(numerarItens(e).get(soro.id)).toBe(2);
  });
});
