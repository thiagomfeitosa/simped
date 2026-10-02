/**
 * Desenvolvimento neuropsicomotor (DNPM) — DADOS.
 *
 * ⚠️ TUDO "A VALIDAR": marcos por faixa etária no formato do instrumento de vigilância do
 * desenvolvimento (AIDPI / Caderneta da Criança, MS), escritos pelo assistente de memória.
 * Cada faixa tem 4 marcos (social, motor fino, linguagem, motor grosso). Conferir as idades
 * e a redação na Caderneta vigente. Reflexos e sinais de alerta: idem.
 */

import type { StatusValidacao } from '../medicacoes/tipos';

const AV: StatusValidacao = 'A_VALIDAR';

export type Dominio = 'social' | 'motor-fino' | 'linguagem' | 'motor-grosso';

export const NOME_DOMINIO: Record<Dominio, string> = {
  social: 'Social / afetivo',
  'motor-fino': 'Motor fino / adaptativo',
  linguagem: 'Linguagem',
  'motor-grosso': 'Motor grosso',
};

export interface Marco {
  id: string;
  texto: string;
  dominio: Dominio;
  /** Como testar na consulta. */
  comoTestar: string;
  /** Desenho da pose (motor grosso) ou da atividade (src/ilustracoes/Desenvolvimento.tsx). */
  desenho?: string;
}

export interface FaixaDesenvolvimento {
  id: string;
  /** Rótulo da faixa (ex.: "6 a 9 meses"). */
  rotulo: string;
  /** Vale de deMeses (inclusive) até ateMeses (exclusive). */
  deMeses: number;
  ateMeses: number;
  marcos: Marco[];
  status: StatusValidacao;
}

const m = (id: string, dominio: Dominio, texto: string, comoTestar: string, desenho?: string): Marco => ({ id, dominio, texto, comoTestar, ...(desenho && { desenho }) });

export const FAIXAS_DNPM: readonly FaixaDesenvolvimento[] = [
  {
    id: '0-1',
    rotulo: 'até 1 mês',
    deMeses: 0,
    ateMeses: 1,
    status: AV,
    marcos: [
      m('rosto', 'social', 'Observa um rosto', 'Com o bebê de barriga para cima, aproxime o rosto a ~30 cm: ele fixa o olhar.'),
      m('maos-fletidas', 'motor-fino', 'Postura: braços e pernas fletidos', 'De barriga para cima, os membros ficam dobrados.', 'flexao'),
      m('reage-som', 'linguagem', 'Reage ao som', 'Bata palmas fora da vista: ele pisca, se assusta ou para de mexer.'),
      m('eleva-cabeca', 'motor-grosso', 'Eleva a cabeça por instantes (de bruços)', 'De bruços, levanta a cabeça por alguns segundos.', 'prono-cabeca'),
    ],
  },
  {
    id: '1-2',
    rotulo: '1 a 2 meses',
    deMeses: 1,
    ateMeses: 2,
    status: AV,
    marcos: [
      m('sorriso', 'social', 'Sorriso social quando estimulado', 'Converse e sorria para ele: sorri de volta.'),
      m('abre-maos', 'motor-fino', 'Abre as mãos', 'Observe as mãos: ficam abertas boa parte do tempo.'),
      m('emite-sons', 'linguagem', 'Emite sons (vocaliza)', 'Faz sons guturais, "arrulhos".'),
      m('movimenta', 'motor-grosso', 'Movimenta ativamente os membros', 'Mexe braços e pernas com vigor, dos dois lados.', 'flexao'),
    ],
  },
  {
    id: '2-4',
    rotulo: '2 a 4 meses',
    deMeses: 2,
    ateMeses: 4,
    status: AV,
    marcos: [
      m('contato-social', 'social', 'Resposta ativa ao contato social', 'Sorri, vocaliza e se agita quando alguém conversa com ele.'),
      m('segura', 'motor-fino', 'Segura objetos', 'Encoste um chocalho na mão: ele segura por alguns segundos.', 'segurar'),
      m('ri', 'linguagem', 'Ri alto / vocaliza em resposta', 'Ri em voz alta nas brincadeiras.'),
      m('antebracos', 'motor-grosso', 'De bruços, levanta a cabeça e o tronco apoiado nos antebraços', 'De bruços, sustenta a cabeça a 90° apoiado nos antebraços.', 'prono-antebracos'),
    ],
  },
  {
    id: '4-6',
    rotulo: '4 a 6 meses',
    deMeses: 4,
    ateMeses: 6,
    status: AV,
    marcos: [
      m('busca-objeto', 'social', 'Busca ativa de objetos', 'Mostre um brinquedo: estende o braço para pegar.'),
      m('leva-boca', 'motor-fino', 'Leva objetos à boca', 'Pega o brinquedo e leva à boca.'),
      m('localiza-som', 'linguagem', 'Localiza o som', 'Faça barulho de lado, fora da vista: vira a cabeça para o som.'),
      m('rola', 'motor-grosso', 'Muda de posição ativamente (rola)', 'Rola de barriga para cima para de bruços (ou o contrário).', 'rolar'),
    ],
  },
  {
    id: '6-9',
    rotulo: '6 a 9 meses',
    deMeses: 6,
    ateMeses: 9,
    status: AV,
    marcos: [
      m('esconde-achou', 'social', 'Brinca de esconde-achou', 'Esconda o rosto com um pano: ele procura ou ri quando você aparece.'),
      m('transfere', 'motor-fino', 'Transfere objetos de uma mão para a outra', 'Dê um cubo: ele passa para a outra mão.'),
      m('silabas', 'linguagem', 'Duplica sílabas ("papa", "dada")', 'Escute: repete sílabas iguais.'),
      m('senta', 'motor-grosso', 'Senta sem apoio', 'Sentado, fica sem apoio das mãos por um tempo.', 'sentar'),
    ],
  },
  {
    id: '9-12',
    rotulo: '9 a 12 meses',
    deMeses: 9,
    ateMeses: 12,
    status: AV,
    marcos: [
      m('imita-gestos', 'social', 'Imita gestos (tchau, bater palmas)', 'Faça "tchau": ele repete.'),
      m('pinca', 'motor-fino', 'Faz pinça (polegar e indicador)', 'Ofereça um objeto pequeno (com segurança): pega com a ponta dos dedos.', 'pinca'),
      m('jargao', 'linguagem', 'Produz "jargão" (fala sem palavras, com entonação)', 'Escute: "conversa" com entonação de frase.'),
      m('anda-apoio', 'motor-grosso', 'Anda com apoio', 'Segurando nos móveis ou na mão do adulto, dá passos.', 'andar-apoio'),
    ],
  },
  {
    id: '12-15',
    rotulo: '12 a 15 meses',
    deMeses: 12,
    ateMeses: 15,
    status: AV,
    marcos: [
      m('mostra', 'social', 'Mostra o que quer (aponta)', 'Pergunte o que quer: ele aponta.'),
      m('caneca', 'motor-fino', 'Coloca blocos dentro de uma caneca', 'Mostre como põe o cubo na caneca: ele imita.'),
      m('uma-palavra', 'linguagem', 'Fala uma palavra (além de papá e mamã)', 'Pergunte à família quais palavras ele fala.'),
      m('anda-sozinho', 'motor-grosso', 'Anda sem apoio', 'Anda sozinho, mesmo com as pernas afastadas.', 'andar'),
    ],
  },
  {
    id: '15-18',
    rotulo: '15 a 18 meses',
    deMeses: 15,
    ateMeses: 18,
    status: AV,
    marcos: [
      m('colher', 'social', 'Usa colher ou garfo', 'Pergunte se come sozinho com a colher.'),
      m('torre-2', 'motor-fino', 'Constrói torre de 2 cubos', 'Mostre como empilhar: faz uma torre de 2.', 'torre'),
      m('tres-palavras', 'linguagem', 'Fala 3 palavras', 'Fala ao menos 3 palavras com significado.'),
      m('anda-tras', 'motor-grosso', 'Anda para trás', 'Puxando um brinquedo, anda alguns passos de costas.', 'andar'),
    ],
  },
  {
    id: '18-24',
    rotulo: '18 a 24 meses',
    deMeses: 18,
    ateMeses: 24,
    status: AV,
    marcos: [
      m('tira-roupa', 'social', 'Tira a roupa', 'Consegue tirar alguma peça (meia, calça) sozinho.'),
      m('torre-3', 'motor-fino', 'Constrói torre de 3 cubos', 'Empilha 3 cubos.', 'torre'),
      m('aponta-figuras', 'linguagem', 'Aponta 2 figuras', 'Mostre figuras: aponta 2 quando você pede.'),
      m('chuta', 'motor-grosso', 'Chuta a bola', 'Chuta a bola sem cair.', 'chutar'),
    ],
  },
  {
    id: '24-36',
    rotulo: '2 a 3 anos',
    deMeses: 24,
    ateMeses: 36,
    status: AV,
    marcos: [
      m('veste-supervisao', 'social', 'Veste-se com supervisão', 'Coloca uma peça de roupa com ajuda.'),
      m('torre-6', 'motor-fino', 'Constrói torre de 6 cubos', 'Empilha 6 cubos.', 'torre'),
      m('frase-2', 'linguagem', 'Frases com 2 palavras', 'Junta 2 palavras ("quer água").'),
      m('pula', 'motor-grosso', 'Pula com os dois pés', 'Pula no lugar com os dois pés juntos.', 'pular'),
    ],
  },
  {
    id: '36-48',
    rotulo: '3 a 4 anos',
    deMeses: 36,
    ateMeses: 48,
    status: AV,
    marcos: [
      m('brinca-outras', 'social', 'Brinca com outras crianças', 'Pergunte se brinca junto (não só ao lado) com outras crianças.'),
      m('linha-vertical', 'motor-fino', 'Imita uma linha vertical', 'Faça uma linha vertical: ele copia.', 'desenho-linha'),
      m('reconhece-acoes', 'linguagem', 'Reconhece 2 ações', 'Mostre figuras: aponta quem "come", quem "corre".'),
      m('arremessa', 'motor-grosso', 'Arremessa a bola', 'Joga a bola por cima do ombro.', 'arremessar'),
    ],
  },
  {
    id: '48-60',
    rotulo: '4 a 5 anos',
    deMeses: 48,
    ateMeses: 60,
    status: AV,
    marcos: [
      m('veste-sozinho', 'social', 'Veste-se sem ajuda', 'Pergunte se veste a roupa sozinho.'),
      m('copia-circulo', 'motor-fino', 'Copia um círculo', 'Mostre um círculo pronto: ele copia.', 'desenho-circulo'),
      m('adjetivos', 'linguagem', 'Compreende adjetivos (grande, pequeno...)', 'Pergunte: "qual é o maior?"'),
      m('um-pe', 'motor-grosso', 'Equilibra-se em um pé só', 'Fica num pé só por alguns segundos.', 'um-pe'),
    ],
  },
];

/** Reflexos primitivos: até quando costumam durar (meses). A VALIDAR. */
export const REFLEXOS_PRIMITIVOS: readonly { nome: string; como: string; ateMeses: string; alerta: string }[] = [
  { nome: 'Moro', como: 'Soltar a cabeça alguns cm (apoiada): abre os braços e depois "abraça".', ateMeses: '4 a 6 meses', alerta: 'Assimétrico (lesão de plexo, fratura) ou persistente depois de 6 meses.' },
  { nome: 'Sucção e busca (voracidade)', como: 'Tocar o canto da boca: vira a cabeça e procura sugar.', ateMeses: '3 a 4 meses (depois vira voluntário)', alerta: 'Fraco ou ausente no RN (sepse, hipoglicemia, depressão neurológica).' },
  { nome: 'Preensão palmar', como: 'Colocar o dedo na palma: a mão fecha.', ateMeses: '4 a 6 meses', alerta: 'Persistente: atraso / paralisia cerebral.' },
  { nome: 'Preensão plantar', como: 'Pressionar a base dos dedos do pé: os dedos dobram.', ateMeses: '9 a 15 meses (antes de andar)', alerta: 'Ausente no RN pode indicar lesão.' },
  { nome: 'Tônico-cervical assimétrico (RTCA, "esgrimista")', como: 'Virar a cabeça para um lado: estende o braço desse lado e flete o outro.', ateMeses: '3 a 4 meses', alerta: 'Persistente ou obrigatório: paralisia cerebral.' },
  { nome: 'Marcha reflexa', como: 'Segurar em pé com os pés na superfície: faz movimentos de marcha.', ateMeses: '1 a 2 meses', alerta: '—' },
  { nome: 'Paraquedas (reação de proteção)', como: 'Inclinar para a frente em direção à mesa: estende os braços.', ateMeses: 'aparece aos 8–9 meses e fica para sempre', alerta: 'Ausente aos 12 meses: investigar.' },
];

/** Sinais de alerta em qualquer consulta (encaminhar). A VALIDAR. */
export const SINAIS_DE_ALERTA_DNPM: readonly string[] = [
  'Perda de habilidades que já tinha (em qualquer idade)',
  'Não sustenta a cabeça aos 4 meses',
  'Não senta sem apoio aos 9 meses',
  'Não anda sozinho aos 18 meses',
  'Não aponta nem dá tchau aos 12 meses; não fala palavras aos 16 meses',
  'Pouco contato visual, não atende pelo nome (triagem para autismo com M-CHAT entre 16 e 30 meses)',
  'Assimetria persistente de movimentos ou de tônus',
  'Perímetro cefálico abaixo de −2 ou acima de +2 escores z',
];

/** Fatores de risco para o desenvolvimento (exemplos, A VALIDAR). */
export const FATORES_DE_RISCO_DNPM: readonly string[] = [
  'Prematuridade ou baixo peso ao nascer',
  'Asfixia, icterícia grave, convulsões ou UTI neonatal',
  'Infecções congênitas (TORCHS, zika)',
  'Pré-natal ausente ou incompleto; uso de álcool/drogas na gestação',
  'Violência doméstica, depressão materna, pouco estímulo',
  'Parentesco entre os pais; atraso em irmãos',
];

export const FONTE_DNPM = 'Caderneta da Criança (MS) / AIDPI — instrumento de vigilância do desenvolvimento (escrito pelo assistente de memória) — A VALIDAR';
