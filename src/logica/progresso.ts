/**
 * Monta a folha de prescrição e o rascunho de cálculos "até a etapa atual".
 * Funções puras: dado o roteiro e o número da etapa, devolvem o que deve estar escrito.
 * Assim, avançar e voltar é só mudar o número da etapa.
 */
import { SECOES_DA_FOLHA } from '../dados/secoes';
import type { LinhaPrescricao, Roteiro, SecaoPrescricao } from '../dados/roteiros/tipos';

export interface SecaoDaFolha {
  secao: SecaoPrescricao;
  linhas: LinhaPrescricao[];
}

export interface EstadoFolha {
  secoes: SecaoDaFolha[];
  /** Linha escrita ou reescrita na etapa atual (para destacar). */
  idLinhaNova: string | null;
}

/** Seções que o roteiro usa (as outras nem aparecem na folha). */
export function secoesUsadas(roteiro: Roteiro): SecaoPrescricao[] {
  const usadas = new Set(roteiro.etapas.flatMap((e) => (e.linha ? [e.linha.secao] : [])));
  return SECOES_DA_FOLHA.filter((s) => usadas.has(s));
}

export function montarFolha(roteiro: Roteiro, indiceEtapa: number): EstadoFolha {
  const linhas = new Map<string, LinhaPrescricao>();
  roteiro.etapas.slice(0, indiceEtapa + 1).forEach((etapa) => {
    if (etapa.linha) linhas.set(etapa.linha.id, etapa.linha);
  });
  const secoes = secoesUsadas(roteiro).map((secao) => ({
    secao,
    linhas: [...linhas.values()].filter((l) => l.secao === secao),
  }));
  return { secoes, idLinhaNova: roteiro.etapas[indiceEtapa]?.linha?.id ?? null };
}

export interface LinhaRascunho {
  idEtapa: string;
  texto: string;
}

export function montarRascunho(roteiro: Roteiro, indiceEtapa: number): LinhaRascunho[] {
  return roteiro.etapas
    .slice(0, indiceEtapa + 1)
    .flatMap((e) => (e.conta ? [{ idEtapa: e.id, texto: e.conta.rascunho }] : []));
}
