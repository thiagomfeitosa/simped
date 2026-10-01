import { describe, expect, it } from 'vitest';
import { BANCO_MEDICACOES } from '../medicacoes';
import type { Medicacao } from '../medicacoes/tipos';
import { FONTES_DE_DOSE } from '../../configuracoes/configuracoes';
import { CATALOGO_FONTES, descreverFonte, documentoDaFonte, juntarCatalogos, lerCatalogo, verificarCatalogo, verificarFontesDoBanco } from './fontes';

describe('catálogo de fontes', () => {
  it('está íntegro', () => {
    expect(verificarCatalogo(CATALOGO_FONTES)).toEqual([]);
  });

  it('o banco só aponta para documentos do catálogo', () => {
    expect(verificarFontesDoBanco(BANCO_MEDICACOES)).toEqual([]);
  });

  it('toda sociedade usada no banco tem documento padrão', () => {
    const usadas = new Set(BANCO_MEDICACOES.flatMap((m) => [...m.regras.map((r) => r.fonte.codigo), ...m.apresentacoes.flatMap((a) => (a.fonte ? [a.fonte.codigo] : []))]));
    for (const c of usadas) expect(documentoDaFonte({ codigo: c }), c).toBeDefined();
  });

  it('as fontes das Configurações têm documento padrão', () => {
    for (const codigo of FONTES_DE_DOSE) expect(documentoDaFonte({ codigo }), codigo).toBeDefined();
  });

  it('descreve de onde veio o número', () => {
    expect(descreverFonte({ codigo: 'SBP' })).toMatch(/^SBP \(documento provável: Tratado de Pediatria/);
    expect(descreverFonte({ codigo: 'SBP', documentoId: 'SBP-TRATADO', pagina: '345' })).toMatch(/^SBP — Tratado de Pediatria.*, p\. 345$/);
    expect(descreverFonte({ codigo: 'SBP', documentoId: 'SBP-TRATADO', pagina: 'tabela 3' })).toMatch(/, tabela 3$/);
    expect(descreverFonte({ codigo: 'HOSPITAL', documento: 'Rotina X (Santa Casa)' })).toBe('HOSPITAL — Rotina X (Santa Casa)');
    expect(descreverFonte({ codigo: 'SBP', documentoId: 'NAO-EXISTE' })).toContain('fora do catálogo');
  });

  it('acusa documento inexistente ou de outra sociedade', () => {
    const med = { ...BANCO_MEDICACOES[0]!, regras: [{ ...BANCO_MEDICACOES[0]!.regras[0]!, fonte: { codigo: 'MS' as const, documentoId: 'SBP-TRATADO' } }] } as Medicacao;
    expect(verificarFontesDoBanco([med])[0]).toContain('é da SBP');
  });

  it('acusa dois documentos padrão para a mesma sociedade e código repetido', () => {
    const extra = { ...CATALOGO_FONTES[0]!, id: 'OUTRO' };
    expect(verificarCatalogo([...CATALOGO_FONTES, extra]).join(' ')).toContain('dois documentos padrão');
    expect(verificarCatalogo([...CATALOGO_FONTES, CATALOGO_FONTES[0]!]).join(' ')).toContain('repetido');
  });

  it('documento cadastrado no app vale por cima do projeto', () => {
    const editado = { ...CATALOGO_FONTES[0]!, edicao: '6ª ed.' };
    const junto = juntarCatalogos(CATALOGO_FONTES, [editado]);
    expect(junto).toHaveLength(CATALOGO_FONTES.length);
    expect(junto.find((d) => d.id === editado.id)!.edicao).toBe('6ª ed.');
  });

  it('lê catálogo guardado e ignora lixo', () => {
    expect(lerCatalogo(null)).toEqual([]);
    expect(lerCatalogo('xx')).toEqual([]);
    expect(lerCatalogo(JSON.stringify([{ id: 'A', titulo: 'T', sociedade: 'SBP', status: 'A_VALIDAR' }, { nada: 1 }]))).toHaveLength(1);
  });
});
