/**
 * Monitor multiparamétrico (sem tela): alarmes por idade e traçados sintéticos de ECG e pletismografia.
 * Os traçados são desenhos didáticos (soma de curvas suaves), não sinais reais.
 */

import { type Faixa, LIMITES_ALARME, type LimitesAlarme } from '../dados/limites-alarme';
import { NOME_RITMO, type NomeSinal, type PadraoRespiratorio, type Ritmo, RITMOS_SEM_PULSO, type SinaisVitais } from '../casos/tipos';

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
  tecS: 'TEC',
  glasgow: 'Glasgow',
};

const SINAIS_COM_ALARME = ['fc', 'fr', 'spo2', 'paSistolica', 'temperaturaC', 'glicemiaMgDl'] as const;

/** Sinais fora dos limites da idade (A VALIDAR). Em ritmo sem pulso, o alarme é o do ritmo. */
export function alarmesAtivos(sinais: SinaisVitais, limites: LimitesAlarme, ritmo: Ritmo = 'sinusal'): Alarme[] {
  if (RITMOS_SEM_PULSO.includes(ritmo)) {
    return [{ sinal: 'fc', nivel: 'baixo', texto: `${ritmo === 'fv' ? 'FV' : ritmo === 'assistolia' ? 'ASSISTOLIA' : 'AESP'} — SEM PULSO` }];
  }
  const alarmes: Alarme[] = [];
  if (ritmo === 'tv') alarmes.push({ sinal: 'fc', nivel: 'alto', texto: 'TV' });
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
 * Fase 2 — forma da onda T (e onda U) pelo potássio do paciente. Desenho didático, A VALIDAR:
 * K alto → T alta e pontuda ("apiculada"); K baixo → T achatada e onda U aparecendo.
 */
export function ondaTPeloPotassio(k?: number): { altura: number; largura: number; u: number } {
  if (k === undefined || !Number.isFinite(k)) return { altura: 0.3, largura: 1, u: 0 };
  if (k >= 6) return { altura: Math.min(0.95, 0.3 + 0.3 * (k - 5.5)), largura: 0.65, u: 0 };
  if (k <= 3) return { altura: Math.max(0.05, 0.3 - 0.15 * (3.5 - k)), largura: 1.1, u: Math.min(0.2, 0.08 + 0.08 * (3 - k)) };
  return { altura: 0.3, largura: 1, u: 0 };
}

/**
 * ECG sintético (mV aproximados) no instante t (segundos) para uma FC.
 * As ondas têm duração fixa em segundos e encolhem só quando o batimento fica curto (taquicardia).
 * `k` (potássio, Fase 2) muda a onda T e a onda U.
 */
export function ecg(t: number, fc: number, k?: number): number {
  if (!(fc > 0)) return 0;
  const periodo = 60 / fc;
  const x = ((t % periodo) + periodo) % periodo;
  const escala = Math.min(1, periodo / 0.75);
  const r = 0.22 * escala;
  const onda = ondaTPeloPotassio(k);
  return (
    gauss(x, r - 0.12 * escala, 0.025 * escala, 0.12) + // P
    gauss(x, r - 0.03 * escala, 0.008 * escala, -0.12) + // Q
    gauss(x, r, 0.01 * escala, 1) + // R
    gauss(x, r + 0.03 * escala, 0.01 * escala, -0.25) + // S
    gauss(x, r + 0.26 * escala, 0.05 * escala * onda.largura, onda.altura) + // T
    (onda.u > 0 ? gauss(x, r + 0.42 * escala, 0.04 * escala, onda.u) : 0) // U (potássio baixo)
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

/**
 * Nome do ritmo para o monitor. O ritmo sinusal ganha "taqui"/"bradi" pela FC e pelos limites da idade.
 */
export function nomeDoRitmo(ritmo: Ritmo, fc: number, limites: LimitesAlarme): string {
  if (ritmo !== 'sinusal') return NOME_RITMO[ritmo];
  if (limites.fc.max !== undefined && fc > limites.fc.max) return 'Taquicardia sinusal';
  if (limites.fc.min !== undefined && fc < limites.fc.min) return 'Bradicardia sinusal';
  return NOME_RITMO.sinusal;
}

/** Fase (0 a 1) dentro do batimento, para um ritmo de `porMinuto` batimentos. */
function fase(t: number, porMinuto: number): number {
  const periodo = 60 / porMinuto;
  return (((t % periodo) + periodo) % periodo) / periodo;
}

/** QRS largo e "bizarro" (TV, escape ventricular): onda ampla para cima e T invertida. */
function complexoLargo(t: number, porMinuto: number): number {
  const periodo = 60 / porMinuto;
  const x = fase(t, porMinuto) * periodo;
  const escala = Math.min(1, periodo / 0.75);
  return gauss(x, 0.12 * escala, 0.05 * escala, 0.9) + gauss(x, 0.24 * escala, 0.06 * escala, -0.5) + gauss(x, 0.45 * escala, 0.08 * escala, -0.2);
}

/** Só a onda P (atividade dos átrios), para o BAV total. */
function ondaP(t: number, porMinuto: number): number {
  const periodo = 60 / porMinuto;
  return gauss(fase(t, porMinuto) * periodo, 0.06, 0.025, 0.14);
}

/**
 * ECG do monitor por ritmo (B11). Desenhos didáticos, não sinais reais:
 * - sinusal: P-QRS-T; TSV: QRS estreito rápido sem P; TV: complexos largos regulares;
 * - FV: ondas caóticas de amplitude variável; assistolia: linha quase reta;
 * - AESP: complexos organizados (lentos, se a FC for 0) sem pulso; BAV total: P e QRS largo sem relação.
 */
export function ecgDoRitmo(t: number, fc: number, ritmo: Ritmo, k?: number): number {
  switch (ritmo) {
    case 'sinusal':
      return ecg(t, fc, k);
    case 'tsv': {
      // sem P visível: o QRS e a T do batimento rápido
      const periodo = 60 / Math.max(fc, 1);
      const x = fase(t, Math.max(fc, 1)) * periodo;
      const escala = Math.min(1, periodo / 0.75);
      const r = 0.1 * escala;
      return gauss(x, r - 0.02 * escala, 0.008 * escala, -0.1) + gauss(x, r, 0.01 * escala, 1) + gauss(x, r + 0.025 * escala, 0.01 * escala, -0.2) + gauss(x, r + 0.2 * escala, 0.045 * escala, 0.25);
    }
    case 'tv':
      return complexoLargo(t, fc > 0 ? fc : 180);
    case 'fv': {
      const envelope = 0.65 + 0.35 * Math.sin(2 * Math.PI * 0.35 * t);
      return envelope * (0.35 * Math.sin(2 * Math.PI * 4.3 * t) + 0.25 * Math.sin(2 * Math.PI * 6.1 * t + 1) + 0.15 * Math.sin(2 * Math.PI * 8.7 * t + 2));
    }
    case 'assistolia':
      return 0.02 * Math.sin(2 * Math.PI * 0.3 * t);
    case 'aesp':
      return ecg(t, fc > 0 ? fc : 45, k);
    case 'bav-total':
      return ondaP(t, 110) + complexoLargo(t, fc > 0 ? fc : 45);
  }
}

/** Pletismografia por ritmo: sem pulso, linha reta; na TV, onda pequena (perfusão ruim). */
export function pletismografiaDoRitmo(t: number, fc: number, ritmo: Ritmo): number {
  if (RITMOS_SEM_PULSO.includes(ritmo)) return 0.02 * Math.sin(2 * Math.PI * 0.2 * t);
  const onda = pletismografia(t, fc);
  return ritmo === 'tv' ? onda * 0.35 : onda;
}

/** Os números que o monitor não consegue medir sem pulso aparecem como "---". */
export function semMedida(ritmo: Ritmo): { fc: boolean; spo2: boolean; pa: boolean } {
  const semPulso = RITMOS_SEM_PULSO.includes(ritmo);
  return { fc: ritmo === 'fv' || ritmo === 'assistolia', spo2: semPulso, pa: semPulso };
}

/**
 * Fase 2 — curva de respiração do monitor (impedância torácica), por padrão respiratório.
 * Desenho didático (0 = expiração; ~1 = inspiração normal):
 * - normal / taquipneia / bradipneia: ondas suaves na FR do paciente;
 * - desconforto: rápida, curta, com "entalhe" (tiragem);
 * - Kussmaul: profunda e regular; gasping: suspiros curtos e raros, linha reta entre eles;
 * - apneia: linha reta; assistida: ondas "quadradas" da bolsa/ventilador.
 */
export function respiracaoDoPadrao(t: number, fr: number, padrao: PadraoRespiratorio): number {
  if (padrao === 'apneia' || !(fr > 0)) return 0.02 * Math.sin(2 * Math.PI * 0.15 * t);
  if (padrao === 'gasping') {
    // um suspiro a cada ~5 s (ou na FR, se for menor), subida rápida e queda lenta
    const periodo = Math.max(5, 60 / fr);
    const x = ((t % periodo) + periodo) % periodo;
    return x < 0.25 ? x / 0.25 : Math.max(0, Math.exp(-(x - 0.25) / 0.35));
  }
  const periodo = 60 / fr;
  const fase = (((t % periodo) + periodo) % periodo) / periodo;
  const onda = 0.5 - 0.5 * Math.cos(2 * Math.PI * fase); // 0 → 1 → 0
  switch (padrao) {
    case 'kussmaul':
      return 1.6 * onda;
    case 'desconforto':
      return 0.6 * onda - 0.12 * Math.max(0, Math.sin(4 * Math.PI * fase)) * (fase < 0.5 ? 1 : 0);
    case 'assistida':
      return fase < 0.4 ? Math.min(1, fase / 0.08) : Math.max(0, 1 - (fase - 0.4) / 0.12);
    case 'taquipneia':
      return 0.75 * onda;
    default:
      return onda;
  }
}
