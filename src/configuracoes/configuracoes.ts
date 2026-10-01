/**
 * Configurações do usuário (sem tela): fonte das doses, nome da faixa etária, hospital,
 * modo treino × prova e margem de arredondamento. Ficam guardadas no próprio computador.
 */

import type { Tolerancia } from '../calculos';
import { FONTES_DE_FAIXA, type FonteDeFaixa } from '../dados/faixas-etarias';
import { type ConfiguracaoHospital, hospitalPorId, LISTA_HOSPITAIS } from '../dados/hospitais';
import type { CodigoFonte } from '../dados/medicacoes/tipos';

/** Treino: a conferência mostra a conta certa. Prova: mostra só certo/errado (gabarito escondido). */
export type ModoConferencia = 'treino' | 'prova';

export interface Configuracoes {
  /** Fonte preferida para as doses (cai para a SBP quando ela não tiver o valor). */
  fonteDose: CodigoFonte;
  /** Fonte que dá nome à faixa etária na tela. */
  fonteFaixa: FonteDeFaixa;
  hospitalId: string;
  /** Mudanças do usuário sobre o hospital escolhido (ex.: outro volume final da BIC). */
  ajustesHospital: Partial<Pick<ConfiguracaoHospital, 'volumeFinalBicMl' | 'horaInicial'>>;
  modo: ModoConferencia;
  /** Margem de arredondamento aceita, em % do valor certo (PROVISÓRIO: 1%, formulas.md item 8). */
  margemPct: number;
  /** B16: ao abrir um caso, sortear outro peso/idade/apresentação (dentro dos limites do caso). */
  variarCasos: boolean;
}

export const FONTES_DE_DOSE: readonly CodigoFonte[] = [
  'SBP',
  'MS',
  'AAP',
  'PALS',
  'NRP',
  'GINA',
  'ISPAD',
  'ASBAI',
  'NEOFAX',
  'SSC',
  'BULA',
  'HOSPITAL',
];

export const CONFIGURACOES_PADRAO: Configuracoes = {
  fonteDose: 'SBP',
  fonteFaixa: 'SBP',
  hospitalId: 'santa-casa',
  ajustesHospital: {},
  modo: 'treino',
  margemPct: 1,
  variarCasos: false,
};

/** Hospital escolhido já com os ajustes do usuário. */
export function hospitalAtual(config: Configuracoes): ConfiguracaoHospital {
  return { ...hospitalPorId(config.hospitalId), ...config.ajustesHospital };
}

export function toleranciaDe(config: Configuracoes): Tolerancia {
  return { relativa: config.margemPct / 100, absoluta: 0 };
}

const HORA = /^([01]\d|2[0-4]):[0-5]\d$/;

/**
 * Lê as configurações guardadas (texto JSON). Qualquer valor estranho volta ao padrão:
 * uma configuração corrompida nunca quebra o app.
 */
export function lerConfiguracoes(texto: string | null | undefined): Configuracoes {
  if (!texto) return CONFIGURACOES_PADRAO;
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return CONFIGURACOES_PADRAO;
  }
  if (typeof bruto !== 'object' || bruto === null) return CONFIGURACOES_PADRAO;
  const b = bruto as Record<string, unknown>;
  const p = CONFIGURACOES_PADRAO;
  const ajustes = (typeof b.ajustesHospital === 'object' && b.ajustesHospital !== null ? b.ajustesHospital : {}) as Record<
    string,
    unknown
  >;
  const volume = ajustes.volumeFinalBicMl;
  const hora = ajustes.horaInicial;
  const margem = b.margemPct;
  return {
    fonteDose: FONTES_DE_DOSE.includes(b.fonteDose as CodigoFonte) ? (b.fonteDose as CodigoFonte) : p.fonteDose,
    fonteFaixa: FONTES_DE_FAIXA.includes(b.fonteFaixa as FonteDeFaixa) ? (b.fonteFaixa as FonteDeFaixa) : p.fonteFaixa,
    hospitalId: LISTA_HOSPITAIS.some((h) => h.id === b.hospitalId) ? (b.hospitalId as string) : p.hospitalId,
    ajustesHospital: {
      ...(typeof volume === 'number' && volume > 0 && volume <= 100 && { volumeFinalBicMl: volume }),
      ...(typeof hora === 'string' && HORA.test(hora) && { horaInicial: hora }),
    },
    modo: b.modo === 'prova' ? 'prova' : 'treino',
    margemPct: typeof margem === 'number' && margem >= 0 && margem <= 20 ? margem : p.margemPct,
    variarCasos: b.variarCasos === true,
  };
}

export function escreverConfiguracoes(config: Configuracoes): string {
  return JSON.stringify(config);
}
