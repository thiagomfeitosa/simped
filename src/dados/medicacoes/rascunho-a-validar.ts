/**
 * ⚠️ TUDO "A VALIDAR". Medicações do MVP copiadas de docs/fase-0/doses-rascunho.md (rascunho feito de
 * memória pelo assistente, sem consulta às fontes). O número do item do rascunho fica em cada medicação.
 * O código da fonte é o PROVÁVEL (o que o rascunho cita entre colchetes); nenhum documento/página foi conferido.
 * Enquanto o status for 'A_VALIDAR', nada daqui corrige o aluno.
 *
 * Quando o rascunho dá uma regra que o formato do banco ainda não representa (ex.: "3x/semana",
 * "mín. 2,5 mg"), ela vai em `observacoes` ou como dose em texto.
 */

import type { Apresentacao, ExpressaoDeDose, FaixaEtaria, Fonte, Medicacao, Periodo, RegraDeDose, UnidadeDroga, Via } from './tipos';

const AV = 'A_VALIDAR' as const;
const RN: FaixaEtaria[] = ['RN'];
const CRI: FaixaEtaria[] = ['crianca'];
const CRI_ADO: FaixaEtaria[] = ['crianca', 'adolescente'];
const ADO: FaixaEtaria[] = ['adolescente'];
const TODAS: FaixaEtaria[] = ['RN', 'crianca', 'adolescente'];

function ap(id: string, descricao: string, forma: Apresentacao['forma'], vias: Via[], extra: Partial<Apresentacao> = {}): Apresentacao {
  return { id, descricao, forma, vias, status: AV, ...extra };
}

function regra(
  id: string,
  indicacao: string,
  faixas: FaixaEtaria[],
  vias: Via[],
  dose: ExpressaoDeDose,
  fonte: Fonte['codigo'],
  extra: Partial<RegraDeDose> = {},
): RegraDeDose {
  return { id, indicacao, faixas, vias, dose, fonte: { codigo: fonte }, status: AV, ...extra };
}

const porKg = (min: number, max: number, unidade: UnidadeDroga, por: Periodo = 'dose'): ExpressaoDeDose => ({
  tipo: 'porKg',
  min,
  max,
  unidade,
  por,
});
const fixa = (min: number, max: number, unidade: UnidadeDroga, por: Periodo = 'dose'): ExpressaoDeDose => ({
  tipo: 'fixa',
  min,
  max,
  unidade,
  por,
});
const porM2 = (min: number, max: number, unidade: UnidadeDroga, por: Periodo): ExpressaoDeDose => ({
  tipo: 'porM2',
  min,
  max,
  unidade,
  por,
});
const texto = (descricao: string): ExpressaoDeDose => ({ tipo: 'texto', descricao });

// ============================================================
// 4. REPOSIÇÃO VOLÊMICA, GLICOSE E ELETRÓLITOS
// ============================================================

/** Item 1. Dose em mL/kg; "1 mL/mL" faz o volume a aspirar ser a própria dose. */
export const soroFisiologico: Medicacao = {
  id: 'sf09',
  codigo: '1',
  nome: 'Soro fisiológico 0,9%',
  secao: 4,
  classes: ['cristaloides'],
  apresentacoes: [
    ap('bolsa-100', 'Bolsa 100 mL (Na 154 mEq/L)', 'bolsa-soro', ['EV', 'IO'], { volumeMl: 100, concentracaoPorMl: { valor: 1, unidade: 'mL' } }),
    ap('bolsa-250', 'Bolsa 250 mL (Na 154 mEq/L)', 'bolsa-soro', ['EV', 'IO'], { volumeMl: 250, concentracaoPorMl: { valor: 1, unidade: 'mL' } }),
    ap('bolsa-500', 'Bolsa 500 mL (Na 154 mEq/L)', 'bolsa-soro', ['EV', 'IO'], { volumeMl: 500, concentracaoPorMl: { valor: 1, unidade: 'mL' } }),
    ap('bolsa-1000', 'Bolsa 1000 mL (Na 154 mEq/L)', 'bolsa-soro', ['EV', 'IO'], { volumeMl: 1000, concentracaoPorMl: { valor: 1, unidade: 'mL' } }),
  ],
  regras: [
    regra('rn-hipovolemia', 'Expansão (reanimação/hipovolemia)', RN, ['EV', 'IO'], porKg(10, 10, 'mL'), 'NRP', { observacoes: 'Em 5–10 min, pode repetir.' }),
    regra('choque', 'Expansão (choque/sepse)', CRI_ADO, ['EV', 'IO'], porKg(10, 20, 'mL'), 'PALS', {
      observacoes: 'Em 5–20 min, reavaliar após cada bolus; até 40–60 mL/kg na 1ª hora se sem sinais de sobrecarga.',
    }),
    regra('plano-c', 'Desidratação grave (Plano C)', CRI_ADO, ['EV', 'IO'], porKg(20, 20, 'mL'), 'MS', {
      observacoes: 'Fase rápida em 30 min, repetir até hidratar. Conferir versão vigente do MS.',
    }),
    regra('cad', 'Cetoacidose diabética', CRI_ADO, ['EV'], porKg(10, 20, 'mL'), 'ISPAD', { observacoes: 'Em 1 h.' }),
  ],
};

/** Item 2. */
export const soroGlicosado5: Medicacao = {
  id: 'sg5',
  codigo: '2',
  nome: 'Soro glicosado 5%',
  secao: 4,
  apresentacoes: [
    ap('frasco-500', 'Frasco 500 mL (50 mg/mL de glicose)', 'bolsa-soro', ['EV'], { volumeMl: 500, concentracaoPorMl: { valor: 1, unidade: 'mL' } }),
    ap('frasco-1000', 'Frasco 1000 mL (50 mg/mL de glicose)', 'bolsa-soro', ['EV'], { volumeMl: 1000, concentracaoPorMl: { valor: 1, unidade: 'mL' } }),
  ],
  regras: [
    regra('manutencao', 'Base do soro de manutenção', CRI_ADO, ['EV'], texto('Holliday-Segar; tendência atual: manutenção isotônica (Na ~140) de 28 dias a 18 anos.'), 'AAP'),
  ],
  alertas: ['Para montar o soro de manutenção, use o botão "+ soro" da seção 4.'],
};

/** Item 3. Dose em mL/kg (2 mL/kg = 200 mg/kg). */
export const soroGlicosado10: Medicacao = {
  id: 'sg10',
  codigo: '3',
  nome: 'Soro glicosado 10%',
  secao: 4,
  apresentacoes: [
    ap('frasco-250', 'Frasco 250 mL (100 mg/mL de glicose)', 'bolsa-soro', ['EV'], { volumeMl: 250, concentracaoPorMl: { valor: 1, unidade: 'mL' } }),
    ap('frasco-500', 'Frasco 500 mL (100 mg/mL de glicose)', 'bolsa-soro', ['EV'], { volumeMl: 500, concentracaoPorMl: { valor: 1, unidade: 'mL' } }),
  ],
  regras: [
    regra('rn-hipoglicemia', 'Hipoglicemia (bolus)', RN, ['EV'], porKg(2, 2, 'mL'), 'SBP', {
      observacoes: 'Em 1 min, seguido de VIG 6–8 mg/kg/min.',
    }),
    regra('crianca-hipoglicemia', 'Hipoglicemia (bolus)', CRI, ['EV', 'IO'], porKg(5, 10, 'mL'), 'PALS', { observacoes: '0,5–1 g/kg.' }),
  ],
};

/** Item 4. */
export const glicose25: Medicacao = {
  id: 'g25',
  codigo: '4',
  nome: 'Glicose 25%',
  secao: 4,
  apresentacoes: [ap('amp-10ml', 'Ampola 10 mL (250 mg/mL)', 'ampola', ['EV'], { volumeMl: 10, concentracaoPorMl: { valor: 1, unidade: 'mL' } })],
  regras: [regra('hipoglicemia', 'Hipoglicemia (bolus)', CRI, ['EV', 'IO'], porKg(2, 4, 'mL'), 'PALS', { observacoes: '0,5–1 g/kg.' })],
};

/** Item 5. */
export const glicose50: Medicacao = {
  id: 'g50',
  codigo: '5',
  nome: 'Glicose 50%',
  secao: 4,
  apresentacoes: [ap('amp-10ml', 'Ampola 10 mL (500 mg/mL)', 'ampola', ['EV'], { volumeMl: 10, concentracaoPorMl: { valor: 1, unidade: 'mL' } })],
  regras: [
    regra('hipoglicemia-ado', 'Hipoglicemia (bolus)', ADO, ['EV'], porKg(1, 2, 'mL'), 'PALS', {
      doseMaxima: { valor: 50, unidade: 'mL', por: 'dose' },
      observacoes: 'Acesso calibroso.',
    }),
  ],
  alertas: ['Evitar em RN e lactentes (hiperosmolar). Usada para concentrar soros.'],
};

/** Item 6. */
export const gluconatoCalcio: Medicacao = {
  id: 'gluconato-calcio',
  codigo: '6',
  nome: 'Gluconato de cálcio 10%',
  secao: 4,
  classes: ['calcio'],
  apresentacoes: [
    ap('amp-10ml', 'Ampola 10 mL (100 mg/mL; ~0,45 mEq/mL)', 'ampola', ['EV'], {
      quantidade: { valor: 1000, unidade: 'mg' },
      volumeMl: 10,
      concentracaoPorMl: { valor: 100, unidade: 'mg' },
    }),
  ],
  regras: [
    regra('rn-manutencao', 'Manutenção no soro', RN, ['EV'], porKg(200, 400, 'mg', 'dia'), 'SBP', { observacoes: '2–4 mL/kg/dia no soro.' }),
    regra('hipocalcemia', 'Hipocalcemia sintomática / hipercalemia', TODAS, ['EV', 'IO'], porKg(60, 100, 'mg'), 'PALS', {
      doseMaxima: { valor: 2000, unidade: 'mg', por: 'dose' },
      observacoes: '0,6–1 mL/kg EV lento (10–20 min), diluído.',
    }),
  ],
  alertas: ['Monitorizar FC. Não misturar com bicarbonato. Nunca com ceftriaxona EV no RN ≤ 28 dias.'],
};

/** Item 7. */
export const cloretoPotassio: Medicacao = {
  id: 'kcl',
  codigo: '7',
  nome: 'Cloreto de potássio (KCl)',
  secao: 4,
  apresentacoes: [
    ap('amp-19-1', 'Ampola KCl 19,1% 10 mL (2,56 mEq/mL)', 'ampola', ['EV'], {
      quantidade: { valor: 25.6, unidade: 'mEq' },
      volumeMl: 10,
      concentracaoPorMl: { valor: 2.56, unidade: 'mEq' },
    }),
    ap('amp-10', 'Ampola KCl 10% 10 mL (1,34 mEq/mL)', 'ampola', ['EV'], {
      quantidade: { valor: 13.4, unidade: 'mEq' },
      volumeMl: 10,
      concentracaoPorMl: { valor: 1.34, unidade: 'mEq' },
    }),
    ap('xarope-6', 'Xarope 6% (0,8 mEq/mL)', 'solucao-oral', ['VO'], { concentracaoPorMl: { valor: 0.8, unidade: 'mEq' } }),
  ],
  regras: [
    regra('manutencao', 'Manutenção no soro', CRI_ADO, ['EV'], porKg(2, 3, 'mEq', 'dia'), 'SBP', { observacoes: '≈ 2 mEq/100 mL do Holliday.' }),
    regra('hipocalemia', 'Hipocalemia (reposição EV)', CRI_ADO, ['EV'], porKg(0.5, 1, 'mEq'), 'PALS', {
      doseMaxima: { valor: 40, unidade: 'mEq', por: 'dose' },
      observacoes: 'Em 1–2 h, máx 0,5–1 mEq/kg/h, com monitor.',
    }),
  ],
  concentracaoMaximaEV: {
    valor: 0.04,
    unidade: 'mEq',
    fonte: { codigo: 'PALS' },
    status: AV,
    observacao: '~40 mEq/L em veia periférica (60–80 mEq/L em acesso central, conforme protocolo).',
  },
  alertas: ['NUNCA em bolus.'],
};

/** Item 8. */
export const cloretoSodio20: Medicacao = {
  id: 'nacl20',
  codigo: '8',
  nome: 'Cloreto de sódio 20%',
  secao: 4,
  apresentacoes: [
    ap('amp-10ml', 'Ampola NaCl 20% 10 mL (3,4 mEq/mL)', 'ampola', ['EV'], {
      quantidade: { valor: 34, unidade: 'mEq' },
      volumeMl: 10,
      concentracaoPorMl: { valor: 3.4, unidade: 'mEq' },
    }),
  ],
  regras: [regra('manutencao', 'Manutenção no soro', CRI_ADO, ['EV'], porKg(3, 3, 'mEq', 'dia'), 'SBP', { observacoes: '≈ 3 mEq/100 mL do Holliday.' })],
  alertas: ['Concentrado: sempre diluído no soro. Correção: subir no máx 8–10 mEq/L de Na em 24 h.'],
};

/** Item 8 (NaCl 3%, preparado a partir do 20%). Dose em mL/kg. */
export const cloretoSodio3: Medicacao = {
  id: 'nacl3',
  codigo: '8b',
  nome: 'Cloreto de sódio 3% (preparado)',
  secao: 4,
  apresentacoes: [
    ap('preparo-100ml', 'NaCl 3% 100 mL (0,513 mEq/mL) = 15 mL de NaCl 20% + 85 mL de AD', 'bolsa-soro', ['EV'], {
      volumeMl: 100,
      concentracaoPorMl: { valor: 1, unidade: 'mL' },
    }),
  ],
  regras: [
    regra('hiponatremia-grave', 'Hiponatremia sintomática grave (convulsão)', CRI_ADO, ['EV'], porKg(2, 5, 'mL'), 'PALS', {
      observacoes: 'Em 10–20 min, repetir até melhora (máx ~2–3 doses). mEq = (Na desejado − Na atual) × 0,6 × peso.',
    }),
  ],
};

// ============================================================
// 5. ANTIBIÓTICOS / ANTIPARASITÁRIOS / ARV
// ============================================================

/** Item 10. */
export const ampicilina: Medicacao = {
  id: 'ampicilina',
  codigo: '10',
  nome: 'Ampicilina',
  secao: 5,
  classes: ['penicilinas', 'betalactamicos'],
  receituario: 'antimicrobiano',
  apresentacoes: [
    ap('fa-500', 'Frasco-ampola 500 mg (pó)', 'frasco-ampola-po', ['EV', 'IM'], { quantidade: { valor: 500, unidade: 'mg' } }),
    ap('fa-1g', 'Frasco-ampola 1 g (pó)', 'frasco-ampola-po', ['EV', 'IM'], { quantidade: { valor: 1000, unidade: 'mg' } }),
  ],
  regras: [
    regra('rn-sepse', 'Sepse neonatal', RN, ['EV'], porKg(50, 50, 'mg'), 'NEOFAX', {
      intervalosHoras: [8, 12],
      observacoes: '12/12h ou 8/8h conforme IG e dias de vida (tabela por IG — A VALIDAR).',
    }),
    regra('rn-meningite-ate-7d', 'Meningite', RN, ['EV'], porKg(100, 100, 'mg'), 'AAP', { condicoes: { idadeDias: { ate: 8 } }, intervalosHoras: [8] }),
    regra('rn-meningite-apos-7d', 'Meningite', RN, ['EV'], porKg(75, 75, 'mg'), 'AAP', { condicoes: { idadeDias: { de: 8 } }, intervalosHoras: [6] }),
    regra('crianca', 'Infecção bacteriana', CRI_ADO, ['EV', 'IM'], porKg(100, 200, 'mg', 'dia'), 'AAP', {
      intervalosHoras: [6],
      doseMaxima: { valor: 12000, unidade: 'mg', por: 'dia' },
    }),
    regra('crianca-meningite', 'Meningite', CRI_ADO, ['EV'], porKg(300, 400, 'mg', 'dia'), 'AAP', {
      intervalosHoras: [6],
      doseMaxima: { valor: 12000, unidade: 'mg', por: 'dia' },
    }),
  ],
};

/** Item 11. Regras do RN por idade pós-menstrual (IG corrigida) e dias de vida, como no rascunho. */
export const gentamicina: Medicacao = {
  id: 'gentamicina',
  codigo: '11',
  nome: 'Gentamicina',
  secao: 5,
  classes: ['aminoglicosideos'],
  receituario: 'antimicrobiano',
  apresentacoes: [
    ap('amp-10mg-ml', 'Ampola 10 mg/mL, 1 mL', 'ampola', ['EV', 'IM'], { quantidade: { valor: 10, unidade: 'mg' }, volumeMl: 1, concentracaoPorMl: { valor: 10, unidade: 'mg' } }),
    ap('amp-20mg-ml', 'Ampola 20 mg/mL, 1 mL', 'ampola', ['EV', 'IM'], { quantidade: { valor: 20, unidade: 'mg' }, volumeMl: 1, concentracaoPorMl: { valor: 20, unidade: 'mg' } }),
    ap('amp-40mg-ml-1', 'Ampola 40 mg/mL, 1 mL', 'ampola', ['EV', 'IM'], { quantidade: { valor: 40, unidade: 'mg' }, volumeMl: 1, concentracaoPorMl: { valor: 40, unidade: 'mg' } }),
    ap('amp-40mg-ml-2', 'Ampola 40 mg/mL, 2 mL', 'ampola', ['EV', 'IM'], { quantidade: { valor: 80, unidade: 'mg' }, volumeMl: 2, concentracaoPorMl: { valor: 40, unidade: 'mg' } }),
  ],
  regras: [
    regra('rn-ate29-0a7d', 'Sepse neonatal', RN, ['EV'], porKg(5, 5, 'mg'), 'NEOFAX', {
      condicoes: { idadePosMenstrualSemanas: { ate: 30 }, idadeDias: { ate: 8 } },
      intervalosHoras: [48],
    }),
    regra('rn-ate29-8a28d', 'Sepse neonatal', RN, ['EV'], porKg(4, 4, 'mg'), 'NEOFAX', {
      condicoes: { idadePosMenstrualSemanas: { ate: 30 }, idadeDias: { de: 8 } },
      intervalosHoras: [36],
    }),
    regra('rn-30a34-0a7d', 'Sepse neonatal', RN, ['EV'], porKg(4.5, 4.5, 'mg'), 'NEOFAX', {
      condicoes: { idadePosMenstrualSemanas: { de: 30, ate: 35 }, idadeDias: { ate: 8 } },
      intervalosHoras: [36],
    }),
    regra('rn-30a34-8d', 'Sepse neonatal', RN, ['EV'], porKg(4, 4, 'mg'), 'NEOFAX', {
      condicoes: { idadePosMenstrualSemanas: { de: 30, ate: 35 }, idadeDias: { de: 8 } },
      intervalosHoras: [24],
    }),
    regra('rn-35', 'Sepse neonatal', RN, ['EV'], porKg(4, 4, 'mg'), 'NEOFAX', {
      condicoes: { idadePosMenstrualSemanas: { de: 35 } },
      intervalosHoras: [24],
    }),
    regra('crianca', 'Infecção bacteriana', CRI_ADO, ['EV', 'IM'], porKg(5, 7.5, 'mg', 'dia'), 'AAP', { intervalosHoras: [24] }),
  ],
  alertas: ['Infundir em 30 min. Nível sérico se uso prolongado ou disfunção renal.'],
};

/** Item 12. */
export const vancomicina: Medicacao = {
  id: 'vancomicina',
  codigo: '12',
  nome: 'Vancomicina',
  secao: 5,
  classes: ['glicopeptideos'],
  receituario: 'antimicrobiano',
  apresentacoes: [
    ap('fa-500', 'Frasco-ampola 500 mg (pó)', 'frasco-ampola-po', ['EV'], { quantidade: { valor: 500, unidade: 'mg' } }),
    ap('fa-1g', 'Frasco-ampola 1 g (pó)', 'frasco-ampola-po', ['EV'], { quantidade: { valor: 1000, unidade: 'mg' } }),
  ],
  regras: [
    regra('rn', 'Infecção grave', RN, ['EV'], porKg(10, 15, 'mg'), 'NEOFAX', { intervalosHoras: [8, 12, 24], observacoes: 'Intervalo conforme IG e dias de vida.' }),
    regra('crianca', 'Infecção grave', CRI_ADO, ['EV'], porKg(40, 60, 'mg', 'dia'), 'AAP', { intervalosHoras: [6] }),
    regra('crianca-meningite', 'Meningite', CRI_ADO, ['EV'], porKg(60, 60, 'mg', 'dia'), 'AAP', { intervalosHoras: [6] }),
  ],
  concentracaoMaximaEV: { valor: 5, unidade: 'mg', fonte: { codigo: 'BULA' }, status: AV, observacao: '≤ 5 mg/mL.' },
  alertas: ['Infundir em ≥ 60 min (síndrome do homem vermelho). Nível sérico/AUC.'],
};

/** Item 14. */
export const penicilinaProcaina: Medicacao = {
  id: 'penicilina-procaina',
  codigo: '14',
  nome: 'Penicilina G procaína',
  secao: 5,
  classes: ['penicilinas', 'betalactamicos'],
  receituario: 'antimicrobiano',
  apresentacoes: [
    ap('fa-400mil', 'Frasco-ampola 400.000 UI (300.000 procaína + 100.000 potássica)', 'frasco-ampola-po', ['IM'], {
      quantidade: { valor: 400_000, unidade: 'UI' },
    }),
  ],
  regras: [
    regra('rn-sifilis', 'Sífilis congênita sem neurossífilis', RN, ['IM'], porKg(50_000, 50_000, 'UI'), 'MS', {
      intervalosHoras: [24],
      observacoes: 'Por 10 dias. Verificar disponibilidade atual.',
    }),
  ],
  alertas: ['Somente IM.'],
};

/** Item 15. */
export const penicilinaBenzatina: Medicacao = {
  id: 'penicilina-benzatina',
  codigo: '15',
  nome: 'Penicilina G benzatina',
  secao: 5,
  classes: ['penicilinas', 'betalactamicos'],
  receituario: 'antimicrobiano',
  apresentacoes: [
    ap('fa-600mil', 'Frasco-ampola 600.000 UI', 'frasco-ampola-po', ['IM'], { quantidade: { valor: 600_000, unidade: 'UI' } }),
    ap('fa-1200mil', 'Frasco-ampola 1.200.000 UI', 'frasco-ampola-po', ['IM'], { quantidade: { valor: 1_200_000, unidade: 'UI' } }),
  ],
  regras: [
    regra('rn', 'Sífilis congênita (fluxograma do MS)', RN, ['IM'], porKg(50_000, 50_000, 'UI'), 'MS', { observacoes: 'Dose única.' }),
    regra('faringo-menor27', 'Faringoamigdalite / profilaxia de febre reumática', CRI_ADO, ['IM'], fixa(600_000, 600_000, 'UI'), 'SBP', {
      condicoes: { pesoKg: { ate: 27 } },
      observacoes: 'Profilaxia a cada 21 dias.',
    }),
    regra('faringo-27', 'Faringoamigdalite / profilaxia de febre reumática', CRI_ADO, ['IM'], fixa(1_200_000, 1_200_000, 'UI'), 'SBP', {
      condicoes: { pesoKg: { de: 27 } },
      observacoes: 'Profilaxia a cada 21 dias.',
    }),
    regra('ado-sifilis-recente', 'Sífilis recente', ADO, ['IM'], fixa(2_400_000, 2_400_000, 'UI'), 'MS', {
      observacoes: 'Dose única (1.200.000 em cada glúteo); tardia: 2.400.000 UI/semana por 3 semanas.',
    }),
  ],
  alertas: ['Somente IM. Nunca EV.'],
};

/** Item 16. */
export const sulfadiazina: Medicacao = {
  id: 'sulfadiazina',
  codigo: '16',
  nome: 'Sulfadiazina',
  secao: 5,
  classes: ['sulfonamidas'],
  receituario: 'antimicrobiano',
  apresentacoes: [
    ap('comp-500', 'Comprimido 500 mg', 'comprimido', ['VO'], { quantidade: { valor: 500, unidade: 'mg' } }),
    ap('susp-manipulada', 'Suspensão manipulada 100 mg/mL (concentração da farmácia, A VALIDAR)', 'solucao-oral', ['VO'], {
      concentracaoPorMl: { valor: 100, unidade: 'mg' },
      volumeMl: 100,
    }),
  ],
  regras: [regra('toxo', 'Toxoplasmose congênita', ['RN', 'crianca'], ['VO'], porKg(100, 100, 'mg', 'dia'), 'MS', { intervalosHoras: [12], observacoes: 'Por 1 ano.' })],
};

/** Item 17. */
export const pirimetamina: Medicacao = {
  id: 'pirimetamina',
  codigo: '17',
  nome: 'Pirimetamina',
  secao: 5,
  classes: ['antiparasitarios'],
  apresentacoes: [
    ap('comp-25', 'Comprimido 25 mg', 'comprimido', ['VO'], { quantidade: { valor: 25, unidade: 'mg' } }),
    ap('susp-manipulada', 'Suspensão manipulada 2 mg/mL (concentração da farmácia, A VALIDAR)', 'solucao-oral', ['VO'], {
      concentracaoPorMl: { valor: 2, unidade: 'mg' },
      volumeMl: 60,
    }),
  ],
  regras: [
    regra('toxo-ataque', 'Toxoplasmose congênita — 2 primeiros dias', ['RN', 'crianca'], ['VO'], porKg(2, 2, 'mg', 'dia'), 'MS', { intervalosHoras: [24] }),
    regra('toxo-manutencao', 'Toxoplasmose congênita — depois', ['RN', 'crianca'], ['VO'], porKg(1, 1, 'mg', 'dia'), 'MS', {
      intervalosHoras: [24],
      observacoes: 'Até 2–6 meses → depois 1 mg/kg 3x/semana (seg/qua/sex) até completar 1 ano.',
    }),
  ],
  alertas: ['Sempre com ácido folínico; hemograma seriado.'],
};

/** Item 18. */
export const acidoFolinico: Medicacao = {
  id: 'acido-folinico',
  codigo: '18',
  nome: 'Ácido folínico (folinato de cálcio)',
  secao: 5,
  apresentacoes: [
    ap('comp-15', 'Comprimido 15 mg', 'comprimido', ['VO'], { quantidade: { valor: 15, unidade: 'mg' } }),
    ap('susp-manipulada', 'Suspensão manipulada 5 mg/mL (concentração da farmácia, A VALIDAR)', 'solucao-oral', ['VO'], {
      concentracaoPorMl: { valor: 5, unidade: 'mg' },
      volumeMl: 30,
    }),
  ],
  regras: [
    regra('toxo', 'Toxoplasmose congênita', ['RN', 'crianca'], ['VO'], fixa(10, 10, 'mg'), 'MS', {
      observacoes: '3x/semana, até 1 semana após suspender a pirimetamina.',
    }),
  ],
  alertas: ['Ácido FOLÍNICO, não ácido fólico.'],
};

/** Item 19. */
export const zidovudina: Medicacao = {
  id: 'zidovudina',
  codigo: '19',
  nome: 'Zidovudina (AZT)',
  secao: 5,
  classes: ['antirretrovirais'],
  apresentacoes: [
    ap('sol-oral-10', 'Solução oral 10 mg/mL', 'solucao-oral', ['VO'], { concentracaoPorMl: { valor: 10, unidade: 'mg' }, volumeMl: 200 }),
    ap('fa-ev-10', 'Frasco-ampola EV 10 mg/mL, 20 mL', 'frasco-ampola-solucao', ['EV'], {
      quantidade: { valor: 200, unidade: 'mg' },
      volumeMl: 20,
      concentracaoPorMl: { valor: 10, unidade: 'mg' },
    }),
    ap('caps-100', 'Cápsula 100 mg', 'comprimido', ['VO'], { quantidade: { valor: 100, unidade: 'mg' } }),
  ],
  regras: [
    regra('rn-35', 'RN exposto ao HIV', RN, ['VO'], porKg(4, 4, 'mg'), 'MS', {
      condicoes: { igNascerSemanas: { de: 35 } },
      intervalosHoras: [12],
      observacoes: 'Por 28 dias.',
    }),
    regra('rn-30a35-ate14d', 'RN exposto ao HIV', RN, ['VO'], porKg(2, 2, 'mg'), 'MS', {
      condicoes: { igNascerSemanas: { de: 30, ate: 35 }, idadeDias: { ate: 14 } },
      intervalosHoras: [12],
    }),
    regra('rn-30a35-apos14d', 'RN exposto ao HIV', ['RN', 'crianca'], ['VO'], porKg(3, 3, 'mg'), 'MS', {
      condicoes: { igNascerSemanas: { de: 30, ate: 35 }, idadeDias: { de: 14 } },
      intervalosHoras: [12],
    }),
    regra('rn-menor30', 'RN exposto ao HIV', RN, ['VO'], porKg(2, 2, 'mg'), 'MS', {
      condicoes: { igNascerSemanas: { ate: 30 } },
      intervalosHoras: [12],
    }),
  ],
  alertas: ['RN sem via oral: dose EV — conferir tabela do MS. Hemograma (anemia).'],
};

/** Item 20. */
export const lamivudina: Medicacao = {
  id: 'lamivudina',
  codigo: '20',
  nome: 'Lamivudina (3TC)',
  secao: 5,
  classes: ['antirretrovirais'],
  apresentacoes: [
    ap('sol-oral-10', 'Solução oral 10 mg/mL', 'solucao-oral', ['VO'], { concentracaoPorMl: { valor: 10, unidade: 'mg' }, volumeMl: 240 }),
    ap('comp-150', 'Comprimido 150 mg', 'comprimido', ['VO'], { quantidade: { valor: 150, unidade: 'mg' } }),
  ],
  regras: [
    regra('rn-alto-risco', 'RN exposto ao HIV (alto risco)', RN, ['VO'], porKg(2, 2, 'mg'), 'MS', {
      condicoes: { igNascerSemanas: { de: 32 } },
      intervalosHoras: [12],
      observacoes: 'Por 28 dias.',
    }),
    regra('crianca', 'Tratamento do HIV', CRI_ADO, ['VO'], porKg(4, 4, 'mg'), 'MS', {
      intervalosHoras: [12],
      doseMaxima: { valor: 150, unidade: 'mg', por: 'dose' },
    }),
  ],
};

/** Item 21. */
export const raltegravir: Medicacao = {
  id: 'raltegravir',
  codigo: '21',
  nome: 'Raltegravir',
  secao: 5,
  classes: ['antirretrovirais'],
  apresentacoes: [
    ap('granulado-100', 'Granulado 100 mg (sachê) em 10 mL de água = 10 mg/mL (preparo A VALIDAR)', 'solucao-oral', ['VO'], {
      concentracaoPorMl: { valor: 10, unidade: 'mg' },
      volumeMl: 10,
    }),
    ap('mastigavel-25', 'Comprimido mastigável 25 mg', 'comprimido', ['VO'], { quantidade: { valor: 25, unidade: 'mg' } }),
    ap('mastigavel-100', 'Comprimido mastigável 100 mg', 'comprimido', ['VO'], { quantidade: { valor: 100, unidade: 'mg' } }),
  ],
  regras: [
    regra('rn-semana1', 'RN exposto ao HIV (alto risco)', RN, ['VO'], porKg(1.5, 1.5, 'mg'), 'MS', {
      condicoes: { idadeDias: { ate: 7 } },
      intervalosHoras: [24],
      observacoes: '≥ 37 semanas e ≥ 2 kg.',
    }),
    regra('rn-semana2a4', 'RN exposto ao HIV (alto risco)', ['RN', 'crianca'], ['VO'], porKg(3, 3, 'mg'), 'MS', {
      condicoes: { idadeDias: { de: 7, ate: 28 } },
      intervalosHoras: [12],
    }),
    regra('apos-4sem', 'RN exposto ao HIV (alto risco)', ['crianca'], ['VO'], porKg(6, 6, 'mg'), 'MS', {
      condicoes: { idadeDias: { de: 28 } },
      intervalosHoras: [12],
      observacoes: 'Se tratamento.',
    }),
  ],
};

/** Item 22. */
export const dolutegravir: Medicacao = {
  id: 'dolutegravir',
  codigo: '22',
  nome: 'Dolutegravir',
  secao: 5,
  classes: ['antirretrovirais'],
  apresentacoes: [
    ap('comp-50', 'Comprimido 50 mg', 'comprimido', ['VO'], { quantidade: { valor: 50, unidade: 'mg' } }),
    ap('disp-5', 'Comprimido dispersível 5 mg (verificar disponibilidade)', 'comprimido', ['VO'], { quantidade: { valor: 5, unidade: 'mg' } }),
  ],
  regras: [
    regra('20kg', 'Tratamento do HIV', CRI_ADO, ['VO'], fixa(50, 50, 'mg'), 'MS', { condicoes: { pesoKg: { de: 20 } }, intervalosHoras: [24] }),
    regra('menor20kg', 'Tratamento do HIV', CRI, ['VO'], texto('< 20 kg: dose por faixa de peso com comprimido dispersível (conferir tabela vigente do MS).'), 'MS', {
      condicoes: { pesoKg: { ate: 20 } },
    }),
  ],
};

// ============================================================
// 6. DEMAIS MEDICAÇÕES
// ============================================================

/** Item 24. */
export const salbutamol: Medicacao = {
  id: 'salbutamol',
  codigo: '24',
  nome: 'Salbutamol',
  secao: 6,
  classes: ['beta2-agonistas'],
  apresentacoes: [
    ap('spray-100', 'Spray 100 mcg/jato (com espaçador)', 'spray', ['inalatoria'], { quantidade: { valor: 100, unidade: 'mcg' } }),
    ap('nebulizacao-5', 'Solução para nebulização 5 mg/mL', 'nebulizacao', ['inalatoria'], { concentracaoPorMl: { valor: 5, unidade: 'mg' } }),
    ap('xarope-0-4', 'Xarope 0,4 mg/mL', 'solucao-oral', ['VO'], { concentracaoPorMl: { valor: 0.4, unidade: 'mg' }, volumeMl: 120 }),
  ],
  regras: [
    regra('asma-spray', 'Crise de asma (spray)', CRI_ADO, ['inalatoria'], porKg(50, 50, 'mcg'), 'SBP', {
      doseMaxima: { valor: 1000, unidade: 'mcg', por: 'dose' },
      observacoes: '≈ 1 jato/2 kg (mín 2, máx 10 jatos), 20/20 min na 1ª hora.',
    }),
    regra('asma-nebulizacao', 'Crise de asma (nebulização)', CRI_ADO, ['inalatoria'], porKg(0.15, 0.15, 'mg'), 'PALS', {
      doseMaxima: { valor: 5, unidade: 'mg', por: 'dose' },
      observacoes: 'Mín 2,5 mg; 20/20 min na 1ª hora.',
    }),
    regra('hipercalemia-menor25', 'Hipercalemia', CRI_ADO, ['inalatoria'], fixa(2.5, 2.5, 'mg'), 'PALS', { condicoes: { pesoKg: { ate: 25 } } }),
    regra('hipercalemia-25', 'Hipercalemia', CRI_ADO, ['inalatoria'], fixa(5, 5, 'mg'), 'PALS', { condicoes: { pesoKg: { de: 25 } } }),
  ],
};

/** Item 25. 1 gota = 0,25 mg (20 gotas/mL). */
export const fenoterol: Medicacao = {
  id: 'fenoterol',
  codigo: '25',
  nome: 'Fenoterol',
  secao: 6,
  classes: ['beta2-agonistas'],
  apresentacoes: [
    ap('gotas-5', 'Gotas 5 mg/mL (1 gota = 0,25 mg)', 'gotas', ['inalatoria'], { concentracaoPorMl: { valor: 5, unidade: 'mg' }, gotasPorMl: 20, volumeMl: 20 }),
    ap('spray-100', 'Spray 100 mcg/jato', 'spray', ['inalatoria'], { quantidade: { valor: 100, unidade: 'mcg' } }),
  ],
  regras: [
    regra('asma-nebulizacao', 'Crise de asma (nebulização)', CRI_ADO, ['inalatoria'], porKg(0.0833, 0.0833, 'mg'), 'SBP', {
      doseMaxima: { valor: 2.5, unidade: 'mg', por: 'dose' },
      observacoes: '1 gota/3 kg (máx 8–10 gotas) em 3–5 mL de SF, 20/20 min na 1ª hora. Prática brasileira.',
    }),
  ],
};

/** Item 26. 20 gotas = 1 mL. */
export const ipratropio: Medicacao = {
  id: 'ipratropio',
  codigo: '26',
  nome: 'Brometo de ipratrópio',
  secao: 6,
  classes: ['anticolinergicos'],
  apresentacoes: [
    ap('nebulizacao-0-25', 'Solução para nebulização 0,25 mg/mL (20 gotas = 1 mL)', 'gotas', ['inalatoria'], {
      concentracaoPorMl: { valor: 250, unidade: 'mcg' },
      gotasPorMl: 20,
      volumeMl: 20,
    }),
    ap('spray-20', 'Spray 20 mcg/jato', 'spray', ['inalatoria'], { quantidade: { valor: 20, unidade: 'mcg' } }),
  ],
  regras: [
    regra('ate12', 'Crise de asma moderada/grave', CRI_ADO, ['inalatoria'], fixa(250, 250, 'mcg'), 'GINA', {
      condicoes: { idadeAnos: { ate: 13 } },
      observacoes: '20 gotas, junto com o beta-2, 20/20 min, 3 doses na 1ª hora.',
    }),
    regra('maior12', 'Crise de asma moderada/grave', ADO, ['inalatoria'], fixa(500, 500, 'mcg'), 'GINA', {
      condicoes: { idadeAnos: { de: 13 } },
      observacoes: '40 gotas, 20/20 min, 3 doses na 1ª hora.',
    }),
  ],
};

/** Item 27. */
export const salmeterol: Medicacao = {
  id: 'salmeterol',
  codigo: '27',
  nome: 'Salmeterol + fluticasona',
  secao: 6,
  classes: ['beta2-longa-acao', 'corticoides-inalatorios'],
  apresentacoes: [
    ap('spray-25-50', 'Spray salmeterol 25 mcg + fluticasona 50 mcg/jato', 'spray', ['inalatoria'], { quantidade: { valor: 25, unidade: 'mcg' } }),
    ap('spray-25-125', 'Spray salmeterol 25 mcg + fluticasona 125 mcg/jato', 'spray', ['inalatoria'], { quantidade: { valor: 25, unidade: 'mcg' } }),
  ],
  regras: [
    regra('manutencao', 'Manutenção da asma (alta)', CRI_ADO, ['inalatoria'], fixa(50, 50, 'mcg'), 'GINA', {
      condicoes: { idadeAnos: { de: 4 } },
      intervalosHoras: [12],
      observacoes: '50 mcg de salmeterol 12/12h (ex.: 2 jatos do 25/50), SEMPRE com corticoide inalatório. Etapa do GINA A VALIDAR.',
    }),
  ],
  alertas: ['NUNCA salmeterol isolado nem como resgate.'],
};

/** Item 28. */
export const hidrocortisona: Medicacao = {
  id: 'hidrocortisona',
  codigo: '28',
  nome: 'Hidrocortisona',
  secao: 6,
  classes: ['corticoides'],
  apresentacoes: [
    ap('fa-100', 'Frasco-ampola 100 mg (pó)', 'frasco-ampola-po', ['EV', 'IM'], { quantidade: { valor: 100, unidade: 'mg' } }),
    ap('fa-500', 'Frasco-ampola 500 mg (pó)', 'frasco-ampola-po', ['EV', 'IM'], { quantidade: { valor: 500, unidade: 'mg' } }),
  ],
  regras: [
    regra('asma', 'Asma grave', CRI_ADO, ['EV'], porKg(4, 5, 'mg'), 'SBP', { intervalosHoras: [6], observacoes: 'Conferir dose máxima.' }),
    regra('adrenal-bolus-menor3', 'Crise adrenal (bolus)', ['RN', 'crianca'], ['EV', 'IM'], fixa(25, 25, 'mg'), 'SBP', { condicoes: { idadeAnos: { ate: 3 } } }),
    regra('adrenal-bolus-3a12', 'Crise adrenal (bolus)', CRI, ['EV', 'IM'], fixa(50, 50, 'mg'), 'SBP', { condicoes: { idadeAnos: { de: 3, ate: 12 } } }),
    regra('adrenal-bolus-12', 'Crise adrenal (bolus)', CRI_ADO, ['EV', 'IM'], fixa(100, 100, 'mg'), 'SBP', { condicoes: { idadeAnos: { de: 12 } } }),
    regra('adrenal-manutencao', 'Crise adrenal (manutenção)', TODAS, ['EV'], porM2(50, 100, 'mg', 'dia'), 'SBP', { intervalosHoras: [6] }),
    regra('choque-refratario', 'Choque refratário a catecolamina', TODAS, ['EV'], porM2(50, 50, 'mg', 'dia'), 'SSC', {
      intervalosHoras: [6],
      observacoes: 'Até 50 mg/m²/dia, com suspeita de insuficiência adrenal.',
    }),
  ],
};

/** Item 29. */
export const metilprednisolona: Medicacao = {
  id: 'metilprednisolona',
  codigo: '32b',
  nome: 'Metilprednisolona',
  secao: 6,
  classes: ['corticoides'],
  apresentacoes: [
    ap('fa-40', 'Frasco-ampola 40 mg (pó)', 'frasco-ampola-po', ['EV', 'IM'], { quantidade: { valor: 40, unidade: 'mg' } }),
    ap('fa-125', 'Frasco-ampola 125 mg (pó)', 'frasco-ampola-po', ['EV', 'IM'], { quantidade: { valor: 125, unidade: 'mg' } }),
    ap('fa-500', 'Frasco-ampola 500 mg (pó)', 'frasco-ampola-po', ['EV'], { quantidade: { valor: 500, unidade: 'mg' } }),
  ],
  regras: [
    regra('asma', 'Asma grave', CRI_ADO, ['EV'], porKg(1, 2, 'mg', 'dia'), 'SBP', {
      intervalosHoras: [6, 12],
      doseMaxima: { valor: 60, unidade: 'mg', por: 'dia' },
    }),
    regra('anafilaxia', 'Anafilaxia', CRI_ADO, ['EV'], porKg(1, 2, 'mg'), 'ASBAI', { doseMaxima: { valor: 125, unidade: 'mg', por: 'dose' } }),
    regra('pulso', 'Pulsoterapia', CRI_ADO, ['EV'], porKg(30, 30, 'mg', 'dia'), 'SBP', {
      intervalosHoras: [24],
      doseMaxima: { valor: 1000, unidade: 'mg', por: 'dia' },
      observacoes: 'Por 3–5 dias.',
    }),
  ],
};

/** Item 30. */
export const cortisona: Medicacao = {
  id: 'cortisona',
  codigo: '32',
  nome: 'Cortisona (acetato)',
  secao: 6,
  classes: ['corticoides'],
  apresentacoes: [ap('comp-25', 'Comprimido 25 mg (verificar disponibilidade no Brasil)', 'comprimido', ['VO'], { quantidade: { valor: 25, unidade: 'mg' } })],
  regras: [
    regra('reposicao', 'Reposição na insuficiência adrenal', CRI_ADO, ['VO'], texto('Dose equivalente a ~1,25× a da hidrocortisona (A VALIDAR com endocrinologia pediátrica).'), 'SBP'),
  ],
};

/** Item 31. */
export const prednisona: Medicacao = {
  id: 'prednisona',
  codigo: '29',
  nome: 'Prednisona',
  secao: 6,
  classes: ['corticoides'],
  receituario: 'simples',
  apresentacoes: [
    ap('comp-5', 'Comprimido 5 mg', 'comprimido', ['VO'], { quantidade: { valor: 5, unidade: 'mg' } }),
    ap('comp-20', 'Comprimido 20 mg', 'comprimido', ['VO'], { quantidade: { valor: 20, unidade: 'mg' } }),
  ],
  regras: [
    regra('asma', 'Asma (crise)', CRI_ADO, ['VO'], porKg(1, 2, 'mg', 'dia'), 'SBP', {
      intervalosHoras: [24],
      doseMaxima: { valor: 60, unidade: 'mg', por: 'dia' },
      observacoes: 'Por 3–5 dias. Rascunho diz "máx 40–60 mg/dia": usado 60 até conferir.',
    }),
    regra('nefrotica', 'Síndrome nefrótica', CRI_ADO, ['VO'], porKg(2, 2, 'mg', 'dia'), 'SBP', {
      intervalosHoras: [24],
      doseMaxima: { valor: 60, unidade: 'mg', por: 'dia' },
      observacoes: 'Ou 60 mg/m²/dia.',
    }),
  ],
};

/** Item 33. */
export const dexametasona: Medicacao = {
  id: 'dexametasona',
  codigo: '31',
  nome: 'Dexametasona',
  secao: 6,
  classes: ['corticoides'],
  apresentacoes: [
    ap('amp-4mg-ml', 'Ampola 4 mg/mL, 2,5 mL', 'ampola', ['EV', 'IM'], { quantidade: { valor: 10, unidade: 'mg' }, volumeMl: 2.5, concentracaoPorMl: { valor: 4, unidade: 'mg' } }),
    ap('elixir-0-1', 'Elixir 0,1 mg/mL', 'solucao-oral', ['VO'], { concentracaoPorMl: { valor: 0.1, unidade: 'mg' }, volumeMl: 120 }),
    ap('comp-4', 'Comprimido 4 mg', 'comprimido', ['VO'], { quantidade: { valor: 4, unidade: 'mg' } }),
  ],
  regras: [
    regra('crupe', 'Laringite (crupe)', CRI_ADO, ['VO', 'IM', 'EV'], porKg(0.15, 0.6, 'mg'), 'SBP', {
      doseMaxima: { valor: 16, unidade: 'mg', por: 'dose' },
      observacoes: 'Dose única. Rascunho diz "máx 10–16 mg": usado 16 até conferir.',
    }),
    regra('meningite', 'Meningite bacteriana', ['crianca', 'adolescente'], ['EV'], porKg(0.15, 0.15, 'mg'), 'SBP', {
      condicoes: { idadeDias: { de: 42 } },
      intervalosHoras: [6],
      observacoes: 'Por 2–4 dias, antes ou junto da 1ª dose de antibiótico (> 6 semanas).',
    }),
    regra('asma', 'Asma', CRI_ADO, ['VO', 'IM', 'EV'], porKg(0.6, 0.6, 'mg'), 'GINA', { doseMaxima: { valor: 16, unidade: 'mg', por: 'dose' }, observacoes: '1–2 doses.' }),
  ],
};

/** Item 35. */
export const amiodarona: Medicacao = {
  id: 'amiodarona',
  codigo: '34',
  nome: 'Amiodarona',
  secao: 6,
  classes: ['antiarritmicos'],
  apresentacoes: [
    ap('amp-50mg-ml', 'Ampola 50 mg/mL, 3 mL (150 mg)', 'ampola', ['EV', 'IO'], { quantidade: { valor: 150, unidade: 'mg' }, volumeMl: 3, concentracaoPorMl: { valor: 50, unidade: 'mg' } }),
  ],
  regras: [
    regra('pcr', 'PCR (FV/TV sem pulso)', CRI_ADO, ['EV', 'IO'], porKg(5, 5, 'mg'), 'PALS', {
      doseMaxima: { valor: 300, unidade: 'mg', por: 'dose' },
      observacoes: 'Bolus; pode repetir até 15 mg/kg.',
    }),
    regra('taquiarritmia', 'Taquiarritmia com pulso', CRI_ADO, ['EV'], porKg(5, 5, 'mg'), 'PALS', {
      doseMaxima: { valor: 300, unidade: 'mg', por: 'dose' },
      observacoes: 'Em 20–60 min.',
    }),
  ],
  alertas: ['Diluir em SG 5%.'],
};

/** Item 36. */
export const adenosina: Medicacao = {
  id: 'adenosina',
  codigo: '35',
  nome: 'Adenosina',
  secao: 6,
  classes: ['antiarritmicos'],
  apresentacoes: [
    ap('amp-3mg-ml', 'Ampola 3 mg/mL, 2 mL (6 mg)', 'ampola', ['EV', 'IO'], { quantidade: { valor: 6, unidade: 'mg' }, volumeMl: 2, concentracaoPorMl: { valor: 3, unidade: 'mg' } }),
  ],
  regras: [
    regra('tsv-1', 'TSV — 1ª dose', TODAS, ['EV', 'IO'], porKg(0.1, 0.1, 'mg'), 'PALS', { doseMaxima: { valor: 6, unidade: 'mg', por: 'dose' } }),
    regra('tsv-2', 'TSV — 2ª dose', TODAS, ['EV', 'IO'], porKg(0.2, 0.2, 'mg'), 'PALS', { doseMaxima: { valor: 12, unidade: 'mg', por: 'dose' } }),
  ],
  alertas: ['Bolus RÁPIDO seguido de flush de SF (duas seringas), em acesso próximo ao coração.'],
};

/** Item 37. */
export const flumazenil: Medicacao = {
  id: 'flumazenil',
  codigo: '36',
  nome: 'Flumazenil',
  secao: 6,
  classes: ['antidotos'],
  apresentacoes: [
    ap('amp-0-1mg-ml', 'Ampola 0,1 mg/mL, 5 mL (0,5 mg)', 'ampola', ['EV'], { quantidade: { valor: 0.5, unidade: 'mg' }, volumeMl: 5, concentracaoPorMl: { valor: 0.1, unidade: 'mg' } }),
  ],
  regras: [
    regra('intoxicacao-bzd', 'Intoxicação por benzodiazepínico', CRI_ADO, ['EV'], porKg(0.01, 0.01, 'mg'), 'PALS', {
      doseMaxima: { valor: 0.2, unidade: 'mg', por: 'dose' },
      observacoes: 'Em 15 s; repetir a cada 1 min até total de 0,05 mg/kg ou 1 mg.',
    }),
  ],
  alertas: ['Risco de convulsão em uso crônico de benzodiazepínico ou ingestão de tricíclico.'],
};

/** Item 38. */
export const glucagon: Medicacao = {
  id: 'glucagon',
  codigo: '37',
  nome: 'Glucagon',
  secao: 6,
  classes: ['hormonios'],
  apresentacoes: [ap('fa-1mg', 'Frasco-ampola 1 mg (kit com diluente)', 'frasco-ampola-po', ['IM', 'SC'], { quantidade: { valor: 1, unidade: 'mg' } })],
  regras: [
    regra('menor25', 'Hipoglicemia sem acesso venoso', CRI_ADO, ['IM', 'SC'], fixa(0.5, 0.5, 'mg'), 'ISPAD', { condicoes: { pesoKg: { ate: 25 } } }),
    regra('25', 'Hipoglicemia sem acesso venoso', CRI_ADO, ['IM', 'SC'], fixa(1, 1, 'mg'), 'ISPAD', { condicoes: { pesoKg: { de: 25 } } }),
  ],
};

/** Item 39. */
export const insulinaRegular: Medicacao = {
  id: 'insulina-regular',
  codigo: '38',
  nome: 'Insulina regular',
  secao: 6,
  classes: ['insulinas'],
  apresentacoes: [
    ap('frasco-100', 'Frasco 100 UI/mL, 10 mL', 'frasco-ampola-solucao', ['EV', 'SC'], {
      quantidade: { valor: 1000, unidade: 'UI' },
      volumeMl: 10,
      concentracaoPorMl: { valor: 100, unidade: 'UI' },
    }),
  ],
  regras: [
    regra('cad', 'Cetoacidose diabética', CRI_ADO, ['EV'], porKg(0.05, 0.1, 'UI', 'h'), 'ISPAD', {
      observacoes: 'Contínua, SEM bolus, iniciar 1–2 h após o início da hidratação. Solução usual 50 UI em 50 mL de SF (1 UI/mL).',
    }),
    regra('hipercalemia', 'Hipercalemia', CRI_ADO, ['EV'], porKg(0.1, 0.1, 'UI'), 'PALS', {
      doseMaxima: { valor: 10, unidade: 'UI', por: 'dose' },
      observacoes: 'Junto com glicose 0,5–1 g/kg.',
    }),
  ],
};

export const MEDICACOES_RASCUNHO: readonly Medicacao[] = [
  soroFisiologico,
  soroGlicosado5,
  soroGlicosado10,
  glicose25,
  glicose50,
  gluconatoCalcio,
  cloretoPotassio,
  cloretoSodio20,
  cloretoSodio3,
  ampicilina,
  gentamicina,
  vancomicina,
  penicilinaProcaina,
  penicilinaBenzatina,
  sulfadiazina,
  pirimetamina,
  acidoFolinico,
  zidovudina,
  lamivudina,
  raltegravir,
  dolutegravir,
  salbutamol,
  fenoterol,
  ipratropio,
  salmeterol,
  hidrocortisona,
  metilprednisolona,
  cortisona,
  prednisona,
  dexametasona,
  amiodarona,
  adenosina,
  flumazenil,
  glucagon,
  insulinaRegular,
];
