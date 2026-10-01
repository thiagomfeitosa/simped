import { describe, expect, it } from 'vitest';
import { ROTEIROS } from '../dados/roteiros';
import { roteiroDesidratacaoPlanoC } from '../dados/roteiros/desidratacao-plano-c';
import { roteiroHipocalemia } from '../dados/roteiros/hipocalemia';
import { roteiroHiponatremia } from '../dados/roteiros/hiponatremia';
import { roteiroIctericiaNeonatal } from '../dados/roteiros/ictericia-neonatal';
import { ID_ETAPA_FINAL } from '../dados/roteiros/prescricao-final';
import { roteiroSepseNeonatal } from '../dados/roteiros/sepse-neonatal';
import type { Roteiro } from '../dados/roteiros/tipos';
import { desfazerTempo, refazerTempo, temposDaConta } from './passosConta';
import { montarFolha, montarPrescricaoComCalculos, montarRascunho } from './progresso';

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
      'volemia',
      'antimicrobianos',
      'medicacoes',
      'exames',
      'cuidados',
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
    const linha = ultima.secoes.find((s) => s.secao === 'medicacoes')!.linhas[0]!;
    expect(linha.texto).toBe('Adrenalina 1:10.000 — 1 mL (0,1 mg) EV/IO');
    expect(linha.detalhe).toContain('SF 0,9% 9 mL = 10 mL (0,1 mg/mL)');
  });
});

describe('etapa final: prescrição com os cálculos', () => {
  it.each(ROTEIROS.map((r) => [r.id, r] as const))('%s termina na folha com os cálculos', (_id, roteiro) => {
    const ultima = roteiro.etapas[roteiro.etapas.length - 1]!;
    expect(ultima.id).toBe(ID_ETAPA_FINAL);
    expect(ultima.cena.tipo).toBe('prescricao-final');
    expect(roteiro.etapas.filter((e) => e.id === ID_ETAPA_FINAL)).toHaveLength(1);
  });

  it.each(ROTEIROS.map((r) => [r.id, r] as const))('%s: toda conta aparece na folha final (nenhuma se perde)', (_id, roteiro) => {
    const { secoes, contasSoltas } = montarPrescricaoComCalculos(roteiro);
    const naFolha = secoes.flatMap((s) => s.linhas.flatMap((l) => l.contas.map((c) => c.idEtapa)));
    const comConta = roteiro.etapas.filter((e) => e.conta).map((e) => e.id);
    expect([...naFolha, ...contasSoltas.map((c) => c.idEtapa)].sort()).toEqual([...comConta].sort());
  });

  it('sepse: as contas da gentamicina ficam embaixo da gentamicina', () => {
    const { secoes } = montarPrescricaoComCalculos(roteiroSepseNeonatal);
    const genta = secoes.find((s) => s.secao === 'antimicrobianos')!.linhas.find((l) => l.linha.id === 'genta')!;
    expect(genta.contas.map((c) => c.idEtapa)).toEqual(['genta-dose', 'genta-aspirar', 'genta-bic', 'genta-vazao']);
    expect(genta.aValidar).toBe(true);
  });

  it('adrenalina: a conta "sem diluir" (etapa sem linha) vai para a linha da adrenalina', () => {
    const adr = ROTEIROS.find((r) => r.id === 'adrenalina-pcr')!;
    const { secoes, contasSoltas } = montarPrescricaoComCalculos(adr);
    expect(contasSoltas).toHaveLength(0);
    const linha = secoes.find((s) => s.secao === 'medicacoes')!.linhas[0]!;
    expect(linha.contas.map((c) => c.idEtapa)).toContain('problema');
  });

  it('icterícia: a conta do limiar vai para a linha da fototerapia (linhaDaConta)', () => {
    const { secoes } = montarPrescricaoComCalculos(roteiroIctericiaNeonatal);
    const foto = secoes.find((s) => s.secao === 'medicacoes')!.linhas.find((l) => l.linha.id === 'fototerapia')!;
    expect(foto.contas.map((c) => c.idEtapa)).toEqual(['indicacao']);
  });
});

/** Texto final de uma linha da folha (última etapa). */
function linhaFinal(roteiro: Roteiro, id: string) {
  const folha = montarFolha(roteiro, roteiro.etapas.length - 1);
  return folha.secoes.flatMap((s) => s.linhas).find((l) => l.id === id)!;
}

describe('roteiros de distúrbios hidroeletrolíticos e icterícia (números calculados)', () => {
  it('desidratação: expansão 240 mL a 480 mL/h; manutenção 4:1 + KCl a 46,8 mL/h; reposição 25 mL/h', () => {
    expect(linhaFinal(roteiroDesidratacaoPlanoC, 'expansao').texto).toBe('SF 0,9% — 240 mL (20 mL/kg) EV em 30 min — BIC 480 mL/h');
    const manut = linhaFinal(roteiroDesidratacaoPlanoC, 'manutencao');
    expect(manut.texto).toBe('Soro de manutenção: SG 5% 880 mL + SF 0,9% 220 mL + KCl 10% 22 mL — EV em 24 h, BIC 46,8 mL/h');
    expect(manut.detalhe).toContain('Na⁺ ≈ 30 mEq/L · K⁺ ≈ 26 mEq/L');
    expect(linhaFinal(roteiroDesidratacaoPlanoC, 'reposicao').texto).toBe('Soro de reposição: SG 5% 300 mL + SF 0,9% 300 mL — EV em 24 h, BIC 25 mL/h');
  });

  it('hiponatremia: NaCl 3% 20 mL = 3 mL de NaCl 20% + 17 mL de AD, 120 mL/h, teto 126', () => {
    const nacl = linhaFinal(roteiroHiponatremia, 'nacl3');
    expect(nacl.texto).toBe('NaCl 3% — 20 mL (2 mL/kg) EV em 10 min — BIC 120 mL/h');
    expect(nacl.detalhe).toContain('NaCl 20% 3 mL + AD 17 mL = 20 mL de NaCl 3%');
    expect(nacl.detalhe).toContain('teto 126');
    const subida = roteiroHiponatremia.etapas.find((e) => e.id === 'quanto-sobe')!.conta!;
    expect(subida.resultado).toBe('sobe ≈ 1,7 mEq/L (118 → ≈ 119,7)');
    expect(linhaFinal(roteiroHiponatremia, 'manutencao').texto).toContain('KCl 19,1% 7,8 mL — EV em 24 h, BIC 42 mL/h');
  });

  it('hipocalemia: 8 mEq = 3,1 mL de KCl 19,1% em 200 mL (40 mEq/L) a 100 mL/h; seringa de 12 mL recusada', () => {
    const corr = linhaFinal(roteiroHipocalemia, 'correcao');
    expect(corr.texto).toBe('Correção de K⁺: KCl 19,1% 3,1 mL (8 mEq = 0,5 mEq/kg) + SF 0,9% 196,9 mL — EV em 2 h, BIC 100 mL/h');
    expect(corr.detalhe).toContain('0,25 mEq/kg/h');
    const armadilha = roteiroHipocalemia.etapas.find((e) => e.id === 'correcao-armadilha')!.conta!;
    expect(armadilha.resultado).toContain('667 mEq/L');
    expect(linhaFinal(roteiroHipocalemia, 'manutencao').texto).toContain('KCl 19,1% 10,1 mL — EV em 24 h, BIC 54,6 mL/h');
  });

  it('icterícia: 48 h de vida, perda de 8%, BT 17 acima do limiar 13', () => {
    expect(linhaFinal(roteiroIctericiaNeonatal, 'id').texto).toContain('48 h de vida');
    const perda = roteiroIctericiaNeonatal.etapas.find((e) => e.id === 'perda-peso')!.conta!;
    expect(perda.resultado).toContain('8%');
    const indicacao = roteiroIctericiaNeonatal.etapas.find((e) => e.id === 'indicacao')!.conta!;
    expect(indicacao.substituicao).toContain('17 − 13 = +4');
  });

  it('toda etapa com "A VALIDAR" informa a fonte prevista', () => {
    [roteiroDesidratacaoPlanoC, roteiroHiponatremia, roteiroHipocalemia, roteiroIctericiaNeonatal].forEach((r) => {
      r.etapas.filter((e) => e.aValidar && /mL\/kg|mEq|mg\/dL|limiar/i.test(e.aValidar)).forEach((e) => {
        expect(e.fonte, `${r.id}/${e.id}`).toBeTruthy();
      });
    });
  });

  it('cena de mistura: componentes com volume positivo; multiplicação por faixas soma o peso', () => {
    ROTEIROS.forEach((r) =>
      r.etapas.forEach((e) => {
        if (e.cena.tipo === 'mistura') e.cena.componentes.forEach((c) => expect(c.volumeMl).toBeGreaterThan(0));
        if (e.cena.tipo === 'multiplicacao' && e.cena.faixas) {
          expect(e.cena.faixas.reduce((s, f) => s + f.kg, 0)).toBeCloseTo(e.cena.pesoKg, 6);
          expect(e.cena.faixas.reduce((s, f) => s + f.kg * f.valorPorKg, 0)).toBeCloseTo(e.cena.total, 6);
        }
      }),
    );
  });
});

describe('desfazer/refazer os tempos de uma conta', () => {
  const conta = roteiroHiponatremia.etapas.find((e) => e.id === 'quanto-sobe')!.conta!;
  it('fórmula → números → passos → resultado', () => {
    expect(temposDaConta(conta).map((t) => t.tipo)).toEqual(['formula', 'substituicao', 'passo', 'resultado']);
  });
  it('desfazer para na fórmula; refazer para no resultado', () => {
    expect(desfazerTempo(4)).toBe(3);
    expect(desfazerTempo(1)).toBe(1);
    expect(refazerTempo(3, 4)).toBe(4);
    expect(refazerTempo(4, 4)).toBe(4);
  });
});
