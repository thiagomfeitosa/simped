import { describe, expect, it } from 'vitest';
import { HOSPITAIS } from '../dados/hospitais';
import { lerDataHora } from '../paciente/variaveis';
import { MEDICACOES_EXEMPLO } from '../dados/medicacoes/exemplos-a-validar';
import { gerarAgenda, horariosDoIntervalo, itensParaAprazar, podeChecar, situacaoDaDose } from './aprazamento';
import { prescricaoVazia, reduzirPrescricao } from './estado';
import { camposVazios } from './itemMedicacao';

const santaCasa = HOSPITAIS.santaCasa;
const generico = HOSPITAIS.generico;

describe('horários do intervalo', () => {
  it('usa a lista do hospital (8/8h → 06, 14, 22 — A VALIDAR)', () => {
    expect(horariosDoIntervalo(8, santaCasa)).toEqual(['06:00', '14:00', '22:00']);
  });
  it('sem lista, gera a partir da hora inicial', () => {
    expect(horariosDoIntervalo(6, generico)).toEqual(['08:00', '14:00', '20:00', '02:00']);
  });
  it('intervalo que não divide 24 h não gera horários', () => {
    expect(horariosDoIntervalo(5, generico)).toEqual([]);
  });
});

describe('agenda do caso', () => {
  const inicio = lerDataHora('2026-10-01T08:00');

  it('8/8h começando às 08:00: 14:00 (360 min), 22:00 (840) e 06:00 do dia seguinte (1320)', () => {
    const agenda = gerarAgenda([{ itemId: 1, medicacaoId: 'x', descricao: 'X', intervalo: 8 }], inicio, 24 * 60, santaCasa);
    expect(agenda.map((d) => [d.minuto, d.hora])).toEqual([
      [360, '14:00'],
      [840, '22:00'],
      [1320, '06:00'],
    ]);
  });

  it('6/6h com "24:00" vira meia-noite', () => {
    const agenda = gerarAgenda([{ itemId: 1, medicacaoId: 'x', descricao: 'X', intervalo: 6 }], inicio, 24 * 60, santaCasa);
    expect(agenda.map((d) => d.hora)).toEqual(['12:00', '18:00', '00:00', '06:00']);
    expect(agenda[2]?.minuto).toBe(16 * 60);
  });

  it('dose única fica no início; infusão contínua não tem horário', () => {
    const agenda = gerarAgenda(
      [
        { itemId: 1, medicacaoId: 'x', descricao: 'A', intervalo: 'dose-unica' },
        { itemId: 2, medicacaoId: 'y', descricao: 'B', intervalo: 'continua' },
      ],
      inicio,
      600,
      santaCasa,
    );
    expect(agenda).toEqual([{ itemId: 1, medicacaoId: 'x', descricao: 'A', minuto: 0, hora: '08:00' }]);
  });

  it('ordena por horário misturando itens', () => {
    const agenda = gerarAgenda(
      [
        { itemId: 1, medicacaoId: 'x', descricao: 'A', intervalo: 12 },
        { itemId: 2, medicacaoId: 'y', descricao: 'B', intervalo: 8 },
      ],
      inicio,
      24 * 60,
      santaCasa,
    );
    expect(agenda.map((d) => `${d.hora}-${d.itemId}`)).toEqual(['08:00-1', '14:00-2', '20:00-1', '22:00-2', '06:00-2', '08:00-1']);
  });
});

describe('situação da dose', () => {
  const dose = { itemId: 1, medicacaoId: 'x', descricao: 'X', minuto: 360, hora: '14:00' };
  it('pendente, agora (±30 min), atrasada e feita', () => {
    expect(situacaoDaDose(dose, [], 300)).toBe('pendente');
    expect(situacaoDaDose(dose, [], 340)).toBe('agora');
    expect(situacaoDaDose(dose, [], 390)).toBe('agora');
    expect(situacaoDaDose(dose, [], 391)).toBe('atrasada');
    expect(situacaoDaDose(dose, [{ itemId: 1, minutoMarcado: 360, feitaNoMinuto: 365 }], 500)).toBe('feita');
  });
  it('só checa na hora ou atrasada', () => {
    expect(podeChecar('pendente')).toBe(false);
    expect(podeChecar('agora')).toBe(true);
    expect(podeChecar('atrasada')).toBe(true);
    expect(podeChecar('feita')).toBe(false);
  });
});

describe('itens da folha que entram no quadro', () => {
  it('só medicações com intervalo, com descrição curta', () => {
    let e = prescricaoVazia();
    e = reduzirPrescricao(e, {
      tipo: 'adicionarMedicacao',
      secao: 'medicacoes',
      campos: { ...camposVazios('dipirona'), dose: '240', unidadeDose: 'mg', via: 'EV', intervalo: 6 },
    });
    e = reduzirPrescricao(e, { tipo: 'adicionarMedicacao', secao: 'medicacoes', campos: camposVazios('adrenalina') });
    e = reduzirPrescricao(e, { tipo: 'adicionarSoro', secao: 'volemia' });
    const itens = itensParaAprazar(e, MEDICACOES_EXEMPLO);
    expect(itens).toEqual([{ itemId: 1, medicacaoId: 'dipirona', descricao: 'Dipirona 240 mg EV', intervalo: 6 }]);
  });
});
