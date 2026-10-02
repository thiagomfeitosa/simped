/**
 * Oxigenoterapia ligada ao paciente (sem tela) — modelo didático, A VALIDAR.
 *
 * A SpO₂ que o caso escreve é a do paciente EM AR AMBIENTE. Com O₂, a SpO₂ medida sai de:
 * 1) pO₂ alveolar: PAO₂ = FiO₂ × (760 − 47) − pCO₂ ÷ 0,8;
 * 2) quanto o pulmão "perde" no caminho (gradiente A-a), estimado pela SpO₂ em ar ambiente
 *    e que cresce um pouco com a FiO₂;
 * 3) curva da hemoglobina (fórmula de Severinghaus): pO₂ → SpO₂.
 * Em apneia ou gasping, O₂ sem ventilar não adianta: só bolsa-válvula-máscara ou ventilador.
 */

import type { PadraoRespiratorio } from '../casos/tipos';
import { type DefinicaoDispositivo, DISPOSITIVOS_O2, type DispositivoO2, MODELO_O2 } from '../dados/oxigenio-a-validar';

export interface EstadoOxigenio {
  dispositivo: DispositivoO2;
  fluxoLMin?: number;
  fio2: number;
}

export const AR_AMBIENTE: EstadoOxigenio = { dispositivo: 'ar', fio2: 0.21 };

export function dispositivo(id: DispositivoO2): DefinicaoDispositivo {
  return DISPOSITIVOS_O2.find((d) => d.id === id) ?? DISPOSITIVOS_O2[0]!;
}

/** FiO₂ aproximada de um dispositivo (pelo fluxo) ou a FiO₂ ajustada (CPAP/ventilador). */
export function fio2DoDispositivo(id: DispositivoO2, fluxoLMin?: number, fio2Ajustada?: number): number {
  const d = dispositivo(id);
  if (d.ajuste === 'fio2') return Math.min(1, Math.max(0.21, fio2Ajustada ?? d.fio2Padrao ?? 0.21));
  const f = d.fio2!;
  const fluxo = Math.min(d.fluxo?.max ?? 0, Math.max(d.fluxo?.min ?? 0, fluxoLMin ?? d.fluxo?.padrao ?? 0));
  return Math.min(f.teto, f.base + f.porLitro * (fluxo - (d.fluxo?.min ?? 0)));
}

/** Saturação da hemoglobina (%) para uma pO₂ (mmHg) — Severinghaus. */
export function saturacaoDaPo2(po2: number): number {
  if (po2 <= 0) return 0;
  return 100 / (23400 / (po2 ** 3 + 150 * po2) + 1);
}

/** O caminho inverso (pO₂ que dá esta saturação), por busca binária. */
export function po2DaSaturacao(spo2: number): number {
  const alvo = Math.min(99.9, Math.max(1, spo2));
  let baixo = 1;
  let alto = 700;
  for (let i = 0; i < 60; i++) {
    const meio = (baixo + alto) / 2;
    if (saturacaoDaPo2(meio) < alvo) baixo = meio;
    else alto = meio;
  }
  return (baixo + alto) / 2;
}

/** pO₂ alveolar (mmHg). */
export function po2Alveolar(fio2: number, pco2: number): number {
  return fio2 * (MODELO_O2.pressaoBarometrica - MODELO_O2.pressaoVaporAgua) - pco2 / MODELO_O2.quocienteRespiratorio;
}

export interface Oxigenacao {
  spo2: number;
  po2: number;
  fio2: number;
  /** O₂ não ajuda (apneia/gasping sem ventilar). */
  semEfeito: boolean;
}

/** SpO₂ e pO₂ com o O₂ instalado, a partir da SpO₂ em ar ambiente do paciente. */
export function oxigenar(entrada: { spo2Ar: number; oxigenio: EstadoOxigenio; pco2: number; padrao: PadraoRespiratorio }): Oxigenacao {
  const { spo2Ar, oxigenio, padrao } = entrada;
  const pco2 = Math.max(15, entrada.pco2);
  const ventila = !!dispositivo(oxigenio.dispositivo).ventila;
  const semVentilar = (padrao === 'apneia' || padrao === 'gasping') && !ventila;
  const po2Ar = po2DaSaturacao(spo2Ar);
  if (oxigenio.fio2 <= 0.21 + 1e-9 || semVentilar) {
    return { spo2: spo2Ar, po2: po2Ar, fio2: oxigenio.fio2, semEfeito: semVentilar && oxigenio.fio2 > 0.21 };
  }
  // ventilando, a pCO₂ do alvéolo volta ao normal; o pulmão "perde" o gradiente estimado em ar ambiente
  const pco2Efetiva = ventila ? 40 : pco2;
  const alveolarAr = po2Alveolar(0.21, ventila ? 40 : pco2);
  const gradienteAr = Math.max(MODELO_O2.gradienteMinimo, alveolarAr - po2Ar);
  const alveolar = po2Alveolar(oxigenio.fio2, pco2Efetiva);
  const gradiente = gradienteAr * Math.sqrt(Math.max(1, alveolar / Math.max(1, alveolarAr)));
  const po2 = Math.max(po2Ar, alveolar - gradiente);
  return { spo2: Math.min(100, saturacaoDaPo2(po2)), po2, fio2: oxigenio.fio2, semEfeito: false };
}
