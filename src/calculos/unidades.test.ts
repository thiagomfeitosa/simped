import { describe, expect, it } from 'vitest';
import { converterMassa } from './unidades';
import { arredondar, ErroDeCalculo } from './validacao';

describe('conversão de massa', () => {
  it('1 mg = 1000 mcg', () => {
    expect(converterMassa(1, 'mg', 'mcg')).toBe(1000);
  });

  it('0,5 g = 500 mg', () => {
    expect(converterMassa(0.5, 'g', 'mg')).toBe(500);
  });

  it('250 mcg = 0,25 mg', () => {
    expect(converterMassa(250, 'mcg', 'mg')).toBeCloseTo(0.25, 10);
  });

  it('recusa valor vazio', () => {
    expect(() => converterMassa(Number.NaN, 'mg', 'mcg')).toThrow(ErroDeCalculo);
  });
});

describe('arredondar para exibição', () => {
  it('limpa sobras do computador (11,700000000000001 → 11,7)', () => {
    expect(arredondar(11.700000000000001, 1)).toBe(11.7);
  });

  it('arredonda 0,875 para 0,88 com 2 casas', () => {
    expect(arredondar(0.875, 2)).toBe(0.88);
  });
});
