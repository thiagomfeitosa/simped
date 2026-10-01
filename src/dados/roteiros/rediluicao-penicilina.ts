/**
 * Roteiro — Diluição, rediluição e seringa da BIC: penicilina G cristalina num
 * prematuro com sífilis congênita. Mostra as TRÊS concentrações do preparo:
 * frasco reconstituído → rediluição → seringa de 12 mL (fator de correção da BIC).
 *
 * CASO DIDÁTICO. Dose do docs/fase-0/doses-rascunho.md (MS) — TUDO "A VALIDAR".
 * Tempo de infusão, volume de reconstituição e condutas: conhecimento geral do
 * assistente, também "A VALIDAR".
 * Os números são calculados pelo motor de cálculo src/calculos/ (o mesmo do Prescrever).
 */
import {
  arredondar,
  concentracao,
  diluir,
  doseTotal,
  prepararSeringaBic,
  vazaoDoVolume,
  volumeAspirar,
} from '../../calculos';
import { fmt } from '../../logica/formatacao';
import { HOSPITAIS } from '../hospitais';
import type { Roteiro } from './tipos';

// ---- Dados do caso ---------------------------------------------------------
const PESO_KG = 1.4;
const IG_SEMANAS = 32;
const DIAS_DE_VIDA = 3;
const VOLUME_FINAL_BIC_ML = HOSPITAIS.santaCasa.volumeFinalBicMl; // Santa Casa: 12 mL

// Penicilina G cristalina (A VALIDAR — MS, PCDT Sífilis: 50.000 UI/kg/dose 12/12 h até 7 dias de vida, por 10 dias)
const DOSE_UI_KG = 50_000;
const INTERVALO_H = 12;
const DIAS_TRATAMENTO = 10;
const FRASCO_UI = 5_000_000;
const DILUENTE_ML = 10; // A VALIDAR — volume de reconstituição (o pó não ocupa volume, por enquanto)
const TEMPO_INFUSAO_MIN = 30; // A VALIDAR — exemplo didático, sem fonte

// Rediluição: aspira 1 mL do frasco e completa até 10 mL
const REDIL_ASPIRAR_ML = 1;
const REDIL_FINAL_ML = 10;

// Erro de medida usado na comparação (uma "risquinha" de seringa de 1 mL)
const ERRO_MEDIDA_ML = 0.01;

// ---- Contas ----------------------------------------------------------------
const dose = doseTotal({ dosePorKg: DOSE_UI_KG, pesoKg: PESO_KG }).dose;
const concFrasco = concentracao({ quantidade: FRASCO_UI, volumeMl: DILUENTE_ML });
const volumeDireto = arredondar(volumeAspirar({ dose, concentracao: concFrasco }), 3);
const redil = diluir({ concentracaoInicial: concFrasco, volumeAspiradoMl: REDIL_ASPIRAR_ML, volumeFinalMl: REDIL_FINAL_ML });
const concRedil = redil.concentracaoFinal;
const adRedil = redil.volumeDiluenteMl;
const volumeRedil = arredondar(volumeAspirar({ dose, concentracao: concRedil }), 2);
const bicResultado = prepararSeringaBic({ volumeMedicacaoMl: volumeRedil, volumeFinalMl: VOLUME_FINAL_BIC_ML, quantidadeDeDroga: dose });
if (!bicResultado.aplicavel) throw new Error(bicResultado.motivo);
const sfBic = arredondar(bicResultado.volumeSoroMl, 2);
const concBic = bicResultado.concentracaoFinal ?? dose / VOLUME_FINAL_BIC_ML;
const vazao = vazaoDoVolume(VOLUME_FINAL_BIC_ML, TEMPO_INFUSAO_MIN);
const erroDireto = (ERRO_MEDIDA_ML / volumeDireto) * 100;
const erroRedil = (ERRO_MEDIDA_ML / volumeRedil) * 100;
const dosesNaRediluicao = Math.floor((concRedil * REDIL_FINAL_ML) / dose);

// ---- Textos ----------------------------------------------------------------
const UI = (n: number) => `${fmt(n, 0)} UI`;
const idTexto = `RN de Clara Lima · ${DIAS_DE_VIDA} dias de vida · IG ${IG_SEMANAS} semanas · Peso ${fmt(PESO_KG * 1000)} g`;
const peniTexto = `Penicilina G cristalina — ${UI(dose)} EV de ${INTERVALO_H}/${INTERVALO_H} h por ${DIAS_TRATAMENTO} dias`;
const passoReconstituir = `Reconstituir ${UI(FRASCO_UI)} em ${DILUENTE_ML} mL de AD (${UI(concFrasco)}/mL)`;
const passoRediluir = `rediluir ${fmt(REDIL_ASPIRAR_ML)} mL + AD ${fmt(adRedil)} mL = ${REDIL_FINAL_ML} mL (${UI(concRedil)}/mL)`;
const passoAspirar = `aspirar ${fmt(volumeRedil)} mL`;
const passoBic = `+ SF 0,9% ${fmt(sfBic)} mL = ${VOLUME_FINAL_BIC_ML} mL`;

// ---- Desenhos ----------------------------------------------------------------
const frascoPo = { modelo: 'frasco-po' as const, rotulo: 'Penicilina cristalina', sublinha: `${UI(FRASCO_UI)} · pó`, nivel: 0, cor: 'medicacao' as const, po: true };
const NIVEL_FRASCO_CHEIO = 0.62;
const frascoPronto = { ...frascoPo, sublinha: `${UI(concFrasco)}/mL`, nivel: NIVEL_FRASCO_CHEIO, po: false };
const frascoDepoisRedil = { ...frascoPronto, nivel: NIVEL_FRASCO_CHEIO * (1 - REDIL_ASPIRAR_ML / DILUENTE_ML) };
const reservaRedil = {
  modelo: 'seringa' as const,
  rotulo: 'Rediluição',
  sublinha: `${UI(concRedil)}/mL · ${REDIL_FINAL_ML} mL`,
  nivel: 1,
  cor: 'mistura' as const,
};
const seringaRedil = {
  capacidadeMl: 10,
  rotulo: `Seringa 10 mL — ${UI(concRedil)}/mL`,
  camadas: [
    { volumeMl: REDIL_ASPIRAR_ML, cor: 'medicacao' as const, rotulo: `Penicilina ${fmt(REDIL_ASPIRAR_ML)} mL` },
    { volumeMl: adRedil, cor: 'agua' as const, rotulo: `AD ${fmt(adRedil)} mL` },
  ],
};
const seringaDose = {
  capacidadeMl: 20,
  rotulo: 'Seringa 20 mL',
  camadas: [{ volumeMl: volumeRedil, cor: 'mistura' as const, rotulo: `Rediluição ${fmt(volumeRedil)} mL` }],
};
const seringaBicPronta = {
  capacidadeMl: 20,
  rotulo: `Seringa 20 mL — ${VOLUME_FINAL_BIC_ML} mL`,
  camadas: [
    { volumeMl: volumeRedil, cor: 'mistura' as const, rotulo: `Penicilina ${fmt(volumeRedil)} mL` },
    { volumeMl: sfBic, cor: 'sf' as const, rotulo: `SF 0,9% ${fmt(sfBic)} mL` },
  ],
};

export const roteiroRediluicaoPenicilina: Roteiro = {
  id: 'rediluicao-penicilina',
  tema: 'Preparo: diluição, BIC e infusão',
  titulo: 'Rediluição + seringa da BIC — penicilina no prematuro',
  resumo: 'Reconstituição, por que rediluir quando o volume é minúsculo, rediluição (C1 × V1 = C2 × V2) e a seringa de 12 mL.',
  paciente: {
    nome: 'RN de Clara Lima',
    descricao: `prematuro ${IG_SEMANAS} sem, ${fmt(PESO_KG * 1000)} g, sífilis congênita`,
  },
  etapas: [
    // 1. IDENTIFICAÇÃO -------------------------------------------------------
    {
      id: 'identificacao',
      secao: 'identificacao',
      curto: 'Paciente',
      titulo: 'Quem é o paciente?',
      explicacao: [
        `RN de Clara Lima: prematuro de ${IG_SEMANAS} semanas, ${DIAS_DE_VIDA} dias de vida, ${fmt(PESO_KG * 1000)} g. A mãe teve sífilis e não foi tratada no pré-natal.`,
        'O VDRL do bebê veio 4 vezes maior que o da mãe e o líquor (LCR) está alterado: é sífilis congênita com neurossífilis, e o tratamento é penicilina G cristalina pela veia.',
      ],
      dica: `Prematuro pequeno = doses pequenas. Converta o peso: ${fmt(PESO_KG * 1000)} g = ${fmt(PESO_KG)} kg.`,
      aValidar: 'Critérios de sífilis congênita e escolha da penicilina cristalina (caso didático).',
      fonte: 'MS — PCDT Sífilis',
      cena: {
        tipo: 'paciente',
        perfil: 'rn',
        pesoKg: PESO_KG,
        rotulos: [
          { rotulo: 'Idade', valor: `${DIAS_DE_VIDA} dias de vida` },
          { rotulo: 'IG ao nascer', valor: `${IG_SEMANAS} semanas` },
          { rotulo: 'Peso', valor: `${fmt(PESO_KG * 1000)} g` },
          { rotulo: 'Diagnóstico', valor: 'sífilis congênita · LCR alterado' },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto, detalhe: 'UTI neonatal · Sífilis congênita com neurossífilis' },
    },

    // 3. DIETA ---------------------------------------------------------------
    {
      id: 'dieta',
      secao: 'dieta',
      curto: 'Dieta',
      titulo: 'Dieta',
      explicacao: [
        'A sífilis não contraindica o leite materno (a não ser que haja lesão na mama). Com 32 semanas, o bebê ainda pode não sugar bem: o leite vai por sonda até ele conseguir mamar.',
      ],
      aValidar: 'Conduta de dieta do caso didático.',
      fonte: 'SBP — Neonatologia',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'seio', titulo: 'Leite materno', texto: 'mantido', estado: 'sim' },
          { icone: 'tubo', titulo: 'Sonda orogástrica', texto: 'enquanto não suga bem', estado: 'sim' },
          { icone: 'alerta', titulo: 'Lesão na mama?', texto: 'aí suspende daquele lado', estado: 'atencao' },
        ],
      },
      linha: { id: 'dieta', secao: 'dieta', texto: 'Leite materno ordenhado por sonda orogástrica, progredir conforme tolerância', detalhe: 'Seio materno quando sugar bem' },
    },

    // 5. PENICILINA — DOSE ---------------------------------------------------
    {
      id: 'dose',
      secao: 'antimicrobianos',
      curto: 'Dose',
      titulo: 'Penicilina cristalina — a dose',
      explicacao: [
        `A dose é por kg e por DOSE: ${UI(DOSE_UI_KG)} para cada kg. Cada bloco é 1 kg do bebê; como ele tem ${fmt(PESO_KG)} kg, o último bloco é só um pedaço.`,
        `Até 7 dias de vida, de ${INTERVALO_H}/${INTERVALO_H} h; depois, o intervalo encurta. O tratamento dura ${DIAS_TRATAMENTO} dias.`,
      ],
      conta: {
        formula: 'Dose = UI/kg × peso',
        substituicao: `${UI(DOSE_UI_KG)}/kg × ${fmt(PESO_KG)} kg`,
        resultado: `${UI(dose)} por dose`,
        rascunho: `Dose: ${UI(DOSE_UI_KG)} × ${fmt(PESO_KG)} = ${UI(dose)}`,
      },
      aValidar: `${UI(DOSE_UI_KG)}/kg/dose EV de ${INTERVALO_H}/${INTERVALO_H} h (até 7 dias de vida) por ${DIAS_TRATAMENTO} dias.`,
      fonte: 'MS — PCDT Sífilis',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: DOSE_UI_KG,
        unidade: 'UI',
        pesoKg: PESO_KG,
        total: dose,
        rotuloTotal: `${UI(dose)} por dose`,
      },
      linha: { id: 'peni', secao: 'antimicrobianos', texto: peniTexto },
    },
    {
      id: 'reconstituir',
      secao: 'antimicrobianos',
      curto: '1ª diluição',
      titulo: 'Primeira diluição: o pó vira líquido',
      explicacao: [
        `A farmácia só tem o frasco de ${UI(FRASCO_UI)}, em pó. Injetamos ${DILUENTE_ML} mL de água destilada (AD) dentro dele: é a reconstituição.`,
        `${UI(FRASCO_UI)} espalhadas em ${DILUENTE_ML} mL: cada mL fica com ${UI(concFrasco)}. É uma solução MUITO concentrada para um bebê de ${fmt(PESO_KG * 1000)} g.`,
      ],
      conta: {
        formula: 'Concentração = quantidade ÷ volume',
        substituicao: `${UI(FRASCO_UI)} ÷ ${DILUENTE_ML} mL`,
        resultado: `${UI(concFrasco)}/mL`,
        rascunho: `Frasco: ${UI(FRASCO_UI)} ÷ ${DILUENTE_ML} = ${UI(concFrasco)}/mL`,
      },
      dica: 'Por enquanto consideramos que o pó não aumenta o volume. Na vida real, alguns frascos ficam com volume final maior que o diluente — a bula informa.',
      aValidar: `Volume de reconstituição (${DILUENTE_ML} mL) e deslocamento do pó — conferir na bula do frasco usado no hospital.`,
      fonte: 'Bula',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: frascoPo,
          seringa: { capacidadeMl: 10, rotulo: 'Seringa 10 mL', camadas: [{ volumeMl: DILUENTE_ML, cor: 'agua', rotulo: `AD ${DILUENTE_ML} mL` }] },
        },
        estado: {
          frasco: frascoPronto,
          seringa: { capacidadeMl: 10, rotulo: 'Seringa 10 mL', camadas: [] },
          fluxos: ['seringa-frasco'],
          balao: `${DILUENTE_ML} mL de AD → ${UI(concFrasco)}/mL`,
        },
      },
      linha: { id: 'peni', secao: 'antimicrobianos', texto: peniTexto, detalhe: passoReconstituir },
    },
    {
      id: 'volume-direto',
      secao: 'antimicrobianos',
      curto: 'Aspirar direto?',
      titulo: 'Quanto aspirar direto do frasco?',
      explicacao: [
        `Mesma conta de sempre: dose ÷ concentração. ${UI(dose)} ÷ ${UI(concFrasco)}/mL.`,
        `Resultado: ${fmt(volumeDireto)} mL. Na seringa de 1 mL, isso é pouco mais de uma risquinha — quase uma gota.`,
      ],
      conta: {
        formula: 'Volume = dose ÷ concentração',
        substituicao: `${UI(dose)} ÷ ${UI(concFrasco)}/mL`,
        resultado: `${fmt(volumeDireto)} mL — pequeno demais!`,
        rascunho: `Direto do frasco: ${UI(dose)} ÷ ${UI(concFrasco)}/mL = ${fmt(volumeDireto)} mL ✗ (muito pouco)`,
      },
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: frascoPronto,
          seringa: { capacidadeMl: 1, rotulo: 'Seringa 1 mL', camadas: [] },
        },
        estado: {
          frasco: frascoPronto,
          seringa: { capacidadeMl: 1, rotulo: 'Seringa 1 mL', camadas: [{ volumeMl: volumeDireto, cor: 'medicacao', rotulo: `${fmt(volumeDireto)} mL` }] },
          fluxos: ['frasco-seringa'],
          balao: `${fmt(volumeDireto)} mL = ${UI(dose)}`,
        },
      },
    },
    {
      id: 'por-que-rediluir',
      secao: 'antimicrobianos',
      curto: 'Por que rediluir?',
      titulo: 'Por que não aspirar só a gotinha?',
      explicacao: [
        `Volume muito pequeno = erro muito grande. Se a mão errar só ${fmt(ERRO_MEDIDA_ML)} mL (uma risquinha da seringa de 1 mL), em ${fmt(volumeDireto)} mL isso já é ${fmt(erroDireto, 0)}% da dose.`,
        `Se a mesma dose estiver em ${fmt(volumeRedil)} mL, o mesmo errinho vira só ${fmt(erroRedil, 1)}%. Além disso, um restinho de líquido sempre fica no bico da seringa e na agulha: em volumes minúsculos, ele "come" parte da dose.`,
        'A solução é REDILUIR: diluir de novo uma parte da primeira solução, para que a dose ocupe um volume que dá para medir com segurança.',
      ],
      conta: {
        formula: 'Erro (%) = erro de medida ÷ volume aspirado × 100',
        substituicao: `${fmt(ERRO_MEDIDA_ML)} ÷ ${fmt(volumeDireto)} × 100 = ${fmt(erroDireto, 0)}%`,
        passos: [`${fmt(ERRO_MEDIDA_ML)} ÷ ${fmt(volumeRedil)} × 100 = ${fmt(erroRedil, 1)}%`],
        resultado: `Rediluir deixa o erro ${fmt(erroDireto / erroRedil, 0)} vezes menor`,
        rascunho: `Erro de ${fmt(ERRO_MEDIDA_ML)} mL: ${fmt(erroDireto, 0)}% (${fmt(volumeDireto)} mL) × ${fmt(erroRedil, 1)}% (${fmt(volumeRedil)} mL)`,
      },
      dica: 'Regra prática de muitos serviços: se o volume a aspirar der menor que 0,1 mL (ou difícil de ler na seringa), redilua. Confira a regra do seu hospital.',
      aValidar: 'Limite de volume a partir do qual o serviço exige rediluição.',
      fonte: 'Protocolo do serviço',
      cena: {
        tipo: 'barras',
        titulo: `Quanto pesa um erro de ${fmt(ERRO_MEDIDA_ML)} mL na dose`,
        unidade: '% da dose',
        casas: 1,
        barras: [
          { rotulo: `Aspirar ${fmt(volumeDireto)} mL`, detalhe: 'direto do frasco', valor: erroDireto, tom: 'perigo' },
          { rotulo: `Aspirar ${fmt(volumeRedil)} mL`, detalhe: 'da rediluição', valor: erroRedil, tom: 'normal' },
        ],
      },
    },
    {
      id: 'rediluir',
      secao: 'antimicrobianos',
      curto: 'Rediluição',
      titulo: 'Rediluição: C1 × V1 = C2 × V2',
      explicacao: [
        `Aspiramos ${fmt(REDIL_ASPIRAR_ML)} mL do frasco (que tem ${UI(concFrasco)}) numa seringa de ${REDIL_FINAL_ML} mL e completamos com ${fmt(adRedil)} mL de AD.`,
        `A quantidade de penicilina na seringa não muda (${UI(concFrasco * REDIL_ASPIRAR_ML)}); só o volume aumenta 10 vezes. Então a concentração cai 10 vezes: ${UI(concRedil)}/mL.`,
      ],
      conta: {
        formula: 'C1 × V1 = C2 × V2 → C2 = C1 × V1 ÷ V2',
        substituicao: `${UI(concFrasco)}/mL × ${fmt(REDIL_ASPIRAR_ML)} mL = C2 × ${REDIL_FINAL_ML} mL`,
        passos: [`C2 = ${UI(concFrasco * REDIL_ASPIRAR_ML)} ÷ ${REDIL_FINAL_ML} mL`],
        resultado: `${UI(concRedil)}/mL (${fmt(REDIL_ASPIRAR_ML)} mL + ${fmt(adRedil)} mL de AD)`,
        rascunho: `Rediluição: ${UI(concFrasco)}/mL × ${fmt(REDIL_ASPIRAR_ML)} mL ÷ ${REDIL_FINAL_ML} mL = ${UI(concRedil)}/mL`,
      },
      dica: 'Escreva na seringa da rediluição a concentração e a hora. Duas seringas parecidas na bancada, com concentrações 10 vezes diferentes, é receita para erro.',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: frascoPronto,
          seringa: { capacidadeMl: 10, rotulo: 'Seringa 10 mL', camadas: [] },
        },
        estado: {
          frasco: frascoDepoisRedil,
          seringa: seringaRedil,
          fluxos: ['frasco-seringa'],
          balao: `${fmt(REDIL_ASPIRAR_ML)} mL + ${fmt(adRedil)} mL AD → ${UI(concRedil)}/mL`,
        },
      },
      linha: { id: 'peni', secao: 'antimicrobianos', texto: peniTexto, detalhe: `${passoReconstituir} → ${passoRediluir}` },
    },
    {
      id: 'aspirar-redil',
      secao: 'antimicrobianos',
      curto: 'Aspirar',
      titulo: 'Agora sim: quanto aspirar da rediluição?',
      explicacao: [
        `A conta é a mesma, só que com a concentração NOVA: ${UI(dose)} ÷ ${UI(concRedil)}/mL = ${fmt(volumeRedil)} mL.`,
        `${fmt(volumeRedil)} mL dá para medir com folga. A seringa da rediluição tinha ${UI(concRedil * REDIL_FINAL_ML)} — daria para ${dosesNaRediluicao} doses; o que sobra segue a regra da farmácia (descartar ou guardar pelo tempo da bula).`,
      ],
      conta: {
        formula: 'Volume = dose ÷ concentração da rediluição',
        substituicao: `${UI(dose)} ÷ ${UI(concRedil)}/mL`,
        resultado: `${fmt(volumeRedil)} mL`,
        rascunho: `Aspirar: ${UI(dose)} ÷ ${UI(concRedil)}/mL = ${fmt(volumeRedil)} mL`,
      },
      dica: 'Erro clássico: fazer a rediluição e depois usar a concentração ANTIGA na conta. Resultado: dose 10 vezes menor (ou maior). Sempre confira qual seringa está na sua mão.',
      aValidar: 'Estabilidade e descarte da solução reconstituída/rediluída — conferir na bula.',
      fonte: 'Bula',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: reservaRedil,
          seringa: { capacidadeMl: 20, rotulo: 'Seringa 20 mL', camadas: [] },
        },
        estado: {
          frasco: { ...reservaRedil, nivel: 1 - volumeRedil / REDIL_FINAL_ML },
          seringa: seringaDose,
          fluxos: ['frasco-seringa'],
          balao: `${fmt(volumeRedil)} mL = ${UI(dose)}`,
        },
      },
      linha: { id: 'peni', secao: 'antimicrobianos', texto: peniTexto, detalhe: `${passoReconstituir} → ${passoRediluir} → ${passoAspirar}` },
    },
    {
      id: 'bic',
      secao: 'antimicrobianos',
      curto: `BIC ${VOLUME_FINAL_BIC_ML} mL`,
      titulo: `Rediluição com fator de correção da BIC: completar até ${VOLUME_FINAL_BIC_ML} mL`,
      explicacao: [
        `A regra do hospital: a medicação vai para a bomba numa seringa de volume final ${VOLUME_FINAL_BIC_ML} mL. Então: ${VOLUME_FINAL_BIC_ML} − ${fmt(volumeRedil)} mL = ${fmt(sfBic)} mL de SF 0,9%.`,
        `É mais uma diluição: os ${UI(dose)} agora estão em ${VOLUME_FINAL_BIC_ML} mL (≈ ${UI(concBic)}/mL). Como a dose inteira vai para o bebê, não precisamos usar essa concentração na conta — mas ela serve para conferir se a solução não está concentrada demais.`,
      ],
      conta: {
        formula: `SF = ${VOLUME_FINAL_BIC_ML} mL − volume da medicação`,
        substituicao: `${VOLUME_FINAL_BIC_ML} − ${fmt(volumeRedil)}`,
        passos: [`Concentração final: ${UI(dose)} ÷ ${VOLUME_FINAL_BIC_ML} mL ≈ ${UI(concBic)}/mL`],
        resultado: `${fmt(sfBic)} mL de SF 0,9% (total ${VOLUME_FINAL_BIC_ML} mL)`,
        rascunho: `BIC: ${fmt(volumeRedil)} + ${fmt(sfBic)} SF = ${VOLUME_FINAL_BIC_ML} mL (≈ ${UI(concBic)}/mL)`,
      },
      aValidar: `Se a penicilina cristalina segue a regra dos ${VOLUME_FINAL_BIC_ML} mL em BIC — confirmar com o protocolo do hospital.`,
      fonte: 'Rotina da Santa Casa (docs/fase-0/formulas.md, item 7)',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          seringa: seringaDose,
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: false },
        },
        estado: {
          seringa: seringaBicPronta,
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: true },
          fluxos: ['bolsa-seringa'],
          balao: `${fmt(volumeRedil)} + ${fmt(sfBic)} = ${VOLUME_FINAL_BIC_ML} mL`,
        },
      },
      linha: {
        id: 'peni',
        secao: 'antimicrobianos',
        texto: peniTexto,
        detalhe: `${passoReconstituir} → ${passoRediluir} → ${passoAspirar} ${passoBic}`,
      },
    },
    {
      id: 'vazao',
      secao: 'antimicrobianos',
      curto: 'Vazão',
      titulo: 'Programar a bomba',
      explicacao: [
        `A seringa de ${VOLUME_FINAL_BIC_ML} mL corre em ${TEMPO_INFUSAO_MIN} minutos. Vazão = volume ÷ tempo em horas.`,
        `${VOLUME_FINAL_BIC_ML} mL ÷ ${fmt(TEMPO_INFUSAO_MIN / 60)} h = ${fmt(vazao)} mL/h.`,
      ],
      conta: {
        formula: 'Vazão = volume ÷ tempo (h)',
        substituicao: `${VOLUME_FINAL_BIC_ML} mL ÷ ${fmt(TEMPO_INFUSAO_MIN / 60)} h`,
        resultado: `${fmt(vazao)} mL/h`,
        rascunho: `Vazão: ${VOLUME_FINAL_BIC_ML} mL em ${TEMPO_INFUSAO_MIN} min = ${fmt(vazao)} mL/h`,
      },
      dica: `Os ${VOLUME_FINAL_BIC_ML} mL de cada dose entram no bebê. Num prematuro de ${fmt(PESO_KG * 1000)} g, 2 doses por dia = ${VOLUME_FINAL_BIC_ML * (24 / INTERVALO_H)} mL ≈ ${fmt((VOLUME_FINAL_BIC_ML * (24 / INTERVALO_H)) / PESO_KG, 0)} mL/kg/dia — muitos serviços descontam esse volume do soro.`,
      aValidar: `Tempo de infusão (${TEMPO_INFUSAO_MIN} min) — exemplo didático, conferir na bula/protocolo.`,
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          seringa: seringaBicPronta,
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC da penicilina' },
        },
        estado: {
          seringa: seringaBicPronta,
          bic: { vazaoMlH: vazao, ligada: true, rotulo: 'BIC da penicilina' },
          fluxos: ['seringa-bic', 'bic-paciente'],
        },
      },
      linha: {
        id: 'peni',
        secao: 'antimicrobianos',
        texto: peniTexto,
        detalhe: `${passoReconstituir} → ${passoRediluir} → ${passoAspirar} ${passoBic} · BIC ${fmt(vazao)} mL/h (${TEMPO_INFUSAO_MIN} min)`,
      },
    },
    {
      id: 'tres-concentracoes',
      secao: 'antimicrobianos',
      curto: '3 concentrações',
      titulo: 'Resumo: a mesma dose, três concentrações',
      explicacao: [
        'Repare no caminho da penicilina: cada diluição deixou a solução mais fraca, mas a DOSE (UI) que vai para o bebê é sempre a mesma.',
        'Frasco → rediluição: 10 vezes mais fraca. Rediluição → seringa da BIC: mais fraca de novo. Quem erra a conta costuma usar a concentração da etapa errada.',
      ],
      cena: {
        tipo: 'barras',
        titulo: 'Concentração em cada etapa do preparo',
        unidade: 'UI/mL',
        casas: 0,
        barras: [
          { rotulo: '1ª diluição (frasco)', detalhe: `${UI(FRASCO_UI)} em ${DILUENTE_ML} mL`, valor: concFrasco, tom: 'perigo' },
          { rotulo: 'Rediluição', detalhe: `${fmt(REDIL_ASPIRAR_ML)} mL + ${fmt(adRedil)} mL AD`, valor: concRedil, tom: 'atencao' },
          { rotulo: `Seringa da BIC (${VOLUME_FINAL_BIC_ML} mL)`, detalhe: `${fmt(volumeRedil)} mL + ${fmt(sfBic)} mL SF`, valor: concBic, tom: 'normal' },
        ],
      },
    },

    // 7. EXAMES ----------------------------------------------------------------
    {
      id: 'exames',
      secao: 'exames',
      curto: 'Exames',
      titulo: 'Exames solicitados',
      explicacao: [
        'Na sífilis congênita, além do tratamento, o bebê precisa ser investigado (ossos, olhos, ouvidos, sangue) e seguido com VDRL até negativar.',
      ],
      aValidar: 'Lista de exames e seguimento — conferir no PCDT vigente.',
      fonte: 'MS — PCDT Sífilis',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'tubo', titulo: 'Hemograma', estado: 'sim' },
          { icone: 'tubo', titulo: 'Função hepática e eletrólitos', estado: 'sim' },
          { icone: 'documento', titulo: 'RX de ossos longos', estado: 'sim' },
          { icone: 'olho', titulo: 'Fundo de olho', estado: 'sim' },
          { icone: 'cerebro', titulo: 'Audição (PEATE)', estado: 'sim' },
          { icone: 'tubo', titulo: 'VDRL seriado', texto: 'seguimento', estado: 'atencao' },
        ],
      },
      linha: {
        id: 'exames',
        secao: 'exames',
        texto: 'Hemograma · Função hepática · Eletrólitos · RX de ossos longos · Fundo de olho · Avaliação auditiva',
        detalhe: 'VDRL de seguimento conforme PCDT',
      },
    },

    // 8. CUIDADOS ----------------------------------------------------------------
    {
      id: 'cuidados',
      secao: 'cuidados',
      curto: 'Cuidados',
      titulo: 'Orientações e cuidados',
      explicacao: [
        `O tratamento tem de ser completo: ${DIAS_TRATAMENTO} dias. Se o bebê perder doses por mais de um dia, o esquema recomeça do zero.`,
        'A seringa da rediluição deve ficar identificada (nome, concentração, hora). Vigiar o acesso venoso — prematuros perdem acesso com facilidade.',
      ],
      aValidar: 'Regra de reinício após interrupção — conferir no PCDT vigente.',
      fonte: 'MS — PCDT Sífilis',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'relogio', titulo: `${DIAS_TRATAMENTO} dias completos`, texto: 'perdeu > 1 dia: recomeça', estado: 'atencao' },
          { icone: 'seringa', titulo: 'Identificar a rediluição', texto: 'concentração + hora', estado: 'sim' },
          { icone: 'coracao', titulo: 'Sinais vitais', texto: 'de 3/3 h', estado: 'sim' },
          { icone: 'balanca', titulo: 'Balanço hídrico', texto: 'contar o volume das seringas', estado: 'sim' },
        ],
      },
      linha: {
        id: 'cuidados',
        secao: 'cuidados',
        texto: `Não interromper o tratamento (${DIAS_TRATAMENTO} dias) · Identificar a seringa da rediluição (concentração e hora) · SSVV de 3/3 h · Balanço hídrico`,
        detalhe: 'Comunicar: perda do acesso venoso, febre, piora clínica',
      },
    },

    // 9. SINAN -------------------------------------------------------------------
    {
      id: 'sinan',
      secao: 'sinan',
      curto: 'SINAN',
      titulo: 'Notificação SINAN',
      explicacao: [
        'Sífilis congênita é de notificação compulsória: preencher a ficha do SINAN. A mãe (e a parceria sexual) também precisam ser tratadas.',
      ],
      aValidar: 'Conferir a lista nacional de notificação compulsória vigente.',
      fonte: 'MS',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'documento', titulo: 'Sífilis congênita', texto: 'notificar no SINAN', estado: 'atencao' },
          { icone: 'check', titulo: 'Mãe e parceria', texto: 'tratar e acompanhar', estado: 'sim' },
        ],
      },
      linha: { id: 'sinan', secao: 'sinan', texto: 'Notificar sífilis congênita (ficha SINAN)', detalhe: 'Tratamento da mãe e da parceria sexual' },
    },

    // REVISÃO --------------------------------------------------------------------
    {
      id: 'revisao',
      secao: 'revisao',
      curto: 'Revisão',
      titulo: 'Revisão final',
      explicacao: [
        'Em todo preparo com rediluição, confira quatro coisas: a dose (UI), a concentração de CADA seringa, o volume aspirado e o volume final da BIC.',
      ],
      cena: {
        tipo: 'conclusao',
        itens: [
          `Dose — ${UI(dose)} (${UI(DOSE_UI_KG)}/kg × ${fmt(PESO_KG)} kg)`,
          `Frasco — ${UI(concFrasco)}/mL (pequeno demais: ${fmt(volumeDireto)} mL)`,
          `Rediluição — ${UI(concRedil)}/mL → aspirar ${fmt(volumeRedil)} mL`,
          `BIC — + ${fmt(sfBic)} mL de SF = ${VOLUME_FINAL_BIC_ML} mL a ${fmt(vazao)} mL/h`,
          `Intervalo — ${INTERVALO_H}/${INTERVALO_H} h por ${DIAS_TRATAMENTO} dias · SINAN`,
        ],
      },
    },
  ],
};
