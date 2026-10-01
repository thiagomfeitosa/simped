/**
 * Limites de alarme do monitor por idade.
 * ⚠️ TUDO "A VALIDAR": valores de exemplo escritos pelo assistente para o monitor funcionar.
 * O usuário confere na fonte (PALS, SBP...) e troca aqui, sem mexer no monitor.
 */

import type { StatusValidacao } from './medicacoes/tipos';

export interface Faixa {
  min?: number;
  max?: number;
}

export interface LimitesAlarme {
  /** Vale até esta idade em dias (exclusive). */
  ateDias: number;
  nome: string;
  fc: Faixa;
  fr: Faixa;
  spo2: Faixa;
  paSistolica: Faixa;
  temperaturaC: Faixa;
  glicemiaMgDl: Faixa;
}

const ANO = 365.25;

export const LIMITES_ALARME: { status: StatusValidacao; faixas: readonly LimitesAlarme[] } = {
  status: 'A_VALIDAR',
  faixas: [
    {
      ateDias: 28,
      nome: 'RN',
      fc: { min: 100, max: 180 },
      fr: { min: 30, max: 60 },
      spo2: { min: 92 },
      paSistolica: { min: 60 },
      temperaturaC: { min: 36.5, max: 37.5 },
      glicemiaMgDl: { min: 45, max: 150 },
    },
    {
      ateDias: ANO,
      nome: 'Lactente < 1 ano',
      fc: { min: 100, max: 160 },
      fr: { min: 30, max: 53 },
      spo2: { min: 92 },
      paSistolica: { min: 70 },
      temperaturaC: { min: 35.5, max: 37.8 },
      glicemiaMgDl: { min: 60, max: 180 },
    },
    {
      ateDias: 3 * ANO,
      nome: '1 a 3 anos',
      fc: { min: 90, max: 150 },
      fr: { min: 22, max: 37 },
      spo2: { min: 92 },
      paSistolica: { min: 72 },
      temperaturaC: { min: 35.5, max: 37.8 },
      glicemiaMgDl: { min: 60, max: 180 },
    },
    {
      ateDias: 6 * ANO,
      nome: '3 a 6 anos',
      fc: { min: 80, max: 140 },
      fr: { min: 20, max: 28 },
      spo2: { min: 92 },
      paSistolica: { min: 76 },
      temperaturaC: { min: 35.5, max: 37.8 },
      glicemiaMgDl: { min: 60, max: 180 },
    },
    {
      ateDias: 12 * ANO,
      nome: '6 a 12 anos',
      fc: { min: 70, max: 120 },
      fr: { min: 18, max: 25 },
      spo2: { min: 92 },
      paSistolica: { min: 82 },
      temperaturaC: { min: 35.5, max: 37.8 },
      glicemiaMgDl: { min: 60, max: 180 },
    },
    {
      ateDias: Infinity,
      nome: '12 anos ou mais',
      fc: { min: 60, max: 100 },
      fr: { min: 12, max: 20 },
      spo2: { min: 92 },
      paSistolica: { min: 90 },
      temperaturaC: { min: 35.5, max: 37.8 },
      glicemiaMgDl: { min: 60, max: 180 },
    },
  ],
};
