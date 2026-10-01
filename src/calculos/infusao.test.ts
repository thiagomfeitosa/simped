// Números ilustrativos para testar a matemática: NÃO são doses clínicas.
import { describe, expect, it } from 'vitest';
import { dosePorKgDaVazao, vazaoMlPorHora } from './infusao';
import { converterMassa } from './unidades';

describe('infusão contínua com dose por minuto (mcg/kg/min ↔ mL/h)', () => {
  it('0,1 mcg/kg/min × 10 kg × 60 ÷ 20 mcg/mL = 3 mL/h', () => {
    expect(vazaoMlPorHora({ dosePorKg: 0.1, pesoKg: 10, concentracao: 20, por: 'min' })).toBeCloseTo(3, 10);
  });

  it('caminho inverso: 3 mL/h × 20 mcg/mL ÷ (10 kg × 60) = 0,1 mcg/kg/min', () => {
    expect(dosePorKgDaVazao({ vazaoMlPorHora: 3, concentracao: 20, pesoKg: 10, por: 'min' })).toBeCloseTo(0.1, 10);
  });

  it('solução em mg/mL precisa virar mcg/mL antes (0,04 mg/mL = 40 mcg/mL)', () => {
    const concentracaoMcgMl = converterMassa(0.04, 'mg', 'mcg');
    expect(vazaoMlPorHora({ dosePorKg: 0.1, pesoKg: 10, concentracao: concentracaoMcgMl, por: 'min' })).toBeCloseTo(1.5, 10);
  });
});

describe('infusão contínua com dose por hora (ex.: UI/kg/h ↔ mL/h)', () => {
  it('0,1 UI/kg/h × 20 kg ÷ 1 UI/mL = 2 mL/h', () => {
    expect(vazaoMlPorHora({ dosePorKg: 0.1, pesoKg: 20, concentracao: 1, por: 'h' })).toBeCloseTo(2, 10);
  });

  it('caminho inverso: 2 mL/h × 1 UI/mL ÷ 20 kg = 0,1 UI/kg/h', () => {
    expect(dosePorKgDaVazao({ vazaoMlPorHora: 2, concentracao: 1, pesoKg: 20, por: 'h' })).toBeCloseTo(0.1, 10);
  });
});

describe('ida e volta', () => {
  it('calcular a vazão e depois a dose devolve a dose original', () => {
    const vazao = vazaoMlPorHora({ dosePorKg: 0.37, pesoKg: 13.4, concentracao: 64, por: 'min' });
    expect(dosePorKgDaVazao({ vazaoMlPorHora: vazao, concentracao: 64, pesoKg: 13.4, por: 'min' })).toBeCloseTo(0.37, 10);
  });
});
