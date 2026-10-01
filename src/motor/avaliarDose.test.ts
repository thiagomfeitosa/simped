import { describe, expect, it } from 'vitest';
import { adrenalina, dipirona } from '../dados/medicacoes/exemplos-a-validar';
import { avaliarDose } from './avaliarDose';

const base = { faixa: 'crianca' as const, pesoKg: 16, unidade: 'mg' as const };

describe('B9: a resposta depende da dose', () => {
  it('pela regra do banco (dipirona 10–25 mg/kg)', () => {
    expect(avaliarDose({ ...base, medicacao: dipirona, dose: 400 })?.nivel).toBe('certa'); // 25 mg/kg
    const sub = avaliarDose({ ...base, medicacao: dipirona, dose: 80 }); // 5 mg/kg
    expect(sub?.nivel).toBe('subdose');
    expect(sub?.fracao).toBeCloseTo(0.5, 5);
    expect(sub?.texto).toContain('5 mg/kg');
    expect(avaliarDose({ ...base, medicacao: dipirona, dose: 800 })?.nivel).toBe('sobredose'); // 50 mg/kg
  });

  it('a folga de 10% não pune arredondamento', () => {
    expect(avaliarDose({ ...base, medicacao: dipirona, dose: 430 })?.nivel).toBe('certa'); // 26,9 mg/kg
    expect(avaliarDose({ ...base, medicacao: dipirona, dose: 150 })?.nivel).toBe('certa'); // 9,4 mg/kg
  });

  it('converte unidades (g → mg)', () => {
    expect(avaliarDose({ ...base, medicacao: dipirona, dose: 0.4, unidade: 'g' })?.nivel).toBe('certa');
  });

  it('a faixa do caso vale por cima do banco', () => {
    const resposta = { medicacaoId: 'dipirona', mudancas: [], status: 'A_VALIDAR' as const, faixaDose: { min: 1, max: 2, unidade: 'mg' as const, por: 'kg' as const } };
    const a = avaliarDose({ ...base, medicacao: dipirona, resposta, dose: 400 });
    expect(a?.nivel).toBe('sobredose');
    expect(a?.texto).toContain('faixa do caso');
  });

  it('dose fixa por dose (adrenalina 0,01 mg/kg com teto)', () => {
    expect(avaliarDose({ ...base, medicacao: adrenalina, dose: 0.16 })?.nivel).toBe('certa');
    expect(avaliarDose({ ...base, medicacao: adrenalina, dose: 1.6 })?.nivel).toBe('sobredose');
    // adolescente de 150 kg: 0,01 mg/kg = 1,5 mg passa do teto de 1 mg/dose
    const teto = avaliarDose({ ...base, pesoKg: 150, medicacao: adrenalina, dose: 1.5 });
    expect(teto?.nivel).toBe('sobredose');
    expect(teto?.texto).toContain('dose máxima');
  });

  it('sem faixa, sem dose ou unidade que não converte: não classifica', () => {
    expect(avaliarDose({ ...base, medicacao: undefined, dose: 1 })).toBeUndefined();
    expect(avaliarDose({ ...base, medicacao: dipirona, dose: 0 })).toBeUndefined();
    expect(avaliarDose({ ...base, medicacao: dipirona, dose: 4, unidade: 'mL' })).toBeUndefined();
  });
});
