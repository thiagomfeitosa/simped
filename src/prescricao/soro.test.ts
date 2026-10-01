// Números ilustrativos para testar as CONTAS do soro; não são prescrições validadas.
import { describe, expect, it } from 'vitest';
import { TOLERANCIA_PADRAO } from '../calculos';
import { solucaoPorId } from '../dados/solucoes';
import { type CamposSoro, calcularSoro, conferirSoro, soroVazio, textoDoSoro } from './soro';

const s = (id: string) => solucaoPorId(id)!;

describe('calcularSoro', () => {
  it('SG 5% 500 mL + NaCl 20% 10 mL + KCl 19,1% 5 mL em 24 h, 10 kg', () => {
    const r = calcularSoro(
      [
        { solucao: s('sg5'), volumeMl: 500 },
        { solucao: s('nacl20'), volumeMl: 10 },
        { solucao: s('kcl191'), volumeMl: 5 },
      ],
      24,
      10,
    )!;
    expect(r.volumeTotalMl).toBe(515);
    expect(r.vazaoMlH).toBeCloseTo(21.458, 3);
    expect(r.glicoseG).toBeCloseTo(25, 10);
    expect(r.glicosePct).toBeCloseTo(4.854, 3);
    expect(r.vigMgKgMin).toBeCloseTo((21.4583 * 4.8544) / 60, 3);
    expect(r.sodioMEq).toBeCloseTo(34, 10);
    expect(r.sodioMEqKgDia).toBeCloseTo(3.4, 10);
    expect(r.potassioMEqKgDia).toBeCloseTo(1.25, 10);
    expect(r.osmolaridade).toBeCloseTo(269.7 + 180.6, 0);
    expect(r.hollidaySegarMlDia).toBe(1000);
  });

  it('soro de 8 h: por dia multiplica por 3', () => {
    const r = calcularSoro([{ solucao: s('sf09'), volumeMl: 100 }], 8, 10)!;
    expect(r.vazaoMlH).toBeCloseTo(12.5, 10);
    expect(r.sodioMEqKgDia).toBeCloseTo((15.4 * 3) / 10, 10);
  });

  it('sem volume não calcula', () => {
    expect(calcularSoro([], 24, 10)).toBeNull();
  });
});

describe('conferirSoro', () => {
  const campos = (parcial: Partial<CamposSoro>): CamposSoro => ({ ...soroVazio(), ...parcial });

  it('SG 5% 1000 mL em 24 h para 10 kg: vazão 41,67 e VIG 3,47', () => {
    const r = conferirSoro(
      campos({ componentes: [{ solucaoId: 'sg5', volumeMl: '1000' }], vazaoMlH: '41,67', vig: '3,47' }),
      10,
      TOLERANCIA_PADRAO,
    );
    expect(r.verificacoes.filter((v) => v.situacao === 'certo')).toHaveLength(2);
    expect(r.completo).toBe(true);
  });

  it('vazão errada mostra a conta certa', () => {
    const r = conferirSoro(campos({ componentes: [{ solucaoId: 'sg5', volumeMl: '1000' }], vazaoMlH: '50' }), 10, TOLERANCIA_PADRAO);
    expect(r.verificacoes[0]?.situacao).toBe('errado');
    expect(r.verificacoes[0]?.texto).toMatch(/1\.000 mL ÷ 24 h = 41,67 mL\/h/);
  });

  it('referências A VALIDAR só informam (VIG baixa)', () => {
    const r = conferirSoro(campos({ componentes: [{ solucaoId: 'sg5', volumeMl: '1000' }], vazaoMlH: '41,67' }), 10, TOLERANCIA_PADRAO);
    const ref = r.verificacoes.find((v) => v.situacao === 'a-validar');
    expect(ref?.texto).toMatch(/VIG/);
  });

  it('osmolaridade alta avisa', () => {
    const r = conferirSoro(
      campos({ componentes: [{ solucaoId: 'g50', volumeMl: '100' }], vazaoMlH: '4,17' }),
      10,
      TOLERANCIA_PADRAO,
    );
    expect(r.verificacoes.some((v) => v.assunto === 'alerta')).toBe(true);
  });

  it('falta volume e vazão', () => {
    const r = conferirSoro(soroVazio(), 10, TOLERANCIA_PADRAO);
    expect(r.faltando).toEqual(['volume de SG 5%', 'vazão (mL/h)']);
    expect(r.completo).toBe(false);
  });

  it('texto da folha', () => {
    expect(
      textoDoSoro(
        campos({
          componentes: [
            { solucaoId: 'sg5', volumeMl: '500' },
            { solucaoId: 'nacl20', volumeMl: '10' },
            { solucaoId: 'kcl191', volumeMl: '5' },
          ],
          vazaoMlH: '21,5',
        }),
      ),
    ).toBe('SG 5% 500 mL + NaCl 20% 10 mL + KCl 19,1% 5 mL — EV em 24 h (21,5 mL/h)');
  });
});

describe('alertas de potássio no soro (A VALIDAR)', () => {
  it('concentração acima de 40 mEq/L e velocidade acima de 0,5 mEq/kg/h', () => {
    // 100 mL de SF + 4 mL de KCl 19,1% (10 mEq) = 96 mEq/L; em 1 h para 10 kg = 1 mEq/kg/h
    const r = conferirSoro(
      {
        ...soroVazio(),
        componentes: [
          { solucaoId: 'sf09', volumeMl: '100' },
          { solucaoId: 'kcl191', volumeMl: '4' },
        ],
        horas: '1',
        vazaoMlH: '104',
      },
      10,
      TOLERANCIA_PADRAO,
    );
    const alertas = r.verificacoes.filter((v) => v.assunto === 'alerta').map((v) => v.texto);
    expect(alertas.join(' ')).toMatch(/96,15 mEq\/L/);
    expect(alertas.join(' ')).toMatch(/1 mEq\/kg\/h/);
  });
});
