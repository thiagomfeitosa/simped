/**
 * Modo validação (B5): o usuário confere cada dose/apresentação dentro do app, na aba Banco.
 * Cada conferência vira um registro (fonte, página, quem, quando, valor anterior e, se for o caso, o valor corrigido).
 * Os registros ficam no computador e podem ser baixados num .json que entra no projeto
 * (src/dados/medicacoes/validacoes-conferidas.json): a partir daí valem para todos.
 *
 * Sem tela: as regras de segurança ficam aqui e têm testes.
 */

import { arredondar } from '../../calculos';
import { textoDaRegra } from './resumo';
import type { Apresentacao, Fonte, Medicacao, RegraDeDose, StatusValidacao } from './tipos';

export type TipoAlvo = 'regra' | 'apresentacao';

export interface AlvoValidacao {
  tipo: TipoAlvo;
  medicacaoId: string;
  /** Id da regra ou da apresentação dentro da medicação. */
  itemId: string;
}

/**
 * Campos da regra que a conferência pode corrigir.
 * `doseMaxima: null` = a fonte não tem dose máxima (apaga a que estava no rascunho).
 */
export type CorrecaoRegra = Partial<Pick<RegraDeDose, 'dose' | 'intervalosHoras' | 'vias' | 'observacoes'>> & {
  doseMaxima?: RegraDeDose['doseMaxima'] | null;
};

/** Campos da apresentação que a conferência pode corrigir. */
export type CorrecaoApresentacao = Partial<
  Pick<Apresentacao, 'descricao' | 'quantidade' | 'volumeMl' | 'concentracaoPorMl' | 'vias' | 'observacao'>
>;

export interface Validacao {
  alvo: AlvoValidacao;
  /** CONFERIDO = bate com a fonte (passa a corrigir o aluno). A_VALIDAR = só anotou/corrigiu, sem confirmar. */
  status: StatusValidacao;
  fonte: Fonte;
  /** Quem conferiu (nome livre). */
  quem?: string;
  /** Data e hora da conferência (ISO). */
  quando: string;
  /** Como o valor estava antes (texto), para o histórico. */
  valorAnterior: string;
  correcaoRegra?: CorrecaoRegra;
  correcaoApresentacao?: CorrecaoApresentacao;
  nota?: string;
}

export function chaveDoAlvo(alvo: AlvoValidacao): string {
  return `${alvo.tipo}:${alvo.medicacaoId}/${alvo.itemId}`;
}

/** Valor atual de uma apresentação em texto (para o histórico e a lista). */
export function textoDaApresentacao(a: Apresentacao): string {
  const partes = [a.descricao];
  if (a.concentracaoPorMl) partes.push(`${arredondar(a.concentracaoPorMl.valor, 4)} ${a.concentracaoPorMl.unidade}/mL`);
  if (a.quantidade) partes.push(`${arredondar(a.quantidade.valor, 4)} ${a.quantidade.unidade} por unidade`);
  if (a.volumeMl !== undefined) partes.push(`${a.volumeMl} mL`);
  partes.push(`vias ${a.vias.join('/') || '?'}`);
  return partes.join(' · ');
}

/** Valor atual de uma regra em texto. */
export function textoDaRegraCompleta(r: RegraDeDose): string {
  const intervalo = r.intervalosHoras?.length ? ` · ${r.intervalosHoras.map((h) => `${h}/${h}h`).join(' ou ')}` : '';
  return `${r.indicacao}: ${textoDaRegra(r)}${intervalo} · vias ${r.vias.join('/')}`;
}

/** Acha o item que o registro confere (ou undefined se ele não existe mais no banco). */
export function acharAlvo(
  banco: readonly Medicacao[],
  alvo: AlvoValidacao,
): { medicacao: Medicacao; regra?: RegraDeDose; apresentacao?: Apresentacao } | undefined {
  const medicacao = banco.find((m) => m.id === alvo.medicacaoId);
  if (!medicacao) return undefined;
  if (alvo.tipo === 'regra') {
    const regra = medicacao.regras.find((r) => r.id === alvo.itemId);
    return regra ? { medicacao, regra } : undefined;
  }
  const apresentacao = medicacao.apresentacoes.find((a) => a.id === alvo.itemId);
  return apresentacao ? { medicacao, apresentacao } : undefined;
}

/**
 * Problemas de um registro antes de aceitá-lo. Regra de segurança:
 * CONFERIDO precisa de documento (do catálogo ou escrito) E de página/tabela.
 */
export function verificarValidacao(v: Validacao, banco: readonly Medicacao[]): string[] {
  const p: string[] = [];
  if (!acharAlvo(banco, v.alvo)) p.push(`Item ${chaveDoAlvo(v.alvo)} não existe no banco.`);
  if (v.status === 'CONFERIDO') {
    if (!v.fonte.documentoId && !v.fonte.documento?.trim()) p.push('Para marcar CONFERIDO, informe o documento da fonte.');
    if (!v.fonte.pagina?.trim()) p.push('Para marcar CONFERIDO, informe a página, tabela ou seção.');
  }
  const d = v.correcaoRegra?.dose;
  if (d && d.tipo !== 'texto') {
    if (!(d.min > 0) || !(d.max > 0)) p.push('A dose corrigida precisa ser maior que zero.');
    if (d.min > d.max) p.push('A dose mínima corrigida está maior que a máxima.');
  }
  if (d && d.tipo === 'texto' && !d.descricao.trim()) p.push('A dose em texto está vazia.');
  if (v.correcaoRegra?.doseMaxima && !(v.correcaoRegra.doseMaxima.valor > 0)) p.push('A dose máxima corrigida precisa ser maior que zero.');
  if (v.correcaoRegra?.intervalosHoras?.some((h) => !(h > 0))) p.push('Intervalo em horas inválido.');
  if (v.correcaoRegra?.vias?.length === 0) p.push('A regra precisa de pelo menos uma via.');
  const c = v.correcaoApresentacao;
  if (c?.concentracaoPorMl && !(c.concentracaoPorMl.valor > 0)) p.push('A concentração corrigida precisa ser maior que zero.');
  if (c?.quantidade && !(c.quantidade.valor > 0)) p.push('A quantidade corrigida precisa ser maior que zero.');
  if (c?.volumeMl !== undefined && !(c.volumeMl > 0)) p.push('O volume corrigido precisa ser maior que zero.');
  if (c?.descricao !== undefined && !c.descricao.trim()) p.push('A descrição da apresentação está vazia.');
  return p;
}

/**
 * Acrescenta um registro ao histórico. O histórico nunca perde nada:
 * o que vale para cada item é o registro mais recente (ver `ultimasPorAlvo`).
 */
export function registrarValidacao(historico: readonly Validacao[], nova: Validacao): Validacao[] {
  return [...historico, nova];
}

/** Registro mais recente de cada item. */
export function ultimasPorAlvo(historico: readonly Validacao[]): Map<string, Validacao> {
  const mapa = new Map<string, Validacao>();
  for (const v of historico) mapa.set(chaveDoAlvo(v.alvo), v);
  return mapa;
}

/** Todos os registros de um item, do mais antigo ao mais recente. */
export function historicoDoAlvo(historico: readonly Validacao[], alvo: AlvoValidacao): Validacao[] {
  const chave = chaveDoAlvo(alvo);
  return historico.filter((v) => chaveDoAlvo(v.alvo) === chave);
}

/**
 * Aplica as conferências ao banco: corrige os valores e troca status e fonte.
 * Registro que aponta para item que não existe é ignorado (aparece em `verificarValidacao`).
 */
export function aplicarValidacoes(banco: readonly Medicacao[], historico: readonly Validacao[]): Medicacao[] {
  if (historico.length === 0) return [...banco];
  const ultimas = ultimasPorAlvo(historico);
  return banco.map((m) => {
    let mudou = false;
    const regras = m.regras.map((r) => {
      const v = ultimas.get(chaveDoAlvo({ tipo: 'regra', medicacaoId: m.id, itemId: r.id }));
      if (!v) return r;
      mudou = true;
      const { doseMaxima, ...resto } = v.correcaoRegra ?? {};
      const nova: RegraDeDose = { ...r, ...resto, status: v.status, fonte: v.fonte };
      if (doseMaxima === null) delete nova.doseMaxima;
      else if (doseMaxima) nova.doseMaxima = doseMaxima;
      return nova;
    });
    const apresentacoes = m.apresentacoes.map((a) => {
      const v = ultimas.get(chaveDoAlvo({ tipo: 'apresentacao', medicacaoId: m.id, itemId: a.id }));
      if (!v) return a;
      mudou = true;
      return { ...a, ...v.correcaoApresentacao, status: v.status, fonte: v.fonte };
    });
    return mudou ? { ...m, regras, apresentacoes } : m;
  });
}

const STATUS: readonly StatusValidacao[] = ['A_VALIDAR', 'CONFERIDO'];

function ehValidacao(x: unknown): x is Validacao {
  if (!x || typeof x !== 'object') return false;
  const v = x as Validacao;
  return (
    !!v.alvo &&
    (v.alvo.tipo === 'regra' || v.alvo.tipo === 'apresentacao') &&
    typeof v.alvo.medicacaoId === 'string' &&
    typeof v.alvo.itemId === 'string' &&
    STATUS.includes(v.status) &&
    !!v.fonte &&
    typeof v.fonte.codigo === 'string' &&
    typeof v.quando === 'string'
  );
}

/** Lê o .json de validações (do computador ou do projeto), descartando o que não tiver o formato certo. */
export function lerValidacoes(texto: string | null | unknown): Validacao[] {
  let dado: unknown = texto;
  if (typeof texto === 'string') {
    try {
      dado = JSON.parse(texto);
    } catch {
      return [];
    }
  }
  if (dado === null || dado === undefined) return [];
  const lista = Array.isArray(dado) ? dado : (dado as { validacoes?: unknown }).validacoes;
  return Array.isArray(lista) ? lista.filter(ehValidacao) : [];
}

/** Junta dois históricos sem repetir registros iguais (mesmo item e mesmo horário), em ordem de horário. */
export function juntarHistoricos(a: readonly Validacao[], b: readonly Validacao[]): Validacao[] {
  const vistos = new Set<string>();
  const todos: Validacao[] = [];
  for (const v of [...a, ...b]) {
    const id = `${chaveDoAlvo(v.alvo)}@${v.quando}`;
    if (vistos.has(id)) continue;
    vistos.add(id);
    todos.push(v);
  }
  return todos.sort((x, y) => x.quando.localeCompare(y.quando));
}

/** Arquivo para baixar e colocar no projeto (src/dados/medicacoes/validacoes-conferidas.json). */
export function arquivoDeValidacoes(historico: readonly Validacao[], agora: Date): string {
  return JSON.stringify({ geradoEm: agora.toISOString(), validacoes: historico }, null, 2);
}
