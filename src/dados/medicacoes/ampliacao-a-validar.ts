/**
 * ⚠️ TUDO "A VALIDAR". Ampliação do banco (B8): as medicações A1–A50 de docs/fase-0/medicacoes-ampliacao.md
 * (lista aprovada pelo usuário). A A26 (amoxicilina) já estava no banco (exemplos-a-validar.ts).
 *
 * - Nome, código, seção, classe e usos: da lista aprovada.
 * - Apresentações: rascunho do assistente, de memória (as mais comuns no Brasil), SEM consulta à bula.
 *   Conferir com a bula e com a Santa Casa (planilha gerada pela aba Banco).
 * - Doses: NENHUMA. Cada indicação da lista vira uma regra com a dose em texto "ainda não cadastrada";
 *   o usuário preenche no botão Conferir da aba Banco (com documento e página) ou manda na conversa.
 *   Regra em texto nunca corrige o aluno.
 * - Fonte: código da fonte PROVÁVEL (nada conferido).
 * - Seção da folha: provisória quando a lista agrupa diferente da folha (ver docs/a-validar-dados-novos.md).
 */

import type { Apresentacao, CodigoFonte, FaixaEtaria, Medicacao, RegraDeDose, Via } from './tipos';

const AV = 'A_VALIDAR' as const;
const TODAS: FaixaEtaria[] = ['RN', 'crianca', 'adolescente'];
const RN: FaixaEtaria[] = ['RN'];

/** Texto da dose enquanto não houver valor com fonte. */
export const DOSE_A_CADASTRAR =
  'Dose ainda não cadastrada (A VALIDAR): preencher com a fonte — documento e página — no botão Conferir da aba Banco.';

function ap(id: string, descricao: string, forma: Apresentacao['forma'], vias: Via[], extra: Partial<Apresentacao> = {}): Apresentacao {
  return { id, descricao, forma, vias, status: AV, ...extra };
}

/** Indicação da lista aprovada: texto, ou [texto, vias, faixas, observação]. */
type Indicacao = string | [string, Via[]?, FaixaEtaria[]?, string?];

function idDe(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
    .replace(/-$/, '');
}

interface DadosMedicacao extends Omit<Medicacao, 'regras' | 'secao'> {
  secao: Medicacao['secao'];
  /** Fonte provável das doses. */
  fonte: CodigoFonte;
  /** Faixas das regras (padrão: todas). */
  faixas?: FaixaEtaria[];
  indicacoes: Indicacao[];
}

function med({ fonte, faixas = TODAS, indicacoes, ...m }: DadosMedicacao): Medicacao {
  const viasDasApresentacoes = [...new Set(m.apresentacoes.flatMap((a) => a.vias))];
  const regras: RegraDeDose[] = indicacoes.map((i) => {
    const [indicacao, vias, faixasDaRegra, observacoes]: Exclude<Indicacao, string> = typeof i === 'string' ? [i] : i;
    return {
      id: idDe(indicacao),
      indicacao,
      faixas: faixasDaRegra ?? faixas,
      vias: vias ?? viasDasApresentacoes,
      dose: { tipo: 'texto', descricao: DOSE_A_CADASTRAR },
      fonte: { codigo: fonte },
      status: AV,
      ...(observacoes && { observacoes }),
    };
  });
  return { ...m, regras };
}

const mgMl = (valor: number) => ({ concentracaoPorMl: { valor, unidade: 'mg' as const } });
const mcgMl = (valor: number) => ({ concentracaoPorMl: { valor, unidade: 'mcg' as const } });
const mg = (valor: number) => ({ quantidade: { valor, unidade: 'mg' as const } });
const g = (valor: number) => ({ quantidade: { valor, unidade: 'g' as const } });
const mcg = (valor: number) => ({ quantidade: { valor, unidade: 'mcg' as const } });
const GOTAS = 'Quantas gotas tem 1 mL: conferir na bula (A VALIDAR).';

// ============================================================
// A. Sedação, analgesia e anticonvulsivantes
// ============================================================

export const midazolam = med({
  id: 'midazolam',
  codigo: 'A1',
  nome: 'Midazolam',
  secao: 6,
  classe: 'Benzodiazepínico',
  usos: 'Crise convulsiva (IM, intranasal, EV), sedação, intubação',
  classes: ['benzodiazepinicos'],
  receituario: 'controle-especial',
  fonte: 'SBP',
  apresentacoes: [
    ap('amp-5mg-3ml', 'Ampola 5 mg/mL, 3 mL (15 mg)', 'ampola', ['EV', 'IM', 'intranasal'], { ...mgMl(5), volumeMl: 3, ...mg(15) }),
    ap('amp-5mg-10ml', 'Ampola 5 mg/mL, 10 mL (50 mg)', 'ampola', ['EV', 'IM'], { ...mgMl(5), volumeMl: 10, ...mg(50) }),
    ap('amp-1mg-5ml', 'Ampola 1 mg/mL, 5 mL (5 mg)', 'ampola', ['EV', 'IM'], { ...mgMl(1), volumeMl: 5, ...mg(5) }),
    ap('sol-oral-2mg', 'Solução oral 2 mg/mL', 'solucao-oral', ['VO'], mgMl(2)),
  ],
  indicacoes: [['Crise convulsiva', ['IM', 'intranasal', 'EV']], ['Sedação', ['EV', 'VO', 'intranasal']], ['Intubação', ['EV']]],
});

export const diazepam = med({
  id: 'diazepam',
  codigo: 'A2',
  nome: 'Diazepam',
  secao: 6,
  classe: 'Benzodiazepínico',
  usos: 'Crise convulsiva (EV, retal)',
  classes: ['benzodiazepinicos'],
  receituario: 'controle-especial',
  fonte: 'SBP',
  apresentacoes: [
    ap('amp-5mg-2ml', 'Ampola 5 mg/mL, 2 mL (10 mg)', 'ampola', ['EV', 'retal'], { ...mgMl(5), volumeMl: 2, ...mg(10) }),
    ap('comp-5mg', 'Comprimido 5 mg', 'comprimido', ['VO'], mg(5)),
    ap('comp-10mg', 'Comprimido 10 mg', 'comprimido', ['VO'], mg(10)),
  ],
  indicacoes: [['Crise convulsiva', ['EV', 'retal']]],
});

export const fenobarbital = med({
  id: 'fenobarbital',
  codigo: 'A3',
  nome: 'Fenobarbital',
  secao: 6,
  classe: 'Barbitúrico',
  usos: 'Convulsão neonatal (1ª escolha), estado de mal',
  classes: ['barbituricos', 'anticonvulsivantes'],
  receituario: 'controle-especial',
  fonte: 'SBP',
  apresentacoes: [
    ap('amp-100mg-2ml', 'Ampola 100 mg/mL, 2 mL (200 mg)', 'ampola', ['EV', 'IM'], { ...mgMl(100), volumeMl: 2, ...mg(200) }),
    ap('gotas-40mg', 'Gotas 40 mg/mL', 'gotas', ['VO'], { ...mgMl(40), observacao: GOTAS }),
    ap('comp-100mg', 'Comprimido 100 mg', 'comprimido', ['VO'], mg(100)),
  ],
  indicacoes: [['Convulsão neonatal', ['EV'], RN], ['Estado de mal epiléptico', ['EV']]],
});

export const fenitoina = med({
  id: 'fenitoina',
  codigo: 'A4',
  nome: 'Fenitoína',
  secao: 6,
  classe: 'Anticonvulsivante',
  usos: 'Estado de mal epiléptico (2ª linha)',
  classes: ['anticonvulsivantes', 'hidantoinas'],
  receituario: 'controle-especial',
  fonte: 'SBP',
  apresentacoes: [
    ap('amp-50mg-5ml', 'Ampola 50 mg/mL, 5 mL (250 mg)', 'ampola', ['EV'], { ...mgMl(50), volumeMl: 5, ...mg(250) }),
    ap('comp-100mg', 'Comprimido 100 mg', 'comprimido', ['VO'], mg(100)),
  ],
  indicacoes: [['Estado de mal epiléptico (2ª linha)', ['EV']]],
});

export const levetiracetam = med({
  id: 'levetiracetam',
  codigo: 'A5',
  nome: 'Levetiracetam',
  secao: 6,
  classe: 'Anticonvulsivante',
  usos: 'Estado de mal epiléptico (2ª linha)',
  classes: ['anticonvulsivantes'],
  receituario: 'controle-especial',
  fonte: 'SBP',
  apresentacoes: [
    ap('fa-100mg-5ml', 'Frasco-ampola 100 mg/mL, 5 mL (500 mg)', 'frasco-ampola-solucao', ['EV'], { ...mgMl(100), volumeMl: 5, ...mg(500) }),
    ap('sol-oral-100mg', 'Solução oral 100 mg/mL', 'solucao-oral', ['VO'], mgMl(100)),
    ap('comp-500mg', 'Comprimido 500 mg', 'comprimido', ['VO'], mg(500)),
  ],
  indicacoes: [['Estado de mal epiléptico (2ª linha)', ['EV']]],
});

export const cetamina = med({
  id: 'cetamina',
  codigo: 'A6',
  nome: 'Cetamina',
  secao: 6,
  classe: 'Anestésico dissociativo',
  usos: 'Sedação para procedimentos, intubação na asma e no choque',
  classes: ['anestesicos'],
  receituario: 'controle-especial',
  fonte: 'PALS',
  apresentacoes: [
    ap('fa-50mg-10ml', 'Frasco-ampola 50 mg/mL, 10 mL (500 mg)', 'frasco-ampola-solucao', ['EV', 'IM'], {
      ...mgMl(50),
      volumeMl: 10,
      ...mg(500),
      observacao: 'Cetamina racêmica ou escetamina: conferir qual o hospital usa (A VALIDAR).',
    }),
  ],
  indicacoes: [['Sedação para procedimentos', ['EV', 'IM']], ['Intubação (asma, choque)', ['EV']]],
});

export const fentanil = med({
  id: 'fentanil',
  codigo: 'A7',
  nome: 'Fentanil',
  secao: 6,
  classe: 'Opioide',
  usos: 'Analgesia, sedação, intubação',
  classes: ['opioides'],
  receituario: 'controle-especial',
  fonte: 'SBP',
  apresentacoes: [
    ap('amp-50mcg-2ml', 'Ampola 50 mcg/mL, 2 mL (100 mcg)', 'ampola', ['EV'], { ...mcgMl(50), volumeMl: 2, ...mcg(100) }),
    ap('fa-50mcg-10ml', 'Frasco-ampola 50 mcg/mL, 10 mL (500 mcg)', 'frasco-ampola-solucao', ['EV'], { ...mcgMl(50), volumeMl: 10, ...mcg(500) }),
  ],
  indicacoes: [['Analgesia', ['EV']], ['Sedação', ['EV']], ['Intubação', ['EV']]],
});

export const morfina = med({
  id: 'morfina',
  codigo: 'A8',
  nome: 'Morfina',
  secao: 6,
  classe: 'Opioide',
  usos: 'Dor intensa (queimados, fraturas, crise falciforme)',
  classes: ['opioides'],
  receituario: 'controle-especial',
  fonte: 'SBP',
  apresentacoes: [
    ap('amp-10mg-1ml', 'Ampola 10 mg/mL, 1 mL (10 mg)', 'ampola', ['EV', 'IM', 'SC'], { ...mgMl(10), volumeMl: 1, ...mg(10) }),
    ap('amp-1mg-2ml', 'Ampola 1 mg/mL, 2 mL (2 mg)', 'ampola', ['EV', 'IM', 'SC'], { ...mgMl(1), volumeMl: 2, ...mg(2) }),
    ap('sol-oral-10mg', 'Solução oral 10 mg/mL', 'solucao-oral', ['VO'], mgMl(10)),
  ],
  indicacoes: [['Dor intensa', ['EV', 'SC', 'VO']]],
});

export const paracetamol = med({
  id: 'paracetamol',
  codigo: 'A9',
  nome: 'Paracetamol',
  secao: 6,
  classe: 'Analgésico / antitérmico',
  usos: 'Febre, dor (VO, retal; EV conforme disponibilidade)',
  classes: ['analgesicos'],
  fonte: 'SBP',
  apresentacoes: [
    ap('gotas-200mg', 'Gotas 200 mg/mL', 'gotas', ['VO'], { ...mgMl(200), observacao: GOTAS }),
    ap('sol-oral-32mg', 'Solução oral 160 mg/5 mL (32 mg/mL)', 'solucao-oral', ['VO'], mgMl(32)),
    ap('comp-500mg', 'Comprimido 500 mg', 'comprimido', ['VO'], mg(500)),
    ap('comp-750mg', 'Comprimido 750 mg', 'comprimido', ['VO'], mg(750)),
    ap('bolsa-10mg-100ml', 'Bolsa 10 mg/mL, 100 mL (1 g)', 'bolsa-soro', ['EV'], {
      ...mgMl(10),
      volumeMl: 100,
      ...g(1),
      observacao: 'Paracetamol EV: verificar disponibilidade no hospital (A VALIDAR).',
    }),
  ],
  indicacoes: [['Febre', ['VO', 'EV']], ['Dor', ['VO', 'EV']]],
});

export const ibuprofeno = med({
  id: 'ibuprofeno',
  codigo: 'A10',
  nome: 'Ibuprofeno',
  secao: 6,
  classe: 'Anti-inflamatório (AINE)',
  usos: 'Febre, dor',
  classes: ['aines', 'analgesicos'],
  fonte: 'SBP',
  apresentacoes: [
    ap('gotas-50mg', 'Gotas 50 mg/mL', 'gotas', ['VO'], { ...mgMl(50), observacao: GOTAS }),
    ap('gotas-100mg', 'Gotas 100 mg/mL', 'gotas', ['VO'], { ...mgMl(100), observacao: GOTAS }),
    ap('comp-400mg', 'Comprimido 400 mg', 'comprimido', ['VO'], mg(400)),
    ap('comp-600mg', 'Comprimido 600 mg', 'comprimido', ['VO'], mg(600)),
  ],
  indicacoes: [['Febre', ['VO']], ['Dor', ['VO']]],
});

// ============================================================
// B. Antídotos e intoxicações
// ============================================================

export const naloxona = med({
  id: 'naloxona',
  codigo: 'A11',
  nome: 'Naloxona',
  secao: 6,
  classe: 'Antagonista opioide',
  usos: 'Intoxicação por opioide, depressão respiratória',
  classes: ['antidotos'],
  fonte: 'PALS',
  apresentacoes: [ap('amp-0-4mg-1ml', 'Ampola 0,4 mg/mL, 1 mL (0,4 mg)', 'ampola', ['EV', 'IM', 'SC', 'IO'], { ...mgMl(0.4), volumeMl: 1, ...mg(0.4) })],
  indicacoes: [['Intoxicação por opioide', ['EV', 'IM', 'IO']], ['Depressão respiratória por opioide', ['EV', 'IM', 'IO']]],
});

export const carvaoAtivado = med({
  id: 'carvao-ativado',
  codigo: 'A12',
  nome: 'Carvão ativado',
  secao: 6,
  classe: 'Adsorvente',
  usos: 'Descontaminação digestiva em intoxicações',
  classes: ['antidotos'],
  fonte: 'SBP',
  apresentacoes: [ap('po-oral', 'Pó para suspensão oral (embalagem do hospital: conferir)', 'outro', ['VO'])],
  indicacoes: [['Descontaminação digestiva em intoxicações', ['VO']]],
});

export const acetilcisteina = med({
  id: 'acetilcisteina',
  codigo: 'A13',
  nome: 'N-acetilcisteína',
  secao: 6,
  classe: 'Antídoto',
  usos: 'Intoxicação por paracetamol',
  classes: ['antidotos'],
  fonte: 'SBP',
  apresentacoes: [
    ap('amp-100mg-3ml', 'Ampola 100 mg/mL, 3 mL (300 mg)', 'ampola', ['EV'], { ...mgMl(100), volumeMl: 3, ...mg(300) }),
    ap('envelope-600mg', 'Granulado (envelope) 600 mg', 'outro', ['VO'], mg(600)),
  ],
  indicacoes: [['Intoxicação por paracetamol', ['EV', 'VO']]],
});

// ============================================================
// C. Intubação (sequência rápida)
// ============================================================

export const atropina = med({
  id: 'atropina',
  codigo: 'A14',
  nome: 'Atropina',
  secao: 6,
  classe: 'Anticolinérgico',
  usos: 'Bradicardia, pré-intubação, intoxicação por organofosforado',
  classes: ['anticolinergicos'],
  fonte: 'PALS',
  apresentacoes: [
    ap('amp-0-25mg-1ml', 'Ampola 0,25 mg/mL, 1 mL (0,25 mg)', 'ampola', ['EV', 'IM', 'SC', 'IO', 'endotraqueal'], { ...mgMl(0.25), volumeMl: 1, ...mg(0.25) }),
    ap('amp-0-5mg-1ml', 'Ampola 0,5 mg/mL, 1 mL (0,5 mg)', 'ampola', ['EV', 'IM', 'SC', 'IO', 'endotraqueal'], { ...mgMl(0.5), volumeMl: 1, ...mg(0.5) }),
  ],
  indicacoes: [['Bradicardia', ['EV', 'IO']], ['Pré-intubação', ['EV', 'IO']], ['Intoxicação por organofosforado', ['EV']]],
});

export const rocuronio = med({
  id: 'rocuronio',
  codigo: 'A15',
  nome: 'Rocurônio',
  secao: 6,
  classe: 'Bloqueador neuromuscular',
  usos: 'Intubação em sequência rápida',
  classes: ['bloqueadores-neuromusculares'],
  fonte: 'PALS',
  apresentacoes: [ap('fa-10mg-5ml', 'Frasco-ampola 10 mg/mL, 5 mL (50 mg)', 'frasco-ampola-solucao', ['EV', 'IO'], { ...mgMl(10), volumeMl: 5, ...mg(50) })],
  indicacoes: [['Intubação em sequência rápida', ['EV', 'IO']]],
});

export const succinilcolina = med({
  id: 'succinilcolina',
  codigo: 'A16',
  nome: 'Succinilcolina (suxametônio)',
  secao: 6,
  classe: 'Bloqueador neuromuscular',
  usos: 'Intubação em sequência rápida',
  classes: ['bloqueadores-neuromusculares'],
  fonte: 'PALS',
  apresentacoes: [
    ap('fa-po-100mg', 'Frasco-ampola (pó) 100 mg', 'frasco-ampola-po', ['EV', 'IM', 'IO'], mg(100)),
    ap('fa-po-500mg', 'Frasco-ampola (pó) 500 mg', 'frasco-ampola-po', ['EV', 'IM', 'IO'], mg(500)),
  ],
  indicacoes: [['Intubação em sequência rápida', ['EV', 'IO', 'IM']]],
});

// ============================================================
// D. Cardiovascular e choque
// ============================================================

export const noradrenalina = med({
  id: 'noradrenalina',
  codigo: 'A17',
  nome: 'Noradrenalina',
  secao: 6,
  classe: 'Vasopressor',
  usos: 'Choque "quente" (vasodilatado)',
  classes: ['catecolaminas'],
  fonte: 'SSC',
  apresentacoes: [
    ap('amp-4ml', 'Ampola 4 mL (hemitartarato 2 mg/mL = 1 mg/mL de noradrenalina base)', 'ampola', ['EV'], {
      ...mgMl(1),
      volumeMl: 4,
      ...mg(4),
      observacao: 'Sal × base: conferir no rótulo se a concentração é do sal ou da base (A VALIDAR).',
    }),
  ],
  indicacoes: [['Choque quente (vasodilatado)', ['EV']]],
});

export const dobutamina = med({
  id: 'dobutamina',
  codigo: 'A18',
  nome: 'Dobutamina',
  secao: 6,
  classe: 'Inotrópico',
  usos: 'Disfunção miocárdica, choque cardiogênico',
  classes: ['catecolaminas'],
  fonte: 'SSC',
  apresentacoes: [ap('amp-12-5mg-20ml', 'Ampola 12,5 mg/mL, 20 mL (250 mg)', 'ampola', ['EV'], { ...mgMl(12.5), volumeMl: 20, ...mg(250) })],
  indicacoes: [['Disfunção miocárdica', ['EV']], ['Choque cardiogênico', ['EV']]],
});

export const milrinona = med({
  id: 'milrinona',
  codigo: 'A19',
  nome: 'Milrinona',
  secao: 6,
  classe: 'Inodilatador',
  usos: 'Choque "frio" com resistência alta, pós-operatório cardíaco',
  classes: ['inodilatadores'],
  fonte: 'SSC',
  apresentacoes: [ap('fa-1mg-20ml', 'Frasco-ampola 1 mg/mL, 20 mL (20 mg)', 'frasco-ampola-solucao', ['EV'], { ...mgMl(1), volumeMl: 20, ...mg(20) })],
  indicacoes: [['Choque frio com resistência alta', ['EV']], ['Pós-operatório cardíaco', ['EV']]],
});

export const alprostadil = med({
  id: 'alprostadil',
  codigo: 'A20',
  nome: 'Alprostadil (prostaglandina E1)',
  secao: 6,
  classe: 'Prostaglandina',
  usos: 'Cardiopatia congênita canal-dependente no RN',
  classes: ['prostaglandinas'],
  fonte: 'SBP',
  faixas: RN,
  apresentacoes: [
    ap('amp-500mcg-1ml', 'Ampola 500 mcg/mL, 1 mL (500 mcg)', 'ampola', ['EV'], {
      ...mcgMl(500),
      volumeMl: 1,
      ...mcg(500),
      observacao: 'Verificar a apresentação disponível no Brasil e no hospital (A VALIDAR).',
    }),
  ],
  indicacoes: [['Cardiopatia congênita canal-dependente', ['EV']]],
});

// ============================================================
// E. Eletrólitos, rim e neuro
// ============================================================

export const bicarbonatoSodio = med({
  id: 'bicarbonato-sodio',
  codigo: 'A21',
  nome: 'Bicarbonato de sódio 8,4%',
  secao: 4,
  classe: 'Alcalinizante',
  usos: 'Hipercalemia, intoxicação por tricíclico; uso restrito na acidose',
  classes: ['alcalinizantes'],
  fonte: 'PALS',
  apresentacoes: [
    ap('amp-10ml', 'Ampola 8,4% (1 mEq/mL), 10 mL', 'ampola', ['EV', 'IO'], {
      concentracaoPorMl: { valor: 1, unidade: 'mEq' },
      volumeMl: 10,
      quantidade: { valor: 10, unidade: 'mEq' },
    }),
    ap('frasco-250ml', 'Frasco 8,4% (1 mEq/mL), 250 mL', 'bolsa-soro', ['EV'], {
      concentracaoPorMl: { valor: 1, unidade: 'mEq' },
      volumeMl: 250,
      quantidade: { valor: 250, unidade: 'mEq' },
    }),
  ],
  indicacoes: [['Hipercalemia', ['EV', 'IO']], ['Intoxicação por tricíclico', ['EV']], ['Acidose metabólica (uso restrito)', ['EV']]],
});

export const sulfatoMagnesio = med({
  id: 'sulfato-magnesio',
  codigo: 'A22',
  nome: 'Sulfato de magnésio',
  secao: 4,
  classe: 'Eletrólito',
  usos: 'Asma grave, hipomagnesemia, torsades de pointes',
  classes: ['magnesio'],
  fonte: 'GINA',
  apresentacoes: [
    ap('amp-50pct-10ml', 'Ampola 50% (500 mg/mL), 10 mL', 'ampola', ['EV', 'IM'], { ...mgMl(500), volumeMl: 10, ...g(5) }),
    ap('amp-10pct-10ml', 'Ampola 10% (100 mg/mL), 10 mL', 'ampola', ['EV'], { ...mgMl(100), volumeMl: 10, ...g(1) }),
  ],
  indicacoes: [['Asma grave', ['EV']], ['Hipomagnesemia', ['EV']], ['Torsades de pointes', ['EV']]],
});

export const furosemida = med({
  id: 'furosemida',
  codigo: 'A23',
  nome: 'Furosemida',
  secao: 6,
  classe: 'Diurético de alça',
  usos: 'Congestão, edema agudo de pulmão, sobrecarga hídrica',
  classes: ['diureticos'],
  fonte: 'SBP',
  apresentacoes: [
    ap('amp-10mg-2ml', 'Ampola 10 mg/mL, 2 mL (20 mg)', 'ampola', ['EV', 'IM'], { ...mgMl(10), volumeMl: 2, ...mg(20) }),
    ap('comp-40mg', 'Comprimido 40 mg', 'comprimido', ['VO'], mg(40)),
  ],
  indicacoes: [['Congestão / sobrecarga hídrica', ['EV', 'VO']], ['Edema agudo de pulmão', ['EV']]],
});

export const manitol = med({
  id: 'manitol',
  codigo: 'A24',
  nome: 'Manitol 20%',
  secao: 6,
  classe: 'Diurético osmótico',
  usos: 'Hipertensão intracraniana',
  classes: ['diureticos-osmoticos'],
  fonte: 'SBP',
  apresentacoes: [
    ap('frasco-250ml', 'Frasco 20% (200 mg/mL), 250 mL', 'bolsa-soro', ['EV'], { ...mgMl(200), volumeMl: 250, ...g(50) }),
  ],
  indicacoes: [['Hipertensão intracraniana', ['EV']]],
});

export const sro = med({
  id: 'sro',
  codigo: 'A25',
  nome: 'Sais de reidratação oral (SRO)',
  secao: 4,
  classe: 'Solução oral',
  usos: 'Desidratação (Planos A e B do MS)',
  classes: ['sro'],
  fonte: 'MS',
  faixas: ['crianca', 'adolescente'],
  apresentacoes: [ap('envelope', 'Envelope (pó para diluir em 1 litro de água; fórmula do MS)', 'outro', ['VO'])],
  indicacoes: [['Desidratação — Plano A', ['VO']], ['Desidratação — Plano B', ['VO']]],
});

// ============================================================
// F. Antibióticos (A26 amoxicilina já está em exemplos-a-validar.ts)
// ============================================================

export const amoxicilinaClavulanato = med({
  id: 'amoxicilina-clavulanato',
  codigo: 'A27',
  nome: 'Amoxicilina + clavulanato',
  secao: 5,
  classe: 'Penicilina + inibidor de betalactamase',
  usos: 'Mordedura, sinusite/otite com falha, celulite',
  classes: ['penicilinas', 'betalactamicos'],
  receituario: 'antimicrobiano',
  fonte: 'SBP',
  apresentacoes: [
    ap('susp-250mg-5ml', 'Suspensão oral 250 mg + 62,5 mg/5 mL (50 mg/mL de amoxicilina)', 'solucao-oral', ['VO'], mgMl(50)),
    ap('susp-400mg-5ml', 'Suspensão oral 400 mg + 57 mg/5 mL (80 mg/mL de amoxicilina)', 'solucao-oral', ['VO'], mgMl(80)),
    ap('comp-500mg', 'Comprimido 500 mg + 125 mg', 'comprimido', ['VO'], mg(500)),
    ap('comp-875mg', 'Comprimido 875 mg + 125 mg', 'comprimido', ['VO'], mg(875)),
    ap('fa-po-1g', 'Frasco-ampola (pó) 1 g + 200 mg', 'frasco-ampola-po', ['EV'], g(1)),
  ],
  indicacoes: [['Mordedura', ['VO', 'EV']], ['Sinusite / otite com falha', ['VO']], ['Celulite', ['VO', 'EV']]],
});

export const oxacilina = med({
  id: 'oxacilina',
  codigo: 'A28',
  nome: 'Oxacilina',
  secao: 5,
  classe: 'Penicilina antiestafilocócica',
  usos: 'Celulite grave, osteomielite, artrite séptica',
  classes: ['penicilinas', 'betalactamicos'],
  receituario: 'antimicrobiano',
  fonte: 'SBP',
  apresentacoes: [ap('fa-po-500mg', 'Frasco-ampola (pó) 500 mg', 'frasco-ampola-po', ['EV', 'IM'], mg(500))],
  indicacoes: [['Celulite grave', ['EV']], ['Osteomielite', ['EV']], ['Artrite séptica', ['EV']]],
});

export const cefotaxima = med({
  id: 'cefotaxima',
  codigo: 'A29',
  nome: 'Cefotaxima',
  secao: 5,
  classe: 'Cefalosporina 3ª geração',
  usos: 'Sepse/meningite neonatal (alternativa à ceftriaxona no RN); verificar disponibilidade no Brasil',
  classes: ['cefalosporinas', 'betalactamicos'],
  receituario: 'antimicrobiano',
  fonte: 'SBP',
  apresentacoes: [
    ap('fa-po-1g', 'Frasco-ampola (pó) 1 g', 'frasco-ampola-po', ['EV', 'IM'], {
      ...g(1),
      observacao: 'Verificar disponibilidade no Brasil e no hospital (A VALIDAR).',
    }),
  ],
  indicacoes: [['Sepse / meningite neonatal', ['EV'], RN]],
});

export const meropenem = med({
  id: 'meropenem',
  codigo: 'A30',
  nome: 'Meropeném',
  secao: 5,
  classe: 'Carbapenêmico',
  usos: 'Sepse hospitalar, germes multirresistentes',
  classes: ['carbapenemicos', 'betalactamicos'],
  receituario: 'antimicrobiano',
  fonte: 'SBP',
  apresentacoes: [
    ap('fa-po-500mg', 'Frasco-ampola (pó) 500 mg', 'frasco-ampola-po', ['EV'], mg(500)),
    ap('fa-po-1g', 'Frasco-ampola (pó) 1 g', 'frasco-ampola-po', ['EV'], g(1)),
  ],
  indicacoes: [['Sepse hospitalar / germes multirresistentes', ['EV']]],
});

export const azitromicina = med({
  id: 'azitromicina',
  codigo: 'A31',
  nome: 'Azitromicina',
  secao: 5,
  classe: 'Macrolídeo',
  usos: 'Coqueluche (tratamento e profilaxia), pneumonia atípica',
  classes: ['macrolideos'],
  receituario: 'antimicrobiano',
  fonte: 'SBP',
  apresentacoes: [
    ap('susp-200mg-5ml', 'Suspensão oral 200 mg/5 mL (40 mg/mL)', 'solucao-oral', ['VO'], mgMl(40)),
    ap('comp-500mg', 'Comprimido 500 mg', 'comprimido', ['VO'], mg(500)),
    ap('fa-po-500mg', 'Frasco-ampola (pó) 500 mg', 'frasco-ampola-po', ['EV'], mg(500)),
  ],
  indicacoes: [['Coqueluche — tratamento', ['VO']], ['Coqueluche — profilaxia', ['VO']], ['Pneumonia atípica', ['VO', 'EV']]],
});

export const clindamicina = med({
  id: 'clindamicina',
  codigo: 'A32',
  nome: 'Clindamicina',
  secao: 5,
  classe: 'Lincosamida',
  usos: 'Infecção de pele/partes moles, choque tóxico (junto com betalactâmico)',
  classes: ['lincosamidas'],
  receituario: 'antimicrobiano',
  fonte: 'SBP',
  apresentacoes: [
    ap('amp-150mg-2ml', 'Ampola 150 mg/mL, 2 mL (300 mg)', 'ampola', ['EV', 'IM'], { ...mgMl(150), volumeMl: 2, ...mg(300) }),
    ap('amp-150mg-4ml', 'Ampola 150 mg/mL, 4 mL (600 mg)', 'ampola', ['EV', 'IM'], { ...mgMl(150), volumeMl: 4, ...mg(600) }),
    ap('caps-300mg', 'Cápsula 300 mg', 'comprimido', ['VO'], mg(300)),
  ],
  indicacoes: [['Infecção de pele e partes moles', ['EV', 'VO']], ['Choque tóxico (junto com betalactâmico)', ['EV']]],
});

export const metronidazol = med({
  id: 'metronidazol',
  codigo: 'A33',
  nome: 'Metronidazol',
  secao: 5,
  classe: 'Nitroimidazol',
  usos: 'Infecção abdominal, enterocolite necrosante',
  classes: ['nitroimidazois'],
  receituario: 'antimicrobiano',
  fonte: 'SBP',
  apresentacoes: [
    ap('bolsa-5mg-100ml', 'Bolsa 5 mg/mL, 100 mL (500 mg)', 'bolsa-soro', ['EV'], { ...mgMl(5), volumeMl: 100, ...mg(500) }),
    ap('susp-40mg', 'Suspensão oral 40 mg/mL (benzoilmetronidazol)', 'solucao-oral', ['VO'], mgMl(40)),
    ap('comp-250mg', 'Comprimido 250 mg', 'comprimido', ['VO'], mg(250)),
  ],
  indicacoes: [['Infecção abdominal', ['EV', 'VO']], ['Enterocolite necrosante', ['EV'], RN]],
});

export const sulfametoxazolTrimetoprima = med({
  id: 'sulfametoxazol-trimetoprima',
  codigo: 'A34',
  nome: 'Sulfametoxazol + trimetoprima',
  secao: 5,
  classe: 'Sulfonamida',
  usos: 'Profilaxia de pneumocistose na criança exposta ao HIV, infecção urinária',
  classes: ['sulfonamidas'],
  receituario: 'antimicrobiano',
  fonte: 'MS',
  apresentacoes: [
    ap('susp-oral', 'Suspensão oral SMX 200 mg + TMP 40 mg/5 mL (8 mg/mL de trimetoprima)', 'solucao-oral', ['VO'], {
      ...mgMl(8),
      observacao: 'Concentração em trimetoprima (TMP); confirmar por qual componente a dose é calculada (A VALIDAR).',
    }),
    ap('comp-400-80', 'Comprimido SMX 400 mg + TMP 80 mg', 'comprimido', ['VO'], { ...mg(80), observacao: 'Quantidade em trimetoprima (A VALIDAR).' }),
    ap('amp-400-80-5ml', 'Ampola SMX 400 mg + TMP 80 mg/5 mL (16 mg/mL de trimetoprima)', 'ampola', ['EV'], {
      ...mgMl(16),
      volumeMl: 5,
      ...mg(80),
      observacao: 'Concentração em trimetoprima (A VALIDAR).',
    }),
  ],
  indicacoes: [['Profilaxia de pneumocistose (criança exposta ao HIV)', ['VO']], ['Infecção urinária', ['VO', 'EV']]],
});

// ============================================================
// G. Antivirais e antifúngicos
// ============================================================

export const aciclovir = med({
  id: 'aciclovir',
  codigo: 'A35',
  nome: 'Aciclovir',
  secao: 5,
  classe: 'Antiviral',
  usos: 'Herpes neonatal, encefalite herpética, varicela grave',
  classes: ['antivirais'],
  fonte: 'SBP',
  apresentacoes: [
    ap('fa-po-250mg', 'Frasco-ampola (pó) 250 mg', 'frasco-ampola-po', ['EV'], mg(250)),
    ap('comp-200mg', 'Comprimido 200 mg', 'comprimido', ['VO'], mg(200)),
    ap('comp-400mg', 'Comprimido 400 mg', 'comprimido', ['VO'], mg(400)),
  ],
  indicacoes: [['Herpes neonatal', ['EV'], RN], ['Encefalite herpética', ['EV']], ['Varicela grave', ['EV', 'VO']]],
});

export const oseltamivir = med({
  id: 'oseltamivir',
  codigo: 'A36',
  nome: 'Oseltamivir',
  secao: 5,
  classe: 'Antiviral',
  usos: 'Influenza (tratamento e profilaxia)',
  classes: ['antivirais'],
  fonte: 'MS',
  apresentacoes: [
    ap('caps-30mg', 'Cápsula 30 mg', 'comprimido', ['VO'], mg(30)),
    ap('caps-45mg', 'Cápsula 45 mg', 'comprimido', ['VO'], mg(45)),
    ap('caps-75mg', 'Cápsula 75 mg', 'comprimido', ['VO'], mg(75)),
  ],
  indicacoes: [['Influenza — tratamento', ['VO']], ['Influenza — profilaxia', ['VO']]],
});

export const fluconazol = med({
  id: 'fluconazol',
  codigo: 'A37',
  nome: 'Fluconazol',
  secao: 5,
  classe: 'Antifúngico azólico',
  usos: 'Candidíase; profilaxia no prematuro extremo',
  classes: ['antifungicos', 'azois'],
  fonte: 'SBP',
  apresentacoes: [
    ap('bolsa-2mg-100ml', 'Bolsa 2 mg/mL, 100 mL (200 mg)', 'bolsa-soro', ['EV'], { ...mgMl(2), volumeMl: 100, ...mg(200) }),
    ap('caps-150mg', 'Cápsula 150 mg', 'comprimido', ['VO'], mg(150)),
  ],
  indicacoes: [['Candidíase', ['EV', 'VO']], ['Profilaxia no prematuro extremo', ['EV'], RN]],
});

export const anfotericinaB = med({
  id: 'anfotericina-b',
  codigo: 'A38',
  nome: 'Anfotericina B (desoxicolato / lipossomal)',
  secao: 5,
  classe: 'Antifúngico poliênico',
  usos: 'Candidíase invasiva, fungemia neonatal',
  classes: ['antifungicos', 'polienos'],
  fonte: 'SBP',
  apresentacoes: [
    ap('desoxicolato-50mg', 'Desoxicolato — frasco-ampola (pó) 50 mg', 'frasco-ampola-po', ['EV'], mg(50)),
    ap('lipossomal-50mg', 'Lipossomal — frasco-ampola (pó) 50 mg', 'frasco-ampola-po', ['EV'], mg(50)),
  ],
  indicacoes: [['Candidíase invasiva', ['EV']], ['Fungemia neonatal', ['EV'], RN]],
  alertas: ['Desoxicolato e lipossomal têm doses diferentes: não trocar uma pela outra (A VALIDAR).'],
});

// ============================================================
// H. Profilaxias
// ============================================================

export const rifampicina = med({
  id: 'rifampicina',
  codigo: 'A39',
  nome: 'Rifampicina',
  secao: 5,
  classe: 'Rifamicina',
  usos: 'Quimioprofilaxia de contatos de doença meningocócica e Hib (completa o caso 8)',
  classes: ['rifamicinas'],
  receituario: 'antimicrobiano',
  fonte: 'MS',
  apresentacoes: [
    ap('susp-20mg', 'Suspensão oral 100 mg/5 mL (20 mg/mL)', 'solucao-oral', ['VO'], mgMl(20)),
    ap('caps-300mg', 'Cápsula 300 mg', 'comprimido', ['VO'], mg(300)),
  ],
  indicacoes: [['Quimioprofilaxia — doença meningocócica', ['VO']], ['Quimioprofilaxia — Haemophilus influenzae tipo b', ['VO']]],
});

export const isoniazida = med({
  id: 'isoniazida',
  codigo: 'A40',
  nome: 'Isoniazida',
  secao: 5,
  classe: 'Antituberculoso',
  usos: 'Tuberculose latente; RN de mãe bacilífera',
  classes: ['antituberculosos'],
  fonte: 'MS',
  apresentacoes: [
    ap('comp-100mg', 'Comprimido 100 mg', 'comprimido', ['VO'], mg(100)),
    ap('comp-300mg', 'Comprimido 300 mg', 'comprimido', ['VO'], mg(300)),
  ],
  indicacoes: [['Tuberculose latente', ['VO']], ['RN de mãe bacilífera', ['VO'], RN]],
});

export const vitaminaK = med({
  id: 'vitamina-k',
  codigo: 'A41',
  nome: 'Vitamina K1 (fitomenadiona)',
  secao: 6,
  classe: 'Vitamina',
  usos: 'Profilaxia da doença hemorrágica do RN (sala de parto)',
  classes: ['vitaminas'],
  fonte: 'SBP',
  faixas: RN,
  apresentacoes: [
    ap('amp-10mg-1ml', 'Ampola 10 mg/mL, 1 mL (10 mg)', 'ampola', ['IM', 'EV'], { ...mgMl(10), volumeMl: 1, ...mg(10) }),
    ap('amp-2mg-0-2ml', 'Ampola pediátrica 2 mg/0,2 mL (10 mg/mL)', 'ampola', ['IM', 'EV', 'VO'], { ...mgMl(10), volumeMl: 0.2, ...mg(2) }),
  ],
  indicacoes: [['Profilaxia da doença hemorrágica do RN', ['IM']]],
});

export const profilaxiaOcular = med({
  id: 'profilaxia-ocular',
  codigo: 'A42',
  nome: 'Profilaxia ocular neonatal',
  secao: 5,
  classe: 'Antimicrobiano tópico',
  usos: 'Oftalmia neonatal; produto recomendado pelo MS A VALIDAR (ex.: iodopovidona 2,5% ou pomada de eritromicina)',
  classes: ['antimicrobianos-topicos'],
  fonte: 'MS',
  faixas: RN,
  apresentacoes: [
    ap('iodopovidona-2-5', 'Colírio de iodopovidona 2,5%', 'outro', ['ocular']),
    ap('eritromicina-pomada', 'Pomada oftálmica de eritromicina 0,5%', 'outro', ['ocular']),
  ],
  indicacoes: [['Profilaxia da oftalmia neonatal', ['ocular'], RN, 'Produto recomendado pelo MS: A VALIDAR.']],
});

export const imunoglobulinaHepatiteB = med({
  id: 'imunoglobulina-hepatite-b',
  codigo: 'A43',
  nome: 'Imunoglobulina anti-hepatite B + vacina hepatite B',
  secao: 6,
  classe: 'Imunização',
  usos: 'RN de mãe HBsAg positiva',
  classes: ['imunobiologicos'],
  fonte: 'MS',
  faixas: RN,
  apresentacoes: [
    ap('ighahb', 'Imunoglobulina anti-hepatite B (IGHAHB), frasco-ampola (conteúdo em UI: conferir no CRIE)', 'frasco-ampola-solucao', ['IM']),
    ap('vacina-hb', 'Vacina hepatite B recombinante, dose pediátrica (frasco do PNI: conferir)', 'frasco-ampola-solucao', ['IM']),
  ],
  indicacoes: [['RN de mãe HBsAg positiva', ['IM']]],
});

export const nirsevimabePalivizumabe = med({
  id: 'nirsevimabe-palivizumabe',
  codigo: 'A44',
  nome: 'Nirsevimabe / palivizumabe',
  secao: 6,
  classe: 'Anticorpo monoclonal',
  usos: 'Prevenção do vírus sincicial respiratório em grupos de risco; critérios do MS A VALIDAR',
  classes: ['anticorpos-monoclonais', 'imunobiologicos'],
  fonte: 'MS',
  faixas: ['RN', 'crianca'],
  apresentacoes: [
    ap('nirsevimabe-50mg', 'Nirsevimabe — seringa 50 mg/0,5 mL (100 mg/mL)', 'outro', ['IM'], { ...mgMl(100), volumeMl: 0.5, ...mg(50) }),
    ap('nirsevimabe-100mg', 'Nirsevimabe — seringa 100 mg/1 mL (100 mg/mL)', 'outro', ['IM'], { ...mgMl(100), volumeMl: 1, ...mg(100) }),
    ap('palivizumabe-50mg', 'Palivizumabe — frasco-ampola 100 mg/mL, 0,5 mL (50 mg)', 'frasco-ampola-solucao', ['IM'], { ...mgMl(100), volumeMl: 0.5, ...mg(50) }),
    ap('palivizumabe-100mg', 'Palivizumabe — frasco-ampola 100 mg/mL, 1 mL (100 mg)', 'frasco-ampola-solucao', ['IM'], { ...mgMl(100), volumeMl: 1, ...mg(100) }),
  ],
  indicacoes: [['Prevenção do vírus sincicial respiratório (grupos de risco)', ['IM'], undefined, 'Critérios do MS: A VALIDAR.']],
});

// ============================================================
// I. Neonatologia
// ============================================================

export const cafeina = med({
  id: 'cafeina',
  codigo: 'A45',
  nome: 'Citrato de cafeína',
  secao: 6,
  classe: 'Estimulante respiratório',
  usos: 'Apneia da prematuridade',
  classes: ['metilxantinas'],
  fonte: 'SBP',
  faixas: RN,
  apresentacoes: [
    ap('amp-20mg-1ml', 'Ampola 20 mg/mL de citrato de cafeína (= 10 mg/mL de cafeína base), 1 mL', 'ampola', ['EV', 'VO'], {
      ...mgMl(20),
      volumeMl: 1,
      ...mg(20),
      observacao: 'Concentração em citrato (a base é a metade): conferir por qual a dose é escrita (A VALIDAR).',
    }),
    ap('sol-oral-20mg', 'Solução oral 20 mg/mL de citrato de cafeína (manipulada?)', 'solucao-oral', ['VO'], mgMl(20)),
  ],
  indicacoes: [['Apneia da prematuridade', ['EV', 'VO']]],
});

export const surfactante = med({
  id: 'surfactante',
  codigo: 'A46',
  nome: 'Surfactante (poractanto / beractanto)',
  secao: 6,
  classe: 'Surfactante pulmonar',
  usos: 'Síndrome do desconforto respiratório do prematuro',
  classes: ['surfactantes'],
  fonte: 'SBP',
  faixas: RN,
  apresentacoes: [
    ap('poractanto-1-5ml', 'Poractanto alfa 80 mg/mL — frasco 1,5 mL (120 mg)', 'frasco-ampola-solucao', ['endotraqueal'], { ...mgMl(80), volumeMl: 1.5, ...mg(120) }),
    ap('poractanto-3ml', 'Poractanto alfa 80 mg/mL — frasco 3 mL (240 mg)', 'frasco-ampola-solucao', ['endotraqueal'], { ...mgMl(80), volumeMl: 3, ...mg(240) }),
    ap('beractanto-4ml', 'Beractanto 25 mg/mL — frasco 4 mL (100 mg)', 'frasco-ampola-solucao', ['endotraqueal'], { ...mgMl(25), volumeMl: 4, ...mg(100) }),
    ap('beractanto-8ml', 'Beractanto 25 mg/mL — frasco 8 mL (200 mg)', 'frasco-ampola-solucao', ['endotraqueal'], { ...mgMl(25), volumeMl: 8, ...mg(200) }),
  ],
  indicacoes: [['Síndrome do desconforto respiratório do prematuro', ['endotraqueal']]],
  alertas: ['Poractanto e beractanto têm concentrações diferentes: conferir qual frasco está sendo usado (A VALIDAR).'],
});

// ============================================================
// J. Outros
// ============================================================

export const ondansetrona = med({
  id: 'ondansetrona',
  codigo: 'A47',
  nome: 'Ondansetrona',
  secao: 6,
  classe: 'Antiemético',
  usos: 'Vômitos na gastroenterite (facilita a hidratação oral)',
  classes: ['antiemeticos'],
  fonte: 'SBP',
  apresentacoes: [
    ap('amp-2mg-2ml', 'Ampola 2 mg/mL, 2 mL (4 mg)', 'ampola', ['EV', 'IM'], { ...mgMl(2), volumeMl: 2, ...mg(4) }),
    ap('amp-2mg-4ml', 'Ampola 2 mg/mL, 4 mL (8 mg)', 'ampola', ['EV', 'IM'], { ...mgMl(2), volumeMl: 4, ...mg(8) }),
    ap('comp-od-4mg', 'Comprimido orodispersível 4 mg', 'comprimido', ['VO'], mg(4)),
    ap('comp-od-8mg', 'Comprimido orodispersível 8 mg', 'comprimido', ['VO'], mg(8)),
  ],
  indicacoes: [['Vômitos na gastroenterite', ['VO', 'EV', 'IM']]],
});

export const prometazina = med({
  id: 'prometazina',
  codigo: 'A48',
  nome: 'Prometazina',
  secao: 6,
  classe: 'Anti-histamínico H1',
  usos: 'Urticária, anafilaxia (depois da adrenalina; completa o caso 9). Restrições por idade A VALIDAR; alternativas: dexclorfeniramina, difenidramina',
  classes: ['anti-histaminicos', 'fenotiazinicos'],
  fonte: 'SBP',
  apresentacoes: [
    ap('amp-25mg-2ml', 'Ampola 25 mg/mL, 2 mL (50 mg)', 'ampola', ['IM', 'EV'], { ...mgMl(25), volumeMl: 2, ...mg(50) }),
    ap('comp-25mg', 'Comprimido 25 mg', 'comprimido', ['VO'], mg(25)),
  ],
  indicacoes: [
    ['Urticária', ['VO', 'IM'], undefined, 'Restrições por idade: A VALIDAR (conferir a idade mínima na bula).'],
    ['Anafilaxia (depois da adrenalina)', ['IM', 'EV'], undefined, 'Restrições por idade: A VALIDAR (conferir a idade mínima na bula).'],
  ],
});

export const cabergolina = med({
  id: 'cabergolina',
  codigo: 'A49',
  nome: 'Cabergolina',
  secao: 6,
  classe: 'Agonista dopaminérgico',
  usos: 'Inibição da lactação na mãe vivendo com HIV (completa o caso 4)',
  classes: ['agonistas-dopaminergicos'],
  fonte: 'MS',
  apresentacoes: [ap('comp-0-5mg', 'Comprimido 0,5 mg', 'comprimido', ['VO'], mg(0.5))],
  indicacoes: [
    ['Inibição da lactação (mãe vivendo com HIV)', ['VO'], ['adolescente'], 'Prescrição para a MÃE (puérpera), não para o RN. Faixa etária: A VALIDAR.'],
  ],
});

export const imunoglobulinaHumana = med({
  id: 'imunoglobulina-humana',
  codigo: 'A50',
  nome: 'Imunoglobulina humana EV',
  secao: 6,
  classe: 'Imunoglobulina',
  usos: 'Doença de Kawasaki, síndrome inflamatória multissistêmica (SIM-P), púrpura trombocitopênica',
  classes: ['imunoglobulinas', 'imunobiologicos'],
  fonte: 'SBP',
  apresentacoes: [
    ap('fa-5pct-5g', 'Frasco 5% (50 mg/mL), 5 g em 100 mL', 'frasco-ampola-solucao', ['EV'], {
      ...mgMl(50),
      volumeMl: 100,
      ...g(5),
      observacao: 'Concentração e tamanho do frasco variam com o fabricante (A VALIDAR).',
    }),
    ap('fa-10pct-10g', 'Frasco 10% (100 mg/mL), 10 g em 100 mL', 'frasco-ampola-solucao', ['EV'], {
      ...mgMl(100),
      volumeMl: 100,
      ...g(10),
      observacao: 'Concentração e tamanho do frasco variam com o fabricante (A VALIDAR).',
    }),
  ],
  indicacoes: [['Doença de Kawasaki', ['EV']], ['Síndrome inflamatória multissistêmica (SIM-P)', ['EV']], ['Púrpura trombocitopênica', ['EV']]],
});

/** As 49 novas (A1–A50 sem a A26, que já estava no banco), na ordem da lista. */
export const MEDICACOES_AMPLIACAO: readonly Medicacao[] = [
  midazolam,
  diazepam,
  fenobarbital,
  fenitoina,
  levetiracetam,
  cetamina,
  fentanil,
  morfina,
  paracetamol,
  ibuprofeno,
  naloxona,
  carvaoAtivado,
  acetilcisteina,
  atropina,
  rocuronio,
  succinilcolina,
  noradrenalina,
  dobutamina,
  milrinona,
  alprostadil,
  bicarbonatoSodio,
  sulfatoMagnesio,
  furosemida,
  manitol,
  sro,
  amoxicilinaClavulanato,
  oxacilina,
  cefotaxima,
  meropenem,
  azitromicina,
  clindamicina,
  metronidazol,
  sulfametoxazolTrimetoprima,
  aciclovir,
  oseltamivir,
  fluconazol,
  anfotericinaB,
  rifampicina,
  isoniazida,
  vitaminaK,
  profilaxiaOcular,
  imunoglobulinaHepatiteB,
  nirsevimabePalivizumabe,
  cafeina,
  surfactante,
  ondansetrona,
  prometazina,
  cabergolina,
  imunoglobulinaHumana,
];
