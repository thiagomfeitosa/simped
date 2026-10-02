import { describe, expect, it } from 'vitest';
import { estadoRcp, faixaDe, frequenciaRecente, linhasResumoRcp, type MarcaRcp, resumoRcp } from './rcp';

let contador = 0;
const marca = (tipo: MarcaRcp['tipo'], tS: number): MarcaRcp => ({ id: `m${(contador += 1)}`, tipo, tS });
/** `quantas` compressões a cada `intervalo` s, começando em `inicio`. */
const compressoes = (inicio: number, quantas: number, intervalo = 0.54) => Array.from({ length: quantas }, (_, i) => marca('compressao', inicio + i * intervalo));

describe('frequência das compressões', () => {
  it('0,5 s entre compressões = 120/min; parou há mais de 1,5 s = sem frequência', () => {
    const t = [0, 0.5, 1, 1.5, 2];
    expect(frequenciaRecente(t, 2.1, 6, 1.5)).toBeCloseTo(120);
    expect(frequenciaRecente(t, 4, 6, 1.5)).toBeNull();
    expect(frequenciaRecente([0, 0.5], 0.6, 6, 1.5)).toBeNull();
  });
  it('só conta a sequência depois da última pausa', () => {
    expect(frequenciaRecente([0, 0.5, 5, 5.6, 6.2], 6.3, 6, 1.5)).toBeCloseTo(100);
  });
  it('faixa: lenta, boa, rápida (alvo 100–120/min, A VALIDAR)', () => {
    const alvo = { min: 100, max: 120 };
    expect([faixaDe(90, alvo), faixaDe(110, alvo), faixaDe(130, alvo)]).toEqual(['lenta', 'boa', 'rapida']);
  });
});

describe('estado da RCP (15:2 sem via aérea avançada)', () => {
  it('conta a série e pede 2 ventilações depois de 15 compressões', () => {
    const m = compressoes(0, 15);
    let e = estadoRcp(m, { relacao: 15 }, 8);
    expect(e).toMatchObject({ modo: 'sincronizado', serie: 15, fase: 'ventilar', faixaCompressao: 'boa' });
    expect(e.avisoVentilacao).toContain('2 ventilação');
    m.push(marca('ventilacao', 8.5), marca('ventilacao', 9.5));
    e = estadoRcp(m, { relacao: 15 }, 9.6);
    expect(e.fase).toBe('comprimir');
    m.push(...compressoes(10, 3));
    e = estadoRcp(m, { relacao: 15 }, 11.2);
    expect(e.serie).toBe(3);
    expect(e.ventilacoesNaPausa).toBe(0);
  });
  it('avisa quem passou de 15 sem parar e a ventilação fora da hora', () => {
    expect(estadoRcp(compressoes(0, 17), { relacao: 15 }, 9).avisoCompressao).toContain('Passou de 15');
    const m = [...compressoes(0, 5), marca('ventilacao', 3)];
    expect(estadoRcp(m, { relacao: 15 }, 3.5).avisoVentilacao).toContain('fora da hora');
  });
  it('a checagem de ritmo recomeça a série', () => {
    const e = estadoRcp(compressoes(0, 10), { relacao: 15, recomecosS: [6] }, 6.5);
    expect(e.serie).toBe(0);
  });
  it('30:2 no adolescente: com 15 ainda não é hora de ventilar', () => {
    expect(estadoRcp(compressoes(0, 15), { relacao: 30 }, 8).fase).toBe('comprimir');
  });
});

describe('estado da RCP com via aérea avançada', () => {
  it('compressões contínuas e 1 ventilação a cada 2–3 s; rápido demais avisa hiperventilação', () => {
    const m = [...compressoes(0, 40), marca('ventilacao', 10), marca('ventilacao', 12.5), marca('ventilacao', 15)];
    const e = estadoRcp(m, { relacao: 15, viaAvancadaS: 5 }, 15.2);
    expect(e).toMatchObject({ modo: 'continuo', fase: 'comprimir', faixaVentilacao: 'boa' });
    const rapido = [marca('ventilacao', 20), marca('ventilacao', 21), marca('ventilacao', 22)];
    expect(estadoRcp([...m, ...rapido], { relacao: 15, viaAvancadaS: 5 }, 22.1).avisoVentilacao).toContain('hiperventilação');
  });
});

describe('resumo da RCP para o debriefing', () => {
  it('fração medida, frequência, séries certas e choque com alguém comprimindo', () => {
    // 2 séries de 15 a 0,54 s (≈111/min) com pausa de 4 s para 2 ventilações; código de 0 a 20 s
    const m = [...compressoes(0, 15), marca('ventilacao', 8.5), marca('ventilacao', 9.5), ...compressoes(11.6, 15)];
    const r = resumoRcp(m, { relacao: 15, inicioS: 0, fimS: 20, choquesS: [12] });
    expect(r.compressoes).toBe(30);
    expect(r.freqMedia).toBeCloseTo(111, 0);
    expect(r.pctNaFaixa).toBe(1);
    expect(r).toMatchObject({ series: 1, seriesCertas: 1, pausasComVentilacao: 1, pausasCom2: 1, pausasLongas: 0, choquesComCompressao: 1 });
    // mãos fora: pausa de 4,04 s + o fim (20 − 19,16) → ≈ 76%
    expect(r.fracao).toBeCloseTo(1 - (11.6 - 7.56 + (20 - (11.6 + 14 * 0.54))) / 20, 2);
    const linhas = linhasResumoRcp(r, 15);
    expect(linhas.find((l) => l.id === 'fracao-medida')).toMatchObject({ ok: false });
    expect(linhas.find((l) => l.id === 'choque-seguro')).toMatchObject({ ok: false });
  });
  it('série que passou da conta sem ventilar conta como errada', () => {
    const r = resumoRcp([...compressoes(0, 25), ...compressoes(20, 5)], { relacao: 15, inicioS: 0, fimS: 25, recomecosS: [15] });
    expect(r).toMatchObject({ series: 1, seriesCertas: 0, pausasComVentilacao: 0 });
  });
  it('sem nenhuma compressão: fração zero e aviso', () => {
    const r = resumoRcp([], { relacao: 15, inicioS: 0, fimS: 60 });
    expect(r.fracao).toBe(0);
    expect(linhasResumoRcp(r, 15)).toEqual([{ id: 'compressoes', rotulo: 'Compressões', valor: 'nenhuma registrada', ok: false }]);
  });
  it('ventilação com via aérea avançada: frequência média', () => {
    const v = [10, 12.5, 15, 17.5].map((t) => marca('ventilacao', t));
    const r = resumoRcp([...compressoes(0, 40), ...v], { relacao: 15, inicioS: 0, fimS: 22, viaAvancadaS: 5 });
    expect(r.freqVentilacaoComVia).toBeCloseTo(24);
    expect(r.pctVentilacaoNaFaixa).toBe(1);
  });
});
