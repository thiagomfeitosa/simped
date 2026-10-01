import { describe, expect, it } from 'vitest';
import {
  calcularVariaveis,
  classificarIG,
  classificarPesoNascer,
  idadeCorrigidaDias,
  idadeCronologica,
  idadePosMenstrual,
  lerDataHora,
  nomeDaFaixa,
  somarMinutos,
  superficieCorporal,
  textoIdade,
  verificarDadosDeOrigem,
} from './variaveis';

const d = lerDataHora;

describe('lerDataHora', () => {
  it('lê data com hora e sem hora', () => {
    expect(d('2026-10-01T08:30').toISOString()).toBe('2026-10-01T08:30:00.000Z');
    expect(d('2026-10-01').toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });
  it('recusa formato errado e data inexistente', () => {
    expect(() => d('01/10/2026')).toThrow();
    expect(() => d('2026-02-30T10:00')).toThrow(/inexistente/);
  });
  it('soma minutos', () => {
    expect(somarMinutos('2026-10-01T23:30', 45).toISOString()).toBe('2026-10-02T00:15:00.000Z');
  });
});

describe('idade cronológica', () => {
  it('conta só unidades completas', () => {
    const idade = idadeCronologica(d('2026-10-01T08:00'), d('2026-10-03T07:59'));
    expect(idade).toEqual({ horas: 47, dias: 1, semanas: 0, meses: 0, anos: 0 });
  });
  it('7 dias completos exatamente na mesma hora do nascimento', () => {
    expect(idadeCronologica(d('2026-10-01T08:00'), d('2026-10-08T08:00')).dias).toBe(7);
    expect(idadeCronologica(d('2026-10-01T08:00'), d('2026-10-08T07:59')).dias).toBe(6);
  });
  it('meses de calendário (dia 31 em mês curto)', () => {
    expect(idadeCronologica(d('2026-01-31'), d('2026-02-28')).meses).toBe(0);
    expect(idadeCronologica(d('2026-01-31'), d('2026-03-31')).meses).toBe(2);
    expect(idadeCronologica(d('2026-01-15T10:00'), d('2026-02-15T09:00')).meses).toBe(0);
    expect(idadeCronologica(d('2026-01-15T10:00'), d('2026-02-15T10:00')).meses).toBe(1);
  });
  it('anos (inclui 29 de fevereiro)', () => {
    expect(idadeCronologica(d('2022-06-10'), d('2026-06-09')).anos).toBe(3);
    expect(idadeCronologica(d('2022-06-10'), d('2026-06-10')).anos).toBe(4);
    expect(idadeCronologica(d('2024-02-29'), d('2025-02-28')).anos).toBe(0);
    expect(idadeCronologica(d('2024-02-29'), d('2025-03-01')).anos).toBe(1);
  });
  it('recusa data atual antes do nascimento', () => {
    expect(() => idadeCronologica(d('2026-10-02'), d('2026-10-01'))).toThrow();
  });
});

describe('texto da idade', () => {
  it('horas, dias, meses e anos', () => {
    expect(textoIdade(idadeCronologica(d('2026-10-01T08:00'), d('2026-10-02T20:00')))).toBe('36 h de vida');
    expect(textoIdade(idadeCronologica(d('2026-10-01'), d('2026-10-06')))).toBe('5 dias de vida');
    expect(textoIdade(idadeCronologica(d('2026-01-01'), d('2026-05-02')))).toBe('4 meses');
    expect(textoIdade(idadeCronologica(d('2025-10-01'), d('2026-10-01')))).toBe('12 meses');
    expect(textoIdade(idadeCronologica(d('2022-08-01'), d('2026-10-01')))).toBe('4 anos e 2 meses');
    expect(textoIdade(idadeCronologica(d('2016-10-01'), d('2026-10-01')))).toBe('10 anos');
  });
});

describe('idade pós-menstrual e corrigida', () => {
  it('IPM = IG ao nascer + idade (exemplo do docs: 30s + 4 semanas = 34s)', () => {
    expect(idadePosMenstrual({ semanas: 30, dias: 0 }, 28)).toEqual({ semanas: 34, dias: 0 });
    expect(idadePosMenstrual({ semanas: 34, dias: 3 }, 5)).toEqual({ semanas: 35, dias: 1 });
  });
  it('idade corrigida = idade − (40 semanas − IG)', () => {
    // nasceu com 32s: faltavam 8 semanas (56 dias) para o termo
    expect(idadeCorrigidaDias({ semanas: 32, dias: 0 }, 90)).toBe(34);
    expect(idadeCorrigidaDias({ semanas: 32, dias: 0 }, 30)).toBe(-26);
  });
});

describe('superfície corporal', () => {
  it('Mosteller com estatura', () => {
    // √(16 × 100 ÷ 3600) = √0,4444 = 0,6667
    expect(superficieCorporal(16, 100).m2).toBeCloseTo(0.6667, 4);
    expect(superficieCorporal(16, 100).formula).toBe('Mosteller');
  });
  it('fórmula pelo peso sem estatura', () => {
    // (4 × 10 + 7) ÷ (10 + 90) = 0,47
    expect(superficieCorporal(10).m2).toBeCloseTo(0.47, 6);
  });
  it('recusa peso zero', () => {
    expect(() => superficieCorporal(0)).toThrow();
  });
});

describe('classificações (tabelas A VALIDAR)', () => {
  it('pela IG', () => {
    expect(classificarIG({ semanas: 27, dias: 6 })).toBe('Pré-termo extremo');
    expect(classificarIG({ semanas: 28, dias: 0 })).toBe('Muito pré-termo');
    expect(classificarIG({ semanas: 36, dias: 6 })).toBe('Pré-termo moderado a tardio');
    expect(classificarIG({ semanas: 37, dias: 0 })).toBe('Termo');
    expect(classificarIG({ semanas: 42, dias: 0 })).toBe('Pós-termo');
  });
  it('pelo peso ao nascer', () => {
    expect(classificarPesoNascer(999)).toBe('Extremo baixo peso');
    expect(classificarPesoNascer(1000)).toBe('Muito baixo peso');
    expect(classificarPesoNascer(2499)).toBe('Baixo peso');
    expect(classificarPesoNascer(2500)).toMatch(/adequado/);
  });
  it('nome da faixa muda com a fonte', () => {
    const umAnoEMeio = 548;
    expect(nomeDaFaixa(umAnoEMeio, 'SBP')).toBe('Lactente');
    expect(nomeDaFaixa(umAnoEMeio, 'OMS')).toBe('Criança');
    expect(nomeDaFaixa(10, 'SBP')).toBe('Recém-nascido');
    expect(nomeDaFaixa(4000, 'PALS', false)).toBe('Criança (child)');
    expect(nomeDaFaixa(4000, 'PALS', true)).toBe('Adulto (pós-puberdade)');
  });
});

describe('calcularVariaveis', () => {
  it('RN prematuro de 5 dias', () => {
    const v = calcularVariaveis(
      { nascimento: '2026-09-26T08:00', igNascer: { semanas: 34, dias: 3 }, pesoNascerG: 2100, pesoKg: 2.05 },
      d('2026-10-01T09:00'),
    );
    expect(v.idade.dias).toBe(5);
    expect(v.idadeTexto).toBe('5 dias de vida');
    expect(v.idadePosMenstrual).toEqual({ semanas: 35, dias: 1 });
    expect(v.prematuro).toBe(true);
    expect(v.idadeCorrigida?.dias).toBe(5 - (280 - 241));
    expect(v.faixa).toBe('RN');
    expect(v.nomeFaixa).toBe('Recém-nascido');
    expect(v.classificacaoPesoNascer).toBe('Baixo peso');
  });
  it('a faixa de dose muda sozinha quando o tempo passa', () => {
    const origem = { nascimento: '2026-09-03T10:00', igNascer: { semanas: 39, dias: 0 }, pesoNascerG: 3200, pesoKg: 3.6 };
    expect(calcularVariaveis(origem, d('2026-10-01T09:59')).faixa).toBe('RN');
    expect(calcularVariaveis(origem, d('2026-10-01T10:00')).faixa).toBe('crianca');
  });
  it('criança a termo não mostra idade corrigida', () => {
    const v = calcularVariaveis(
      { nascimento: '2022-08-01T10:00', igNascer: { semanas: 39, dias: 2 }, pesoNascerG: 3300, pesoKg: 16, estaturaCm: 102 },
      d('2026-10-01T08:00'),
    );
    expect(v.idadeCorrigida).toBeUndefined();
    expect(v.faixa).toBe('crianca');
    expect(v.nomeFaixa).toBe('Pré-escolar');
    expect(v.superficieCorporal.formula).toBe('Mosteller');
  });
});

describe('verificarDadosDeOrigem', () => {
  it('aceita dados corretos e aponta os errados', () => {
    const certo = { nascimento: '2026-09-26T08:00', igNascer: { semanas: 34, dias: 3 }, pesoNascerG: 2100, pesoKg: 2 };
    expect(verificarDadosDeOrigem(certo, '2026-10-01T08:00')).toEqual([]);
    expect(verificarDadosDeOrigem(certo, '2026-09-01T08:00')).toContain('O início do caso é anterior ao nascimento.');
    expect(verificarDadosDeOrigem({ ...certo, igNascer: { semanas: 34, dias: 9 } })).toHaveLength(1);
    expect(verificarDadosDeOrigem({ ...certo, pesoKg: 0 })).toHaveLength(1);
  });
});
