/**
 * Exame físico do RN no alojamento conjunto e atlas de achados — DADOS.
 *
 * ⚠️ TUDO "A VALIDAR": textos escritos pelo assistente com base no que se ensina em
 * "Atenção à Saúde do Recém-Nascido" (MS, 2014, vol. 1) e no Tratado de Pediatria (SBP).
 * Os números (faixas de sinais vitais, prazos, zonas de Kramer) são aproximados e
 * precisam ser conferidos no documento original. Nada aqui substitui protocolo institucional.
 *
 * As ilustrações são desenhadas pelo app (src/ilustracoes/): aqui fica só QUAL desenho
 * mostrar (tipo + achado) e como o corpo inteiro muda (cor, icterícia, postura...).
 */

import type { StatusValidacao } from '../medicacoes/tipos';
import type { FonteNeonatal } from './maturidade-a-validar';

const AV: StatusValidacao = 'A_VALIDAR';

export const FONTE_EXAME_RN: FonteNeonatal = {
  referencia: 'Atenção à Saúde do Recém-Nascido, vol. 1 (MS, 2014) e Tratado de Pediatria (SBP) — texto do assistente, A VALIDAR',
  documentoId: 'MS-ATENCAO-RN',
};

/** Como o desenho do corpo inteiro muda com o achado. */
export interface AjusteCorpo {
  cor?: 'acrocianose' | 'cianose-central' | 'palidez' | 'pletora' | 'cutis-marmorata';
  /** Zona de Kramer (1 a 5): até onde vai o amarelo. */
  ictericiaZona?: 1 | 2 | 3 | 4 | 5;
  eritemaToxico?: boolean;
  petequias?: boolean;
  /** Paralisia braquial (Erb): braço direito estendido, rodado para dentro ("gorjeta do garçom"). */
  bracoDireito?: 'erb';
  /** Fratura de clavícula: abaulamento sobre a clavícula direita, braço menos fletido. */
  claviculaDireita?: 'fratura';
  mamas?: 'ingurgitadas';
  /** Tiragem subcostal e intercostal (desconforto respiratório). */
  tiragem?: boolean;
  umbigo?: 'onfalite' | 'hernia';
}

export type TipoDetalhe = 'rosto' | 'cabeca' | 'olho' | 'boca' | 'pele' | 'costas' | 'umbigo' | 'pe' | 'mao' | 'quadril';

export interface DetalheIlustrado {
  tipo: TipoDetalhe;
  /** Nome do achado no desenho (ver src/ilustracoes/). */
  achado: string;
}

export type CategoriaAchado = 'variacao' | 'alterado';

export const NOME_CATEGORIA: Record<CategoriaAchado | 'normal', string> = {
  normal: 'Normal',
  variacao: 'Variação do normal (fisiológico/transitório)',
  alterado: 'Alterado (investigar, tratar ou encaminhar)',
};

/** Um achado do RN (aparece no atlas e pode ser sorteado no exame). */
export interface AchadoRN {
  id: string;
  nome: string;
  regiao: string;
  categoria: CategoriaAchado;
  /** Precisa de ação no mesmo dia (avisar o médico / urgência). */
  urgente?: boolean;
  /** O que o examinador vê ou sente — sem dizer o nome (é o que o aluno lê no exame). */
  oQueSeVe: string;
  /** O que é e por que acontece. */
  explicacao: string;
  /** Como diferenciar de achados parecidos. */
  diferencial?: string;
  conduta: string;
  corpo?: AjusteCorpo;
  detalhe?: DetalheIlustrado;
  /** Tom de pele em que o desenho fica mais didático (ex.: pustulose melanótica na pele negra). */
  tomSugerido?: 'claro' | 'moreno' | 'negro';
  /** Fica só no atlas (não é sorteado no exame do RN virtual). */
  soNoAtlas?: boolean;
  /** Só acontece neste sexo (genitália). */
  sexo?: 'masculino' | 'feminino';
  /** Horas de vida em que o achado é descrito (o RN virtual fica com essa idade). */
  horasDeVida?: number;
  status: StatusValidacao;
}

/** Uma parte do roteiro do exame no alojamento conjunto. */
export interface RegiaoExameRN {
  id: string;
  nome: string;
  icone: string;
  comoExaminar: string;
  /** O que se espera num RN a termo saudável. */
  normal: string;
  /** Desenho de perto da região normal. */
  detalheNormal?: DetalheIlustrado;
  status: StatusValidacao;
}

export const REGIOES_EXAME_RN: readonly RegiaoExameRN[] = [
  {
    id: 'sinais-vitais',
    nome: 'Estado geral e sinais vitais',
    icone: '❤️',
    comoExaminar: 'Antes de manipular: observe atividade, choro e postura. Conte FR por 1 minuto inteiro, depois FC; meça a temperatura axilar.',
    normal: 'Ativo, choro forte, postura em flexão. FC 120–160 bpm, FR 40–60 irpm, temperatura axilar 36,5–37,5 °C.',
    status: AV,
  },
  {
    id: 'pele',
    nome: 'Pele',
    icone: '🖐️',
    comoExaminar: 'Com boa luz natural, sem roupa: cor, hidratação, manchas, lesões. Pressione a pele (nariz/esterno) para ver icterícia.',
    normal: 'Rosada, quente, hidratada; pode ter vérnix nas dobras e lanugo nos ombros. Extremidades podem ficar arroxeadas nas primeiras horas.',
    detalheNormal: { tipo: 'pele', achado: 'normal' },
    status: AV,
  },
  {
    id: 'cabeca',
    nome: 'Cabeça e fontanelas',
    icone: '🧠',
    comoExaminar: 'Com o RN calmo e no colo semissentado: palpe as fontanelas e as suturas, procure abaulamentos e meça o perímetro cefálico.',
    normal: 'Fontanela anterior plana e normotensa, posterior pequena; suturas palpáveis, às vezes sobrepostas (moldagem do parto). PC de ~33 a 37 cm no termo.',
    detalheNormal: { tipo: 'cabeca', achado: 'normal' },
    status: AV,
  },
  {
    id: 'olhos',
    nome: 'Olhos (teste do olhinho)',
    icone: '👁️',
    comoExaminar: 'Em ambiente escuro, com oftalmoscópio a ~30–50 cm, compare o reflexo vermelho dos dois olhos. Veja pálpebras, conjuntivas e secreção.',
    normal: 'Reflexo vermelho presente e simétrico nos dois olhos; pálpebras podem estar um pouco inchadas; sem secreção purulenta.',
    detalheNormal: { tipo: 'olho', achado: 'reflexo-normal' },
    status: AV,
  },
  {
    id: 'boca',
    nome: 'Boca, palato e língua',
    icone: '👄',
    comoExaminar: 'Com boa luz, abra a boca (o choro ajuda): veja e palpe o palato com o dedo enluvado; avalie a sucção e o freio da língua.',
    normal: 'Lábios e palato íntegros, sucção forte, língua com boa mobilidade; mucosa rosada e úmida.',
    detalheNormal: { tipo: 'boca', achado: 'normal' },
    status: AV,
  },
  {
    id: 'pescoco-clavicula',
    nome: 'Pescoço e clavículas',
    icone: '🦴',
    comoExaminar: 'Gire a cabeça para os dois lados, palpe os dois esternocleidomastóideos e as clavículas de ponta a ponta; compare os braços no Moro.',
    normal: 'Pescoço curto com boa mobilidade, clavículas lisas e contínuas, braços movem-se igualmente.',
    status: AV,
  },
  {
    id: 'torax',
    nome: 'Tórax e respiração',
    icone: '🫁',
    comoExaminar: 'Observe a respiração (ritmo, esforço, tiragem, gemido) e as mamas; ausculte os dois lados.',
    normal: 'Tórax simétrico, respiração abdominal e regular, sem esforço; murmúrio vesicular presente dos dois lados. Mamas pequenas.',
    status: AV,
  },
  {
    id: 'coracao',
    nome: 'Coração e pulsos (teste do coraçãozinho)',
    icone: '💗',
    comoExaminar: 'Ausculte em repouso; palpe pulsos braquiais e femorais ao mesmo tempo; tempo de enchimento capilar. Entre 24 e 48 h: oximetria na mão direita e num pé.',
    normal: 'Bulhas rítmicas e normofonéticas, sem sopro; pulsos femorais cheios e iguais aos braquiais; TEC < 3 s; SpO₂ ≥ 95% nos dois locais com diferença < 3%.',
    status: AV,
  },
  {
    id: 'abdome',
    nome: 'Abdome e coto umbilical',
    icone: '⭕',
    comoExaminar: 'Inspecione e palpe com a mão aquecida; olhe o coto (vasos, cor, cheiro) e a pele em volta.',
    normal: 'Globoso, flácido; fígado até ~2 cm do rebordo costal. Coto com 2 artérias e 1 veia, secando, sem vermelhidão ao redor.',
    detalheNormal: { tipo: 'umbigo', achado: 'coto-normal' },
    status: AV,
  },
  {
    id: 'genitalia',
    nome: 'Genitália e ânus',
    icone: '🩲',
    comoExaminar: 'Menino: testículos na bolsa, posição do meato. Menina: grandes e pequenos lábios, clitóris, secreção. Ânus pérvio e na posição certa; mecônio em até 24–48 h.',
    normal: 'Genitália típica para o sexo, testículos tópicos, meato na ponta da glande; ânus pérvio; mecônio eliminado.',
    status: AV,
  },
  {
    id: 'coluna',
    nome: 'Dorso e coluna',
    icone: '🔙',
    comoExaminar: 'De bruços no antebraço do examinador: percorra a linha média do occipital ao cóccix (manchas, pelos, fossetas, massas).',
    normal: 'Linha média íntegra, sem tufo de pelos, manchas vasculares ou fossetas profundas.',
    detalheNormal: { tipo: 'costas', achado: 'normal' },
    status: AV,
  },
  {
    id: 'membros-quadril',
    nome: 'Membros e quadril (Ortolani/Barlow)',
    icone: '🦵',
    comoExaminar: 'Conte os dedos, veja as pregas e os pés; quadril: Barlow (adução + pressão para trás) e Ortolani (abdução + elevação do trocânter), um lado por vez, com o RN relaxado.',
    normal: 'Membros simétricos, 5 dedos em cada mão e pé, pés que se corrigem com facilidade; Ortolani e Barlow negativos.',
    detalheNormal: { tipo: 'quadril', achado: 'normal' },
    status: AV,
  },
  {
    id: 'neurologico',
    nome: 'Neurológico e reflexos primitivos',
    icone: '⚡',
    comoExaminar: 'Tônus (postura em flexão, tração), choro, e os reflexos: sucção, busca, preensão palmar e plantar, Moro, marcha.',
    normal: 'Tônus flexor, choro forte, sucção vigorosa; Moro completo e simétrico; preensão palmar e plantar presentes.',
    status: AV,
  },
];

export const ACHADOS_RN: readonly AchadoRN[] = [
  // ---- PELE ----
  {
    id: 'eritema-toxico',
    nome: 'Eritema tóxico neonatal',
    regiao: 'pele',
    categoria: 'variacao',
    oQueSeVe: 'Manchas vermelhas de 1–3 cm, com um pontinho amarelado/esbranquiçado no centro, espalhadas no tronco e na face; poupam palmas e plantas. RN ativo, mamando bem.',
    explicacao: 'Erupção benigna e muito comum (até metade dos RN a termo), aparece entre o 2º e o 5º dia e some sozinha em cerca de uma semana. As pústulas têm eosinófilos, não bactérias.',
    diferencial: 'Impetigo/estafilococcia (pústulas maiores, RN com fatores de risco), candidíase, herpes (vesículas agrupadas, RN doente).',
    conduta: 'Tranquilizar a família; não precisa de tratamento nem de pomada.',
    corpo: { eritemaToxico: true },
    detalhe: { tipo: 'pele', achado: 'eritema-toxico' },
    status: AV,
  },
  {
    id: 'milium',
    nome: 'Milium sebáceo',
    regiao: 'pele',
    categoria: 'variacao',
    oQueSeVe: 'Pontinhos brancos-amarelados de 1–2 mm, firmes, no nariz, queixo e testa.',
    explicacao: 'Pequenos cistos de queratina (glândulas sebáceas imaturas). Muito comum; some nas primeiras semanas.',
    diferencial: 'Miliária (vesículas na área quente), acne neonatal (pápulas vermelhas após 2–3 semanas).',
    conduta: 'Não espremer; orientar que some sozinho.',
    detalhe: { tipo: 'rosto', achado: 'milium' },
    status: AV,
  },
  {
    id: 'mancha-mongolica',
    nome: 'Mancha mongólica (melanocitose dérmica)',
    regiao: 'coluna',
    categoria: 'variacao',
    oQueSeVe: 'Mancha azul-acinzentada, plana, de limites imprecisos, na região lombossacra e nas nádegas.',
    explicacao: 'Melanócitos que ficaram na derme. Mais comum em pele negra, parda e asiática; costuma clarear nos primeiros anos.',
    diferencial: 'Hematoma (dói, muda de cor em dias). Registrar no prontuário: evita suspeita indevida de maus-tratos.',
    conduta: 'Registrar (local e tamanho) e orientar a família. Sem tratamento.',
    detalhe: { tipo: 'costas', achado: 'mancha-mongolica' },
    tomSugerido: 'moreno',
    status: AV,
  },
  {
    id: 'nevo-simples',
    nome: 'Nevo simples ("bicada da cegonha")',
    regiao: 'pele',
    categoria: 'variacao',
    oQueSeVe: 'Mancha rosa-salmão, plana, nas pálpebras superiores, glabela e nuca; fica mais vermelha quando o RN chora.',
    explicacao: 'Capilares dilatados (mancha salmão). Os da face clareiam no 1º e 2º ano; os da nuca podem persistir.',
    diferencial: 'Mancha vinho do Porto (vermelho-arroxeada, unilateral, não clareia).',
    conduta: 'Tranquilizar; sem tratamento.',
    detalhe: { tipo: 'rosto', achado: 'nevo-simples' },
    status: AV,
  },
  {
    id: 'acrocianose',
    nome: 'Acrocianose',
    regiao: 'pele',
    categoria: 'variacao',
    oQueSeVe: 'Mãos e pés arroxeados, frios; lábios, língua e tronco rosados. SpO₂ normal.',
    explicacao: 'Vasoconstrição periférica normal nas primeiras 24–48 h, piora com frio.',
    diferencial: 'Cianose central: língua e mucosas roxas — sempre patológica.',
    conduta: 'Manter aquecido (contato pele a pele); conferir que mucosas estão rosadas.',
    corpo: { cor: 'acrocianose' },
    status: AV,
  },
  {
    id: 'cutis-marmorata',
    nome: 'Cutis marmorata',
    regiao: 'pele',
    categoria: 'variacao',
    oQueSeVe: 'Rede arroxeada em "mármore" no tronco e membros quando o RN fica despido; some ao aquecer.',
    explicacao: 'Resposta vascular ao frio, normal no RN.',
    diferencial: 'Se persistir aquecido ou vier com má perfusão: pensar em choque, sepse, hipotireoidismo.',
    conduta: 'Aquecer e reavaliar; se não sumir, investigar.',
    corpo: { cor: 'cutis-marmorata' },
    detalhe: { tipo: 'pele', achado: 'cutis-marmorata' },
    status: AV,
  },
  {
    id: 'miliaria',
    nome: 'Miliária (brotoeja)',
    regiao: 'pele',
    categoria: 'variacao',
    oQueSeVe: 'Vesículas muito pequenas, claras como gotas de suor, ou pápulas avermelhadas no pescoço, axilas e tronco, em RN muito agasalhado.',
    explicacao: 'Obstrução das glândulas sudoríparas pelo calor.',
    conduta: 'Roupas leves, evitar superaquecimento; melhora em dias.',
    detalhe: { tipo: 'pele', achado: 'miliaria' },
    status: AV,
  },
  {
    id: 'pustulose-melanotica',
    nome: 'Melanose pustulosa neonatal transitória',
    regiao: 'pele',
    categoria: 'variacao',
    oQueSeVe: 'Já ao nascer: pústulas superficiais que se rompem fácil e deixam manchas escuras com um colarinho de escama, no queixo, pescoço e tronco.',
    explicacao: 'Benigna, mais comum em RN de pele negra. As manchas escuras podem durar semanas a meses.',
    diferencial: 'Impetigo e eritema tóxico (este não deixa mancha escura).',
    conduta: 'Tranquilizar; sem tratamento.',
    detalhe: { tipo: 'pele', achado: 'pustulose' },
    tomSugerido: 'negro',
    status: AV,
  },
  {
    id: 'descamacao',
    nome: 'Descamação fisiológica',
    regiao: 'pele',
    categoria: 'variacao',
    oQueSeVe: 'Pele que se solta em finas lâminas nas mãos, pés e dobras, sem vermelhidão nem bolhas.',
    explicacao: 'Comum no RN a termo e mais intensa no pós-termo (pouco vérnix).',
    diferencial: 'Ictiose (escamas grossas, ao nascer), síndrome da pele escaldada (bolhas, RN doente).',
    conduta: 'Hidratante neutro se a família quiser; não arrancar as peles.',
    detalhe: { tipo: 'pele', achado: 'descamacao' },
    status: AV,
  },
  {
    id: 'ictericia-precoce',
    horasDeVida: 18,
    nome: 'Icterícia nas primeiras 24 horas',
    regiao: 'pele',
    categoria: 'alterado',
    urgente: true,
    oQueSeVe: 'Com 18 horas de vida: pele amarelada na face e no tronco até o umbigo (ao pressionar, o fundo fica amarelo).',
    explicacao: 'Icterícia antes de 24 h é sempre patológica: pensar em hemólise (incompatibilidade Rh/ABO, G6PD, esferocitose) ou infecção.',
    diferencial: 'Icterícia fisiológica: aparece depois de 24 h, RN bem, progressão lenta.',
    conduta: 'Dosar bilirrubinas já (BT e frações), tipagem e Coombs direto, hemograma com reticulócitos; plotar no nomograma por horas de vida e decidir fototerapia.',
    corpo: { ictericiaZona: 2 },
    status: AV,
  },
  {
    id: 'ictericia-zona3',
    horasDeVida: 60,
    nome: 'Icterícia até a zona 3 de Kramer',
    regiao: 'pele',
    categoria: 'alterado',
    oQueSeVe: 'Com 60 horas de vida: amarelo na face, no tronco, abaixo do umbigo e nas coxas; mãos e pernas sem amarelo.',
    explicacao: 'A icterícia progride da cabeça para os pés (zonas de Kramer). A zona 3 sugere bilirrubina já em nível que pode indicar tratamento, conforme horas de vida e fatores de risco.',
    conduta: 'Medir a bilirrubina (transcutânea ou sérica) e plotar no nomograma; avaliar fototerapia, fatores de risco, amamentação e perda de peso. A inspeção visual não substitui a medida.',
    corpo: { ictericiaZona: 3 },
    status: AV,
  },
  {
    id: 'cianose-central',
    nome: 'Cianose central',
    regiao: 'pele',
    categoria: 'alterado',
    urgente: true,
    oQueSeVe: 'Lábios, língua e tronco arroxeados, inclusive em repouso e aquecido.',
    explicacao: 'SpO₂ baixa: cardiopatia congênita cianótica, doença pulmonar, hipertensão pulmonar, metemoglobinemia.',
    diferencial: 'Acrocianose (só mãos e pés; mucosas rosadas).',
    conduta: 'Oximetria, oxigênio e avisar o pediatra imediatamente; avaliar teste da hiperóxia, raio-X, ecocardiograma; UTI neonatal.',
    corpo: { cor: 'cianose-central' },
    status: AV,
  },
  {
    id: 'pletora',
    nome: 'Pletora',
    regiao: 'pele',
    categoria: 'alterado',
    oQueSeVe: 'Pele vermelho-escura, "cor de vinho", no corpo todo, com enchimento capilar lento nas extremidades.',
    explicacao: 'Sugere policitemia (Ht venoso ≥ 65%): filho de mãe diabética, PIG, clampeamento tardio, transfusão feto-fetal.',
    conduta: 'Hematócrito venoso e glicemia; hidratação; avaliar exsanguineotransfusão parcial se sintomático.',
    corpo: { cor: 'pletora' },
    status: AV,
  },
  {
    id: 'palidez',
    nome: 'Palidez',
    regiao: 'pele',
    categoria: 'alterado',
    urgente: true,
    oQueSeVe: 'Pele e mucosas muito claras, extremidades frias, FC alta.',
    explicacao: 'Anemia (perda sanguínea, hemólise) ou má perfusão (choque, sepse).',
    conduta: 'Hemograma, avaliar perfusão e PA, avisar o pediatra; pode precisar de expansão ou transfusão.',
    corpo: { cor: 'palidez' },
    status: AV,
  },
  {
    id: 'petequias',
    nome: 'Petéquias generalizadas',
    regiao: 'pele',
    categoria: 'alterado',
    oQueSeVe: 'Pontinhos vermelho-arroxeados que não somem ao pressionar, espalhados no tronco e membros (não só na face).',
    explicacao: 'Na face, após parto difícil, podem ser só por pressão. Generalizadas sugerem plaquetopenia (infecção congênita, sepse, aloimune materna).',
    conduta: 'Hemograma com plaquetas; investigar infecção e TORCHS conforme o quadro.',
    corpo: { petequias: true },
    detalhe: { tipo: 'pele', achado: 'petequias' },
    status: AV,
  },
  {
    id: 'hemangioma',
    nome: 'Hemangioma infantil',
    regiao: 'pele',
    categoria: 'alterado',
    oQueSeVe: 'Lesão vermelho-viva, elevada, lisa ou "em morango" (pode começar como mancha clara com vasinhos nos primeiros dias).',
    explicacao: 'Tumor vascular benigno: cresce nos primeiros meses e depois involui devagar.',
    conduta: 'Acompanhar e fotografar; encaminhar cedo se perto do olho, nariz, lábio, via aérea, períneo, se grande/segmentar ou se ulcerar (há tratamento com propranolol).',
    detalhe: { tipo: 'pele', achado: 'hemangioma' },
    status: AV,
  },
  {
    id: 'vinho-do-porto',
    nome: 'Mancha vinho do Porto',
    regiao: 'pele',
    categoria: 'alterado',
    oQueSeVe: 'Mancha plana vermelho-arroxeada, bem delimitada, de um lado só da face, presente desde o nascimento.',
    explicacao: 'Malformação capilar: não some com o tempo. Na região da testa/pálpebra (ramo V1 do trigêmeo) pode associar-se à síndrome de Sturge-Weber (glaucoma, convulsões).',
    conduta: 'Registrar; se na testa/pálpebra: oftalmologista (glaucoma) e neurologia. Encaminhar à dermatologia (laser).',
    detalhe: { tipo: 'pele', achado: 'vinho-do-porto' },
    soNoAtlas: true,
    status: AV,
  },
  // ---- CABEÇA ----
  {
    id: 'bossa',
    nome: 'Bossa serossanguínea (caput succedaneum)',
    regiao: 'cabeca',
    categoria: 'variacao',
    oQueSeVe: 'Inchaço mole, mal delimitado, no alto da cabeça, que deixa marca ao apertar e PASSA por cima das suturas. Presente desde o nascimento.',
    explicacao: 'Edema do couro cabeludo pela pressão no canal de parto. Some em 2 a 3 dias.',
    diferencial: 'Cefalo-hematoma: limitado a um osso, não cruza sutura, aparece horas depois.',
    conduta: 'Tranquilizar; reavaliar.',
    detalhe: { tipo: 'cabeca', achado: 'bossa' },
    status: AV,
  },
  {
    id: 'cavalgamento',
    nome: 'Cavalgamento de suturas (moldagem)',
    regiao: 'cabeca',
    categoria: 'variacao',
    oQueSeVe: 'Degrau palpável entre os ossos parietais (um por cima do outro); cabeça alongada; fontanela anterior plana.',
    explicacao: 'Moldagem do crânio na passagem pelo canal de parto. Desfaz-se em poucos dias.',
    diferencial: 'Craniossinostose: crista óssea fixa, formato anormal que não melhora.',
    conduta: 'Tranquilizar; reavaliar na consulta da 1ª semana.',
    detalhe: { tipo: 'cabeca', achado: 'cavalgamento' },
    status: AV,
  },
  {
    id: 'cefalo-hematoma',
    nome: 'Cefalo-hematoma',
    regiao: 'cabeca',
    categoria: 'alterado',
    oQueSeVe: 'Abaulamento firme e bem delimitado sobre um parietal, que NÃO passa da sutura; ficou mais evidente horas depois do parto.',
    explicacao: 'Sangue entre o osso e o periósteo (o periósteo para na sutura). Pode demorar semanas a meses para sumir e aumentar a icterícia.',
    diferencial: 'Bossa (cruza sutura, ao nascer) e hematoma subgaleal (flutuante, cruza suturas, cresce — grave).',
    conduta: 'Não puncionar; acompanhar icterícia e hemoglobina; orientar a família.',
    detalhe: { tipo: 'cabeca', achado: 'cefalo-hematoma' },
    status: AV,
  },
  {
    id: 'subgaleal',
    nome: 'Hematoma subgaleal',
    regiao: 'cabeca',
    categoria: 'alterado',
    urgente: true,
    oQueSeVe: 'Couro cabeludo flutuante e mole que vai da testa à nuca e às orelhas, aumentando nas horas após um parto com vácuo extrator; RN pálido e taquicárdico.',
    explicacao: 'Sangramento abaixo da gálea aponeurótica: o espaço é grande e cabe muito sangue — pode levar a choque.',
    conduta: 'Urgência: avisar o pediatra, monitorar FC/PA, medir PC seriado, hemograma e coagulograma; expansão/transfusão se preciso.',
    detalhe: { tipo: 'cabeca', achado: 'subgaleal' },
    status: AV,
  },
  {
    id: 'fontanela-abaulada',
    nome: 'Fontanela abaulada',
    regiao: 'cabeca',
    categoria: 'alterado',
    urgente: true,
    oQueSeVe: 'Fontanela anterior tensa e saltada com o RN calmo e sentado; RN irritado e sugando mal.',
    explicacao: 'Hipertensão intracraniana: meningite, hemorragia, hidrocefalia.',
    conduta: 'Avisar o pediatra; investigar (USG transfontanela, líquor se suspeita de meningite).',
    detalhe: { tipo: 'cabeca', achado: 'fontanela-abaulada' },
    status: AV,
  },
  // ---- OLHOS ----
  {
    id: 'hemorragia-subconjuntival',
    nome: 'Hemorragia subconjuntival',
    regiao: 'olhos',
    categoria: 'variacao',
    oQueSeVe: 'Faixa vermelho-viva na parte branca do olho, em meia-lua junto à íris; sem secreção; reflexo vermelho normal.',
    explicacao: 'Ruptura de pequenos vasos pela pressão no parto. Some em 1 a 2 semanas.',
    conduta: 'Tranquilizar.',
    detalhe: { tipo: 'rosto', achado: 'hemorragia-subconjuntival' },
    status: AV,
  },
  {
    id: 'leucocoria',
    nome: 'Reflexo vermelho alterado (leucocoria)',
    regiao: 'olhos',
    categoria: 'alterado',
    urgente: true,
    oQueSeVe: 'No teste do olhinho, um olho mostra reflexo branco/opaco no lugar do vermelho.',
    explicacao: 'Opacidade no eixo visual: catarata congênita, retinoblastoma, glaucoma, retinopatia.',
    conduta: 'Encaminhar ao oftalmologista com urgência (a catarata congênita precisa ser operada cedo para não perder a visão).',
    detalhe: { tipo: 'olho', achado: 'leucocoria' },
    status: AV,
  },
  {
    id: 'conjuntivite',
    nome: 'Conjuntivite neonatal',
    regiao: 'olhos',
    categoria: 'alterado',
    oQueSeVe: 'Pálpebras inchadas e vermelhas, com secreção amarelo-esverdeada que volta depois de limpar.',
    explicacao: 'Primeiras 24–48 h: química (profilaxia). Do 2º ao 5º dia: pensar em gonococo (grave). Do 5º ao 14º: clamídia.',
    conduta: 'Coletar secreção (Gram, cultura); se suspeita de gonococo: ceftriaxona e internar. Tratar a mãe e o parceiro.',
    detalhe: { tipo: 'olho', achado: 'conjuntivite' },
    status: AV,
  },
  // ---- BOCA ----
  {
    id: 'perolas-epstein',
    nome: 'Pérolas de Epstein',
    regiao: 'boca',
    categoria: 'variacao',
    oQueSeVe: 'Pequenos cistos brancos, como pérolas, na linha média do palato duro.',
    explicacao: 'Restos epiteliais de queratina; comuns e somem sozinhos em semanas.',
    diferencial: 'Monilíase (placas que não saem ao raspar e ficam também na língua e bochechas).',
    conduta: 'Tranquilizar.',
    detalhe: { tipo: 'boca', achado: 'perolas-epstein' },
    status: AV,
  },
  {
    id: 'sapinho',
    nome: 'Monilíase oral (sapinho)',
    regiao: 'boca',
    categoria: 'alterado',
    oQueSeVe: 'Placas brancas como leite coalhado na língua, bochechas e gengivas, que NÃO saem ao raspar com gaze (e sangram um pouco).',
    explicacao: 'Infecção por Candida albicans, comum nas primeiras semanas.',
    diferencial: 'Resto de leite (sai fácil ao limpar).',
    conduta: 'Nistatina suspensão oral (dose A VALIDAR) e avaliar o mamilo da mãe (tratar junto se tiver dor/fissura).',
    detalhe: { tipo: 'boca', achado: 'sapinho' },
    status: AV,
  },
  {
    id: 'freio-curto',
    nome: 'Freio lingual curto (anquiloglossia)',
    regiao: 'boca',
    categoria: 'alterado',
    oQueSeVe: 'Ao chorar, a ponta da língua fica em formato de coração, não passa da gengiva e não sobe; freio curto e grosso preso perto da ponta.',
    explicacao: 'Pode atrapalhar a pega e a amamentação (dor no mamilo, mamadas longas).',
    conduta: 'Aplicar o protocolo do teste da linguinha (ex.: Bristol); avaliar a mamada; encaminhar para frenotomia se indicado.',
    detalhe: { tipo: 'boca', achado: 'freio-curto' },
    status: AV,
  },
  {
    id: 'fenda-labial',
    nome: 'Fissura labial (e/ou palatina)',
    regiao: 'boca',
    categoria: 'alterado',
    oQueSeVe: 'Abertura no lábio superior, de um lado, que vai até a narina.',
    explicacao: 'Malformação da fusão dos processos faciais. Pode vir com fenda no palato — sempre palpar o palato.',
    conduta: 'Apoio à amamentação (posição, bicos especiais se preciso), avaliar palato e outras malformações, encaminhar a centro de fissuras.',
    detalhe: { tipo: 'rosto', achado: 'fenda-labial' },
    status: AV,
  },
  // ---- PESCOÇO / CLAVÍCULA ----
  {
    id: 'fratura-clavicula',
    nome: 'Fratura de clavícula',
    regiao: 'pescoco-clavicula',
    categoria: 'alterado',
    oQueSeVe: 'Abaulamento e crepitação ao palpar a clavícula direita; o RN chora ao mexer e o Moro é assimétrico (braço direito mexe menos).',
    explicacao: 'Lesão de parto mais comum (RN grande, distocia de ombro). Consolida em 2–3 semanas, às vezes deixa um "calo" palpável.',
    diferencial: 'Paralisia braquial (sem crepitação, braço flácido).',
    conduta: 'Analgesia, manipular com cuidado (pode fixar a manga do braço na roupa); orientar que o calo some.',
    corpo: { claviculaDireita: 'fratura' },
    status: AV,
  },
  {
    id: 'paralisia-erb',
    nome: 'Paralisia braquial (Erb-Duchenne)',
    regiao: 'pescoco-clavicula',
    categoria: 'alterado',
    oQueSeVe: 'Braço direito estendido junto ao corpo, rodado para dentro, com o punho fletido ("gorjeta do garçom"); Moro ausente desse lado, mas a preensão palmar está presente.',
    explicacao: 'Estiramento das raízes C5–C6 do plexo braquial no parto (distocia de ombro).',
    conduta: 'Investigar fratura de clavícula/úmero, fisioterapia precoce, seguimento com ortopedia/neurocirurgia se não melhorar em semanas.',
    corpo: { bracoDireito: 'erb' },
    status: AV,
  },
  // ---- TÓRAX ----
  {
    id: 'ingurgitamento-mamario',
    nome: 'Ingurgitamento mamário fisiológico',
    regiao: 'torax',
    categoria: 'variacao',
    oQueSeVe: 'Mamas aumentadas dos dois lados, sem vermelhidão nem calor, às vezes saindo uma gotinha de leite.',
    explicacao: 'Efeito dos hormônios maternos, em meninos e meninas. Some em semanas.',
    diferencial: 'Mastite neonatal (um lado só, vermelho, quente, doloroso).',
    conduta: 'Não espremer (risco de infecção); tranquilizar.',
    corpo: { mamas: 'ingurgitadas' },
    status: AV,
  },
  {
    id: 'desconforto-respiratorio',
    nome: 'Desconforto respiratório',
    regiao: 'torax',
    categoria: 'alterado',
    urgente: true,
    oQueSeVe: 'FR de 74 irpm, afundamento entre as costelas e embaixo do esterno a cada inspiração, batimento de asa do nariz e gemido.',
    explicacao: 'Taquipneia transitória, síndrome do desconforto respiratório, pneumonia/sepse, aspiração de mecônio, cardiopatia.',
    conduta: 'Avisar o pediatra; oximetria, O₂ se necessário, boletim de Silverman-Andersen, glicemia, raio-X; avaliar UTI neonatal.',
    corpo: { tiragem: true },
    status: AV,
  },
  // ---- CORAÇÃO ----
  {
    id: 'pulsos-femorais',
    nome: 'Pulsos femorais diminuídos',
    regiao: 'coracao',
    categoria: 'alterado',
    urgente: true,
    oQueSeVe: 'Pulsos braquiais cheios, mas femorais fracos e atrasados; SpO₂ do pé menor que a da mão direita.',
    explicacao: 'Sugere coarctação da aorta ou outra cardiopatia dependente do canal arterial — pode descompensar quando o canal fecha.',
    conduta: 'Avisar o pediatra; medir PA nos 4 membros, ecocardiograma; prostaglandina pode ser necessária.',
    status: AV,
  },
  {
    id: 'sopro',
    nome: 'Sopro cardíaco',
    regiao: 'coracao',
    categoria: 'alterado',
    oQueSeVe: 'Sopro sistólico audível no 2º–3º espaço intercostal esquerdo, RN rosado e mamando bem.',
    explicacao: 'Pode ser transitório (canal arterial fechando nas primeiras horas), mas pode ser cardiopatia.',
    conduta: 'Reavaliar, teste do coraçãozinho, pulsos e PA nos 4 membros; ecocardiograma se persistir ou se houver outros sinais.',
    status: AV,
  },
  // ---- ABDOME / UMBIGO ----
  {
    id: 'onfalite',
    nome: 'Onfalite',
    regiao: 'abdome',
    categoria: 'alterado',
    urgente: true,
    oQueSeVe: 'Pele em volta do coto vermelha, quente e endurecida, avançando mais de 1 cm; secreção purulenta e mau cheiro.',
    explicacao: 'Infecção do coto e da pele ao redor; pode virar fasciite e sepse.',
    conduta: 'Hemograma e hemocultura; antibiótico venoso (anti-estafilocócico + gram-negativo — A VALIDAR); internar.',
    corpo: { umbigo: 'onfalite' },
    detalhe: { tipo: 'umbigo', achado: 'onfalite' },
    status: AV,
  },
  {
    id: 'granuloma-umbilical',
    soNoAtlas: true,
    nome: 'Granuloma umbilical',
    regiao: 'abdome',
    categoria: 'alterado',
    oQueSeVe: 'Depois da queda do coto: bolinha rosada, úmida e brilhante no fundo do umbigo, com um pouco de secreção clara; pele em volta normal.',
    explicacao: 'Tecido de granulação que não epitelizou.',
    diferencial: 'Pólipo/persistência do úraco ou do ducto onfalomesentérico (saída de urina ou fezes) — encaminhar à cirurgia.',
    conduta: 'Cauterização com nitrato de prata ou sal (conforme protocolo — A VALIDAR); manter seco.',
    detalhe: { tipo: 'umbigo', achado: 'granuloma' },
    status: AV,
  },
  {
    id: 'hernia-umbilical',
    nome: 'Hérnia umbilical',
    regiao: 'abdome',
    categoria: 'variacao',
    oQueSeVe: 'Abaulamento mole no umbigo que aumenta ao chorar e volta fácil ao empurrar; sem dor.',
    explicacao: 'Fechamento incompleto do anel umbilical; muito comum, fecha sozinho na maioria até 4–5 anos.',
    conduta: 'Não usar faixas nem moedas; encaminhar se encarcerar ou persistir após a idade combinada com a cirurgia.',
    corpo: { umbigo: 'hernia' },
    detalhe: { tipo: 'umbigo', achado: 'hernia' },
    status: AV,
  },
  {
    id: 'arteria-unica',
    nome: 'Artéria umbilical única',
    regiao: 'abdome',
    categoria: 'alterado',
    oQueSeVe: 'No corte do cordão, só 2 vasos: 1 artéria (pequena, de parede grossa) e 1 veia (grande, de parede fina).',
    explicacao: 'Associa-se a malformações (renais, cardíacas) e cromossomopatias, principalmente se houver outras alterações.',
    conduta: 'Exame físico completo atrás de outras malformações; considerar USG renal conforme protocolo.',
    detalhe: { tipo: 'umbigo', achado: 'arteria-unica' },
    soNoAtlas: true,
    status: AV,
  },
  // ---- GENITÁLIA (descrição em texto) ----
  {
    id: 'hidrocele',
    sexo: 'masculino',
    nome: 'Hidrocele',
    regiao: 'genitalia',
    categoria: 'variacao',
    oQueSeVe: 'Bolsa escrotal aumentada, mole, indolor, que se ilumina inteira com a lanterna (transiluminação); testículo palpável.',
    explicacao: 'Líquido em volta do testículo (conduto peritoniovaginal). A maioria some até 1–2 anos.',
    diferencial: 'Hérnia inguinal (redutível, aumenta ao chorar, pode encarcerar — cirurgia).',
    conduta: 'Acompanhar; encaminhar se variar de tamanho (comunicante) ou persistir.',
    status: AV,
  },
  {
    id: 'pseudomenstruacao',
    sexo: 'feminino',
    horasDeVida: 96,
    nome: 'Pseudomenstruação',
    regiao: 'genitalia',
    categoria: 'variacao',
    oQueSeVe: 'Menina com 4 dias: secreção vaginal esbranquiçada e um pouco de sangue na fralda; vulva sem lesões.',
    explicacao: 'Queda dos hormônios maternos depois do parto.',
    conduta: 'Tranquilizar; higiene normal.',
    status: AV,
  },
  {
    id: 'criptorquidia',
    sexo: 'masculino',
    nome: 'Criptorquidia',
    regiao: 'genitalia',
    categoria: 'alterado',
    oQueSeVe: 'Bolsa escrotal esquerda vazia e pouco desenvolvida; testículo esquerdo não palpável no canal inguinal.',
    explicacao: 'Testículo fora da bolsa; pode descer nos primeiros meses. Bilateral, ou com hipospádia, sugere distúrbio do desenvolvimento sexual.',
    conduta: 'Registrar; reavaliar; encaminhar à cirurgia pediátrica se não descer até a idade do protocolo (A VALIDAR). Bilateral não palpável: avaliar com urgência (cariótipo, hormônios).',
    status: AV,
  },
  {
    id: 'hipospadia',
    sexo: 'masculino',
    nome: 'Hipospádia',
    regiao: 'genitalia',
    categoria: 'alterado',
    oQueSeVe: 'Meato urinário na face de baixo do pênis, prepúcio incompleto embaixo (em "capuz").',
    explicacao: 'Fechamento incompleto da uretra.',
    conduta: 'Não circuncidar (o prepúcio é usado na correção); encaminhar à urologia; se houver criptorquidia junto, investigar DDS.',
    status: AV,
  },
  {
    id: 'anus-imperfurado',
    nome: 'Anomalia anorretal (ânus imperfurado)',
    regiao: 'genitalia',
    categoria: 'alterado',
    urgente: true,
    oQueSeVe: 'Não há orifício anal na posição habitual; o RN não eliminou mecônio e o abdome começa a distender.',
    explicacao: 'Malformação anorretal; pode ter fístula para o períneo ou trato urinário.',
    conduta: 'Jejum, sonda gástrica aberta, avisar a cirurgia pediátrica; procurar outras malformações (VACTERL).',
    status: AV,
  },
  // ---- COLUNA ----
  {
    id: 'fosseta-simples',
    nome: 'Fosseta sacral simples',
    regiao: 'coluna',
    categoria: 'variacao',
    oQueSeVe: 'Pequena covinha (menor que 5 mm) bem perto do ânus, no sulco entre as nádegas, com fundo visível; sem pelos ou manchas.',
    explicacao: 'Achado comum e benigno.',
    diferencial: 'Fosseta grande, alta (> 2,5 cm do ânus), sem fundo visível, ou com outros sinais na pele: risco de disrafismo oculto.',
    conduta: 'Registrar; não precisa de exame.',
    detalhe: { tipo: 'costas', achado: 'fosseta-simples' },
    status: AV,
  },
  {
    id: 'disrafismo',
    nome: 'Sinais de disrafismo espinhal oculto',
    regiao: 'coluna',
    categoria: 'alterado',
    oQueSeVe: 'Tufo de pelos escuros na linha média lombar, com uma pequena mancha avermelhada embaixo.',
    explicacao: 'Marcadores cutâneos de medula presa / lipomeningocele.',
    conduta: 'USG da coluna (enquanto as janelas estão abertas, nos primeiros meses) e avaliação neurocirúrgica.',
    detalhe: { tipo: 'costas', achado: 'tufo-pelos' },
    status: AV,
  },
  // ---- MEMBROS / QUADRIL ----
  {
    id: 'pe-torto',
    nome: 'Pé torto congênito (equinovaro)',
    regiao: 'membros-quadril',
    categoria: 'alterado',
    oQueSeVe: 'Pé virado para dentro e para baixo, com a planta olhando para o outro pé e uma prega funda na sola; não se corrige ao manipular.',
    explicacao: 'Deformidade estrutural (rígida).',
    diferencial: 'Pé torto postural: flexível, corrige com facilidade (só posição no útero).',
    conduta: 'Encaminhar à ortopedia nas primeiras semanas (método de Ponseti: gessos seriados).',
    detalhe: { tipo: 'pe', achado: 'pe-torto' },
    status: AV,
  },
  {
    id: 'pe-postural',
    nome: 'Pé torto postural (posicional)',
    regiao: 'membros-quadril',
    categoria: 'variacao',
    oQueSeVe: 'Pé um pouco virado para dentro, mas que se coloca na posição normal com facilidade e se mexe bem; sola sem prega funda.',
    explicacao: 'Posição no útero; flexível.',
    conduta: 'Orientar; reavaliar nas consultas (melhora sozinho ou com alongamento).',
    detalhe: { tipo: 'pe', achado: 'postural' },
    status: AV,
  },
  {
    id: 'polidactilia',
    nome: 'Polidactilia',
    regiao: 'membros-quadril',
    categoria: 'alterado',
    oQueSeVe: 'Sexto dedo pequeno, preso por um pedículo fino, ao lado do dedo mínimo da mão.',
    explicacao: 'Comum (principalmente pós-axial em famílias negras, muitas vezes herdada). Pode fazer parte de síndromes.',
    conduta: 'Procurar outras malformações; encaminhar à cirurgia (não amarrar com fio sem orientação do serviço — A VALIDAR).',
    detalhe: { tipo: 'mao', achado: 'polidactilia' },
    status: AV,
  },
  {
    id: 'prega-palmar-unica',
    nome: 'Prega palmar única',
    regiao: 'membros-quadril',
    categoria: 'variacao',
    oQueSeVe: 'Uma única prega atravessando toda a palma da mão, de um lado; sem outros achados no exame.',
    explicacao: 'Presente em parte da população sem doença; junto com outros sinais (hipotonia, fendas palpebrais oblíquas, etc.) sugere síndrome de Down.',
    conduta: 'Registrar e completar o exame à procura de outros sinais.',
    detalhe: { tipo: 'mao', achado: 'prega-unica' },
    status: AV,
  },
  {
    id: 'ortolani',
    nome: 'Ortolani positivo (displasia do quadril)',
    regiao: 'membros-quadril',
    categoria: 'alterado',
    oQueSeVe: 'Na abdução do quadril esquerdo com elevação do trocânter, sente-se um "clunk" da cabeça do fêmur voltando para o acetábulo.',
    explicacao: 'Quadril luxado que reduz. Fatores de risco: apresentação pélvica, sexo feminino, história familiar.',
    diferencial: 'Clique de partes moles ("click" agudo, sem sensação de entrar e sair) não é Ortolani.',
    conduta: 'Encaminhar à ortopedia já; USG do quadril; não usar fralda dupla como tratamento.',
    detalhe: { tipo: 'quadril', achado: 'ortolani' },
    status: AV,
  },
  // ---- NEUROLÓGICO ----
  {
    id: 'hipotonia',
    nome: 'Hipotonia',
    regiao: 'neurologico',
    categoria: 'alterado',
    oQueSeVe: 'Braços e pernas largados sobre o colchão ("posição de sapo"); na tração para sentar a cabeça cai toda para trás; escorrega pelas mãos na suspensão vertical.',
    explicacao: 'Sepse, hipoglicemia, asfixia, drogas maternas, síndromes genéticas (Down), doenças neuromusculares.',
    conduta: 'Glicemia, avaliar infecção, avisar o pediatra; investigar a causa.',
    status: AV,
  },
  {
    id: 'moro-assimetrico',
    nome: 'Moro assimétrico',
    regiao: 'neurologico',
    categoria: 'alterado',
    oQueSeVe: 'No Moro, só o braço esquerdo abre e abraça; o direito quase não se mexe.',
    explicacao: 'Fratura de clavícula/úmero ou paralisia do plexo braquial do lado que não se mexe.',
    conduta: 'Palpar clavícula e úmero, raio-X se dúvida, avaliar plexo braquial.',
    status: AV,
  },
];

/** Faixas usadas para sortear sinais vitais do RN virtual (a termo, em repouso). A VALIDAR. */
export const SINAIS_VITAIS_RN = {
  fc: { min: 120, max: 160 },
  fr: { min: 40, max: 60 },
  temperatura: { min: 36.5, max: 37.5 },
  status: AV,
};

/** Sinais vitais alterados que podem ser sorteados (com explicação). A VALIDAR. */
export const SINAIS_ALTERADOS_RN: readonly { id: string; fc?: number; fr?: number; temperatura?: number; texto: string; conduta: string }[] = [
  { id: 'taquipneia', fr: 72, texto: 'Taquipneia (FR > 60)', conduta: 'Reavaliar em repouso; procurar desconforto, febre, hipoglicemia; avisar o pediatra se persistir.' },
  { id: 'febre', temperatura: 38.1, texto: 'Febre (T axilar ≥ 37,8 °C)', conduta: 'Desagasalhar e remedir; febre confirmada no RN: investigar infecção (sepse) — não tratar só com antitérmico.' },
  { id: 'hipotermia', temperatura: 36.0, texto: 'Hipotermia (T axilar < 36,5 °C)', conduta: 'Aquecer (pele a pele), checar glicemia e remedir; investigar se não corrige.' },
  { id: 'taquicardia', fc: 190, texto: 'Taquicardia (FC > 180 em repouso)', conduta: 'Remedir em repouso; febre, dor, hipovolemia, anemia; FC fixa > 220 sugere taquicardia supraventricular.' },
];

/** Triagens neonatais (o que fazer antes da alta / na 1ª semana). A VALIDAR (prazos do MS/SBP). */
export const TRIAGENS_NEONATAIS: readonly { id: string; nome: string; quando: string; como: string; alterado: string }[] = [
  {
    id: 'pezinho',
    nome: 'Teste do pezinho',
    quando: 'Entre o 3º e o 5º dia de vida (após 48 h de amamentação).',
    como: 'Gotas de sangue do calcanhar em papel-filtro.',
    alterado: 'Resultado alterado: convocar a família para reteste/confirmação e encaminhar ao serviço de referência.',
  },
  {
    id: 'olhinho',
    nome: 'Teste do olhinho (reflexo vermelho)',
    quando: 'Antes da alta da maternidade e nas consultas de puericultura.',
    como: 'Oftalmoscópio a ~30–50 cm, em ambiente escuro, comparando os dois olhos.',
    alterado: 'Reflexo ausente, branco ou assimétrico: oftalmologista com urgência.',
  },
  {
    id: 'orelhinha',
    nome: 'Teste da orelhinha (triagem auditiva)',
    quando: 'De preferência antes da alta, até o 1º mês de vida.',
    como: 'Emissões otoacústicas (EOA); PEATE-A se houver indicador de risco para perda auditiva.',
    alterado: 'Falhou: reteste; se falhar de novo, avaliação audiológica completa até 3 meses.',
  },
  {
    id: 'coracaozinho',
    nome: 'Teste do coraçãozinho (oximetria)',
    quando: 'Entre 24 e 48 h de vida, antes da alta, em RN com IG > 34 semanas.',
    como: 'SpO₂ no membro superior direito e num membro inferior.',
    alterado: 'SpO₂ < 95% ou diferença ≥ 3%: repetir em 1 h; se persistir, ecocardiograma em até 24 h.',
  },
  {
    id: 'linguinha',
    nome: 'Teste da linguinha',
    quando: 'Na maternidade (avaliação do frênulo lingual).',
    como: 'Protocolo de avaliação do frênulo (ex.: Bristol) junto com a observação da mamada.',
    alterado: 'Escore alterado com dificuldade de amamentar: encaminhar para avaliação e possível frenotomia.',
  },
];

/** Teste do coraçãozinho: SpO₂ ≥ 95% nos dois locais e diferença < 3% = normal. A VALIDAR (SBP/MS). */
export const CORACAOZINHO = { minimo: 95, diferencaMaxima: 3, status: AV };

/** Zonas de Kramer: até onde a icterícia chega e a bilirrubina aproximada (mg/dL). A VALIDAR. */
export const ZONAS_KRAMER: readonly { zona: 1 | 2 | 3 | 4 | 5; onde: string; bilirrubinaAprox: string }[] = [
  { zona: 1, onde: 'Cabeça e pescoço', bilirrubinaAprox: '~4 a 8 mg/dL' },
  { zona: 2, onde: 'Tronco até o umbigo', bilirrubinaAprox: '~5 a 12 mg/dL' },
  { zona: 3, onde: 'Abaixo do umbigo até os joelhos (inclui coxas)', bilirrubinaAprox: '~8 a 16 mg/dL' },
  { zona: 4, onde: 'Braços e pernas (abaixo dos joelhos)', bilirrubinaAprox: '~11 a 18 mg/dL' },
  { zona: 5, onde: 'Palmas das mãos e plantas dos pés', bilirrubinaAprox: '> 15 mg/dL' },
];
