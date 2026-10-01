import { describe, expect, it } from 'vitest';
import { adrenalina, dipirona } from './exemplos-a-validar';
import { BANCO_MEDICACOES } from './index';
import { listaAValidarCsv, resumirBanco, textoDaRegra } from './resumo';

describe('resumo do banco', () => {
  it('conta apresentações e regras (hoje tudo A VALIDAR)', () => {
    const r = resumirBanco(BANCO_MEDICACOES);
    expect(r.medicacoes).toBe(BANCO_MEDICACOES.length);
    expect(r.apresentacoesConferidas).toBe(0);
    expect(r.regrasConferidas).toBe(0);
    expect(r.regras).toBeGreaterThan(80);
  });

  it('texto da regra', () => {
    expect(textoDaRegra(dipirona.regras[1]!)).toBe('500–1.000 mg/dose (máx. 4.000 mg/dia)');
    expect(textoDaRegra(adrenalina.regras[0]!)).toBe('0,01 mg/kg/dose (máx. 1 mg/dose)');
  });

  it('CSV do que falta validar: cabeçalho + uma linha por item', () => {
    const texto = listaAValidarCsv([dipirona]);
    const linhas = texto.split('\n');
    expect(linhas[0]).toMatch(/^Medicação;Tipo;Item/);
    expect(linhas).toHaveLength(1 + dipirona.apresentacoes.length + dipirona.regras.length);
    expect(texto).toMatch(/Dipirona;Dose;Febre\/dor — crianca — VO\/EV\/IM;10–25 mg\/kg\/dose · 6\/6h;SBP;;/);
  });
});
