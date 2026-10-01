import { describe, expect, it } from 'vitest';
import {
  type Armazenamento,
  criarBackup,
  detalheDaGaveta,
  gavetasGuardadas,
  lerBackup,
  nomeDoArquivo,
  restaurarBackup,
  resumirBackup,
  textoDoBackup,
} from './backup';

/** Armazenamento falso (no lugar do window.localStorage). */
function armazenamento(inicial: Record<string, string> = {}): Armazenamento & { dados: Map<string, string> } {
  const dados = new Map(Object.entries(inicial));
  return {
    dados,
    get length() {
      return dados.size;
    },
    key: (i) => [...dados.keys()][i] ?? null,
    getItem: (k) => dados.get(k) ?? null,
    setItem: (k, v) => void dados.set(k, v),
    removeItem: (k) => void dados.delete(k),
  };
}

const COMPUTADOR_A = {
  'simped.configuracoes': '{"fonteDose":"SBP"}',
  'simped.casos-personalizados': '[{"id":"meu-caso"},{"id":"outro"}]',
  'simped.historico': '[{"casoId":"x","aproveitamento":80}]',
  'simped.apresentacoes-hospital': '{"kcl":[{"id":"hosp-3"}],"sf09":[{"id":"hosp-4"},{"id":"hosp-5"}]}',
  'simped.validador': 'Dra. Teste',
  'simped.canal': '{"passageiro":true}',
  'outro-site': 'não é do SimPed',
};

describe('backup (B4)', () => {
  it('copia todas as gavetas do SimPed, menos as passageiras e as de fora', () => {
    const b = criarBackup(armazenamento(COMPUTADOR_A), new Date('2026-10-01T12:00:00Z'), 'versão 2 de 01/10/2026');
    expect(b.formato).toBe('simped-backup');
    expect(b.geradoEm).toBe('2026-10-01T12:00:00.000Z');
    expect(b.banco).toBe('versão 2 de 01/10/2026');
    expect(Object.keys(b.dados).sort()).toEqual([
      'simped.apresentacoes-hospital',
      'simped.casos-personalizados',
      'simped.configuracoes',
      'simped.historico',
      'simped.validador',
    ]);
    expect(b.dados['simped.configuracoes']).toBe('{"fonteDose":"SBP"}');
  });

  it('gaveta nova (de uma função futura) entra sozinha', () => {
    expect(gavetasGuardadas(armazenamento({ 'simped.coisa-nova': '1' }))).toEqual(['simped.coisa-nova']);
  });

  it('levar para outro computador: o B fica igual ao A (e perde o que só ele tinha)', () => {
    const a = armazenamento(COMPUTADOR_A);
    const b = armazenamento({ 'simped.configuracoes': '{"fonteDose":"AAP"}', 'simped.ritmo': 'lento', 'outro-site': 'fica' });
    const lido = lerBackup(textoDoBackup(criarBackup(a, new Date())));
    if ('erro' in lido) throw new Error(lido.erro);
    expect(restaurarBackup(b, lido.backup)).toEqual({ gravadas: 5, apagadas: 1 });
    expect(b.dados.get('simped.configuracoes')).toBe('{"fonteDose":"SBP"}');
    expect(b.dados.get('simped.ritmo')).toBeUndefined();
    expect(b.dados.get('outro-site')).toBe('fica');
    expect(gavetasGuardadas(b)).toEqual(gavetasGuardadas(a));
  });

  it('recusa arquivo que não é backup e ignora gavetas estranhas', () => {
    expect(lerBackup('não é json')).toEqual({ erro: expect.stringContaining('não é um backup') });
    expect(lerBackup('{"validacoes":[]}')).toEqual({ erro: 'O arquivo não é um backup do SimPed.' });
    expect(lerBackup('{"formato":"simped-backup","versao":9,"dados":{}}')).toEqual({ erro: expect.stringContaining('versão') });
    const r = lerBackup(
      JSON.stringify({ formato: 'simped-backup', versao: 1, geradoEm: 'x', dados: { 'simped.ritmo': 'lento', 'simped.canal': 'x', 'site-alheio': 'y', 'simped.numero': 5 } }),
    );
    if ('erro' in r) throw new Error(r.erro);
    expect(r.backup.dados).toEqual({ 'simped.ritmo': 'lento' });
    expect(r.ignoradas.sort()).toEqual(['simped.canal', 'simped.numero', 'site-alheio']);
  });

  it('sem espaço: avisa e não apaga nada do que havia', () => {
    const cheio = armazenamento({ 'simped.ritmo': 'lento' });
    cheio.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    const b = criarBackup(armazenamento(COMPUTADOR_A), new Date());
    expect(() => restaurarBackup(cheio, b)).toThrow(/Não coube/);
    expect(cheio.dados.get('simped.ritmo')).toBe('lento');
  });

  it('resumo em palavras', () => {
    const resumo = resumirBackup(criarBackup(armazenamento(COMPUTADOR_A), new Date()));
    expect(resumo).toContainEqual({ chave: 'simped.casos-personalizados', nome: 'Casos criados no editor', detalhe: '2 casos' });
    expect(resumo).toContainEqual({ chave: 'simped.historico', nome: 'Histórico de relatórios', detalhe: '1 relatório' });
    expect(resumo).toContainEqual({
      chave: 'simped.apresentacoes-hospital',
      nome: 'Apresentações importadas da planilha',
      detalhe: '3 apresentações de 2 medicações',
    });
    expect(resumo).toContainEqual({ chave: 'simped.validador', nome: 'Nome de quem confere', detalhe: 'Dra. Teste' });
    expect(detalheDaGaveta('simped.sessao-em-andamento', '{"casoTitulo":"Caso 2"}')).toBe('Caso 2');
    expect(detalheDaGaveta('simped.desconhecida', '[1,2,3]')).toBe('3 itens');
    expect(detalheDaGaveta('simped.treino-placar', '{"tentativas":10,"acertos":7}')).toBe('7 de 10 contas certas');
    // gaveta vazia não aparece no resumo (mas vai no arquivo)
    const comVazia = criarBackup(armazenamento({ 'simped.validacoes': '[]', 'simped.fontes': '[]', 'simped.ritmo': 'lento' }), new Date());
    expect(resumirBackup(comVazia).map((i) => i.chave)).toEqual(['simped.ritmo']);
    expect(Object.keys(comVazia.dados)).toHaveLength(3);
  });

  it('nome do arquivo com a data', () => {
    expect(nomeDoArquivo(new Date(2026, 9, 1))).toBe('simped-backup-2026-10-01.json');
  });
});
