import { describe, expect, it } from 'vitest';
import { criarSorteio, gerarExercicio, PLACAR_VAZIO, registrarTentativa, TIPOS_DE_EXERCICIO, type TipoExercicio } from './treino';

const tipos = Object.keys(TIPOS_DE_EXERCICIO) as TipoExercicio[];

describe('treino de contas', () => {
  it('a mesma semente gera o mesmo exercício', () => {
    const a = gerarExercicio('volume', criarSorteio(42));
    const b = gerarExercicio('volume', criarSorteio(42));
    expect(a).toEqual(b);
  });

  it('todos os tipos geram respostas finitas e positivas (1000 sorteios cada)', () => {
    for (const tipo of tipos) {
      const sorteio = criarSorteio(7);
      for (let i = 0; i < 1000; i++) {
        const e = gerarExercicio(tipo, sorteio);
        expect(Number.isFinite(e.resposta)).toBe(true);
        expect(e.resposta).toBeGreaterThan(0);
        expect(e.enunciado.length).toBeGreaterThan(10);
      }
    }
  });

  it('a conta mostrada bate com a resposta', () => {
    const sorteio = criarSorteio(3);
    for (const tipo of tipos) {
      const e = gerarExercicio(tipo, sorteio);
      const ultimoNumero = e.conta.match(/= ([\d.,]+)[^=]*$/)?.[1];
      expect(ultimoNumero, `${tipo}: ${e.conta}`).toBeDefined();
      const valor = Number(ultimoNumero!.replace(/\./g, '').replace(',', '.'));
      expect(Math.abs(valor - e.resposta) / e.resposta, `${tipo}: ${e.conta}`).toBeLessThan(0.01);
    }
  });

  it('exemplo fixo: volume = dose ÷ concentração', () => {
    // força o sorteio para o primeiro item de cada lista
    const e = gerarExercicio('volume', () => 0);
    expect(e.enunciado).toBe('Ampola de 2 mg/mL. Quantos mL aspirar para dar 0,4 mg?');
    expect(e.resposta).toBeCloseTo(0.2, 10);
  });

  it('placar: acertos, sequência e por tipo', () => {
    let p = PLACAR_VAZIO;
    p = registrarTentativa(p, 'vig', true);
    p = registrarTentativa(p, 'vig', true);
    p = registrarTentativa(p, 'bic', false);
    p = registrarTentativa(p, 'bic', true);
    expect(p).toMatchObject({ tentativas: 4, acertos: 3, sequencia: 1, melhorSequencia: 2 });
    expect(p.porTipo.vig).toEqual({ tentativas: 2, acertos: 2 });
  });
});

describe('dose por peso com máximo', () => {
  it('a conta termina na dose máxima quando passa', () => {
    const sorteio = criarSorteio(11);
    for (let i = 0; i < 300; i++) {
      const e = gerarExercicio('dosePeso', sorteio);
      const ultimo = Number(e.conta.match(/= ([\d.,]+)[^=]*$/)![1]!.replace(/\./g, '').replace(',', '.'));
      expect(Math.abs(ultimo - e.resposta)).toBeLessThan(0.01);
    }
  });
});
