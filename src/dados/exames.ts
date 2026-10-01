/**
 * Catálogo de exames: o que cada exame mede, unidade, valor de referência e quanto tempo o
 * resultado demora no relógio do caso.
 * ⚠️ TUDO "A VALIDAR": valores de referência e tempos são de exemplo (escritos pelo assistente);
 * referências mudam com a idade e o laboratório. Os RESULTADOS de cada paciente ficam no arquivo do caso.
 */

import type { StatusValidacao } from './medicacoes/tipos';

export interface Analito {
  id: string;
  nome: string;
  unidade: string;
  /** Faixa de referência (A VALIDAR); vazia = sem referência numérica. */
  referencia?: { min?: number; max?: number };
}

export interface Exame {
  id: string;
  nome: string;
  grupo: 'Laboratório' | 'Gasometria' | 'Microbiologia' | 'Imagem' | 'Triagem neonatal';
  /** Minutos do relógio do caso até o resultado ficar pronto. */
  tempoResultadoMin: number;
  analitos: Analito[];
  /** Exame com laudo em texto (cultura, imagem). */
  laudo?: boolean;
  status: StatusValidacao;
}

export const EXAMES: readonly Exame[] = [
  {
    id: 'glicemia',
    nome: 'Glicemia sérica',
    grupo: 'Laboratório',
    tempoResultadoMin: 30,
    analitos: [{ id: 'glicose', nome: 'Glicose', unidade: 'mg/dL', referencia: { min: 70, max: 100 } }],
    status: 'A_VALIDAR',
  },
  {
    id: 'hemograma',
    nome: 'Hemograma',
    grupo: 'Laboratório',
    tempoResultadoMin: 60,
    analitos: [
      { id: 'hb', nome: 'Hemoglobina', unidade: 'g/dL', referencia: { min: 11, max: 14.5 } },
      { id: 'ht', nome: 'Hematócrito', unidade: '%', referencia: { min: 33, max: 43 } },
      { id: 'leucocitos', nome: 'Leucócitos', unidade: '/mm³', referencia: { min: 5000, max: 15000 } },
      { id: 'neutrofilos', nome: 'Neutrófilos', unidade: '%', referencia: { min: 30, max: 70 } },
      { id: 'bastoes', nome: 'Bastões', unidade: '%', referencia: { max: 5 } },
      { id: 'plaquetas', nome: 'Plaquetas', unidade: '/mm³', referencia: { min: 150000, max: 450000 } },
    ],
    status: 'A_VALIDAR',
  },
  {
    id: 'pcr',
    nome: 'Proteína C reativa',
    grupo: 'Laboratório',
    tempoResultadoMin: 60,
    analitos: [{ id: 'pcr', nome: 'PCR', unidade: 'mg/L', referencia: { max: 10 } }],
    status: 'A_VALIDAR',
  },
  {
    id: 'eletrolitos',
    nome: 'Eletrólitos (Na, K, Cl, Ca iônico, Mg)',
    grupo: 'Laboratório',
    tempoResultadoMin: 60,
    analitos: [
      { id: 'na', nome: 'Sódio', unidade: 'mEq/L', referencia: { min: 135, max: 145 } },
      { id: 'k', nome: 'Potássio', unidade: 'mEq/L', referencia: { min: 3.5, max: 5.5 } },
      { id: 'cl', nome: 'Cloro', unidade: 'mEq/L', referencia: { min: 98, max: 107 } },
      { id: 'cai', nome: 'Cálcio iônico', unidade: 'mmol/L', referencia: { min: 1.1, max: 1.35 } },
      { id: 'mg', nome: 'Magnésio', unidade: 'mg/dL', referencia: { min: 1.7, max: 2.4 } },
    ],
    status: 'A_VALIDAR',
  },
  {
    id: 'funcao-renal',
    nome: 'Ureia e creatinina',
    grupo: 'Laboratório',
    tempoResultadoMin: 60,
    analitos: [
      { id: 'ureia', nome: 'Ureia', unidade: 'mg/dL', referencia: { min: 10, max: 40 } },
      { id: 'creatinina', nome: 'Creatinina', unidade: 'mg/dL', referencia: { min: 0.2, max: 0.7 } },
    ],
    status: 'A_VALIDAR',
  },
  {
    id: 'gasometria-venosa',
    nome: 'Gasometria venosa',
    grupo: 'Gasometria',
    tempoResultadoMin: 15,
    analitos: [
      { id: 'ph', nome: 'pH', unidade: '', referencia: { min: 7.32, max: 7.42 } },
      { id: 'pco2', nome: 'pCO₂', unidade: 'mmHg', referencia: { min: 41, max: 51 } },
      { id: 'hco3', nome: 'HCO₃⁻', unidade: 'mEq/L', referencia: { min: 22, max: 26 } },
      { id: 'be', nome: 'BE', unidade: 'mEq/L', referencia: { min: -3, max: 3 } },
      { id: 'lactato', nome: 'Lactato', unidade: 'mmol/L', referencia: { max: 2 } },
    ],
    status: 'A_VALIDAR',
  },
  {
    id: 'gasometria-arterial',
    nome: 'Gasometria arterial',
    grupo: 'Gasometria',
    tempoResultadoMin: 15,
    analitos: [
      { id: 'ph', nome: 'pH', unidade: '', referencia: { min: 7.35, max: 7.45 } },
      { id: 'pco2', nome: 'pCO₂', unidade: 'mmHg', referencia: { min: 35, max: 45 } },
      { id: 'po2', nome: 'pO₂', unidade: 'mmHg', referencia: { min: 80, max: 100 } },
      { id: 'hco3', nome: 'HCO₃⁻', unidade: 'mEq/L', referencia: { min: 22, max: 26 } },
      { id: 'be', nome: 'BE', unidade: 'mEq/L', referencia: { min: -3, max: 3 } },
      { id: 'sato2', nome: 'SatO₂', unidade: '%', referencia: { min: 95 } },
      { id: 'lactato', nome: 'Lactato', unidade: 'mmol/L', referencia: { max: 2 } },
    ],
    status: 'A_VALIDAR',
  },
  {
    id: 'bilirrubinas',
    nome: 'Bilirrubinas',
    grupo: 'Laboratório',
    tempoResultadoMin: 60,
    analitos: [
      { id: 'bt', nome: 'Bilirrubina total', unidade: 'mg/dL' },
      { id: 'bd', nome: 'Bilirrubina direta', unidade: 'mg/dL', referencia: { max: 1 } },
      { id: 'bi', nome: 'Bilirrubina indireta', unidade: 'mg/dL' },
    ],
    status: 'A_VALIDAR',
  },
  {
    id: 'hemocultura',
    nome: 'Hemocultura',
    grupo: 'Microbiologia',
    tempoResultadoMin: 48 * 60,
    analitos: [],
    laudo: true,
    status: 'A_VALIDAR',
  },
  {
    id: 'urina',
    nome: 'Urina tipo 1 (EAS)',
    grupo: 'Laboratório',
    tempoResultadoMin: 60,
    analitos: [],
    laudo: true,
    status: 'A_VALIDAR',
  },
  {
    id: 'procalcitonina',
    nome: 'Procalcitonina',
    grupo: 'Laboratório',
    tempoResultadoMin: 120,
    analitos: [{ id: 'pct', nome: 'Procalcitonina', unidade: 'ng/mL', referencia: { max: 0.5 } }],
    status: 'A_VALIDAR',
  },
  {
    id: 'cetonemia',
    nome: 'Cetonemia (beta-hidroxibutirato)',
    grupo: 'Laboratório',
    tempoResultadoMin: 30,
    analitos: [{ id: 'bhb', nome: 'Beta-hidroxibutirato', unidade: 'mmol/L', referencia: { max: 0.6 } }],
    status: 'A_VALIDAR',
  },
  {
    id: 'coagulograma',
    nome: 'Coagulograma',
    grupo: 'Laboratório',
    tempoResultadoMin: 90,
    analitos: [
      { id: 'tp-inr', nome: 'TP (INR)', unidade: '', referencia: { max: 1.2 } },
      { id: 'ttpa', nome: 'TTPa (relação)', unidade: '', referencia: { max: 1.2 } },
    ],
    status: 'A_VALIDAR',
  },
  { id: 'vdrl', nome: 'VDRL', grupo: 'Laboratório', tempoResultadoMin: 120, analitos: [], laudo: true, status: 'A_VALIDAR' },
  { id: 'liquor', nome: 'Líquor (citologia, bioquímica, VDRL, cultura)', grupo: 'Laboratório', tempoResultadoMin: 120, analitos: [], laudo: true, status: 'A_VALIDAR' },
  { id: 'carga-viral-hiv', nome: 'Carga viral do HIV (RNA)', grupo: 'Laboratório', tempoResultadoMin: 7 * 24 * 60, analitos: [], laudo: true, status: 'A_VALIDAR' },
  { id: 'sorologia-toxo', nome: 'Sorologia para toxoplasmose', grupo: 'Laboratório', tempoResultadoMin: 24 * 60, analitos: [], laudo: true, status: 'A_VALIDAR' },
  { id: 'fundo-de-olho', nome: 'Fundo de olho', grupo: 'Imagem', tempoResultadoMin: 120, analitos: [], laudo: true, status: 'A_VALIDAR' },
  { id: 'usg-transfontanela', nome: 'USG transfontanela', grupo: 'Imagem', tempoResultadoMin: 120, analitos: [], laudo: true, status: 'A_VALIDAR' },
  { id: 'ecg', nome: 'ECG de 12 derivações', grupo: 'Imagem', tempoResultadoMin: 10, analitos: [], laudo: true, status: 'A_VALIDAR' },
  {
    id: 'rx-torax',
    nome: 'Radiografia de tórax',
    grupo: 'Imagem',
    tempoResultadoMin: 30,
    analitos: [],
    laudo: true,
    status: 'A_VALIDAR',
  },
];

export function examePorId(id: string): Exame | undefined {
  return EXAMES.find((e) => e.id === id);
}
