/**
 * Sala do código de parada (sem tela): tudo o que a equipe divide — cenário, quem faz qual papel,
 * relógio, eventos (ações), marcas da RCP (compressões/ventilações), briefing e debriefing.
 *
 * Cada membro pode estar numa tela (janela) diferente: cada tela guarda a sua cópia da sala e manda
 * para as outras o que mudou. Juntar duas cópias (`mesclarSalas`) nunca perde nada:
 * - eventos e marcas: juntam-se pela identidade (cada um tem um id);
 * - campos (nome de cada papel, cenário, relógio, respostas...): vale a mudança mais recente.
 * Hoje as telas conversam no mesmo computador (src/sessao/canal.ts); no modo online (Fase 7),
 * as mesmas mensagens vão pela rede.
 */

import { PAPEIS_EQUIPE } from '../dados/parada-briefing-a-validar';
import type { AparenciaAvatar } from './cena';
import type { EventoParada } from './parada';
import type { MarcaRcp } from './rcp';

export function novoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---- Relógio do código --------------------------------------------------------------

/** Relógio que todas as telas leem igual: tempo = base + (agora − desde) × velocidade. */
export interface Relogio {
  baseS: number;
  /** Hora (ms) em que voltou a andar; null = parado. */
  desdeMs: number | null;
  velocidade: number;
}

export const RELOGIO_PARADO: Relogio = { baseS: 0, desdeMs: null, velocidade: 1 };

export function tempoDoRelogio(r: Relogio, agoraMs: number): number {
  return r.desdeMs === null ? r.baseS : r.baseS + (Math.max(0, agoraMs - r.desdeMs) / 1000) * r.velocidade;
}

export function pausarRelogio(r: Relogio, agoraMs: number): Relogio {
  return r.desdeMs === null ? r : { ...r, baseS: tempoDoRelogio(r, agoraMs), desdeMs: null };
}

export function continuarRelogio(r: Relogio, agoraMs: number): Relogio {
  return r.desdeMs !== null ? r : { ...r, desdeMs: agoraMs };
}

export function mudarVelocidade(r: Relogio, velocidade: number, agoraMs: number): Relogio {
  return { baseS: tempoDoRelogio(r, agoraMs), desdeMs: r.desdeMs === null ? null : agoraMs, velocidade };
}

// ---- Sala ------------------------------------------------------------------------------

/** Um valor com carimbo: quando duas telas mudam o mesmo campo, vale o mais recente. */
export interface Registro {
  valor: unknown;
  em: number;
  tela: string;
}

export interface SalaParada {
  /** Rodada do código (muda ao recomeçar). */
  geracao: string;
  /** Quando a rodada começou (ms). 0 = sala nova e intocada: cede para a sala de outra tela. */
  criadaEm: number;
  campos: Record<string, Registro>;
  eventos: EventoParada[];
  marcas: MarcaRcp[];
  /** Telas que entraram na sala (id → hora da entrada, ms). */
  telas: Record<string, number>;
}

export function novaSala(tela: string, agoraMs: number, criadaEm = 0): SalaParada {
  return { geracao: novoId(), criadaEm, campos: {}, eventos: [], marcas: [], telas: { [tela]: agoraMs } };
}

/** A tela entra na sala (se ainda não estiver). */
export function entrarNaSala(sala: SalaParada, tela: string, agoraMs: number): SalaParada {
  return tela in sala.telas ? sala : { ...sala, telas: { ...sala.telas, [tela]: agoraMs } };
}

export function mudarCampo(sala: SalaParada, chave: string, valor: unknown, tela: string, agoraMs: number): SalaParada {
  const antes = sala.campos[chave];
  const em = Math.max(agoraMs, (antes?.em ?? 0) + 1);
  return { ...sala, criadaEm: sala.criadaEm || agoraMs, campos: { ...sala.campos, [chave]: { valor, em, tela } } };
}

export function acrescentar(sala: SalaParada, novos: { eventos?: readonly EventoParada[]; marcas?: readonly MarcaRcp[] }, agoraMs: number): SalaParada {
  return {
    ...sala,
    criadaEm: sala.criadaEm || agoraMs,
    eventos: novos.eventos?.length ? juntarPorId(sala.eventos, novos.eventos) : sala.eventos,
    marcas: novos.marcas?.length ? juntarPorId(sala.marcas, novos.marcas) : sala.marcas,
  };
}

/** Recomeça o código com a mesma equipe e o mesmo cenário (briefing, eventos e relógio zeram). */
export function recomecarSala(sala: SalaParada, tela: string, agoraMs: number): SalaParada {
  const fica = Object.fromEntries(Object.entries(sala.campos).filter(([k]) => k === CHAVES.cenario || k === CHAVES.teclas || k.startsWith('membro:') || k.startsWith('observador:')));
  return { ...novaSala(tela, agoraMs, agoraMs), campos: fica, telas: { ...sala.telas } };
}

function juntarPorId<T extends { id?: string; tS: number }>(a: readonly T[], b: readonly T[]): T[] {
  const porId = new Map<string, T>();
  for (const x of [...a, ...b]) {
    const id = x.id ?? JSON.stringify(x);
    if (!porId.has(id)) porId.set(id, x);
  }
  return [...porId.values()].sort((x, y) => x.tS - y.tS || (x.id ?? '').localeCompare(y.id ?? ''));
}

const maisNovo = (a: Registro, b: Registro) => (b.em > a.em || (b.em === a.em && b.tela > a.tela) ? b : a);

/** Qual rodada vale quando duas telas têm rodadas diferentes: a mais nova; empate, a de menor id. */
function rodadaQueVale(a: SalaParada, b: SalaParada): SalaParada {
  if (a.criadaEm !== b.criadaEm) return a.criadaEm > b.criadaEm ? a : b;
  return a.geracao <= b.geracao ? a : b;
}

/** Junta duas cópias da sala sem perder nada (a ordem dos argumentos não muda o resultado). */
export function mesclarSalas(a: SalaParada, b: SalaParada): SalaParada {
  const telas = { ...a.telas };
  for (const [t, ms] of Object.entries(b.telas)) telas[t] = Math.min(ms, telas[t] ?? ms);
  if (a.geracao !== b.geracao) return { ...rodadaQueVale(a, b), telas };
  const campos = { ...a.campos };
  for (const [k, r] of Object.entries(b.campos)) campos[k] = campos[k] ? maisNovo(campos[k], r) : r;
  return {
    geracao: a.geracao,
    criadaEm: Math.max(a.criadaEm, b.criadaEm),
    campos,
    eventos: juntarPorId(a.eventos, b.eventos),
    marcas: juntarPorId(a.marcas, b.marcas),
    telas,
  };
}

/** Confere uma sala que chegou de outra tela (formato estranho = ignorada). */
export function salaValida(x: unknown): x is SalaParada {
  const s = x as SalaParada | null;
  return (
    !!s &&
    typeof s === 'object' &&
    typeof s.geracao === 'string' &&
    typeof s.criadaEm === 'number' &&
    typeof s.campos === 'object' &&
    s.campos !== null &&
    Array.isArray(s.eventos) &&
    Array.isArray(s.marcas) &&
    typeof s.telas === 'object' &&
    s.telas !== null
  );
}

// ---- Campos ------------------------------------------------------------------------------

export const CHAVES = {
  cenario: 'cenario',
  /** Compressões e ventilações pelas teclas (tempo real) ou automáticas (relógio pode acelerar). */
  teclas: 'rcpPelasTeclas',
  relogio: 'relogio',
  membro: (papel: string) => `membro:${papel}`,
  briefing: (item: string) => `briefing:${item}`,
  resposta: (fase: string) => `resposta:${fase}`,
  crm: (item: string) => `crm:${item}`,
  /** Tela que só assiste (professor, telão): não faz nenhum papel. */
  observador: (tela: string) => `observador:${tela}`,
} as const;

const valorDe = (sala: SalaParada, chave: string): unknown => sala.campos[chave]?.valor;

export function cenarioDaSala(sala: SalaParada, padrao: string): string {
  const v = valorDe(sala, CHAVES.cenario);
  return typeof v === 'string' ? v : padrao;
}

export function rcpPelasTeclas(sala: SalaParada): boolean {
  return valorDe(sala, CHAVES.teclas) !== false;
}

export function relogioDaSala(sala: SalaParada): Relogio {
  const v = valorDe(sala, CHAVES.relogio) as Relogio | undefined;
  return v && typeof v.baseS === 'number' && typeof v.velocidade === 'number' && (v.desdeMs === null || typeof v.desdeMs === 'number') ? v : RELOGIO_PARADO;
}

export interface Membro {
  nome: string;
  /** Tela (janela) de quem faz o papel; sem tela = a primeira tela da sala. */
  tela?: string;
  /** Aparência do avatar na animação da RCP (sem escolha: uma padrão pelo papel). */
  avatar?: AparenciaAvatar;
}

export function membrosDaSala(sala: SalaParada): Record<string, Membro> {
  const r: Record<string, Membro> = {};
  for (const p of PAPEIS_EQUIPE) {
    const v = valorDe(sala, CHAVES.membro(p.id)) as Partial<Membro> | undefined;
    r[p.id] = { nome: typeof v?.nome === 'string' ? v.nome : '', ...(typeof v?.tela === 'string' && { tela: v.tela }), ...(aparenciaValida(v?.avatar) && { avatar: v.avatar }) };
  }
  return r;
}

const TONS = ['claro', 'moreno', 'negro'];
const CABELOS = ['curto', 'raspado', 'cacheado', 'longo', 'preso'];

/** Aparência que chegou de outra tela (formato estranho = ignorada, fica a padrão). */
export function aparenciaValida(x: unknown): x is AparenciaAvatar {
  const a = x as AparenciaAvatar | null | undefined;
  return !!a && typeof a === 'object' && TONS.includes(a.pele) && CABELOS.includes(a.cabelo) && typeof a.roupa === 'string' && /^#[0-9a-f]{6}$/i.test(a.roupa);
}

/** Mapa "prefixo:x" → valor, só com os valores do tipo certo. */
function mapaDe<T>(sala: SalaParada, prefixo: string, eDoTipo: (v: unknown) => v is T): Record<string, T> {
  const r: Record<string, T> = {};
  for (const [k, reg] of Object.entries(sala.campos)) if (k.startsWith(`${prefixo}:`) && eDoTipo(reg.valor)) r[k.slice(prefixo.length + 1)] = reg.valor;
  return r;
}

export function briefingDaSala(sala: SalaParada): Set<string> {
  const m = mapaDe(sala, 'briefing', (v): v is boolean => typeof v === 'boolean');
  return new Set(Object.keys(m).filter((k) => m[k]));
}

export function respostasDaSala(sala: SalaParada): Record<string, string> {
  return mapaDe(sala, 'resposta', (v): v is string => typeof v === 'string');
}

export function crmDaSala(sala: SalaParada): Record<string, number> {
  return mapaDe(sala, 'crm', (v): v is number => typeof v === 'number');
}

// ---- Telas e papéis ------------------------------------------------------------------------

/** Telas que só assistem (professor, telão): ficam fora dos papéis. */
export function observadoresDaSala(sala: SalaParada): Set<string> {
  const m = mapaDe(sala, 'observador', (v): v is boolean => typeof v === 'boolean');
  return new Set(Object.keys(m).filter((t) => m[t]));
}

/** Telas da equipe em ordem de entrada (só as vivas, se informado). As que só assistem ficam de fora. */
export function ordemDasTelas(sala: SalaParada, vivas?: ReadonlySet<string>): string[] {
  const observadores = observadoresDaSala(sala);
  return Object.entries(sala.telas)
    .filter(([t]) => (!vivas || vivas.has(t)) && !observadores.has(t))
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);
}

/** Tela de quem faz o papel: a escolhida (se ainda aberta) ou a primeira tela aberta. */
export function donoDoPapel(sala: SalaParada, papel: string, vivas: ReadonlySet<string>): string | undefined {
  const escolhida = membrosDaSala(sala)[papel]?.tela;
  if (escolhida && vivas.has(escolhida) && !observadoresDaSala(sala).has(escolhida)) return escolhida;
  return ordemDasTelas(sala, vivas)[0];
}

export function papeisDaTela(sala: SalaParada, tela: string, vivas: ReadonlySet<string>): string[] {
  return PAPEIS_EQUIPE.filter((p) => donoDoPapel(sala, p.id, vivas) === tela).map((p) => p.id);
}

/** Os dois compressores revezam a cada ciclo quando o 2º tem nome ou está em outra tela. */
export function compressorDaVez(sala: SalaParada, cicloNumero: number, vivas: ReadonlySet<string>): 'compressor-1' | 'compressor-2' {
  const membros = membrosDaSala(sala);
  const revezam = membros['compressor-2']!.nome.trim() !== '' || donoDoPapel(sala, 'compressor-2', vivas) !== donoDoPapel(sala, 'compressor-1', vivas);
  return revezam && cicloNumero % 2 === 0 ? 'compressor-2' : 'compressor-1';
}

// ---- Mensagens entre telas ------------------------------------------------------------------

export type MensagemParada =
  /** Tela que acabou de abrir pede a sala. */
  | { tipo: 'ola'; tela: string }
  /** "Ainda estou aqui" (a cada poucos segundos) e "fechei". */
  | { tipo: 'presente'; tela: string }
  | { tipo: 'tchau'; tela: string }
  /** A sala inteira ou só o que mudou (parcial). */
  | { tipo: 'sala'; tela: string; sala: SalaParada; parcial?: boolean };
