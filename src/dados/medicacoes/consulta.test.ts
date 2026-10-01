import { describe, expect, it } from 'vitest';
import { escolherRegras, podeCorrigirAluno, verificarBanco } from './consulta';
import { adrenalina, MEDICACOES_EXEMPLO } from './exemplos-a-validar';
import type { Medicacao, RegraDeDose } from './tipos';

describe('integridade do banco de medicações', () => {
  it('o banco atual não tem problemas', () => {
    expect(verificarBanco(MEDICACOES_EXEMPLO)).toEqual([]);
  });

  it('enquanto não há nada conferido, nenhum valor corrige o aluno', () => {
    const todas = MEDICACOES_EXEMPLO.flatMap((m) => m.regras);
    expect(todas.every((r) => r.status === 'A_VALIDAR')).toBe(true);
    expect(todas.some(podeCorrigirAluno)).toBe(false);
  });
});

// Dados fictícios só para testar o verificador e a escolha de fonte.
const regraBase: RegraDeDose = {
  id: 'r1',
  indicacao: 'Teste',
  faixas: ['crianca'],
  vias: ['EV'],
  dose: { tipo: 'porKg', min: 1, max: 2, unidade: 'mg', por: 'dose' },
  fonte: { codigo: 'SBP', documento: 'Documento fictício, 2026', pagina: '1' },
  status: 'CONFERIDO',
};
const droga = (regras: RegraDeDose[]): Medicacao => ({
  id: 'droga-x',
  nome: 'Droga X',
  secao: 6,
  apresentacoes: [],
  regras,
});

describe('verificador pega erros de digitação', () => {
  it('regra CONFERIDA sem documento de fonte', () => {
    const problemas = verificarBanco([droga([{ ...regraBase, fonte: { codigo: 'SBP' } }])]);
    expect(problemas[0]).toContain('sem documento de fonte');
  });

  it('dose mínima maior que a máxima', () => {
    const problemas = verificarBanco([
      droga([{ ...regraBase, dose: { tipo: 'porKg', min: 5, max: 2, unidade: 'mg', por: 'dose' } }]),
    ]);
    expect(problemas[0]).toContain('mínima maior que a máxima');
  });

  it('ids repetidos', () => {
    const problemas = verificarBanco([droga([regraBase, regraBase])]);
    expect(problemas[0]).toContain('id repetido');
  });

  it('regra conferida e estruturada pode corrigir o aluno; regra em texto não', () => {
    expect(podeCorrigirAluno(regraBase)).toBe(true);
    expect(podeCorrigirAluno({ ...regraBase, dose: { tipo: 'texto', descricao: 'tabela por IG' } })).toBe(false);
  });
});

describe('escolha da fonte', () => {
  const sbp = regraBase;
  const ms: RegraDeDose = { ...regraBase, id: 'r2', fonte: { codigo: 'MS', documento: 'Fictício MS' } };
  const pals: RegraDeDose = { ...regraBase, id: 'r3', fonte: { codigo: 'PALS', documento: 'Fictício PALS' } };

  it('usa a fonte preferida quando ela existe e avisa que há outras', () => {
    const r = escolherRegras(droga([sbp, ms]), 'Teste', 'crianca', 'MS');
    expect(r.fonteUsada).toBe('MS');
    expect(r.regras.map((x) => x.id)).toEqual(['r2']);
    expect(r.avisos.join(' ')).toContain('mais de uma fonte');
  });

  it('cai para a SBP quando a preferida não tem valor', () => {
    const r = escolherRegras(droga([sbp]), 'Teste', 'crianca', 'AAP');
    expect(r.fonteUsada).toBe('SBP');
    expect(r.avisos.join(' ')).toContain('usando SBP');
  });

  it('sem SBP, usa a fonte disponível e avisa', () => {
    const r = escolherRegras(droga([pals]), 'Teste', 'crianca');
    expect(r.fonteUsada).toBe('PALS');
  });

  it('avisa quando não existe regra para a faixa etária', () => {
    const r = escolherRegras(droga([sbp]), 'Teste', 'RN');
    expect(r.regras).toEqual([]);
    expect(r.avisos[0]).toContain('Sem regra');
  });

  it('com dados A VALIDAR, avisa que não corrige o aluno', () => {
    const r = escolherRegras(adrenalina, 'Anafilaxia', 'crianca');
    expect(r.avisos.join(' ')).toContain('A VALIDAR');
  });
});
