import { describe, expect, it } from 'vitest';
import { calcularBalanco, volumeInfundido } from './balanco';

describe('balanço hídrico', () => {
  it('volume infundido conta só dentro do período', () => {
    const soro = { id: 1, descricao: 'Soro', inicioMin: 60, vazaoMlH: 40 };
    expect(volumeInfundido(soro, 0, 360)).toBe(200); // 5 h × 40
    expect(volumeInfundido(soro, 120, 360)).toBe(160); // 4 h
    expect(volumeInfundido(soro, 0, 30)).toBe(0); // ainda não começou
  });

  it('6 h: soro 40 mL/h + 100 mL VO − diurese 1,5 mL/kg/h × 10 kg − vômito 50 mL', () => {
    const b = calcularBalanco({
      infusoes: [{ id: 1, descricao: 'Soro', inicioMin: 0, vazaoMlH: 40 }],
      registros: [
        { id: 1, minuto: 30, tipo: 'entrada', descricao: 'Leite (VO)', volumeMl: 100 },
        { id: 2, minuto: 200, tipo: 'saida', descricao: 'Vômito', volumeMl: 50 },
        { id: 3, minuto: 500, tipo: 'saida', descricao: 'Fora do período', volumeMl: 999 },
      ],
      diureseMlKgH: 1.5,
      pesoKg: 10,
      deMin: 0,
      ateMin: 360,
    });
    expect(b.horas).toBe(6);
    expect(b.totalEntradasMl).toBe(240 + 100);
    expect(b.diureseMl).toBe(90);
    expect(b.totalSaidasMl).toBe(90 + 50);
    expect(b.balancoMl).toBe(200);
    expect(b.diureseMlKgH).toBeCloseTo(1.5, 10);
  });

  it('período zero não divide por zero', () => {
    const b = calcularBalanco({ infusoes: [], registros: [], diureseMlKgH: 1, pesoKg: 10, deMin: 0, ateMin: 0 });
    expect(b.diureseMlKgH).toBe(0);
  });
});
