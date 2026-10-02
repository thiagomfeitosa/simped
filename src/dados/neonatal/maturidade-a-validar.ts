/**
 * Avaliação da idade gestacional pelo exame do RN — DADOS (Capurro somático, Capurro
 * somático-neurológico e New Ballard).
 *
 * ⚠️ TUDO "A VALIDAR": tabelas transcritas pelo assistente de memória, a partir das
 * descrições clássicas (Capurro et al., J Pediatr 1978; Ballard et al., J Pediatr 1991)
 * e da forma como aparecem em "Atenção à Saúde do Recém-Nascido" (MS, 2014, vol. 1).
 * O usuário confere cada linha no documento (com página) antes de a nota corrigir o aluno.
 * As contas (soma dos pontos e conversão para semanas) ficam em src/neonatal/maturidade.ts.
 */

import type { StatusValidacao } from '../medicacoes/tipos';

const AV: StatusValidacao = 'A_VALIDAR';

/** De onde veio a tabela (texto livre + documento do catálogo, quando houver). */
export interface FonteNeonatal {
  referencia: string;
  /** Documento do catálogo de fontes (src/dados/fontes/catalogo.ts). */
  documentoId?: string;
  pagina?: string;
}

/** Uma resposta possível de um critério (ex.: "Pavilhão totalmente encurvado" = 24 pontos). */
export interface OpcaoCriterio {
  pontos: number;
  texto: string;
}

/** Um critério do escore (ex.: "Forma da orelha"). */
export interface CriterioMaturidade {
  id: string;
  nome: string;
  /** Como examinar (texto curto para o aluno). */
  comoExaminar: string;
  /** 'somatico' (físico) ou 'neurologico' (neuromuscular). */
  tipo: 'somatico' | 'neurologico';
  /** Opções da menos para a mais madura. */
  opcoes: OpcaoCriterio[];
  /** Critério que depende do sexo (genitais do Ballard): mostra só as opções do sexo escolhido. */
  sexo?: 'masculino' | 'feminino';
}

export interface MetodoMaturidade {
  id: 'capurro-somatico' | 'capurro-somatico-neurologico' | 'new-ballard';
  nome: string;
  /** Quando usar (texto curto). */
  quando: string;
  criterios: CriterioMaturidade[];
  /**
   * Conversão dos pontos em idade gestacional:
   * - Capurro: IG (dias) = constante + pontos;
   * - New Ballard: IG (semanas) = 24 + 0,4 × pontos (−10 = 20 s; 50 = 44 s).
   */
  conversao: { tipo: 'dias'; constante: number } | { tipo: 'ballard'; semanasNoZero: number; semanasPorPonto: number; minimo: number; maximo: number };
  fonte: FonteNeonatal;
  status: StatusValidacao;
}

// ---- Critérios do Capurro ------------------------------------------------------------

const TEXTURA_PELE: CriterioMaturidade = {
  id: 'textura-pele',
  nome: 'Textura da pele',
  comoExaminar: 'Olhe e palpe a pele do antebraço, do abdome e das pernas; veja se há descamação nas mãos e nos pés.',
  tipo: 'somatico',
  opcoes: [
    { pontos: 0, texto: 'Muito fina, gelatinosa' },
    { pontos: 5, texto: 'Fina e lisa' },
    { pontos: 10, texto: 'Algo mais grossa, discreta descamação superficial' },
    { pontos: 15, texto: 'Grossa, rugas superficiais, descamação nas mãos e nos pés' },
    { pontos: 20, texto: 'Grossa, apergaminhada, com gretas profundas' },
  ],
};

const FORMA_ORELHA: CriterioMaturidade = {
  id: 'forma-orelha',
  nome: 'Forma da orelha',
  comoExaminar: 'Olhe o pavilhão auricular de frente e de lado: quanto da borda (hélice) está encurvada.',
  tipo: 'somatico',
  opcoes: [
    { pontos: 0, texto: 'Chata, disforme, pavilhão não encurvado' },
    { pontos: 8, texto: 'Pavilhão parcialmente encurvado na borda' },
    { pontos: 16, texto: 'Pavilhão parcialmente encurvado em toda a parte superior' },
    { pontos: 24, texto: 'Pavilhão totalmente encurvado' },
  ],
};

const GLANDULA_MAMARIA: CriterioMaturidade = {
  id: 'glandula-mamaria',
  nome: 'Glândula mamária',
  comoExaminar: 'Palpe o tecido mamário entre o polegar e o indicador e meça o diâmetro do nódulo.',
  tipo: 'somatico',
  opcoes: [
    { pontos: 0, texto: 'Não palpável' },
    { pontos: 5, texto: 'Palpável, menor que 5 mm' },
    { pontos: 10, texto: 'Entre 5 e 10 mm' },
    { pontos: 15, texto: 'Maior que 10 mm' },
  ],
};

const FORMACAO_MAMILO: CriterioMaturidade = {
  id: 'formacao-mamilo',
  nome: 'Formação do mamilo',
  comoExaminar: 'Olhe o mamilo e a aréola: diâmetro, se a aréola é lisa ou pontilhada e se a borda é levantada.',
  tipo: 'somatico',
  opcoes: [
    { pontos: 0, texto: 'Apenas visível, sem aréola' },
    { pontos: 5, texto: 'Diâmetro menor que 7,5 mm, aréola lisa e chata' },
    { pontos: 10, texto: 'Diâmetro maior que 7,5 mm, aréola pontilhada, borda não levantada' },
    { pontos: 15, texto: 'Diâmetro maior que 7,5 mm, aréola pontilhada, borda levantada' },
  ],
};

const PREGAS_PLANTARES: CriterioMaturidade = {
  id: 'pregas-plantares',
  nome: 'Pregas plantares',
  comoExaminar: 'Estique a pele da planta do pé e veja até onde vão as marcas e os sulcos (do dedo para o calcanhar).',
  tipo: 'somatico',
  opcoes: [
    { pontos: 0, texto: 'Sem pregas' },
    { pontos: 5, texto: 'Marcas mal definidas na metade anterior da planta' },
    { pontos: 10, texto: 'Marcas bem definidas na metade anterior e sulcos no terço anterior' },
    { pontos: 15, texto: 'Sulcos na metade anterior da planta' },
    { pontos: 20, texto: 'Sulcos em mais da metade anterior da planta' },
  ],
};

const SINAL_XALE: CriterioMaturidade = {
  id: 'sinal-xale',
  nome: 'Sinal do xale',
  comoExaminar: 'Com o RN deitado, leve a mão dele em direção ao ombro oposto, passando pelo pescoço, e veja onde fica o cotovelo.',
  tipo: 'neurologico',
  opcoes: [
    { pontos: 0, texto: 'Cotovelo alcança a linha axilar anterior do lado oposto' },
    { pontos: 6, texto: 'Cotovelo entre a linha axilar anterior do lado oposto e a linha média' },
    { pontos: 12, texto: 'Cotovelo na linha média' },
    { pontos: 18, texto: 'Cotovelo entre a linha média e a linha axilar anterior do mesmo lado' },
  ],
};

const POSICAO_CABECA: CriterioMaturidade = {
  id: 'posicao-cabeca',
  nome: 'Posição da cabeça ao levantar o RN',
  comoExaminar: 'Segure o RN pelas mãos e levante-o devagar até sentar: observe o ângulo entre o pescoço e o tórax (posterior).',
  tipo: 'neurologico',
  opcoes: [
    { pontos: 0, texto: 'Cabeça totalmente deflexionada, ângulo cervicotorácico de 270°' },
    { pontos: 4, texto: 'Ângulo cervicotorácico entre 180° e 270°' },
    { pontos: 8, texto: 'Ângulo cervicotorácico igual a 180°' },
    { pontos: 12, texto: 'Ângulo cervicotorácico menor que 180°' },
  ],
};

// ---- Critérios do New Ballard ----------------------------------------------------------

const BALLARD_NEURO: CriterioMaturidade[] = [
  {
    id: 'postura',
    nome: 'Postura',
    comoExaminar: 'RN calmo, em decúbito dorsal: observe braços e pernas.',
    tipo: 'neurologico',
    opcoes: [
      { pontos: 0, texto: 'Braços e pernas estendidos' },
      { pontos: 1, texto: 'Leve flexão de quadris e joelhos, braços estendidos' },
      { pontos: 2, texto: 'Pernas mais fletidas, braços estendidos' },
      { pontos: 3, texto: 'Braços levemente fletidos, pernas fletidas e abduzidas' },
      { pontos: 4, texto: 'Braços e pernas totalmente fletidos' },
    ],
  },
  {
    id: 'janela-quadrada',
    nome: 'Janela quadrada (punho)',
    comoExaminar: 'Flexione a mão sobre o antebraço e meça o menor ângulo entre a palma e o antebraço.',
    tipo: 'neurologico',
    opcoes: [
      { pontos: -1, texto: 'Mais de 90°' },
      { pontos: 0, texto: '90°' },
      { pontos: 1, texto: '60°' },
      { pontos: 2, texto: '45°' },
      { pontos: 3, texto: '30°' },
      { pontos: 4, texto: '0°' },
    ],
  },
  {
    id: 'retracao-braco',
    nome: 'Retração do braço',
    comoExaminar: 'Flexione os cotovelos por 5 s, estenda os braços e solte: meça o ângulo do cotovelo na volta.',
    tipo: 'neurologico',
    opcoes: [
      { pontos: 0, texto: '180° (não volta)' },
      { pontos: 1, texto: '140° a 180°' },
      { pontos: 2, texto: '110° a 140°' },
      { pontos: 3, texto: '90° a 110°' },
      { pontos: 4, texto: 'Menos de 90°' },
    ],
  },
  {
    id: 'angulo-popliteo',
    nome: 'Ângulo poplíteo',
    comoExaminar: 'Com a coxa encostada no abdome, estenda a perna até sentir resistência e meça o ângulo atrás do joelho.',
    tipo: 'neurologico',
    opcoes: [
      { pontos: -1, texto: '180°' },
      { pontos: 0, texto: '160°' },
      { pontos: 1, texto: '140°' },
      { pontos: 2, texto: '120°' },
      { pontos: 3, texto: '100°' },
      { pontos: 4, texto: '90°' },
      { pontos: 5, texto: 'Menos de 90°' },
    ],
  },
  {
    id: 'sinal-cachecol',
    nome: 'Sinal do cachecol',
    comoExaminar: 'Leve a mão do RN pelo pescoço em direção ao ombro oposto e veja até onde vai o cotovelo.',
    tipo: 'neurologico',
    opcoes: [
      { pontos: -1, texto: 'Cotovelo chega ao nível do pescoço / ombro oposto (enrola)' },
      { pontos: 0, texto: 'Cotovelo na linha axilar do lado oposto' },
      { pontos: 1, texto: 'Cotovelo na linha mamilar do lado oposto' },
      { pontos: 2, texto: 'Cotovelo na linha média (apêndice xifoide)' },
      { pontos: 3, texto: 'Cotovelo na linha mamilar do mesmo lado' },
      { pontos: 4, texto: 'Cotovelo na linha axilar do mesmo lado' },
    ],
  },
  {
    id: 'calcanhar-orelha',
    nome: 'Calcanhar–orelha',
    comoExaminar: 'Com a pelve apoiada, leve o pé em direção à orelha do mesmo lado, sem forçar, e veja até onde chega.',
    tipo: 'neurologico',
    opcoes: [
      { pontos: -1, texto: 'Calcanhar chega à orelha' },
      { pontos: 0, texto: 'Calcanhar chega ao nariz' },
      { pontos: 1, texto: 'Calcanhar chega ao queixo' },
      { pontos: 2, texto: 'Calcanhar chega à linha mamilar' },
      { pontos: 3, texto: 'Calcanhar chega ao umbigo' },
      { pontos: 4, texto: 'Calcanhar chega à prega inguinal' },
    ],
  },
];

const BALLARD_FISICO: CriterioMaturidade[] = [
  {
    id: 'pele',
    nome: 'Pele',
    comoExaminar: 'Olhe a pele do tronco e dos membros: transparência, veias, descamação e rachaduras.',
    tipo: 'somatico',
    opcoes: [
      { pontos: -1, texto: 'Pegajosa, friável, transparente' },
      { pontos: 0, texto: 'Gelatinosa, vermelha, translúcida' },
      { pontos: 1, texto: 'Lisa, rosada, veias visíveis' },
      { pontos: 2, texto: 'Descamação superficial e/ou exantema, poucas veias' },
      { pontos: 3, texto: 'Rachaduras, áreas pálidas, raras veias' },
      { pontos: 4, texto: 'Apergaminhada, rachaduras profundas, sem vasos' },
      { pontos: 5, texto: 'Coriácea, rachada, enrugada' },
    ],
  },
  {
    id: 'lanugo',
    nome: 'Lanugo',
    comoExaminar: 'Olhe as costas e os ombros contra a luz.',
    tipo: 'somatico',
    opcoes: [
      { pontos: -1, texto: 'Nenhum' },
      { pontos: 0, texto: 'Esparso' },
      { pontos: 1, texto: 'Abundante' },
      { pontos: 2, texto: 'Afinando' },
      { pontos: 3, texto: 'Áreas sem lanugo' },
      { pontos: 4, texto: 'Maior parte sem lanugo' },
    ],
  },
  {
    id: 'superficie-plantar',
    nome: 'Superfície plantar',
    comoExaminar: 'Meça do calcanhar à ponta do hálux (nos muito prematuros) e veja as pregas da planta.',
    tipo: 'somatico',
    opcoes: [
      { pontos: -2, texto: 'Calcanhar–hálux menor que 40 mm' },
      { pontos: -1, texto: 'Calcanhar–hálux de 40 a 50 mm' },
      { pontos: 0, texto: 'Mais de 50 mm, sem pregas' },
      { pontos: 1, texto: 'Marcas vermelhas tênues' },
      { pontos: 2, texto: 'Apenas a prega transversa anterior' },
      { pontos: 3, texto: 'Pregas nos 2/3 anteriores' },
      { pontos: 4, texto: 'Pregas em toda a planta' },
    ],
  },
  {
    id: 'mamas',
    nome: 'Mamas',
    comoExaminar: 'Olhe a aréola e palpe o broto mamário.',
    tipo: 'somatico',
    opcoes: [
      { pontos: -1, texto: 'Imperceptíveis' },
      { pontos: 0, texto: 'Pouco perceptíveis' },
      { pontos: 1, texto: 'Aréola plana, sem broto' },
      { pontos: 2, texto: 'Aréola pontilhada, broto de 1 a 2 mm' },
      { pontos: 3, texto: 'Aréola elevada, broto de 3 a 4 mm' },
      { pontos: 4, texto: 'Aréola completa, broto de 5 a 10 mm' },
    ],
  },
  {
    id: 'olhos-orelhas',
    nome: 'Olhos / orelhas',
    comoExaminar: 'Veja se as pálpebras abrem; dobre a orelha e solte, observando a volta.',
    tipo: 'somatico',
    opcoes: [
      { pontos: -2, texto: 'Pálpebras fundidas firmemente' },
      { pontos: -1, texto: 'Pálpebras fundidas frouxamente' },
      { pontos: 0, texto: 'Pálpebras abertas; pavilhão plano, fica dobrado' },
      { pontos: 1, texto: 'Pavilhão levemente curvo, mole, volta devagar' },
      { pontos: 2, texto: 'Pavilhão bem curvo, mole, mas volta rápido' },
      { pontos: 3, texto: 'Formado e firme, volta na hora' },
      { pontos: 4, texto: 'Cartilagem grossa, orelha rígida' },
    ],
  },
  {
    id: 'genitais-masculinos',
    nome: 'Genitais (masculino)',
    comoExaminar: 'Veja a bolsa escrotal (rugas) e palpe a posição dos testículos.',
    tipo: 'somatico',
    sexo: 'masculino',
    opcoes: [
      { pontos: -1, texto: 'Escroto plano, liso' },
      { pontos: 0, texto: 'Escroto vazio, rugas tênues' },
      { pontos: 1, texto: 'Testículos no canal superior, rugas raras' },
      { pontos: 2, texto: 'Testículos descendo, poucas rugas' },
      { pontos: 3, texto: 'Testículos descidos, boas rugas' },
      { pontos: 4, texto: 'Testículos pendentes, rugas profundas' },
    ],
  },
  {
    id: 'genitais-femininos',
    nome: 'Genitais (feminino)',
    comoExaminar: 'Com o quadril em abdução de cerca de 45°, compare grandes lábios, pequenos lábios e clitóris.',
    tipo: 'somatico',
    sexo: 'feminino',
    opcoes: [
      { pontos: -1, texto: 'Clitóris proeminente, lábios planos' },
      { pontos: 0, texto: 'Clitóris proeminente, pequenos lábios pequenos' },
      { pontos: 1, texto: 'Clitóris proeminente, pequenos lábios aumentando' },
      { pontos: 2, texto: 'Grandes e pequenos lábios igualmente proeminentes' },
      { pontos: 3, texto: 'Grandes lábios grandes, pequenos lábios pequenos' },
      { pontos: 4, texto: 'Grandes lábios cobrem o clitóris e os pequenos lábios' },
    ],
  },
];

const FONTE_CAPURRO: FonteNeonatal = {
  referencia: 'Capurro H et al. J Pediatr 1978;93(1):120-2 — como em "Atenção à Saúde do Recém-Nascido" (MS, 2014, vol. 1)',
  documentoId: 'MS-ATENCAO-RN',
};

const FONTE_BALLARD: FonteNeonatal = {
  referencia: 'Ballard JL et al. New Ballard Score. J Pediatr 1991;119(3):417-23 — como em "Atenção à Saúde do Recém-Nascido" (MS, 2014, vol. 1)',
  documentoId: 'MS-ATENCAO-RN',
};

export const METODOS_MATURIDADE: readonly MetodoMaturidade[] = [
  {
    id: 'capurro-somatico',
    nome: 'Capurro somático',
    quando: 'RN a partir de ~29 semanas. Usa só o exame físico: serve para o RN doente, sedado ou em ventilação (não precisa do exame neurológico).',
    criterios: [TEXTURA_PELE, FORMA_ORELHA, GLANDULA_MAMARIA, FORMACAO_MAMILO, PREGAS_PLANTARES],
    conversao: { tipo: 'dias', constante: 204 },
    fonte: FONTE_CAPURRO,
    status: AV,
  },
  {
    id: 'capurro-somatico-neurologico',
    nome: 'Capurro somático-neurológico',
    quando: 'RN a partir de ~29 semanas, em boas condições (sem depressão neurológica): 4 sinais físicos + 2 neurológicos.',
    criterios: [TEXTURA_PELE, FORMA_ORELHA, GLANDULA_MAMARIA, PREGAS_PLANTARES, SINAL_XALE, POSICAO_CABECA],
    conversao: { tipo: 'dias', constante: 200 },
    fonte: FONTE_CAPURRO,
    status: AV,
  },
  {
    id: 'new-ballard',
    nome: 'New Ballard',
    quando: 'Inclui os prematuros extremos (20 a 44 semanas). 6 sinais neuromusculares + 6 físicos. Nos muito prematuros, mais preciso nas primeiras horas de vida.',
    criterios: [...BALLARD_NEURO, ...BALLARD_FISICO],
    conversao: { tipo: 'ballard', semanasNoZero: 24, semanasPorPonto: 0.4, minimo: -10, maximo: 50 },
    fonte: FONTE_BALLARD,
    status: AV,
  },
];

/** Classificação detalhada pela IG ao nascer (semanas + dias), da menor para a maior. A VALIDAR. */
export const CLASSIFICACAO_IG_DETALHADA: readonly { ateDias: number; nome: string; grupo: 'pre-termo' | 'termo' | 'pos-termo' }[] = [
  { ateDias: 28 * 7, nome: 'Pré-termo extremo (< 28 semanas)', grupo: 'pre-termo' },
  { ateDias: 32 * 7, nome: 'Muito pré-termo (28 a 31 semanas e 6 dias)', grupo: 'pre-termo' },
  { ateDias: 34 * 7, nome: 'Pré-termo moderado (32 a 33 semanas e 6 dias)', grupo: 'pre-termo' },
  { ateDias: 37 * 7, nome: 'Pré-termo tardio (34 a 36 semanas e 6 dias)', grupo: 'pre-termo' },
  { ateDias: 39 * 7, nome: 'Termo precoce (37 a 38 semanas e 6 dias)', grupo: 'termo' },
  { ateDias: 41 * 7, nome: 'Termo completo (39 a 40 semanas e 6 dias)', grupo: 'termo' },
  { ateDias: 42 * 7, nome: 'Termo tardio (41 a 41 semanas e 6 dias)', grupo: 'termo' },
  { ateDias: Infinity, nome: 'Pós-termo (≥ 42 semanas)', grupo: 'pos-termo' },
];

/**
 * Quando a USG muda a data calculada pela DUM (diferença maior que X dias, pela IG da USG).
 * A VALIDAR — ACOG Committee Opinion nº 700 (2017), "Methods for estimating the due date".
 */
export const REDATAR_PELA_USG: readonly { ateSemanas: number; diferencaMaiorQueDias: number; texto: string }[] = [
  { ateSemanas: 9, diferencaMaiorQueDias: 5, texto: 'USG até 8 semanas e 6 dias: diferença maior que 5 dias' },
  { ateSemanas: 14, diferencaMaiorQueDias: 7, texto: 'USG de 9 a 13 semanas e 6 dias: diferença maior que 7 dias' },
  { ateSemanas: 16, diferencaMaiorQueDias: 7, texto: 'USG de 14 a 15 semanas e 6 dias: diferença maior que 7 dias' },
  { ateSemanas: 22, diferencaMaiorQueDias: 10, texto: 'USG de 16 a 21 semanas e 6 dias: diferença maior que 10 dias' },
  { ateSemanas: 28, diferencaMaiorQueDias: 14, texto: 'USG de 22 a 27 semanas e 6 dias: diferença maior que 14 dias' },
  { ateSemanas: Infinity, diferencaMaiorQueDias: 21, texto: 'USG a partir de 28 semanas: diferença maior que 21 dias' },
];

export const FONTE_REDATAR: FonteNeonatal = { referencia: 'ACOG Committee Opinion nº 700 (2017) — Methods for estimating the due date' };

/** Classificação do peso para a IG pelo percentil lido na curva (Intergrowth-21st ou Fenton). A VALIDAR. */
export const CLASSIFICACAO_PESO_IG = {
  pigAbaixoDoPercentil: 10,
  gigAcimaDoPercentil: 90,
  status: AV,
  fonte: { referencia: 'Classificação usual PIG/AIG/GIG (percentis 10 e 90) — curva Intergrowth-21st ou Fenton; ver MS 2014' } as FonteNeonatal,
};
