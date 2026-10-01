// B8: as medicações A1–A50 (docs/fase-0/medicacoes-ampliacao.md) estão no banco, sem doses.
import { describe, expect, it } from 'vitest';
import listaAprovada from '../../../docs/fase-0/medicacoes-ampliacao.md?raw';
import { DOSE_A_CADASTRAR, MEDICACOES_AMPLIACAO } from './ampliacao-a-validar';
import { verificarBanco } from './consulta';
import { BANCO_MEDICACOES } from './index';

/** Linhas "| A1 | Midazolam | Benzodiazepínico | ... |" da lista aprovada. */
const linhas = [...listaAprovada.matchAll(/^\|\s*(A\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm)].map((m) => ({
  codigo: m[1]!,
  nome: m[2]!,
  classe: m[3]!,
}));

describe('ampliação A1–A50 (B8)', () => {
  it('a lista aprovada tem as 50 e cada uma está no banco com o mesmo nome e classe', () => {
    expect(linhas.map((l) => l.codigo)).toEqual(Array.from({ length: 50 }, (_, i) => `A${i + 1}`));
    for (const l of linhas) {
      const m = BANCO_MEDICACOES.find((x) => x.codigo === l.codigo);
      expect(m, l.codigo).toBeDefined();
      expect(m!.nome, l.codigo).toBe(l.nome.replace(/ \(ou outro anti-histamínico\)$/, ''));
      expect(m!.classe, l.codigo).toBe(l.classe);
    }
  });

  it('49 novas (a A26, amoxicilina, já existia) e banco total de 90', () => {
    expect(MEDICACOES_AMPLIACAO).toHaveLength(49);
    expect(BANCO_MEDICACOES).toHaveLength(90);
    expect(BANCO_MEDICACOES.find((m) => m.codigo === 'A26')?.id).toBe('amoxicilina');
  });

  it('nenhuma dose inventada: só texto "ainda não cadastrada", tudo A VALIDAR', () => {
    for (const m of MEDICACOES_AMPLIACAO) {
      expect(m.regras.length, m.id).toBeGreaterThan(0);
      for (const r of m.regras) {
        expect(r.dose, `${m.id}/${r.id}`).toEqual({ tipo: 'texto', descricao: DOSE_A_CADASTRAR });
        expect(r.status).toBe('A_VALIDAR');
        expect(r.doseMaxima).toBeUndefined();
        expect(r.intervalosHoras).toBeUndefined();
      }
      for (const a of m.apresentacoes) expect(a.status, `${m.id}/${a.id}`).toBe('A_VALIDAR');
      expect(m.apresentacoes.length, m.id).toBeGreaterThan(0);
    }
  });

  it('todas as medicações do banco têm código (é o Nº da planilha) e o banco está íntegro', () => {
    expect(BANCO_MEDICACOES.filter((m) => !m.codigo).map((m) => m.id)).toEqual([]);
    expect(verificarBanco(BANCO_MEDICACOES)).toEqual([]);
  });
});
