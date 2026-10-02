import { describe, expect, it } from 'vitest';
import { METODOS_MATURIDADE } from '../dados/neonatal/maturidade-a-validar';
import {
  calcularMaturidade,
  classificarIgDetalhada,
  classificarPesoParaIg,
  criteriosDoMetodo,
  dataBr,
  decidirIg,
  diaDoTexto,
  igPelaDum,
  igPelaUsg,
  textoIg,
} from './maturidade';

const metodo = (id: string) => METODOS_MATURIDADE.find((m) => m.id === id)!;

describe('tabelas de maturidade (A VALIDAR)', () => {
  it('cada critério tem opções em ordem crescente de pontos, sem repetir', () => {
    for (const m of METODOS_MATURIDADE) {
      expect(m.status).toBe('A_VALIDAR');
      expect(m.fonte.referencia.length).toBeGreaterThan(10);
      for (const c of m.criterios) {
        const pontos = c.opcoes.map((o) => o.pontos);
        expect([...pontos].sort((a, b) => a - b), `${m.id}/${c.id}`).toEqual(pontos);
        expect(new Set(pontos).size).toBe(pontos.length);
      }
    }
  });

  it('Capurro somático: 5 sinais físicos; somático-neurológico: 4 físicos + 2 neurológicos', () => {
    expect(metodo('capurro-somatico').criterios.map((c) => c.id)).toEqual(['textura-pele', 'forma-orelha', 'glandula-mamaria', 'formacao-mamilo', 'pregas-plantares']);
    const sn = metodo('capurro-somatico-neurologico').criterios;
    expect(sn.filter((c) => c.tipo === 'somatico')).toHaveLength(4);
    expect(sn.filter((c) => c.tipo === 'neurologico').map((c) => c.id)).toEqual(['sinal-xale', 'posicao-cabeca']);
  });

  it('New Ballard: 6 neuromusculares + 6 físicos (genitais pelo sexo)', () => {
    const b = metodo('new-ballard');
    expect(criteriosDoMetodo(b, 'masculino')).toHaveLength(12);
    expect(criteriosDoMetodo(b, 'feminino').map((c) => c.id)).toContain('genitais-femininos');
    expect(criteriosDoMetodo(b, 'feminino').map((c) => c.id)).not.toContain('genitais-masculinos');
  });
});

describe('Capurro', () => {
  it('somático: IG (dias) = 204 + pontos', () => {
    const r = calcularMaturidade(metodo('capurro-somatico'), { 'textura-pele': 15, 'forma-orelha': 16, 'glandula-mamaria': 10, 'formacao-mamilo': 10, 'pregas-plantares': 15 });
    expect(r.completo).toBe(true);
    expect(r.pontos).toBe(66);
    expect(r.igDias).toBe(270);
    expect(r.ig).toEqual({ semanas: 38, dias: 4 });
    expect(r.conta).toBe('204 + 66 = 270 dias ÷ 7 = 38 semanas e 4 dias');
  });

  it('somático-neurológico: IG (dias) = 200 + pontos', () => {
    const r = calcularMaturidade(metodo('capurro-somatico-neurologico'), {
      'textura-pele': 10,
      'forma-orelha': 8,
      'glandula-mamaria': 5,
      'pregas-plantares': 10,
      'sinal-xale': 6,
      'posicao-cabeca': 4,
    });
    expect(r.pontos).toBe(43);
    expect(r.igDias).toBe(243);
    expect(textoIg(r.ig)).toBe('34 semanas e 5 dias');
  });

  it('avisa o que falta e recusa pontuação que não existe', () => {
    const r = calcularMaturidade(metodo('capurro-somatico'), { 'textura-pele': 5 });
    expect(r.completo).toBe(false);
    expect(r.faltam).toEqual(['Forma da orelha', 'Glândula mamária', 'Formação do mamilo', 'Pregas plantares']);
    expect(() => calcularMaturidade(metodo('capurro-somatico'), { 'textura-pele': 7 })).toThrow(/não é uma opção/);
  });
});

describe('New Ballard', () => {
  const b = () => metodo('new-ballard');
  const todos = (pontos: number, sexo: 'masculino' | 'feminino' = 'masculino') =>
    Object.fromEntries(criteriosDoMetodo(b(), sexo).map((c) => [c.id, c.opcoes.reduce((perto, o) => (Math.abs(o.pontos - pontos) < Math.abs(perto - pontos) ? o.pontos : perto), c.opcoes[0]!.pontos)]));

  it('IG = 24 + 0,4 × pontos (0 = 24 s; 40 = 40 s; −10 = 20 s; 50 = 44 s)', () => {
    const zero = calcularMaturidade(b(), todos(0));
    expect(zero.pontos).toBe(0);
    expect(zero.ig).toEqual({ semanas: 24, dias: 0 });
    const r = calcularMaturidade(b(), { ...todos(3), postura: 4, 'janela-quadrada': 4, 'retracao-braco': 4, 'angulo-popliteo': 4 });
    expect(r.pontos).toBe(40);
    expect(r.ig).toEqual({ semanas: 40, dias: 0 });
    expect(r.conta).toBe('24 + 0,4 × (40) = 40 semanas ≈ 40 semanas');
  });

  it('pontuação vira semanas e dias (35 pontos = 38 s; 31 pontos = 36 s e 3 d)', () => {
    const base = todos(3); // 12 critérios × 3 = 36 pontos
    const r35 = calcularMaturidade(b(), { ...base, 'angulo-popliteo': 2 });
    expect(r35.pontos).toBe(35);
    expect(textoIg(r35.ig)).toBe('38 semanas');
    const r31 = calcularMaturidade(b(), { ...base, 'angulo-popliteo': 2, 'sinal-cachecol': 2, 'calcanhar-orelha': 2, pele: 2, lanugo: 2 });
    expect(r31.pontos).toBe(31);
    expect(r31.igDias).toBe(255); // 24 + 0,4 × 31 = 36,4 s = 254,8 dias
    expect(textoIg(r31.ig)).toBe('36 semanas e 3 dias');
  });

  it('marca pontuação fora da tabela (menos de −10)', () => {
    const r = calcularMaturidade(b(), todos(-2));
    expect(r.pontos).toBeLessThan(-10);
    expect(r.foraDaTabela).toBe('abaixo');
  });
});

describe('classificações', () => {
  it('IG detalhada', () => {
    expect(classificarIgDetalhada(27 * 7 + 6).nome).toMatch(/^Pré-termo extremo/);
    expect(classificarIgDetalhada(28 * 7).nome).toMatch(/^Muito pré-termo/);
    expect(classificarIgDetalhada(33 * 7 + 6).nome).toMatch(/^Pré-termo moderado/);
    expect(classificarIgDetalhada(36 * 7 + 6).nome).toMatch(/^Pré-termo tardio/);
    expect(classificarIgDetalhada(37 * 7).grupo).toBe('termo');
    expect(classificarIgDetalhada(40 * 7).nome).toMatch(/^Termo completo/);
    expect(classificarIgDetalhada(41 * 7 + 6).nome).toMatch(/^Termo tardio/);
    expect(classificarIgDetalhada(42 * 7).grupo).toBe('pos-termo');
  });

  it('PIG / AIG / GIG pelo percentil', () => {
    expect(classificarPesoParaIg(5).sigla).toBe('PIG');
    expect(classificarPesoParaIg(10).sigla).toBe('AIG');
    expect(classificarPesoParaIg(90).sigla).toBe('AIG');
    expect(classificarPesoParaIg(95).sigla).toBe('GIG');
  });
});

describe('IG pela DUM e pela USG', () => {
  it('datas sem fuso', () => {
    expect(diaDoTexto('1970-01-02')).toBe(1);
    expect(dataBr(diaDoTexto('2026-03-15'))).toBe('15/03/2026');
    expect(() => diaDoTexto('2026-02-30')).toThrow();
    expect(() => diaDoTexto('15/03/2026')).toThrow();
  });

  it('DUM: IG e DPP (Naegele, +280 dias)', () => {
    const r = igPelaDum('2026-01-01', '2026-09-08');
    expect(r.igDias).toBe(250);
    expect(r.ig).toEqual({ semanas: 35, dias: 5 });
    expect(dataBr(r.dpp)).toBe('08/10/2026');
  });

  it('USG: IG do exame + dias desde o exame', () => {
    const r = igPelaUsg('2026-03-01', { semanas: 10, dias: 2 }, '2026-04-01');
    expect(r.ig).toEqual({ semanas: 14, dias: 5 });
    expect(dataBr(r.dpp)).toBe('25/09/2026');
  });

  it('decide entre DUM e USG pela diferença permitida para a IG da USG', () => {
    // USG de 1º trimestre (10 s): até 7 dias de diferença mantém a DUM
    const mantem = decidirIg('2026-01-01', '2026-03-17', { semanas: 10, dias: 0 }, '2026-09-01');
    expect(mantem.diferencaDias).toBe(5);
    expect(mantem.usar).toBe('DUM');
    const redata = decidirIg('2026-01-01', '2026-03-17', { semanas: 8, dias: 6 }, '2026-09-01');
    expect(redata.diferencaDias).toBe(13);
    expect(redata.usar).toBe('USG');
    expect(redata.motivo).toMatch(/até 8 semanas e 6 dias/);
  });
});
