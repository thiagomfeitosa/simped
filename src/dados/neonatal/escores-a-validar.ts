/**
 * Escores do RN que se somam item a item (Apgar e Boletim de Silverman-Andersen) — DADOS.
 * ⚠️ A VALIDAR: transcrição do assistente (Apgar 1953; Silverman & Andersen 1956; MS 2014).
 * As faixas de interpretação variam entre livros: conferir no documento escolhido.
 */

import type { StatusValidacao } from '../medicacoes/tipos';
import type { CriterioMaturidade, FonteNeonatal } from './maturidade-a-validar';

export interface FaixaEscore {
  /** Vale de `de` até `ate` (inclusive). */
  de: number;
  ate: number;
  texto: string;
  tom: 'normal' | 'atencao' | 'perigo';
}

export interface EscoreClinico {
  id: 'apgar' | 'silverman';
  nome: string;
  quando: string;
  /** Nota alta = melhor (Apgar) ou pior (Silverman). */
  maiorEMelhor: boolean;
  criterios: CriterioMaturidade[];
  faixas: FaixaEscore[];
  fonte: FonteNeonatal;
  status: StatusValidacao;
}

const AV: StatusValidacao = 'A_VALIDAR';

export const ESCORES_RN: readonly EscoreClinico[] = [
  {
    id: 'apgar',
    nome: 'Apgar',
    quando: 'No 1º e no 5º minuto de vida (e a cada 5 min até 20 min se < 7). Não é usado para decidir reanimar: a reanimação começa antes.',
    maiorEMelhor: true,
    criterios: [
      {
        id: 'fc',
        nome: 'Frequência cardíaca',
        comoExaminar: 'Ausculta do precórdio ou palpação do cordão por 6 s (× 10).',
        tipo: 'somatico',
        opcoes: [
          { pontos: 0, texto: 'Ausente' },
          { pontos: 1, texto: 'Menor que 100 bpm' },
          { pontos: 2, texto: '100 bpm ou mais' },
        ],
      },
      {
        id: 'respiracao',
        nome: 'Respiração',
        comoExaminar: 'Observe o esforço respiratório e o choro.',
        tipo: 'somatico',
        opcoes: [
          { pontos: 0, texto: 'Ausente' },
          { pontos: 1, texto: 'Irregular, fraca' },
          { pontos: 2, texto: 'Regular, choro forte' },
        ],
      },
      {
        id: 'tonus',
        nome: 'Tônus muscular',
        comoExaminar: 'Postura e movimentos dos membros.',
        tipo: 'neurologico',
        opcoes: [
          { pontos: 0, texto: 'Flácido' },
          { pontos: 1, texto: 'Alguma flexão dos membros' },
          { pontos: 2, texto: 'Movimentos ativos, boa flexão' },
        ],
      },
      {
        id: 'irritabilidade',
        nome: 'Irritabilidade reflexa',
        comoExaminar: 'Resposta à sonda nasal ou ao estímulo da planta do pé.',
        tipo: 'neurologico',
        opcoes: [
          { pontos: 0, texto: 'Ausente' },
          { pontos: 1, texto: 'Careta' },
          { pontos: 2, texto: 'Choro, tosse ou espirro' },
        ],
      },
      {
        id: 'cor',
        nome: 'Cor',
        comoExaminar: 'Cor do tronco e das extremidades.',
        tipo: 'somatico',
        opcoes: [
          { pontos: 0, texto: 'Cianose ou palidez generalizada' },
          { pontos: 1, texto: 'Corpo róseo, extremidades cianóticas' },
          { pontos: 2, texto: 'Completamente róseo' },
        ],
      },
    ],
    faixas: [
      { de: 0, ate: 3, texto: 'Baixo (0 a 3)', tom: 'perigo' },
      { de: 4, ate: 6, texto: 'Moderadamente baixo (4 a 6)', tom: 'atencao' },
      { de: 7, ate: 10, texto: 'Tranquilizador (7 a 10)', tom: 'normal' },
    ],
    fonte: { referencia: 'Apgar V, 1953; AAP/ACOG "The Apgar Score" (2015); MS 2014 — A VALIDAR', documentoId: 'MS-ATENCAO-RN' },
    status: AV,
  },
  {
    id: 'silverman',
    nome: 'Boletim de Silverman-Andersen',
    quando: 'RN com esforço respiratório: quantifica o desconforto (0 = nenhum; quanto maior, pior). Repetir para ver a evolução.',
    maiorEMelhor: false,
    criterios: [
      {
        id: 'toracoabdominal',
        nome: 'Movimentos tórax–abdome',
        comoExaminar: 'Observe se tórax e abdome sobem juntos na inspiração.',
        tipo: 'somatico',
        opcoes: [
          { pontos: 0, texto: 'Sincrônicos (sobem juntos)' },
          { pontos: 1, texto: 'Tórax parado, só o abdome se move' },
          { pontos: 2, texto: 'Balancim (tórax afunda quando o abdome sobe)' },
        ],
      },
      {
        id: 'tiragem',
        nome: 'Tiragem intercostal',
        comoExaminar: 'Afundamento entre as costelas na inspiração.',
        tipo: 'somatico',
        opcoes: [
          { pontos: 0, texto: 'Ausente' },
          { pontos: 1, texto: 'Discreta' },
          { pontos: 2, texto: 'Acentuada' },
        ],
      },
      {
        id: 'xifoide',
        nome: 'Retração xifoide',
        comoExaminar: 'Afundamento logo abaixo do esterno.',
        tipo: 'somatico',
        opcoes: [
          { pontos: 0, texto: 'Ausente' },
          { pontos: 1, texto: 'Discreta' },
          { pontos: 2, texto: 'Acentuada' },
        ],
      },
      {
        id: 'asa-nasal',
        nome: 'Batimento de asa do nariz',
        comoExaminar: 'As narinas abrem a cada inspiração.',
        tipo: 'somatico',
        opcoes: [
          { pontos: 0, texto: 'Ausente' },
          { pontos: 1, texto: 'Discreto' },
          { pontos: 2, texto: 'Acentuado' },
        ],
      },
      {
        id: 'gemido',
        nome: 'Gemido expiratório',
        comoExaminar: 'Som na expiração (glote fechada para manter o pulmão aberto).',
        tipo: 'somatico',
        opcoes: [
          { pontos: 0, texto: 'Ausente' },
          { pontos: 1, texto: 'Audível só com estetoscópio' },
          { pontos: 2, texto: 'Audível sem estetoscópio' },
        ],
      },
    ],
    faixas: [
      { de: 0, ate: 0, texto: 'Sem desconforto respiratório', tom: 'normal' },
      { de: 1, ate: 3, texto: 'Desconforto leve', tom: 'atencao' },
      { de: 4, ate: 6, texto: 'Desconforto moderado', tom: 'perigo' },
      { de: 7, ate: 10, texto: 'Desconforto grave (falência respiratória iminente)', tom: 'perigo' },
    ],
    fonte: { referencia: 'Silverman WA, Andersen DH. Pediatrics 1956; MS 2014 — faixas A VALIDAR', documentoId: 'MS-ATENCAO-RN' },
    status: AV,
  },
];
