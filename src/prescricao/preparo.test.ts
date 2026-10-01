// Números ilustrativos para testar as CONTAS; não são doses validadas.
import { describe, expect, it } from 'vitest';
import { TOLERANCIA_PADRAO } from '../calculos';
import {
  conferirEtapas,
  conferirInfusao,
  conferirSeringaDose,
  etapaVazia,
  type InfusaoCampos,
  infusaoVazia,
  seringaVazia,
  textoEtapas,
  textoInfusao,
  textoSeringa,
} from './preparo';

const tol = TOLERANCIA_PADRAO;
const situacoes = (r: { verificacoes: { situacao: string }[] }) => r.verificacoes.map((v) => v.situacao);

describe('diluição e rediluição em etapas', () => {
  it('1 mL de 1 mg/mL + SF até 10 mL = 0,1 mg/mL (1:10.000)', () => {
    const r = conferirEtapas(
      [{ ...etapaVazia(), aspirarMl: '1', completarAteMl: '10', concentracao: '0,1' }],
      { valor: 1, unidade: 'mg' },
      tol,
    );
    expect(r.concentracaoFinal).toEqual({ valor: 0.1, unidade: 'mg' });
    expect(situacoes(r)).toEqual(['certo']);
    expect(r.verificacoes[0]?.texto).toMatch(/1 mL \+ 9 mL de SF 0,9%/);
  });

  it('rediluição parte da concentração CERTA da etapa anterior', () => {
    const r = conferirEtapas(
      [
        { ...etapaVazia(), aspirarMl: '1', completarAteMl: '10', concentracao: '0,2' }, // errada
        { ...etapaVazia(), aspirarMl: '1', completarAteMl: '10', concentracao: '0,01' }, // certa
      ],
      { valor: 1, unidade: 'mg' },
      tol,
    );
    expect(situacoes(r)).toEqual(['errado', 'certo']);
    expect(r.concentracaoFinal?.valor).toBeCloseTo(0.01, 10);
  });

  it('volume final menor que o aspirado é erro e interrompe a cadeia', () => {
    const r = conferirEtapas(
      [{ ...etapaVazia(), aspirarMl: '5', completarAteMl: '2', concentracao: '1' }],
      { valor: 1, unidade: 'mg' },
      tol,
    );
    expect(r.numerosValidos).toBe(false);
    expect(r.concentracaoFinal).toBeNull();
  });

  it('campos vazios vão para "faltando"', () => {
    const r = conferirEtapas([etapaVazia()], { valor: 1, unidade: 'mg' }, tol);
    expect(r.faltando).toHaveLength(2);
    expect(r.concentracaoFinal).toBeNull();
  });

  it('texto para a folha', () => {
    const etapas = [
      { ...etapaVazia(), aspirarMl: '1', completarAteMl: '10', concentracao: '0,1' },
      { ...etapaVazia(), diluente: 'AD' as const, aspirarMl: '2', completarAteMl: '20', concentracao: '0,01' },
    ];
    expect(textoEtapas(etapas, 'mg')).toBe(
      'diluir 1 mL + SF 0,9% até 10 mL (0,1 mg/mL); rediluir 2 mL + AD até 20 mL (0,01 mg/mL)',
    );
  });
});

describe('seringa da BIC com volume final do hospital (exemplos do usuário)', () => {
  it('gentamicina: 0,3 mL da medicação + 11,7 mL de SF = 12 mL', () => {
    const r = conferirSeringaDose({
      campos: { ...seringaVazia(), soroMl: '11,7', concentracao: '1' },
      volumeDoseMl: 0.3,
      dose: 12,
      unidade: 'mg',
      volumeFinalMl: 12,
      tolerancia: tol,
    });
    expect(situacoes(r)).toEqual(['certo', 'certo']);
  });

  it('NaCl: 5 mL + 7 mL de SF = 12 mL; SF errado é apontado', () => {
    const r = conferirSeringaDose({
      campos: { ...seringaVazia(), soroMl: '12', concentracao: '1' },
      volumeDoseMl: 5,
      dose: 17,
      unidade: 'mEq',
      volumeFinalMl: 12,
      tolerancia: tol,
    });
    expect(r.verificacoes[0]?.situacao).toBe('errado');
    expect(r.verificacoes[0]?.texto).toMatch(/12 mL − 5 mL da dose = 7 mL de SF/);
  });

  it('dose maior que o volume final: avisa que a regra não se aplica', () => {
    const r = conferirSeringaDose({
      campos: seringaVazia(),
      volumeDoseMl: 13,
      dose: 13,
      unidade: 'mg',
      volumeFinalMl: 12,
      tolerancia: tol,
    });
    expect(situacoes(r)).toEqual(['atencao']);
  });

  it('vazão = volume ÷ tempo × 60 (12 mL em 30 min = 24 mL/h)', () => {
    const r = conferirSeringaDose({
      campos: { soroMl: '11,7', concentracao: '1', tempoMin: '30', vazaoMlH: '24' },
      volumeDoseMl: 0.3,
      dose: 12,
      unidade: 'mg',
      volumeFinalMl: 12,
      tolerancia: tol,
    });
    expect(situacoes(r)).toEqual(['certo', 'certo', 'certo']);
    expect(textoSeringa({ soroMl: '11,7', concentracao: '1', tempoMin: '30', vazaoMlH: '24' }, 0.3, 12)).toBe(
      'em BIC: 0,3 mL + 11,7 mL de SF 0,9% = 12 mL, correr em 30 min (24 mL/h)',
    );
  });

  it('vazão sem tempo pede o tempo', () => {
    const r = conferirSeringaDose({
      campos: { soroMl: '11,7', concentracao: '1', tempoMin: '', vazaoMlH: '24' },
      volumeDoseMl: 0.3,
      dose: 12,
      unidade: 'mg',
      volumeFinalMl: 12,
      tolerancia: tol,
    });
    expect(r.faltando).toContain('tempo de infusão (min)');
  });
});

describe('infusão contínua', () => {
  // solução de 1 mg/mL; 0,6 mL na seringa de 12 mL → 0,6 mg = 600 mcg ÷ 12 = 50 mcg/mL
  // 0,1 mcg/kg/min × 10 kg × 60 ÷ 50 mcg/mL = 1,2 mL/h
  const base: InfusaoCampos = {
    ...infusaoVazia(),
    dose: '0,1',
    unidade: 'mcg',
    por: 'min',
    volumeNaSeringaMl: '0,6',
    soroMl: '11,4',
    concentracao: '50',
    vazaoMlH: '1,2',
  };
  const conferir = (campos = base) =>
    conferirInfusao({ campos, concentracaoTrabalho: { valor: 1, unidade: 'mg' }, pesoKg: 10, volumeFinalMl: 12, tolerancia: tol });

  it('tudo certo, com conversão mg → mcg', () => {
    const r = conferir();
    expect(situacoes(r)).toEqual(['certo', 'certo', 'certo', 'atencao']);
    expect(r.verificacoes[3]?.texto).toMatch(/dura 10 h/);
  });

  it('vazão errada mostra a conta certa', () => {
    const r = conferir({ ...base, vazaoMlH: '12' });
    const vazao = r.verificacoes.find((v) => v.texto.includes('Vazão'));
    expect(vazao?.situacao).toBe('errado');
    expect(vazao?.texto).toMatch(/= 1,2 mL\/h/);
  });

  it('dose por hora não multiplica por 60', () => {
    const r = conferir({ ...base, por: 'h', vazaoMlH: '0,02' });
    expect(r.verificacoes.find((v) => v.texto.includes('Vazão'))?.situacao).toBe('certo');
  });

  it('medicação que não cabe na seringa', () => {
    const r = conferir({ ...base, volumeNaSeringaMl: '13' });
    expect(r.numerosValidos).toBe(false);
  });

  it('unidade que não converte (UI × mg)', () => {
    const r = conferir({ ...base, unidade: 'UI' });
    expect(r.verificacoes.some((v) => v.assunto === 'unidades' && v.situacao === 'errado')).toBe(true);
  });

  it('texto para a folha', () => {
    expect(textoInfusao(base, 12)).toBe(
      '0,1 mcg/kg/min em BIC: 0,6 mL + 11,4 mL de SF 0,9% = 12 mL (50 mcg/mL) a 1,2 mL/h — infusão contínua',
    );
  });
});
