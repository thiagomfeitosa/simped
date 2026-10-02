/**
 * B14 — Complicações que o professor pode disparar com um clique.
 * ⚠️ TUDO A VALIDAR: valores escritos pelo assistente, só para o paciente reagir de forma didática.
 * 'soma' = variação somada ao valor do momento (vale para qualquer idade); 'alvo' = valor final.
 */

import type { EstadoClinico, NomeVariavel } from '../casos/tipos';
import type { StatusValidacao } from './medicacoes/tipos';

export interface Complicacao {
  id: string;
  nome: string;
  /** O que o professor vê no botão (ex.: o que vai acontecer). */
  descricao: string;
  /** Sinais vitais e, desde a Fase 2, variáveis de laboratório (ex.: lactato, HCO₃⁻). */
  mudancas: { sinal: NomeVariavel; alvo: number; duracaoMin: number; modo?: 'alvo' | 'soma' }[];
  clinico?: Partial<EstadoClinico>;
  /** Mensagem sugerida para o aluno (o professor pode mandar ou não). */
  mensagemSugerida?: string;
  status: StatusValidacao;
}

const AV: StatusValidacao = 'A_VALIDAR';

export const COMPLICACOES: readonly Complicacao[] = [
  {
    id: 'convulsao',
    nome: 'Convulsão',
    descricao: 'Glasgow cai, FC e FR sobem, SpO₂ cai; na gasometria, lactato e pCO₂ sobem (acidose mista).',
    mudancas: [
      { sinal: 'glasgow', alvo: 6, duracaoMin: 1 },
      { sinal: 'fc', alvo: 30, duracaoMin: 2, modo: 'soma' },
      { sinal: 'spo2', alvo: -8, duracaoMin: 3, modo: 'soma' },
      // Fase 2: acidose mista na gasometria (lática + respiratória)
      { sinal: 'lactato', alvo: 4, duracaoMin: 5, modo: 'soma' },
      { sinal: 'hco3', alvo: -5, duracaoMin: 5, modo: 'soma' },
      { sinal: 'pco2', alvo: 15, duracaoMin: 3, modo: 'soma' },
    ],
    clinico: { padraoRespiratorio: 'gasping' },
    mensagemSugerida: 'A enfermagem chama: o paciente está convulsionando (movimentos tônico-clônicos generalizados).',
    status: AV,
  },
  {
    id: 'dessaturacao',
    nome: 'Dessaturação',
    descricao: 'SpO₂ cai para 82%, FR sobe, desconforto respiratório.',
    mudancas: [
      { sinal: 'spo2', alvo: 82, duracaoMin: 3 },
      { sinal: 'fr', alvo: 12, duracaoMin: 3, modo: 'soma' },
    ],
    clinico: { padraoRespiratorio: 'desconforto' },
    status: AV,
  },
  {
    id: 'apneia',
    nome: 'Apneia',
    descricao: 'Para de respirar: FR 0, SpO₂ despenca, bradicardia.',
    mudancas: [
      { sinal: 'fr', alvo: 0, duracaoMin: 0 },
      { sinal: 'spo2', alvo: 70, duracaoMin: 3 },
      { sinal: 'fc', alvo: -40, duracaoMin: 3, modo: 'soma' },
    ],
    clinico: { padraoRespiratorio: 'apneia' },
    status: AV,
  },
  {
    id: 'choque',
    nome: 'Choque / hipotensão',
    descricao: 'PA cai, FC sobe, TEC 5 s, Glasgow cai um pouco.',
    mudancas: [
      { sinal: 'paSistolica', alvo: -30, duracaoMin: 10, modo: 'soma' },
      { sinal: 'paDiastolica', alvo: -15, duracaoMin: 10, modo: 'soma' },
      { sinal: 'fc', alvo: 30, duracaoMin: 10, modo: 'soma' },
      { sinal: 'tecS', alvo: 5, duracaoMin: 10 },
      { sinal: 'glasgow', alvo: -2, duracaoMin: 10, modo: 'soma' },
    ],
    status: AV,
  },
  {
    id: 'febre',
    nome: 'Febre alta',
    descricao: 'Temperatura 39,8 °C, FC e FR sobem.',
    mudancas: [
      { sinal: 'temperaturaC', alvo: 39.8, duracaoMin: 30 },
      { sinal: 'fc', alvo: 20, duracaoMin: 30, modo: 'soma' },
      { sinal: 'fr', alvo: 6, duracaoMin: 30, modo: 'soma' },
    ],
    status: AV,
  },
  {
    id: 'hipoglicemia',
    nome: 'Hipoglicemia',
    descricao: 'Glicemia 35 mg/dL, Glasgow cai.',
    mudancas: [
      { sinal: 'glicemiaMgDl', alvo: 35, duracaoMin: 10 },
      { sinal: 'glasgow', alvo: -3, duracaoMin: 10, modo: 'soma' },
    ],
    status: AV,
  },
  {
    id: 'bradicardia',
    nome: 'Bradicardia',
    descricao: 'FC cai pela metade em 2 min.',
    mudancas: [{ sinal: 'fc', alvo: 50, duracaoMin: 2 }],
    status: AV,
  },
  {
    id: 'tsv',
    nome: 'TSV',
    descricao: 'Ritmo vira TSV com FC 250.',
    mudancas: [{ sinal: 'fc', alvo: 250, duracaoMin: 0 }],
    clinico: { ritmo: 'tsv' },
    status: AV,
  },
  {
    id: 'pcr-fv',
    nome: 'PCR em FV',
    descricao: 'Fibrilação ventricular: sem pulso, Glasgow 3.',
    mudancas: [
      { sinal: 'fc', alvo: 0, duracaoMin: 0 },
      { sinal: 'paSistolica', alvo: 0, duracaoMin: 0 },
      { sinal: 'paDiastolica', alvo: 0, duracaoMin: 0 },
      { sinal: 'spo2', alvo: 0, duracaoMin: 1 },
      { sinal: 'glasgow', alvo: 3, duracaoMin: 0 },
    ],
    clinico: { ritmo: 'fv', padraoRespiratorio: 'apneia' },
    status: AV,
  },
  {
    id: 'pcr-assistolia',
    nome: 'PCR em assistolia',
    descricao: 'Assistolia: sem pulso, Glasgow 3.',
    mudancas: [
      { sinal: 'fc', alvo: 0, duracaoMin: 0 },
      { sinal: 'paSistolica', alvo: 0, duracaoMin: 0 },
      { sinal: 'paDiastolica', alvo: 0, duracaoMin: 0 },
      { sinal: 'spo2', alvo: 0, duracaoMin: 1 },
      { sinal: 'glasgow', alvo: 3, duracaoMin: 0 },
    ],
    clinico: { ritmo: 'assistolia', padraoRespiratorio: 'apneia' },
    status: AV,
  },
  {
    id: 'anafilaxia',
    nome: 'Reação anafilática',
    descricao: 'Hipotensão, broncoespasmo, SpO₂ cai.',
    mudancas: [
      { sinal: 'paSistolica', alvo: -25, duracaoMin: 5, modo: 'soma' },
      { sinal: 'fc', alvo: 30, duracaoMin: 5, modo: 'soma' },
      { sinal: 'spo2', alvo: -8, duracaoMin: 5, modo: 'soma' },
    ],
    clinico: { padraoRespiratorio: 'desconforto' },
    mensagemSugerida: 'Urticária generalizada e edema de lábios começaram logo após a última medicação.',
    status: AV,
  },
];
