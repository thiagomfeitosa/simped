// Números ilustrativos para testar as CONTAS da receita; doses de referência são A VALIDAR.
import { describe, expect, it } from 'vitest';
import { TOLERANCIA_PADRAO } from '../calculos';
import { MEDICACOES_EXEMPLO } from '../dados/medicacoes/exemplos-a-validar';
import { type CamposReceita, conferirReceita, medicacoesOrais, receitaVazia, textoDaReceita } from './receita';

const crianca16kg = { faixa: 'crianca' as const, pesoKg: 16 };
const conferir = (c: Partial<CamposReceita>) =>
  conferirReceita({ campos: { ...receitaVazia(), ...c }, medicacoes: MEDICACOES_EXEMPLO, paciente: crianca16kg, tolerancia: TOLERANCIA_PADRAO });
const situacoesDeVolume = (r: ReturnType<typeof conferir>) =>
  r.verificacoes.filter((v) => v.assunto === 'volume').map((v) => v.situacao);

describe('receita de alta', () => {
  it('só entram medicações com apresentação oral', () => {
    expect(medicacoesOrais(MEDICACOES_EXEMPLO).map((m) => m.id)).toEqual(['dipirona', 'prednisolona', 'amoxicilina']);
  });

  it('prednisolona 3 mg/mL: 30 mg = 10 mL; 5 dias = 50 mL → 1 frasco de 60 mL', () => {
    const c: Partial<CamposReceita> = {
      medicacaoId: 'prednisolona',
      apresentacaoId: 'sol-oral-3mg-ml',
      indicacao: 'Asma (crise)',
      dose: '30',
      unidadeDose: 'mg',
      quantidadePorVez: '10',
      intervaloHoras: 24,
      duracaoDias: '5',
      frascos: '1',
    };
    const r = conferir(c);
    expect(situacoesDeVolume(r)).toEqual(['certo', 'certo']);
    expect(r.verificacoes.find((v) => v.assunto === 'dose')?.situacao).toBe('a-validar');
    expect(r.completo).toBe(true);
    expect(textoDaReceita({ ...receitaVazia(), ...c }, MEDICACOES_EXEMPLO)).toEqual({
      cabecalho: 'Prednisolona — Solução oral 3 mg/mL, frasco 60 mL ——— 1 frasco',
      instrucao: 'Dar 10 mL por via oral, 1 vez ao dia, por 5 dias.',
    });
  });

  it('dipirona gotas: 250 mg = 0,5 mL = 10 gotas (20 gotas/mL, A VALIDAR)', () => {
    const r = conferir({
      medicacaoId: 'dipirona',
      apresentacaoId: 'gotas-500mg-ml',
      indicacao: 'Febre/dor',
      dose: '250',
      unidadeDose: 'mg',
      quantidadePorVez: '10',
      intervaloHoras: 6,
      duracaoDias: '3',
      frascos: '1',
      orientacao: 'se febre ou dor',
    });
    expect(situacoesDeVolume(r)).toEqual(['certo', 'certo']);
    expect(r.verificacoes[0]?.texto).toMatch(/0,5 mL × 20 gotas\/mL = 10 gotas/);
  });

  it('amoxicilina suspensão: 8 mL 8/8h por 10 dias = 240 mL → 2 frascos; pedir 1 é pouco', () => {
    const r = conferir({
      medicacaoId: 'amoxicilina',
      apresentacaoId: 'susp-250mg-5ml',
      dose: '400',
      unidadeDose: 'mg',
      quantidadePorVez: '8',
      intervaloHoras: 8,
      duracaoDias: '10',
      frascos: '1',
    });
    expect(situacoesDeVolume(r)).toEqual(['certo', 'errado']);
    expect(r.verificacoes[1]?.texto).toMatch(/→ 2 frasco/);
    // sem regra de dose no banco: avisa e mostra o tipo de receituário
    expect(r.verificacoes.some((v) => v.texto.includes('ainda não tem regra'))).toBe(true);
    expect(r.verificacoes.some((v) => v.texto.includes('2 vias'))).toBe(true);
  });

  it('comprimido: 500 mg = 1 cápsula; 750 mg avisa que não é inteiro nem meio', () => {
    expect(situacoesDeVolume(conferir({ medicacaoId: 'amoxicilina', apresentacaoId: 'comp-500mg', dose: '500', unidadeDose: 'mg', quantidadePorVez: '1' }))).toEqual(['certo']);
    const r = conferir({ medicacaoId: 'amoxicilina', apresentacaoId: 'comp-500mg', dose: '600', unidadeDose: 'mg', quantidadePorVez: '1,2' });
    expect(r.verificacoes.some((v) => v.texto.includes('meio comprimido'))).toBe(true);
  });

  it('o que falta preencher', () => {
    const r = conferir({ medicacaoId: 'prednisolona' });
    expect(r.faltando).toEqual(['apresentação', 'dose', 'unidade da dose', 'quantidade por vez (mL)', 'intervalo', 'duração (dias)', 'quantidade a comprar', 'indicação']);
  });
});
