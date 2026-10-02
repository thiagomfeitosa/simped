/**
 * B15 — Canal entre janelas do mesmo computador (prova de conceito do modo online, sem servidor).
 * Usa BroadcastChannel; se o navegador não entregar (ex.: arquivo aberto com dois cliques),
 * também manda pelo armazenamento local (evento "storage"). Mensagem repetida é ignorada.
 *
 * No modo online (Fase 7), este mesmo formato de mensagem vai pela rede (WebSocket).
 */

import type { VariacaoCaso } from '../casos/variacao';
import type { AcaoSessao, RegistroSessao } from './sessao';

export type MensagemCanal =
  /** Janela do professor acabou de abrir: pede o estado atual. */
  | { tipo: 'ola' }
  /** Janela do aluno manda a sessão inteira (caso + registros). */
  | { tipo: 'estado'; casoId: string; geracao: number; registros: RegistroSessao[]; variacao?: VariacaoCaso | null }
  /** Janela do professor manda uma ação (alterar sinais, complicação, mensagem, tempo). */
  | { tipo: 'acao'; acao: AcaoSessao }
  /**
   * Professor troca o caso do aluno (ou recomeça). B16: 'variar' sorteia outro peso/idade/apresentação,
   * 'original' tira a variação, 'manter' recomeça com a mesma; sem isso, vale a Configuração da janela do aluno.
   */
  | { tipo: 'trocarCaso'; casoId: string; variacao?: 'variar' | 'original' | 'manter' };

interface Envelope<M> {
  id: string;
  de: string;
  msg: M;
}

export interface Canal<M = MensagemCanal> {
  enviar: (msg: M) => void;
  fechar: () => void;
}

/** Nome do canal e gaveta do armazenamento (cada assunto tem o seu; a gaveta começa por "simped.canal"). */
export interface OpcoesCanal {
  nome: string;
  chave: string;
}

const PADRAO: OpcoesCanal = { nome: 'simped-sessao', chave: 'simped.canal' };

function novoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Abre o canal. `aoReceber` só recebe mensagens de OUTRAS janelas, uma vez cada. */
export function abrirCanal<M = MensagemCanal>(aoReceber: (msg: M) => void, eu: string = novoId(), opcoes: OpcoesCanal = PADRAO): Canal<M> {
  const { nome: NOME, chave: CHAVE } = opcoes;
  const vistos = new Set<string>();
  const receber = (env: unknown) => {
    const e = env as Envelope<M> | null;
    if (!e || typeof e !== 'object' || typeof e.id !== 'string' || !e.msg || e.de === eu || vistos.has(e.id)) return;
    vistos.add(e.id);
    if (vistos.size > 500) vistos.clear();
    aoReceber(e.msg);
  };

  let bc: BroadcastChannel | null = null;
  try {
    bc = typeof BroadcastChannel === 'function' ? new BroadcastChannel(NOME) : null;
    if (bc) bc.onmessage = (ev) => receber(ev.data);
  } catch {
    bc = null;
  }
  const temJanela = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
  const aoMudarArmazenamento = (ev: StorageEvent) => {
    if (ev.key !== CHAVE || !ev.newValue) return;
    try {
      receber(JSON.parse(ev.newValue));
    } catch {
      // mensagem estragada: ignora
    }
  };
  if (temJanela) window.addEventListener('storage', aoMudarArmazenamento);

  return {
    enviar: (msg) => {
      const env: Envelope<M> = { id: novoId(), de: eu, msg };
      try {
        bc?.postMessage(env);
      } catch {
        // sem BroadcastChannel: vai só pelo armazenamento
      }
      if (temJanela) {
        try {
          window.localStorage.setItem(CHAVE, JSON.stringify(env));
        } catch {
          // sem armazenamento: vai só pelo BroadcastChannel
        }
      }
    },
    fechar: () => {
      bc?.close();
      if (temJanela) window.removeEventListener('storage', aoMudarArmazenamento);
    },
  };
}
