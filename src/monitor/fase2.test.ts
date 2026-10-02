import { describe, expect, it } from 'vitest';
import { caminhoDaTira } from '../telas/TiraEcg';
import { ecg, ondaTPeloPotassio, respiracaoDoPadrao } from './monitor';

/** Maior valor da curva em `segundos`, amostrando a cada 10 ms. */
function pico(f: (t: number) => number, segundos = 10): number {
  let max = -Infinity;
  for (let t = 0; t < segundos; t += 0.01) max = Math.max(max, f(t));
  return max;
}

describe('Fase 2 — curva de respiração do monitor', () => {
  it('apneia é linha (quase) reta; Kussmaul é mais profunda que o normal', () => {
    expect(pico((t) => respiracaoDoPadrao(t, 0, 'apneia'))).toBeLessThan(0.05);
    expect(pico((t) => respiracaoDoPadrao(t, 20, 'kussmaul'))).toBeGreaterThan(pico((t) => respiracaoDoPadrao(t, 20, 'normal')) * 1.4);
  });
  it('gasping: um suspiro e depois linha reta por segundos', () => {
    expect(respiracaoDoPadrao(0.25, 6, 'gasping')).toBeGreaterThan(0.9);
    expect(respiracaoDoPadrao(3.5, 6, 'gasping')).toBeLessThan(0.05);
  });
});

describe('Fase 2 — onda T pelo potássio', () => {
  it('K alto: T alta e pontuda; K baixo: T achatada e onda U', () => {
    expect(ondaTPeloPotassio(7.2).altura).toBeGreaterThan(0.6);
    expect(ondaTPeloPotassio(2.4).altura).toBeLessThan(0.2);
    expect(ondaTPeloPotassio(2.4).u).toBeGreaterThan(0);
    expect(ondaTPeloPotassio(4.2)).toEqual({ altura: 0.3, largura: 1, u: 0 });
  });
  it('o ECG com K alto tem T mais alta que com K normal', () => {
    // em FC 60, o pico da onda T fica em 0,48 s do batimento
    const tNormal = ecg(0.48, 60, 4.2);
    const tAlta = ecg(0.48, 60, 7.2);
    expect(tAlta).toBeGreaterThan(tNormal);
  });
});

describe('Fase 2 — tira de ECG em papel', () => {
  it('começa pelo pulso de calibração (1 mV = 10 mm) e cobre 6 s a 25 mm/s', () => {
    const caminho = caminhoDaTira({ ritmo: 'sinusal', fc: 100, instanteS: 20 });
    expect(caminho.startsWith('M0 25.00 L2 25.00 L2 15.00 L7 15.00 L7 25.00')).toBe(true);
    const ultimoX = Number(caminho.trim().split(' L').pop()!.split(' ')[0]);
    expect(ultimoX).toBeCloseTo(10 + 6 * 25, 1);
  });
});
