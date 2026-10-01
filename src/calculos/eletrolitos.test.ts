import { describe, expect, it } from 'vitest';
import { deficitDeSodio, sodioCorrigido } from './eletrolitos';

describe('eletrólitos (fórmulas do rascunho, A VALIDAR)', () => {
  it('caso 10: Na 131 com glicemia 480 → ≈ 137', () => {
    expect(sodioCorrigido(131, 480)).toBeCloseTo(137.08, 2);
  });
  it('caso 15: de 118 para 125 em 8 kg = 33,6 mEq', () => {
    expect(deficitDeSodio({ sodioAtual: 118, sodioDesejado: 125, pesoKg: 8 })).toBeCloseTo(33.6, 10);
  });
});
