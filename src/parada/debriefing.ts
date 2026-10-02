/**
 * Debriefing do código de parada (sem tela): números tirados do registro do código
 * (tempos, intervalos, fração de compressão ESTIMADA) e o texto do debriefing para baixar.
 * Dados do roteiro: src/dados/parada-briefing-a-validar.ts (A VALIDAR).
 */

import { CHECKLIST_BRIEFING, FASES_DEBRIEFING, ITENS_CRM, PAPEIS_EQUIPE, PAUSAS_ESTIMADAS } from '../dados/parada-briefing-a-validar';
import type { CenarioParada } from '../dados/parada-a-validar';
import { RCP } from '../dados/parada-rcp-a-validar';
import { descreverEventos, metricasDaEquipe, participacao, quemFez } from './equipe';
import { avaliarParada, ehViaAvancada, type EventoParada, mmss, ritmoChocavel } from './parada';
import { linhasResumoRcp, type LinhaResumoRcp, type MarcaRcp, resumoRcp } from './rcp';
import type { Membro } from './sala';

export interface MetricaCodigo {
  id: string;
  rotulo: string;
  valor: string;
  /** true = bom; false = abaixo do alvo; undefined = só informação. */
  ok?: boolean;
  alvo?: string;
}

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const intervalos = (ts: number[]) => ts.slice(1).map((t, i) => t - ts[i]!);

/**
 * Números do código. Com a RCP pelas teclas (`rcpMedida`), a fração de compressão é medida
 * (ver `qualidadeDaRcp`) e a estimada sai daqui.
 */
export function metricasDoCodigo(cenario: CenarioParada, eventos: readonly EventoParada[], opcoes: { rcpMedida?: boolean } = {}): MetricaCodigo[] {
  const inicio = eventos.find((e) => e.tipo === 'iniciar')?.tS;
  if (inicio === undefined) return [];
  const fim = eventos.find((e) => e.tipo === 'encerrar')?.tS ?? eventos[eventos.length - 1]!.tS;
  const total = fim - inicio;
  const t = (s: number) => mmss(s - inicio);
  const m: MetricaCodigo[] = [{ id: 'total', rotulo: 'Tempo total de código', valor: mmss(total) }];
  const avaliacao = avaliarParada(cenario, eventos);
  m.push({ id: 'rce', rotulo: 'Resultado', valor: avaliacao.rce ? 'Retorno da circulação' : 'Sem retorno da circulação', ok: avaliacao.rce });

  const choques = eventos.filter((e) => e.tipo === 'choque').map((e) => e.tS);
  const adrenalinas = eventos.filter((e) => e.tipo === 'droga' && e.drogaId === 'adrenalina').map((e) => e.tS);
  const checagens = [inicio, ...eventos.filter((e) => e.tipo === 'checarRitmo').map((e) => e.tS)];
  if (ritmoChocavel(cenario.ritmoInicial)) {
    m.push(choques[0] !== undefined ? { id: 'choque1', rotulo: '1º choque', valor: t(choques[0]), ok: choques[0] - inicio <= 120, alvo: 'o quanto antes (até 2 min)' } : { id: 'choque1', rotulo: '1º choque', valor: 'não dado', ok: false });
  }
  m.push(
    adrenalinas[0] !== undefined
      ? {
          id: 'adrenalina1',
          rotulo: '1ª adrenalina',
          valor: t(adrenalinas[0]),
          ...(!ritmoChocavel(cenario.ritmoInicial) && { ok: adrenalinas[0] - inicio <= 300, alvo: 'não chocável: o quanto antes (até 5 min)' }),
        }
      : { id: 'adrenalina1', rotulo: '1ª adrenalina', valor: 'não dada', ok: false },
  );
  const intAdr = intervalos(adrenalinas);
  if (intAdr.length) m.push({ id: 'intervalo-adrenalina', rotulo: 'Intervalo médio entre adrenalinas', valor: mmss(media(intAdr)), ok: intAdr.every((x) => x >= 170 && x <= 310), alvo: '3 a 5 min' });
  const intChec = intervalos(checagens);
  if (intChec.length) {
    m.push({ id: 'checagens', rotulo: 'Checagens de ritmo', valor: `${intChec.length} (média a cada ${mmss(media(intChec))}; maior intervalo ${mmss(Math.max(...intChec))})`, ok: Math.max(...intChec) <= 140, alvo: 'a cada 2 min' });
  }
  const acesso = eventos.find((e) => e.tipo === 'acesso');
  m.push(acesso ? { id: 'acesso', rotulo: 'Acesso EV/IO registrado', valor: t(acesso.tS) } : { id: 'acesso', rotulo: 'Acesso EV/IO registrado', valor: 'não registrado' });
  const via = eventos.find((e) => e.tipo === 'viaAerea');
  m.push(via ? { id: 'via-aerea', rotulo: 'Via aérea registrada', valor: t(via.tS) } : { id: 'via-aerea', rotulo: 'Via aérea registrada', valor: 'não registrada' });

  // fração de compressão estimada
  const intubacoes = eventos.filter((e) => e.tipo === 'viaAerea' && /intuba/i.test(e.descricao)).length;
  const pausas = (checagens.length - 1) * PAUSAS_ESTIMADAS.checagemS + choques.length * PAUSAS_ESTIMADAS.choqueS + intubacoes * PAUSAS_ESTIMADAS.intubacaoS;
  if (total > 0 && !opcoes.rcpMedida) {
    const fracao = Math.max(0, 1 - pausas / total);
    m.push({
      id: 'fracao',
      rotulo: 'Fração de compressão (estimada)',
      valor: `${Math.round(fracao * 100)}%`,
      ok: fracao >= PAUSAS_ESTIMADAS.metaFracao,
      alvo: `> ${Math.round(PAUSAS_ESTIMADAS.metaFracao * 100)}% (estimativa: ${PAUSAS_ESTIMADAS.checagemS} s por checagem, ${PAUSAS_ESTIMADAS.choqueS} s por choque)`,
    });
  }
  const certos = avaliacao.itens.filter((i) => i.ok).length;
  m.push({ id: 'algoritmo', rotulo: 'Itens do algoritmo e das contas certos', valor: `${certos} de ${avaliacao.itens.length}`, ok: certos === avaliacao.itens.length });
  return m;
}

/** Relação compressão:ventilação do cenário (sem valor: a padrão). */
export function relacaoDoCenario(cenario: CenarioParada): number {
  return cenario.relacaoCompressaoVentilacao ?? RCP.relacaoPadrao;
}

/** Qualidade da RCP pelas marcas (compressões e ventilações apertadas na tecla). */
export function qualidadeDaRcp(cenario: CenarioParada, eventos: readonly EventoParada[], marcas: readonly MarcaRcp[]): LinhaResumoRcp[] {
  const inicio = eventos.find((e) => e.tipo === 'iniciar')?.tS;
  if (inicio === undefined) return [];
  const fim = eventos.find((e) => e.tipo === 'encerrar')?.tS ?? Math.max(eventos[eventos.length - 1]!.tS, marcas[marcas.length - 1]?.tS ?? 0);
  const via = eventos.find(ehViaAvancada)?.tS;
  const choques = eventos.filter((e) => e.tipo === 'choque').map((e) => e.tS);
  const resumo = resumoRcp(marcas, {
    relacao: relacaoDoCenario(cenario),
    inicioS: inicio,
    fimS: fim,
    ...(via !== undefined && { viaAvancadaS: via }),
    recomecosS: [...eventos.filter((e) => e.tipo === 'checarRitmo').map((e) => e.tS), ...choques],
    choquesS: choques,
  });
  return linhasResumoRcp(resumo, relacaoDoCenario(cenario));
}

export interface DadosDebriefing {
  cenario: CenarioParada;
  eventos: readonly EventoParada[];
  briefingFeito: ReadonlySet<string>;
  nomesPapeis: Readonly<Record<string, string>>;
  respostas: Readonly<Record<string, string>>;
  crm: Readonly<Record<string, number>>;
  data: Date;
  /** Compressões e ventilações apertadas na tecla (se a RCP foi pelas teclas). */
  marcas?: readonly MarcaRcp[];
}

/** Texto do debriefing (para baixar ou imprimir). */
export function textoDoDebriefing(d: DadosDebriefing): string {
  const linhas: string[] = [];
  linhas.push(`SimPed — Debriefing do código de parada (${d.data.toLocaleString('pt-BR')})`);
  linhas.push(`Cenário: ${d.cenario.titulo} — ${d.cenario.idadeTexto}, ${d.cenario.pesoKg} kg`);
  linhas.push('Treinamento. Algoritmo, doses e roteiro: A VALIDAR. Não substitui protocolos institucionais.');
  linhas.push('');
  linhas.push(`BRIEFING (${d.briefingFeito.size} de ${CHECKLIST_BRIEFING.length} itens)`);
  for (const i of CHECKLIST_BRIEFING) linhas.push(`  [${d.briefingFeito.has(i.id) ? 'x' : ' '}] ${i.texto}`);
  linhas.push('Equipe:');
  for (const p of PAPEIS_EQUIPE) linhas.push(`  - ${p.nome}: ${d.nomesPapeis[p.id]?.trim() || '(não definido)'}`);
  linhas.push('');
  const membros: Record<string, Membro> = Object.fromEntries(PAPEIS_EQUIPE.map((p) => [p.id, { nome: d.nomesPapeis[p.id] ?? '' }]));
  const linha = (m: { ok?: boolean; rotulo: string; valor: string; alvo?: string }) => `  ${m.ok === undefined ? '•' : m.ok ? '✔' : '✘'} ${m.rotulo}: ${m.valor}${m.alvo ? ` (alvo: ${m.alvo})` : ''}`;
  linhas.push('NÚMEROS DO CÓDIGO');
  for (const m of metricasDoCodigo(d.cenario, d.eventos, { rcpMedida: !!d.marcas })) linhas.push(linha(m));
  linhas.push('');
  if (d.marcas) {
    linhas.push('QUALIDADE DA RCP (teclas)');
    for (const m of qualidadeDaRcp(d.cenario, d.eventos, d.marcas)) linhas.push(linha(m));
    linhas.push('');
  }
  const daEquipe = metricasDaEquipe(d.eventos, membros);
  const part = participacao(d.eventos, d.marcas ?? []);
  if (daEquipe.length || Object.keys(part).length) {
    linhas.push('EQUIPE');
    for (const m of daEquipe) linhas.push(linha(m));
    for (const [papel, p] of Object.entries(part)) {
      const partes = [p.acoes && `${p.acoes} ação(ões)`, p.compressoes && `${p.compressoes} compressões`, p.ventilacoes && `${p.ventilacoes} ventilações`].filter(Boolean);
      linhas.push(`  - ${quemFez(papel, membros)}: ${partes.join(', ')}`);
    }
    linhas.push('');
  }
  const inicio = d.eventos.find((e) => e.tipo === 'iniciar')?.tS ?? 0;
  const textos = descreverEventos(d.eventos);
  linhas.push('LINHA DO TEMPO');
  d.eventos.forEach((e, i) => {
    if (e.tipo !== 'anotado') linhas.push(`  ${mmss(e.tS - inicio)}  ${textos[i]}${e.por ? ` — ${quemFez(e.por, membros)}` : ''}`);
  });
  linhas.push('');
  linhas.push('AVALIAÇÃO DO ALGORITMO');
  for (const i of avaliarParada(d.cenario, d.eventos).itens) linhas.push(`  ${i.ok ? '✔' : '✘'} ${i.texto}`);
  linhas.push('');
  linhas.push('DEBRIEFING');
  for (const f of FASES_DEBRIEFING) {
    linhas.push(`${f.nome} — ${f.pergunta}`);
    linhas.push(`  ${d.respostas[f.id]?.trim() || '(sem anotação)'}`);
  }
  linhas.push('');
  linhas.push('TRABALHO EM EQUIPE (1 = precisa melhorar, 3 = ótimo)');
  for (const c of ITENS_CRM) linhas.push(`  ${d.crm[c] ?? '-'} · ${c}`);
  return linhas.join('\n');
}
