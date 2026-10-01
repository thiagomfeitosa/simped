// Números ilustrativos para testar a matemática: NÃO são doses clínicas.
import { describe, expect, it } from 'vitest';
import { concentracao, doseTotal, volumeAspirar } from './dose';
import { ErroDeCalculo } from './validacao';

describe('dose total por peso', () => {
  it('multiplica a dose por kg pelo peso (10 mg/kg × 3,5 kg = 35 mg)', () => {
    expect(doseTotal({ dosePorKg: 10, pesoKg: 3.5 })).toEqual({
      dose: 35,
      doseCalculada: 35,
      limitadaPelaMaxima: false,
    });
  });

  it('limita à dose máxima e avisa (50 mg/kg × 30 kg = 1500, máx 1000 → 1000)', () => {
    expect(doseTotal({ dosePorKg: 50, pesoKg: 30, doseMaxima: 1000 })).toEqual({
      dose: 1000,
      doseCalculada: 1500,
      limitadaPelaMaxima: true,
    });
  });

  it('não avisa quando a dose calculada é exatamente a máxima', () => {
    expect(doseTotal({ dosePorKg: 50, pesoKg: 20, doseMaxima: 1000 }).limitadaPelaMaxima).toBe(false);
  });

  it('recusa peso zero, negativo ou vazio', () => {
    expect(() => doseTotal({ dosePorKg: 10, pesoKg: 0 })).toThrow(ErroDeCalculo);
    expect(() => doseTotal({ dosePorKg: 10, pesoKg: -3 })).toThrow('Peso');
    expect(() => doseTotal({ dosePorKg: 10, pesoKg: Number.NaN })).toThrow(ErroDeCalculo);
  });
});

describe('volume a aspirar', () => {
  it('divide a dose pela concentração (35 mg ÷ 40 mg/mL = 0,875 mL)', () => {
    expect(volumeAspirar({ dose: 35, concentracao: 40 })).toBeCloseTo(0.875, 10);
  });

  it('funciona com UI (150.000 UI ÷ 100.000 UI/mL = 1,5 mL)', () => {
    expect(volumeAspirar({ dose: 150_000, concentracao: 100_000 })).toBeCloseTo(1.5, 10);
  });

  it('recusa concentração zero', () => {
    expect(() => volumeAspirar({ dose: 35, concentracao: 0 })).toThrow('Concentração');
  });
});

describe('concentração (ex.: reconstituição de um pó)', () => {
  it('500 mg em 5 mL = 100 mg/mL', () => {
    expect(concentracao({ quantidade: 500, volumeMl: 5 })).toBe(100);
  });
});
