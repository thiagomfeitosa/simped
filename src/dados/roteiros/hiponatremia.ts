/**
 * Roteiro — Hiponatremia grave sintomática (convulsão) em lactente:
 * NaCl 3% preparado a partir do NaCl 20%, quanto o sódio sobe, teto de 24 h
 * e soro de manutenção isotônico com potássio.
 *
 * CASO DIDÁTICO. Doses e limites do docs/fase-0/doses-rascunho.md — TUDO "A VALIDAR".
 * Os números são calculados pelas funções de o motor de cálculo src/calculos/ (o mesmo do Prescrever) (não digitados à mão).
 */
import {
  arredondar,
  deficitDeSodio,
  doseTotal,
  FRACAO_AGUA_CORPORAL_PADRAO,
  hollidaySegarMlDia,
  meqPorLitro,
  meqPorMl,
  MG_POR_MEQ,
  subidaEstimadaSodio,
  vazaoDoVolume,
  volumeParaConcentracaoDesejada,
} from '../../calculos';
import { fmt } from '../../logica/formatacao';
import type { Roteiro } from './tipos';

// ---- Dados do caso ---------------------------------------------------------
const PESO_KG = 10;
const NA_ATUAL = 118;
const K_ATUAL = 3.8;

// NaCl 3% na hiponatremia sintomática (A VALIDAR — rascunho: 2–5 mL/kg em 10–20 min)
const NACL3_ML_KG = 2;
const NACL3_TEMPO_MIN = 10;
const NACL_CONCENTRADO_PCT = 20;
const NACL_HIPERTONICO_PCT = 3;
const LIMITE_SUBIDA_24H = 8; // A VALIDAR (rascunho: 8–10 mEq/L em 24 h)

// Manutenção (A VALIDAR — rascunho SBP: ≈ 2 mEq de K⁺ por 100 mL do Holliday)
const K_MEQ_POR_100ML = 2;
const KCL_PCT = 19.1;

// Química (não são doses)
const SF_MEQ_ML = meqPorMl(0.9, MG_POR_MEQ.NaCl);
const NACL3_MEQ_ML = meqPorMl(NACL_HIPERTONICO_PCT, MG_POR_MEQ.NaCl);
const NACL20_MEQ_ML = meqPorMl(NACL_CONCENTRADO_PCT, MG_POR_MEQ.NaCl);
const KCL_MEQ_ML = meqPorMl(KCL_PCT, MG_POR_MEQ.KCl);

// ---- Contas ----------------------------------------------------------------
const volumeNaCl3 = doseTotal({ dosePorKg: NACL3_ML_KG, pesoKg: PESO_KG }).dose;
const volumeNaCl20 = volumeParaConcentracaoDesejada({ concentracaoInicial: NACL_CONCENTRADO_PCT, concentracaoDesejada: NACL_HIPERTONICO_PCT, volumeFinalMl: volumeNaCl3 }).volumeAspiradoMl;
const volumeAD = arredondar(volumeNaCl3 - volumeNaCl20, 4);
const vazaoBolus = vazaoDoVolume(volumeNaCl3, NACL3_TEMPO_MIN);
const meqBolus = arredondar(volumeNaCl3 * NACL3_MEQ_ML, 1);
const subida = subidaEstimadaSodio(meqBolus, PESO_KG);
const naDepois = arredondar(NA_ATUAL + subida, 1);
const tetoNa = NA_ATUAL + LIMITE_SUBIDA_24H;
const meqTeto = deficitDeSodio({ sodioDesejado: tetoNa, sodioAtual: NA_ATUAL, pesoKg: PESO_KG });
const aguaCorporal = arredondar(FRACAO_AGUA_CORPORAL_PADRAO * PESO_KG, 2);

const holliday = hollidaySegarMlDia(PESO_KG);
const kMeqDia = arredondar((holliday / 100) * K_MEQ_POR_100ML, 1);
const kclMl = arredondar(kMeqDia / KCL_MEQ_ML, 1);
const manutTotal = arredondar(holliday + kclMl, 1);
const kMeqL = meqPorLitro(kMeqDia, manutTotal);
const vazaoManut = vazaoDoVolume(manutTotal, 24 * 60);

// ---- Textos da folha ---------------------------------------------------------
const idTexto = `Pedro · 11 meses · Peso ${fmt(PESO_KG)} kg`;
const nacl3Texto = `NaCl 3% — ${fmt(volumeNaCl3)} mL (${NACL3_ML_KG} mL/kg) EV`;
const nacl3Preparo = `Preparo: NaCl 20% ${fmt(volumeNaCl20)} mL + AD ${fmt(volumeAD)} mL = ${fmt(volumeNaCl3)} mL de NaCl 3%`;
const nacl3Final = `${nacl3Texto} em ${NACL3_TEMPO_MIN} min — BIC ${fmt(vazaoBolus)} mL/h`;
const manutComposicao = `Soro glicofisiológico (SG 5% + NaCl 0,9%) ${fmt(holliday)} mL + KCl 19,1% ${fmt(kclMl)} mL`;

const reguaSodio = {
  titulo: 'Sódio (Na⁺)',
  unidade: 'mEq/L',
  minimo: 110,
  maximo: 155,
  faixas: [
    { ate: 125, rotulo: 'Hiponatremia grave (< 125)', tom: 'perigo' as const },
    { ate: 135, rotulo: 'Hiponatremia leve a moderada (125 a 134)', tom: 'atencao' as const },
    { ate: 145, rotulo: 'Normal (135 a 145)', tom: 'normal' as const },
    { ate: 155, rotulo: 'Hipernatremia (> 145)', tom: 'atencao' as const },
  ],
  casas: 1,
};

export const roteiroHiponatremia: Roteiro = {
  id: 'hiponatremia-convulsao',
  tema: 'Distúrbios hidroeletrolíticos',
  titulo: 'Hiponatremia com convulsão — NaCl 3%',
  resumo: 'Por que NaCl 3%, como prepará-lo a partir do 20%, quanto o sódio sobe e o teto de 24 h.',
  paciente: {
    nome: 'Pedro',
    descricao: `11 meses, ${fmt(PESO_KG)} kg, convulsão com Na ${NA_ATUAL}`,
  },
  etapas: [
    // 1. IDENTIFICAÇÃO -------------------------------------------------------
    {
      id: 'identificacao',
      secao: 'identificacao',
      curto: 'Paciente',
      titulo: 'Emergência: convulsão em lactente',
      explicacao: [
        `Pedro, 11 meses, ${fmt(PESO_KG)} kg, está com diarreia há 2 dias. Em casa, a família ofereceu muita água e chá. Chegou convulsionando.`,
        'A glicemia capilar está normal, então a hipoglicemia não explica a crise. A pista está na história: muita água sem sal "dilui" o sódio do sangue.',
      ],
      cena: {
        tipo: 'paciente',
        perfil: 'crianca',
        pesoKg: PESO_KG,
        rotulos: [
          { rotulo: 'Idade', valor: '11 meses' },
          { rotulo: 'Peso', valor: `${fmt(PESO_KG)} kg` },
          { rotulo: 'História', valor: 'diarreia + muita água e chá' },
          { rotulo: 'Agora', valor: 'convulsão generalizada · glicemia 92 mg/dL' },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto, detalhe: 'Sala de emergência' },
    },
    {
      id: 'sodio',
      secao: 'identificacao',
      curto: 'Na 118',
      titulo: `Sódio de ${NA_ATUAL}: o que isso quer dizer?`,
      explicacao: [
        `O normal é de 135 a 145 mEq/L. Com ${NA_ATUAL}, a água do sangue entra nas células do cérebro, que incha — e isso causa a convulsão.`,
        'Hiponatremia com sintomas graves (convulsão, rebaixamento) é EMERGÊNCIA, qualquer que seja o número. O tratamento é dar sódio concentrado, rápido e em pouca quantidade.',
      ],
      aValidar: 'Faixas de gravidade da hiponatremia e valores de referência (variam com o laboratório).',
      fonte: 'SBP / PALS',
      cena: {
        tipo: 'regua',
        reguas: [
          { ...reguaSodio, valor: NA_ATUAL, rotuloValor: 'Pedro' },
          {
            titulo: 'Potássio (K⁺)',
            unidade: 'mEq/L',
            minimo: 2,
            maximo: 7,
            faixas: [
              { ate: 3.5, rotulo: 'Baixo (< 3,5)', tom: 'atencao' },
              { ate: 5.5, rotulo: 'Normal (3,5 a 5,5)', tom: 'normal' },
              { ate: 7, rotulo: 'Alto (> 5,5)', tom: 'perigo' },
            ],
            valor: K_ATUAL,
            rotuloValor: 'Pedro',
          },
        ],
      },
      linha: {
        id: 'id',
        secao: 'identificacao',
        texto: idTexto,
        detalhe: `Hiponatremia sintomática (convulsão): Na ${NA_ATUAL} · K ${fmt(K_ATUAL)} mEq/L · Sala de emergência`,
      },
    },

    // 2. OXIGENOTERAPIA ------------------------------------------------------
    {
      id: 'oxigenio',
      secao: 'oxigenoterapia',
      curto: 'O₂',
      titulo: 'Oxigênio durante a crise',
      explicacao: [
        'Durante a convulsão a criança respira mal e a saturação cai (aqui, 91%). Posicionar a cabeça, aspirar secreções e ofertar oxigênio vêm antes de qualquer conta.',
        'Por isso a oxigenoterapia é o 2º item da folha: prioridade não pode se perder no meio da prescrição.',
      ],
      aValidar: 'Dispositivo, fluxo e meta de saturação — conferir com o protocolo de crise convulsiva.',
      fonte: 'PALS / AHA',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'saturacao', titulo: 'SpO₂ 91%', texto: 'durante a crise', estado: 'atencao' },
          { icone: 'pulmao', titulo: 'Máscara com reservatório', texto: '10 L/min', estado: 'sim' },
          { icone: 'check', titulo: 'Meta', texto: 'SpO₂ ≥ 94%', estado: 'sim' },
        ],
      },
      linha: { id: 'o2', secao: 'oxigenoterapia', texto: 'O₂ por máscara com reservatório 10 L/min durante a crise', detalhe: 'Manter SpO₂ ≥ 94%; retirar após estabilizar' },
    },

    // 3. DIETA ---------------------------------------------------------------
    {
      id: 'dieta',
      secao: 'dieta',
      curto: 'Dieta',
      titulo: 'Dieta',
      explicacao: [
        'Convulsionando ou sonolento, Pedro fica em dieta zero (risco de aspirar).',
        'Quando voltar a comer, atenção à pegadinha: água pura e chás foram a CAUSA do problema. A orientação é dieta para a idade, leite e soro de reidratação oral — não água pura.',
      ],
      aValidar: 'Conduta do caso didático.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'jejum', titulo: 'Dieta zero', texto: 'até estabilizar', estado: 'sim' },
          { icone: 'x', titulo: 'Água pura e chás', texto: 'NÃO oferecer', estado: 'nao' },
          { icone: 'mamadeira', titulo: 'Depois', texto: 'dieta para a idade', estado: 'sim' },
        ],
      },
      linha: { id: 'dieta', secao: 'dieta', texto: 'Dieta zero até estabilizar', detalhe: 'Depois, dieta para a idade. NÃO oferecer água pura nem chás.' },
    },

    // 4. HIDRATAÇÃO E ELETRÓLITOS — NaCl 3% --------------------------------------
    {
      id: 'concentracoes',
      secao: 'volemia',
      curto: 'Qual NaCl?',
      titulo: 'Qual solução de sódio usar?',
      explicacao: [
        'Existem várias soluções de cloreto de sódio (NaCl). O número em % diz quantos gramas há em 100 mL. Para comparar, transformamos em mEq por mL.',
        `1 mEq de NaCl pesa 58,5 mg (sódio 23 + cloro 35,5). O NaCl 3% tem ${fmt(NACL3_MEQ_ML, 3)} mEq/mL — mais de 3 vezes o soro fisiológico. É o "hipertônico" usado na emergência. O NaCl 20% é concentrado demais para ir direto na veia: serve para preparar os outros.`,
      ],
      conta: {
        formula: 'mEq/mL = (% × 10) ÷ 58,5',
        substituicao: `NaCl 3%: (3 × 10) ÷ 58,5 = 30 ÷ 58,5`,
        resultado: `≈ ${fmt(NACL3_MEQ_ML, 3)} mEq/mL (SF 0,9%: ${fmt(SF_MEQ_ML, 3)})`,
        rascunho: `NaCl 3%: 30 ÷ 58,5 ≈ ${fmt(NACL3_MEQ_ML, 3)} mEq/mL`,
      },
      dica: '% × 10 transforma "gramas em 100 mL" em "miligramas em 1 mL": 3% = 3 g/100 mL = 30 mg/mL.',
      cena: {
        tipo: 'barras',
        titulo: 'Sódio em cada mL de solução',
        unidade: 'mEq/mL',
        casas: 3,
        barras: [
          { rotulo: 'SF 0,9%', detalhe: 'soro fisiológico', valor: SF_MEQ_ML, tom: 'info' },
          { rotulo: 'NaCl 3%', detalhe: 'hipertônico', valor: NACL3_MEQ_ML, tom: 'normal' },
          { rotulo: 'NaCl 20%', detalhe: 'ampola — não vai direto', valor: NACL20_MEQ_ML, tom: 'perigo' },
        ],
      },
      linha: { id: 'nacl3', secao: 'volemia', texto: `NaCl 3% (${fmt(NACL3_MEQ_ML, 3)} mEq/mL) — correção da hiponatremia sintomática` },
    },
    {
      id: 'nacl3-dose',
      secao: 'volemia',
      curto: 'Dose NaCl 3%',
      titulo: 'Quanto NaCl 3%?',
      explicacao: [
        `A dose do NaCl 3% é em mL por kg. Neste caso didático: ${NACL3_ML_KG} mL/kg, em ${NACL3_TEMPO_MIN} minutos.`,
        `Cada bloco é 1 kg do Pedro recebendo ${NACL3_ML_KG} mL. Se a convulsão continuar, a dose pode ser repetida.`,
      ],
      conta: {
        formula: 'Volume = mL/kg × peso',
        substituicao: `${NACL3_ML_KG} mL/kg × ${fmt(PESO_KG)} kg`,
        resultado: `${fmt(volumeNaCl3)} mL de NaCl 3%`,
        rascunho: `NaCl 3%: ${NACL3_ML_KG} × ${fmt(PESO_KG)} = ${fmt(volumeNaCl3)} mL`,
      },
      aValidar: `NaCl 3% ${NACL3_ML_KG} mL/kg em ${NACL3_TEMPO_MIN} min (rascunho: 2 a 5 mL/kg em 10 a 20 min), repetir até parar a crise (máx. 2 a 3 doses).`,
      fonte: 'PALS / SBP',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: NACL3_ML_KG,
        unidade: 'mL',
        pesoKg: PESO_KG,
        total: volumeNaCl3,
        rotuloTotal: `${fmt(volumeNaCl3)} mL de NaCl 3%`,
      },
      linha: { id: 'nacl3', secao: 'volemia', texto: nacl3Texto },
    },
    {
      id: 'nacl3-aspirar',
      secao: 'volemia',
      curto: 'Preparo: 20%',
      titulo: 'Preparando o NaCl 3%: quanto de NaCl 20%?',
      explicacao: [
        `Muitos hospitais não têm NaCl 3% pronto: ele é preparado a partir da ampola de NaCl 20%. Usamos a mesma regra de diluição de sempre: C1 × V1 = C2 × V2.`,
        `Queremos ${fmt(volumeNaCl3)} mL (V2) a 3% (C2), partindo do 20% (C1). A incógnita é V1: quanto aspirar da ampola.`,
      ],
      conta: {
        formula: 'C1 × V1 = C2 × V2 → V1 = C2 × V2 ÷ C1',
        substituicao: `V1 = 3% × ${fmt(volumeNaCl3)} mL ÷ 20%`,
        passos: [`V1 = ${fmt(NACL_HIPERTONICO_PCT * volumeNaCl3)} ÷ 20`],
        resultado: `${fmt(volumeNaCl20)} mL de NaCl 20%`,
        rascunho: `NaCl 20%: 3 × ${fmt(volumeNaCl3)} ÷ 20 = ${fmt(volumeNaCl20)} mL`,
      },
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: { modelo: 'ampola', rotulo: 'NaCl 20%', sublinha: `ampola 10 mL · ${fmt(NACL20_MEQ_ML)} mEq/mL`, nivel: 0.85, cor: 'medicacao' },
          seringa: { capacidadeMl: 20, rotulo: 'Seringa 20 mL', camadas: [] },
        },
        estado: {
          frasco: { modelo: 'ampola', rotulo: 'NaCl 20%', sublinha: `ampola 10 mL · ${fmt(NACL20_MEQ_ML)} mEq/mL`, nivel: 0.85 * (1 - volumeNaCl20 / 10), cor: 'medicacao' },
          seringa: {
            capacidadeMl: 20,
            rotulo: 'Seringa 20 mL',
            camadas: [{ volumeMl: volumeNaCl20, cor: 'medicacao', rotulo: `NaCl 20% ${fmt(volumeNaCl20)} mL` }],
          },
          fluxos: ['frasco-seringa'],
          balao: `${fmt(volumeNaCl20)} mL de NaCl 20%`,
        },
      },
      linha: { id: 'nacl3', secao: 'volemia', texto: nacl3Texto, detalhe: `Preparo: NaCl 20% ${fmt(volumeNaCl20)} mL + …` },
    },
    {
      id: 'nacl3-completar',
      secao: 'volemia',
      curto: 'Preparo: AD',
      titulo: 'Completando com água destilada',
      explicacao: [
        `Agora completamos a seringa com água destilada (AD) até ${fmt(volumeNaCl3)} mL. O sódio que estava nos ${fmt(volumeNaCl20)} mL fica espalhado em ${fmt(volumeNaCl3)} mL: a concentração cai de 20% para 3%.`,
        'Usamos água destilada (e não soro fisiológico) porque a conta considerou que o diluente não tem sódio.',
      ],
      conta: {
        formula: 'Diluente = volume final − volume do concentrado',
        substituicao: `${fmt(volumeNaCl3)} mL − ${fmt(volumeNaCl20)} mL`,
        resultado: `${fmt(volumeAD)} mL de água destilada`,
        rascunho: `AD: ${fmt(volumeNaCl3)} − ${fmt(volumeNaCl20)} = ${fmt(volumeAD)} mL`,
      },
      dica: 'Receita para 100 mL: 15 mL de NaCl 20% + 85 mL de AD — é a mesma conta (3 × 100 ÷ 20 = 15).',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          bolsa: { rotulo: 'AD', cor: 'agua', gotejando: false },
          seringa: {
            capacidadeMl: 20,
            rotulo: 'Seringa 20 mL',
            camadas: [{ volumeMl: volumeNaCl20, cor: 'medicacao', rotulo: `NaCl 20% ${fmt(volumeNaCl20)} mL` }],
          },
        },
        estado: {
          bolsa: { rotulo: 'AD', cor: 'agua', gotejando: false },
          seringa: {
            capacidadeMl: 20,
            rotulo: `Seringa — ${fmt(volumeNaCl3)} mL de NaCl 3%`,
            camadas: [
              { volumeMl: volumeNaCl20, cor: 'medicacao', rotulo: `NaCl 20% ${fmt(volumeNaCl20)} mL` },
              { volumeMl: volumeAD, cor: 'agua', rotulo: `AD ${fmt(volumeAD)} mL` },
            ],
          },
          fluxos: ['bolsa-seringa'],
          balao: `${fmt(volumeNaCl20)} + ${fmt(volumeAD)} = ${fmt(volumeNaCl3)} mL a 3%`,
        },
      },
      linha: { id: 'nacl3', secao: 'volemia', texto: nacl3Texto, detalhe: nacl3Preparo },
    },
    {
      id: 'nacl3-vazao',
      secao: 'volemia',
      curto: 'NaCl 3%: BIC',
      titulo: `Correndo em ${NACL3_TEMPO_MIN} minutos`,
      explicacao: [
        `Os ${fmt(volumeNaCl3)} mL correm em ${NACL3_TEMPO_MIN} minutos na bomba de infusão. A BIC é programada em mL por hora: se em ${NACL3_TEMPO_MIN} minutos passam ${fmt(volumeNaCl3)} mL, em 60 minutos passariam 6 vezes mais.`,
        'Ao terminar, reavalie: a crise parou? Se não, a dose pode ser repetida, sempre dosando o sódio.',
      ],
      conta: {
        formula: 'Vazão (mL/h) = volume × 60 ÷ tempo (min)',
        substituicao: `${fmt(volumeNaCl3)} mL × 60 ÷ ${NACL3_TEMPO_MIN} min`,
        resultado: `${fmt(vazaoBolus)} mL/h`,
        rascunho: `Vazão NaCl 3%: ${fmt(volumeNaCl3)} × 60 ÷ ${NACL3_TEMPO_MIN} = ${fmt(vazaoBolus)} mL/h`,
      },
      aValidar: 'Repetição da dose e número máximo de doses.',
      fonte: 'PALS / SBP',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          seringa: {
            capacidadeMl: 20,
            rotulo: `NaCl 3% — ${fmt(volumeNaCl3)} mL`,
            camadas: [{ volumeMl: volumeNaCl3, cor: 'mistura', rotulo: `NaCl 3% ${fmt(volumeNaCl3)} mL` }],
          },
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC de seringa' },
        },
        estado: {
          seringa: {
            capacidadeMl: 20,
            rotulo: `NaCl 3% — ${fmt(volumeNaCl3)} mL`,
            camadas: [{ volumeMl: volumeNaCl3, cor: 'mistura', rotulo: `NaCl 3% ${fmt(volumeNaCl3)} mL` }],
          },
          bic: { vazaoMlH: vazaoBolus, ligada: true, rotulo: 'BIC de seringa' },
          fluxos: ['seringa-bic', 'bic-paciente'],
          balao: `${fmt(volumeNaCl3)} mL em ${NACL3_TEMPO_MIN} min`,
        },
      },
      linha: { id: 'nacl3', secao: 'volemia', texto: nacl3Final, detalhe: `${nacl3Preparo} · Pode repetir se a crise continuar (máx. 2 a 3 doses)` },
    },
    {
      id: 'quanto-sobe',
      secao: 'volemia',
      curto: 'Quanto sobe?',
      titulo: 'Quanto o sódio deve subir?',
      explicacao: [
        `Os ${fmt(volumeNaCl3)} mL de NaCl 3% levam ${fmt(meqBolus)} mEq de sódio. Essa quantidade se espalha por toda a água do corpo — cerca de 60% do peso (0,6 × ${fmt(PESO_KG)} = ${fmt(aguaCorporal)} litros).`,
        'Parece pouco — e é de propósito. Poucos mEq/L a mais já tiram água do cérebro e costumam parar a crise. A meta agora NÃO é normalizar o sódio.',
      ],
      conta: {
        formula: 'Subida ≈ mEq infundidos ÷ (0,6 × peso)',
        substituicao: `${fmt(volumeNaCl3)} mL × ${fmt(NACL3_MEQ_ML, 3)} mEq/mL = ${fmt(meqBolus)} mEq`,
        passos: [`${fmt(meqBolus)} ÷ (0,6 × ${fmt(PESO_KG)}) = ${fmt(meqBolus)} ÷ ${fmt(aguaCorporal)}`],
        resultado: `sobe ≈ ${fmt(subida, 1)} mEq/L (${NA_ATUAL} → ≈ ${fmt(naDepois, 1)})`,
        rascunho: `Subida: ${fmt(meqBolus)} mEq ÷ ${fmt(aguaCorporal)} ≈ ${fmt(subida, 1)} mEq/L → Na ≈ ${fmt(naDepois, 1)}`,
      },
      dica: 'É uma estimativa grosseira: o rim também elimina sódio e água. O que manda é o sódio DOSADO depois de cada dose.',
      aValidar: 'Fórmula de estimativa (água corporal = 0,6 × peso) e meta imediata de subida.',
      fonte: 'SBP / PALS',
      cena: {
        tipo: 'regua',
        reguas: [{ ...reguaSodio, valorInicial: NA_ATUAL, valor: naDepois, rotuloValor: 'após o NaCl 3%' }],
        legenda: `O ponteiro anda de ${NA_ATUAL} até ≈ ${fmt(naDepois, 1)} mEq/L.`,
      },
    },
    {
      id: 'teto-24h',
      secao: 'volemia',
      curto: 'Teto 24 h',
      titulo: 'Até onde o sódio pode subir em 24 horas?',
      explicacao: [
        'Corrigir o sódio rápido demais é perigoso: o cérebro, que já tinha se adaptado ao sódio baixo, pode sofrer lesão (desmielinização osmótica).',
        `Por isso existe um TETO: subir no máximo ${LIMITE_SUBIDA_24H} mEq/L em 24 horas, somando tudo (NaCl 3%, soro, dieta). Para Pedro: ${NA_ATUAL} + ${LIMITE_SUBIDA_24H} = ${tetoNa} mEq/L.`,
      ],
      conta: {
        formula: `Teto em 24 h = Na inicial + ${LIMITE_SUBIDA_24H} mEq/L`,
        substituicao: `${NA_ATUAL} + ${LIMITE_SUBIDA_24H} = ${tetoNa} mEq/L`,
        passos: [`Sódio que isso representa: (${tetoNa} − ${NA_ATUAL}) × 0,6 × ${fmt(PESO_KG)} = ${fmt(meqTeto)} mEq`],
        resultado: `Na no máximo ${tetoNa} mEq/L em 24 h (≈ ${fmt(meqTeto)} mEq no total)`,
        rascunho: `Teto: ${NA_ATUAL} + ${LIMITE_SUBIDA_24H} = ${tetoNa} · (${tetoNa} − ${NA_ATUAL}) × 0,6 × ${fmt(PESO_KG)} = ${fmt(meqTeto)} mEq`,
      },
      aValidar: `Limite de subida de ${LIMITE_SUBIDA_24H} mEq/L em 24 h (rascunho: 8 a 10).`,
      fonte: 'SBP / PALS',
      cena: {
        tipo: 'regua',
        reguas: [
          {
            ...reguaSodio,
            valorInicial: NA_ATUAL,
            valor: naDepois,
            rotuloValor: 'agora',
            marcos: [{ valor: tetoNa, rotulo: `teto 24 h: ${tetoNa}` }],
          },
        ],
        legenda: `A linha tracejada é o máximo permitido até amanhã: ${tetoNa} mEq/L.`,
      },
      linha: {
        id: 'nacl3',
        secao: 'volemia',
        texto: nacl3Final,
        detalhe: `${nacl3Preparo} · Pode repetir se a crise continuar (máx. 2 a 3 doses) · Meta: parar a crise; não subir o Na mais que ${LIMITE_SUBIDA_24H} mEq/L em 24 h (teto ${tetoNa})`,
      },
    },

    // 4. HIDRATAÇÃO — MANUTENÇÃO ISOTÔNICA ------------------------------------------
    {
      id: 'manutencao',
      secao: 'volemia',
      curto: 'Manutenção',
      titulo: 'Depois da crise: soro de manutenção ISOTÔNICO',
      explicacao: [
        `O volume do dia vem de Holliday-Segar: até 10 kg, 100 mL por kg. Pedro tem ${fmt(PESO_KG)} kg.`,
        'O tipo de soro é o ponto-chave: ele precisa ser ISOTÔNICO (sódio perto do sangue). O soro 4:1 do roteiro de desidratação tem só ≈ 30 mEq/L de sódio e pioraria a hiponatremia. Aqui usamos soro glicofisiológico (glicose 5% + NaCl 0,9%, com 154 mEq/L).',
      ],
      conta: {
        formula: 'Holliday-Segar: até 10 kg = 100 mL/kg/dia',
        substituicao: `100 mL × ${fmt(PESO_KG)} kg`,
        resultado: `${fmt(holliday)} mL por dia`,
        rascunho: `Holliday: 100 × ${fmt(PESO_KG)} = ${fmt(holliday)} mL/dia`,
      },
      aValidar: 'Soro de manutenção isotônico após a correção e volume (sem restrição hídrica neste caso de perda por diarreia).',
      fonte: 'AAP 2018 (Feld et al.) / SBP',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: 100,
        unidade: 'mL',
        pesoKg: PESO_KG,
        total: holliday,
        rotuloTotal: `${fmt(holliday)} mL em 24 h`,
      },
      linha: { id: 'manutencao', secao: 'volemia', texto: `Soro glicofisiológico (SG 5% + NaCl 0,9%) — ${fmt(holliday)} mL/dia, EV` },
    },
    {
      id: 'manutencao-k',
      secao: 'volemia',
      curto: 'KCl',
      titulo: 'Potássio de manutenção: mEq → mL de ampola',
      explicacao: [
        `O potássio de manutenção deste caso é ${K_MEQ_POR_100ML} mEq para cada 100 mL de soro. Primeiro achamos os mEq do dia; depois, quantos mL de KCl 19,1% os contêm.`,
        `KCl 19,1% = 191 mg por mL; 1 mEq de KCl pesa 74,5 mg (potássio 39 + cloro 35,5). Então cada mL tem ≈ ${fmt(KCL_MEQ_ML)} mEq.`,
      ],
      conta: {
        formula: 'mL de KCl = mEq necessários ÷ mEq por mL da ampola',
        substituicao: `K⁺ do dia: ${fmt(holliday)} ÷ 100 × ${K_MEQ_POR_100ML} = ${fmt(kMeqDia)} mEq`,
        passos: [`KCl 19,1%: 191 ÷ 74,5 ≈ ${fmt(KCL_MEQ_ML)} mEq/mL`, `${fmt(kMeqDia)} ÷ ${fmt(KCL_MEQ_ML)}`],
        resultado: `≈ ${fmt(kclMl)} mL de KCl 19,1% (K⁺ ≈ ${fmt(kMeqL, 0)} mEq/L)`,
        rascunho: `KCl: ${fmt(kMeqDia)} mEq ÷ ${fmt(KCL_MEQ_ML)} ≈ ${fmt(kclMl)} mL de KCl 19,1%`,
      },
      dica: 'Só acrescente potássio com diurese presente. Confira a apresentação: KCl 10% tem ≈ 1,34 mEq/mL — o volume seria outro!',
      aValidar: `K⁺ de manutenção ≈ ${K_MEQ_POR_100ML} mEq/100 mL do Holliday.`,
      fonte: 'SBP (rascunho)',
      cena: {
        tipo: 'mistura',
        recipiente: `Soro de manutenção — ${fmt(manutTotal)} mL`,
        jaPresentes: 1,
        componentes: [
          { rotulo: `Glicofisiológico — ${fmt(holliday)} mL`, volumeMl: holliday, cor: 'glicose' },
          { rotulo: `KCl 19,1% — ${fmt(kclMl)} mL`, volumeMl: kclMl, cor: 'medicacao' },
        ],
        resumo: [
          { rotulo: 'Na⁺', valor: '≈ 154 mEq/L (isotônico)', tom: 'normal' },
          { rotulo: 'K⁺', valor: `≈ ${fmt(kMeqL, 0)} mEq/L`, tom: 'normal' },
        ],
      },
      linha: { id: 'manutencao', secao: 'volemia', texto: `${manutComposicao} — EV em 24 h`, detalhe: 'Iniciar após a crise, com diurese presente' },
    },
    {
      id: 'manutencao-vazao',
      secao: 'volemia',
      curto: 'Manut.: vazão',
      titulo: 'Soro de manutenção: quantos mL por hora?',
      explicacao: [`O soro todo (${fmt(holliday)} + ${fmt(kclMl)} = ${fmt(manutTotal)} mL) corre em 24 horas na BIC.`],
      conta: {
        formula: 'Vazão = volume total ÷ 24 h',
        substituicao: `${fmt(manutTotal)} mL ÷ 24 h`,
        resultado: `≈ ${fmt(vazaoManut, 1)} mL/h`,
        rascunho: `Vazão manutenção: ${fmt(manutTotal)} ÷ 24 ≈ ${fmt(vazaoManut, 1)} mL/h`,
      },
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          bolsa: { rotulo: 'SGF + KCl', cor: 'glicose', gotejando: false },
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC da manutenção' },
        },
        estado: {
          bolsa: { rotulo: 'SGF + KCl', cor: 'glicose', gotejando: true },
          bic: { vazaoMlH: vazaoManut, ligada: true, rotulo: 'BIC da manutenção' },
          fluxos: ['bolsa-bic', 'bic-paciente'],
        },
      },
      linha: {
        id: 'manutencao',
        secao: 'volemia',
        texto: `${manutComposicao} — EV em 24 h, BIC ${fmt(vazaoManut, 1)} mL/h`,
        detalhe: `Iniciar após a crise, com diurese presente · Na⁺ 154 · K⁺ ≈ ${fmt(kMeqL, 0)} mEq/L`,
      },
    },

    // 7. EXAMES ----------------------------------------------------------------
    {
      id: 'exames',
      secao: 'exames',
      curto: 'Exames',
      titulo: 'Exames: vigiar o sódio de perto',
      explicacao: [
        'O sódio precisa ser dosado com frequência: é assim que se confirma a subida e se respeita o teto de 24 h.',
        'Osmolalidade e sódio da urina ajudam a descobrir a causa (perda pela diarreia × excesso de água × outras causas).',
      ],
      aValidar: 'Intervalo das dosagens de sódio e lista de exames.',
      fonte: 'SBP (rascunho: sódio de 2/2 a 4/4 h)',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'tubo', titulo: 'Na sérico', texto: 'de 2/2 h, depois 4/4 h', estado: 'atencao' },
          { icone: 'tubo', titulo: 'K, gasometria, glicemia', estado: 'sim' },
          { icone: 'tubo', titulo: 'Ureia e creatinina', estado: 'sim' },
          { icone: 'gota', titulo: 'Urina', texto: 'Na e osmolalidade', estado: 'sim' },
        ],
      },
      linha: {
        id: 'exames',
        secao: 'exames',
        texto: 'Na sérico de 2/2 h (depois 4/4 h) · K · gasometria venosa · glicemia · ureia e creatinina',
        detalhe: 'Osmolalidade sérica e urinária · Na urinário',
      },
    },

    // 8. ORIENTAÇÕES -------------------------------------------------------------
    {
      id: 'orientacoes',
      secao: 'cuidados',
      curto: 'Cuidados',
      titulo: 'Orientações e cuidados',
      explicacao: [
        'Monitorização contínua e cuidado com a via aérea enquanto houver risco de nova crise.',
        'Pegadinha importante: se a criança começar a urinar MUITO, o sódio pode subir rápido demais (o corpo elimina a água que sobrava). A equipe precisa avisar.',
      ],
      aValidar: 'Critérios para comunicar e frequência de controles — conferir com o protocolo do serviço.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'ecg', titulo: 'Monitor + SpO₂', texto: 'contínuos', estado: 'sim' },
          { icone: 'gota', titulo: 'Diurese', texto: 'medir de 1/1 h', estado: 'sim' },
          { icone: 'cerebro', titulo: 'Nova crise?', texto: 'lateralizar e comunicar', estado: 'atencao' },
          { icone: 'alerta', titulo: 'Urina demais?', texto: 'Na pode subir rápido', estado: 'atencao' },
        ],
      },
      linha: {
        id: 'orientacoes',
        secao: 'cuidados',
        texto: 'Monitor cardíaco e SpO₂ contínuos · Diurese de 1/1 h · Balanço hídrico',
        detalhe: 'Comunicar: nova crise, sonolência, diurese muito aumentada (risco de subir o Na rápido demais)',
      },
    },

    // REVISÃO --------------------------------------------------------------------
    {
      id: 'revisao',
      secao: 'revisao',
      curto: 'Revisão',
      titulo: 'Revisão final',
      explicacao: [
        'Na hiponatremia sintomática, a prescrição tem dois tempos: a EMERGÊNCIA (NaCl 3% para parar a crise) e o DEPOIS (soro isotônico e sódio dosado de perto, respeitando o teto).',
        'Repare que não usamos soro hipotônico em nenhum momento.',
      ],
      cena: {
        tipo: 'conclusao',
        itens: [
          `Paciente certo — Pedro, ${fmt(PESO_KG)} kg`,
          `NaCl 3% — ${fmt(volumeNaCl3)} mL (20% ${fmt(volumeNaCl20)} mL + AD ${fmt(volumeAD)} mL)`,
          `Velocidade — ${NACL3_TEMPO_MIN} min (${fmt(vazaoBolus)} mL/h)`,
          `Teto de 24 h — Na ≤ ${tetoNa} mEq/L`,
          `Manutenção isotônica — ${fmt(vazaoManut, 1)} mL/h`,
        ],
      },
    },
  ],
};
