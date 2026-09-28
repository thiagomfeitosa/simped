import { describe, expect, it } from 'vitest';
import { ROTEIROS } from '../dados/roteiros';
import { roteiroSepseNeonatal } from '../dados/roteiros/sepse-neonatal';
import { montarFolha, montarRascunho } from './progresso';

const indiceDe = (id: string) => roteiroSepseNeonatal.etapas.findIndex((e) => e.id === id);

describe('folha de prescrição passo a passo', () => {
  it('na 1ª etapa só tem a identificação', () => {
    const folha = montarFolha(roteiroSepseNeonatal, 0);
    const preenchidas = folha.secoes.filter((s) => s.linhas.length > 0);
    expect(preenchidas.map((s) => s.secao)).toEqual(['identificacao']);
    expect(folha.idLinhaNova).toBe('id');
  });

  it('a linha da gentamicina "cresce" e termina com 0,3 mL + 11,7 mL e 24 mL/h', () => {
    const folha = montarFolha(roteiroSepseNeonatal, indiceDe('genta-vazao'));
    const atb = folha.secoes.find((s) => s.secao === 'antimicrobianos')!;
    const genta = atb.linhas.find((l) => l.id === 'genta')!;
    expect(genta.texto).toBe('Gentamicina — 12 mg EV de 24/24 h');
    expect(genta.detalhe).toContain('aspirar 0,3 mL + SF 0,9% 11,7 mL = 12 mL');
    expect(genta.detalhe).toContain('24 mL/h');
  });

  it('voltar uma etapa desfaz o que ela escreveu', () => {
    const antes = montarFolha(roteiroSepseNeonatal, indiceDe('genta-dose') - 1);
    const atb = antes.secoes.find((s) => s.secao === 'antimicrobianos')!;
    expect(atb.linhas.map((l) => l.id)).toEqual(['ampi']);
  });

  it('segue a ordem oficial das seções', () => {
    const folha = montarFolha(roteiroSepseNeonatal, roteiroSepseNeonatal.etapas.length - 1);
    expect(folha.secoes.map((s) => s.secao)).toEqual([
      'identificacao',
      'oxigenoterapia',
      'dieta',
      'hidratacao',
      'antimicrobianos',
      'demais',
      'exames',
      'orientacoes',
      'sinan',
    ]);
  });
});

describe('rascunho de cálculos', () => {
  it('acumula as contas até a etapa atual', () => {
    const r = montarRascunho(roteiroSepseNeonatal, indiceDe('soro-vig'));
    expect(r.map((l) => l.texto)).toEqual([
      'Hídrico: 80 × 3 = 240 mL/dia',
      'Vazão: 240 ÷ 24 = 10 mL/h',
      'VIG: 10 × 10 ÷ 18 ≈ 5,6 mg/kg/min',
    ]);
  });
});

describe('integridade dos roteiros', () => {
  it.each(ROTEIROS.map((r) => [r.id, r] as const))('%s: etapas com id único e texto explicativo', (_id, roteiro) => {
    const ids = roteiro.etapas.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    roteiro.etapas.forEach((e) => {
      expect(e.explicacao.length).toBeGreaterThan(0);
      expect(e.curto.length).toBeGreaterThan(0);
    });
  });

  it('adrenalina: 0,1 mg → diluída a 0,1 mg/mL → 1 mL', () => {
    const adr = ROTEIROS.find((r) => r.id === 'adrenalina-pcr')!;
    const ultima = montarFolha(adr, adr.etapas.length - 1);
    const linha = ultima.secoes.find((s) => s.secao === 'demais')!.linhas[0];
    expect(linha.texto).toBe('Adrenalina 1:10.000 — 1 mL (0,1 mg) EV/IO');
    expect(linha.detalhe).toContain('SF 0,9% 9 mL = 10 mL (0,1 mg/mL)');
  });
});
