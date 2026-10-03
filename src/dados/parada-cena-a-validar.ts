/**
 * Código de parada: animação da RCP (cena que todos veem) — DADOS.
 * ⚠️ "A VALIDAR": faixas do desenho do paciente e técnica de compressão por faixa —
 * AHA/PALS 2020 e NRP, conhecimento geral do assistente, não está no rascunho.
 * Os tempos da animação (TEMPOS_CENA) são só visuais (duração dos movimentos na tela), não clínicos:
 * os alvos clínicos da RCP ficam em parada-rcp-a-validar.ts.
 */

import type { FaixaPaciente, TecnicaCompressao } from '../parada/cena';
import type { StatusValidacao } from './medicacoes/tipos';

const AV: StatusValidacao = 'A_VALIDAR';
const FONTE = 'AHA/PALS 2020 e NRP — conhecimento geral do assistente, não está no rascunho';

/** Faixa em que o paciente é desenhado (tamanho do corpo e técnica de compressão). */
export const FAIXAS_CENA = {
  /** RN: menos de 28 dias de vida. */
  rnMenosDeDias: 28,
  /** Lactente: menos de 1 ano. */
  lactenteMenosDeAnos: 1,
  /** Adolescente: a partir de 12 anos... */
  adolescenteAPartirDeAnos: 12,
  /** ...ou cenário com a relação de adulto (30:2, puberdade). */
  relacaoDeAdolescente: 30,
  fonte: FONTE,
  status: AV,
} as const;

export interface TecnicaDaFaixa {
  tecnica: TecnicaCompressao;
  /** Como comprimir (texto para a legenda e a ajuda). */
  texto: string;
  /** Profundidade da compressão (texto). */
  profundidade: string;
  fonte: string;
  status: StatusValidacao;
}

/** Técnica de compressão mostrada na animação, por faixa. */
export const TECNICA_POR_FAIXA: Record<FaixaPaciente, TecnicaDaFaixa> = {
  rn: {
    tecnica: 'dois-polegares',
    texto: 'Dois polegares no terço inferior do esterno, com as mãos envolvendo o tórax (2 socorristas)',
    profundidade: '1/3 do diâmetro anteroposterior do tórax',
    fonte: FONTE,
    status: AV,
  },
  lactente: {
    tecnica: 'dois-polegares',
    texto: 'Dois polegares logo abaixo da linha dos mamilos, com as mãos envolvendo o tórax (2 socorristas)',
    profundidade: '1/3 do diâmetro anteroposterior (cerca de 4 cm)',
    fonte: FONTE,
    status: AV,
  },
  crianca: {
    tecnica: 'uma-mao',
    texto: 'Uma ou duas mãos na metade inferior do esterno',
    profundidade: '1/3 do diâmetro anteroposterior (cerca de 5 cm)',
    fonte: FONTE,
    status: AV,
  },
  adolescente: {
    tecnica: 'duas-maos',
    texto: 'Duas mãos (uma sobre a outra) na metade inferior do esterno',
    profundidade: '1/3 do diâmetro anteroposterior (5 a 6 cm, como no adulto)',
    fonte: FONTE,
    status: AV,
  },
};

/** Tempos da animação (s) — só visuais, não clínicos. */
export const TEMPOS_CENA = {
  /** Tórax descendo em cada compressão. */
  descidaCompressaoS: 0.12,
  /** Tórax voltando (retorno total). */
  subidaCompressaoS: 0.2,
  /** Sem compressão há mais que isto: o compressor fica com as mãos paradas no tórax (pausa). */
  comprimindoAteS: 1.5,
  /** Quem apertou a última compressão fica no tórax por este tempo (mostra a troca na hora). */
  compressorNoToraxS: 3,
  /** Uma ventilação (bolsa apertada, tórax sobe e desce). */
  ventilacaoS: 1,
  /** Balão de fala. */
  balaoS: 4,
  /** Balão curto ("Choque!"). */
  balaoCurtoS: 2,
  /** Pausa da checagem de ritmo (RCP automática). */
  checagemS: 5,
  /** Com as teclas, a checagem dura até a próxima compressão, no máximo isto. */
  checagemMaximaS: 10,
  /** Desfibrilador enchendo a carga (barra do aparelho). */
  cargaS: 2,
  /** Clarão e tranco do choque. */
  choqueS: 0.6,
  /** Injetar uma droga ou fluido; pegar o acesso. */
  acaoCurtaS: 4,
  /** Intubação. */
  intubandoS: 5,
  /** Anotar na folha. */
  anotandoS: 2,
  /** Balão "Temos pulso!" depois do retorno da circulação. */
  rceS: 4,
  /** RCP automática (sem teclas): compressões por minuto. */
  automaticaPorMin: 110,
  /** RCP automática sem via aérea avançada: pausa para as 2 ventilações. */
  pausaVentilacoesS: 3,
  /** RCP automática com via aérea avançada: 1 ventilação a cada... */
  ventilacaoComViaCadaS: 2.5,
} as const;
