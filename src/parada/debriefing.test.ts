import { describe, expect, it } from 'vitest';
import { CENARIOS_PARADA } from '../dados/parada-a-validar';
import { CHECKLIST_BRIEFING, PAPEIS_EQUIPE } from '../dados/parada-briefing-a-validar';
import { metricasDoCodigo, textoDoDebriefing } from './debriefing';
import type { EventoParada } from './parada';

const cenario = (id: string) => CENARIOS_PARADA.find((c) => c.id === id)!;

const FV_BEM_FEITA: EventoParada[] = [
  { tipo: 'iniciar', tS: 0 },
  { tipo: 'acesso', tS: 20, descricao: 'Acesso intraósseo (IO)' },
  { tipo: 'choque', tS: 10, joules: 40 },
  { tipo: 'checarRitmo', tS: 130 },
  { tipo: 'choque', tS: 135, joules: 80 },
  { tipo: 'droga', tS: 150, drogaId: 'adrenalina', volumeMl: 2 },
  { tipo: 'checarRitmo', tS: 255 },
  { tipo: 'choque', tS: 260, joules: 80 },
  { tipo: 'droga', tS: 270, drogaId: 'amiodarona', volumeMl: 2 },
  { tipo: 'checarRitmo', tS: 380 },
  { tipo: 'encerrar', tS: 400 },
].sort((a, b) => a.tS - b.tS) as EventoParada[];

const valor = (ms: ReturnType<typeof metricasDoCodigo>, id: string) => ms.find((m) => m.id === id);

describe('números do debriefing', () => {
  it('sem código iniciado não há números', () => {
    expect(metricasDoCodigo(cenario('fv-escolar'), [])).toEqual([]);
  });

  it('FV bem conduzida: tempos, checagens e fração de compressão estimada', () => {
    const m = metricasDoCodigo(cenario('fv-escolar'), FV_BEM_FEITA);
    expect(valor(m, 'total')?.valor).toBe('06:40');
    expect(valor(m, 'rce')).toMatchObject({ ok: true });
    expect(valor(m, 'choque1')).toMatchObject({ valor: '00:10', ok: true });
    expect(valor(m, 'adrenalina1')?.valor).toBe('02:30');
    expect(valor(m, 'checagens')?.valor).toMatch(/^3 \(/);
    expect(valor(m, 'acesso')?.valor).toBe('00:20');
    expect(valor(m, 'via-aerea')?.valor).toBe('não registrada');
    // pausas: 3 checagens × 10 s + 3 choques × 5 s = 45 s em 400 s → 89%
    expect(valor(m, 'fracao')).toMatchObject({ valor: '89%', ok: true });
    expect(valor(m, 'algoritmo')?.ok).toBe(true);
  });

  it('assistolia sem adrenalina: marca o que faltou', () => {
    const ev: EventoParada[] = [
      { tipo: 'iniciar', tS: 0 },
      { tipo: 'checarRitmo', tS: 200 },
      { tipo: 'encerrar', tS: 260 },
    ];
    const m = metricasDoCodigo(cenario('assistolia-lactente'), ev);
    expect(valor(m, 'adrenalina1')).toMatchObject({ valor: 'não dada', ok: false });
    expect(valor(m, 'checagens')?.ok).toBe(false);
    expect(valor(m, 'choque1')).toBeUndefined();
  });

  it('o texto para baixar junta briefing, equipe, números, avaliação e anotações', () => {
    const texto = textoDoDebriefing({
      cenario: cenario('fv-escolar'),
      eventos: FV_BEM_FEITA,
      briefingFeito: new Set(['peso', 'papeis']),
      nomesPapeis: { lider: 'Dra. Ana' },
      respostas: { analise: '+ choque rápido; Δ demorou o acesso' },
      crm: { 'Comunicação em alça fechada': 3 },
      data: new Date(2026, 9, 2, 10, 0),
    });
    expect(texto).toContain(`BRIEFING (2 de ${CHECKLIST_BRIEFING.length} itens)`);
    expect(texto).toContain('Líder: Dra. Ana');
    expect(texto).toContain(`${PAPEIS_EQUIPE[1]!.nome}: (não definido)`);
    expect(texto).toContain('✔ Fração de compressão (estimada): 89%');
    expect(texto).toContain('+ choque rápido; Δ demorou o acesso');
    expect(texto).toContain('3 · Comunicação em alça fechada');
    expect(texto).toContain('A VALIDAR');
  });
});
