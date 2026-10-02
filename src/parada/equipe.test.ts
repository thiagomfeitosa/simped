import { describe, expect, it } from 'vitest';
import { CENARIOS_PARADA } from '../dados/parada-a-validar';
import { qualidadeDaRcp, textoDoDebriefing } from './debriefing';
import { descreverEventos, metricasDaEquipe, ordensPendentes, participacao, quemFez } from './equipe';
import type { EventoParada } from './parada';
import type { MarcaRcp } from './rcp';

const membros = {
  lider: { nome: 'Ana' },
  medicacao: { nome: 'Carlos' },
  tempo: { nome: 'Davi' },
  registro: { nome: 'Eva' },
};

const EVENTOS: EventoParada[] = [
  { id: 'e1', tipo: 'iniciar', tS: 0 },
  { id: 'e2', tipo: 'acesso', tS: 20, descricao: 'Acesso intraósseo (IO)', por: 'medicacao' },
  { id: 'e3', tipo: 'ordem', tS: 25, para: 'medicacao', texto: 'Adrenalina 0,8 mL', por: 'lider' },
  { id: 'e4', tipo: 'entendido', tS: 28, ordemId: 'e3', por: 'medicacao' },
  { id: 'e5', tipo: 'droga', tS: 40, drogaId: 'adrenalina', volumeMl: 0.8, flushMl: 5, elevouMembro: true, por: 'medicacao' },
  { id: 'e6', tipo: 'anotado', tS: 45, eventoId: 'e5', por: 'registro' },
  { id: 'e7', tipo: 'aviso', tS: 110, aviso: 'checar-ritmo', por: 'tempo' },
  { id: 'e8', tipo: 'checarRitmo', tS: 120, por: 'monitor' },
  { id: 'e9', tipo: 'aviso', tS: 215, aviso: 'adrenalina', por: 'tempo' },
  { id: 'e10', tipo: 'droga', tS: 230, drogaId: 'adrenalina', volumeMl: 0.8, por: 'medicacao' },
  { id: 'e11', tipo: 'ordem', tS: 235, para: 'monitor', texto: 'Checar o ritmo', por: 'lider' },
  { id: 'e12', tipo: 'encerrar', tS: 260, por: 'lider' },
];

describe('o que a equipe fez', () => {
  it('descreve a 2ª dose com flush e elevação do membro, e quem fez', () => {
    const textos = descreverEventos(EVENTOS);
    expect(textos[4]).toBe('💉 Adrenalina 1:10.000 — 1ª dose: 0,8 mL + flush de 5 mL de SF + elevação do membro');
    expect(textos[9]).toBe('💉 Adrenalina 1:10.000 — 2ª dose: 0,8 mL');
    expect(textos[3]).toBe('✔ Entendido: “Adrenalina 0,8 mL”');
    expect(quemFez('medicacao', membros)).toBe('Carlos (Acesso e medicações)');
    expect(quemFez('monitor', membros)).toBe('Monitor e desfibrilador');
  });
  it('ordens que ainda esperam o "entendido"', () => {
    expect(ordensPendentes(EVENTOS, ['monitor']).map((o) => o.id)).toEqual(['e11']);
    expect(ordensPendentes(EVENTOS, ['medicacao'])).toEqual([]);
  });
  it('participação: ações e compressões de cada papel', () => {
    const marcas: MarcaRcp[] = [
      { id: 'c1', tipo: 'compressao', tS: 1, por: 'compressor-1' },
      { id: 'v1', tipo: 'ventilacao', tS: 2, por: 'via-aerea' },
    ];
    const p = participacao(EVENTOS, marcas);
    expect(p.medicacao).toEqual({ acoes: 4, compressoes: 0, ventilacoes: 0 });
    expect(p['compressor-1']?.compressoes).toBe(1);
    expect(p.registro).toBeUndefined();
  });
});

describe('números da equipe para o debriefing', () => {
  const m = metricasDaEquipe(EVENTOS, membros);
  const valor = (id: string) => m.find((x) => x.id === id);
  it('alça fechada, avisos do tempo, anotação e técnica das drogas', () => {
    expect(valor('alca-fechada')).toMatchObject({ valor: '1 de 2 (em média 3 s)', ok: false });
    expect(valor('aviso-2min')).toMatchObject({ valor: '1 de 1', ok: true });
    expect(valor('aviso-adrenalina')).toMatchObject({ valor: '1 de 1', ok: true });
    expect(valor('anotacao')).toMatchObject({ valor: '1 de 4 (atraso médio 00:05)', ok: false });
    expect(valor('flush')).toMatchObject({ valor: '1 de 2', ok: false });
    // com intraósseo, elevar o membro é só informação
    expect(valor('elevacao')?.ok).toBeUndefined();
  });
  it('papel sem ninguém não entra nos números', () => {
    const sem = metricasDaEquipe(EVENTOS.filter((e) => e.por !== 'tempo' && e.por !== 'registro'), { lider: { nome: 'Ana' } });
    expect(sem.find((x) => x.id === 'aviso-2min')).toBeUndefined();
    expect(sem.find((x) => x.id === 'anotacao')).toBeUndefined();
  });
});

describe('debriefing com a RCP pelas teclas', () => {
  const fv = CENARIOS_PARADA.find((c) => c.id === 'fv-escolar')!;
  const marcas: MarcaRcp[] = Array.from({ length: 15 }, (_, i) => ({ id: `c${i}`, tipo: 'compressao' as const, tS: 1 + i * 0.54 }));
  it('qualidade da RCP e texto com equipe e linha do tempo', () => {
    const q = qualidadeDaRcp(fv, EVENTOS, marcas);
    expect(q.find((l) => l.id === 'compressoes')?.valor).toBe('15 (1ª em 00:01)');
    const texto = textoDoDebriefing({
      cenario: fv,
      eventos: EVENTOS,
      briefingFeito: new Set(),
      nomesPapeis: { lider: 'Ana', medicacao: 'Carlos' },
      respostas: {},
      crm: {},
      data: new Date(2026, 9, 2, 10, 0),
      marcas,
    });
    expect(texto).toContain('QUALIDADE DA RCP (teclas)');
    expect(texto).toContain('Fração de compressão (medida)');
    expect(texto).not.toContain('Fração de compressão (estimada)');
    expect(texto).toContain('Carlos (Acesso e medicações): 4 ação(ões)');
    expect(texto).toContain('00:40  💉 Adrenalina 1:10.000 — 1ª dose: 0,8 mL + flush de 5 mL de SF + elevação do membro — Carlos (Acesso e medicações)');
  });
});
