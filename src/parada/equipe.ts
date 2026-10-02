/**
 * Equipe do código de parada (sem tela): o texto de cada ação para o quadro "o que a equipe fez",
 * quem fez o quê e os números da equipe para o debriefing (ordens em alça fechada, avisos do tempo,
 * anotação, flush). Roteiro A VALIDAR (src/dados/parada-briefing-a-validar.ts).
 */

import { DROGAS_PARADA } from '../dados/parada-a-validar';
import { PAPEIS_EQUIPE } from '../dados/parada-briefing-a-validar';
import { ADMINISTRACAO_DROGA } from '../dados/parada-rcp-a-validar';
import { formatarNumero } from '../prescricao/comum';
import { EVENTOS_DA_FOLHA, type EventoParada, mmss } from './parada';
import type { MarcaRcp } from './rcp';
import type { Membro } from './sala';

const n = formatarNumero;

export function papelPorId(id: string | undefined) {
  return PAPEIS_EQUIPE.find((p) => p.id === id);
}

/** "Carlos (Acesso e medicações)" ou só o papel, se não tiver nome. */
export function quemFez(por: string | undefined, membros: Readonly<Record<string, Membro>>): string {
  const papel = papelPorId(por);
  if (!papel) return 'Equipe';
  const nome = membros[papel.id]?.nome.trim();
  return nome ? `${nome} (${papel.nome})` : papel.nome;
}

const ordinal = (k: number, feminino: boolean) => `${k}${feminino ? 'ª' : 'º'}`;

/**
 * Texto de cada evento, na ordem (ex.: "💉 Adrenalina 1:10.000 — 2ª dose: 0,8 mL + flush de 5 mL de SF
 * + elevação do membro"). `ritmo(i)` diz o que a checagem i mostrou (o modo prova pode esconder).
 */
export function descreverEventos(eventos: readonly EventoParada[], ritmo?: (i: number) => string | undefined): string[] {
  const contagem: Record<string, number> = {};
  const conta = (chave: string) => (contagem[chave] = (contagem[chave] ?? 0) + 1);
  return eventos.map((e, i) => {
    switch (e.tipo) {
      case 'iniciar':
        return '▶ Código iniciado: RCP de alta qualidade';
      case 'checarRitmo': {
        const r = ritmo?.(i);
        return `🔍 Checagem de ritmo${r ? `: ${r}` : ''}`;
      }
      case 'carga':
        return e.joules > 0 ? `⚡ Desfibrilador carregado: ${n(e.joules)} J — afastem-se!` : '⚡ Carga cancelada';
      case 'choque':
        return `⚡ Choque de ${n(e.joules)} J (${ordinal(conta('choque'), false)})`;
      case 'droga': {
        const nome = DROGAS_PARADA.find((d) => d.id === e.drogaId)?.nome ?? e.drogaId;
        const partes = [`💉 ${nome} — ${ordinal(conta(e.drogaId), true)} dose: ${n(e.volumeMl)} mL`];
        if (e.flushMl) partes.push(`flush de ${n(e.flushMl)} mL de SF`);
        if (e.elevouMembro) partes.push('elevação do membro');
        return partes.join(' + ');
      }
      case 'fluido':
        return `💧 SF 0,9% ${n(e.volumeMl)} mL em bolus`;
      case 'viaAerea':
        return `🫁 ${e.descricao}`;
      case 'acesso':
        return `🩸 ${e.descricao}`;
      case 'aviso':
        return e.aviso === 'checar-ritmo' ? '📣 2 minutos: checar o ritmo e trocar o compressor' : '📣 Hora da adrenalina (3–5 min desde a última)';
      case 'ordem':
        return `📣 Ordem para ${papelPorId(e.para)?.nome ?? e.para}: ${e.texto}`;
      case 'entendido': {
        const ordem = eventos.find((o) => o.id === e.ordemId);
        return `✔ Entendido${ordem?.tipo === 'ordem' ? `: “${ordem.texto}”` : ''}`;
      }
      case 'anotacao':
        return `📝 ${e.texto}`;
      case 'anotado':
        return '✍️ Anotado na folha';
      case 'encerrar':
        return '⏹ Código encerrado';
    }
  });
}

/** Quantas ações cada papel fez (e quantas compressões/ventilações apertou). */
export function participacao(eventos: readonly EventoParada[], marcas: readonly MarcaRcp[]): Record<string, { acoes: number; compressoes: number; ventilacoes: number }> {
  const r: Record<string, { acoes: number; compressoes: number; ventilacoes: number }> = {};
  const de = (p: string) => (r[p] ??= { acoes: 0, compressoes: 0, ventilacoes: 0 });
  for (const e of eventos) if (e.por && e.tipo !== 'anotado') de(e.por).acoes += 1;
  for (const m of marcas) if (m.por) de(m.por)[m.tipo === 'compressao' ? 'compressoes' : 'ventilacoes'] += 1;
  return r;
}

export interface MetricaEquipe {
  id: string;
  rotulo: string;
  valor: string;
  ok?: boolean;
  alvo?: string;
}

/** Ordens que ainda esperam o "entendido" de um papel. */
export function ordensPendentes(eventos: readonly EventoParada[], papeis: readonly string[]): Extract<EventoParada, { tipo: 'ordem' }>[] {
  const entendidas = new Set(eventos.flatMap((e) => (e.tipo === 'entendido' ? [e.ordemId] : [])));
  return eventos.filter((e): e is Extract<EventoParada, { tipo: 'ordem' }> => e.tipo === 'ordem' && !!e.id && !entendidas.has(e.id) && papeis.includes(e.para));
}

/** Números da equipe: só aparecem os de papéis que tiveram gente (nome) ou que agiram. */
export function metricasDaEquipe(eventos: readonly EventoParada[], membros: Readonly<Record<string, Membro>>): MetricaEquipe[] {
  const m: MetricaEquipe[] = [];
  const inicio = eventos.find((e) => e.tipo === 'iniciar')?.tS;
  if (inicio === undefined) return m;
  const ativo = (papel: string) => !!membros[papel]?.nome.trim() || eventos.some((e) => e.por === papel && e.tipo !== 'iniciar' && e.tipo !== 'encerrar' && e.tipo !== 'checarRitmo');

  // ordens do líder e o "entendido"
  const ordens = eventos.filter((e): e is Extract<EventoParada, { tipo: 'ordem' }> => e.tipo === 'ordem');
  if (ordens.length) {
    const tempos = ordens.flatMap((o) => {
      const ok = eventos.find((e) => e.tipo === 'entendido' && e.ordemId === o.id);
      return ok ? [ok.tS - o.tS] : [];
    });
    const mediaS = tempos.length ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    m.push({
      id: 'alca-fechada',
      rotulo: 'Ordens do líder confirmadas (alça fechada)',
      valor: `${tempos.length} de ${ordens.length}${tempos.length ? ` (em média ${Math.round(mediaS)} s)` : ''}`,
      ok: tempos.length === ordens.length,
      alvo: 'toda ordem com "entendido"',
    });
  } else if (ativo('lider')) m.push({ id: 'alca-fechada', rotulo: 'Ordens do líder', valor: 'nenhuma registrada', ok: false });

  // avisos do tempo
  if (ativo('tempo')) {
    const avisos = eventos.filter((e): e is Extract<EventoParada, { tipo: 'aviso' }> => e.tipo === 'aviso');
    const checagens = eventos.filter((e) => e.tipo === 'checarRitmo').map((e) => e.tS);
    const marcos = [inicio, ...checagens];
    const avisadas = checagens.filter((c, i) => avisos.some((a) => a.aviso === 'checar-ritmo' && a.tS >= marcos[i]! + 90 && a.tS <= c + 5)).length;
    if (checagens.length) m.push({ id: 'aviso-2min', rotulo: 'Avisos de 2 min antes da checagem', valor: `${avisadas} de ${checagens.length}`, ok: avisadas === checagens.length, alvo: 'avisar perto dos 2 min' });
    const adrenalinas = eventos.filter((e) => e.tipo === 'droga' && e.drogaId === 'adrenalina').map((e) => e.tS);
    const repetidas = adrenalinas.slice(1);
    if (repetidas.length) {
      const ok = repetidas.filter((t, i) => avisos.some((a) => a.aviso === 'adrenalina' && a.tS >= adrenalinas[i]! + 150 && a.tS <= t + 5)).length;
      m.push({ id: 'aviso-adrenalina', rotulo: 'Avisos da hora da adrenalina', valor: `${ok} de ${repetidas.length}`, ok: ok === repetidas.length, alvo: 'avisar aos 3 min' });
    }
  }

  // anotação na folha
  if (ativo('registro')) {
    const daFolha = eventos.filter((e) => EVENTOS_DA_FOLHA.includes(e.tipo) && e.id);
    const anotacoes = new Map(eventos.flatMap((e) => (e.tipo === 'anotado' ? [[e.eventoId, e.tS] as const] : [])));
    const atrasos = daFolha.flatMap((e) => (anotacoes.has(e.id!) ? [anotacoes.get(e.id!)! - e.tS] : []));
    if (daFolha.length) {
      const mediaS = atrasos.length ? atrasos.reduce((a, b) => a + b, 0) / atrasos.length : 0;
      m.push({
        id: 'anotacao',
        rotulo: 'Ações anotadas na folha do código',
        valor: `${atrasos.length} de ${daFolha.length}${atrasos.length ? ` (atraso médio ${mmss(mediaS)})` : ''}`,
        ok: atrasos.length === daFolha.length,
      });
    }
  }

  // técnica das drogas
  const drogas = eventos.filter((e): e is Extract<EventoParada, { tipo: 'droga' }> => e.tipo === 'droga');
  if (drogas.length) {
    const comFlush = drogas.filter((d) => (d.flushMl ?? 0) > 0).length;
    m.push({ id: 'flush', rotulo: 'Flush de SF depois das drogas', valor: `${comFlush} de ${drogas.length}`, ok: comFlush === drogas.length, alvo: `${ADMINISTRACAO_DROGA.flushMl.min}–${ADMINISTRACAO_DROGA.flushMl.max} mL depois de cada droga (A VALIDAR)` });
    const io = eventos.some((e) => e.tipo === 'acesso' && /intra[óo]sse/i.test(e.descricao));
    const elevou = drogas.filter((d) => d.elevouMembro).length;
    m.push({ id: 'elevacao', rotulo: 'Elevação do membro', valor: `${elevou} de ${drogas.length}`, ...(io ? {} : { ok: elevou === drogas.length }), alvo: 'acesso periférico: elevar o membro (A VALIDAR)' });
  }
  return m;
}
