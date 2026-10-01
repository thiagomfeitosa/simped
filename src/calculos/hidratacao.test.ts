import { describe, expect, it } from 'vitest';
import { hollidaySegarMlDia, vazaoEm24h } from './hidratacao';

describe('Holliday-Segar (volume em 24 h)', () => {
  it.each([
    [8, 800],
    [10, 1000],
    [15, 1250],
    [20, 1500],
    [30, 1700],
  ])('%s kg → %s mL/dia', (peso, esperado) => {
    expect(hollidaySegarMlDia(peso)).toBeCloseTo(esperado, 10);
  });

  it('não dá "saltos" nas mudanças de faixa (10 kg e 20 kg)', () => {
    expect(hollidaySegarMlDia(10.001)).toBeCloseTo(1000, 1);
    expect(hollidaySegarMlDia(20.001)).toBeCloseTo(1500, 1);
  });

  it('recusa peso zero', () => {
    expect(() => hollidaySegarMlDia(0)).toThrow('Peso');
  });
});

describe('vazão em 24 h', () => {
  it('1200 mL em 24 h = 50 mL/h', () => {
    expect(vazaoEm24h(1200)).toBe(50);
  });
});
