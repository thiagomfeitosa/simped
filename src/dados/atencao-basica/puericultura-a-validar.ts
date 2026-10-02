/**
 * Consulta de puericultura e consulta do adolescente — DADOS.
 * ⚠️ TUDO "A VALIDAR": roteiro escrito pelo assistente (Caderneta da Criança / Cadernos de
 * Atenção Básica nº 33 do MS, SBP, AAP Bright Futures). Conferir na fonte.
 */

import type { StatusValidacao } from '../medicacoes/tipos';

const AV: StatusValidacao = 'A_VALIDAR';

export interface ConsultaPuericultura {
  id: string;
  idade: string;
  idadeMeses: number;
  verificar: string[];
  orientar: string[];
  suplementos: string[];
  status: StatusValidacao;
}

/** Calendário mínimo de consultas (MS: 7 no 1º ano, 2 no 2º, depois anual). A VALIDAR. */
export const CONSULTAS_PUERICULTURA: readonly ConsultaPuericultura[] = [
  {
    id: '1a-semana',
    idade: '1ª semana (até 7 dias)',
    idadeMeses: 0,
    verificar: ['Peso (perda até ~10% e recuperação até 10–15 dias)', 'Icterícia', 'Coto umbilical', 'Mamada (pega, posição)', 'Triagens: pezinho, olhinho, orelhinha, coraçãozinho, linguinha', 'Vacinas BCG e hepatite B'],
    orientar: ['Aleitamento materno exclusivo e em livre demanda', 'Sono seguro: de barriga para cima, no berço, sem travesseiro', 'Banho de sol não é recomendado; cuidados com o coto (álcool 70% conforme rotina — A VALIDAR)', 'Sinais de perigo: febre, recusa, icterícia que aumenta, respiração difícil'],
    suplementos: ['Vitamina D 400 UI/dia (A VALIDAR)'],
    status: AV,
  },
  {
    id: '1-mes',
    idade: '1 mês',
    idadeMeses: 1,
    verificar: ['Crescimento (peso, comprimento, PC nas curvas)', 'Desenvolvimento (marcos de 1 mês)', 'Depressão pós-parto da mãe', 'Reflexo vermelho'],
    orientar: ['Aleitamento exclusivo', 'Cólica: colo, ambiente calmo (sem remédio)', 'Prevenção de acidentes: transporte no bebê conforto, não deixar sozinho no trocador'],
    suplementos: ['Vitamina D'],
    status: AV,
  },
  {
    id: '2-meses',
    idade: '2 meses',
    idadeMeses: 2,
    verificar: ['Crescimento e desenvolvimento', 'Vacinas dos 2 meses'],
    orientar: ['Reações esperadas das vacinas (febre baixa, dor local)', 'Estimular: conversar, olhar, sorrir para o bebê'],
    suplementos: ['Vitamina D'],
    status: AV,
  },
  {
    id: '4-meses',
    idade: '4 meses',
    idadeMeses: 4,
    verificar: ['Crescimento e desenvolvimento (sustenta a cabeça?)', 'Vacinas dos 4 meses', 'Retorno da mãe ao trabalho: plano para manter o leite materno'],
    orientar: ['Ordenha e armazenamento do leite', 'Não oferecer água, chás ou outros leites antes dos 6 meses'],
    suplementos: ['Vitamina D', 'Ferro profilático: início aos 3 meses (SBP) ou 6 meses (MS) — A VALIDAR'],
    status: AV,
  },
  {
    id: '6-meses',
    idade: '6 meses',
    idadeMeses: 6,
    verificar: ['Crescimento e desenvolvimento (senta com apoio, rola)', 'Vacinas dos 6 meses e influenza', 'Dentição'],
    orientar: ['Introdução alimentar: comida da família amassada, sem sal/açúcar, sem mel antes de 1 ano', 'Água potável à vontade', 'Escovação com gaze/escova macia quando nascerem os dentes', 'Acidentes: quedas, engasgo, tomadas'],
    suplementos: ['Vitamina D', 'Ferro profilático', 'Vitamina A em regiões do programa (A VALIDAR)'],
    status: AV,
  },
  {
    id: '9-meses',
    idade: '9 meses',
    idadeMeses: 9,
    verificar: ['Crescimento e desenvolvimento (senta sem apoio, pinça)', 'Vacina febre amarela', 'Alimentação (consistência evoluindo)'],
    orientar: ['Oferecer pedaços macios para treinar a mastigação', 'Brincar no chão, ler para a criança'],
    suplementos: ['Vitamina D', 'Ferro'],
    status: AV,
  },
  {
    id: '12-meses',
    idade: '12 meses',
    idadeMeses: 12,
    verificar: ['Crescimento e desenvolvimento (fica em pé, primeiras palavras)', 'Vacinas dos 12 meses', 'Hemoglobina (rastreio de anemia conforme protocolo — A VALIDAR)'],
    orientar: ['Comida da família; leite de vaca integral pode entrar (máx. ~500 mL/dia)', 'Limitar telas (evitar antes de 2 anos)', 'Primeira consulta odontológica'],
    suplementos: ['Vitamina D 600 UI/dia até 24 meses (SBP — A VALIDAR)', 'Ferro'],
    status: AV,
  },
  {
    id: '18-meses',
    idade: '18 meses',
    idadeMeses: 18,
    verificar: ['Crescimento e desenvolvimento', 'Triagem de autismo (M-CHAT, 16–30 meses)', 'Vacinas dos 15 meses em dia'],
    orientar: ['Birras são esperadas: limites com afeto', 'Segurança: piscinas, produtos de limpeza, janelas'],
    suplementos: ['Ferro (até 24 meses)'],
    status: AV,
  },
  {
    id: '24-meses',
    idade: '24 meses',
    idadeMeses: 24,
    verificar: ['Crescimento (IMC a partir de 2 anos)', 'Desenvolvimento (frases de 2 palavras)', 'Desfralde (prontidão)'],
    orientar: ['Rotina de sono', 'Telas: no máximo 1 h/dia com supervisão (SBP — A VALIDAR)'],
    suplementos: [],
    status: AV,
  },
  {
    id: 'anual',
    idade: '3 a 10 anos (anual)',
    idadeMeses: 36,
    verificar: ['Crescimento e IMC', 'Pressão arterial a partir de 3 anos', 'Acuidade visual (a partir de 3–4 anos)', 'Vacinas dos 4 anos', 'Desempenho escolar'],
    orientar: ['Alimentação saudável, atividade física, sono', 'Prevenção de acidentes e violência', 'Saúde bucal'],
    suplementos: [],
    status: AV,
  },
];

/** Roteiro HEEADSSS da consulta do adolescente. A VALIDAR. */
export const HEEADSSS: readonly { letra: string; tema: string; perguntas: string[] }[] = [
  { letra: 'H', tema: 'Casa (Home)', perguntas: ['Com quem você mora? Como é a convivência?', 'Alguém em casa te machuca ou te deixa com medo?'] },
  { letra: 'E', tema: 'Escola / trabalho (Education/Employment)', perguntas: ['Em que ano está? Como vão as notas?', 'Já repetiu? Trabalha?', 'Sofre bullying?'] },
  { letra: 'E', tema: 'Alimentação (Eating)', perguntas: ['O que acha do seu corpo/peso?', 'Faz dietas, fica sem comer, vomita ou usa remédio para emagrecer?'] },
  { letra: 'A', tema: 'Atividades', perguntas: ['O que faz no tempo livre? Esportes?', 'Quanto tempo de tela por dia?'] },
  { letra: 'D', tema: 'Drogas', perguntas: ['Algum amigo usa cigarro, vape, álcool ou outras drogas? E você?', 'Já dirigiu ou andou com alguém que tinha bebido?'] },
  { letra: 'S', tema: 'Sexualidade', perguntas: ['Já namorou/ficou? Com meninos, meninas ou ambos?', 'Já teve relações sexuais? Usa camisinha e outro método?', 'Alguém já te forçou a algo?'] },
  { letra: 'S', tema: 'Suicídio / humor (Suicide/depression)', perguntas: ['Tem se sentido triste ou sem vontade de fazer as coisas?', 'Já pensou em se machucar ou em morrer? Tem um plano?'] },
  { letra: 'S', tema: 'Segurança (Safety)', perguntas: ['Usa cinto e capacete?', 'Já sofreu violência na escola, na rua ou na internet?'] },
];

/** Sigilo na consulta do adolescente (resumo, A VALIDAR — ECA, Código de Ética Médica). */
export const SIGILO_ADOLESCENTE: readonly string[] = [
  'Parte da consulta é feita a sós com o adolescente (com a família avisada desde o começo).',
  'O que é dito fica em sigilo, EXCETO quando há risco à vida ou à saúde dele ou de outros (ex.: risco de suicídio, abuso sexual, violência): aí a família/autoridades são comunicadas, de preferência com o adolescente sabendo.',
  'Suspeita de violência contra criança/adolescente: notificação obrigatória e comunicação ao Conselho Tutelar.',
  'Exame físico (principalmente genital/mamas) com acompanhante e consentimento.',
];

/** Estadiamento de Tanner — só descrição em texto (A VALIDAR). */
export const TANNER: readonly { estagio: string; mamas: string; pelos: string; genitais: string }[] = [
  { estagio: '1', mamas: 'Pré-puberal: só o mamilo é saliente.', pelos: 'Sem pelos pubianos (só a penugem do abdome).', genitais: 'Pré-puberal: testículos, escroto e pênis infantis.' },
  { estagio: '2', mamas: 'Broto mamário: pequena elevação da mama e da aréola (telarca).', pelos: 'Pelos finos, longos e pouco pigmentados, sobretudo na base do pênis ou nos grandes lábios (pubarca).', genitais: 'Aumento dos testículos (≥ 4 mL) e do escroto, que fica mais fino e avermelhado.' },
  { estagio: '3', mamas: 'Mama e aréola maiores, sem separação de contornos.', pelos: 'Pelos mais escuros, grossos e enrolados, espalhando-se pela sínfise.', genitais: 'Pênis cresce em comprimento; testículos e escroto continuam crescendo.' },
  { estagio: '4', mamas: 'Aréola e mamilo formam uma elevação acima do contorno da mama (duplo contorno).', pelos: 'Pelos tipo adulto, mas cobrindo área menor (sem chegar às coxas).', genitais: 'Pênis cresce em espessura; glande se desenvolve; escroto mais pigmentado.' },
  { estagio: '5', mamas: 'Mama adulta: a aréola volta ao contorno da mama.', pelos: 'Pelos adultos, chegando à face interna das coxas.', genitais: 'Genitais adultos em tamanho e forma.' },
];

/** Marcos da puberdade (A VALIDAR). */
export const PUBERDADE: readonly string[] = [
  'Meninas: o 1º sinal é o broto mamário (M2), em geral entre 8 e 13 anos; a menarca vem ~2 a 2,5 anos depois (M4).',
  'Meninos: o 1º sinal é o aumento dos testículos (G2), em geral entre 9 e 14 anos.',
  'Puberdade precoce: sinais antes de 8 anos (meninas) ou 9 anos (meninos). Atraso: nenhum sinal aos 13 (meninas) ou 14 (meninos).',
  'O estirão de crescimento: nas meninas em M2–M3; nos meninos mais tarde (G3–G4).',
];

/** Pressão arterial no adolescente ≥ 13 anos (AAP 2017, A VALIDAR). */
export const PA_ADOLESCENTE: readonly { faixa: string; criterio: string }[] = [
  { faixa: 'Normal', criterio: '< 120/80 mmHg' },
  { faixa: 'PA elevada', criterio: '120–129 / < 80 mmHg' },
  { faixa: 'Hipertensão estágio 1', criterio: '130–139 / 80–89 mmHg' },
  { faixa: 'Hipertensão estágio 2', criterio: '≥ 140/90 mmHg' },
];
