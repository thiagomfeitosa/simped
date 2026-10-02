import { describe, expect, it } from 'vitest';
import { AR_AMBIENTE, fio2DoDispositivo, oxigenar, po2Alveolar, po2DaSaturacao, saturacaoDaPo2 } from './oxigenacao';

describe('oxigenoterapia (modelo didático, A VALIDAR)', () => {
  it('curva da hemoglobina: pO₂ 100 → ~97,5%; pO₂ 60 → ~90%; ida e volta batem', () => {
    expect(saturacaoDaPo2(100)).toBeCloseTo(97.7, 0);
    expect(saturacaoDaPo2(60)).toBeCloseTo(90.6, 0);
    expect(po2DaSaturacao(saturacaoDaPo2(55))).toBeCloseTo(55, 1);
  });
  it('gás alveolar: ar ambiente com pCO₂ 40 ≈ 100 mmHg', () => {
    expect(po2Alveolar(0.21, 40)).toBeCloseTo(99.7, 1);
  });
  it('FiO₂ pelo dispositivo e fluxo', () => {
    expect(fio2DoDispositivo('ar')).toBe(0.21);
    expect(fio2DoDispositivo('cateter', 2)).toBeCloseTo(0.29, 5);
    expect(fio2DoDispositivo('cateter', 9)).toBeCloseTo(0.37, 5); // fluxo acima do máximo do cateter
    expect(fio2DoDispositivo('mascara-reservatorio', 15)).toBeCloseTo(0.9, 5);
    expect(fio2DoDispositivo('ventilador', undefined, 0.5)).toBe(0.5);
  });
  it('ar ambiente não muda nada; cateter sobe a SpO₂ de quem tem 88%', () => {
    expect(oxigenar({ spo2Ar: 88, oxigenio: AR_AMBIENTE, pco2: 40, padrao: 'desconforto' }).spo2).toBeCloseTo(88, 5);
    const cateter = oxigenar({ spo2Ar: 88, oxigenio: { dispositivo: 'cateter', fio2: fio2DoDispositivo('cateter', 2) }, pco2: 40, padrao: 'desconforto' });
    expect(cateter.spo2).toBeGreaterThan(92);
    const reservatorio = oxigenar({ spo2Ar: 88, oxigenio: { dispositivo: 'mascara-reservatorio', fio2: 0.9 }, pco2: 40, padrao: 'desconforto' });
    expect(reservatorio.spo2).toBeGreaterThan(cateter.spo2);
    expect(reservatorio.po2).toBeGreaterThan(cateter.po2);
  });
  it('apneia: máscara não adianta; a bolsa (ventilando) adianta', () => {
    const mascara = oxigenar({ spo2Ar: 70, oxigenio: { dispositivo: 'mascara-reservatorio', fio2: 0.9 }, pco2: 60, padrao: 'apneia' });
    expect(mascara).toMatchObject({ spo2: 70, semEfeito: true });
    const bolsa = oxigenar({ spo2Ar: 70, oxigenio: { dispositivo: 'bolsa', fio2: 1 }, pco2: 60, padrao: 'apneia' });
    expect(bolsa.spo2).toBeGreaterThan(95);
  });
});
