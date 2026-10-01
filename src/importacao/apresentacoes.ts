/**
 * Importa a planilha de apresentações (docs/fase-0/apresentacoes-formulario.xlsx, aba "Apresentações")
 * para o formato do banco. Entende o texto como o usuário escreve ("500 mg", "19,1%", "40 mg/mL",
 * "250 mg/5 mL", "100 mcg/jato", "1:1.000") e aponta o que não conseguiu ler.
 *
 * Segurança: a apresentação só fica CONFERIDA se a coluna "Onde conferi (fonte)" estiver preenchida.
 */

import type { Apresentacao, Medicacao, UnidadeDroga, Via } from '../dados/medicacoes/tipos';
import type { Aba } from './xlsx';

/** Nº da planilha → id da medicação no banco. */
const POR_NUMERO: Record<string, string> = {
  '1': 'sf09',
  '2': 'sg5',
  '3': 'sg10',
  '4': 'g25',
  '5': 'g50',
  '6': 'gluconato-calcio',
  '7': 'kcl',
  '8': 'nacl20',
  '9': 'ceftriaxona',
  '10': 'ampicilina',
  '11': 'gentamicina',
  '12': 'vancomicina',
  '13': 'penicilina-cristalina',
  '14': 'penicilina-procaina',
  '15': 'penicilina-benzatina',
  '16': 'sulfadiazina',
  '17': 'pirimetamina',
  '18': 'acido-folinico',
  '19': 'zidovudina',
  '20': 'lamivudina',
  '21': 'raltegravir',
  '22': 'dolutegravir',
  '23': 'dipirona',
  '24': 'salbutamol',
  '25': 'fenoterol',
  '26': 'ipratropio',
  '27': 'salmeterol',
  '28': 'hidrocortisona',
  '29': 'prednisona',
  '30': 'prednisolona',
  '31': 'dexametasona',
  '32': 'cortisona',
  '32b': 'metilprednisolona',
  '33': 'adrenalina',
  '34': 'amiodarona',
  '35': 'adenosina',
  '36': 'flumazenil',
  '37': 'glucagon',
  '38': 'insulina-regular',
};

const FORMAS: [RegExp, Apresentacao['forma']][] = [
  [/^ampola|^flaconete/i, 'ampola'],
  [/frasco-ampola.*p[óo]/i, 'frasco-ampola-po'],
  [/frasco-ampola/i, 'frasco-ampola-solucao'],
  [/bolsa|frasco de soro/i, 'bolsa-soro'],
  [/comprimido|c[áa]psula/i, 'comprimido'],
  [/solu[çc][ãa]o para nebuliza/i, 'nebulizacao'],
  [/solu[çc][ãa]o oral|xarope|elixir|suspens[ãa]o/i, 'solucao-oral'],
  [/gotas/i, 'gotas'],
  [/spray|aerossol|p[óo] inalat/i, 'spray'],
];

const VIAS: [RegExp, Via][] = [
  [/^(ev|iv|endovenos[ao]|intravenos[ao])$/i, 'EV'],
  [/^(im|intramuscular)$/i, 'IM'],
  [/^(sc|subcut[âa]ne[ao])$/i, 'SC'],
  [/^(vo|oral)$/i, 'VO'],
  [/^(io|intra[óo]sse[ao])$/i, 'IO'],
  [/^(inal|inalat[óo]ria|nebuliza[çc][ãa]o)$/i, 'inalatoria'],
  [/^(et|endotraqueal|traqueal)$/i, 'endotraqueal'],
  [/^(retal|vr)$/i, 'retal'],
];

const UNIDADES: Record<string, UnidadeDroga> = { g: 'g', mg: 'mg', mcg: 'mcg', 'µg': 'mcg', ug: 'mcg', ui: 'UI', u: 'UI', meq: 'mEq', ml: 'mL' };

/** Número escrito em português: "5.000.000" (milhar), "0,45", "1.000,5", "0.5". */
export function lerNumeroPlanilha(texto: string): number | null {
  const t = texto.trim().replace(/\s/g, '');
  if (!t) return null;
  let normal: string;
  if (t.includes(',')) normal = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) normal = t.replace(/\./g, '');
  else normal = t;
  const v = Number(normal);
  return Number.isFinite(v) ? v : null;
}

/** "500 mg" → { 500, 'mg' }; "5.000.000 UI" → { 5000000, 'UI' }. */
export function lerQuantidade(texto: string): { valor: number; unidade: UnidadeDroga } | null {
  const m = /([\d.,]+)\s*(g|mg|mcg|µg|ug|UI|U|mEq|mL)\b/i.exec(texto);
  if (!m) return null;
  const valor = lerNumeroPlanilha(m[1] ?? '');
  const unidade = UNIDADES[(m[2] ?? '').toLowerCase()];
  return valor !== null && unidade ? { valor, unidade } : null;
}

/** Peso molecular para converter % de sal em mEq/mL (1 mEq por molécula). */
const PESO_MOLECULAR: Record<string, number> = { kcl: 74.55, nacl20: 58.44, nacl3: 58.44, sf09: 58.44 };

export type Concentracao =
  | { tipo: 'porMl'; valor: number; unidade: UnidadeDroga }
  | { tipo: 'porJato'; valor: number; unidade: UnidadeDroga };

/**
 * Concentração do rótulo: "40 mg/mL", "250 mg/5 mL", "100 mcg/jato", "1:1.000", "19,1%".
 * Porcentagem: glicose em mg/mL (× 10); sais (KCl, NaCl) em mEq/mL pelo peso molecular.
 */
export function lerConcentracao(texto: string, medicacaoId?: string): Concentracao | null {
  const fracao = /([\d.,]+)\s*(g|mg|mcg|µg|ug|UI|U|mEq)\s*\/\s*([\d.,]*)\s*(mL|ml|jato|dose)\b/i.exec(texto);
  if (fracao) {
    const valor = lerNumeroPlanilha(fracao[1] ?? '');
    const divisor = fracao[3] ? lerNumeroPlanilha(fracao[3]) : 1;
    const unidade = UNIDADES[(fracao[2] ?? '').toLowerCase()];
    if (valor === null || !divisor || !unidade) return null;
    const porJato = /jato|dose/i.test(fracao[4] ?? '');
    return { tipo: porJato ? 'porJato' : 'porMl', valor: valor / divisor, unidade };
  }
  const razao = /1\s*:\s*([\d.]+)/.exec(texto);
  if (razao) {
    const d = lerNumeroPlanilha(razao[1] ?? '');
    // 1:1.000 = 1 g em 1000 mL = 1 mg/mL
    if (d) return { tipo: 'porMl', valor: 1000 / d, unidade: 'mg' };
  }
  const pct = /([\d.,]+)\s*%/.exec(texto);
  if (pct) {
    const p = lerNumeroPlanilha(pct[1] ?? '');
    if (p === null) return null;
    const pm = medicacaoId ? PESO_MOLECULAR[medicacaoId] : undefined;
    if (pm) return { tipo: 'porMl', valor: Math.round(((p * 10) / pm) * 1000) / 1000, unidade: 'mEq' };
    return { tipo: 'porMl', valor: p * 10, unidade: 'mg' };
  }
  return null;
}

export interface LinhaImportada {
  /** Número da linha na planilha (como o Excel mostra). */
  linha: number;
  medicacao: string;
  medicacaoId?: string;
  apresentacao?: Apresentacao;
  avisos: string[];
  /** Motivo de a linha não entrar (vazia, exemplo, não tem no hospital). */
  ignorada?: string;
}

export interface ResultadoImportacao {
  linhas: LinhaImportada[];
  /** Apresentações por medicação (só as linhas que entraram). */
  porMedicacao: Map<string, Apresentacao[]>;
}

function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function idDaMedicacao(numero: string, nome: string, rotulo: string, banco: readonly Medicacao[]): string | undefined {
  const pelo = POR_NUMERO[numero.trim()];
  if (pelo === 'nacl20' && /\b3\s*%/.test(rotulo)) return 'nacl3';
  if (pelo) return pelo;
  const n = normalizar(nome);
  return banco.find((m) => normalizar(m.nome).startsWith(n) || n.startsWith(normalizar(m.nome)))?.id;
}

const COLUNAS = {
  numero: 'nº',
  medicacao: 'medicação',
  temNoHospital: 'tem no hospital',
  nomeComercial: 'nome comercial',
  forma: 'forma',
  vias: 'via',
  conteudo: 'conteúdo total',
  volume: 'volume da unidade',
  concentracao: 'concentração como está no rótulo',
  reconstituir: 'precisa reconstituir',
  reconstituicao: 'reconstituição: diluente',
  concentracaoReconstituida: 'concentração após reconstituir',
  rotina: 'rotina de diluição',
  diluente: 'diluente usado',
  bic: 'seringa da bic',
  fonte: 'onde conferi',
  data: 'data da conferência',
  observacoes: 'observações',
} as const;

/** Lê a aba "Apresentações" (ou a primeira aba com cabeçalho "Nº" + "Medicação"). */
export function importarApresentacoes(abas: readonly Aba[], banco: readonly Medicacao[], hospital = 'Santa Casa'): ResultadoImportacao {
  const aba = abas.find((a) => normalizar(a.nome) === 'apresentacoes') ?? abas.find((a) => a.linhas.some((l) => l[0] === 'Nº'));
  if (!aba) throw new Error('Não achei a aba "Apresentações" na planilha.');
  const iCabecalho = aba.linhas.findIndex((l) => l.some((c) => c.toLowerCase() === 'nº') && l.some((c) => c.toLowerCase() === 'medicação'));
  if (iCabecalho < 0) throw new Error('Não achei o cabeçalho (Nº, Medicação...) na aba "Apresentações".');
  const cabecalho = aba.linhas[iCabecalho]!.map((c) => c.toLowerCase());
  const col = Object.fromEntries(
    Object.entries(COLUNAS).map(([chave, texto]) => [chave, cabecalho.findIndex((c) => c.startsWith(texto))]),
  ) as Record<keyof typeof COLUNAS, number>;

  const linhas: LinhaImportada[] = [];
  const porMedicacao = new Map<string, Apresentacao[]>();
  for (let i = iCabecalho + 1; i < aba.linhas.length; i++) {
    const l = aba.linhas[i] ?? [];
    const pegar = (k: keyof typeof COLUNAS) => (col[k] >= 0 ? (l[col[k]] ?? '').trim() : '');
    const numero = pegar('numero');
    const medicacao = pegar('medicacao');
    if (!numero && !medicacao) continue;
    const registro: LinhaImportada = { linha: i + 1, medicacao, avisos: [] };
    linhas.push(registro);

    if (numero.toUpperCase() === 'EX') {
      registro.ignorada = 'linha de exemplo';
      continue;
    }
    const forma = pegar('forma');
    const conteudo = pegar('conteudo');
    const rotulo = pegar('concentracao');
    if (!forma && !conteudo && !rotulo) {
      registro.ignorada = 'ainda não preenchida';
      continue;
    }
    if (/^n[ãa]o/i.test(pegar('temNoHospital'))) {
      registro.ignorada = 'não tem no hospital';
      continue;
    }

    const medicacaoId = idDaMedicacao(numero, medicacao, rotulo, banco);
    if (!medicacaoId) {
      registro.avisos.push(`Não achei "${medicacao}" no banco de medicações.`);
      continue;
    }
    registro.medicacaoId = medicacaoId;

    const formaBanco = FORMAS.find(([re]) => re.test(forma))?.[1] ?? 'outro';
    if (!forma) registro.avisos.push('Forma em branco: usei "outro".');
    else if (formaBanco === 'outro') registro.avisos.push(`Forma "${forma}" virou "outro".`);

    const vias = pegar('vias')
      .split(/[\/,;e]+|\s+/)
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => VIAS.find(([re]) => re.test(v))?.[1])
      .filter((v): v is Via => v !== undefined);
    if (vias.length === 0) registro.avisos.push('Via(s) em branco ou não reconhecida(s).');

    const quantidade = conteudo ? lerQuantidade(conteudo) : null;
    if (conteudo && !quantidade) registro.avisos.push(`Não entendi o conteúdo "${conteudo}".`);
    const volume = pegar('volume') ? lerNumeroPlanilha(pegar('volume')) : null;
    if (pegar('volume') && volume === null) registro.avisos.push(`Volume "${pegar('volume')}" não é um número.`);

    const concentracao = rotulo ? lerConcentracao(rotulo, medicacaoId) : null;
    // rótulo só com quantidade (ex.: pó "1 g", comprimido "500 mg") não é concentração por mL
    const quantidadeNoRotulo = rotulo && !concentracao ? lerQuantidade(rotulo) : null;
    if (rotulo && !concentracao && !quantidadeNoRotulo) registro.avisos.push(`Não entendi a concentração "${rotulo}".`);
    const precisaReconstituir = /^sim/i.test(pegar('reconstituir')) || formaBanco === 'frasco-ampola-po';

    const ap: Apresentacao = {
      id: `hosp-${i + 1}`,
      descricao: [forma || 'Apresentação', rotulo || conteudo, volume !== null ? `${String(volume).replace('.', ',')} mL` : '']
        .filter(Boolean)
        .join(' ')
        .trim(),
      forma: formaBanco,
      vias,
      status: 'A_VALIDAR',
    };
    if (concentracao?.tipo === 'porJato') {
      ap.quantidade = { valor: concentracao.valor, unidade: concentracao.unidade };
    } else {
      if (quantidade) ap.quantidade = quantidade;
      else if (quantidadeNoRotulo) ap.quantidade = quantidadeNoRotulo;
      // pó: a concentração do rótulo é a quantidade do frasco; o aluno reconstitui
      if (concentracao && !precisaReconstituir) ap.concentracaoPorMl = { valor: concentracao.valor, unidade: concentracao.unidade };
      if (!ap.quantidade && concentracao && precisaReconstituir) ap.quantidade = { valor: concentracao.valor, unidade: concentracao.unidade };
      if (!ap.quantidade && concentracao && volume !== null) {
        ap.quantidade = { valor: concentracao.valor * volume, unidade: concentracao.unidade };
      }
    }
    if (volume !== null && !precisaReconstituir) ap.volumeMl = volume;
    const gotas = /(\d+)\s*gotas?\s*(?:\/|=|por|em)\s*(?:1\s*)?mL/i.exec(`${rotulo} ${pegar('observacoes')}`);
    if (gotas) ap.gotasPorMl = Number(gotas[1]);
    else if (formaBanco === 'gotas') registro.avisos.push('Gotas: anote quantas gotas tem 1 mL (ex.: "20 gotas = 1 mL") em Observações.');

    const notas = [
      pegar('nomeComercial') && `Nome comercial: ${pegar('nomeComercial')}`,
      precisaReconstituir && pegar('reconstituicao') && `Reconstituição: ${pegar('reconstituicao')}`,
      pegar('concentracaoReconstituida') && `Após reconstituir: ${pegar('concentracaoReconstituida')}`,
      pegar('rotina') && `Diluição no hospital: ${pegar('rotina')}`,
      pegar('diluente') && `Diluente: ${pegar('diluente')}`,
      pegar('bic') && `Seringa da BIC de 12 mL: ${pegar('bic')}`,
      pegar('observacoes'),
    ].filter(Boolean);
    if (notas.length > 0) ap.observacao = notas.join(' · ');

    const fonte = pegar('fonte');
    if (fonte) {
      ap.status = 'CONFERIDO';
      ap.fonte = { codigo: /bula/i.test(fonte) ? 'BULA' : 'HOSPITAL', documento: `${fonte} (${hospital})`, ...(pegar('data') && { pagina: `conferido em ${pegar('data')}` }) };
    } else {
      registro.avisos.push('Sem "Onde conferi": fica A VALIDAR.');
    }
    registro.apresentacao = ap;
    porMedicacao.set(medicacaoId, [...(porMedicacao.get(medicacaoId) ?? []), ap]);
  }
  return { linhas, porMedicacao };
}

/** Troca as apresentações do banco pelas do hospital (só nas medicações que vieram na planilha). */
export function aplicarApresentacoes(banco: readonly Medicacao[], porMedicacao: ReadonlyMap<string, Apresentacao[]>): Medicacao[] {
  return banco.map((m) => {
    const novas = porMedicacao.get(m.id);
    return novas && novas.length > 0 ? { ...m, apresentacoes: novas } : m;
  });
}
