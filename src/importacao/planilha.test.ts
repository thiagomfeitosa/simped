// B8: planilha de apresentações gerada pelo app (e lida de volta pela importação).
import { describe, expect, it } from 'vitest';
import formularioDoProjeto from '../../docs/fase-0/apresentacoes-formulario.xlsx?inline';
import { BANCO_MEDICACOES } from '../dados/medicacoes';
import { importarApresentacoes } from './apresentacoes';
import { CABECALHO_PLANILHA, gerarPlanilhaApresentacoes, linhasDaPlanilha, ordemDaPlanilha } from './planilha';
import { lerXlsx } from './xlsx';
import { crc32, escaparXml, escreverXlsx, letraDaColuna } from './xlsx-escrever';

const bytes = (dataUrl: string) => Uint8Array.from(atob(dataUrl.split(',')[1] ?? ''), (c) => c.charCodeAt(0));

describe('escritor de .xlsx', () => {
  it('peças do formato', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    expect([0, 25, 26, 701, 702].map(letraDaColuna)).toEqual(['A', 'Z', 'AA', 'ZZ', 'AAA']);
    expect(escaparXml('a & b < c > "d"\u0001')).toBe('a &amp; b &lt; c &gt; &quot;d&quot;');
  });

  it('o que escreve, o leitor lê de volta (acentos, símbolos, células vazias)', async () => {
    const xlsx = escreverXlsx([
      { nome: 'Aba 1', linhas: [['Nº', 'Medicação'], ['1', 'Glicose 50% & "água" <teste>'], [null, '', { texto: 'C3', estilo: 'preencher' }]] },
      { nome: 'Listas', linhas: [['Sim'], ['Não']] },
    ]);
    const abas = await lerXlsx(xlsx);
    expect(abas.map((a) => a.nome)).toEqual(['Aba 1', 'Listas']);
    expect(abas[0]!.linhas).toEqual([['Nº', 'Medicação'], ['1', 'Glicose 50% & "água" <teste>'], ['', '', 'C3']]);
  });

  it('mesmo conteúdo, mesmos bytes (o arquivo do projeto só muda quando o banco muda)', () => {
    expect(gerarPlanilhaApresentacoes(BANCO_MEDICACOES)).toEqual(gerarPlanilhaApresentacoes(BANCO_MEDICACOES));
  });

  it('recusa nome de aba inválido', () => {
    expect(() => escreverXlsx([{ nome: 'a/b', linhas: [] }])).toThrow(/aba inválido/);
    expect(() => escreverXlsx([])).toThrow();
  });
});

describe('planilha gerada do banco', () => {
  it('o formulário do projeto está em dia com o banco (senão: npm run gerar-planilha)', () => {
    const doProjeto = bytes(formularioDoProjeto);
    const gerada = gerarPlanilhaApresentacoes(BANCO_MEDICACOES);
    if (doProjeto.length !== gerada.length || doProjeto.some((b, i) => b !== gerada[i])) {
      throw new Error('docs/fase-0/apresentacoes-formulario.xlsx está velho em relação ao banco. Rode: npm run gerar-planilha');
    }
  });

  it('uma linha por medicação, na ordem: seção, lista do MVP, ampliação', async () => {
    const abas = await lerXlsx(gerarPlanilhaApresentacoes(BANCO_MEDICACOES));
    expect(abas.map((a) => a.nome)).toEqual(['Como preencher', 'Apresentações', 'Listas']);
    const linhas = abas[1]!.linhas.filter((l) => l[1]);
    expect(linhas[0]).toEqual([...CABECALHO_PLANILHA]);
    expect(linhas[1]![0]).toBe('EX');
    expect(linhas.length).toBe(BANCO_MEDICACOES.length + 2);
    const codigos = linhas.slice(2).map((l) => l[0]);
    expect(codigos.slice(0, 9)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '8b']);
    expect(codigos.indexOf('A21')).toBeLessThan(codigos.indexOf('9'));
    expect(codigos.indexOf('22')).toBeLessThan(codigos.indexOf('A26'));
    expect(codigos.at(-1)).toBe('A50');
    expect(abas[0]!.linhas[1]?.[0]).toContain(`${BANCO_MEDICACOES.length} medicações`);
  });

  it('a coluna de referência mostra o que o banco tem hoje', () => {
    const midazolam = linhasDaPlanilha(BANCO_MEDICACOES).find((l) => l[0] === 'A1')!;
    expect(midazolam[1]).toBe('Midazolam');
    expect(midazolam[2]).toBe('6. Demais medicações');
    expect(midazolam[3]).toContain('Ampola 5 mg/mL, 3 mL (15 mg) — EV/IM/intranasal [A VALIDAR]');
  });

  it('ordem estável mesmo sem código', () => {
    const [a, b] = BANCO_MEDICACOES;
    expect(ordemDaPlanilha({ ...a!, codigo: undefined }, { ...a!, codigo: undefined })).toBe(0);
    expect(ordemDaPlanilha(a!, b!)).not.toBeNaN();
  });

  it('ida e volta: preenchida e importada, cada linha vai para a medicação certa pelo Nº', async () => {
    // dados FICTÍCIOS de teste
    const linhas = linhasDaPlanilha(BANCO_MEDICACOES).map((l) => [...l]);
    const col = (t: (typeof CABECALHO_PLANILHA)[number]) => CABECALHO_PLANILHA.indexOf(t);
    const preencher = (codigo: string, valores: Partial<Record<(typeof CABECALHO_PLANILHA)[number], string>>) => {
      const linha = linhas.find((l) => l[0] === codigo)!;
      for (const [k, v] of Object.entries(valores)) linha[col(k as (typeof CABECALHO_PLANILHA)[number])] = v;
    };
    preencher('A1', { 'Tem no hospital?': 'Sim', Forma: 'Ampola', 'Via(s)': 'EV e intranasal', 'Volume da unidade (mL)': '3', 'Concentração como está no rótulo': '5 mg/mL', 'Onde conferi (fonte)': 'Rótulo / caixa' });
    preencher('A27', { Forma: 'Suspensão oral', 'Via(s)': 'VO', 'Concentração como está no rótulo': '400 mg/5 mL' });
    preencher('A2', { Forma: 'Ampola', 'Via(s)': 'Endovenosa / retal', 'Concentração como está no rótulo': '5 mg/mL', 'Volume da unidade (mL)': '2' });
    preencher('8b', { Forma: 'Bolsa/frasco de soro', 'Via(s)': 'EV', 'Concentração como está no rótulo': '3%' });
    preencher('A42', { Forma: 'Outro', 'Via(s)': 'ocular', 'Conteúdo total da unidade': '5 mL' });

    const abas = await lerXlsx(escreverXlsx([{ nome: 'Apresentações', linhas }]));
    const r = importarApresentacoes(abas, BANCO_MEDICACOES);
    expect([...r.porMedicacao.keys()].sort()).toEqual(['amoxicilina-clavulanato', 'diazepam', 'midazolam', 'nacl3', 'profilaxia-ocular']);
    expect(r.porMedicacao.get('midazolam')![0]).toMatchObject({ vias: ['EV', 'intranasal'], volumeMl: 3, concentracaoPorMl: { valor: 5, unidade: 'mg' }, status: 'CONFERIDO' });
    expect(r.porMedicacao.get('diazepam')![0]!.vias).toEqual(['EV', 'retal']);
    expect(r.porMedicacao.get('amoxicilina-clavulanato')![0]).toMatchObject({ concentracaoPorMl: { valor: 80, unidade: 'mg' }, status: 'A_VALIDAR' });
    expect(r.porMedicacao.get('nacl3')![0]!.concentracaoPorMl?.unidade).toBe('mEq');
    expect(r.porMedicacao.get('profilaxia-ocular')![0]!.vias).toEqual(['ocular']);
    // as outras linhas ficam "ainda não preenchida"
    expect(r.linhas.filter((l) => l.ignorada === 'ainda não preenchida')).toHaveLength(BANCO_MEDICACOES.length - 5);
  });
});
