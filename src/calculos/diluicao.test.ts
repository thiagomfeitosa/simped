// Números ilustrativos para testar a matemática: NÃO são doses clínicas.
import { describe, expect, it } from 'vitest';
import { diluir, diluirEmEtapas, volumeParaConcentracaoDesejada } from './diluicao';
import { ErroDeCalculo } from './validacao';

describe('diluição (C1 × V1 = C2 × V2)', () => {
  it('1 mL de 1 mg/mL completado até 10 mL = 0,1 mg/mL, com 9 mL de diluente', () => {
    const resultado = diluir({ concentracaoInicial: 1, volumeAspiradoMl: 1, volumeFinalMl: 10 });
    expect(resultado.concentracaoFinal).toBeCloseTo(0.1, 10);
    expect(resultado.volumeDiluenteMl).toBe(9);
  });

  it('recusa volume final menor que o volume aspirado', () => {
    expect(() =>
      diluir({ concentracaoInicial: 1, volumeAspiradoMl: 5, volumeFinalMl: 2 }),
    ).toThrow(ErroDeCalculo);
  });
});

describe('quanto aspirar para chegar a uma concentração', () => {
  it('de 40 mg/mL para 1 mg/mL em 10 mL: 0,25 mL + 9,75 mL de diluente', () => {
    const resultado = volumeParaConcentracaoDesejada({
      concentracaoInicial: 40,
      concentracaoDesejada: 1,
      volumeFinalMl: 10,
    });
    expect(resultado.volumeAspiradoMl).toBeCloseTo(0.25, 10);
    expect(resultado.volumeDiluenteMl).toBeCloseTo(9.75, 10);
  });

  it('recusa concentração desejada maior que a inicial', () => {
    expect(() =>
      volumeParaConcentracaoDesejada({ concentracaoInicial: 1, concentracaoDesejada: 2, volumeFinalMl: 10 }),
    ).toThrow('Diluir só diminui');
  });
});

describe('diluição em etapas (rediluição)', () => {
  it('40 mg/mL → 1 mL em 10 mL (4 mg/mL) → 1 mL em 10 mL (0,4 mg/mL)', () => {
    const [primeira, segunda] = diluirEmEtapas(40, [
      { volumeAspiradoMl: 1, volumeFinalMl: 10 },
      { volumeAspiradoMl: 1, volumeFinalMl: 10 },
    ]);
    expect(primeira?.concentracaoFinal).toBeCloseTo(4, 10);
    expect(primeira?.volumeDiluenteMl).toBe(9);
    expect(segunda?.concentracaoFinal).toBeCloseTo(0.4, 10);
    expect(segunda?.volumeDiluenteMl).toBe(9);
  });

  it('recusa lista de etapas vazia', () => {
    expect(() => diluirEmEtapas(40, [])).toThrow(ErroDeCalculo);
  });
});
