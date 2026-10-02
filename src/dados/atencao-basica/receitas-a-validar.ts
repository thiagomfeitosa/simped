/**
 * Atenção básica — problemas comuns e receitas (puericultura e hebiatria) — DADOS.
 *
 * ⚠️ TUDO "A VALIDAR": doses, apresentações, intervalos e durações escritos pelo assistente
 * com base no que costuma constar em SBP / MS / bulas, SEM conferência na fonte.
 * Como no resto do app, só a CONTA é conferida (dose × peso → mg → mL/gotas); a dose em si é
 * provisória e não pode ser usada fora do treinamento. Cada item diz a fonte provável.
 */

import type { StatusValidacao } from '../medicacoes/tipos';

const AV: StatusValidacao = 'A_VALIDAR';

export type FormaFarmaceutica = 'suspensao' | 'gotas' | 'solucao' | 'comprimido' | 'spray' | 'topico' | 'injetavel' | 'sache';

export interface Apresentacao {
  texto: string;
  forma: FormaFarmaceutica;
  /** Quantidade do princípio ativo por mL (suspensão, gotas, solução), por comprimido, por jato ou por sachê. */
  concentracao?: number;
  unidade: 'mg' | 'UI' | 'mcg' | 'g';
  /** Gotas por mL do frasco (só para gotas; muda de fabricante para fabricante). */
  gotasPorMl?: number;
}

export type RegraDose =
  /** mg/kg (ou UI/kg) em cada tomada. */
  | { tipo: 'porKgDose'; valor: number; maximoPorDose?: number }
  /** mg/kg por dia, dividido pelo número de tomadas. */
  | { tipo: 'porKgDia'; valor: number; maximoPorDia?: number }
  /** Quantidade fixa por tomada (ex.: 400 mg, 600.000 UI, 400 UI). */
  | { tipo: 'fixa'; valor: number };

export interface ItemReceita {
  medicamento: string;
  apresentacao: Apresentacao;
  dose?: RegraDose;
  via: 'oral' | 'tópica' | 'intramuscular' | 'inalatória' | 'nasal';
  /** Intervalo entre tomadas, em horas (24 = 1 vez ao dia). Vazio = dose única. */
  intervaloH?: number;
  duracao: string;
  /** Instrução para a receita quando não há conta (tópicos, soro nasal...). */
  instrucao?: string;
  fonte: string;
  status: StatusValidacao;
}

export interface ProblemaComum {
  id: string;
  nome: string;
  publico: 'lactente' | 'pre-escolar' | 'escolar' | 'adolescente';
  /** O caso (com idade e peso). */
  caso: string;
  idade: string;
  pesoKg: number;
  /** O que o exame físico mostra (liga com a parte "Exame físico"). */
  exame: string;
  diagnostico: string;
  receita: ItemReceita[];
  orientacoes: string[];
  sinaisDeAlarme: string[];
  /** Erro comum / pegadinha. */
  atencao?: string;
  status: StatusValidacao;
}

const GOTAS_PADRAO = 20;

export const PROBLEMAS_COMUNS: readonly ProblemaComum[] = [
  {
    id: 'resfriado',
    nome: 'Resfriado comum com febre',
    publico: 'pre-escolar',
    caso: 'Menino de 2 anos, coriza hialina, tosse leve e febre de 38,6 °C há 1 dia; brincando, comendo menos.',
    idade: '2 anos',
    pesoKg: 12,
    exame: 'Bom estado geral, hidratado, FR normal, sem tiragem; oroscopia com hiperemia leve; otoscopia normal.',
    diagnostico: 'Resfriado comum (infecção viral de vias aéreas superiores).',
    receita: [
      {
        medicamento: 'Paracetamol',
        apresentacao: { texto: 'gotas 200 mg/mL', forma: 'gotas', concentracao: 200, unidade: 'mg', gotasPorMl: GOTAS_PADRAO },
        dose: { tipo: 'porKgDose', valor: 10, maximoPorDose: 750 },
        via: 'oral',
        intervaloH: 6,
        duracao: 'se febre ou dor (no máximo 5 doses por dia)',
        fonte: 'SBP / bula (rascunho do assistente)',
        status: AV,
      },
      {
        medicamento: 'Soro fisiológico 0,9%',
        apresentacao: { texto: 'frasco 30 mL', forma: 'solucao', unidade: 'mg' },
        via: 'nasal',
        duracao: 'enquanto houver obstrução nasal',
        instrucao: 'Pingar 2 a 4 gotas (ou jato) em cada narina várias vezes ao dia, principalmente antes de mamar/comer e dormir.',
        fonte: 'SBP (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Oferecer líquidos com frequência', 'Febre não é perigosa por si: o antitérmico é para o conforto', 'Não usar antibiótico, descongestionante nem xarope para tosse em menores de 6 anos'],
    sinaisDeAlarme: ['Respiração rápida ou com esforço', 'Febre por mais de 3 dias', 'Prostração, recusa alimentar, sonolência', 'Dor de ouvido ou secreção purulenta'],
    atencao: 'Gotas: confira quantas gotas tem 1 mL do frasco (varia). Aqui: 20 gotas/mL, A VALIDAR.',
    status: AV,
  },
  {
    id: 'oma',
    nome: 'Otite média aguda',
    publico: 'pre-escolar',
    caso: 'Menina de 3 anos, febre de 39 °C e dor de ouvido à direita há 1 dia, depois de um resfriado.',
    idade: '3 anos',
    pesoKg: 14,
    exame: 'Otoscopia à direita: membrana timpânica abaulada, hiperemiada, opaca, sem triângulo luminoso.',
    diagnostico: 'Otite média aguda à direita.',
    receita: [
      {
        medicamento: 'Amoxicilina',
        apresentacao: { texto: 'suspensão 250 mg/5 mL', forma: 'suspensao', concentracao: 50, unidade: 'mg' },
        dose: { tipo: 'porKgDia', valor: 50, maximoPorDia: 1500 },
        via: 'oral',
        intervaloH: 8,
        duracao: 'por 7 a 10 dias (A VALIDAR; há esquemas com 80–90 mg/kg/dia de 12/12 h)',
        fonte: 'SBP (rascunho do assistente); AAP usa dose alta',
        status: AV,
      },
      {
        medicamento: 'Paracetamol',
        apresentacao: { texto: 'gotas 200 mg/mL', forma: 'gotas', concentracao: 200, unidade: 'mg', gotasPorMl: GOTAS_PADRAO },
        dose: { tipo: 'porKgDose', valor: 10, maximoPorDose: 750 },
        via: 'oral',
        intervaloH: 6,
        duracao: 'se dor ou febre',
        fonte: 'SBP / bula (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['A dor é tratada sempre (analgésico)', 'Completar o antibiótico mesmo melhorando', 'Retorno em 48–72 h se não melhorar'],
    sinaisDeAlarme: ['Inchaço ou vermelhidão atrás da orelha (mastoidite)', 'Rigidez de nuca, vômitos, sonolência', 'Febre que não cede em 48–72 h de antibiótico'],
    atencao: 'Membrana só hiperemiada (sem abaulamento) e choro não fecham diagnóstico de OMA.',
    status: AV,
  },
  {
    id: 'faringoamigdalite',
    nome: 'Faringoamigdalite estreptocócica',
    publico: 'escolar',
    caso: 'Menino de 6 anos, febre alta, dor de garganta e dor abdominal há 1 dia; sem tosse nem coriza.',
    idade: '6 anos',
    pesoKg: 20,
    exame: 'Amígdalas aumentadas e vermelhas com exsudato, petéquias no palato, gânglios cervicais dolorosos.',
    diagnostico: 'Faringoamigdalite bacteriana (provável estreptococo do grupo A) — se possível, confirmar com teste rápido.',
    receita: [
      {
        medicamento: 'Amoxicilina',
        apresentacao: { texto: 'suspensão 250 mg/5 mL', forma: 'suspensao', concentracao: 50, unidade: 'mg' },
        dose: { tipo: 'porKgDia', valor: 50, maximoPorDia: 1000 },
        via: 'oral',
        intervaloH: 12,
        duracao: 'por 10 dias',
        fonte: 'SBP / AAP (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Alternativa: penicilina benzatina IM dose única (600.000 UI se < 27 kg; 1.200.000 UI se ≥ 27 kg — A VALIDAR)', 'Volta à escola após 24 h de antibiótico', 'Analgésico/antitérmico se dor'],
    sinaisDeAlarme: ['Dificuldade para abrir a boca, voz abafada, desvio da úvula (abscesso)', 'Baba, dificuldade para engolir líquidos', 'Urina escura ou inchaço (glomerulonefrite)'],
    atencao: 'Objetivo principal do antibiótico: prevenir febre reumática — os 10 dias importam.',
    status: AV,
  },
  {
    id: 'diarreia',
    nome: 'Diarreia aguda sem desidratação (Plano A)',
    publico: 'lactente',
    caso: 'Lactente de 1 ano, 5 evacuações líquidas por dia há 2 dias, sem sangue; mamando e aceitando líquidos.',
    idade: '1 ano',
    pesoKg: 10,
    exame: 'Alerta, olhos normais, lágrimas presentes, boca úmida, bebe normalmente, sinal da prega desaparece rápido.',
    diagnostico: 'Diarreia aguda sem desidratação.',
    receita: [
      {
        medicamento: 'Sais de reidratação oral (SRO)',
        apresentacao: { texto: 'envelope para 1 litro de água filtrada/fervida', forma: 'sache', unidade: 'g' },
        via: 'oral',
        duracao: 'enquanto durar a diarreia',
        instrucao: 'Oferecer após cada evacuação: 50 a 100 mL (menores de 1 ano) ou 100 a 200 mL (1 a 10 anos), aos pouquinhos (A VALIDAR).',
        fonte: 'MS — Manejo do paciente com diarreia (rascunho do assistente)',
        status: AV,
      },
      {
        medicamento: 'Zinco',
        apresentacao: { texto: 'solução 4 mg/mL (sulfato de zinco — A VALIDAR)', forma: 'solucao', concentracao: 4, unidade: 'mg' },
        dose: { tipo: 'fixa', valor: 20 },
        via: 'oral',
        intervaloH: 24,
        duracao: 'por 10 a 14 dias (10 mg/dia se < 6 meses)',
        fonte: 'MS / OMS (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Manter o aleitamento e a alimentação habitual', 'Lavar as mãos', 'Não usar antidiarreico nem antiemético de rotina'],
    sinaisDeAlarme: ['Sangue nas fezes', 'Vômitos repetidos, não consegue beber', 'Olhos fundos, muita sede, sonolência', 'Febre alta'],
    status: AV,
  },
  {
    id: 'anemia',
    nome: 'Anemia ferropriva',
    publico: 'lactente',
    caso: 'Lactente de 1 ano, toma 1 litro de leite de vaca por dia; palidez notada pela mãe. Hb 9,2 g/dL, VCM baixo.',
    idade: '1 ano',
    pesoKg: 10,
    exame: 'Palidez cutaneomucosa leve, sem sopro, sem hepatoesplenomegalia, sem sinais de sangramento.',
    diagnostico: 'Anemia ferropriva (dieta com excesso de leite de vaca).',
    receita: [
      {
        medicamento: 'Sulfato ferroso (ferro elementar)',
        apresentacao: { texto: 'gotas 25 mg/mL de ferro elementar', forma: 'gotas', concentracao: 25, unidade: 'mg', gotasPorMl: GOTAS_PADRAO },
        dose: { tipo: 'porKgDia', valor: 3, maximoPorDia: 60 },
        via: 'oral',
        intervaloH: 24,
        duracao: 'por 3 a 6 meses (até repor os estoques) — A VALIDAR',
        fonte: 'SBP — Consenso de anemia ferropriva (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Dar longe do leite, de preferência com suco de fruta cítrica', 'Reduzir o leite de vaca (até ~500 mL/dia) e oferecer carnes e feijão', 'As fezes podem ficar escuras; escovar os dentes depois'],
    sinaisDeAlarme: ['Cansaço intenso, falta de ar', 'Sangramentos', 'Não melhora da Hb em 30 dias de tratamento'],
    status: AV,
  },
  {
    id: 'ferro-profilatico',
    nome: 'Ferro profilático (prevenção de anemia)',
    publico: 'lactente',
    caso: 'Lactente de 6 meses, a termo, peso adequado, em consulta de rotina; iniciando a alimentação complementar.',
    idade: '6 meses',
    pesoKg: 7.5,
    exame: 'Exame normal, crescimento adequado.',
    diagnostico: 'Puericultura: suplementação profilática de ferro.',
    receita: [
      {
        medicamento: 'Sulfato ferroso (ferro elementar)',
        apresentacao: { texto: 'gotas 25 mg/mL de ferro elementar', forma: 'gotas', concentracao: 25, unidade: 'mg', gotasPorMl: GOTAS_PADRAO },
        dose: { tipo: 'porKgDia', valor: 1 },
        via: 'oral',
        intervaloH: 24,
        duracao: 'até 2 anos (início e duração variam: SBP × MS — A VALIDAR)',
        fonte: 'SBP / MS — Programa Nacional de Suplementação de Ferro (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Prematuro e baixo peso: dose e início diferentes (começam antes)', 'Oferecer alimentos ricos em ferro'],
    sinaisDeAlarme: ['Palidez, cansaço'],
    status: AV,
  },
  {
    id: 'vitamina-d',
    nome: 'Vitamina D no 1º ano',
    publico: 'lactente',
    caso: 'RN de 10 dias em aleitamento materno exclusivo, consulta da 1ª semana.',
    idade: '10 dias',
    pesoKg: 3.4,
    exame: 'Exame normal.',
    diagnostico: 'Puericultura: suplementação de vitamina D.',
    receita: [
      {
        medicamento: 'Colecalciferol (vitamina D3)',
        apresentacao: { texto: 'gotas 200 UI por gota (A VALIDAR: varia por marca)', forma: 'gotas', concentracao: 4000, unidade: 'UI', gotasPorMl: GOTAS_PADRAO },
        dose: { tipo: 'fixa', valor: 400 },
        via: 'oral',
        intervaloH: 24,
        duracao: 'até 12 meses (depois 600 UI/dia até 24 meses — SBP; A VALIDAR)',
        fonte: 'SBP (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Dar todos os dias, direto na boca ou no peito', 'Conferir a concentração do produto comprado'],
    sinaisDeAlarme: ['Vômitos, constipação, recusa alimentar (excesso)'],
    status: AV,
  },
  {
    id: 'verminose',
    nome: 'Parasitose intestinal',
    publico: 'pre-escolar',
    caso: 'Menina de 4 anos, dor abdominal em cólica e eliminação de verme nas fezes; mora em área sem saneamento.',
    idade: '4 anos',
    pesoKg: 16,
    exame: 'Abdome flácido, indolor, sem massas; bom estado geral.',
    diagnostico: 'Parasitose intestinal (provável ascaridíase).',
    receita: [
      {
        medicamento: 'Albendazol',
        apresentacao: { texto: 'suspensão 400 mg/10 mL', forma: 'suspensao', concentracao: 40, unidade: 'mg' },
        dose: { tipo: 'fixa', valor: 400 },
        via: 'oral',
        duracao: 'dose única (repetir em 2 semanas conforme o parasita — A VALIDAR)',
        fonte: 'MS / bula (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Lavar as mãos e os alimentos, beber água filtrada/fervida', 'Tratar quem mora junto, se indicado', 'Unhas curtas'],
    sinaisDeAlarme: ['Vômitos com vermes, dor abdominal forte e distensão (suboclusão)'],
    status: AV,
  },
  {
    id: 'escabiose',
    nome: 'Escabiose (sarna)',
    publico: 'escolar',
    caso: 'Menino de 7 anos, coceira intensa que piora à noite há 2 semanas; irmão com o mesmo quadro.',
    idade: '7 anos',
    pesoKg: 24,
    exame: 'Pápulas escoriadas e túneis nos espaços entre os dedos, punhos, axilas e cintura; poupa a face.',
    diagnostico: 'Escabiose.',
    receita: [
      {
        medicamento: 'Permetrina 5%',
        apresentacao: { texto: 'loção 60 mL', forma: 'topico', unidade: 'mg' },
        via: 'tópica',
        duracao: 'repetir em 7 dias',
        instrucao: 'À noite, após o banho, passar no corpo todo do pescoço para baixo (inclusive entre os dedos e embaixo das unhas); retirar no banho 8 a 12 h depois.',
        fonte: 'SBP / Dermatologia (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Tratar todos da casa ao mesmo tempo, mesmo sem coceira', 'Lavar roupas de cama e de uso em água quente', 'A coceira pode durar até 2–4 semanas depois do tratamento'],
    sinaisDeAlarme: ['Feridas com pus, crostas amareladas (infecção secundária)'],
    status: AV,
  },
  {
    id: 'moniliase',
    nome: 'Monilíase oral (sapinho)',
    publico: 'lactente',
    caso: 'Lactente de 2 meses com placas brancas na boca que não saem ao limpar; mãe com dor nos mamilos.',
    idade: '2 meses',
    pesoKg: 5,
    exame: 'Placas brancas aderidas na língua e na mucosa das bochechas; bebê mama bem.',
    diagnostico: 'Candidíase oral.',
    receita: [
      {
        medicamento: 'Nistatina',
        apresentacao: { texto: 'suspensão oral 100.000 UI/mL', forma: 'suspensao', concentracao: 100000, unidade: 'UI' },
        dose: { tipo: 'fixa', valor: 100000 },
        via: 'oral',
        intervaloH: 6,
        duracao: 'por 7 a 14 dias (manter 2 dias após sumirem as placas) — A VALIDAR',
        instrucao: 'Metade em cada lado da boca, depois das mamadas.',
        fonte: 'Bula / SBP (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Tratar a mãe (mamilos) ao mesmo tempo se houver dor ou fissura', 'Ferver bicos e chupetas'],
    sinaisDeAlarme: ['Recusa das mamadas', 'Placas que não melhoram (pensar em imunodeficiência)'],
    status: AV,
  },
  {
    id: 'impetigo',
    nome: 'Impetigo localizado',
    publico: 'pre-escolar',
    caso: 'Menina de 5 anos com lesões ao redor do nariz que viraram crostas cor de mel há 4 dias.',
    idade: '5 anos',
    pesoKg: 18,
    exame: 'Duas lesões com crostas melicéricas perinasais; sem febre; restante da pele normal.',
    diagnostico: 'Impetigo não bolhoso localizado.',
    receita: [
      {
        medicamento: 'Mupirocina 2%',
        apresentacao: { texto: 'pomada 15 g', forma: 'topico', unidade: 'mg' },
        via: 'tópica',
        intervaloH: 8,
        duracao: 'por 5 a 7 dias',
        instrucao: 'Lavar com água e sabão, remover as crostas com delicadeza e aplicar fina camada nas lesões.',
        fonte: 'SBP / Dermatologia (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Unhas curtas, não coçar', 'Toalhas individuais'],
    sinaisDeAlarme: ['Muitas lesões, febre ou celulite: antibiótico oral', 'Urina escura ou inchaço (glomerulonefrite)'],
    status: AV,
  },
  {
    id: 'itu',
    nome: 'Infecção urinária baixa (cistite)',
    publico: 'pre-escolar',
    caso: 'Menina de 4 anos, ardor ao urinar e urgência há 2 dias, sem febre; urina tipo I com leucocitúria e nitrito positivo.',
    idade: '4 anos',
    pesoKg: 16,
    exame: 'Bom estado geral, sem febre, punho-percussão lombar negativa.',
    diagnostico: 'Cistite (urocultura colhida antes do antibiótico).',
    receita: [
      {
        medicamento: 'Cefalexina',
        apresentacao: { texto: 'suspensão 250 mg/5 mL', forma: 'suspensao', concentracao: 50, unidade: 'mg' },
        dose: { tipo: 'porKgDia', valor: 50, maximoPorDia: 2000 },
        via: 'oral',
        intervaloH: 6,
        duracao: 'por 5 a 7 dias (ajustar pela urocultura) — A VALIDAR',
        fonte: 'SBP (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Beber água, não segurar a urina, tratar constipação', 'Higiene da frente para trás'],
    sinaisDeAlarme: ['Febre, dor lombar, vômitos (pielonefrite)', 'Prostração'],
    status: AV,
  },
  {
    id: 'constipacao',
    nome: 'Constipação funcional',
    publico: 'pre-escolar',
    caso: 'Menino de 3 anos, evacua a cada 4 dias, fezes duras e dor ao evacuar; segura as fezes desde o desfralde.',
    idade: '3 anos',
    pesoKg: 14,
    exame: 'Abdome com fezes palpáveis em fossa ilíaca esquerda; região perianal sem fissura; coluna normal.',
    diagnostico: 'Constipação funcional.',
    receita: [
      {
        medicamento: 'Polietilenoglicol 3350 (macrogol)',
        apresentacao: { texto: 'pó (sachê de 4 g a 17 g — A VALIDAR)', forma: 'sache', concentracao: 1000, unidade: 'mg' },
        dose: { tipo: 'porKgDia', valor: 400 },
        via: 'oral',
        intervaloH: 24,
        duracao: 'manutenção por meses, ajustando para fezes pastosas diárias — A VALIDAR',
        instrucao: 'Dissolver em água ou suco.',
        fonte: 'NASPGHAN/ESPGHAN 2014 (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Sentar no vaso 5–10 min após as refeições', 'Água, frutas, verduras e fibras', 'Não parar o laxante cedo demais'],
    sinaisDeAlarme: ['Desde o nascimento / mecônio atrasado (Hirschsprung)', 'Distensão, vômitos, perda de peso, sangue', 'Alterações na coluna ou fraqueza nas pernas'],
    status: AV,
  },
  {
    id: 'bronquiolite',
    nome: 'Bronquiolite leve (sem remédio!)',
    publico: 'lactente',
    caso: 'Lactente de 4 meses, coriza há 3 dias e tosse; hoje com chiado; mamando bem, sem febre alta.',
    idade: '4 meses',
    pesoKg: 6.5,
    exame: 'FR 48 irpm, sem tiragem, SpO₂ 96%; sibilos e crepitações finas difusos.',
    diagnostico: 'Bronquiolite viral aguda leve.',
    receita: [
      {
        medicamento: 'Soro fisiológico 0,9%',
        apresentacao: { texto: 'frasco 30 mL', forma: 'solucao', unidade: 'mg' },
        via: 'nasal',
        duracao: 'enquanto houver obstrução nasal',
        instrucao: 'Lavar as narinas antes das mamadas e de dormir.',
        fonte: 'SBP / AAP 2014 (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Fracionar as mamadas', 'Não usar broncodilatador, corticoide nem antibiótico de rotina', 'Sono de barriga para cima, sem travesseiro'],
    sinaisDeAlarme: ['Respiração rápida, afundando as costelas, gemido', 'Pausas na respiração ou arroxeado', 'Mama menos da metade do habitual, pouca urina'],
    atencao: 'A melhor "receita" aqui são as orientações e os sinais de alarme.',
    status: AV,
  },
  {
    id: 'asma-leve',
    nome: 'Crise leve de asma (alta com plano)',
    publico: 'escolar',
    caso: 'Menina de 8 anos com asma, tosse e chiado após resfriado; fala frases completas, SpO₂ 96%.',
    idade: '8 anos',
    pesoKg: 26,
    exame: 'FR 24 irpm, sibilos expiratórios esparsos, sem tiragem.',
    diagnostico: 'Exacerbação leve de asma.',
    receita: [
      {
        medicamento: 'Salbutamol',
        apresentacao: { texto: 'aerossol 100 mcg/jato (com espaçador)', forma: 'spray', concentracao: 100, unidade: 'mcg' },
        dose: { tipo: 'fixa', valor: 400 },
        via: 'inalatória',
        intervaloH: 4,
        duracao: 'se tosse/chiado/falta de ar, por até 5–7 dias — A VALIDAR (GINA)',
        instrucao: 'Com espaçador: 1 jato por vez, 5 a 10 respirações entre os jatos.',
        fonte: 'GINA (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Revisar a técnica do espaçador', 'Rever o tratamento de manutenção (corticoide inalatório)', 'Plano de ação por escrito'],
    sinaisDeAlarme: ['Precisa do salbutamol antes de 4 h', 'Fala entrecortada, lábios roxos', 'Afundamento das costelas'],
    status: AV,
  },
  {
    id: 'acne',
    nome: 'Acne leve a moderada',
    publico: 'adolescente',
    caso: 'Adolescente de 15 anos com cravos e espinhas na testa e no queixo há 6 meses; incomodada com a aparência.',
    idade: '15 anos',
    pesoKg: 52,
    exame: 'Comedões abertos e fechados e algumas pápulas inflamatórias na face; sem nódulos nem cicatrizes.',
    diagnostico: 'Acne vulgar leve a moderada (comedoniana e papulopustulosa).',
    receita: [
      {
        medicamento: 'Adapaleno 0,1% + peróxido de benzoíla 2,5%',
        apresentacao: { texto: 'gel 30 g', forma: 'topico', unidade: 'mg' },
        via: 'tópica',
        intervaloH: 24,
        duracao: 'uso contínuo; reavaliar em 8 a 12 semanas',
        instrucao: 'À noite, camada fina no rosto todo (não só nas espinhas), com a pele seca. Pode irritar no início.',
        fonte: 'SBD / AAD (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Protetor solar oil-free durante o dia', 'Não espremer', 'Sabonete suave 2 vezes ao dia', 'Perguntar sobre impacto emocional'],
    sinaisDeAlarme: ['Nódulos, cicatrizes ou piora apesar do tratamento (encaminhar)'],
    status: AV,
  },
  {
    id: 'dismenorreia',
    nome: 'Dismenorreia primária',
    publico: 'adolescente',
    caso: 'Adolescente de 16 anos, cólicas fortes no 1º e 2º dia da menstruação desde 1 ano após a menarca; ciclos regulares.',
    idade: '16 anos',
    pesoKg: 55,
    exame: 'Exame geral normal; sem sinais de alarme.',
    diagnostico: 'Dismenorreia primária.',
    receita: [
      {
        medicamento: 'Ibuprofeno',
        apresentacao: { texto: 'comprimido 400 mg', forma: 'comprimido', concentracao: 400, unidade: 'mg' },
        dose: { tipo: 'fixa', valor: 400 },
        via: 'oral',
        intervaloH: 8,
        duracao: 'nos dias de dor, começando no 1º sinal de cólica (máx. 1.200 mg/dia sem orientação — A VALIDAR)',
        fonte: 'SBP Adolescência / bula (rascunho do assistente)',
        status: AV,
      },
    ],
    orientacoes: ['Tomar com alimento', 'Calor local, atividade física', 'Conversar sobre contracepção (alguns métodos também melhoram a cólica)'],
    sinaisDeAlarme: ['Dor fora da menstruação, febre, corrimento', 'Sangramento muito intenso', 'Dor que não melhora com AINE (endometriose?)'],
    status: AV,
  },
];
