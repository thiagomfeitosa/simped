import { describe, expect, it } from 'vitest';
import type { SinaisVitais } from '../casos/tipos';
import { alarmesAtivos, ecg, limitesParaIdade, pletismografia } from './monitor';

const normais: SinaisVitais = { fc: 110, fr: 24, spo2: 98, paSistolica: 100, paDiastolica: 60, temperaturaC: 36.8, glicemiaMgDl: 90 };

describe('limites por idade (A VALIDAR)', () => {
  it('escolhe a faixa pela idade em dias', () => {
    expect(limitesParaIdade(5).nome).toBe('RN');
    expect(limitesParaIdade(200).nome).toBe('Lactente < 1 ano');
    expect(limitesParaIdade(4 * 365).nome).toBe('3 a 6 anos');
    expect(limitesParaIdade(20 * 365).nome).toBe('12 anos ou mais');
  });
});

describe('alarmes', () => {
  it('nada fora do limite, nenhum alarme', () => {
    expect(alarmesAtivos(normais, limitesParaIdade(4 * 365))).toEqual([]);
  });
  it('febre, taquicardia e dessaturação', () => {
    const alarmes = alarmesAtivos({ ...normais, fc: 170, spo2: 88, temperaturaC: 39.2 }, limitesParaIdade(4 * 365));
    expect(alarmes.map((a) => a.texto)).toEqual(['FC ALTA', 'SpO₂ BAIXA', 'Temperatura ALTA']);
  });
  it('a mesma FC é normal no RN e alta no adolescente', () => {
    expect(alarmesAtivos({ ...normais, fc: 150, fr: 40 }, limitesParaIdade(10))).toEqual([]);
    expect(alarmesAtivos({ ...normais, fc: 150 }, limitesParaIdade(15 * 365))[0]?.texto).toBe('FC ALTA');
  });
});

describe('traçados', () => {
  it('ECG repete a cada batimento e tem o pico R perto de 1 mV', () => {
    const periodo = 60 / 75;
    for (const t of [0.05, 0.22, 0.4, 0.61]) expect(ecg(t, 75)).toBeCloseTo(ecg(t + periodo, 75), 10);
    expect(ecg(0.22, 75)).toBeGreaterThan(0.9);
    expect(Math.abs(ecg(0.7, 75))).toBeLessThan(0.05);
  });
  it('na taquicardia as ondas encolhem, mas o R continua alto', () => {
    const periodo = 60 / 200;
    const r = 0.22 * (periodo / 0.75);
    expect(ecg(r, 200)).toBeGreaterThan(0.9);
  });
  it('pletismografia entre 0 e ~1,1 e periódica', () => {
    for (let t = 0; t < 2; t += 0.01) {
      const v = pletismografia(t, 120);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1.2);
      expect(v).toBeCloseTo(pletismografia(t + 0.5, 120), 10);
    }
  });
  it('FC zero: linha reta', () => {
    expect(ecg(0.3, 0)).toBe(0);
  });
});
