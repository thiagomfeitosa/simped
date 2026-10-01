// Planilha de teste: cópia do formulário com algumas linhas preenchidas com dados FICTÍCIOS (marcados TESTE).
import { describe, expect, it } from 'vitest';
import formularioOriginal from '../../docs/fase-0/apresentacoes-formulario.xlsx?inline';
import { verificarBanco } from '../dados/medicacoes/consulta';
import { BANCO_MEDICACOES } from '../dados/medicacoes';
import {
  aplicarApresentacoes,
  importarApresentacoes,
  lerConcentracao,
  lerNumeroPlanilha,
  lerQuantidade,
} from './apresentacoes';
import planilhaTeste from './teste/planilha-teste.xlsx?inline';
import { decodificarXml, indiceColuna, lerXlsx } from './xlsx';

/** O Vite entrega o arquivo como "data:...;base64,..."; aqui vira bytes. */
const bytes = (dataUrl: string) => Uint8Array.from(atob(dataUrl.split(',')[1] ?? ''), (c) => c.charCodeAt(0));

describe('leitor de .xlsx', () => {
  it('lê o formulário original (3 abas, cabeçalho e as 39 medicações + exemplo)', async () => {
    const abas = await lerXlsx(bytes(formularioOriginal));
    expect(abas.map((a) => a.nome)).toEqual(['Como preencher', 'Apresentações', 'Listas']);
    const ap = abas[1]!;
    expect(ap.linhas[0]?.[0]).toBe('Nº');
    expect(ap.linhas[0]?.[1]).toBe('Medicação');
    expect(ap.linhas[1]?.[0]).toBe('EX');
    expect(ap.linhas.filter((l) => l[1]).length).toBe(41);
  });

  it('detalhes: coluna por letra e entidades XML', () => {
    expect(indiceColuna('A1')).toBe(0);
    expect(indiceColuna('T5')).toBe(19);
    expect(indiceColuna('AA10')).toBe(26);
    expect(decodificarXml('a &amp; b &lt; c &#233;')).toBe('a & b < c é');
  });

  it('recusa arquivo que não é planilha', async () => {
    await expect(lerXlsx(new TextEncoder().encode('não sou um zip'))).rejects.toThrow(/xlsx/);
  });
});

describe('textos da planilha', () => {
  it('números em português', () => {
    expect(lerNumeroPlanilha('5.000.000')).toBe(5_000_000);
    expect(lerNumeroPlanilha('0,45')).toBe(0.45);
    expect(lerNumeroPlanilha('2.5')).toBe(2.5);
    expect(lerNumeroPlanilha('1.000')).toBe(1000);
  });
  it('quantidade', () => {
    expect(lerQuantidade('500 mg')).toEqual({ valor: 500, unidade: 'mg' });
    expect(lerQuantidade('5.000.000 UI')).toEqual({ valor: 5_000_000, unidade: 'UI' });
    expect(lerQuantidade('25,6 mEq')).toEqual({ valor: 25.6, unidade: 'mEq' });
    expect(lerQuantidade('200 doses')).toBeNull();
  });
  it('concentração do rótulo', () => {
    expect(lerConcentracao('40 mg/mL')).toEqual({ tipo: 'porMl', valor: 40, unidade: 'mg' });
    expect(lerConcentracao('250 mg/5 mL')).toEqual({ tipo: 'porMl', valor: 50, unidade: 'mg' });
    expect(lerConcentracao('100 mcg/jato')).toEqual({ tipo: 'porJato', valor: 100, unidade: 'mcg' });
    expect(lerConcentracao('1:1.000')).toEqual({ tipo: 'porMl', valor: 1, unidade: 'mg' });
    expect(lerConcentracao('19,1%', 'kcl')).toEqual({ tipo: 'porMl', valor: 2.562, unidade: 'mEq' });
    expect(lerConcentracao('20%', 'nacl20')).toEqual({ tipo: 'porMl', valor: 3.422, unidade: 'mEq' });
    expect(lerConcentracao('50%', 'g50')).toEqual({ tipo: 'porMl', valor: 500, unidade: 'mg' });
    expect(lerConcentracao('não sei')).toBeNull();
  });
});

describe('importar a planilha de teste', async () => {
  const abas = await lerXlsx(bytes(planilhaTeste));
  const r = importarApresentacoes(abas, BANCO_MEDICACOES);
  const porId = (id: string) => r.porMedicacao.get(id) ?? [];

  it('ignora o exemplo, as linhas vazias e o que não tem no hospital', () => {
    expect(r.linhas.find((l) => l.medicacao.startsWith('EXEMPLO'))?.ignorada).toBe('linha de exemplo');
    expect(r.linhas.find((l) => l.medicacao === 'Cortisona (acetato)')?.ignorada).toBe('não tem no hospital');
    expect(r.linhas.find((l) => l.medicacao === 'Soro fisiológico 0,9%')?.ignorada).toBe('ainda não preenchida');
  });

  it('KCl 19,1%: mEq/mL pelo peso molecular, conferido no rótulo', () => {
    const [kcl] = porId('kcl');
    expect(kcl).toMatchObject({ forma: 'ampola', vias: ['EV'], volumeMl: 10, concentracaoPorMl: { valor: 2.562, unidade: 'mEq' }, status: 'CONFERIDO' });
    expect(kcl?.fonte?.documento).toBe('Rótulo / caixa (Santa Casa)');
  });

  it('ceftriaxona em pó: quantidade do frasco, sem concentração pronta, com a rotina nas observações', () => {
    const [cef] = porId('ceftriaxona');
    expect(cef).toMatchObject({ forma: 'frasco-ampola-po', vias: ['EV', 'IM'], quantidade: { valor: 1, unidade: 'g' }, status: 'CONFERIDO' });
    expect(cef?.concentracaoPorMl).toBeUndefined();
    expect(cef?.observacao).toMatch(/10 mL de água destilada/);
    expect(cef?.fonte?.codigo).toBe('BULA');
  });

  it('dexametasona em duas linhas; o elixir sem fonte fica A VALIDAR', () => {
    const dexa = porId('dexametasona');
    expect(dexa).toHaveLength(2);
    expect(dexa[0]).toMatchObject({ forma: 'ampola', vias: ['EV', 'IM'], volumeMl: 2.5, concentracaoPorMl: { valor: 4, unidade: 'mg' } });
    expect(dexa[1]).toMatchObject({ forma: 'solucao-oral', status: 'A_VALIDAR', concentracaoPorMl: { valor: 0.1, unidade: 'mg' } });
  });

  it('spray por jato, gotas/mL, 1:1.000 e mg/5 mL', () => {
    expect(porId('salbutamol')[0]).toMatchObject({ forma: 'spray', vias: ['inalatoria'], quantidade: { valor: 100, unidade: 'mcg' } });
    expect(porId('dipirona')[0]).toMatchObject({ forma: 'gotas', gotasPorMl: 20, concentracaoPorMl: { valor: 500, unidade: 'mg' } });
    expect(porId('adrenalina')[0]).toMatchObject({ vias: ['EV', 'IM', 'IO', 'endotraqueal'], concentracaoPorMl: { valor: 1, unidade: 'mg' } });
    expect(porId('sulfadiazina')[0]).toMatchObject({ forma: 'solucao-oral', concentracaoPorMl: { valor: 50, unidade: 'mg' } });
  });

  it('avisa o que não reconheceu', () => {
    const desconhecida = r.linhas.find((l) => l.medicacao === 'Remédio que não existe');
    expect(desconhecida?.avisos[0]).toMatch(/Não achei/);
    const spray = r.linhas.find((l) => l.medicacaoId === 'salbutamol');
    expect(spray?.avisos.join(' ')).toMatch(/200 doses/);
  });

  it('aplicar no banco troca só as medicações da planilha e o banco continua íntegro', () => {
    const novo = aplicarApresentacoes(BANCO_MEDICACOES, r.porMedicacao);
    expect(novo.find((m) => m.id === 'kcl')?.apresentacoes).toHaveLength(1);
    expect(novo.find((m) => m.id === 'ampicilina')?.apresentacoes).toEqual(BANCO_MEDICACOES.find((m) => m.id === 'ampicilina')?.apresentacoes);
    expect(verificarBanco(novo)).toEqual([]);
  });
});

describe('rótulo só com a quantidade', async () => {
  const abas = await lerXlsx(bytes(planilhaTeste));
  const r = importarApresentacoes(abas, BANCO_MEDICACOES);
  it('pó "1 g" não gera aviso de concentração', () => {
    const cef = r.linhas.find((l) => l.medicacaoId === 'ceftriaxona');
    expect(cef?.avisos).toEqual([]);
  });
});
