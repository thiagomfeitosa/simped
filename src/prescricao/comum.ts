/**
 * Peças comuns da folha de prescrição (sem tela): leitura de números digitados,
 * formatação, conversão de unidades de droga e o formato das verificações.
 */

import { converterMassa, type UnidadeDeMassa } from '../calculos';
import type { UnidadeDroga } from '../dados/medicacoes/tipos';

/**
 * Lê um número digitado em português: "0,48", "0.48", "1.000,5".
 * Com vírgula, os pontos são separadores de milhar; sem vírgula, o ponto é a casa decimal.
 * Devolve null se o texto estiver vazio ou não for um número.
 */
export function lerNumero(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, '');
  if (limpo === '') return null;
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(normalizado)) return null;
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : null;
}

/** Número para mostrar ao aluno (0,48 · 15,5 · 4.000). */
export function formatarNumero(valor: number): string {
  const abs = Math.abs(valor);
  const casas = abs < 1 ? 4 : abs < 100 ? 2 : 1;
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas });
}

const MASSAS: readonly string[] = ['g', 'mg', 'mcg'];

/** Converte entre unidades de droga quando possível (mesma unidade ou g/mg/mcg). Senão, null. */
export function converterDroga(valor: number, de: UnidadeDroga, para: UnidadeDroga): number | null {
  if (de === para) return valor;
  if (MASSAS.includes(de) && MASSAS.includes(para)) {
    return converterMassa(valor, de as UnidadeDeMassa, para as UnidadeDeMassa);
  }
  return null;
}

/** 'atencao' = aviso que não é erro; 'a-validar' = referência ainda não conferida (não corrige). */
export type Situacao = 'certo' | 'errado' | 'atencao' | 'a-validar';

export interface Verificacao {
  assunto:
    | 'secao'
    | 'via'
    | 'volume'
    | 'unidades'
    | 'dose'
    | 'intervalo'
    | 'fonte'
    | 'alerta'
    | 'preenchimento'
    | 'diluicao'
    | 'bic'
    | 'infusao';
  situacao: Situacao;
  texto: string;
}

/** Folga para ruído de ponto flutuante (ex.: 11.700000000000001). */
export const RUIDO_NUMERICO = 1e-9;
