/**
 * Versão do banco de medicações e histórico de mudanças (B7). Sem tela.
 *
 * - Cada mudança no banco do projeto (dado novo, correção, conferência gravada em validacoes-conferidas.json)
 *   vira uma VERSÃO numerada em versoes/historico-banco.json, com a lista do que mudou
 *   (o que era, o que ficou e, quando veio do modo validação, quem conferiu e quando).
 * - versoes/banco-publicado.json guarda o banco da última versão: um teste compara com o banco atual
 *   e falha se alguém mudar o banco sem registrar (rodar `npm run nova-versao-banco -- "o que mudou"`).
 * - O "código" é uma impressão digital do conteúdo: identifica exatamente com qual banco o aluno treinou,
 *   inclusive quando o computador tem conferências ou apresentações que ainda não entraram no projeto.
 */

import { textoCondicoes } from './consulta';
import type { Apresentacao, Fonte, Medicacao, RegraDeDose, StatusValidacao } from './tipos';
import { chaveDoAlvo, textoDaApresentacao, textoDaRegraCompleta, ultimasPorAlvo, type Validacao } from './validacoes';
import historicoDoProjeto from './versoes/historico-banco.json';

export type TipoMudanca =
  | 'medicacao-nova'
  | 'medicacao-removida'
  | 'medicacao-alterada'
  | 'apresentacao-nova'
  | 'apresentacao-removida'
  | 'apresentacao-alterada'
  | 'regra-nova'
  | 'regra-removida'
  | 'regra-alterada';

export interface MudancaBanco {
  tipo: TipoMudanca;
  medicacaoId: string;
  /** Nome da medicação (para ler sem abrir o banco). */
  medicacao: string;
  /** Id da apresentação ou da regra (vazio quando a mudança é na medicação inteira). */
  itemId?: string;
  /** Como era (texto). */
  antes?: string;
  /** Como ficou (texto). */
  depois?: string;
  /** Quando a mudança veio de uma conferência do modo validação (B5): quem, quando e onde. */
  conferencia?: { quem?: string; quando: string; status: StatusValidacao; fonte: string };
}

export interface VersaoBanco {
  versao: number;
  /** Data da versão (AAAA-MM-DD). */
  data: string;
  /** O que mudou, em uma frase (quem pediu, qual tarefa). */
  descricao: string;
  /** Impressão digital do banco nesta versão. */
  codigo: string;
  resumo: { medicacoes: number; apresentacoes: number; regras: number; conferidos: number };
  mudancas: MudancaBanco[];
}

export const NOME_TIPO_MUDANCA: Record<TipoMudanca, string> = {
  'medicacao-nova': 'Medicação nova',
  'medicacao-removida': 'Medicação removida',
  'medicacao-alterada': 'Dados gerais alterados',
  'apresentacao-nova': 'Apresentação nova',
  'apresentacao-removida': 'Apresentação removida',
  'apresentacao-alterada': 'Apresentação alterada',
  'regra-nova': 'Regra de dose nova',
  'regra-removida': 'Regra de dose removida',
  'regra-alterada': 'Regra de dose alterada',
};

/** Histórico gravado no projeto, da versão mais antiga para a mais nova. */
export const HISTORICO_BANCO: readonly VersaoBanco[] = (historicoDoProjeto as { versoes: VersaoBanco[] }).versoes;

/** Versão mais recente do banco do projeto. */
export const VERSAO_ATUAL: VersaoBanco = HISTORICO_BANCO[HISTORICO_BANCO.length - 1]!;

/** Impressão digital (8 letras/números) de um texto: muda se qualquer letra mudar. */
export function impressaoDoTexto(texto: string): string {
  // cyrb53: rápido, sem biblioteca, e igual no navegador e no Node
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const n = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return n.toString(16).padStart(14, '0').slice(-8);
}

/** Impressão digital do banco inteiro (o que o aluno usa para treinar). */
export function impressaoDigital(banco: readonly Medicacao[]): string {
  return impressaoDoTexto(JSON.stringify(banco));
}

export function resumoDaVersao(banco: readonly Medicacao[]): VersaoBanco['resumo'] {
  const aps = banco.flatMap((m) => m.apresentacoes);
  const regras = banco.flatMap((m) => m.regras);
  return {
    medicacoes: banco.length,
    apresentacoes: aps.length,
    regras: regras.length,
    conferidos: [...aps, ...regras].filter((x) => x.status === 'CONFERIDO').length,
  };
}

// ---------- textos para o histórico ----------

function textoFonte(f: Fonte | undefined): string {
  if (!f) return 'sem fonte';
  const doc = f.documentoId ?? f.documento;
  return [f.codigo, doc, f.pagina && `p. ${f.pagina}`].filter(Boolean).join(' · ');
}

const STATUS: Record<StatusValidacao, string> = { A_VALIDAR: 'A VALIDAR', CONFERIDO: 'CONFERIDO' };

/** Apresentação em texto, com tudo o que pode mudar. */
export function textoCompletoApresentacao(a: Apresentacao): string {
  return [
    textoDaApresentacao(a),
    a.gotasPorMl !== undefined && `${a.gotasPorMl} gotas/mL`,
    a.observacao && `obs.: ${a.observacao}`,
    STATUS[a.status],
    a.fonte && `fonte: ${textoFonte(a.fonte)}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Regra em texto, com tudo o que pode mudar. */
export function textoCompletoRegra(r: RegraDeDose): string {
  const cond = textoCondicoes(r.condicoes);
  return [
    textoDaRegraCompleta(r),
    `faixas ${r.faixas.join('/')}`,
    cond && `condições: ${cond}`,
    r.observacoes && `obs.: ${r.observacoes}`,
    STATUS[r.status],
    `fonte: ${textoFonte(r.fonte)}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Dados gerais da medicação (sem apresentações e regras) em texto. */
export function textoGeralMedicacao(m: Medicacao): string {
  return [
    m.codigo && `Nº ${m.codigo}`,
    m.nome,
    `seção ${m.secao}`,
    m.classe,
    m.usos && `usos: ${m.usos}`,
    m.classes?.length && `etiquetas: ${m.classes.join(', ')}`,
    m.receituario && `receita: ${m.receituario}`,
    m.concentracaoMaximaEV &&
      `conc. máx. EV ${m.concentracaoMaximaEV.valor} ${m.concentracaoMaximaEV.unidade}/mL (${STATUS[m.concentracaoMaximaEV.status]})`,
    m.alertas?.length && `alertas: ${m.alertas.join(' / ')}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

function semItens(m: Medicacao): Omit<Medicacao, 'apresentacoes' | 'regras'> {
  const { apresentacoes: _a, regras: _r, ...resto } = m;
  return resto;
}

/** Quando o texto não mostra a diferença (campo interno), avisa que algo mudou mesmo assim. */
function textosDiferentes(antes: string, depois: string): [string, string] {
  return antes === depois ? [antes, `${depois} · (detalhe interno alterado)`] : [antes, depois];
}

/**
 * O que mudou de um banco para outro, medicação por medicação.
 * `conferencias`: registros do modo validação; quando um item mudou por causa de uma conferência
 * que está valendo, a mudança mostra quem conferiu, quando e onde.
 */
export function compararBancos(
  antes: readonly Medicacao[],
  depois: readonly Medicacao[],
  conferencias: readonly Validacao[] = [],
): MudancaBanco[] {
  const ultimas = ultimasPorAlvo(conferencias);
  const conferenciaDe = (tipo: 'regra' | 'apresentacao', m: Medicacao, item: RegraDeDose | Apresentacao) => {
    const v = ultimas.get(chaveDoAlvo({ tipo, medicacaoId: m.id, itemId: item.id }));
    // só mostra se é essa conferência que está valendo (status e fonte iguais aos do item)
    if (!v || v.status !== item.status || JSON.stringify(v.fonte) !== JSON.stringify(item.fonte)) return undefined;
    return { ...(v.quem && { quem: v.quem }), quando: v.quando, status: v.status, fonte: textoFonte(v.fonte) };
  };

  const mudancas: MudancaBanco[] = [];
  const porIdAntes = new Map(antes.map((m) => [m.id, m]));
  const idsDepois = new Set(depois.map((m) => m.id));

  for (const m of depois) {
    const velha = porIdAntes.get(m.id);
    const base = { medicacaoId: m.id, medicacao: m.nome };
    if (!velha) {
      const partes = [
        m.codigo && `Nº ${m.codigo}`,
        `seção ${m.secao}`,
        m.classe,
        `${m.apresentacoes.length} apresentação(ões)`,
        `${m.regras.length} regra(s) de dose`,
      ];
      mudancas.push({ tipo: 'medicacao-nova', ...base, depois: partes.filter(Boolean).join(' · ') });
      continue;
    }
    if (JSON.stringify(semItens(velha)) !== JSON.stringify(semItens(m))) {
      const [a, d] = textosDiferentes(textoGeralMedicacao(velha), textoGeralMedicacao(m));
      mudancas.push({ tipo: 'medicacao-alterada', ...base, antes: a, depois: d });
    }

    const itens = <T extends Apresentacao | RegraDeDose>(
      tipo: 'apresentacao' | 'regra',
      velhos: readonly T[],
      novos: readonly T[],
      texto: (x: T) => string,
    ) => {
      const porId = new Map(velhos.map((x) => [x.id, x]));
      const novosIds = new Set(novos.map((x) => x.id));
      for (const x of novos) {
        const v = porId.get(x.id);
        const conferencia = conferenciaDe(tipo, m, x);
        if (!v) {
          mudancas.push({ tipo: `${tipo}-nova`, ...base, itemId: x.id, depois: texto(x), ...(conferencia && { conferencia }) });
        } else if (JSON.stringify(v) !== JSON.stringify(x)) {
          const [a, d] = textosDiferentes(texto(v), texto(x));
          mudancas.push({ tipo: `${tipo}-alterada`, ...base, itemId: x.id, antes: a, depois: d, ...(conferencia && { conferencia }) });
        }
      }
      for (const v of velhos) {
        if (!novosIds.has(v.id)) mudancas.push({ tipo: `${tipo}-removida`, ...base, itemId: v.id, antes: texto(v) });
      }
    };
    itens('apresentacao', velha.apresentacoes, m.apresentacoes, textoCompletoApresentacao);
    itens('regra', velha.regras, m.regras, textoCompletoRegra);
  }

  for (const velha of antes) {
    if (!idsDepois.has(velha.id)) {
      mudancas.push({ tipo: 'medicacao-removida', medicacaoId: velha.id, medicacao: velha.nome, antes: textoGeralMedicacao(velha) });
    }
  }
  return mudancas;
}

/** "2026-10-01" (data do computador, não UTC). */
export function dataDaVersao(agora: Date): string {
  const d = (n: number) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}-${d(agora.getMonth() + 1)}-${d(agora.getDate())}`;
}

/** "01/10/2026". */
export function dataBrasileira(data: string): string {
  const [a, m, d] = data.split('-');
  return a && m && d ? `${d}/${m}/${a}` : data;
}

/**
 * Próxima versão do banco (usada pelo script `npm run nova-versao-banco`).
 * Devolve null quando o banco não mudou desde a última versão publicada.
 */
export function novaVersao(entrada: {
  historico: readonly VersaoBanco[];
  /** Banco da última versão (null = ainda não há versão). */
  publicado: readonly Medicacao[] | null;
  atual: readonly Medicacao[];
  descricao: string;
  agora: Date;
  conferencias?: readonly Validacao[];
}): VersaoBanco | null {
  const { historico, publicado, atual } = entrada;
  if (publicado && JSON.stringify(publicado) === JSON.stringify(atual)) return null;
  const ultima = historico[historico.length - 1];
  return {
    versao: (ultima?.versao ?? 0) + 1,
    data: dataDaVersao(entrada.agora),
    descricao: entrada.descricao.trim(),
    codigo: impressaoDigital(atual),
    resumo: resumoDaVersao(atual),
    mudancas: compararBancos(publicado ?? [], atual, entrada.conferencias ?? []),
  };
}

// ---------- o banco que está em uso neste computador ----------

export interface BancoEmUso {
  /** Versão do projeto em que o banco em uso se baseia. */
  versao: VersaoBanco;
  /** Impressão digital do banco em uso. */
  codigo: string;
  /** O banco em uso tem mudanças deste computador (conferências, apresentações importadas) fora do projeto? */
  local: boolean;
  /** "versão 2 de 01/10/2026" ou "versão 2 + mudanças deste computador (código 1a2b3c4d)". */
  texto: string;
}

/** Com qual versão do banco o app está trabalhando (aba Banco, relatório do caso, relatar problema). */
export function descreverBancoEmUso(banco: readonly Medicacao[], historico: readonly VersaoBanco[] = HISTORICO_BANCO): BancoEmUso {
  const codigo = impressaoDigital(banco);
  const ultima = historico[historico.length - 1] ?? VERSAO_ATUAL;
  const igual = [...historico].reverse().find((v) => v.codigo === codigo);
  if (igual) return { versao: igual, codigo, local: false, texto: `versão ${igual.versao} de ${dataBrasileira(igual.data)}` };
  return { versao: ultima, codigo, local: true, texto: `versão ${ultima.versao} + mudanças deste computador (código ${codigo})` };
}
