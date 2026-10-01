import { describe, expect, it } from 'vitest';
import {
  CONFIGURACOES_PADRAO,
  escreverConfiguracoes,
  hospitalAtual,
  lerConfiguracoes,
  toleranciaDe,
} from './configuracoes';

describe('configurações', () => {
  it('sem nada guardado, usa o padrão (SBP, Santa Casa, treino, 1%)', () => {
    expect(lerConfiguracoes(null)).toEqual(CONFIGURACOES_PADRAO);
    expect(hospitalAtual(CONFIGURACOES_PADRAO).volumeFinalBicMl).toBe(12);
  });

  it('ida e volta sem perder nada', () => {
    const config = {
      ...CONFIGURACOES_PADRAO,
      fonteDose: 'AAP' as const,
      fonteFaixa: 'PALS' as const,
      hospitalId: 'generico',
      ajustesHospital: { volumeFinalBicMl: 24, horaInicial: '07:00' },
      modo: 'prova' as const,
      margemPct: 2,
    };
    expect(lerConfiguracoes(escreverConfiguracoes(config))).toEqual(config);
  });

  it('valores estranhos voltam ao padrão (nunca quebra o app)', () => {
    expect(lerConfiguracoes('{isso não é json')).toEqual(CONFIGURACOES_PADRAO);
    const lido = lerConfiguracoes(
      JSON.stringify({
        fonteDose: 'XYZ',
        hospitalId: 'nao-existe',
        modo: 'outro',
        margemPct: 99,
        ajustesHospital: { volumeFinalBicMl: -3, horaInicial: '25:99' },
      }),
    );
    expect(lido).toEqual(CONFIGURACOES_PADRAO);
  });

  it('ajuste do usuário vale por cima do hospital', () => {
    const config = { ...CONFIGURACOES_PADRAO, ajustesHospital: { volumeFinalBicMl: 10 } };
    expect(hospitalAtual(config).volumeFinalBicMl).toBe(10);
    expect(hospitalAtual(config).nome).toBe('Santa Casa');
  });

  it('margem em % vira tolerância relativa', () => {
    expect(toleranciaDe({ ...CONFIGURACOES_PADRAO, margemPct: 2.5 }).relativa).toBeCloseTo(0.025);
  });
});
