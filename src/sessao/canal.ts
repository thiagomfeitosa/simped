/**
 * B15 — Canal entre janelas do mesmo computador (prova de conceito do modo online, sem servidor).
 * Usa BroadcastChannel; se o navegador não entregar (ex.: arquivo aberto com dois cliques),
 * também manda pelo armazenamento local (evento "storage"). Mensagem repetida é ignorada.
 *
 * No modo online (Fase 7), este mesmo formato de mensagem vai pela rede (WebSocket).
 */

import type { AcaoSessao, RegistroSessao } from './sessao';

export type MensagemCanal =
  /** Janela do professor acabou de abrir: pede o estado atual. */
  | { tipo: 'ola' }
  /** Janela do aluno manda a sessão inteira (caso + registros). */
  | { tipo: 'estado'; casoId: string; geracao: number; registros: RegistroSessao[] }
  /** Janela do professor manda uma ação (alterar sinais, complicação, mensagem, tempo). */
  | { tipo: 'acao'; acao: AcaoSessao }
  /** Professor troca o caso do aluno. */
  | { tipo: 'trocarCaso'; casoId: string };

interface Envelope {
  id: string;
  de: string;
  msg: MensagemCanal;
}

export interface Canal {
  enviar: (msg: MensagemCanal) => void;
  fechar: () => void;
}

const NOME = 'simped-sessao';
const CHAVE = 'simped.canal';

function novoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Abre o canal. `aoReceber` só recebe mensagens de OUTRAS janelas, uma vez cada. */
export function abrirCanal(aoReceber: (msg: MensagemCanal) => void, eu: string = novoId()): Canal {
  const vistos = new Set<string>();
  const receber = (env: unknown) => {
    const e = env as Envelope | null;
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
      const env: Envelope = { id: novoId(), de: eu, msg };
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
