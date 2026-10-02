/**
 * Código de parada (PCR pediátrica) e folha de emergência por peso — DADOS.
 * ⚠️ TUDO "A VALIDAR": doses copiadas do docs/fase-0/doses-rascunho.md (PALS) e, onde o rascunho
 * não traz (energia do choque, tubo, ritmo do algoritmo), conhecimento geral do assistente (PALS 2020).
 * Nada daqui corrige o aluno como "verdade": a conta é conferida, a dose é provisória.
 */

import type { Ritmo } from '../casos/tipos';
import type { StatusValidacao } from './medicacoes/tipos';

const AV: StatusValidacao = 'A_VALIDAR';

export type GavetaCarrinho = 'vias-aereas' | 'acesso' | 'drogas' | 'fluidos';

export const NOME_GAVETA: Record<GavetaCarrinho, string> = {
  'vias-aereas': 'Gaveta 1 — Vias aéreas',
  acesso: 'Gaveta 2 — Acesso venoso / intraósseo',
  drogas: 'Gaveta 3 — Drogas',
  fluidos: 'Gaveta 4 — Fluidos',
};

/** Uma droga do carrinho: dose por kg, apresentação e (se preciso) diluição antes de aspirar. */
export interface DrogaParada {
  id: string;
  nome: string;
  /** Quando usar no código (texto curto). */
  quando: string;
  dosePorKg: number;
  unidade: 'mg' | 'g' | 'mL';
  doseMaxima?: number;
  via: string;
  /** Apresentação no carrinho. */
  apresentacao: string;
  /** Concentração da solução que vai para a seringa (depois da diluição, se houver), por mL. */
  concentracaoPorMl: number;
  /** Como preparar (texto), se precisar diluir. */
  preparo?: string;
  /** Repetir a cada… (texto). */
  repetir?: string;
  fonte: string;
  status: StatusValidacao;
}

export const DROGAS_PARADA: readonly DrogaParada[] = [
  {
    id: 'adrenalina',
    nome: 'Adrenalina 1:10.000',
    quando: 'Todo ritmo de PCR: não chocável o quanto antes; chocável depois do 2º choque',
    dosePorKg: 0.01,
    unidade: 'mg',
    doseMaxima: 1,
    via: 'EV/IO, seguida de flush de SF',
    apresentacao: 'Ampola 1 mg/mL (1:1.000)',
    concentracaoPorMl: 0.1,
    preparo: '1 mL da ampola + 9 mL de SF 0,9% = 10 mL com 0,1 mg/mL (1:10.000)',
    repetir: 'a cada 3 a 5 min',
    fonte: 'PALS (rascunho)',
    status: AV,
  },
  {
    id: 'amiodarona',
    nome: 'Amiodarona',
    quando: 'FV/TV sem pulso que continua depois do 3º choque',
    dosePorKg: 5,
    unidade: 'mg',
    doseMaxima: 300,
    via: 'EV/IO em bolus',
    apresentacao: 'Ampola 50 mg/mL, 3 mL',
    concentracaoPorMl: 50,
    repetir: 'pode repetir até 15 mg/kg',
    fonte: 'PALS (rascunho)',
    status: AV,
  },
  {
    id: 'glicose-25',
    nome: 'Glicose 25%',
    quando: 'Hipoglicemia (uma das causas reversíveis)',
    dosePorKg: 0.5,
    unidade: 'g',
    via: 'EV/IO',
    apresentacao: 'Ampola 10 mL (250 mg/mL = 0,25 g/mL)',
    concentracaoPorMl: 0.25,
    fonte: 'PALS (rascunho: 2–4 mL/kg)',
    status: AV,
  },
  {
    id: 'gluconato-calcio',
    nome: 'Gluconato de cálcio 10%',
    quando: 'Hipocalcemia ou hipercalemia (causas reversíveis)',
    dosePorKg: 60,
    unidade: 'mg',
    doseMaxima: 2000,
    via: 'EV/IO lento',
    apresentacao: 'Ampola 10 mL (100 mg/mL)',
    concentracaoPorMl: 100,
    fonte: 'PALS (rascunho: 60–100 mg/kg)',
    status: AV,
  },
];

/** Fluido de expansão (gaveta 4). */
export const EXPANSAO_PARADA = {
  id: 'sf-bolus',
  nome: 'SF 0,9% em bolus',
  quando: 'Hipovolemia (causa reversível), AESP',
  mlPorKg: 20,
  fonte: 'PALS (rascunho: 10–20 mL/kg)',
  status: AV,
} as const;

/** Energia do desfibrilador (J/kg). */
export const CHOQUE = {
  primeiroJKg: 2,
  seguintesJKg: 4,
  maximoJKg: 10,
  /** Dose de adulto (teto quando o J/kg passaria disso). */
  maximoAdultoJ: 200,
  fonte: 'PALS 2020 (não está no rascunho)',
  status: AV,
} as const;

/** Algoritmo: tempos. */
export const TEMPOS_PARADA = {
  cicloRcpS: 120,
  adrenalinaMinS: 180,
  adrenalinaMaxS: 300,
  /** Margem para a checagem de ritmo "a cada 2 min". */
  margemChecagemS: 20,
  /** Não chocável: 1ª adrenalina até… */
  primeiraAdrenalinaNaoChocavelS: 300,
  fonte: 'PALS 2020',
  status: AV,
} as const;

/** Tubo endotraqueal pela idade (≥ 1 ano): com cuff = idade/4 + 3,5; sem cuff = idade/4 + 4; profundidade ≈ 3 × diâmetro. */
export const TUBO = {
  comCuffSoma: 3.5,
  semCuffSoma: 4,
  /** < 1 ano (sem fórmula): tamanhos usuais. */
  menorDeUmAnoComCuff: 3.0,
  menorDeUmAnoSemCuff: 3.5,
  fonte: 'PALS (não está no rascunho)',
  status: AV,
} as const;

/** Causas reversíveis (Hs e Ts). */
export const CAUSAS_REVERSIVEIS = [
  'Hipovolemia',
  'Hipóxia',
  'Hidrogênio (acidose)',
  'Hipoglicemia',
  'Hipo/hipercalemia',
  'Hipotermia',
  'Tensão (pneumotórax)',
  'Tamponamento cardíaco',
  'Toxinas',
  'Trombose (pulmonar/coronária)',
] as const;

// ---- Cenários ---------------------------------------------------------------------

export interface CenarioParada {
  id: string;
  titulo: string;
  descricao: string;
  idadeAnos: number;
  idadeTexto: string;
  pesoKg: number;
  ritmoInicial: Extract<Ritmo, 'fv' | 'tv' | 'assistolia' | 'aesp'>;
  /** O que precisa acontecer (antes de uma checagem de ritmo) para o coração voltar (RCE). */
  retornoQuando: {
    adrenalinas?: number;
    choques?: number;
    /** Drogas/fluidos que precisam ter sido dados (ids). */
    exige?: readonly string[];
  };
  /** Causa reversível do cenário (para o relatório). */
  causa?: { nome: string; tratamento: string; id: string };
  /**
   * Compressões por série antes das 2 ventilações, sem via aérea avançada (equipe com 2 socorristas):
   * 15 no lactente e na criança; 30 no adolescente com puberdade (relação de adulto). Sem valor: 15.
   */
  relacaoCompressaoVentilacao?: 15 | 30;
  status: StatusValidacao;
}

export const CENARIOS_PARADA: readonly CenarioParada[] = [
  {
    id: 'assistolia-lactente',
    titulo: 'Lactente em assistolia',
    descricao: 'Lactente de 8 meses, encontrado sem respirar no berço. Sem pulso; o monitor mostra linha reta.',
    idadeAnos: 8 / 12,
    idadeTexto: '8 meses',
    pesoKg: 8,
    ritmoInicial: 'assistolia',
    retornoQuando: { adrenalinas: 2 },
    relacaoCompressaoVentilacao: 15,
    status: AV,
  },
  {
    id: 'fv-escolar',
    titulo: 'Escolar em fibrilação ventricular',
    descricao: 'Menino de 6 anos com cardiopatia conhecida, desmaiou na escola. Sem pulso; o monitor mostra FV.',
    idadeAnos: 6,
    idadeTexto: '6 anos',
    pesoKg: 20,
    ritmoInicial: 'fv',
    retornoQuando: { choques: 3, adrenalinas: 1, exige: ['amiodarona'] },
    relacaoCompressaoVentilacao: 15,
    status: AV,
  },
  {
    id: 'aesp-trauma',
    titulo: 'Adolescente em AESP (hipovolemia)',
    descricao: 'Adolescente de 13 anos, já com sinais de puberdade, atropelado, muito sangramento. O monitor mostra ritmo organizado, mas não há pulso.',
    idadeAnos: 13,
    idadeTexto: '13 anos',
    pesoKg: 45,
    ritmoInicial: 'aesp',
    retornoQuando: { adrenalinas: 1, exige: ['sf-bolus'] },
    causa: { nome: 'Hipovolemia', tratamento: 'SF 0,9% em bolus (e sangue/controle do sangramento)', id: 'sf-bolus' },
    relacaoCompressaoVentilacao: 30,
    status: AV,
  },
];
