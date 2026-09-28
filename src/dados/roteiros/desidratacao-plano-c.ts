/**
 * Roteiro — Desidratação grave por diarreia (Plano C): expansão, soro de manutenção
 * com sódio e potássio (Holliday-Segar, 4:1 + KCl) e soro de reposição.
 *
 * CASO DIDÁTICO. Volumes, proporções e condutas vêm do docs/fase-0/doses-rascunho.md
 * e do esquema do MS para diarreia — TUDO "A VALIDAR" até o usuário conferir nas fontes.
 * Os números são calculados pelas funções de src/logica/calculos.ts (não digitados à mão).
 */
import {
  arredondar,
  dividirEmProporcao,
  dosePorPeso,
  hollidaySegar,
  MG_POR_MEQ,
  meqPorLitro,
  meqPorMl,
  vazaoMlPorHora,
} from '../../logica/calculos';
import { fmt } from '../../logica/formatacao';
import type { Roteiro } from './tipos';

// ---- Dados do caso ---------------------------------------------------------
const PESO_KG = 12;
const NA_ADMISSAO = 133;
const K_ADMISSAO = 3.3;

// Plano C — fase rápida (A VALIDAR — MS, "Manejo do paciente com diarreia")
const EXPANSAO_ML_KG = 20;
const EXPANSAO_TEMPO_MIN = 30;

// Fase de manutenção e reposição (A VALIDAR — MS)
const PROPORCAO_MANUTENCAO = [4, 1]; // SG 5% : SF 0,9%
const KCL10_ML_POR_100ML = 2;
const REPOSICAO_ML_KG_DIA = 50;
const PROPORCAO_REPOSICAO = [1, 1]; // SG 5% : SF 0,9%
const K_MAXIMO_PERIFERICO_MEQ_L = 40; // A VALIDAR

// Química (não são doses)
const KCL10_MEQ_ML = meqPorMl(10, MG_POR_MEQ.KCl); // ≈ 1,34
const SF_MEQ_ML = meqPorMl(0.9, MG_POR_MEQ.NaCl); // ≈ 0,154

// ---- Contas ----------------------------------------------------------------
const expansaoMl = dosePorPeso(EXPANSAO_ML_KG, PESO_KG).doseTotal;
const expansaoVazao = vazaoMlPorHora(expansaoMl, EXPANSAO_TEMPO_MIN);

const holliday = hollidaySegar(PESO_KG);
const hollidayAte10 = 10 * 100;
const hollidayAcima10 = holliday - hollidayAte10;
const [manutSG, manutSF] = dividirEmProporcao(holliday, PROPORCAO_MANUTENCAO);
const kclMl = arredondar((holliday / 100) * KCL10_ML_POR_100ML, 1);
const manutTotal = arredondar(holliday + kclMl, 1);
const kMeq = arredondar(kclMl * KCL10_MEQ_ML, 1);
const kMeqL = meqPorLitro(kMeq, manutTotal);
const naMeq = arredondar(manutSF * SF_MEQ_ML, 1);
const naMeqL = meqPorLitro(naMeq, manutTotal);
const vazaoManut = vazaoMlPorHora(manutTotal, 24 * 60);

const reposicaoMl = dosePorPeso(REPOSICAO_ML_KG_DIA, PESO_KG).doseTotal;
const [repSG, repSF] = dividirEmProporcao(reposicaoMl, PROPORCAO_REPOSICAO);
const repNaMeqL = meqPorLitro(arredondar(repSF * SF_MEQ_ML, 1), reposicaoMl);
const vazaoRep = vazaoMlPorHora(reposicaoMl, 24 * 60);

// ---- Textos da folha ---------------------------------------------------------
const idTexto = `Ana · 2 anos · Peso ${fmt(PESO_KG)} kg`;
const expansaoTexto = `SF 0,9% — ${fmt(expansaoMl)} mL (${EXPANSAO_ML_KG} mL/kg) EV em ${EXPANSAO_TEMPO_MIN} min — BIC ${fmt(expansaoVazao)} mL/h`;
const manutComposicao = `SG 5% ${fmt(manutSG)} mL + SF 0,9% ${fmt(manutSF)} mL`;
const manutComKcl = `${manutComposicao} + KCl 10% ${fmt(kclMl)} mL`;
const manutDetalhe = `Na⁺ ≈ ${fmt(naMeqL, 0)} mEq/L · K⁺ ≈ ${fmt(kMeqL, 0)} mEq/L`;

export const roteiroDesidratacaoPlanoC: Roteiro = {
  id: 'desidratacao-plano-c',
  tema: 'Distúrbios hidroeletrolíticos',
  titulo: 'Desidratação grave — Plano C e soro com Na/K',
  resumo: 'Expansão com SF 0,9%, soro de manutenção 4:1 com KCl (Holliday-Segar) e soro de reposição.',
  paciente: {
    nome: 'Ana',
    descricao: `2 anos, ${fmt(PESO_KG)} kg, diarreia com desidratação grave`,
  },
  etapas: [
    // 1. IDENTIFICAÇÃO -------------------------------------------------------
    {
      id: 'identificacao',
      secao: 'identificacao',
      curto: 'Paciente',
      titulo: 'Quem é a paciente?',
      explicacao: [
        `Ana, 2 anos, ${fmt(PESO_KG)} kg, tem diarreia aquosa e vômitos há 3 dias. Chegou sonolenta, com olhos fundos e boca seca.`,
        'Como sempre, o peso vem primeiro: todos os volumes de soro deste roteiro são calculados a partir dele.',
      ],
      dica: 'Na desidratação, o ideal é usar o peso de antes de adoecer. Sem essa informação, usa-se o peso atual — e o soro é ajustado pela reavaliação clínica.',
      cena: {
        tipo: 'paciente',
        perfil: 'crianca',
        pesoKg: PESO_KG,
        rotulos: [
          { rotulo: 'Idade', valor: '2 anos' },
          { rotulo: 'Peso', valor: `${fmt(PESO_KG)} kg` },
          { rotulo: 'Quadro', valor: 'diarreia aquosa + vômitos há 3 dias' },
          { rotulo: 'Ao chegar', valor: 'sonolenta, olhos fundos, boca seca' },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto, detalhe: 'Sala de emergência' },
    },
    {
      id: 'classificar',
      secao: 'identificacao',
      curto: 'Grau',
      titulo: 'Qual o grau de desidratação?',
      explicacao: [
        'O grau é dado pelo exame físico: estado geral, olhos, sede, sinal da prega, pulso e enchimento capilar.',
        'Ana está sonolenta, não consegue beber, a prega desaparece muito devagar e o pulso está fraco. Dois ou mais desses sinais = desidratação GRAVE. Isso indica o Plano C: hidratação pela veia.',
      ],
      aValidar: 'Tabela de avaliação do estado de hidratação e critérios do Plano C.',
      fonte: 'MS — Manejo do paciente com diarreia',
      cena: {
        tipo: 'cartoes',
        titulo: 'Sinais de desidratação grave:',
        cartoes: [
          { icone: 'cerebro', titulo: 'Sonolenta', texto: 'letárgica, difícil de acordar', estado: 'atencao' },
          { icone: 'gota', titulo: 'Não consegue beber', texto: 'bebe mal', estado: 'atencao' },
          { icone: 'relogio', titulo: 'Prega', texto: 'desaparece muito lentamente', estado: 'atencao' },
          { icone: 'coracao', titulo: 'Pulso fraco', texto: 'enchimento capilar lento', estado: 'atencao' },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto, detalhe: 'Diarreia aguda com desidratação grave (Plano C) · Sala de emergência' },
    },
    {
      id: 'exames-admissao',
      secao: 'identificacao',
      curto: 'Na e K',
      titulo: 'O que dizem o sódio e o potássio?',
      explicacao: [
        `No acesso venoso, colhemos sangue. Sódio de ${NA_ADMISSAO} mEq/L: a desidratação é isonatrêmica (Na entre 130 e 150) — perdeu água e sal na mesma proporção.`,
        `Potássio de ${fmt(K_ADMISSAO)} mEq/L: um pouco baixo, porque as fezes da diarreia levam potássio embora. O soro de manutenção vai repor.`,
      ],
      aValidar: 'Faixas de referência (variam com o laboratório e a idade) e classificação por sódio.',
      fonte: 'SBP / laboratório do serviço',
      cena: {
        tipo: 'regua',
        reguas: [
          {
            titulo: 'Sódio (Na⁺) — tipo de desidratação',
            unidade: 'mEq/L',
            minimo: 115,
            maximo: 165,
            faixas: [
              { ate: 130, rotulo: 'Hiponatrêmica (< 130)', tom: 'atencao' },
              { ate: 150, rotulo: 'Isonatrêmica (130 a 150)', tom: 'normal' },
              { ate: 165, rotulo: 'Hipernatrêmica (> 150)', tom: 'perigo' },
            ],
            valor: NA_ADMISSAO,
            rotuloValor: 'Ana',
            casas: 0,
          },
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
            valor: K_ADMISSAO,
            rotuloValor: 'Ana',
          },
        ],
      },
      linha: {
        id: 'id',
        secao: 'identificacao',
        texto: idTexto,
        detalhe: `Diarreia aguda com desidratação grave (Plano C) · Na ${NA_ADMISSAO} · K ${fmt(K_ADMISSAO)} mEq/L · Sala de emergência`,
      },
    },

    // 2. OXIGENOTERAPIA ------------------------------------------------------
    {
      id: 'oxigenio',
      secao: 'oxigenoterapia',
      curto: 'O₂',
      titulo: 'Precisa de oxigênio?',
      explicacao: [
        'Ana satura 97% em ar ambiente e respira sem esforço. O problema dela é falta de líquido, não de oxigênio.',
        'O item continua escrito como "não se aplica", para mostrar que foi avaliado. Se houver choque com má perfusão ou queda da saturação, o O₂ entra.',
      ],
      aValidar: 'Conduta do caso didático — conferir com o protocolo de choque do serviço.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'saturacao', titulo: 'SpO₂ 97%', texto: 'em ar ambiente', estado: 'sim' },
          { icone: 'pulmao', titulo: 'Sem esforço', texto: 'respiração regular', estado: 'sim' },
          { icone: 'x', titulo: 'Oxigenoterapia', texto: 'não se aplica agora', estado: 'nao' },
        ],
      },
      linha: { id: 'o2', secao: 'oxigenoterapia', texto: 'Não se aplica no momento (SpO₂ 97% em ar ambiente)' },
    },

    // 3. DIETA ---------------------------------------------------------------
    {
      id: 'dieta',
      secao: 'dieta',
      curto: 'Dieta',
      titulo: 'Dieta',
      explicacao: [
        'Enquanto recebe a fase rápida pela veia e está sonolenta, Ana fica em jejum (risco de vomitar e aspirar).',
        'Assim que conseguir beber, começa o soro de reidratação oral (SRO). A alimentação habitual volta logo depois — e o leite materno nunca é suspenso.',
      ],
      aValidar: 'Momento de iniciar o SRO e de retomar a dieta no Plano C.',
      fonte: 'MS — Manejo do paciente com diarreia',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'jejum', titulo: 'Jejum', texto: 'durante a fase rápida', estado: 'sim' },
          { icone: 'gota', titulo: 'SRO', texto: 'assim que conseguir beber', estado: 'atencao' },
          { icone: 'seio', titulo: 'Leite materno', texto: 'manter', estado: 'sim' },
        ],
      },
      linha: {
        id: 'dieta',
        secao: 'dieta',
        texto: 'Dieta zero durante a fase rápida',
        detalhe: 'Iniciar SRO assim que aceitar via oral; depois, dieta habitual para a idade. Manter leite materno.',
      },
    },

    // 4. HIDRATAÇÃO — FASE RÁPIDA --------------------------------------------
    {
      id: 'expansao-volume',
      secao: 'hidratacao',
      curto: 'Expansão',
      titulo: 'Fase rápida: quanto soro fisiológico?',
      explicacao: [
        `A fase rápida (expansão) devolve depressa o líquido que falta dentro dos vasos. Usa-se soro fisiológico (SF 0,9%) em mL por kg: ${EXPANSAO_ML_KG} mL para cada kg.`,
        'Cada bloco da animação é 1 kg da Ana recebendo os seus mL. A soma é o volume da expansão.',
      ],
      conta: {
        formula: 'Volume = mL/kg × peso',
        substituicao: `${EXPANSAO_ML_KG} mL/kg × ${fmt(PESO_KG)} kg`,
        resultado: `${fmt(expansaoMl)} mL de SF 0,9%`,
        rascunho: `Expansão: ${EXPANSAO_ML_KG} × ${fmt(PESO_KG)} = ${fmt(expansaoMl)} mL de SF`,
      },
      aValidar: `${EXPANSAO_ML_KG} mL/kg de SF 0,9% em ${EXPANSAO_TEMPO_MIN} min, repetindo até hidratar (crianças < 5 anos).`,
      fonte: 'MS — Manejo do paciente com diarreia (Plano C)',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: EXPANSAO_ML_KG,
        unidade: 'mL',
        pesoKg: PESO_KG,
        total: expansaoMl,
        rotuloTotal: `${fmt(expansaoMl)} mL de SF 0,9%`,
      },
      linha: { id: 'expansao', secao: 'hidratacao', texto: `SF 0,9% — ${fmt(expansaoMl)} mL (${EXPANSAO_ML_KG} mL/kg) EV — fase rápida` },
    },
    {
      id: 'expansao-vazao',
      secao: 'hidratacao',
      curto: 'Exp.: vazão',
      titulo: 'Em quanto tempo? (vazão da expansão)',
      explicacao: [
        `A expansão corre em ${EXPANSAO_TEMPO_MIN} minutos. A bomba de infusão (BIC) é programada em mL por HORA, então a conta precisa transformar minutos em horas.`,
        `${EXPANSAO_TEMPO_MIN} minutos = meia hora. Se ${fmt(expansaoMl)} mL correm em meia hora, em uma hora correriam o dobro.`,
      ],
      conta: {
        formula: 'Vazão (mL/h) = volume × 60 ÷ tempo (min)',
        substituicao: `${fmt(expansaoMl)} mL × 60 ÷ ${EXPANSAO_TEMPO_MIN} min`,
        resultado: `${fmt(expansaoVazao)} mL/h`,
        rascunho: `Vazão expansão: ${fmt(expansaoMl)} × 60 ÷ ${EXPANSAO_TEMPO_MIN} = ${fmt(expansaoVazao)} mL/h`,
      },
      dica: 'Recém-nascidos e cardiopatas graves começam com 10 mL/kg (MS). Crianças com 5 anos ou mais seguem outro esquema (30 mL/kg de SF + Ringer lactato).',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: false },
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC da expansão' },
        },
        estado: {
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: true },
          bic: { vazaoMlH: expansaoVazao, ligada: true, rotulo: 'BIC da expansão' },
          fluxos: ['bolsa-bic', 'bic-paciente'],
          balao: `${fmt(expansaoMl)} mL em ${EXPANSAO_TEMPO_MIN} min`,
        },
      },
      linha: {
        id: 'expansao',
        secao: 'hidratacao',
        texto: expansaoTexto,
        detalhe: 'Fase rápida. Reavaliar ao fim; repetir 20 mL/kg até a criança estar hidratada.',
      },
    },
    {
      id: 'reavaliar',
      secao: 'hidratacao',
      curto: 'Reavaliar',
      titulo: 'Acabou a expansão: e agora?',
      explicacao: [
        'Ao fim de cada expansão, examine de novo. Se ainda houver sinais de desidratação grave, repete-se a mesma expansão.',
        'Quando a criança estiver hidratada (mais alerta, pulso cheio, enchimento capilar rápido, urinando), começa a fase de MANUTENÇÃO + REPOSIÇÃO, que são os próximos itens.',
      ],
      aValidar: 'Critérios clínicos de hidratação para encerrar a fase rápida.',
      fonte: 'MS — Manejo do paciente com diarreia',
      cena: {
        tipo: 'cartoes',
        titulo: 'Hidratada? Confira:',
        cartoes: [
          { icone: 'cerebro', titulo: 'Mais alerta', estado: 'sim' },
          { icone: 'coracao', titulo: 'Pulso cheio', texto: 'enchimento capilar < 2 s', estado: 'sim' },
          { icone: 'gota', titulo: 'Urinou', texto: 'diurese presente', estado: 'sim' },
          { icone: 'alerta', titulo: 'Ainda grave?', texto: 'repetir 20 mL/kg', estado: 'atencao' },
        ],
      },
    },

    // 4. HIDRATAÇÃO — MANUTENÇÃO ----------------------------------------------
    {
      id: 'manutencao-volume',
      secao: 'hidratacao',
      curto: 'Holliday',
      titulo: 'Soro de manutenção: quanto por dia? (Holliday-Segar)',
      explicacao: [
        'O soro de manutenção repõe o que o corpo gasta num dia normal. A regra de Holliday-Segar é por faixas de peso: 100 mL/kg nos primeiros 10 kg e 50 mL/kg em cada kg de 10 a 20.',
        `Ana tem ${fmt(PESO_KG)} kg: 10 blocos de 100 mL (laranja) + ${fmt(PESO_KG - 10)} blocos de 50 mL (azul).`,
      ],
      conta: {
        formula: 'Holliday-Segar = 100 mL/kg (até 10 kg) + 50 mL/kg (de 10 a 20 kg)',
        substituicao: `10 kg × 100 mL = ${fmt(hollidayAte10)} mL`,
        passos: [`${fmt(PESO_KG - 10)} kg × 50 mL = ${fmt(hollidayAcima10)} mL`],
        resultado: `${fmt(hollidayAte10)} + ${fmt(hollidayAcima10)} = ${fmt(holliday)} mL por dia`,
        rascunho: `Holliday: 10 × 100 + ${fmt(PESO_KG - 10)} × 50 = ${fmt(holliday)} mL/dia`,
      },
      fonte: 'Holliday & Segar (1957) — fórmula',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: 100,
        unidade: 'mL',
        pesoKg: PESO_KG,
        faixas: [
          { kg: 10, valorPorKg: 100 },
          { kg: PESO_KG - 10, valorPorKg: 50 },
        ],
        total: holliday,
        rotuloTotal: `${fmt(holliday)} mL em 24 h`,
      },
      linha: { id: 'manutencao', secao: 'hidratacao', texto: `Soro de manutenção — ${fmt(holliday)} mL/dia (Holliday-Segar), EV` },
    },
    {
      id: 'manutencao-4-1',
      secao: 'hidratacao',
      curto: 'Soro 4:1',
      titulo: 'Montando o soro: proporção 4:1',
      explicacao: [
        'No esquema do MS para diarreia, o soro de manutenção é feito com SG 5% e SF 0,9% na proporção 4:1 — de cada 5 partes, 4 são de soro glicosado e 1 de soro fisiológico.',
        `Então dividimos os ${fmt(holliday)} mL em 5 partes iguais: 4 partes de SG 5% e 1 parte de SF 0,9%.`,
      ],
      conta: {
        formula: 'Proporção 4:1 → SG 5% = 4/5 do volume; SF 0,9% = 1/5',
        substituicao: `SG 5%: ${fmt(holliday)} × 4 ÷ 5 = ${fmt(manutSG)} mL`,
        passos: [`SF 0,9%: ${fmt(holliday)} × 1 ÷ 5 = ${fmt(manutSF)} mL`],
        resultado: `SG 5% ${fmt(manutSG)} mL + SF 0,9% ${fmt(manutSF)} mL`,
        rascunho: `4:1 → SG 5% ${fmt(manutSG)} mL + SF ${fmt(manutSF)} mL`,
      },
      aValidar: 'Proporção 4:1 (SG 5% : SF 0,9%) na fase de manutenção.',
      fonte: 'MS — Manejo do paciente com diarreia',
      cena: {
        tipo: 'mistura',
        recipiente: `Soro de manutenção — ${fmt(holliday)} mL`,
        componentes: [
          { rotulo: `SG 5% — ${fmt(manutSG)} mL`, volumeMl: manutSG, cor: 'glicose' },
          { rotulo: `SF 0,9% — ${fmt(manutSF)} mL`, volumeMl: manutSF, cor: 'sf' },
        ],
      },
      linha: { id: 'manutencao', secao: 'hidratacao', texto: `Soro de manutenção: ${manutComposicao} — EV em 24 h` },
    },
    {
      id: 'manutencao-kcl',
      secao: 'hidratacao',
      curto: 'KCl',
      titulo: 'Acrescentando o potássio (KCl 10%)',
      explicacao: [
        `A diarreia leva potássio embora (o da Ana está em ${fmt(K_ADMISSAO)}). No esquema do MS, entram 2 mL de KCl 10% para cada 100 mL do soro de manutenção.`,
        `Quantas vezes 100 mL cabem em ${fmt(holliday)} mL? ${fmt(holliday / 100)} vezes. Então são ${fmt(holliday / 100)} × 2 mL de KCl 10%.`,
      ],
      conta: {
        formula: 'KCl 10% = 2 mL para cada 100 mL de soro',
        substituicao: `${fmt(holliday)} mL ÷ 100 × 2 mL`,
        resultado: `${fmt(kclMl)} mL de KCl 10%`,
        rascunho: `KCl 10%: ${fmt(holliday)} ÷ 100 × 2 = ${fmt(kclMl)} mL`,
      },
      dica: 'Potássio só entra no soro depois que a criança urinar: se o rim não funciona, o potássio se acumula no sangue e pode parar o coração.',
      aValidar: 'KCl 10% 2 mL/100 mL na manutenção; só após diurese.',
      fonte: 'MS — Manejo do paciente com diarreia',
      cena: {
        tipo: 'mistura',
        recipiente: `Soro de manutenção — ${fmt(manutTotal)} mL`,
        jaPresentes: 2,
        componentes: [
          { rotulo: `SG 5% — ${fmt(manutSG)} mL`, volumeMl: manutSG, cor: 'glicose' },
          { rotulo: `SF 0,9% — ${fmt(manutSF)} mL`, volumeMl: manutSF, cor: 'sf' },
          { rotulo: `KCl 10% — ${fmt(kclMl)} mL`, volumeMl: kclMl, cor: 'medicacao' },
        ],
      },
      linha: { id: 'manutencao', secao: 'hidratacao', texto: `Soro de manutenção: ${manutComKcl} — EV em 24 h`, detalhe: 'Acrescentar o KCl só com diurese presente' },
    },
    {
      id: 'manutencao-composicao',
      secao: 'hidratacao',
      curto: 'Na e K do soro',
      titulo: 'Quanto sódio e potássio tem esse soro?',
      explicacao: [
        `Para saber a concentração, dividimos os mEq pelo volume em litros. O KCl 10% tem ≈ ${fmt(KCL10_MEQ_ML)} mEq por mL e o SF 0,9% tem ≈ ${fmt(SF_MEQ_ML, 3)} mEq por mL.`,
        `Resultado: potássio ≈ ${fmt(kMeqL, 0)} mEq/L (abaixo do limite de ${K_MAXIMO_PERIFERICO_MEQ_L} mEq/L para veia periférica) e sódio ≈ ${fmt(naMeqL, 0)} mEq/L — bem menos que o sangue (135 a 145). É um soro HIPOTÔNICO.`,
      ],
      conta: {
        formula: 'Concentração (mEq/L) = mEq ÷ volume (L)',
        substituicao: `K⁺: ${fmt(kclMl)} mL × ${fmt(KCL10_MEQ_ML)} = ${fmt(kMeq)} mEq ÷ ${fmt(manutTotal / 1000, 3)} L`,
        passos: [`Na⁺: ${fmt(manutSF)} mL × ${fmt(SF_MEQ_ML, 3)} = ${fmt(naMeq)} mEq ÷ ${fmt(manutTotal / 1000, 3)} L`],
        resultado: `K⁺ ≈ ${fmt(kMeqL, 0)} mEq/L · Na⁺ ≈ ${fmt(naMeqL, 0)} mEq/L`,
        rascunho: `K⁺ ${fmt(kMeq)} ÷ ${fmt(manutTotal / 1000, 3)} ≈ ${fmt(kMeqL, 0)} mEq/L · Na⁺ ${fmt(naMeq)} ÷ ${fmt(manutTotal / 1000, 3)} ≈ ${fmt(naMeqL, 0)} mEq/L`,
      },
      dica: 'Soro hipotônico pode baixar o sódio do sangue (hiponatremia). Por isso a AAP (2018) recomenda soro de manutenção ISOTÔNICO dos 28 dias aos 18 anos. Veja o roteiro de hiponatremia.',
      aValidar: `Limite de K⁺ em veia periférica (${K_MAXIMO_PERIFERICO_MEQ_L} mEq/L) e a divergência MS (4:1) × AAP 2018 (isotônico).`,
      fonte: 'MS · AAP 2018 (Feld et al.)',
      cena: {
        tipo: 'regua',
        reguas: [
          {
            titulo: 'Potássio no soro',
            unidade: 'mEq/L',
            minimo: 0,
            maximo: 100,
            faixas: [
              { ate: K_MAXIMO_PERIFERICO_MEQ_L, rotulo: `Veia periférica (até ${K_MAXIMO_PERIFERICO_MEQ_L})`, tom: 'normal' },
              { ate: 80, rotulo: 'Só em acesso central, conforme protocolo', tom: 'atencao' },
              { ate: 100, rotulo: 'Perigoso', tom: 'perigo' },
            ],
            valor: kMeqL,
            rotuloValor: 'soro da Ana',
            casas: 0,
          },
          {
            titulo: 'Sódio no soro',
            unidade: 'mEq/L',
            minimo: 0,
            maximo: 160,
            faixas: [
              { ate: 130, rotulo: 'Hipotônico (< 130)', tom: 'atencao' },
              { ate: 160, rotulo: 'Isotônico (≈ 130 a 154, como o SF)', tom: 'normal' },
            ],
            valor: naMeqL,
            rotuloValor: 'soro da Ana',
            marcos: [{ valor: 140, rotulo: 'sangue ≈ 140' }],
            casas: 0,
          },
        ],
      },
      linha: {
        id: 'manutencao',
        secao: 'hidratacao',
        texto: `Soro de manutenção: ${manutComKcl} — EV em 24 h`,
        detalhe: `Acrescentar o KCl só com diurese presente · ${manutDetalhe}`,
      },
    },
    {
      id: 'manutencao-vazao',
      secao: 'hidratacao',
      curto: 'Manut.: vazão',
      titulo: 'Soro de manutenção: quantos mL por hora?',
      explicacao: [
        `O soro todo (${fmt(manutSG)} + ${fmt(manutSF)} + ${fmt(kclMl)} = ${fmt(manutTotal)} mL) corre em 24 horas. Dividimos por 24 para programar a BIC.`,
        'Arredondamos para uma casa decimal, que é o que a maioria das bombas aceita.',
      ],
      conta: {
        formula: 'Vazão = volume total ÷ 24 h',
        substituicao: `${fmt(manutTotal)} mL ÷ 24 h`,
        resultado: `≈ ${fmt(vazaoManut, 1)} mL/h`,
        rascunho: `Vazão manutenção: ${fmt(manutTotal)} ÷ 24 ≈ ${fmt(vazaoManut, 1)} mL/h`,
      },
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          bolsa: { rotulo: '4:1 + KCl', cor: 'glicose', gotejando: false },
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC da manutenção' },
        },
        estado: {
          bolsa: { rotulo: '4:1 + KCl', cor: 'glicose', gotejando: true },
          bic: { vazaoMlH: vazaoManut, ligada: true, rotulo: 'BIC da manutenção' },
          fluxos: ['bolsa-bic', 'bic-paciente'],
        },
      },
      linha: {
        id: 'manutencao',
        secao: 'hidratacao',
        texto: `Soro de manutenção: ${manutComKcl} — EV em 24 h, BIC ${fmt(vazaoManut, 1)} mL/h`,
        detalhe: `Iniciar após a fase rápida · KCl só com diurese presente · ${manutDetalhe}`,
      },
    },
    {
      id: 'reposicao',
      secao: 'hidratacao',
      curto: 'Reposição',
      titulo: 'Soro de reposição: para as perdas que continuam',
      explicacao: [
        `A diarreia não para de uma hora para outra. O soro de reposição cobre essas perdas: ${REPOSICAO_ML_KG_DIA} mL/kg/dia, com SG 5% e SF 0,9% em partes iguais (1:1).`,
        'Esse volume é só o ponto de partida: aumenta ou diminui conforme o número de evacuações e vômitos.',
      ],
      conta: {
        formula: `Reposição = ${REPOSICAO_ML_KG_DIA} mL/kg/dia × peso, em SG 5% + SF 0,9% (1:1)`,
        substituicao: `${REPOSICAO_ML_KG_DIA} × ${fmt(PESO_KG)} = ${fmt(reposicaoMl)} mL/dia`,
        passos: [`${fmt(reposicaoMl)} ÷ 2 = ${fmt(repSG)} mL de SG 5% + ${fmt(repSF)} mL de SF 0,9%`, `Vazão: ${fmt(reposicaoMl)} ÷ 24 h = ${fmt(vazaoRep, 1)} mL/h`],
        resultado: `SG 5% ${fmt(repSG)} mL + SF 0,9% ${fmt(repSF)} mL em 24 h — ${fmt(vazaoRep, 1)} mL/h`,
        rascunho: `Reposição: ${REPOSICAO_ML_KG_DIA} × ${fmt(PESO_KG)} = ${fmt(reposicaoMl)} mL (${fmt(repSG)} SG + ${fmt(repSF)} SF) ÷ 24 = ${fmt(vazaoRep, 1)} mL/h`,
      },
      aValidar: `Reposição inicial de ${REPOSICAO_ML_KG_DIA} mL/kg/dia em SG 5% + SF 0,9% 1:1.`,
      fonte: 'MS — Manejo do paciente com diarreia',
      cena: {
        tipo: 'mistura',
        recipiente: `Soro de reposição — ${fmt(reposicaoMl)} mL`,
        componentes: [
          { rotulo: `SG 5% — ${fmt(repSG)} mL`, volumeMl: repSG, cor: 'glicose' },
          { rotulo: `SF 0,9% — ${fmt(repSF)} mL`, volumeMl: repSF, cor: 'sf' },
        ],
        resumo: [
          { rotulo: 'Na⁺', valor: `≈ ${fmt(repNaMeqL, 0)} mEq/L`, tom: 'info' },
          { rotulo: 'Vazão', valor: `${fmt(vazaoRep, 1)} mL/h`, tom: 'info' },
        ],
      },
      linha: {
        id: 'reposicao',
        secao: 'hidratacao',
        texto: `Soro de reposição: SG 5% ${fmt(repSG)} mL + SF 0,9% ${fmt(repSF)} mL — EV em 24 h, BIC ${fmt(vazaoRep, 1)} mL/h`,
        detalhe: `${REPOSICAO_ML_KG_DIA} mL/kg/dia — reajustar conforme as perdas (evacuações e vômitos)`,
      },
    },

    // 5. ANTIMICROBIANOS -------------------------------------------------------
    {
      id: 'antibiotico',
      secao: 'antimicrobianos',
      curto: 'Antibiótico?',
      titulo: 'Precisa de antibiótico?',
      explicacao: [
        'Na diarreia aguda aquosa, quase sempre causada por vírus, antibiótico NÃO é rotina: não encurta a doença e pode causar efeitos colaterais.',
        'Ele é considerado em situações específicas, como disenteria (sangue nas fezes) com comprometimento do estado geral ou suspeita de cólera grave.',
      ],
      aValidar: 'Indicações de antibiótico na diarreia aguda.',
      fonte: 'MS — Manejo do paciente com diarreia',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'gota', titulo: 'Diarreia aquosa', texto: 'sem sangue', estado: 'sim' },
          { icone: 'alerta', titulo: 'Sangue nas fezes?', texto: 'aí se considera ATB', estado: 'atencao' },
          { icone: 'x', titulo: 'Antibiótico', texto: 'não indicado', estado: 'nao' },
        ],
      },
      linha: { id: 'atb', secao: 'antimicrobianos', texto: 'Não indicado (diarreia aguda aquosa, sem sangue nas fezes)' },
    },

    // 6. DEMAIS MEDICAÇÕES -----------------------------------------------------
    {
      id: 'zinco',
      secao: 'demais',
      curto: 'Zinco',
      titulo: 'Zinco',
      explicacao: [
        'O zinco por via oral diminui a duração e a gravidade da diarreia e as recaídas nos meses seguintes. A dose depende da idade, não do peso.',
        'Começa quando a criança aceitar a via oral e segue por 10 a 14 dias, mesmo depois que a diarreia parar.',
      ],
      aValidar: 'Zinco: < 6 meses 10 mg/dia; ≥ 6 meses 20 mg/dia, 1 vez ao dia, por 10 a 14 dias.',
      fonte: 'MS / OMS — Manejo do paciente com diarreia',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'relogio', titulo: '< 6 meses', texto: '10 mg/dia', estado: 'nao' },
          { icone: 'check', titulo: '≥ 6 meses', texto: '20 mg/dia (Ana: 2 anos)', estado: 'sim' },
          { icone: 'documento', titulo: 'Duração', texto: '10 a 14 dias', estado: 'sim' },
        ],
      },
      linha: { id: 'zinco', secao: 'demais', texto: 'Zinco — 20 mg VO 1 vez ao dia, por 10 a 14 dias', detalhe: 'Iniciar quando aceitar a via oral' },
    },

    // 7. EXAMES ----------------------------------------------------------------
    {
      id: 'exames',
      secao: 'exames',
      curto: 'Exames',
      titulo: 'Exames solicitados',
      explicacao: [
        'Na desidratação grave, os eletrólitos (Na, K), a função dos rins (ureia e creatinina) e a gasometria mostram o tamanho do problema e guiam o soro.',
        'Depois da reidratação, repetem-se sódio e potássio para ajustar a manutenção.',
      ],
      aValidar: 'Lista de exames e momento de repetir os eletrólitos.',
      fonte: 'SBP',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'tubo', titulo: 'Na, K', texto: 'repetir após reidratar', estado: 'atencao' },
          { icone: 'tubo', titulo: 'Ureia e creatinina', estado: 'sim' },
          { icone: 'tubo', titulo: 'Gasometria venosa', estado: 'sim' },
          { icone: 'glicemia', titulo: 'Glicemia capilar', estado: 'sim' },
        ],
      },
      linha: {
        id: 'exames',
        secao: 'exames',
        texto: 'Na, K, ureia, creatinina, gasometria venosa, glicemia capilar',
        detalhe: 'Repetir Na e K após a fase rápida',
      },
    },

    // 8. ORIENTAÇÕES -------------------------------------------------------------
    {
      id: 'orientacoes',
      secao: 'orientacoes',
      curto: 'Cuidados',
      titulo: 'Orientações e cuidados',
      explicacao: [
        'A hidratação é guiada pela reavaliação: por isso a equipe precisa pesar, medir o que entra e o que sai, e reexaminar ao fim de cada expansão.',
        'Também é preciso saber quando chamar: sem diurese, piora do estado geral, convulsão ou sinais de excesso de soro (inchaço, estertores, fígado aumentado).',
      ],
      aValidar: 'Frequência de reavaliação e critérios para comunicar — conferir com o protocolo do serviço.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'balanca', titulo: 'Peso', texto: 'na admissão e diário', estado: 'sim' },
          { icone: 'gota', titulo: 'Balanço hídrico', texto: 'diurese, evacuações, vômitos', estado: 'sim' },
          { icone: 'coracao', titulo: 'Reavaliar', texto: 'ao fim de cada expansão', estado: 'sim' },
          { icone: 'alerta', titulo: 'Comunicar', texto: 'sem diurese, convulsão, piora, inchaço', estado: 'atencao' },
        ],
      },
      linha: {
        id: 'orientacoes',
        secao: 'orientacoes',
        texto: 'Peso na admissão e diário · Balanço hídrico (diurese, evacuações, vômitos) · Reavaliar a hidratação ao fim de cada expansão',
        detalhe: 'Comunicar: ausência de diurese, piora do estado geral, convulsão ou sinais de sobrecarga (edema, estertores, fígado aumentado)',
      },
    },

    // 9. SINAN -----------------------------------------------------------------
    {
      id: 'sinan',
      secao: 'sinan',
      curto: 'SINAN',
      titulo: 'Notificação SINAN',
      explicacao: [
        'Um caso isolado de diarreia aguda não é notificado individualmente.',
        'Mas SURTOS de diarreia (vários casos ligados, como numa creche) são notificados, e a suspeita de cólera é de notificação imediata.',
      ],
      aValidar: 'Conferir a lista nacional de notificação compulsória vigente.',
      fonte: 'MS',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'x', titulo: 'Caso isolado', texto: 'não se aplica', estado: 'nao' },
          { icone: 'documento', titulo: 'Surto de diarreia', texto: 'notificar', estado: 'atencao' },
          { icone: 'documento', titulo: 'Suspeita de cólera', texto: 'notificação imediata', estado: 'atencao' },
        ],
      },
      linha: { id: 'sinan', secao: 'sinan', texto: 'Não se aplica (caso isolado)', detalhe: 'Surto de diarreia ou suspeita de cólera: notificar' },
    },

    // REVISÃO --------------------------------------------------------------------
    {
      id: 'revisao',
      secao: 'revisao',
      curto: 'Revisão',
      titulo: 'Revisão final',
      explicacao: [
        'Confira a ordem: primeiro a fase rápida, reavaliação, e só então manutenção + reposição.',
        `Some tudo o que entra em 24 h: manutenção ${fmt(manutTotal)} mL + reposição ${fmt(reposicaoMl)} mL = ${fmt(arredondar(manutTotal + reposicaoMl, 1))} mL, fora as expansões. Esse total deve fazer sentido para uma criança de ${fmt(PESO_KG)} kg com perdas.`,
      ],
      cena: {
        tipo: 'conclusao',
        itens: [
          `Paciente certa — Ana, ${fmt(PESO_KG)} kg`,
          `Expansão — ${fmt(expansaoMl)} mL de SF em ${EXPANSAO_TEMPO_MIN} min (${fmt(expansaoVazao)} mL/h)`,
          `Manutenção — ${fmt(manutTotal)} mL/dia a ${fmt(vazaoManut, 1)} mL/h`,
          `K⁺ no soro ≈ ${fmt(kMeqL, 0)} mEq/L (seguro em periférica)`,
          `Reposição — ${fmt(reposicaoMl)} mL/dia a ${fmt(vazaoRep, 1)} mL/h`,
        ],
      },
    },
  ],
};
