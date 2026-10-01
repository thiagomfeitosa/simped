import { describe, expect, it } from 'vitest';
import { gotasPorMinuto, vazaoDasGotas } from './gotejamento';

describe('gotejamento', () => {
  it('macrogotas (20/mL): 60 mL/h = 20 gotas/min; microgotas (60/mL): mL/h = microgotas/min', () => {
    expect(gotasPorMinuto(60, 20)).toBe(20);
    expect(gotasPorMinuto(42, 60)).toBe(42);
  });
  it('caminho inverso', () => {
    expect(vazaoDasGotas(20, 20)).toBe(60);
  });
  it('recusa zero', () => {
    expect(() => gotasPorMinuto(0, 20)).toThrow();
  });
});
