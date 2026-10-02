import { describe, expect, it } from 'vitest';
import { caso06 } from '../casos/clinicos/caso06-asma-grave';
import { COMPLICACOES } from '../dados/complicacoes';
import { valoresNaColeta } from './laboratorio';
import { fio2DoDispositivo } from './oxigenacao';
import { type EventoPaciente, iniciarPaciente, reproduzirEventos, sinaisVistos } from './paciente';

const cateter: EventoPaciente = { tipo: 'oxigenio', oxigenio: { dispositivo: 'cateter', fluxoLMin: 2, fio2: fio2DoDispositivo('cateter', 2) }, descricao: 'Cateter nasal 2 L/min' };
const apneia = COMPLICACOES.find((c) => c.id === 'apneia')!;

describe('oxigênio no motor do paciente', () => {
  it('em ar ambiente a SpO₂ vista é a do caso; com cateter, sobe (a do caso continua "em ar ambiente")', () => {
    const inicio = iniciarPaciente(caso06);
    expect(sinaisVistos(inicio).spo2).toBeCloseTo(inicio.sinais.spo2, 1);
    const com = reproduzirEventos(caso06, [cateter]);
    expect(com.sinais.spo2).toBe(inicio.sinais.spo2);
    expect(sinaisVistos(com).spo2).toBeGreaterThan(inicio.sinais.spo2 + 2);
    expect(com.registro.at(-1)!.descricao).toBe('Oxigênio: Cateter nasal 2 L/min');
  });

  it('apneia: a bolsa ventila (padrão "assistida", FR 20) e, ao tirar, volta a apneia', () => {
    const emApneia: EventoPaciente[] = [{ tipo: 'complicacao', nome: apneia.nome, mudancas: apneia.mudancas, ...(apneia.clinico && { clinico: apneia.clinico }) }, { tipo: 'tempoPassou', minutos: 3 }];
    const mascara = reproduzirEventos(caso06, [...emApneia, { tipo: 'oxigenio', oxigenio: { dispositivo: 'mascara-reservatorio', fio2: 0.9 }, descricao: 'Máscara' }]);
    expect(sinaisVistos(mascara).spo2).toBeCloseTo(mascara.sinais.spo2, 1);
    const bolsa = reproduzirEventos(caso06, [...emApneia, { tipo: 'oxigenio', oxigenio: { dispositivo: 'bolsa', fluxoLMin: 15, fio2: 1 }, descricao: 'Bolsa' }]);
    expect(bolsa.clinico.padraoRespiratorio).toBe('assistida');
    expect(bolsa.sinais.fr).toBe(20);
    expect(sinaisVistos(bolsa).spo2).toBeGreaterThan(95);
    const tirou = reproduzirEventos(caso06, [...emApneia, { tipo: 'oxigenio', oxigenio: { dispositivo: 'bolsa', fluxoLMin: 15, fio2: 1 }, descricao: 'Bolsa' }, { tipo: 'oxigenio', oxigenio: { dispositivo: 'ar', fio2: 0.21 }, descricao: 'Ar' }]);
    expect(tirou.clinico.padraoRespiratorio).toBe('apneia');
  });

  it('gasometria arterial colhida com O₂: pO₂ e SatO₂ maiores', () => {
    const ar = valoresNaColeta('gasometria-arterial', caso06, iniciarPaciente(caso06));
    const com = valoresNaColeta('gasometria-arterial', caso06, reproduzirEventos(caso06, [cateter]));
    expect(com.po2!).toBeGreaterThan(ar.po2 ?? 0);
    if (ar.sato2 !== undefined) expect(com.sato2!).toBeGreaterThan(ar.sato2);
    // o caso só tem gasometria venosa: a arterial com O₂ sai completa (pCO₂ ajustada da venosa: 48 − 6 = 42)
    expect(com).toMatchObject({ pco2: 42, hco3: 23 });
    expect(com.ph).toBeDefined();
  });
});
