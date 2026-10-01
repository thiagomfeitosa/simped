import { describe, expect, it } from 'vitest';
import { BANCO_MEDICACOES } from './index';
import type { Medicacao, RegraDeDose } from './tipos';
import type { Validacao } from './validacoes';
import {
  compararBancos,
  dataBrasileira,
  dataDaVersao,
  descreverBancoEmUso,
  HISTORICO_BANCO,
  impressaoDigital,
  impressaoDoTexto,
  novaVersao,
  VERSAO_ATUAL,
  type VersaoBanco,
} from './versao';
import publicado from './versoes/banco-publicado.json';

describe('o banco do projeto está registrado numa versão (B7)', () => {
  it('toda mudança no banco virou uma versão nova', () => {
    const atual = JSON.stringify(BANCO_MEDICACOES);
    if (atual !== JSON.stringify(publicado)) {
      const mudancas = compararBancos(publicado as unknown as Medicacao[], BANCO_MEDICACOES);
      const exemplos = mudancas.slice(0, 5).map((m) => `  - ${m.medicacao}: ${m.tipo}${m.itemId ? ` (${m.itemId})` : ''}`);
      throw new Error(
        [
          `O banco de medicações mudou (${mudancas.length} mudança(s)) e ainda não foi registrado numa versão nova.`,
          ...exemplos,
          'Rode: npm run nova-versao-banco -- "o que mudou e por quê"',
        ].join('\n'),
      );
    }
    expect(impressaoDigital(BANCO_MEDICACOES)).toBe(VERSAO_ATUAL.codigo);
  });

  it('as versões andam de 1 em 1, com data, descrição e código', () => {
    HISTORICO_BANCO.forEach((v, i) => {
      expect(v.versao).toBe(i + 1);
      expect(v.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(v.descricao.length).toBeGreaterThan(5);
      expect(v.codigo).toMatch(/^[0-9a-f]{8}$/);
      if (i > 0) expect(v.data >= HISTORICO_BANCO[i - 1]!.data).toBe(true);
    });
  });

  it('o banco do projeto, sem nada local, é a versão atual', () => {
    const r = descreverBancoEmUso(BANCO_MEDICACOES);
    expect(r.local).toBe(false);
    expect(r.versao.versao).toBe(VERSAO_ATUAL.versao);
    expect(r.texto).toBe(`versão ${VERSAO_ATUAL.versao} de ${dataBrasileira(VERSAO_ATUAL.data)}`);
  });
});

// Dados FICTÍCIOS só para testar a comparação.
const regra: RegraDeDose = {
  id: 'r1',
  indicacao: 'Teste',
  faixas: ['crianca'],
  vias: ['EV'],
  dose: { tipo: 'porKg', min: 1, max: 2, unidade: 'mg', por: 'dose' },
  fonte: { codigo: 'SBP' },
  status: 'A_VALIDAR',
};
const droga: Medicacao = {
  id: 'droga-x',
  codigo: 'X1',
  nome: 'Droga X',
  secao: 6,
  apresentacoes: [{ id: 'amp', descricao: 'Ampola fictícia 10 mg/mL', forma: 'ampola', vias: ['EV'], concentracaoPorMl: { valor: 10, unidade: 'mg' }, status: 'A_VALIDAR' }],
  regras: [regra],
};

describe('comparar dois bancos', () => {
  it('banco igual: nada mudou', () => {
    expect(compararBancos([droga], [droga])).toEqual([]);
  });

  it('medicação nova e removida', () => {
    const outra: Medicacao = { ...droga, id: 'droga-y', nome: 'Droga Y', codigo: 'X2' };
    const m = compararBancos([droga], [outra]);
    expect(m.map((x) => x.tipo)).toEqual(['medicacao-nova', 'medicacao-removida']);
    expect(m[0]!.depois).toContain('Nº X2');
    expect(m[0]!.depois).toContain('1 apresentação(ões)');
    expect(m[1]!.antes).toContain('Droga X');
  });

  it('dose corrigida: mostra o que era e o que ficou', () => {
    const corrigida: Medicacao = { ...droga, regras: [{ ...regra, dose: { ...regra.dose, min: 3, max: 4 } as RegraDeDose['dose'] }] };
    const [m] = compararBancos([droga], [corrigida]);
    expect(m).toMatchObject({ tipo: 'regra-alterada', medicacao: 'Droga X', itemId: 'r1' });
    expect(m!.antes).toContain('1–2 mg/kg/dose');
    expect(m!.depois).toContain('3–4 mg/kg/dose');
  });

  it('apresentação nova, removida e dados gerais', () => {
    const nova: Medicacao = {
      ...droga,
      nome: 'Droga X (novo nome)',
      apresentacoes: [{ id: 'comp', descricao: 'Comprimido fictício 5 mg', forma: 'comprimido', vias: ['VO'], status: 'A_VALIDAR' }],
    };
    const tipos = compararBancos([droga], [nova]).map((x) => x.tipo);
    expect(tipos).toEqual(['medicacao-alterada', 'apresentacao-nova', 'apresentacao-removida']);
  });

  it('campo que não aparece no texto: avisa mesmo assim', () => {
    const nova: Medicacao = { ...droga, regras: [{ ...regra, faixas: ['crianca'], id: 'r1', indicacao: 'Teste' }] };
    expect(compararBancos([droga], [nova])).toEqual([]);
    const outra = { ...droga, regras: [{ ...regra, extra: 1 } as RegraDeDose] };
    expect(compararBancos([droga], [outra])[0]!.depois).toContain('detalhe interno');
  });

  it('conferência do modo validação: diz quem conferiu, quando e onde', () => {
    const fonte = { codigo: 'SBP' as const, documento: 'Documento fictício', pagina: '12' };
    const conferida: Medicacao = { ...droga, regras: [{ ...regra, status: 'CONFERIDO', fonte }] };
    const v: Validacao = {
      alvo: { tipo: 'regra', medicacaoId: 'droga-x', itemId: 'r1' },
      status: 'CONFERIDO',
      fonte,
      quem: 'Dra. Teste',
      quando: '2026-10-01T12:00:00.000Z',
      valorAnterior: 'x',
    };
    const [m] = compararBancos([droga], [conferida], [v]);
    expect(m!.conferencia).toEqual({ quem: 'Dra. Teste', quando: '2026-10-01T12:00:00.000Z', status: 'CONFERIDO', fonte: 'SBP · Documento fictício · p. 12' });
    expect(m!.antes).toContain('A VALIDAR');
    expect(m!.depois).toContain('CONFERIDO');
  });
});

describe('nova versão', () => {
  const agora = new Date(2026, 9, 1, 15, 0);
  it('primeira versão: tudo é novo', () => {
    const v = novaVersao({ historico: [], publicado: null, atual: [droga], descricao: ' Primeira ', agora });
    expect(v).toMatchObject({ versao: 1, data: '2026-10-01', descricao: 'Primeira', resumo: { medicacoes: 1, apresentacoes: 1, regras: 1, conferidos: 0 } });
    expect(v!.mudancas.map((m) => m.tipo)).toEqual(['medicacao-nova']);
    expect(v!.codigo).toBe(impressaoDigital([droga]));
  });

  it('sem mudança: não cria versão', () => {
    expect(novaVersao({ historico: [], publicado: [droga], atual: [droga], descricao: 'x', agora })).toBeNull();
  });

  it('número segue o histórico', () => {
    const anterior = { versao: 7 } as VersaoBanco;
    const v = novaVersao({ historico: [anterior], publicado: [], atual: [droga], descricao: 'Mudou', agora });
    expect(v!.versao).toBe(8);
  });
});

describe('banco em uso neste computador', () => {
  it('com conferência local: avisa e mostra o código', () => {
    const local = BANCO_MEDICACOES.map((m, i) => (i === 0 ? { ...m, nome: `${m.nome} (local)` } : m));
    const r = descreverBancoEmUso(local);
    expect(r.local).toBe(true);
    expect(r.texto).toBe(`versão ${VERSAO_ATUAL.versao} + mudanças deste computador (código ${r.codigo})`);
  });

  it('impressão digital muda com qualquer letra e é sempre igual para o mesmo texto', () => {
    expect(impressaoDoTexto('abc')).toBe(impressaoDoTexto('abc'));
    expect(impressaoDoTexto('abc')).not.toBe(impressaoDoTexto('abd'));
    expect(impressaoDoTexto('')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('datas', () => {
    expect(dataDaVersao(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dataBrasileira('2026-01-05')).toBe('05/01/2026');
  });
});
