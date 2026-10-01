/**
 * Roteiro — Hipocalcemia sintomática no RN (filho de mãe diabética, 40 h de vida):
 * ataque de gluconato de cálcio 10% na seringa de 12 mL, cálcio elementar × sal,
 * e manutenção de cálcio no soro com VIG.
 *
 * CASO DIDÁTICO. Doses do docs/fase-0/doses-rascunho.md — TUDO "A VALIDAR".
 * Atenção: a dose de ataque do rascunho vem do PALS (pediatria geral); a fonte
 * neonatal (SBP-Neonatologia / Neofax) pode ter outro valor.
 * Os números são calculados pelo motor de cálculo src/calculos/ (o mesmo do Prescrever).
 */
import {
  concentracao,
  doseTotal,
  horasDeVida,
  prepararSeringaBic,
  vazaoDoVolume,
  vig,
  volumeAspirar,
} from '../../calculos';
import { fmt } from '../../logica/formatacao';
import { HOSPITAIS } from '../hospitais';
import type { Roteiro } from './tipos';

// ---- Dados do caso ---------------------------------------------------------
const PESO_KG = 3.6;
const IG_SEMANAS = 38;
const HORAS = horasDeVida(1, 16); // 40 h de vida
const CA_TOTAL = 6.4; // mg/dL
const CA_IONICO = 0.8; // mmol/L
const GLICEMIA = 68; // mg/dL
const VOLUME_FINAL_BIC_ML = HOSPITAIS.santaCasa.volumeFinalBicMl;

// Gluconato de cálcio 10% (A VALIDAR)
const GLUC_MG_ML = 100;
const CA_ELEMENTAR_MG_ML = 9.3; // rascunho: ~9,3 mg/mL de Ca elementar (~0,45 mEq/mL) — dado da apresentação, A VALIDAR
const CA_MEQ_ML = 0.45;
const ATAQUE_MG_KG = 100; // rascunho PALS: 60–100 mg/kg EV lento 10–20 min
const ATAQUE_TEMPO_MIN = 15;
const MANUT_ML_KG_DIA = 4; // rascunho SBP-Neonatologia: 2–4 mL/kg/dia no soro

// Soro (A VALIDAR — SBP-Neonatologia: hídrico e VIG)
const HIDRICO_ML_KG_DIA = 80;
const GLICOSE_PCT = 10;
const VIG_FAIXA: [number, number] = [4, 6];

// ---- Contas ----------------------------------------------------------------
const ataqueMg = doseTotal({ dosePorKg: ATAQUE_MG_KG, pesoKg: PESO_KG }).dose;
const ataqueMl = volumeAspirar({ dose: ataqueMg, concentracao: GLUC_MG_ML });
const caElementarMg = ataqueMl * CA_ELEMENTAR_MG_ML;
const caMeq = ataqueMl * CA_MEQ_ML;
const bic = prepararSeringaBic({ volumeMedicacaoMl: ataqueMl, volumeFinalMl: VOLUME_FINAL_BIC_ML, quantidadeDeDroga: ataqueMg });
if (!bic.aplicavel) throw new Error(bic.motivo);
const sfBic = bic.volumeSoroMl;
const concBic = concentracao({ quantidade: ataqueMg, volumeMl: VOLUME_FINAL_BIC_ML });
const vazaoAtaque = vazaoDoVolume(VOLUME_FINAL_BIC_ML, ATAQUE_TEMPO_MIN);

const manutMl = doseTotal({ dosePorKg: MANUT_ML_KG_DIA, pesoKg: PESO_KG }).dose;
const sgMl = doseTotal({ dosePorKg: HIDRICO_ML_KG_DIA, pesoKg: PESO_KG }).dose;
const soroTotal = sgMl + manutMl;
const vazaoSoro = vazaoDoVolume(soroTotal, 24 * 60);
const vazaoSoGlicose = vazaoDoVolume(sgMl, 24 * 60);
const vigSoro = vig({ vazaoMlPorHora: vazaoSoGlicose, concentracaoGlicosePct: GLICOSE_PCT, pesoKg: PESO_KG });

// ---- Textos ----------------------------------------------------------------
const idTexto = `RN de Beatriz Costa · ${HORAS} h de vida · IG ${IG_SEMANAS} semanas · Peso ${fmt(PESO_KG * 1000)} g`;
const ataqueTexto = `Gluconato de cálcio 10% — ${fmt(ataqueMl)} mL (${fmt(ataqueMg)} mg = ${ATAQUE_MG_KG} mg/kg) EV lento, ataque`;
const ataquePreparo = `${fmt(ataqueMl)} mL + SF 0,9% ${fmt(sfBic)} mL = ${VOLUME_FINAL_BIC_ML} mL (${fmt(concBic)} mg/mL)`;
const soroComposicao = `SG ${GLICOSE_PCT}% ${fmt(sgMl)} mL + Gluconato de cálcio 10% ${fmt(manutMl)} mL`;

// ---- Desenhos ----------------------------------------------------------------
const ampola = { modelo: 'ampola' as const, rotulo: 'Gluconato de cálcio 10%', sublinha: 'ampola 10 mL · 100 mg/mL', nivel: 0.85, cor: 'medicacao' as const };
const seringaPronta = {
  capacidadeMl: 20,
  rotulo: `Seringa 20 mL — ${VOLUME_FINAL_BIC_ML} mL`,
  camadas: [
    { volumeMl: ataqueMl, cor: 'medicacao' as const, rotulo: `Gluconato ${fmt(ataqueMl)} mL` },
    { volumeMl: sfBic, cor: 'sf' as const, rotulo: `SF 0,9% ${fmt(sfBic)} mL` },
  ],
};

export const roteiroHipocalcemiaRn: Roteiro = {
  id: 'hipocalcemia-rn',
  tema: 'Neonatologia',
  titulo: 'Hipocalcemia no RN — gluconato de cálcio',
  resumo: 'Glicemia primeiro, ataque de cálcio na seringa de 12 mL, cálcio elementar × sal e cálcio de manutenção no soro (VIG).',
  paciente: {
    nome: 'RN de Beatriz Costa',
    descricao: `${HORAS} h de vida, ${fmt(PESO_KG * 1000)} g, filho de mãe diabética, tremores`,
  },
  etapas: [
    // 1. IDENTIFICAÇÃO -------------------------------------------------------
    {
      id: 'identificacao',
      secao: 'identificacao',
      curto: 'Paciente',
      titulo: 'Quem é o paciente?',
      explicacao: [
        `RN de Beatriz Costa, ${IG_SEMANAS} semanas, ${HORAS} horas de vida, ${fmt(PESO_KG * 1000)} g. A mãe tem diabetes. O bebê começou com tremores e teve um episódio curto de convulsão.`,
        'Filho de mãe diabética tem risco de hipoglicemia, hipocalcemia e hipomagnesemia nos primeiros dias. Os três dão tremor e convulsão.',
      ],
      cena: {
        tipo: 'paciente',
        perfil: 'rn',
        pesoKg: PESO_KG,
        rotulos: [
          { rotulo: 'Idade', valor: `${HORAS} h de vida` },
          { rotulo: 'IG', valor: `${IG_SEMANAS} semanas` },
          { rotulo: 'Peso', valor: `${fmt(PESO_KG * 1000)} g` },
          { rotulo: 'Quadro', valor: 'tremores + 1 convulsão' },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto, detalhe: 'UCI neonatal · Filho de mãe diabética' },
    },
    {
      id: 'glicemia',
      secao: 'identificacao',
      curto: 'Glicemia 1º',
      titulo: 'Antes de tudo: a glicemia',
      explicacao: [
        `Num RN que treme, a primeira pergunta é: é açúcar baixo? A glicemia capilar veio ${GLICEMIA} mg/dL — não explica o quadro.`,
        `Os exames mostram cálcio total de ${fmt(CA_TOTAL)} mg/dL e cálcio iônico de ${fmt(CA_IONICO)} mmol/L: hipocalcemia.`,
      ],
      aValidar: 'Pontos de corte de glicemia e cálcio no RN.',
      fonte: 'SBP — Neonatologia',
      cena: {
        tipo: 'regua',
        reguas: [
          {
            titulo: 'Cálcio total',
            unidade: 'mg/dL',
            minimo: 5,
            maximo: 12,
            faixas: [
              { ate: 7, rotulo: 'Muito baixo (< 7)', tom: 'perigo' },
              { ate: 8, rotulo: 'Baixo (7 a 8)', tom: 'atencao' },
              { ate: 11, rotulo: 'Normal (8 a 11)', tom: 'normal' },
              { ate: 12, rotulo: 'Alto (> 11)', tom: 'atencao' },
            ],
            valor: CA_TOTAL,
            rotuloValor: 'RN',
          },
          {
            titulo: 'Cálcio iônico',
            unidade: 'mmol/L',
            minimo: 0.5,
            maximo: 1.6,
            faixas: [
              { ate: 1.0, rotulo: 'Baixo (< 1,0)', tom: 'perigo' },
              { ate: 1.4, rotulo: 'Normal (1,0 a 1,4)', tom: 'normal' },
              { ate: 1.6, rotulo: 'Alto', tom: 'atencao' },
            ],
            valor: CA_IONICO,
            rotuloValor: 'RN',
          },
        ],
        legenda: `Glicemia capilar: ${GLICEMIA} mg/dL (sem hipoglicemia).`,
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto, detalhe: `UCI neonatal · Filho de mãe diabética · Hipocalcemia sintomática (Ca total ${fmt(CA_TOTAL)} mg/dL; Ca iônico ${fmt(CA_IONICO)} mmol/L)` },
    },

    // 3. DIETA ---------------------------------------------------------------
    {
      id: 'dieta',
      secao: 'dieta',
      curto: 'Dieta',
      titulo: 'Dieta',
      explicacao: ['Passada a convulsão e com o bebê estável, o seio materno continua: o leite materno ajuda a manter o cálcio e a glicose.'],
      aValidar: 'Conduta do caso didático.',
      fonte: 'SBP — Neonatologia',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'seio', titulo: 'Seio materno', texto: 'livre demanda, se estável', estado: 'sim' },
          { icone: 'glicemia', titulo: 'Mãe diabética', texto: 'mamadas frequentes', estado: 'atencao' },
        ],
      },
      linha: { id: 'dieta', secao: 'dieta', texto: 'Seio materno em livre demanda (se estável)' },
    },

    // 4. ATAQUE DE CÁLCIO -------------------------------------------------------
    {
      id: 'ataque-dose',
      secao: 'volemia',
      curto: 'Ataque: dose',
      titulo: 'Ataque de cálcio: a dose',
      explicacao: [
        `Hipocalcemia COM sintoma (convulsão) pede cálcio pela veia. Dose de ataque: ${ATAQUE_MG_KG} mg/kg de gluconato de cálcio.`,
        `O gluconato 10% tem ${GLUC_MG_ML} mg por mL: ${ATAQUE_MG_KG} mg/kg = 1 mL/kg.`,
      ],
      conta: {
        formula: 'Dose = mg/kg × peso · Volume = dose ÷ 100 mg/mL',
        substituicao: `${ATAQUE_MG_KG} mg/kg × ${fmt(PESO_KG)} kg = ${fmt(ataqueMg)} mg`,
        passos: [`${fmt(ataqueMg)} mg ÷ ${GLUC_MG_ML} mg/mL`],
        resultado: `${fmt(ataqueMl)} mL de gluconato de cálcio 10%`,
        rascunho: `Ataque Ca: ${ATAQUE_MG_KG} × ${fmt(PESO_KG)} = ${fmt(ataqueMg)} mg = ${fmt(ataqueMl)} mL`,
      },
      aValidar: `${ATAQUE_MG_KG} mg/kg EV lento (rascunho do PALS: 60 a 100 mg/kg). Conferir a dose NEONATAL na SBP/Neofax.`,
      fonte: 'PALS (rascunho) — conferir SBP-Neonatologia / Neofax',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: ATAQUE_MG_KG,
        unidade: 'mg',
        pesoKg: PESO_KG,
        total: ataqueMg,
        rotuloTotal: `${fmt(ataqueMg)} mg = ${fmt(ataqueMl)} mL`,
      },
      linha: { id: 'ataque', secao: 'volemia', texto: ataqueTexto },
    },
    {
      id: 'elementar',
      secao: 'volemia',
      curto: 'Ca elementar',
      titulo: 'Pegadinha: sal × cálcio elementar',
      explicacao: [
        `"${fmt(ataqueMg)} mg de gluconato de cálcio" NÃO são ${fmt(ataqueMg)} mg de cálcio. O gluconato é um sal: só uma pequena parte dele é o cálcio que o corpo usa (cálcio elementar).`,
        `Cada mL do gluconato 10% tem cerca de ${fmt(CA_ELEMENTAR_MG_ML)} mg de cálcio elementar. Algumas fontes escrevem a dose em mg de cálcio elementar ou em mEq — confira sempre em QUAL unidade a dose foi escrita.`,
      ],
      conta: {
        formula: 'Cálcio elementar = mL × mg de Ca elementar por mL',
        substituicao: `${fmt(ataqueMl)} mL × ${fmt(CA_ELEMENTAR_MG_ML)} mg/mL`,
        passos: [`Em mEq: ${fmt(ataqueMl)} mL × ${fmt(CA_MEQ_ML)} mEq/mL ≈ ${fmt(caMeq, 1)} mEq`],
        resultado: `≈ ${fmt(caElementarMg, 1)} mg de cálcio elementar`,
        rascunho: `Ca elementar: ${fmt(ataqueMl)} × ${fmt(CA_ELEMENTAR_MG_ML)} ≈ ${fmt(caElementarMg, 1)} mg (${fmt(caMeq, 1)} mEq)`,
      },
      aValidar: `Conteúdo de cálcio elementar da apresentação (~${fmt(CA_ELEMENTAR_MG_ML)} mg/mL e ~${fmt(CA_MEQ_ML)} mEq/mL) — conferir na bula.`,
      fonte: 'Bula',
      cena: {
        tipo: 'barras',
        titulo: 'O que tem na seringa',
        unidade: 'mg',
        casas: 1,
        barras: [
          { rotulo: 'Gluconato de cálcio (sal)', detalhe: `${fmt(ataqueMl)} mL`, valor: ataqueMg, tom: 'info' },
          { rotulo: 'Cálcio elementar', detalhe: 'o que o corpo usa', valor: caElementarMg, tom: 'normal' },
        ],
      },
    },
    {
      id: 'ataque-bic',
      secao: 'volemia',
      curto: `Ataque: ${VOLUME_FINAL_BIC_ML} mL`,
      titulo: `Diluir na seringa de ${VOLUME_FINAL_BIC_ML} mL`,
      explicacao: [
        `${fmt(ataqueMl)} mL cabem na regra do hospital: completar com SF até ${VOLUME_FINAL_BIC_ML} mL. ${VOLUME_FINAL_BIC_ML} − ${fmt(ataqueMl)} = ${fmt(sfBic)} mL de SF 0,9%.`,
        `A solução fica com ${fmt(concBic)} mg/mL — bem mais diluída que a ampola (100 mg/mL), o que agride menos a veia do bebê.`,
      ],
      conta: {
        formula: `SF = ${VOLUME_FINAL_BIC_ML} mL − volume da medicação`,
        substituicao: `${VOLUME_FINAL_BIC_ML} − ${fmt(ataqueMl)}`,
        passos: [`Concentração: ${fmt(ataqueMg)} mg ÷ ${VOLUME_FINAL_BIC_ML} mL = ${fmt(concBic)} mg/mL`],
        resultado: `${fmt(sfBic)} mL de SF (total ${VOLUME_FINAL_BIC_ML} mL)`,
        rascunho: `BIC: ${fmt(ataqueMl)} + ${fmt(sfBic)} SF = ${VOLUME_FINAL_BIC_ML} mL (${fmt(concBic)} mg/mL)`,
      },
      aValidar: `Diluente (SF 0,9% ou SG 5%) e uso da regra dos ${VOLUME_FINAL_BIC_ML} mL para o cálcio no RN — protocolo do serviço.`,
      fonte: 'Rotina da Santa Casa / protocolo do serviço',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: ampola,
          seringa: { capacidadeMl: 20, rotulo: 'Seringa 20 mL', camadas: [] },
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: false },
        },
        estado: {
          frasco: { ...ampola, nivel: 0.85 * (1 - ataqueMl / 10) },
          seringa: seringaPronta,
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: true },
          fluxos: ['frasco-seringa', 'bolsa-seringa'],
          balao: `${fmt(ataqueMl)} + ${fmt(sfBic)} = ${VOLUME_FINAL_BIC_ML} mL`,
        },
      },
      linha: { id: 'ataque', secao: 'volemia', texto: ataqueTexto, detalhe: ataquePreparo },
    },
    {
      id: 'ataque-vazao',
      secao: 'volemia',
      curto: 'Ataque: BIC',
      titulo: 'Devagar, com monitor e de olho na veia',
      explicacao: [
        `Os ${VOLUME_FINAL_BIC_ML} mL correm em ${ATAQUE_TEMPO_MIN} minutos. Cálcio rápido causa bradicardia: monitor ligado e, se a frequência cair, PARA.`,
        'Cálcio que vaza da veia queima a pele (necrose). Acesso venoso seguro e olho no local. Nunca IM nem subcutâneo.',
      ],
      conta: {
        formula: 'Vazão = volume ÷ tempo (h)',
        substituicao: `${VOLUME_FINAL_BIC_ML} mL ÷ ${fmt(ATAQUE_TEMPO_MIN / 60)} h`,
        resultado: `${fmt(vazaoAtaque)} mL/h`,
        rascunho: `Vazão ataque: ${VOLUME_FINAL_BIC_ML} mL em ${ATAQUE_TEMPO_MIN} min = ${fmt(vazaoAtaque)} mL/h`,
      },
      dica: `Esses ${VOLUME_FINAL_BIC_ML} mL também são água para um bebê de ${fmt(PESO_KG * 1000)} g (≈ ${fmt(VOLUME_FINAL_BIC_ML / PESO_KG, 1)} mL/kg). Alguns serviços descontam do soro.`,
      aValidar: `Tempo de infusão (${ATAQUE_TEMPO_MIN} min; rascunho: 10 a 20 min).`,
      fonte: 'PALS (rascunho)',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          seringa: seringaPronta,
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC do cálcio' },
        },
        estado: {
          seringa: seringaPronta,
          bic: { vazaoMlH: vazaoAtaque, ligada: true, rotulo: 'BIC do cálcio' },
          fluxos: ['seringa-bic', 'bic-paciente'],
          balao: 'monitor: se bradicardia, parar',
        },
      },
      linha: { id: 'ataque', secao: 'volemia', texto: ataqueTexto, detalhe: `${ataquePreparo} · em ${ATAQUE_TEMPO_MIN} min, BIC ${fmt(vazaoAtaque)} mL/h, com monitor` },
    },
    // 4. MANUTENÇÃO NO SORO ------------------------------------------------------
    {
      id: 'manutencao',
      secao: 'volemia',
      curto: 'Ca no soro',
      titulo: 'Depois do ataque: cálcio no soro',
      explicacao: [
        `Para o cálcio não cair de novo, ele passa a correr no soro, o dia todo: ${MANUT_ML_KG_DIA} mL/kg/dia de gluconato 10%.`,
        `Cada bloco é 1 kg recebendo ${MANUT_ML_KG_DIA} mL no dia.`,
      ],
      conta: {
        formula: 'Gluconato no dia = mL/kg/dia × peso',
        substituicao: `${MANUT_ML_KG_DIA} mL/kg × ${fmt(PESO_KG)} kg`,
        resultado: `${fmt(manutMl)} mL de gluconato 10% por dia`,
        rascunho: `Ca manutenção: ${MANUT_ML_KG_DIA} × ${fmt(PESO_KG)} = ${fmt(manutMl)} mL/dia`,
      },
      aValidar: `${MANUT_ML_KG_DIA} mL/kg/dia (rascunho: 2 a 4 mL/kg/dia).`,
      fonte: 'SBP — Neonatologia',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: MANUT_ML_KG_DIA,
        unidade: 'mL',
        pesoKg: PESO_KG,
        total: manutMl,
        rotuloTotal: `${fmt(manutMl)} mL em 24 h`,
      },
      linha: { id: 'soro', secao: 'volemia', texto: `Gluconato de cálcio 10% ${fmt(manutMl)} mL/dia no soro de manutenção` },
    },
    {
      id: 'soro',
      secao: 'volemia',
      curto: 'Soro',
      titulo: 'Montando o soro',
      explicacao: [
        `Hídrico de ${HIDRICO_ML_KG_DIA} mL/kg/dia de SG ${GLICOSE_PCT}% = ${fmt(sgMl)} mL. Junta-se o gluconato: ${fmt(sgMl)} + ${fmt(manutMl)} = ${fmt(soroTotal)} mL no dia.`,
        'O cálcio não pode ir no mesmo soro que bicarbonato ou fosfato (precipita).',
      ],
      conta: {
        formula: 'Soro = SG (mL/kg/dia × peso) + gluconato',
        substituicao: `${HIDRICO_ML_KG_DIA} × ${fmt(PESO_KG)} = ${fmt(sgMl)} mL de SG ${GLICOSE_PCT}%`,
        passos: [`${fmt(sgMl)} + ${fmt(manutMl)}`],
        resultado: `${fmt(soroTotal)} mL em 24 h`,
        rascunho: `Soro: ${fmt(sgMl)} SG ${GLICOSE_PCT}% + ${fmt(manutMl)} gluconato = ${fmt(soroTotal)} mL/dia`,
      },
      aValidar: `Hídrico de ${HIDRICO_ML_KG_DIA} mL/kg/dia com ${HORAS} h de vida.`,
      fonte: 'SBP — Neonatologia',
      cena: {
        tipo: 'mistura',
        recipiente: `Soro de manutenção — ${fmt(soroTotal)} mL/dia`,
        jaPresentes: 1,
        componentes: [
          { rotulo: `SG ${GLICOSE_PCT}% — ${fmt(sgMl)} mL`, volumeMl: sgMl, cor: 'glicose' },
          { rotulo: `Gluconato 10% — ${fmt(manutMl)} mL`, volumeMl: manutMl, cor: 'medicacao' },
        ],
        resumo: [
          { rotulo: 'Cálcio', valor: `${fmt(manutMl * GLUC_MG_ML / PESO_KG, 0)} mg/kg/dia de gluconato`, tom: 'info' },
          { rotulo: 'Volume', valor: `${fmt(soroTotal / PESO_KG, 0)} mL/kg/dia`, tom: 'normal' },
        ],
      },
      linha: { id: 'soro', secao: 'volemia', texto: `${soroComposicao} — EV em 24 h` },
    },
    {
      id: 'soro-vazao',
      secao: 'volemia',
      curto: 'Vazão + VIG',
      titulo: 'Vazão do soro e VIG',
      explicacao: [
        `${fmt(soroTotal)} mL ÷ 24 h = ${fmt(vazaoSoro, 1)} mL/h na bomba.`,
        `A VIG conta só a glicose: o SG ${GLICOSE_PCT}% (${fmt(sgMl)} mL/dia = ${fmt(vazaoSoGlicose)} mL/h). Filho de mãe diabética precisa de VIG adequada para não fazer hipoglicemia.`,
      ],
      conta: {
        formula: 'Vazão = volume ÷ 24 h · VIG = mL/h de SG × % ÷ (6 × peso)',
        substituicao: `${fmt(soroTotal)} ÷ 24 = ${fmt(vazaoSoro, 1)} mL/h`,
        passos: [`VIG = ${fmt(vazaoSoGlicose)} × ${GLICOSE_PCT} ÷ (6 × ${fmt(PESO_KG)})`],
        resultado: `BIC ${fmt(vazaoSoro, 1)} mL/h · VIG ≈ ${fmt(vigSoro, 1)} mg/kg/min`,
        rascunho: `Soro: ${fmt(soroTotal)} ÷ 24 = ${fmt(vazaoSoro, 1)} mL/h · VIG ≈ ${fmt(vigSoro, 1)}`,
      },
      aValidar: `Faixa de VIG (${VIG_FAIXA[0]} a ${VIG_FAIXA[1]} mg/kg/min).`,
      fonte: 'SBP — Neonatologia',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          bolsa: { rotulo: 'SG10% + Ca', cor: 'glicose', gotejando: false },
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC do soro' },
        },
        estado: {
          bolsa: { rotulo: 'SG10% + Ca', cor: 'glicose', gotejando: true },
          bic: { vazaoMlH: vazaoSoro, ligada: true, rotulo: 'BIC do soro' },
          fluxos: ['bolsa-bic', 'bic-paciente'],
          medidor: { rotulo: 'VIG', valor: vigSoro, unidade: 'mg/kg/min', minimo: 0, maximo: 10, faixaAlvo: VIG_FAIXA },
        },
      },
      linha: {
        id: 'soro',
        secao: 'volemia',
        texto: `${soroComposicao} — EV em 24 h, BIC ${fmt(vazaoSoro, 1)} mL/h`,
        detalhe: `VIG ≈ ${fmt(vigSoro, 1)} mg/kg/min · não misturar com bicarbonato/fosfato`,
      },
    },

    // 7. EXAMES ----------------------------------------------------------------
    {
      id: 'exames',
      secao: 'exames',
      curto: 'Exames',
      titulo: 'Exames: e o magnésio?',
      explicacao: [
        'Se o cálcio não sobe mesmo com o tratamento, desconfie do MAGNÉSIO baixo: sem magnésio, o corpo não consegue segurar o cálcio. Por isso ele entra na lista desde o começo.',
        'No ECG, o cálcio baixo alonga o intervalo QT.',
      ],
      aValidar: 'Intervalo de controle do cálcio iônico e glicemia — exemplo didático.',
      fonte: 'SBP — Neonatologia',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'tubo', titulo: 'Ca iônico', texto: 'controle em 6–8 h', estado: 'atencao' },
          { icone: 'tubo', titulo: 'Magnésio', texto: 'se baixo, Ca não sobe', estado: 'atencao' },
          { icone: 'tubo', titulo: 'Fósforo', estado: 'sim' },
          { icone: 'glicemia', titulo: 'Glicemia capilar', texto: 'mãe diabética', estado: 'sim' },
          { icone: 'ecg', titulo: 'ECG', texto: 'QT longo?', estado: 'sim' },
        ],
      },
      linha: { id: 'exames', secao: 'exames', texto: 'Cálcio iônico em 6–8 h · Magnésio · Fósforo · Glicemia capilar de 3/3 h · ECG' },
    },

    // 8. CUIDADOS ----------------------------------------------------------------
    {
      id: 'cuidados',
      secao: 'cuidados',
      curto: 'Cuidados',
      titulo: 'Orientações e cuidados',
      explicacao: ['Monitor durante o ataque; olho no acesso venoso (cálcio que vaza necrosa a pele); e glicemia capilar, porque o bebê é filho de mãe diabética.'],
      aValidar: 'Intervalos de cuidados — conferir com o protocolo do serviço.',
      fonte: 'Protocolo do serviço',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'ecg', titulo: 'Monitor', texto: 'durante o ataque', estado: 'sim' },
          { icone: 'seringa', titulo: 'Acesso venoso', texto: 'vazou = necrose', estado: 'atencao' },
          { icone: 'x', titulo: 'Nunca IM/SC', texto: 'só EV', estado: 'atencao' },
          { icone: 'alerta', titulo: 'Comunicar', texto: 'tremor, convulsão, bradicardia', estado: 'atencao' },
        ],
      },
      linha: {
        id: 'cuidados',
        secao: 'cuidados',
        texto: 'Monitor cardíaco durante o ataque · Observar o acesso venoso (risco de necrose) · Glicemia capilar de 3/3 h · Balanço hídrico',
        detalhe: 'Comunicar: tremores, convulsão, bradicardia, vermelhidão ou inchaço no acesso',
      },
    },

    // REVISÃO --------------------------------------------------------------------
    {
      id: 'revisao',
      secao: 'revisao',
      curto: 'Revisão',
      titulo: 'Revisão final',
      explicacao: ['RN que treme: glicemia, cálcio e magnésio. Cálcio EV sempre devagar, com monitor, e nunca junto com bicarbonato.'],
      cena: {
        tipo: 'conclusao',
        itens: [
          `Glicemia — ${GLICEMIA} mg/dL (descartada hipoglicemia)`,
          `Ataque — ${fmt(ataqueMl)} mL de gluconato + ${fmt(sfBic)} mL de SF = ${VOLUME_FINAL_BIC_ML} mL em ${ATAQUE_TEMPO_MIN} min`,
          `Cálcio elementar — ≈ ${fmt(caElementarMg, 1)} mg (não ${fmt(ataqueMg)} mg!)`,
          `Soro — ${fmt(soroTotal)} mL/dia, ${fmt(vazaoSoro, 1)} mL/h, VIG ≈ ${fmt(vigSoro, 1)}`,
          'Magnésio — dosar junto',
        ],
      },
    },
  ],
};
