import { describe, expect, it } from 'vitest';
import {
  concentracao,
  concentracaoFinalDiluicao,
  dosePorPeso,
  fatorCorrecaoBic,
  hollidaySegar,
  infusaoContinuaMlPorHora,
  vazaoMlPorHora,
  vig,
  volumeAAspirar,
} from './calculos';
import { fmt } from './formatacao';

describe('dose por peso', () => {
  it('multiplica a dose por kg pelo peso', () => {
    expect(dosePorPeso(4, 3).doseTotal).toBe(12);
  });
  it('respeita a dose máxima', () => {
    const r = dosePorPeso(0.01, 40, 0.3);
    expect(r.doseCalculada).toBe(0.4);
    expect(r.doseTotal).toBe(0.3);
    expect(r.limitadaPelaMaxima).toBe(true);
  });
  it('recusa peso zero ou negativo', () => {
    expect(() => dosePorPeso(4, 0)).toThrow();
  });
});

describe('volume a aspirar', () => {
  it('divide a dose pela concentração sem sujeira de ponto flutuante', () => {
    expect(volumeAAspirar(12, 40)).toBe(0.3);
    expect(volumeAAspirar(150, 100)).toBe(1.5);
  });
});

describe('diluição (C1 × V1 = C2 × V2)', () => {
  it('reconstituição: 500 mg em 5 mL = 100 mg/mL', () => {
    expect(concentracao(500, 5)).toBe(100);
  });
  it('adrenalina 1:10.000 = 1 mL de 1 mg/mL completado até 10 mL', () => {
    expect(concentracaoFinalDiluicao(1, 1, 10)).toBe(0.1);
  });
  it('não aceita volume final menor que o aspirado', () => {
    expect(() => concentracaoFinalDiluicao(1, 5, 2)).toThrow();
  });
});

describe('fator de correção da BIC (volume final 12 mL)', () => {
  it('exemplo do usuário: gentamicina 0,3 mL + 11,7 mL de SF', () => {
    const r = fatorCorrecaoBic(0.3, 12);
    expect(r.volumeSF).toBe(11.7);
    expect(r.concentracaoFinal).toBe(1);
    expect(r.aplicavel).toBe(true);
  });
  it('exemplo do usuário: NaCl 5 mL + 7 mL de SF', () => {
    expect(fatorCorrecaoBic(5, 17).volumeSF).toBe(7);
  });
  it('avisa quando a medicação passa do volume final', () => {
    expect(fatorCorrecaoBic(13, 10).aplicavel).toBe(false);
  });
  it('aceita outro volume final configurado pelo hospital', () => {
    expect(fatorCorrecaoBic(2, 10, 20).volumeSF).toBe(18);
  });
});

describe('vazão e glicose', () => {
  it('12 mL em 30 min = 24 mL/h', () => {
    expect(vazaoMlPorHora(12, 30)).toBe(24);
  });
  it('240 mL em 24 h = 10 mL/h', () => {
    expect(vazaoMlPorHora(240, 24 * 60)).toBe(10);
  });
  it('VIG: 10 mL/h de SG 10% em 3 kg ≈ 5,56 mg/kg/min', () => {
    expect(vig(10, 10, 3)).toBeCloseTo(5.5556, 4);
  });
  it('infusão contínua: 0,1 mcg/kg/min, 10 kg, 10 mcg/mL = 6 mL/h', () => {
    expect(infusaoContinuaMlPorHora(0.1, 10, 10)).toBe(6);
  });
});

describe('Holliday-Segar', () => {
  it('calcula as três faixas', () => {
    expect(hollidaySegar(8)).toBe(800);
    expect(hollidaySegar(15)).toBe(1250);
    expect(hollidaySegar(30)).toBe(1700);
  });
});

describe('formatação brasileira', () => {
  it('usa vírgula decimal', () => {
    expect(fmt(11.7)).toBe('11,7');
    expect(fmt(5.5556)).toBe('5,56');
    expect(fmt(1000)).toBe('1.000');
  });
});
