// Exemplos clássicos de livro-texto para testar a LÓGICA; pontos de corte A VALIDAR.
import { describe, expect, it } from 'vitest';
import { interpretarGasometria } from './gasometria';

describe('leitura guiada da gasometria', () => {
  it('acidose metabólica compensada com AG elevado "puro"', () => {
    // Winter: 1,5 × 13 + 8 = 27,5 ± 2; pCO2 28 dentro; AG = 140 − (100 + 13) = 27; Δ/Δ = 15/11 = 1,36
    const l = interpretarGasometria({ ph: 7.25, pco2: 28, hco3: 13, na: 140, cl: 100, lactato: 4 });
    expect(l.primario).toBe('acidose metabólica');
    expect(l.passos.find((p) => p.titulo.startsWith('3'))?.texto).toMatch(/compensação adequada/);
    expect(l.passos.find((p) => p.titulo.startsWith('4'))?.conta).toMatch(/= 27/);
    expect(l.conclusao).toMatch(/ânion gap elevado/);
    expect(l.conclusao).toMatch(/hiperlactatemia/);
    expect(l.conclusao).not.toMatch(/associada/);
  });

  it('acidose metabólica com pCO2 acima do esperado: acidose respiratória associada', () => {
    const l = interpretarGasometria({ ph: 7.1, pco2: 40, hco3: 12 });
    expect(l.conclusao).toMatch(/acidose respiratória associada/);
  });

  it('acidose metabólica hiperclorêmica (diarreia)', () => {
    // AG = 138 − (115 + 14) = 9
    const l = interpretarGasometria({ ph: 7.28, pco2: 29, hco3: 14, na: 138, cl: 115 });
    expect(l.conclusao).toMatch(/hiperclorêmica/);
  });

  it('acidose respiratória aguda', () => {
    // esperado agudo 24 + 0,1 × 20 = 26
    const l = interpretarGasometria({ ph: 7.24, pco2: 60, hco3: 26 });
    expect(l.primario).toBe('acidose respiratória');
    expect(l.conclusao).toBe('acidose respiratória. (Pontos de corte A VALIDAR.)');
  });

  it('alcalose metabólica (estenose de piloro) com AG por albumina', () => {
    const l = interpretarGasometria({ ph: 7.52, pco2: 48, hco3: 36, na: 134, cl: 88, albumina: 3 });
    expect(l.primario).toBe('alcalose metabólica');
    // 0,7 × 36 + 21 = 46,2 ± 2: 48 dentro
    expect(l.passos.find((p) => p.titulo.startsWith('3'))?.texto).toMatch(/compensação adequada/);
    // AG = 134 − 124 = 10; corrigido = 12,5
    expect(l.passos.find((p) => p.titulo.startsWith('4'))?.conta).toMatch(/= 12,5/);
  });

  it('acidose mista', () => {
    expect(interpretarGasometria({ ph: 7.1, pco2: 55, hco3: 16 }).primario).toBe('acidose mista');
  });

  it('gasometria normal', () => {
    const l = interpretarGasometria({ ph: 7.4, pco2: 40, hco3: 24 });
    expect(l.primario).toBe('normal');
  });

  it('venosa usa a própria referência e avisa sobre as fórmulas', () => {
    const l = interpretarGasometria({ ph: 7.33, pco2: 46, hco3: 24 }, 'venosa');
    expect(l.primario).toBe('normal');
    expect(l.passos.some((p) => p.titulo === 'Atenção')).toBe(true);
  });
});
