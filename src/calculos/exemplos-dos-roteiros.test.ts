/**
 * Os exemplos que antes testavam as fórmulas próprias do Passo a passo (src/logica/calculos.ts, removido).
 * Hoje o Passo a passo e o Prescrever usam o mesmo motor: estes números garantem que nada mudou.
 */
import { describe, expect, it } from 'vitest';
import {
  concentracao,
  deficitDeSodio,
  diluir,
  dividirEmProporcao,
  doseTotal,
  hollidaySegarMlDia,
  horasDeVida,
  MG_POR_MEQ,
  meqPorKgPorHora,
  meqPorLitro,
  meqPorMl,
  percentualPerdaPeso,
  prepararSeringaBic,
  subidaEstimadaSodio,
  vazaoDoVolume,
  vazaoMlPorHora,
  vig,
  volumeAspirar,
  volumeMinimoDiluicao,
  volumeParaConcentracaoDesejada,
} from '.';

describe('dose por peso', () => {
  it('multiplica a dose por kg pelo peso', () => {
    expect(doseTotal({ dosePorKg: 4, pesoKg: 3 }).dose).toBe(12);
  });
  it('respeita a dose máxima', () => {
    const r = doseTotal({ dosePorKg: 0.01, pesoKg: 40, doseMaxima: 0.3 });
    expect(r.doseCalculada).toBeCloseTo(0.4, 10);
    expect(r.dose).toBe(0.3);
    expect(r.limitadaPelaMaxima).toBe(true);
  });
  it('recusa peso zero', () => {
    expect(() => doseTotal({ dosePorKg: 4, pesoKg: 0 })).toThrow();
  });
});

describe('volume a aspirar e diluição', () => {
  it('divide a dose pela concentração', () => {
    expect(volumeAspirar({ dose: 12, concentracao: 40 })).toBeCloseTo(0.3, 10);
    expect(volumeAspirar({ dose: 150, concentracao: 100 })).toBe(1.5);
  });
  it('reconstituição: 500 mg em 5 mL = 100 mg/mL', () => {
    expect(concentracao({ quantidade: 500, volumeMl: 5 })).toBe(100);
  });
  it('adrenalina 1:10.000 = 1 mL de 1 mg/mL completado até 10 mL', () => {
    expect(diluir({ concentracaoInicial: 1, volumeAspiradoMl: 1, volumeFinalMl: 10 }).concentracaoFinal).toBe(0.1);
  });
  it('NaCl 3% a partir do 20%: 20 mL → 3 mL do concentrado', () => {
    const v = (c2: number, v2: number) =>
      volumeParaConcentracaoDesejada({ concentracaoInicial: 20, concentracaoDesejada: c2, volumeFinalMl: v2 }).volumeAspiradoMl;
    expect(v(3, 20)).toBeCloseTo(3, 10);
    expect(v(3, 100)).toBeCloseTo(15, 10);
    expect(() => v(30, 10)).toThrow();
  });
});

describe('fator de correção da BIC (volume final 12 mL)', () => {
  it('exemplo do usuário: gentamicina 0,3 mL + 11,7 mL de SF', () => {
    const r = prepararSeringaBic({ volumeMedicacaoMl: 0.3, volumeFinalMl: 12, quantidadeDeDroga: 12 });
    expect(r.aplicavel && r.volumeSoroMl).toBeCloseTo(11.7, 10);
    expect(r.aplicavel && r.concentracaoFinal).toBe(1);
  });
  it('avisa quando a medicação passa do volume final', () => {
    expect(prepararSeringaBic({ volumeMedicacaoMl: 13, volumeFinalMl: 12 }).aplicavel).toBe(false);
  });
});

describe('vazão e glicose', () => {
  it('12 mL em 30 min = 24 mL/h; 240 mL em 24 h = 10 mL/h', () => {
    expect(vazaoDoVolume(12, 30)).toBe(24);
    expect(vazaoDoVolume(240, 24 * 60)).toBe(10);
  });
  it('VIG: 10 mL/h de SG 10% em 3 kg ≈ 5,56 mg/kg/min', () => {
    expect(vig({ vazaoMlPorHora: 10, concentracaoGlicosePct: 10, pesoKg: 3 })).toBeCloseTo(5.5556, 4);
  });
  it('infusão contínua: 0,1 mcg/kg/min, 10 kg, 10 mcg/mL = 6 mL/h', () => {
    expect(vazaoMlPorHora({ dosePorKg: 0.1, pesoKg: 10, concentracao: 10, por: 'min' })).toBeCloseTo(6, 10);
  });
  it('Holliday-Segar nas três faixas', () => {
    expect(hollidaySegarMlDia(8)).toBe(800);
    expect(hollidaySegarMlDia(15)).toBe(1250);
    expect(hollidaySegarMlDia(30)).toBe(1700);
  });
  it('soro 4:1 e 1:1', () => {
    expect(dividirEmProporcao(1100, [4, 1])).toEqual([880, 220]);
    expect(dividirEmProporcao(600, [1, 1])).toEqual([300, 300]);
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
  it('concentração em mEq/L e volume mínimo', () => {
    expect(meqPorLitro(8, 200)).toBe(40);
    expect(meqPorLitro(8, 12)).toBeCloseTo(666.67, 1);
    expect(volumeMinimoDiluicao(8, 40)).toBe(200);
  });
  it('déficit de sódio: (126 − 118) × 0,6 × 10 = 48 mEq', () => {
    expect(deficitDeSodio({ sodioDesejado: 126, sodioAtual: 118, pesoKg: 10 })).toBeCloseTo(48, 10);
    expect(() => deficitDeSodio({ sodioDesejado: 118, sodioAtual: 126, pesoKg: 10 })).toThrow();
  });
  it('subida estimada do sódio é o déficit ao contrário', () => {
    expect(subidaEstimadaSodio(48, 10)).toBeCloseTo(8, 10);
    expect(subidaEstimadaSodio(20 * meqPorMl(3, MG_POR_MEQ.NaCl), 10)).toBeCloseTo(1.71, 2);
  });
  it('mEq/kg/h', () => {
    expect(meqPorKgPorHora(8, 2, 16)).toBe(0.25);
  });
});

describe('recém-nascido', () => {
  it('horas de vida', () => {
    expect(horasDeVida(2)).toBe(48);
    expect(horasDeVida(1, 12)).toBe(36);
    expect(() => horasDeVida(1, 24)).toThrow();
  });
  it('perda de peso em %', () => {
    expect(percentualPerdaPeso(3200, 2944)).toBeCloseTo(8, 10);
  });
});
