/**
 * Monta a folha de prescrição e o rascunho de cálculos "até a etapa atual".
 * Funções puras: dado o roteiro e o número da etapa, devolvem o que deve estar escrito.
 * Assim, avançar e voltar é só mudar o número da etapa.
 */
import { SECOES_DA_FOLHA } from '../dados/secoes';
import type { Conta, LinhaPrescricao, Roteiro, SecaoPrescricao } from '../dados/roteiros/tipos';

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

/** Rascunho: a versão curta de cada conta, na ordem em que foram feitas. */
export function montarRascunho(roteiro: Roteiro, indiceEtapa: number): LinhaRascunho[] {
  return roteiro.etapas
    .slice(0, indiceEtapa + 1)
    .flatMap((e) => (e.conta ? [{ idEtapa: e.id, texto: e.conta.rascunho }] : []));
}

// ---- Prescrição final com os cálculos ------------------------------------------

export interface ContaDaLinha {
  idEtapa: string;
  indiceEtapa: number;
  /** Nome curto da etapa (o mesmo da seta). */
  curto: string;
  conta: Conta;
}

export interface LinhaComCalculos {
  linha: LinhaPrescricao;
  contas: ContaDaLinha[];
  /** Verdadeiro se alguma etapa que escreveu esta linha (ou fez as contas dela) está "A VALIDAR". */
  aValidar: boolean;
}

export interface PrescricaoComCalculos {
  secoes: { secao: SecaoPrescricao; linhas: LinhaComCalculos[] }[];
  /** Contas que não pertencem a nenhuma linha da folha. */
  contasSoltas: ContaDaLinha[];
}

/**
 * A folha no estado final, com as contas de cada item logo abaixo dele.
 * Uma conta pertence à linha indicada em `linhaDaConta`; senão, à linha que a sua etapa
 * escreve; senão, à última linha escrita antes dela (ex.: "sem diluir daria 0,1 mL" → adrenalina).
 */
export function montarPrescricaoComCalculos(roteiro: Roteiro): PrescricaoComCalculos {
  const linhas = new Map<string, LinhaPrescricao>();
  const contas = new Map<string, ContaDaLinha[]>();
  const aValidar = new Set<string>();
  const contasSoltas: ContaDaLinha[] = [];
  let ultimaLinha: string | null = null;

  roteiro.etapas.forEach((etapa, indiceEtapa) => {
    if (etapa.linha) {
      linhas.set(etapa.linha.id, etapa.linha);
      ultimaLinha = etapa.linha.id;
    }
    const alvo = etapa.linhaDaConta ?? etapa.linha?.id ?? ultimaLinha;
    if (etapa.aValidar && etapa.linha) aValidar.add(etapa.linha.id);
    if (!etapa.conta) return;
    if (etapa.aValidar && alvo) aValidar.add(alvo);
    const item: ContaDaLinha = { idEtapa: etapa.id, indiceEtapa, curto: etapa.curto, conta: etapa.conta };
    if (alvo) contas.set(alvo, [...(contas.get(alvo) ?? []), item]);
    else contasSoltas.push(item);
  });

  const secoes = secoesUsadas(roteiro).map((secao) => ({
    secao,
    linhas: [...linhas.values()]
      .filter((l) => l.secao === secao)
      .map((linha) => ({ linha, contas: contas.get(linha.id) ?? [], aValidar: aValidar.has(linha.id) })),
  }));
  return { secoes, contasSoltas };
}
