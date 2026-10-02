import { describe, expect, it } from 'vitest';
import { ROTEIROS } from '../dados/roteiros';
import { type CategoriaErro, candidatosDeErro, conferirCaca, lerNumeroBr, linhasDaFolhaFinal, montarFolhaComErros, roteirosParaCacaErros } from './cacaErros';

const sepse = ROTEIROS.find((r) => r.id === 'sepse-neonatal')!;

describe('caça-erros', () => {
  it('lê números no padrão brasileiro', () => {
    expect(lerNumeroBr('1.400')).toBe(1400);
    expect(lerNumeroBr('0,3')).toBe(0.3);
    expect(lerNumeroBr('70.000')).toBe(70000);
    expect(lerNumeroBr('11,7')).toBe(11.7);
  });

  it('quase todos os roteiros rendem uma folha (pelo menos 3 erros possíveis)', () => {
    // ficam de fora só as folhas quase sem contas (icterícia; hipernatremia, com um soro só)
    const ids = roteirosParaCacaErros().map((r) => r.id);
    expect(ids).not.toContain('ictericia-neonatal');
    expect(ids.length).toBeGreaterThanOrEqual(ROTEIROS.length - 2);
  });

  it.each(roteirosParaCacaErros().map((r) => [r.id, r] as const))('%s: planta 3 ou 4 erros (até 3 por linha), e só neles a folha muda', (_id, roteiro) => {
    for (const semente of [1, 2, 3, 42, 999]) {
      const folha = montarFolhaComErros(roteiro, semente);
      expect(folha.erros.length).toBeGreaterThanOrEqual(3);
      expect(folha.erros.length).toBeLessThanOrEqual(4);
      const porLinha = new Map<string, number>();
      folha.erros.forEach((e) => porLinha.set(e.linhaId, (porLinha.get(e.linhaId) ?? 0) + 1));
      expect(Math.max(...porLinha.values())).toBeLessThanOrEqual(3);
      const certas = linhasDaFolhaFinal(roteiro);
      folha.linhas.forEach((l, i) => {
        const original = certas[i]!;
        const errosDaLinha = folha.erros.filter((e) => e.linhaId === l.id);
        if (errosDaLinha.length === 0) expect(l).toEqual(original);
        for (const erro of errosDaLinha) {
          expect(l[erro.campo]).toContain(erro.ficou);
          expect(original[erro.campo]).toContain(erro.era);
          expect(erro.ficou).not.toBe(erro.era);
        }
      });
    }
  });

  it('a mesma semente gera a mesma folha; sementes diferentes variam', () => {
    expect(montarFolhaComErros(sepse, 7)).toEqual(montarFolhaComErros(sepse, 7));
    const variedade = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => montarFolhaComErros(sepse, s).erros.map((e) => e.linhaId + e.categoria).join()));
    expect(variedade.size).toBeGreaterThan(1);
  });

  it('a gentamicina com o SF sem descontar a medicação vira erro da seringa da BIC', () => {
    const c = candidatosDeErro(linhasDaFolhaFinal(sepse)).find((x) => x.linhaId === 'genta' && x.mutacao.categoria === 'bic')!;
    expect(c.m[0]).toBe('+ SF 0,9% 11,7 mL = 12 mL');
    expect(c.mutacao.trocar(c.m).ficou).toBe('+ SF 0,9% 12 mL = 12 mL');
  });

  it('potássio em bolus é plantado só na correção de K', () => {
    const hipo = ROTEIROS.find((r) => r.id === 'hipocalemia')!;
    const seg = candidatosDeErro(linhasDaFolhaFinal(hipo)).filter((c) => c.mutacao.categoria === 'seguranca');
    expect(seg.map((c) => c.linhaId)).toEqual(['correcao']);
  });

  it('confere as marcações: acha, perde, falso alarme e nota', () => {
    const folha = montarFolhaComErros(sepse, 3);
    const [primeiro, segundo] = folha.erros;
    const certa = folha.linhas.find((l) => !folha.erros.some((e) => e.linhaId === l.id) && l.secao !== 'identificacao')!;
    const marcadas = { [primeiro!.linhaId]: [primeiro!.categoria], [certa.id]: [] };
    const r = conferirCaca(folha, marcadas);
    const naLinhaDoPrimeiro = folha.erros.filter((e) => e.linhaId === primeiro!.linhaId).length;
    expect(r.encontrados).toHaveLength(naLinhaDoPrimeiro);
    expect(r.encontrados[0]!.tipoCerto).toBe(true);
    expect(r.perdidos).toHaveLength(folha.erros.length - naLinhaDoPrimeiro);
    expect(r.falsosAlarmes).toEqual([certa.id]);
    expect(r.nota).toBe(Math.round(((naLinhaDoPrimeiro - 0.5) / folha.erros.length) * 100));
    const todas: Record<string, CategoriaErro[]> = {};
    folha.erros.forEach((e) => (todas[e.linhaId] = [...(todas[e.linhaId] ?? []), e.categoria]));
    expect(conferirCaca(folha, todas).nota).toBe(100);
    expect(segundo).toBeDefined();
  });
});
