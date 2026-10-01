/**
 * Roteiro — Hipercalemia grave (K 7,2 com onda T apiculada) numa criança com
 * síndrome hemolítico-urêmica oligúrica: proteger o coração (gluconato de cálcio),
 * empurrar o potássio para dentro das células (glicose + insulina, salbutamol)
 * e tirar o potássio do corpo (nefrologia/diálise).
 * Mostra também a REDILUIÇÃO da insulina (100 UI/mL → 1 UI/mL).
 *
 * CASO DIDÁTICO. Doses do docs/fase-0/doses-rascunho.md (PALS) — TUDO "A VALIDAR".
 * Diluições, tempos e intervalos de controle: conhecimento geral do assistente, "A VALIDAR".
 * Os números são calculados pelo motor de cálculo src/calculos/ (o mesmo do Prescrever).
 */
import {
  arredondar,
  concentracao,
  converterMassa,
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
const PESO_KG = 14;
const IDADE = '3 anos';
const K_ATUAL = 7.2;
const VOLUME_FINAL_BIC_ML = HOSPITAIS.santaCasa.volumeFinalBicMl;

// Gluconato de cálcio 10% (A VALIDAR — PALS: 60–100 mg/kg = 0,6–1 mL/kg, máx. 2 g, EV lento 10–20 min, diluído)
const GLUC_MG_KG = 100;
const GLUC_MAX_MG = 2000;
const GLUC_MG_ML = 100;
const GLUC_DILUICAO_PARTES_SF = 1; // 1:1 com SF — A VALIDAR (protocolo do serviço)
const GLUC_TEMPO_MIN = 15;

// Glicose + insulina (A VALIDAR — PALS: insulina 0,1 UI/kg, máx. 10 UI, + glicose 0,5–1 g/kg)
const GLICOSE_G_KG = 0.5;
const GLICOSE_25_MG_ML = 250;
const GLICOSE_TEMPO_MIN = 30; // A VALIDAR
const INSULINA_UI_KG = 0.1;
const INSULINA_MAX_UI = 10;
const INSULINA_FRASCO_UI_ML = 100;
// Rediluição usual da insulina (rascunho): 50 UI em 50 mL de SF = 1 UI/mL
const INSULINA_ASPIRAR_ML = 0.5;
const INSULINA_VOLUME_FINAL_ML = 50;

// Salbutamol (A VALIDAR — PALS: nebulização 2,5 mg se < 25 kg; 5 mg se ≥ 25 kg)
const SALBUTAMOL_MG = PESO_KG < 25 ? 2.5 : 5;
const SALBUTAMOL_MG_ML = 5;
const SALBUTAMOL_SF_ML = 3; // A VALIDAR

// ---- Contas ----------------------------------------------------------------
const glucDose = doseTotal({ dosePorKg: GLUC_MG_KG, pesoKg: PESO_KG, doseMaxima: GLUC_MAX_MG }).dose;
const glucMl = volumeAspirar({ dose: glucDose, concentracao: GLUC_MG_ML });
const testeBic = prepararSeringaBic({ volumeMedicacaoMl: glucMl, volumeFinalMl: VOLUME_FINAL_BIC_ML });
const glucSfMl = glucMl * GLUC_DILUICAO_PARTES_SF;
const glucTotalMl = glucMl + glucSfMl;
const glucConcFinal = concentracao({ quantidade: glucDose, volumeMl: glucTotalMl });
const glucVazao = vazaoDoVolume(glucTotalMl, GLUC_TEMPO_MIN);

const glicoseG = doseTotal({ dosePorKg: GLICOSE_G_KG, pesoKg: PESO_KG }).dose;
const glicoseMg = converterMassa(glicoseG, 'g', 'mg');
const glicoseMl = volumeAspirar({ dose: glicoseMg, concentracao: GLICOSE_25_MG_ML });
const glicoseVazao = vazaoDoVolume(glicoseMl, GLICOSE_TEMPO_MIN);

const insulinaUi = arredondar(doseTotal({ dosePorKg: INSULINA_UI_KG, pesoKg: PESO_KG, doseMaxima: INSULINA_MAX_UI }).dose, 2);
const insulinaDiretoMl = arredondar(volumeAspirar({ dose: insulinaUi, concentracao: INSULINA_FRASCO_UI_ML }), 3);
const insulinaRedil = diluir({ concentracaoInicial: INSULINA_FRASCO_UI_ML, volumeAspiradoMl: INSULINA_ASPIRAR_ML, volumeFinalMl: INSULINA_VOLUME_FINAL_ML });
const insulinaConc = insulinaRedil.concentracaoFinal;
const insulinaSfMl = insulinaRedil.volumeDiluenteMl;
const insulinaMl = arredondar(volumeAspirar({ dose: insulinaUi, concentracao: insulinaConc }), 2);
const salbutamolMl = volumeAspirar({ dose: SALBUTAMOL_MG, concentracao: SALBUTAMOL_MG_ML });

// ---- Textos ----------------------------------------------------------------
const glucTexto = `Gluconato de cálcio 10% — ${fmt(glucMl)} mL (${fmt(glucDose)} mg = ${fmt(GLUC_MG_KG)} mg/kg) EV lento`;
const glucPreparo = `+ SF 0,9% ${fmt(glucSfMl)} mL = ${fmt(glucTotalMl)} mL (${fmt(glucConcFinal)} mg/mL)`;
const glicoseTexto = `Glicose 25% — ${fmt(glicoseMl)} mL (${fmt(glicoseG)} g = ${fmt(GLICOSE_G_KG)} g/kg) EV`;
const insulinaTexto = `Insulina regular — ${fmt(insulinaUi)} UI (${fmt(INSULINA_UI_KG)} UI/kg) EV, junto com a glicose`;
const insulinaPreparo = `Rediluir ${fmt(INSULINA_ASPIRAR_ML)} mL (${fmt(INSULINA_FRASCO_UI_ML * INSULINA_ASPIRAR_ML)} UI) + SF 0,9% ${fmt(insulinaSfMl)} mL = ${INSULINA_VOLUME_FINAL_ML} mL (${fmt(insulinaConc)} UI/mL)`;

// ---- Desenhos ----------------------------------------------------------------
const ampolaGluc = { modelo: 'ampola' as const, rotulo: 'Gluconato de cálcio 10%', sublinha: 'ampola 10 mL · 100 mg/mL', nivel: 0.85, cor: 'medicacao' as const };
const frascoInsulina = { modelo: 'frasco-po' as const, rotulo: 'Insulina regular', sublinha: '100 UI/mL · frasco 10 mL', nivel: 0.7, cor: 'medicacao2' as const, po: false };
const seringaCalcioPronta = {
  capacidadeMl: 30,
  rotulo: `Seringa 30 mL — ${fmt(glucConcFinal)} mg/mL`,
  camadas: [
    { volumeMl: glucMl, cor: 'medicacao' as const, rotulo: `Gluconato ${fmt(glucMl)} mL` },
    { volumeMl: glucSfMl, cor: 'sf' as const, rotulo: `SF 0,9% ${fmt(glucSfMl)} mL` },
  ],
};
const seringaInsulina50 = {
  capacidadeMl: 60,
  rotulo: `Seringa 60 mL — ${fmt(insulinaConc)} UI/mL`,
  camadas: [
    { volumeMl: INSULINA_ASPIRAR_ML, cor: 'medicacao2' as const, rotulo: `Insulina ${fmt(INSULINA_ASPIRAR_ML)} mL` },
    { volumeMl: insulinaSfMl, cor: 'sf' as const, rotulo: `SF 0,9% ${fmt(insulinaSfMl)} mL` },
  ],
};
const reservaInsulina = { modelo: 'seringa' as const, rotulo: 'Insulina rediluída', sublinha: `${fmt(insulinaConc)} UI/mL · ${INSULINA_VOLUME_FINAL_ML} mL`, nivel: 1, cor: 'mistura' as const };
const seringaGlicose = {
  capacidadeMl: 30,
  rotulo: 'Seringa 30 mL — glicose 25%',
  camadas: [{ volumeMl: glicoseMl, cor: 'glicose' as const, rotulo: `Glicose 25% ${fmt(glicoseMl)} mL` }],
};

export const roteiroHipercalemia: Roteiro = {
  id: 'hipercalemia',
  tema: 'Distúrbios hidroeletrolíticos',
  titulo: 'Hipercalemia grave — cálcio, glicose + insulina',
  resumo: 'Proteger o coração, empurrar o K para dentro das células (com rediluição da insulina) e tirar o K do corpo.',
  paciente: {
    nome: 'Davi',
    descricao: `${IDADE}, ${fmt(PESO_KG)} kg, K ${fmt(K_ATUAL)} com onda T apiculada`,
  },
  etapas: [
    // 1. IDENTIFICAÇÃO -------------------------------------------------------
    {
      id: 'identificacao',
      secao: 'identificacao',
      curto: 'Paciente',
      titulo: 'Quem é o paciente?',
      explicacao: [
        `Davi, ${IDADE}, ${fmt(PESO_KG)} kg. Teve diarreia com sangue há uma semana; agora está pálido, inchado e quase não urina: síndrome hemolítico-urêmica (SHU), com o rim parado.`,
        `Sem urina, o potássio não sai do corpo. O exame veio com K ${fmt(K_ATUAL)} mEq/L, e o eletrocardiograma mostra ondas T altas e pontudas ("apiculadas").`,
      ],
      cena: {
        tipo: 'paciente',
        perfil: 'crianca',
        pesoKg: PESO_KG,
        rotulos: [
          { rotulo: 'Idade', valor: IDADE },
          { rotulo: 'Peso', valor: `${fmt(PESO_KG)} kg` },
          { rotulo: 'Quadro', valor: 'SHU · oligúria' },
          { rotulo: 'ECG', valor: 'onda T apiculada' },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: `Davi · ${IDADE} · Peso ${fmt(PESO_KG)} kg`, detalhe: 'Sala de emergência · SHU com oligúria' },
    },
    {
      id: 'potassio',
      secao: 'identificacao',
      curto: `K ${fmt(K_ATUAL)}`,
      titulo: `Potássio de ${fmt(K_ATUAL)}: por que é emergência?`,
      explicacao: [
        'O potássio alto deixa o coração "elétrico demais": primeiro a onda T fica pontuda; depois o QRS alarga e pode virar fibrilação ventricular ou parada.',
        'Potássio alto COM alteração no ECG é emergência: trata-se na hora, com monitor, sem esperar o próximo exame.',
      ],
      aValidar: 'Faixas de gravidade da hipercalemia.',
      fonte: 'PALS / SBP',
      cena: {
        tipo: 'regua',
        reguas: [
          {
            titulo: 'Potássio (K⁺)',
            unidade: 'mEq/L',
            minimo: 2.5,
            maximo: 8.5,
            faixas: [
              { ate: 3.5, rotulo: 'Baixo (< 3,5)', tom: 'atencao' },
              { ate: 5.5, rotulo: 'Normal (3,5 a 5,5)', tom: 'normal' },
              { ate: 6.5, rotulo: 'Alto (5,5 a 6,5)', tom: 'atencao' },
              { ate: 8.5, rotulo: 'Grave (> 6,5)', tom: 'perigo' },
            ],
            valor: K_ATUAL,
            rotuloValor: 'Davi',
          },
        ],
        legenda: 'Com alteração no ECG, trata-se como grave em qualquer valor.',
      },
      linha: { id: 'id', secao: 'identificacao', texto: `Davi · ${IDADE} · Peso ${fmt(PESO_KG)} kg`, detalhe: `Sala de emergência · SHU com oligúria · Hipercalemia: K ${fmt(K_ATUAL)} mEq/L com T apiculada` },
    },
    {
      id: 'plano',
      secao: 'identificacao',
      curto: 'Plano',
      titulo: 'O plano em 4 tempos',
      explicacao: [
        'Parar de dar potássio; proteger o coração (cálcio); empurrar o potássio do sangue para dentro das células (glicose + insulina, salbutamol); e, por fim, tirar o potássio do corpo.',
        'Atenção: o cálcio e a insulina NÃO tiram potássio do corpo — só ganham tempo. No Davi, que não urina, quem tira de verdade é a diálise.',
      ],
      aValidar: 'Sequência de tratamento da hipercalemia.',
      fonte: 'PALS',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'x', titulo: '0. Parar a entrada', texto: 'suspender todo K', estado: 'atencao' },
          { icone: 'coracao', titulo: '1. Proteger o coração', texto: 'gluconato de cálcio', estado: 'sim' },
          { icone: 'seringa', titulo: '2. Para dentro da célula', texto: 'glicose + insulina, salbutamol', estado: 'sim' },
          { icone: 'gota', titulo: '3. Tirar do corpo', texto: 'diurético, resina, diálise', estado: 'sim' },
        ],
      },
    },

    // 3. DIETA ---------------------------------------------------------------
    {
      id: 'dieta',
      secao: 'dieta',
      curto: 'Dieta',
      titulo: 'Dieta: nada de potássio',
      explicacao: ['Por enquanto, dieta zero (pode precisar de diálise e de sedação). Depois, dieta POBRE em potássio e com líquidos contados, porque o rim não está funcionando.'],
      aValidar: 'Conduta do caso didático.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'jejum', titulo: 'Dieta zero', texto: 'agora', estado: 'sim' },
          { icone: 'x', titulo: 'Sem potássio', texto: 'soro, dieta e medicações', estado: 'atencao' },
          { icone: 'gota', titulo: 'Líquidos contados', texto: 'oligúria', estado: 'atencao' },
        ],
      },
      linha: { id: 'dieta', secao: 'dieta', texto: 'Dieta zero', detalhe: 'Depois: pobre em potássio, com restrição hídrica conforme diurese' },
    },

    // 4. CÁLCIO --------------------------------------------------------------
    {
      id: 'calcio-dose',
      secao: 'volemia',
      curto: 'Cálcio: dose',
      titulo: '1. Proteger o coração: gluconato de cálcio',
      explicacao: [
        `O cálcio deixa a membrana do coração mais estável em minutos. Dose: ${fmt(GLUC_MG_KG)} mg/kg (máx. ${fmt(GLUC_MAX_MG)} mg).`,
        `O gluconato de cálcio 10% tem 100 mg em cada mL: então ${fmt(GLUC_MG_KG)} mg/kg = 1 mL/kg.`,
      ],
      conta: {
        formula: 'Dose = mg/kg × peso · Volume = dose ÷ 100 mg/mL',
        substituicao: `${fmt(GLUC_MG_KG)} mg/kg × ${fmt(PESO_KG)} kg = ${fmt(glucDose)} mg`,
        passos: [`${fmt(glucDose)} mg ÷ ${GLUC_MG_ML} mg/mL`],
        resultado: `${fmt(glucMl)} mL de gluconato de cálcio 10%`,
        rascunho: `Cálcio: ${fmt(GLUC_MG_KG)} × ${fmt(PESO_KG)} = ${fmt(glucDose)} mg ÷ 100 = ${fmt(glucMl)} mL`,
      },
      aValidar: `${fmt(GLUC_MG_KG)} mg/kg (rascunho: 60 a 100 mg/kg; máx. 2 g).`,
      fonte: 'PALS',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: GLUC_MG_KG,
        unidade: 'mg',
        pesoKg: PESO_KG,
        total: glucDose,
        rotuloTotal: `${fmt(glucDose)} mg = ${fmt(glucMl)} mL`,
      },
      linha: { id: 'calcio', secao: 'volemia', texto: glucTexto },
    },
    {
      id: 'calcio-diluir',
      secao: 'volemia',
      curto: 'Cálcio: diluir',
      titulo: `A seringa de ${VOLUME_FINAL_BIC_ML} mL serve aqui?`,
      explicacao: [
        `A regra do hospital completa a medicação com SF até ${VOLUME_FINAL_BIC_ML} mL. Mas o Davi precisa de ${fmt(glucMl)} mL de cálcio — já passou de ${VOLUME_FINAL_BIC_ML}! O motor de cálculo avisa: ${testeBic.aplicavel ? 'a regra se aplica.' : `"${testeBic.motivo}"`}`,
        `Então diluímos de outro jeito: 1 parte de cálcio para ${GLUC_DILUICAO_PARTES_SF} parte de SF 0,9% → ${fmt(glucMl)} + ${fmt(glucSfMl)} = ${fmt(glucTotalMl)} mL, com ${fmt(glucConcFinal)} mg/mL.`,
      ],
      conta: {
        formula: `Regra da BIC: só serve se volume da medicação ≤ ${VOLUME_FINAL_BIC_ML} mL`,
        substituicao: `${fmt(glucMl)} mL > ${VOLUME_FINAL_BIC_ML} mL ✗ → diluir 1:${GLUC_DILUICAO_PARTES_SF}`,
        passos: [`${fmt(glucMl)} + ${fmt(glucSfMl)} = ${fmt(glucTotalMl)} mL`, `${fmt(glucDose)} mg ÷ ${fmt(glucTotalMl)} mL`],
        resultado: `${fmt(glucTotalMl)} mL com ${fmt(glucConcFinal)} mg/mL`,
        rascunho: `Cálcio: ${fmt(glucMl)} mL > ${VOLUME_FINAL_BIC_ML} → 1:${GLUC_DILUICAO_PARTES_SF} = ${fmt(glucTotalMl)} mL (${fmt(glucConcFinal)} mg/mL)`,
      },
      dica: 'Nunca misture cálcio com bicarbonato (ou fosfato) na mesma seringa ou via: forma "pedrinhas" (precipitado) dentro do equipo.',
      aValidar: `Diluição 1:${GLUC_DILUICAO_PARTES_SF} em SF 0,9% — conferir no protocolo do serviço.`,
      fonte: 'Protocolo do serviço',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: ampolaGluc,
          seringa: { capacidadeMl: 30, rotulo: 'Seringa 30 mL', camadas: [{ volumeMl: glucMl, cor: 'medicacao', rotulo: `Gluconato ${fmt(glucMl)} mL` }] },
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: false },
          balao: `${fmt(glucMl)} mL > ${VOLUME_FINAL_BIC_ML} mL!`,
        },
        estado: {
          frasco: { ...ampolaGluc, nivel: 0 },
          seringa: seringaCalcioPronta,
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: true },
          fluxos: ['bolsa-seringa'],
          balao: `${fmt(glucMl)} + ${fmt(glucSfMl)} = ${fmt(glucTotalMl)} mL`,
        },
      },
      linha: { id: 'calcio', secao: 'volemia', texto: glucTexto, detalhe: glucPreparo },
    },
    {
      id: 'calcio-vazao',
      secao: 'volemia',
      curto: 'Cálcio: BIC',
      titulo: 'Devagar e com monitor',
      explicacao: [
        `Cálcio rápido demais pode causar bradicardia e até parada. Os ${fmt(glucTotalMl)} mL correm em ${GLUC_TEMPO_MIN} minutos, olhando o monitor: se a frequência cair, para.`,
        'O efeito protetor começa em poucos minutos e dura pouco. Se o ECG continuar alterado, a dose pode ser repetida.',
      ],
      conta: {
        formula: 'Vazão = volume ÷ tempo (h)',
        substituicao: `${fmt(glucTotalMl)} mL ÷ ${fmt(GLUC_TEMPO_MIN / 60)} h`,
        resultado: `${fmt(glucVazao)} mL/h`,
        rascunho: `Vazão cálcio: ${fmt(glucTotalMl)} mL em ${GLUC_TEMPO_MIN} min = ${fmt(glucVazao)} mL/h`,
      },
      aValidar: `Tempo de infusão (${GLUC_TEMPO_MIN} min; rascunho: 10 a 20 min) e repetição da dose.`,
      fonte: 'PALS',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          seringa: seringaCalcioPronta,
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC do cálcio' },
        },
        estado: {
          seringa: seringaCalcioPronta,
          bic: { vazaoMlH: glucVazao, ligada: true, rotulo: 'BIC do cálcio' },
          fluxos: ['seringa-bic', 'bic-paciente'],
          balao: 'com monitor cardíaco',
        },
      },
      linha: { id: 'calcio', secao: 'volemia', texto: glucTexto, detalhe: `${glucPreparo} · em ${GLUC_TEMPO_MIN} min, BIC ${fmt(glucVazao)} mL/h, com monitor` },
    },

    // 4. GLICOSE + INSULINA ---------------------------------------------------
    {
      id: 'glicose',
      secao: 'volemia',
      curto: 'Glicose',
      titulo: '2. Para dentro da célula: primeiro a glicose',
      explicacao: [
        'A insulina "abre a porta" das células e o potássio entra junto com a glicose. Mas insulina sozinha derruba o açúcar: por isso vai SEMPRE com glicose.',
        `Glicose: ${fmt(GLICOSE_G_KG)} g/kg. A glicose 25% tem 250 mg (0,25 g) em cada mL.`,
      ],
      conta: {
        formula: 'Glicose (g) = g/kg × peso · Volume = mg ÷ 250 mg/mL',
        substituicao: `${fmt(GLICOSE_G_KG)} g/kg × ${fmt(PESO_KG)} kg = ${fmt(glicoseG)} g = ${fmt(glicoseMg)} mg`,
        passos: [`${fmt(glicoseMg)} mg ÷ ${GLICOSE_25_MG_ML} mg/mL`],
        resultado: `${fmt(glicoseMl)} mL de glicose 25%`,
        rascunho: `Glicose: ${fmt(GLICOSE_G_KG)} × ${fmt(PESO_KG)} = ${fmt(glicoseG)} g ÷ 0,25 = ${fmt(glicoseMl)} mL de G25%`,
      },
      dica: `Por que glicose 25% e não SG 10%? Com SG 10% seriam ${fmt(glicoseMl * 2.5)} mL — muito líquido para quem não urina.`,
      aValidar: `${fmt(GLICOSE_G_KG)} g/kg (rascunho: 0,5 a 1 g/kg) e escolha da glicose 25%.`,
      fonte: 'PALS',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: GLICOSE_G_KG,
        unidade: 'g',
        pesoKg: PESO_KG,
        total: glicoseG,
        rotuloTotal: `${fmt(glicoseG)} g = ${fmt(glicoseMl)} mL de glicose 25%`,
      },
      linha: { id: 'glicose', secao: 'volemia', texto: glicoseTexto },
    },
    {
      id: 'insulina-dose',
      secao: 'medicacoes',
      curto: 'Insulina: dose',
      titulo: 'Insulina: a dose cabe na seringa?',
      explicacao: [
        `Dose: ${fmt(INSULINA_UI_KG)} UI/kg (máx. ${INSULINA_MAX_UI} UI) → ${fmt(insulinaUi)} UI.`,
        `O frasco tem ${INSULINA_FRASCO_UI_ML} UI em cada mL. Aspirar direto daria ${fmt(insulinaDiretoMl, 3)} mL — impossível de medir. É o caso típico de REDILUIÇÃO.`,
      ],
      conta: {
        formula: 'Dose = UI/kg × peso · Volume = dose ÷ concentração',
        substituicao: `${fmt(INSULINA_UI_KG)} × ${fmt(PESO_KG)} = ${fmt(insulinaUi)} UI`,
        passos: [`${fmt(insulinaUi)} UI ÷ ${INSULINA_FRASCO_UI_ML} UI/mL`],
        resultado: `${fmt(insulinaDiretoMl, 3)} mL — pequeno demais!`,
        rascunho: `Insulina: ${fmt(INSULINA_UI_KG)} × ${fmt(PESO_KG)} = ${fmt(insulinaUi)} UI → direto ${fmt(insulinaDiretoMl, 3)} mL ✗`,
      },
      aValidar: `${fmt(INSULINA_UI_KG)} UI/kg (máx. ${INSULINA_MAX_UI} UI) junto com a glicose.`,
      fonte: 'PALS',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: frascoInsulina,
          seringa: { capacidadeMl: 1, rotulo: 'Seringa 1 mL', camadas: [] },
        },
        estado: {
          frasco: frascoInsulina,
          seringa: { capacidadeMl: 1, rotulo: 'Seringa 1 mL', camadas: [{ volumeMl: insulinaDiretoMl, cor: 'medicacao2', rotulo: `${fmt(insulinaDiretoMl, 3)} mL?!` }] },
          fluxos: ['frasco-seringa'],
          balao: `${fmt(insulinaDiretoMl, 3)} mL: não dá para medir`,
        },
      },
      linha: { id: 'insulina', secao: 'medicacoes', texto: insulinaTexto },
    },
    {
      id: 'insulina-rediluir',
      secao: 'medicacoes',
      curto: 'Insulina: rediluir',
      titulo: 'Rediluir a insulina: 100 UI/mL → 1 UI/mL',
      explicacao: [
        `Aspiramos ${fmt(INSULINA_ASPIRAR_ML)} mL do frasco (${fmt(INSULINA_FRASCO_UI_ML * INSULINA_ASPIRAR_ML)} UI) e completamos com SF 0,9% até ${INSULINA_VOLUME_FINAL_ML} mL.`,
        `C1 × V1 = C2 × V2: ${INSULINA_FRASCO_UI_ML} × ${fmt(INSULINA_ASPIRAR_ML)} = C2 × ${INSULINA_VOLUME_FINAL_ML} → C2 = ${fmt(insulinaConc)} UI/mL. Fica fácil: cada mL é 1 UI.`,
      ],
      conta: {
        formula: 'C2 = C1 × V1 ÷ V2',
        substituicao: `${INSULINA_FRASCO_UI_ML} UI/mL × ${fmt(INSULINA_ASPIRAR_ML)} mL ÷ ${INSULINA_VOLUME_FINAL_ML} mL`,
        resultado: `${fmt(insulinaConc)} UI/mL (${fmt(INSULINA_ASPIRAR_ML)} mL + ${fmt(insulinaSfMl)} mL de SF)`,
        rascunho: `Rediluição insulina: ${INSULINA_FRASCO_UI_ML} × ${fmt(INSULINA_ASPIRAR_ML)} ÷ ${INSULINA_VOLUME_FINAL_ML} = ${fmt(insulinaConc)} UI/mL`,
      },
      dica: 'Na seringa de insulina (graduada em UI), 50 UI = 0,5 mL. Use-a para medir a insulina do frasco: é mais precisa que a seringa comum.',
      aValidar: 'Diluição usual (50 UI em 50 mL de SF) — conferir no protocolo do serviço.',
      fonte: 'Rascunho (ISPAD) / protocolo do serviço',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: frascoInsulina,
          seringa: { capacidadeMl: 60, rotulo: 'Seringa 60 mL', camadas: [] },
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: false },
        },
        estado: {
          frasco: { ...frascoInsulina, nivel: 0.66 },
          seringa: seringaInsulina50,
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: true },
          fluxos: ['frasco-seringa', 'bolsa-seringa'],
          balao: `${fmt(INSULINA_FRASCO_UI_ML * INSULINA_ASPIRAR_ML)} UI em ${INSULINA_VOLUME_FINAL_ML} mL = ${fmt(insulinaConc)} UI/mL`,
        },
      },
      linha: { id: 'insulina', secao: 'medicacoes', texto: insulinaTexto, detalhe: insulinaPreparo },
    },
    {
      id: 'insulina-aspirar',
      secao: 'medicacoes',
      curto: 'Insulina: aspirar',
      titulo: 'Quanto aspirar da insulina rediluída?',
      explicacao: [`${fmt(insulinaUi)} UI ÷ ${fmt(insulinaConc)} UI/mL = ${fmt(insulinaMl)} mL. Agora dá para medir com segurança.`],
      conta: {
        formula: 'Volume = dose ÷ concentração da rediluição',
        substituicao: `${fmt(insulinaUi)} UI ÷ ${fmt(insulinaConc)} UI/mL`,
        resultado: `${fmt(insulinaMl)} mL`,
        rascunho: `Aspirar insulina: ${fmt(insulinaUi)} ÷ ${fmt(insulinaConc)} = ${fmt(insulinaMl)} mL`,
      },
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: reservaInsulina,
          seringa: { capacidadeMl: 5, rotulo: 'Seringa 5 mL', camadas: [] },
        },
        estado: {
          frasco: { ...reservaInsulina, nivel: 1 - insulinaMl / INSULINA_VOLUME_FINAL_ML },
          seringa: { capacidadeMl: 5, rotulo: 'Seringa 5 mL', camadas: [{ volumeMl: insulinaMl, cor: 'mistura', rotulo: `Insulina ${fmt(insulinaMl)} mL` }] },
          fluxos: ['frasco-seringa'],
          balao: `${fmt(insulinaMl)} mL = ${fmt(insulinaUi)} UI`,
        },
      },
      linha: { id: 'insulina', secao: 'medicacoes', texto: insulinaTexto, detalhe: `${insulinaPreparo} → aspirar ${fmt(insulinaMl)} mL` },
    },
    {
      id: 'glicose-vazao',
      secao: 'volemia',
      curto: 'Glicose: BIC',
      titulo: 'Glicose na bomba, insulina junto',
      explicacao: [
        `A glicose 25% (${fmt(glicoseMl)} mL) corre em ${GLICOSE_TEMPO_MIN} minutos na bomba; a insulina (${fmt(insulinaMl)} mL) entra no início.`,
        'Depois, glicemia capilar frequente: a insulina continua agindo mesmo depois que a glicose acabou.',
      ],
      conta: {
        formula: 'Vazão = volume ÷ tempo (h)',
        substituicao: `${fmt(glicoseMl)} mL ÷ ${fmt(GLICOSE_TEMPO_MIN / 60)} h`,
        resultado: `${fmt(glicoseVazao)} mL/h`,
        rascunho: `Vazão glicose: ${fmt(glicoseMl)} mL em ${GLICOSE_TEMPO_MIN} min = ${fmt(glicoseVazao)} mL/h`,
      },
      aValidar: `Tempo de infusão da glicose (${GLICOSE_TEMPO_MIN} min) e forma de dar a insulina (junto/em bolus).`,
      fonte: 'PALS / protocolo do serviço',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          seringa: seringaGlicose,
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC da glicose' },
        },
        estado: {
          seringa: seringaGlicose,
          bic: { vazaoMlH: glicoseVazao, ligada: true, rotulo: 'BIC da glicose' },
          fluxos: ['seringa-bic', 'bic-paciente'],
          balao: `+ insulina ${fmt(insulinaMl)} mL no início`,
        },
      },
      linha: { id: 'glicose', secao: 'volemia', texto: glicoseTexto, detalhe: `Em ${GLICOSE_TEMPO_MIN} min, BIC ${fmt(glicoseVazao)} mL/h · junto com a insulina regular` },
    },

    // 6. SALBUTAMOL -----------------------------------------------------------
    {
      id: 'salbutamol',
      secao: 'medicacoes',
      curto: 'Salbutamol',
      titulo: 'Salbutamol: outra forma de empurrar o K para dentro',
      explicacao: [
        `O salbutamol (o mesmo da asma) também leva o potássio para dentro das células. Dose fixa por peso: ${PESO_KG < 25 ? 'menos de 25 kg' : '25 kg ou mais'} → ${fmt(SALBUTAMOL_MG)} mg na nebulização.`,
        `A solução para nebulização tem ${SALBUTAMOL_MG_ML} mg/mL: ${fmt(SALBUTAMOL_MG)} ÷ ${SALBUTAMOL_MG_ML} = ${fmt(salbutamolMl)} mL, completados com ${SALBUTAMOL_SF_ML} mL de SF no copinho do nebulizador.`,
      ],
      conta: {
        formula: 'Volume = dose ÷ concentração',
        substituicao: `${fmt(SALBUTAMOL_MG)} mg ÷ ${SALBUTAMOL_MG_ML} mg/mL`,
        resultado: `${fmt(salbutamolMl)} mL + SF ${SALBUTAMOL_SF_ML} mL`,
        rascunho: `Salbutamol: ${fmt(SALBUTAMOL_MG)} ÷ ${SALBUTAMOL_MG_ML} = ${fmt(salbutamolMl)} mL`,
      },
      dica: 'Efeito esperado: a frequência cardíaca sobe um pouco (é um beta-2, como na asma).',
      aValidar: `Nebulização ${fmt(SALBUTAMOL_MG)} mg (< 25 kg) e volume de SF (${SALBUTAMOL_SF_ML} mL).`,
      fonte: 'PALS',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'pulmao', titulo: 'Nebulização', texto: `${fmt(SALBUTAMOL_MG)} mg = ${fmt(salbutamolMl)} mL`, estado: 'sim' },
          { icone: 'gota', titulo: `+ SF ${SALBUTAMOL_SF_ML} mL`, texto: 'no copinho', estado: 'sim' },
          { icone: 'coracao', titulo: 'Efeito colateral', texto: 'taquicardia', estado: 'atencao' },
        ],
      },
      linha: { id: 'salbutamol', secao: 'medicacoes', texto: `Salbutamol (5 mg/mL) — ${fmt(salbutamolMl)} mL (${fmt(SALBUTAMOL_MG)} mg) + SF 0,9% ${SALBUTAMOL_SF_ML} mL, nebulização`, detalhe: 'Pode repetir conforme K e ECG' },
    },

    // 7. EXAMES ----------------------------------------------------------------
    {
      id: 'exames',
      secao: 'exames',
      curto: 'Exames',
      titulo: 'Exames solicitados',
      explicacao: [
        'O potássio é repetido logo (o efeito da insulina e do salbutamol dura poucas horas e o K volta a subir).',
        'Depois da insulina, glicemia capilar frequente.',
      ],
      aValidar: 'Intervalos de controle (K em 1–2 h; glicemia capilar de 30/30 min nas primeiras horas) — exemplo didático.',
      fonte: 'PALS / protocolo do serviço',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'tubo', titulo: 'K⁺', texto: 'em 1 a 2 h', estado: 'atencao' },
          { icone: 'glicemia', titulo: 'Glicemia capilar', texto: '30/30 min no início', estado: 'atencao' },
          { icone: 'ecg', titulo: 'ECG', texto: 'contínuo', estado: 'sim' },
          { icone: 'tubo', titulo: 'Ureia, creatinina, gaso, Ca', estado: 'sim' },
        ],
      },
      linha: {
        id: 'exames',
        secao: 'exames',
        texto: 'K⁺ em 1 a 2 h · Glicemia capilar de 30/30 min nas primeiras horas · Gasometria venosa · Ureia · Creatinina · Ca iônico · Hemograma',
        detalhe: 'ECG contínuo',
      },
    },

    // 8. CUIDADOS ----------------------------------------------------------------
    {
      id: 'cuidados',
      secao: 'cuidados',
      curto: 'Cuidados',
      titulo: '3. Tirar o potássio do corpo — e os cuidados',
      explicacao: [
        'No Davi, que não urina, diurético quase não funciona: quem tira o potássio de verdade é a DIÁLISE. Chamar a nefrologia já.',
        'Enquanto isso: monitor contínuo, suspender todo potássio (inclusive do soro) e contar cada mL que entra e sai.',
      ],
      aValidar: 'Indicação de diálise e uso de diurético/resina — conduta da nefrologia.',
      fonte: 'PALS / SBP — Nefrologia',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'gota', titulo: 'Nefrologia', texto: 'diálise', estado: 'atencao' },
          { icone: 'ecg', titulo: 'Monitor contínuo', estado: 'sim' },
          { icone: 'x', titulo: 'Cálcio + bicarbonato', texto: 'nunca na mesma via', estado: 'atencao' },
          { icone: 'balanca', titulo: 'Balanço hídrico', texto: 'rigoroso', estado: 'sim' },
        ],
      },
      linha: {
        id: 'cuidados',
        secao: 'cuidados',
        texto: 'Monitor cardíaco contínuo · Suspender todo potássio (soro, dieta, medicações) · Balanço hídrico rigoroso · Avaliação da nefrologia (diálise)',
        detalhe: 'Comunicar: alargamento do QRS, arritmia, bradicardia, glicemia < 70 mg/dL',
      },
    },

    // REVISÃO --------------------------------------------------------------------
    {
      id: 'revisao',
      secao: 'revisao',
      curto: 'Revisão',
      titulo: 'Revisão final',
      explicacao: ['Repare nas três contas de preparo diferentes neste caso: uma diluição 1:1 (cálcio), uma rediluição (insulina) e uma dose fixa (salbutamol).'],
      cena: {
        tipo: 'conclusao',
        itens: [
          `Cálcio — ${fmt(glucMl)} mL + ${fmt(glucSfMl)} mL de SF em ${GLUC_TEMPO_MIN} min, com monitor`,
          `Glicose 25% — ${fmt(glicoseMl)} mL em ${GLICOSE_TEMPO_MIN} min`,
          `Insulina — ${fmt(insulinaUi)} UI = ${fmt(insulinaMl)} mL da rediluição (1 UI/mL)`,
          `Salbutamol — ${fmt(SALBUTAMOL_MG)} mg nebulização`,
          'Tirar o K do corpo — nefrologia/diálise · K de controle',
        ],
      },
    },
  ],
};
