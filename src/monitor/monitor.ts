/**
 * Monitor multiparamétrico (sem tela): alarmes por idade e traçados sintéticos de ECG e pletismografia.
 * Os traçados são desenhos didáticos (soma de curvas suaves), não sinais reais.
 */

import { type Faixa, LIMITES_ALARME, type LimitesAlarme } from '../dados/limites-alarme';
import type { NomeSinal, SinaisVitais } from '../casos/tipos';

export function limitesParaIdade(idadeDias: number): LimitesAlarme {
  const faixas = LIMITES_ALARME.faixas;
  return faixas.find((f) => idadeDias < f.ateDias) ?? (faixas[faixas.length - 1] as LimitesAlarme);
}

export interface Alarme {
  sinal: NomeSinal;
  nivel: 'alto' | 'baixo';
  texto: string;
}

const NOME_ALARME: Record<NomeSinal, string> = {
  fc: 'FC',
  fr: 'FR',
  spo2: 'SpO₂',
  paSistolica: 'PA sistólica',
  paDiastolica: 'PA diastólica',
  temperaturaC: 'Temperatura',
  glicemiaMgDl: 'Glicemia',
};

const SINAIS_COM_ALARME = ['fc', 'fr', 'spo2', 'paSistolica', 'temperaturaC', 'glicemiaMgDl'] as const;

/** Sinais fora dos limites da idade (A VALIDAR). */
export function alarmesAtivos(sinais: SinaisVitais, limites: LimitesAlarme): Alarme[] {
  const alarmes: Alarme[] = [];
  for (const sinal of SINAIS_COM_ALARME) {
    const faixa: Faixa = limites[sinal];
    const valor = sinais[sinal];
    if (faixa.min !== undefined && valor < faixa.min) {
      alarmes.push({ sinal, nivel: 'baixo', texto: `${NOME_ALARME[sinal]} BAIXA` });
    } else if (faixa.max !== undefined && valor > faixa.max) {
      alarmes.push({ sinal, nivel: 'alto', texto: `${NOME_ALARME[sinal]} ALTA` });
    }
  }
  return alarmes;
}

function gauss(x: number, centro: number, largura: number, altura: number): number {
  return altura * Math.exp(-((x - centro) ** 2) / (2 * largura ** 2));
}

/**
 * ECG sintético (mV aproximados) no instante t (segundos) para uma FC.
 * As ondas têm duração fixa em segundos e encolhem só quando o batimento fica curto (taquicardia).
 */
export function ecg(t: number, fc: number): number {
  if (!(fc > 0)) return 0;
  const periodo = 60 / fc;
  const x = ((t % periodo) + periodo) % periodo;
  const escala = Math.min(1, periodo / 0.75);
  const r = 0.22 * escala;
  return (
    gauss(x, r - 0.12 * escala, 0.025 * escala, 0.12) + // P
    gauss(x, r - 0.03 * escala, 0.008 * escala, -0.12) + // Q
    gauss(x, r, 0.01 * escala, 1) + // R
    gauss(x, r + 0.03 * escala, 0.01 * escala, -0.25) + // S
    gauss(x, r + 0.26 * escala, 0.05 * escala, 0.3) // T
  );
}

/** Pletismografia sintética (0 a ~1): sobe logo depois do QRS, com incisura dicrótica. */
export function pletismografia(t: number, fc: number): number {
  if (!(fc > 0)) return 0;
  const periodo = 60 / fc;
  const x = ((t % periodo) + periodo) % periodo;
  const escala = Math.min(1, periodo / 0.75);
  return gauss(x, 0.38 * escala, 0.07 * escala, 1) + gauss(x, 0.58 * escala, 0.07 * escala, 0.35);
}
