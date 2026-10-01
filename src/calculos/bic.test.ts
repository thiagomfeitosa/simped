import { describe, expect, it } from 'vitest';
import { HOSPITAIS } from '../dados/hospitais';
import { prepararSeringaBic } from './bic';

const volumeFinalSantaCasa = HOSPITAIS.santaCasa.volumeFinalBicMl;

describe('seringa da BIC com volume final fixo (Santa Casa = 12 mL)', () => {
  it('a configuração da Santa Casa é 12 mL', () => {
    expect(volumeFinalSantaCasa).toBe(12);
  });

  it('exemplo do usuário — gentamicina: 0,3 mL da medicação + 11,7 mL de SF = 12 mL', () => {
    const resultado = prepararSeringaBic({ volumeMedicacaoMl: 0.3, volumeFinalMl: volumeFinalSantaCasa });
    expect(resultado.aplicavel).toBe(true);
    if (!resultado.aplicavel) return;
    expect(resultado.volumeSoroMl).toBeCloseTo(11.7, 10);
    expect(resultado.volumeFinalMl).toBe(12);
  });

  it('exemplo do usuário — NaCl: 5 mL + 7 mL de SF = 12 mL', () => {
    const resultado = prepararSeringaBic({ volumeMedicacaoMl: 5, volumeFinalMl: volumeFinalSantaCasa });
    expect(resultado.aplicavel && resultado.volumeSoroMl).toBe(7);
  });

  it('medicação com exatamente 12 mL: não precisa de SF', () => {
    const resultado = prepararSeringaBic({ volumeMedicacaoMl: 12, volumeFinalMl: volumeFinalSantaCasa });
    expect(resultado.aplicavel && resultado.volumeSoroMl).toBe(0);
  });

  it('medicação com 13 mL: avisa que a regra não se aplica', () => {
    const resultado = prepararSeringaBic({ volumeMedicacaoMl: 13, volumeFinalMl: volumeFinalSantaCasa });
    expect(resultado.aplicavel).toBe(false);
    if (resultado.aplicavel) return;
    expect(resultado.motivo).toContain('não se aplica');
  });

  it('calcula a concentração final = quantidade de droga ÷ 12 mL (ilustrativo: 6 ÷ 12 = 0,5 por mL)', () => {
    const resultado = prepararSeringaBic({
      volumeMedicacaoMl: 0.3,
      volumeFinalMl: volumeFinalSantaCasa,
      quantidadeDeDroga: 6,
    });
    expect(resultado.aplicavel && resultado.concentracaoFinal).toBeCloseTo(0.5, 10);
  });

  it('outro hospital pode usar outro volume final (ex.: 20 mL → 0,3 + 19,7)', () => {
    const resultado = prepararSeringaBic({ volumeMedicacaoMl: 0.3, volumeFinalMl: 20 });
    expect(resultado.aplicavel && resultado.volumeSoroMl).toBeCloseTo(19.7, 10);
  });
});
