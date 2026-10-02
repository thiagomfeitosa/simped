/**
 * Caderno de erros (sem tela): o app lembra, de uma sessão para outra, onde o aluno erra
 * (por assunto: rediluição, VIG, vazão, unidade...) e decide o que treinar.
 *
 * Revisão espaçada (caixas de Leitner): cada assunto fica numa caixa de 1 a 5.
 * Errou → volta para a caixa 1 (revisar hoje). Acertou → sobe uma caixa, e a próxima revisão
 * fica mais longe (0, 1, 3, 7 e 14 dias). O treino dirigido escolhe os assuntos "vencidos".
 * Tudo fica guardado no próprio computador (gaveta simped.caderno, entra no backup).
 */

import type { CategoriaErro } from './cacaErros';
import { TIPOS_DE_EXERCICIO, type TipoExercicio } from './treino';

export type Assunto = TipoExercicio | 'seguranca';

export const NOME_ASSUNTO: Record<Assunto, string> = {
  ...TIPOS_DE_EXERCICIO,
  seguranca: 'Regras de segurança',
};

/** Em que assunto do caderno entra cada tipo de erro do caça-erros. */
export const ASSUNTO_DA_CATEGORIA: Record<CategoriaErro, Assunto> = {
  dose: 'dosePeso',
  aspirar: 'volume',
  bic: 'bic',
  vazao: 'vazao',
  vig: 'vig',
  unidade: 'unidade',
  diluicao: 'diluicao',
  seguranca: 'seguranca',
};

export type Origem = 'treino' | 'caca';

/** Dias até a próxima revisão em cada caixa (índice = caixa). */
export const INTERVALO_DIAS = [0, 0, 1, 3, 7, 14] as const;
const CAIXA_MAXIMA = 5;
const ULTIMOS = 10;
const DIAS_GUARDADOS = 60;

export interface RegistroAssunto {
  tentativas: number;
  acertos: number;
  /** Últimos resultados (o mais novo no fim), no máximo 10. */
  ultimos: boolean[];
  caixa: number;
  /** Dia da próxima revisão (AAAA-MM-DD). */
  proxima: string;
  /** Tentativas e acertos por dia (para a evolução), últimos 60 dias com treino. */
  dias: Record<string, { tentativas: number; acertos: number }>;
  /** De onde vieram os registros. */
  origens: Partial<Record<Origem, number>>;
}

export interface Caderno {
  versao: 1;
  assuntos: Partial<Record<Assunto, RegistroAssunto>>;
}

export const CADERNO_VAZIO: Caderno = { versao: 1, assuntos: {} };

/** Data local no formato AAAA-MM-DD (sem fuso: o "hoje" do aluno). */
export function diaDe(data: Date): string {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

function somarDias(data: Date, dias: number): Date {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

/** Registra uma tentativa num assunto (função pura: devolve o caderno novo). */
export function registrarNoCaderno(caderno: Caderno, assunto: Assunto, acertou: boolean, origem: Origem, agora: Date): Caderno {
  const atual = caderno.assuntos[assunto];
  const hoje = diaDe(agora);
  const caixa = acertou ? Math.min(CAIXA_MAXIMA, (atual?.caixa ?? 1) + 1) : 1;
  const doDia = atual?.dias[hoje] ?? { tentativas: 0, acertos: 0 };
  const dias = { ...atual?.dias, [hoje]: { tentativas: doDia.tentativas + 1, acertos: doDia.acertos + (acertou ? 1 : 0) } };
  const diasGuardados = Object.fromEntries(Object.entries(dias).sort(([a], [b]) => a.localeCompare(b)).slice(-DIAS_GUARDADOS));
  const novo: RegistroAssunto = {
    tentativas: (atual?.tentativas ?? 0) + 1,
    acertos: (atual?.acertos ?? 0) + (acertou ? 1 : 0),
    ultimos: [...(atual?.ultimos ?? []), acertou].slice(-ULTIMOS),
    caixa,
    proxima: diaDe(somarDias(agora, INTERVALO_DIAS[caixa] ?? 0)),
    dias: diasGuardados,
    origens: { ...atual?.origens, [origem]: (atual?.origens?.[origem] ?? 0) + 1 },
  };
  return { ...caderno, assuntos: { ...caderno.assuntos, [assunto]: novo } };
}

export interface SituacaoAssunto {
  assunto: Assunto;
  nome: string;
  tentativas: number;
  /** Acerto nas últimas tentativas (0 a 1). */
  taxaRecente: number;
  caixa: number;
  proxima: string;
  /** A revisão já venceu (ou é hoje). */
  revisarHoje: boolean;
  ultimos: boolean[];
}

/** Situação de cada assunto já treinado, do mais fraco para o mais forte. */
export function situacaoDoCaderno(caderno: Caderno, agora: Date): SituacaoAssunto[] {
  const hoje = diaDe(agora);
  return (Object.entries(caderno.assuntos) as [Assunto, RegistroAssunto][])
    .map(([assunto, r]) => ({
      assunto,
      nome: NOME_ASSUNTO[assunto] ?? assunto,
      tentativas: r.tentativas,
      taxaRecente: r.ultimos.length ? r.ultimos.filter(Boolean).length / r.ultimos.length : 0,
      caixa: r.caixa,
      proxima: r.proxima,
      revisarHoje: r.proxima <= hoje,
      ultimos: r.ultimos,
    }))
    .sort((a, b) => Number(b.revisarHoje) - Number(a.revisarHoje) || a.taxaRecente - b.taxaRecente || a.caixa - b.caixa);
}

/**
 * Que contas o treino dirigido deve sortear: os assuntos com revisão vencida;
 * se nenhum venceu, os 3 com menor acerto recente. Caderno vazio → null (treina tudo).
 * "Regras de segurança" não vira conta: é treinado no caça-erros.
 */
export function tiposParaTreinoDirigido(caderno: Caderno, agora: Date): TipoExercicio[] | null {
  const situacao = situacaoDoCaderno(caderno, agora).filter((s): s is SituacaoAssunto & { assunto: TipoExercicio } => s.assunto !== 'seguranca');
  if (situacao.length === 0) return null;
  const vencidos = situacao.filter((s) => s.revisarHoje).map((s) => s.assunto);
  if (vencidos.length > 0) return vencidos;
  return [...situacao].sort((a, b) => a.taxaRecente - b.taxaRecente).slice(0, 3).map((s) => s.assunto);
}

/** Evolução de um assunto: % de acerto por dia (só dias com treino), em ordem. */
export function evolucaoDoAssunto(caderno: Caderno, assunto: Assunto): { dia: string; taxa: number; tentativas: number }[] {
  const r = caderno.assuntos[assunto];
  if (!r) return [];
  return Object.entries(r.dias)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, d]) => ({ dia, taxa: d.tentativas ? d.acertos / d.tentativas : 0, tentativas: d.tentativas }));
}

/** Lê o caderno guardado (texto JSON); qualquer coisa estranha vira caderno vazio. */
export function lerCadernoDeTexto(texto: string | null): Caderno {
  if (!texto) return CADERNO_VAZIO;
  try {
    const c = JSON.parse(texto) as Caderno;
    return c && c.versao === 1 && typeof c.assuntos === 'object' && c.assuntos !== null ? c : CADERNO_VAZIO;
  } catch {
    return CADERNO_VAZIO;
  }
}
