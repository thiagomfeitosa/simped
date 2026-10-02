/**
 * Código de parada: ritmo da RCP (compressões e ventilações apertando teclas) e a técnica de
 * aplicar as drogas (flush, elevar o membro) — DADOS.
 * ⚠️ TUDO "A VALIDAR": conhecimento geral do assistente (AHA/PALS 2020); não está no rascunho.
 * A relação compressão:ventilação de cada cenário fica no próprio cenário (parada-a-validar.ts).
 */

import type { StatusValidacao } from './medicacoes/tipos';

const AV: StatusValidacao = 'A_VALIDAR';

export const RCP = {
  /** Frequência das compressões (por minuto). */
  compressoesPorMin: { min: 100, max: 120 },
  /** Relação padrão quando o cenário não define: 15:2 (dois socorristas, lactente e criança). */
  relacaoPadrao: 15,
  /** Ventilações em cada pausa (sem via aérea avançada). */
  ventilacoesPorPausa: 2,
  /** Com via aérea avançada: compressões contínuas e 1 ventilação a cada 2–3 s (20–30/min). */
  ventilacoesPorMinComVia: { min: 20, max: 30 },
  /** Pausa nas compressões maior que isto é longa demais (mãos fora do tórax). */
  pausaMaximaS: 10,
  /** Intervalo entre duas compressões maior que isto já conta como pausa (fração de compressão). */
  intervaloQueViraPausaS: 1.5,
  /** Meta da fração de compressão torácica (tempo comprimindo ÷ tempo de código). */
  metaFracao: 0.8,
  /** Compressão a menos disto (s) do choque = alguém tocando o paciente no choque. */
  janelaChoqueS: 0.6,
  fonte: 'AHA/PALS 2020 (não está no rascunho)',
  status: AV,
} as const;

/** Como aplicar cada droga do carrinho (texto de apoio e o que entra no debriefing). */
export const ADMINISTRACAO_DROGA = {
  /** Flush de SF 0,9% depois de cada droga (mL) — referência mostrada no modo treino. */
  flushMl: { min: 5, max: 10 },
  /** Elevar o membro por alguns segundos depois da droga em acesso periférico. */
  elevarMembroS: { min: 10, max: 20 },
  fonte: 'AHA/PALS 2020 (não está no rascunho)',
  status: AV,
} as const;
