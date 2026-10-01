import { describe, expect, it } from 'vitest';
import { BANCO_MEDICACOES } from '../dados/medicacoes';
import { reproduzirEventos } from '../motor/paciente';
import { pacienteNoMinuto } from '../paciente/atual';
import { CASOS, casosPorGrupo, verificarCaso } from './index';

describe('casos clínicos', () => {
  it('são 16 casos + o de demonstração, com ids únicos', () => {
    expect(CASOS).toHaveLength(17);
    expect(new Set(CASOS.map((c) => c.id)).size).toBe(CASOS.length);
  });

  for (const caso of CASOS) {
    it(`${caso.id}: passa no verificador`, () => {
      expect(verificarCaso(caso, BANCO_MEDICACOES)).toEqual([]);
    });
  }

  it('a idade de cada paciente bate com o texto do caso', () => {
    const idade = (id: string) => {
      const caso = CASOS.find((c) => c.id === id)!;
      return pacienteNoMinuto(caso, 0).idadeTexto;
    };
    expect(idade('caso01-hipoglicemia-rn')).toBe('2 h de vida');
    expect(idade('caso02-sepse-neonatal')).toBe('18 h de vida');
    expect(idade('caso03-sifilis-congenita')).toBe('48 h de vida');
    expect(idade('caso05-toxoplasmose-congenita')).toBe('7 dias de vida');
    expect(idade('caso06-asma-grave')).toBe('7 anos e 4 meses');
    expect(idade('caso11-tsv')).toBe('4 meses');
    expect(idade('caso15-hiponatremia')).toBe('10 meses');
    expect(idade('caso09-anafilaxia')).toBe('14 anos e 6 meses');
  });

  it('o motor roda todos os casos por 6 h sem quebrar e sem sinal negativo', () => {
    for (const caso of CASOS) {
      const ids = (caso.respostas ?? []).map((r) => r.medicacaoId);
      const eventos = [
        ...ids.map((medicacaoId) => ({ tipo: 'medicacaoAdministrada' as const, medicacaoId, descricao: medicacaoId })),
        { tipo: 'tempoPassou' as const, minutos: 360 },
      ];
      const estado = reproduzirEventos(caso, eventos);
      for (const v of Object.values(estado.sinais)) expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it('verificador pega erro de digitação', () => {
    const caso = CASOS[1]!;
    const errado = { ...caso, respostas: [{ medicacaoId: 'ampicilna', mudancas: [], status: 'A_VALIDAR' as const }] };
    expect(verificarCaso(errado, BANCO_MEDICACOES).join(' ')).toMatch(/ampicilna/);
  });

  it('menu agrupado', () => {
    const grupos = casosPorGrupo(CASOS).map(([g]) => g);
    expect(grupos).toContain('Neonatologia');
    expect(grupos).toContain('Emergência');
  });
});
