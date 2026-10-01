// Números ilustrativos para testar a matemática: NÃO são doses clínicas.
import { describe, expect, it } from 'vitest';
import { misturarDuasSolucoes, vazaoParaVig, vig } from './glicose';
import { ErroDeCalculo } from './validacao';

describe('VIG (velocidade de infusão de glicose)', () => {
  it('9 mL/h de glicose a 10% em 3 kg: 9 × 10 ÷ (6 × 3) = 5 mg/kg/min', () => {
    expect(vig({ vazaoMlPorHora: 9, concentracaoGlicosePct: 10, pesoKg: 3 })).toBeCloseTo(5, 10);
  });

  it('confere a dedução: 9 mL/h a 10% = 0,9 g/h = 15 mg/min ÷ 3 kg = 5 mg/kg/min', () => {
    const mgPorMinuto = ((9 * 10) / 100) * 1000 / 60;
    expect(mgPorMinuto / 3).toBeCloseTo(vig({ vazaoMlPorHora: 9, concentracaoGlicosePct: 10, pesoKg: 3 }), 10);
  });

  it('caminho inverso: VIG 5 com glicose 10% em 3 kg = 9 mL/h', () => {
    expect(vazaoParaVig({ vigMgKgMin: 5, concentracaoGlicosePct: 10, pesoKg: 3 })).toBeCloseTo(9, 10);
  });
});

describe('mistura de duas soluções', () => {
  it('450 mL a 10% com soluções de 5% e 50%: 400 mL + 50 mL', () => {
    const { volumeMenorMl, volumeMaiorMl } = misturarDuasSolucoes({
      concentracaoMenor: 5,
      concentracaoMaior: 50,
      concentracaoDesejada: 10,
      volumeFinalMl: 450,
    });
    expect(volumeMenorMl).toBeCloseTo(400, 10);
    expect(volumeMaiorMl).toBeCloseTo(50, 10);
    // prova real: a quantidade de glicose da mistura dá 10%
    expect((volumeMenorMl * 5 + volumeMaiorMl * 50) / 450).toBeCloseTo(10, 10);
  });

  it('recusa concentração desejada fora do intervalo das duas soluções', () => {
    expect(() =>
      misturarDuasSolucoes({ concentracaoMenor: 5, concentracaoMaior: 50, concentracaoDesejada: 60, volumeFinalMl: 100 }),
    ).toThrow(ErroDeCalculo);
  });
});
