/**
 * Ritmo da RCP (sem tela): cada compressão e cada ventilação é uma "marca" com o horário do código
 * (o aluno aperta uma tecla ou toca no botão). Daqui saem a frequência, a contagem da série
 * (15:2 ou 30:2), a hora de pausar para ventilar, a ventilação com via aérea avançada (1 a cada 2–3 s),
 * as pausas e a fração de compressão MEDIDA. Alvos: src/dados/parada-rcp-a-validar.ts (A VALIDAR).
 */

import { RCP } from '../dados/parada-rcp-a-validar';
import { mmss } from './parada';

export type TipoMarca = 'compressao' | 'ventilacao';

export interface MarcaRcp {
  id: string;
  tipo: TipoMarca;
  /** Tempo do código (s). */
  tS: number;
  /** Papel de quem apertou (compressor-1, compressor-2, via-aerea). */
  por?: string;
}

export interface ParametrosRcp {
  /** Compressões por série antes das 2 ventilações (15 ou 30). */
  relacao: number;
  /** Desde quando há via aérea avançada (compressões contínuas). */
  viaAvancadaS?: number;
  /** Momentos em que a série recomeça do zero (checagem de ritmo, choque). */
  recomecosS?: readonly number[];
}

export type FaixaRitmo = 'lenta' | 'boa' | 'rapida';

export function faixaDe(porMin: number, alvo: { min: number; max: number }): FaixaRitmo {
  return porMin < alvo.min ? 'lenta' : porMin > alvo.max ? 'rapida' : 'boa';
}

/** Frequência (por minuto) das últimas marcas; null se poucas marcas ou se parou há mais de `paradoS`. */
export function frequenciaRecente(tempos: readonly number[], agoraS: number, quantas: number, paradoS: number): number | null {
  const ultimas = tempos.slice(-quantas);
  if (ultimas.length < 3) return null;
  const ultima = ultimas[ultimas.length - 1]!;
  if (agoraS - ultima > paradoS) return null;
  // só a sequência sem pausa no meio
  let inicio = ultimas.length - 1;
  while (inicio > 0 && ultimas[inicio]! - ultimas[inicio - 1]! <= paradoS) inicio -= 1;
  const corrida = ultimas.slice(inicio);
  if (corrida.length < 3) return null;
  const duracao = corrida[corrida.length - 1]! - corrida[0]!;
  return duracao > 0 ? ((corrida.length - 1) / duracao) * 60 : null;
}

export interface EstadoRcp {
  modo: 'sincronizado' | 'continuo';
  compressoes: number;
  ventilacoes: number;
  /** Compressões na série atual (desde a última pausa para ventilar). */
  serie: number;
  /** Ventilações dadas na pausa atual. */
  ventilacoesNaPausa: number;
  /** De quem é a vez agora (modo sincronizado). */
  fase: 'comprimir' | 'ventilar';
  freqCompressao: number | null;
  faixaCompressao?: FaixaRitmo;
  /** Com via aérea avançada. */
  freqVentilacao: number | null;
  faixaVentilacao?: FaixaRitmo;
  /** Segundos desde a última compressão (null se nenhuma). */
  semComprimirS: number | null;
  /** Avisos para quem comprime e para quem ventila. */
  avisoCompressao?: string;
  avisoVentilacao?: string;
}

/** Estado da RCP agora (só as marcas até `agoraS` contam). */
export function estadoRcp(marcas: readonly MarcaRcp[], p: ParametrosRcp, agoraS: number): EstadoRcp {
  const ate = [...marcas].filter((m) => m.tS <= agoraS).sort((a, b) => a.tS - b.tS);
  const continuo = p.viaAvancadaS !== undefined && p.viaAvancadaS <= agoraS;
  const compressoes = ate.filter((m) => m.tipo === 'compressao');
  const ventilacoes = ate.filter((m) => m.tipo === 'ventilacao');

  // série atual: recomeça depois de cada pausa com ventilação, de cada checagem/choque e da via avançada
  const recomecos = [...(p.recomecosS ?? []), ...(p.viaAvancadaS !== undefined ? [p.viaAvancadaS] : [])].filter((t) => t <= agoraS);
  let serie = 0;
  let ventilacoesNaPausa = 0;
  let ultimaVentilacaoForaDaHora: number | undefined;
  let r = 0;
  const recomecosOrdenados = [...recomecos].sort((a, b) => a - b);
  for (const m of ate) {
    while (r < recomecosOrdenados.length && recomecosOrdenados[r]! <= m.tS) {
      serie = 0;
      ventilacoesNaPausa = 0;
      r += 1;
    }
    if (p.viaAvancadaS !== undefined && m.tS >= p.viaAvancadaS) continue;
    if (m.tipo === 'compressao') {
      if (ventilacoesNaPausa > 0) {
        serie = 0;
        ventilacoesNaPausa = 0;
      }
      serie += 1;
    } else {
      if (serie < p.relacao - 1) ultimaVentilacaoForaDaHora = m.tS;
      ventilacoesNaPausa += 1;
    }
  }
  if (r < recomecosOrdenados.length) {
    serie = 0;
    ventilacoesNaPausa = 0;
  }

  const tc = compressoes.map((m) => m.tS);
  const freqCompressao = frequenciaRecente(tc, agoraS, 6, RCP.intervaloQueViraPausaS);
  const tvComVia = continuo ? ventilacoes.filter((m) => m.tS >= p.viaAvancadaS!).map((m) => m.tS) : [];
  const freqVentilacao = continuo ? frequenciaRecente(tvComVia, agoraS, 3, (60 / RCP.ventilacoesPorMinComVia.min) * 2) : null;
  const ultimaCompressao = tc[tc.length - 1];
  const semComprimirS = ultimaCompressao === undefined ? null : agoraS - ultimaCompressao;

  const sincronizado = !continuo;
  const pausaParaVentilar = sincronizado && serie >= p.relacao && ventilacoesNaPausa < RCP.ventilacoesPorPausa;
  let avisoCompressao: string | undefined;
  let avisoVentilacao: string | undefined;
  if (sincronizado && serie > p.relacao) avisoCompressao = `Passou de ${p.relacao}: pare para as ${RCP.ventilacoesPorPausa} ventilações.`;
  else if (pausaParaVentilar) avisoCompressao = `Pausa: ${RCP.ventilacoesPorPausa} ventilações.`;
  else if (semComprimirS !== null && semComprimirS > RCP.pausaMaximaS) avisoCompressao = `Sem compressão há ${Math.floor(semComprimirS)} s — volte a comprimir!`;
  if (sincronizado) {
    if (pausaParaVentilar) avisoVentilacao = `Agora: ${RCP.ventilacoesPorPausa - ventilacoesNaPausa} ventilação(ões).`;
    else if (ultimaVentilacaoForaDaHora !== undefined && agoraS - ultimaVentilacaoForaDaHora < 4) avisoVentilacao = `Ventilação fora da hora: espere as ${p.relacao} compressões.`;
  } else if (freqVentilacao !== null && faixaDe(freqVentilacao, RCP.ventilacoesPorMinComVia) === 'rapida') avisoVentilacao = 'Rápido demais (hiperventilação): 1 a cada 2–3 s.';
  else if (continuo && tvComVia.length > 0 && agoraS - tvComVia[tvComVia.length - 1]! > 6) avisoVentilacao = 'Já passou da hora: 1 ventilação a cada 2–3 s.';

  return {
    modo: continuo ? 'continuo' : 'sincronizado',
    compressoes: compressoes.length,
    ventilacoes: ventilacoes.length,
    serie,
    ventilacoesNaPausa,
    fase: pausaParaVentilar ? 'ventilar' : 'comprimir',
    freqCompressao,
    ...(freqCompressao !== null && { faixaCompressao: faixaDe(freqCompressao, RCP.compressoesPorMin) }),
    freqVentilacao,
    ...(freqVentilacao !== null && { faixaVentilacao: faixaDe(freqVentilacao, RCP.ventilacoesPorMinComVia) }),
    semComprimirS,
    ...(avisoCompressao && { avisoCompressao }),
    ...(avisoVentilacao && { avisoVentilacao }),
  };
}

// ---- Resumo para o debriefing ----------------------------------------------------------

export interface ResumoRcp {
  compressoes: number;
  ventilacoes: number;
  /** Primeira compressão: quantos s depois do início do código. */
  inicioCompressoesS?: number;
  /** Frequência média durante as compressões (sem contar as pausas). */
  freqMedia?: number;
  /** % das medidas (média móvel de 5 intervalos) dentro de 100–120/min. */
  pctNaFaixa?: number;
  /** Maior pausa nas compressões (s) e quantas passaram de 10 s. */
  maiorPausaS: number;
  pausasLongas: number;
  /** Fração de compressão medida (0–1). */
  fracao: number;
  /** Modo sincronizado: séries com a contagem certa (±1) e pausas com 2 ventilações. */
  series: number;
  seriesCertas: number;
  pausasComVentilacao: number;
  pausasCom2: number;
  /** Com via aérea avançada: frequência média das ventilações e % dos intervalos dentro de 2–3 s. */
  freqVentilacaoComVia?: number;
  pctVentilacaoNaFaixa?: number;
  /** Choques com alguém comprimindo (afastem-se!). */
  choquesComCompressao: number;
}

const media = (xs: readonly number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function resumoRcp(marcas: readonly MarcaRcp[], p: ParametrosRcp & { inicioS: number; fimS: number; choquesS?: readonly number[] }): ResumoRcp {
  const ordenadas = [...marcas].filter((m) => m.tS >= p.inicioS && m.tS <= p.fimS).sort((a, b) => a.tS - b.tS);
  const tc = ordenadas.filter((m) => m.tipo === 'compressao').map((m) => m.tS);
  const total = Math.max(0, p.fimS - p.inicioS);
  const limite = RCP.intervaloQueViraPausaS;

  // pausas e fração
  const gaps: number[] = [];
  if (tc.length) {
    gaps.push(tc[0]! - p.inicioS);
    tc.slice(1).forEach((t, i) => {
      const g = t - tc[i]!;
      if (g > limite) gaps.push(g);
    });
    gaps.push(p.fimS - tc[tc.length - 1]!);
  }
  const maosFora = tc.length ? gaps.reduce((a, b) => a + b, 0) : total;
  const fracao = total > 0 ? Math.max(0, Math.min(1, 1 - maosFora / total)) : 0;
  const pausasMeio = tc.slice(1).map((t, i) => t - tc[i]!).filter((g) => g > limite);

  // frequência: intervalos dentro das corridas
  const intervalos = tc.slice(1).map((t, i) => t - tc[i]!);
  const dentro = intervalos.filter((g) => g <= limite);
  const freqMedia = dentro.length ? 60 / media(dentro) : undefined;
  const moveis: number[] = [];
  for (let i = 4; i < intervalos.length; i++) {
    const janela = intervalos.slice(i - 4, i + 1);
    if (janela.every((g) => g <= limite)) moveis.push(60 / media(janela));
  }
  const pctNaFaixa = moveis.length ? moveis.filter((f) => faixaDe(f, RCP.compressoesPorMin) === 'boa').length / moveis.length : undefined;

  // séries (antes da via aérea avançada)
  const fimSincronizado = p.viaAvancadaS ?? Infinity;
  const recomecos = [...(p.recomecosS ?? [])].sort((a, b) => a - b);
  const contagens: number[] = [];
  const ventilacoesPorPausa: number[] = [];
  let serie = 0;
  let vent = 0;
  let r = 0;
  // a série conta quando termina em ventilação, ou quando passou da conta sem ventilar (errada)
  const fecharSerie = () => {
    if (serie > 0 && (vent > 0 || serie > p.relacao + 1)) contagens.push(serie);
    if (serie > 0 && vent > 0) ventilacoesPorPausa.push(vent);
    serie = 0;
    vent = 0;
  };
  for (const m of ordenadas) {
    if (m.tS >= fimSincronizado) break;
    while (r < recomecos.length && recomecos[r]! <= m.tS) {
      fecharSerie();
      r += 1;
    }
    if (m.tipo === 'compressao') {
      if (vent > 0) fecharSerie();
      serie += 1;
    } else vent += 1;
  }
  fecharSerie();

  // ventilação com via aérea avançada
  let freqVentilacaoComVia: number | undefined;
  let pctVentilacaoNaFaixa: number | undefined;
  if (p.viaAvancadaS !== undefined) {
    const tv = ordenadas.filter((m) => m.tipo === 'ventilacao' && m.tS >= p.viaAvancadaS!).map((m) => m.tS);
    const iv = tv.slice(1).map((t, i) => t - tv[i]!).filter((g) => g <= 10);
    if (iv.length) {
      freqVentilacaoComVia = 60 / media(iv);
      pctVentilacaoNaFaixa = iv.filter((g) => faixaDe(60 / g, RCP.ventilacoesPorMinComVia) === 'boa').length / iv.length;
    }
  }

  const choquesComCompressao = (p.choquesS ?? []).filter((c) => tc.some((t) => Math.abs(t - c) < RCP.janelaChoqueS)).length;

  return {
    compressoes: tc.length,
    ventilacoes: ordenadas.length - tc.length,
    ...(tc.length > 0 && { inicioCompressoesS: tc[0]! - p.inicioS }),
    ...(freqMedia !== undefined && { freqMedia }),
    ...(pctNaFaixa !== undefined && { pctNaFaixa }),
    maiorPausaS: pausasMeio.length ? Math.max(...pausasMeio) : 0,
    pausasLongas: pausasMeio.filter((g) => g > RCP.pausaMaximaS).length,
    fracao,
    series: contagens.length,
    seriesCertas: contagens.filter((c) => Math.abs(c - p.relacao) <= 1).length,
    pausasComVentilacao: ventilacoesPorPausa.length,
    pausasCom2: ventilacoesPorPausa.filter((v) => v === RCP.ventilacoesPorPausa).length,
    ...(freqVentilacaoComVia !== undefined && { freqVentilacaoComVia }),
    ...(pctVentilacaoNaFaixa !== undefined && { pctVentilacaoNaFaixa }),
    choquesComCompressao,
  };
}

export interface LinhaResumoRcp {
  id: string;
  rotulo: string;
  valor: string;
  ok?: boolean;
  alvo?: string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** O resumo em linhas para a tela e o arquivo do debriefing. */
export function linhasResumoRcp(r: ResumoRcp, relacao: number): LinhaResumoRcp[] {
  const alvoC = `${RCP.compressoesPorMin.min}–${RCP.compressoesPorMin.max}/min`;
  const l: LinhaResumoRcp[] = [];
  if (r.compressoes === 0) {
    l.push({ id: 'compressoes', rotulo: 'Compressões', valor: 'nenhuma registrada', ok: false });
    return l;
  }
  l.push({ id: 'compressoes', rotulo: 'Compressões', valor: `${r.compressoes} (1ª em ${mmss(r.inicioCompressoesS ?? 0)})`, ok: (r.inicioCompressoesS ?? 0) <= 10, alvo: 'começar em até 10 s' });
  if (r.freqMedia !== undefined) l.push({ id: 'frequencia', rotulo: 'Frequência média', valor: `${Math.round(r.freqMedia)}/min`, ok: faixaDe(r.freqMedia, RCP.compressoesPorMin) === 'boa', alvo: alvoC });
  if (r.pctNaFaixa !== undefined) l.push({ id: 'na-faixa', rotulo: 'Tempo no ritmo certo', valor: pct(r.pctNaFaixa), ok: r.pctNaFaixa >= 0.7, alvo: `a maior parte em ${alvoC}` });
  l.push({ id: 'fracao-medida', rotulo: 'Fração de compressão (medida)', valor: pct(r.fracao), ok: r.fracao >= RCP.metaFracao, alvo: `> ${pct(RCP.metaFracao)}` });
  l.push({ id: 'pausas', rotulo: 'Maior pausa', valor: `${Math.round(r.maiorPausaS)} s (${r.pausasLongas} acima de ${RCP.pausaMaximaS} s)`, ok: r.pausasLongas === 0, alvo: `até ${RCP.pausaMaximaS} s` });
  if (r.series > 0) {
    l.push({ id: 'series', rotulo: `Séries de ${relacao} compressões`, valor: `${r.seriesCertas} de ${r.series} certas`, ok: r.seriesCertas === r.series, alvo: `${relacao}:${RCP.ventilacoesPorPausa}` });
    l.push({ id: 'ventilacoes', rotulo: 'Pausas com 2 ventilações', valor: `${r.pausasCom2} de ${r.pausasComVentilacao}`, ok: r.pausasCom2 === r.pausasComVentilacao });
  } else if (r.ventilacoes === 0) l.push({ id: 'ventilacoes', rotulo: 'Ventilações', valor: 'nenhuma registrada', ok: false });
  if (r.freqVentilacaoComVia !== undefined) {
    l.push({
      id: 'ventilacao-via',
      rotulo: 'Ventilação com via aérea avançada',
      valor: `${Math.round(r.freqVentilacaoComVia)}/min (${pct(r.pctVentilacaoNaFaixa ?? 0)} no ritmo)`,
      ok: faixaDe(r.freqVentilacaoComVia, RCP.ventilacoesPorMinComVia) === 'boa',
      alvo: `${RCP.ventilacoesPorMinComVia.min}–${RCP.ventilacoesPorMinComVia.max}/min (1 a cada 2–3 s)`,
    });
  }
  if (r.choquesComCompressao > 0) l.push({ id: 'choque-seguro', rotulo: 'Choque com alguém comprimindo', valor: `${r.choquesComCompressao} vez(es)`, ok: false, alvo: '"afastem-se" antes de chocar' });
  return l;
}
