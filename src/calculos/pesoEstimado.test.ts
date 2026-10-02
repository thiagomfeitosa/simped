import { describe, expect, it } from 'vitest';
import { pesoEstimadoAntigo, pesoEstimadoApls } from './pesoEstimado';

describe('peso estimado pela idade (A VALIDAR)', () => {
  it('APLS: 8 meses → 8 kg; 3 anos → 14 kg; 8 anos → 31 kg', () => {
    expect(pesoEstimadoApls(8).pesoKg).toBe(8);
    expect(pesoEstimadoApls(36).pesoKg).toBe(14);
    expect(pesoEstimadoApls(96)).toMatchObject({ pesoKg: 31, formula: '(3 × idade em anos) + 7' });
  });
  it('acima de 12 anos não estima; fórmula antiga só de 1 a 10 anos', () => {
    expect(() => pesoEstimadoApls(13 * 12)).toThrow(/12 anos/);
    expect(pesoEstimadoAntigo(6)?.pesoKg).toBe(20);
    expect(pesoEstimadoAntigo(0.5)).toBeNull();
  });
});
