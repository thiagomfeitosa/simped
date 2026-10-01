import { describe, expect, it } from 'vitest';
import { contextoAtual, definirContexto, errosGuardados, guardarErro, montarRelato, resumirPilha } from './relato';

describe('relato de problema', () => {
  it('guarda só os 5 últimos erros', () => {
    for (let i = 1; i <= 7; i++) guardarErro(new Error(`erro ${i}`), 'tela');
    const lista = errosGuardados();
    expect(lista).toHaveLength(5);
    expect(lista[0]!.mensagem).toBe('erro 3');
    expect(lista[4]!.mensagem).toBe('erro 7');
  });

  it('aceita erro que não é Error', () => {
    expect(guardarErro('texto solto', 'promessa').mensagem).toBe('texto solto');
  });

  it('contexto: define e apaga', () => {
    definirContexto('Caso', 'Sepse neonatal');
    expect(contextoAtual()).toEqual({ Caso: 'Sepse neonatal' });
    definirContexto('Caso', '');
    expect(contextoAtual()).toEqual({});
  });

  it('resume a pilha', () => {
    expect(resumirPilha('a\n\n  b\nc\nd', 2)).toBe('a\nb');
  });

  it('monta o texto com aba, caso, descrição e erro', () => {
    const texto = montarRelato({
      quando: new Date(2026, 9, 1, 10, 0),
      versao: '0.0.0 (2026-10-01)',
      aba: 'prescrever',
      navegador: 'Teste',
      contexto: { Caso: 'Sepse neonatal' },
      descricao: 'cliquei em Administrar',
      erros: [{ quando: new Date().toISOString(), mensagem: 'x is undefined', origem: 'tela', pilha: 'at Folha' }],
      armazenamento: { 'simped.configuracoes': 120 },
    });
    expect(texto).toContain('Aba: prescrever');
    expect(texto).toContain('Caso: Sepse neonatal');
    expect(texto).toContain('cliquei em Administrar');
    expect(texto).toContain('[tela] x is undefined');
    expect(texto).toContain('simped.configuracoes: 120 caracteres');
  });

  it('sem erros, diz que não houve', () => {
    const texto = montarRelato({ quando: new Date(), versao: 'v', aba: '', navegador: 'n', erros: [] });
    expect(texto).toContain('nenhum erro registrado');
  });
});
