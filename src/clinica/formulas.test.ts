import { describe, expect, it } from 'vitest';
import {
  diluir,
  doseTotal,
  fatorBic,
  hollidaySegar,
  infusaoMcgKgMin,
  infusaoMlPorHora,
  type Resultado,
  vig,
  volumeAspirar,
} from './formulas';

/** Extrai o valor de um resultado que deveria dar certo. */
function valor<T>(r: Resultado<T>): T {
  if (!r.ok) throw new Error(`esperava sucesso, veio erro: ${r.erro}`);
  return r.valor;
}

// Os números abaixo são exemplos de matemática, não doses recomendadas.

describe('dose por peso', () => {
  it('multiplica dose por kg pelo peso', () => {
    expect(valor(doseTotal(10, 3.2)).dose).toBeCloseTo(32);
  });

  it('limita pela dose máxima e avisa', () => {
    const r = valor(doseTotal(50, 30, 1000));
    expect(r.doseCalculada).toBe(1500);
    expect(r.dose).toBe(1000);
    expect(r.limitadaPelaMaxima).toBe(true);
  });

  it('recusa peso zero ou negativo', () => {
    expect(doseTotal(10, 0).ok).toBe(false);
    expect(doseTotal(10, -2).ok).toBe(false);
  });
});

describe('volume a aspirar', () => {
  it('divide a dose pela concentração', () => {
    expect(valor(volumeAspirar(12, 40))).toBeCloseTo(0.3);
  });
});

describe('diluição e rediluição', () => {
  it('1 mL de 1 mg/mL completado até 10 mL dá 0,1 mg/mL com 9 mL de diluente', () => {
    const r = valor(diluir(1, 1, 10));
    expect(r.concentracaoFinal).toBeCloseTo(0.1);
    expect(r.volumeDiluente).toBeCloseTo(9);
  });

  it('rediluição encadeia a concentração da etapa anterior', () => {
    const primeira = valor(diluir(40, 1, 10));
    const segunda = valor(diluir(primeira.concentracaoFinal, 1, 10));
    expect(segunda.concentracaoFinal).toBeCloseTo(0.4);
  });

  it('recusa volume aspirado maior que o final', () => {
    expect(diluir(1, 11, 10).ok).toBe(false);
  });
});

describe('infusão contínua', () => {
  it('converte mcg/kg/min em mL/h', () => {
    // 0,1 mcg/kg/min × 10 kg × 60 ÷ 10 mcg/mL = 6 mL/h
    expect(valor(infusaoMlPorHora(0.1, 10, 10))).toBeCloseTo(6);
  });

  it('a conta inversa devolve a dose original', () => {
    const mlh = valor(infusaoMlPorHora(0.35, 7.5, 16));
    expect(valor(infusaoMcgKgMin(mlh, 7.5, 16))).toBeCloseTo(0.35);
  });
});

describe('VIG', () => {
  it('SG 10% a 12 mL/h em RN de 3 kg dá 6,67 mg/kg/min', () => {
    expect(valor(vig(12, 10, 3))).toBeCloseTo(6.667, 2);
  });
});

describe('Holliday-Segar', () => {
  it('até 10 kg: 100 mL/kg/dia', () => {
    expect(valor(hollidaySegar(8)).mlPorDia).toBe(800);
  });
  it('10 a 20 kg: 1000 + 50 por kg acima de 10', () => {
    expect(valor(hollidaySegar(15)).mlPorDia).toBe(1250);
  });
  it('acima de 20 kg: 1500 + 20 por kg acima de 20', () => {
    const r = valor(hollidaySegar(30));
    expect(r.mlPorDia).toBe(1700);
    expect(r.mlPorHora).toBeCloseTo(70.83, 2);
  });
  it('nos limites exatos de 10 e 20 kg', () => {
    expect(valor(hollidaySegar(10)).mlPorDia).toBe(1000);
    expect(valor(hollidaySegar(20)).mlPorDia).toBe(1500);
  });
});

describe('fator de correção da BIC (volume final 12 mL)', () => {
  it('exemplo do usuário: 0,3 mL de medicação + 11,7 mL de SF', () => {
    expect(valor(fatorBic(0.3, 3, 12)).volumeSF).toBeCloseTo(11.7);
  });

  it('exemplo do usuário: 5 mL de NaCl + 7 mL de SF', () => {
    expect(valor(fatorBic(5, 17, 12)).volumeSF).toBeCloseTo(7);
  });

  it('calcula a concentração final sobre o volume final', () => {
    expect(valor(fatorBic(0.3, 3, 12)).concentracaoFinal).toBeCloseTo(0.25);
  });

  it('avisa quando o volume da medicação passa do volume final', () => {
    const r = fatorBic(13, 10, 12);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain('não se aplica');
  });

  it('aceita outro volume final configurado pelo hospital', () => {
    expect(valor(fatorBic(2, 10, 20)).volumeSF).toBe(18);
  });
});
