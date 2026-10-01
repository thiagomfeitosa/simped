import { describe, expect, it } from 'vitest';
import {
  concentracao,
  concentracaoFinalDiluicao,
  deficitSodio,
  dividirEmProporcao,
  dosePorPeso,
  fatorCorrecaoBic,
  hollidaySegar,
  horasDeVida,
  infusaoContinuaMlPorHora,
  MG_POR_MEQ,
  meqPorKgPorHora,
  meqPorLitro,
  meqPorMl,
  percentualPerdaPeso,
  subidaEstimadaSodio,
  vazaoMlPorHora,
  vig,
  volumeAAspirar,
  volumeDoConcentrado,
  volumeMinimoDiluicao,
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

describe('eletrólitos (mEq)', () => {
  it('mEq/mL das apresentações mais usadas', () => {
    expect(meqPorMl(0.9, MG_POR_MEQ.NaCl)).toBeCloseTo(0.154, 3); // SF 0,9% = 154 mEq/L
    expect(meqPorMl(3, MG_POR_MEQ.NaCl)).toBeCloseTo(0.513, 3);
    expect(meqPorMl(20, MG_POR_MEQ.NaCl)).toBeCloseTo(3.42, 2);
    expect(meqPorMl(19.1, MG_POR_MEQ.KCl)).toBeCloseTo(2.56, 2);
    expect(meqPorMl(10, MG_POR_MEQ.KCl)).toBeCloseTo(1.34, 2);
  });
  it('concentração em mEq/L', () => {
    expect(meqPorLitro(8, 200)).toBe(40);
    expect(meqPorLitro(8, 12)).toBeCloseTo(666.67, 1);
  });
  it('volume mínimo para não passar da concentração máxima', () => {
    expect(volumeMinimoDiluicao(8, 40)).toBe(200);
  });
  it('déficit de sódio: (126 − 118) × 0,6 × 10 = 48 mEq', () => {
    expect(deficitSodio(126, 118, 10)).toBe(48);
    expect(() => deficitSodio(118, 126, 10)).toThrow();
  });
  it('subida estimada do sódio é o déficit ao contrário', () => {
    expect(subidaEstimadaSodio(48, 10)).toBe(8);
    expect(subidaEstimadaSodio(20 * meqPorMl(3, MG_POR_MEQ.NaCl), 10)).toBeCloseTo(1.71, 2);
  });
  it('mEq/kg/h', () => {
    expect(meqPorKgPorHora(8, 2, 16)).toBe(0.25);
  });
});

describe('diluição a partir do concentrado e proporções', () => {
  it('NaCl 3% a partir do 20%: 20 mL → 3 mL do concentrado', () => {
    expect(volumeDoConcentrado(20, 3, 20)).toBe(3);
    expect(volumeDoConcentrado(20, 3, 100)).toBe(15);
    expect(() => volumeDoConcentrado(3, 20, 10)).toThrow();
  });
  it('soro 4:1 e 1:1', () => {
    expect(dividirEmProporcao(1100, [4, 1])).toEqual([880, 220]);
    expect(dividirEmProporcao(600, [1, 1])).toEqual([300, 300]);
  });
});

describe('recém-nascido', () => {
  it('horas de vida', () => {
    expect(horasDeVida(2)).toBe(48);
    expect(horasDeVida(1, 12)).toBe(36);
    expect(() => horasDeVida(1, 24)).toThrow();
  });
  it('perda de peso em %', () => {
    expect(percentualPerdaPeso(3200, 2944)).toBe(8);
  });
});

describe('formatação brasileira', () => {
  it('usa vírgula decimal', () => {
    expect(fmt(11.7)).toBe('11,7');
    expect(fmt(5.5556)).toBe('5,56');
    expect(fmt(1000)).toBe('1.000');
  });
});
