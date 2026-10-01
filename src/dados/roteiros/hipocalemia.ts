/**
 * Roteiro — Hipocalemia grave (K 2,4 com alteração no ECG): soro de manutenção
 * com potássio e correção EV com KCl 19,1% — incluindo por que a regra da seringa
 * de 12 mL (fator BIC) NÃO serve para o potássio.
 *
 * CASO DIDÁTICO. Doses e limites do docs/fase-0/doses-rascunho.md — TUDO "A VALIDAR".
 * Os números são calculados pelas funções de o motor de cálculo src/calculos/ (o mesmo do Prescrever) (não digitados à mão).
 */
import {
  arredondar,
  diluir,
  doseTotal,
  hollidaySegarMlDia,
  meqPorKgPorHora,
  meqPorLitro,
  meqPorMl,
  MG_POR_MEQ,
  vazaoDoVolume,
  volumeMinimoDiluicao,
} from '../../calculos';
import { fmt } from '../../logica/formatacao';
import type { Roteiro } from './tipos';

// ---- Dados do caso ---------------------------------------------------------
const PESO_KG = 16;
const K_ATUAL = 2.4;
const NA_ATUAL = 136;

// Manutenção (A VALIDAR — rascunho SBP: ≈ 2 mEq de K⁺ por 100 mL do Holliday)
const K_MEQ_POR_100ML = 2;
const KCL_PCT = 19.1;

// Correção EV (A VALIDAR — rascunho PALS: 0,5–1 mEq/kg, máx. 40 mEq, em 1–2 h, máx. 0,5–1 mEq/kg/h)
const CORRECAO_MEQ_KG = 0.5;
const CORRECAO_MAX_MEQ = 40;
const CORRECAO_TEMPO_H = 2;
const VELOCIDADE_MAX_MEQ_KG_H = 0.5;
const K_MAXIMO_PERIFERICO_MEQ_L = 40; // A VALIDAR
const VOLUME_FINAL_BIC_ML = 12; // Santa Casa (regra da seringa de 12 mL)

// Química (não é dose)
const KCL_MEQ_ML = meqPorMl(KCL_PCT, MG_POR_MEQ.KCl); // ≈ 2,56

// ---- Contas ----------------------------------------------------------------
const holliday = hollidaySegarMlDia(PESO_KG);
const hollidayAcima10 = holliday - 1000;
const kManutMeq = arredondar((holliday / 100) * K_MEQ_POR_100ML, 1);
const kclManutMl = arredondar(kManutMeq / KCL_MEQ_ML, 1);
const manutTotal = arredondar(holliday + kclManutMl, 1);
const kManutMeqL = meqPorLitro(kManutMeq, manutTotal);
const vazaoManut = vazaoDoVolume(manutTotal, 24 * 60);

const correcaoMeq = doseTotal({ dosePorKg: CORRECAO_MEQ_KG, pesoKg: PESO_KG, doseMaxima: CORRECAO_MAX_MEQ }).dose;
const kclCorrMl = arredondar(correcaoMeq / KCL_MEQ_ML, 1);
const concNaSeringa12 = meqPorLitro(correcaoMeq, VOLUME_FINAL_BIC_ML);
const vezesAcimaDoLimite = Math.floor(concNaSeringa12 / K_MAXIMO_PERIFERICO_MEQ_L);
const volumeCorrecao = volumeMinimoDiluicao(correcaoMeq, K_MAXIMO_PERIFERICO_MEQ_L);
const sfCorrecao = arredondar(volumeCorrecao - kclCorrMl, 1);
const vazaoCorrecao = vazaoDoVolume(volumeCorrecao, CORRECAO_TEMPO_H * 60);
const velocidade = meqPorKgPorHora(correcaoMeq, CORRECAO_TEMPO_H, PESO_KG);

// ---- Textos da folha ---------------------------------------------------------
const idTexto = `Júlia · 4 anos · Peso ${fmt(PESO_KG)} kg`;
const manutComposicao = `Soro glicofisiológico (SG 5% + NaCl 0,9%) ${fmt(holliday)} mL + KCl 19,1% ${fmt(kclManutMl)} mL`;
const correcaoTexto = `Correção de K⁺: ${fmt(correcaoMeq)} mEq (${fmt(CORRECAO_MEQ_KG)} mEq/kg) EV em ${CORRECAO_TEMPO_H} h`;
const correcaoPreparo = `KCl 19,1% ${fmt(kclCorrMl)} mL + SF 0,9% ${fmt(sfCorrecao)} mL = ${fmt(volumeCorrecao)} mL (K⁺ ${K_MAXIMO_PERIFERICO_MEQ_L} mEq/L)`;

const ampolaKcl = { modelo: 'ampola' as const, rotulo: 'KCl 19,1%', sublinha: `ampola 10 mL · ${fmt(KCL_MEQ_ML)} mEq/mL`, nivel: 0.85, cor: 'medicacao' as const };

export const roteiroHipocalemia: Roteiro = {
  id: 'hipocalemia',
  tema: 'Distúrbios hidroeletrolíticos',
  titulo: 'Hipocalemia grave — correção com KCl',
  resumo: 'Potássio de manutenção, correção EV (mEq → mL), concentração máxima e velocidade segura.',
  paciente: {
    nome: 'Júlia',
    descricao: `4 anos, ${fmt(PESO_KG)} kg, K ${fmt(K_ATUAL)} com fraqueza`,
  },
  etapas: [
    // 1. IDENTIFICAÇÃO -------------------------------------------------------
    {
      id: 'identificacao',
      secao: 'identificacao',
      curto: 'Paciente',
      titulo: 'Quem é a paciente?',
      explicacao: [
        `Júlia, 4 anos, ${fmt(PESO_KG)} kg, vomita há 3 dias. Agora está com as pernas fracas e a barriga distendida (o intestino também é músculo e ficou "preguiçoso").`,
        'O eletrocardiograma mostra onda T achatada e onda U — sinais de potássio baixo no coração.',
      ],
      cena: {
        tipo: 'paciente',
        perfil: 'crianca',
        pesoKg: PESO_KG,
        rotulos: [
          { rotulo: 'Idade', valor: '4 anos' },
          { rotulo: 'Peso', valor: `${fmt(PESO_KG)} kg` },
          { rotulo: 'Quadro', valor: 'vômitos há 3 dias · fraqueza · distensão' },
          { rotulo: 'ECG', valor: 'onda T achatada + onda U' },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto, detalhe: 'Enfermaria' },
    },
    {
      id: 'potassio',
      secao: 'identificacao',
      curto: `K ${fmt(K_ATUAL)}`,
      titulo: `Potássio de ${fmt(K_ATUAL)}: quão grave?`,
      explicacao: [
        `O potássio normal fica entre 3,5 e 5,5 mEq/L. Com ${fmt(K_ATUAL)}, os músculos (braços, pernas, intestino e coração) funcionam mal.`,
        'Potássio muito baixo COM alteração no ECG ou fraqueza importante pede correção pela veia, com monitor cardíaco.',
      ],
      aValidar: 'Faixas de gravidade e indicação de correção EV.',
      fonte: 'PALS / SBP',
      cena: {
        tipo: 'regua',
        reguas: [
          {
            titulo: 'Potássio (K⁺)',
            unidade: 'mEq/L',
            minimo: 1.5,
            maximo: 7,
            faixas: [
              { ate: 2.5, rotulo: 'Hipocalemia grave (< 2,5)', tom: 'perigo' },
              { ate: 3.5, rotulo: 'Hipocalemia leve a moderada (2,5 a 3,4)', tom: 'atencao' },
              { ate: 5.5, rotulo: 'Normal (3,5 a 5,5)', tom: 'normal' },
              { ate: 7, rotulo: 'Hipercalemia (> 5,5)', tom: 'perigo' },
            ],
            valor: K_ATUAL,
            rotuloValor: 'Júlia',
          },
          {
            titulo: 'Sódio (Na⁺)',
            unidade: 'mEq/L',
            minimo: 120,
            maximo: 160,
            faixas: [
              { ate: 135, rotulo: 'Baixo (< 135)', tom: 'atencao' },
              { ate: 145, rotulo: 'Normal (135 a 145)', tom: 'normal' },
              { ate: 160, rotulo: 'Alto (> 145)', tom: 'atencao' },
            ],
            valor: NA_ATUAL,
            rotuloValor: 'Júlia',
            casas: 0,
          },
        ],
      },
      linha: {
        id: 'id',
        secao: 'identificacao',
        texto: idTexto,
        detalhe: `Hipocalemia grave: K ${fmt(K_ATUAL)} mEq/L com alteração no ECG · Na ${NA_ATUAL} · Enfermaria`,
      },
    },

    // 3. DIETA ---------------------------------------------------------------
    {
      id: 'dieta',
      secao: 'dieta',
      curto: 'Dieta',
      titulo: 'Dieta',
      explicacao: [
        'Com vômitos e barriga distendida, Júlia fica em dieta zero por enquanto.',
        'Quando melhorar, volta a dieta para a idade — alimentos como banana, feijão e laranja também ajudam a repor o potássio.',
      ],
      aValidar: 'Conduta do caso didático.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'jejum', titulo: 'Dieta zero', texto: 'enquanto vomitar / distensão', estado: 'sim' },
          { icone: 'mamadeira', titulo: 'Depois', texto: 'dieta para a idade', estado: 'sim' },
          { icone: 'check', titulo: 'Ricos em K⁺', texto: 'banana, feijão, laranja', estado: 'sim' },
        ],
      },
      linha: { id: 'dieta', secao: 'dieta', texto: 'Dieta zero enquanto houver vômitos e distensão', detalhe: 'Depois, dieta para a idade' },
    },

    // 4. MANUTENÇÃO --------------------------------------------------------------
    {
      id: 'manutencao-volume',
      secao: 'volemia',
      curto: 'Holliday',
      titulo: 'Soro de manutenção: quanto por dia?',
      explicacao: [
        `Holliday-Segar por faixas: 100 mL/kg nos primeiros 10 kg e 50 mL/kg em cada kg de 10 a 20. Júlia tem ${fmt(PESO_KG)} kg.`,
        `10 blocos de 100 mL (laranja) + ${fmt(PESO_KG - 10)} blocos de 50 mL (azul).`,
      ],
      conta: {
        formula: 'Holliday-Segar = 100 mL/kg (até 10 kg) + 50 mL/kg (de 10 a 20 kg)',
        substituicao: '10 kg × 100 mL = 1.000 mL',
        passos: [`${fmt(PESO_KG - 10)} kg × 50 mL = ${fmt(hollidayAcima10)} mL`],
        resultado: `1.000 + ${fmt(hollidayAcima10)} = ${fmt(holliday)} mL por dia`,
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
      linha: { id: 'manutencao', secao: 'volemia', texto: `Soro glicofisiológico (SG 5% + NaCl 0,9%) — ${fmt(holliday)} mL/dia, EV` },
    },
    {
      id: 'manutencao-k',
      secao: 'volemia',
      curto: 'K⁺ no soro',
      titulo: 'Potássio de manutenção: mEq → mL de ampola',
      explicacao: [
        `O soro de manutenção leva ${K_MEQ_POR_100ML} mEq de potássio para cada 100 mL. Primeiro os mEq do dia, depois os mL de KCl 19,1%.`,
        `KCl 19,1% = 191 mg/mL; 1 mEq de KCl pesa 74,5 mg. Então cada mL da ampola tem ≈ ${fmt(KCL_MEQ_ML)} mEq.`,
      ],
      conta: {
        formula: 'mL de KCl = mEq necessários ÷ mEq por mL da ampola',
        substituicao: `K⁺ do dia: ${fmt(holliday)} ÷ 100 × ${K_MEQ_POR_100ML} = ${fmt(kManutMeq)} mEq`,
        passos: [`KCl 19,1%: 191 ÷ 74,5 ≈ ${fmt(KCL_MEQ_ML)} mEq/mL`, `${fmt(kManutMeq)} ÷ ${fmt(KCL_MEQ_ML)}`],
        resultado: `≈ ${fmt(kclManutMl)} mL de KCl 19,1% (K⁺ ≈ ${fmt(kManutMeqL, 0)} mEq/L)`,
        rascunho: `K⁺ manutenção: ${fmt(kManutMeq)} mEq ÷ ${fmt(KCL_MEQ_ML)} ≈ ${fmt(kclManutMl)} mL de KCl 19,1%`,
      },
      aValidar: `K⁺ de manutenção ≈ ${K_MEQ_POR_100ML} mEq/100 mL do Holliday.`,
      fonte: 'SBP (rascunho)',
      cena: {
        tipo: 'mistura',
        recipiente: `Soro de manutenção — ${fmt(manutTotal)} mL`,
        jaPresentes: 1,
        componentes: [
          { rotulo: `Glicofisiológico — ${fmt(holliday)} mL`, volumeMl: holliday, cor: 'glicose' },
          { rotulo: `KCl 19,1% — ${fmt(kclManutMl)} mL`, volumeMl: kclManutMl, cor: 'medicacao' },
        ],
        resumo: [
          { rotulo: 'K⁺', valor: `≈ ${fmt(kManutMeqL, 0)} mEq/L`, tom: 'normal' },
          { rotulo: 'Na⁺', valor: '≈ 154 mEq/L (isotônico)', tom: 'normal' },
        ],
      },
      linha: { id: 'manutencao', secao: 'volemia', texto: `${manutComposicao} — EV em 24 h` },
    },
    {
      id: 'manutencao-vazao',
      secao: 'volemia',
      curto: 'Manut.: vazão',
      titulo: 'Soro de manutenção: quantos mL por hora?',
      explicacao: [`O soro todo (${fmt(holliday)} + ${fmt(kclManutMl)} = ${fmt(manutTotal)} mL) corre em 24 horas na BIC.`],
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
        detalhe: `K⁺ ≈ ${fmt(kManutMeqL, 0)} mEq/L · só com diurese presente`,
      },
    },

    // 4. CORREÇÃO DO POTÁSSIO ------------------------------------------------------
    {
      id: 'correcao-dose',
      secao: 'volemia',
      curto: 'Correção: mEq',
      titulo: 'Correção: quantos mEq de potássio?',
      explicacao: [
        `Além da manutenção, Júlia precisa de uma CORREÇÃO: uma quantidade extra de potássio, em mEq por kg, em ${CORRECAO_TEMPO_H} horas.`,
        `Cada bloco é 1 kg recebendo ${fmt(CORRECAO_MEQ_KG)} mEq. A dose máxima (${CORRECAO_MAX_MEQ} mEq) não é atingida.`,
      ],
      conta: {
        formula: 'Correção = mEq/kg × peso (máx. 40 mEq)',
        substituicao: `${fmt(CORRECAO_MEQ_KG)} mEq/kg × ${fmt(PESO_KG)} kg`,
        resultado: `${fmt(correcaoMeq)} mEq de K⁺`,
        rascunho: `Correção K⁺: ${fmt(CORRECAO_MEQ_KG)} × ${fmt(PESO_KG)} = ${fmt(correcaoMeq)} mEq`,
      },
      aValidar: `${fmt(CORRECAO_MEQ_KG)} mEq/kg (rascunho: 0,5 a 1 mEq/kg; máx. ${CORRECAO_MAX_MEQ} mEq) em ${CORRECAO_TEMPO_H} h.`,
      fonte: 'PALS',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: CORRECAO_MEQ_KG,
        unidade: 'mEq',
        pesoKg: PESO_KG,
        total: correcaoMeq,
        rotuloTotal: `${fmt(correcaoMeq)} mEq de potássio`,
      },
      linha: { id: 'correcao', secao: 'volemia', texto: correcaoTexto },
    },
    {
      id: 'correcao-ml',
      secao: 'volemia',
      curto: 'Correção: mL',
      titulo: 'Quantos mL de KCl 19,1%?',
      explicacao: [
        `Mesma conta da manutenção: mEq ÷ mEq por mL. A ampola de KCl 19,1% tem ≈ ${fmt(KCL_MEQ_ML)} mEq/mL.`,
        `Na animação, a seringa aspira ${fmt(kclCorrMl)} mL da ampola.`,
      ],
      conta: {
        formula: 'Volume = mEq ÷ (mEq/mL)',
        substituicao: `KCl 19,1% = 191 mg/mL ÷ 74,5 mg/mEq ≈ ${fmt(KCL_MEQ_ML)} mEq/mL`,
        passos: [`${fmt(correcaoMeq)} mEq ÷ ${fmt(KCL_MEQ_ML)} mEq/mL`],
        resultado: `≈ ${fmt(kclCorrMl)} mL de KCl 19,1%`,
        rascunho: `KCl correção: ${fmt(correcaoMeq)} ÷ ${fmt(KCL_MEQ_ML)} ≈ ${fmt(kclCorrMl)} mL`,
      },
      dica: 'Existem ampolas de KCl 10% (≈ 1,34 mEq/mL) e 19,1% (≈ 2,56 mEq/mL). Trocar uma pela outra quase dobra (ou corta pela metade) a dose. Confira sempre o rótulo.',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: ampolaKcl,
          seringa: { capacidadeMl: 5, rotulo: 'Seringa 5 mL', camadas: [] },
        },
        estado: {
          frasco: { ...ampolaKcl, nivel: 0.85 * (1 - kclCorrMl / 10) },
          seringa: {
            capacidadeMl: 5,
            rotulo: 'Seringa 5 mL',
            camadas: [{ volumeMl: kclCorrMl, cor: 'medicacao', rotulo: `KCl ${fmt(kclCorrMl)} mL` }],
          },
          fluxos: ['frasco-seringa'],
          balao: `${fmt(kclCorrMl)} mL = ${fmt(correcaoMeq)} mEq`,
        },
      },
      linha: { id: 'correcao', secao: 'volemia', texto: correcaoTexto, detalhe: `KCl 19,1% ${fmt(kclCorrMl)} mL + …` },
    },
    {
      id: 'correcao-armadilha',
      secao: 'volemia',
      curto: 'Seringa 12 mL?',
      titulo: `Pegadinha: posso usar a seringa de ${VOLUME_FINAL_BIC_ML} mL?`,
      explicacao: [
        `Para os antibióticos, a regra do hospital é completar a seringa da BIC até ${VOLUME_FINAL_BIC_ML} mL. E para o potássio? Vamos calcular a concentração que ficaria.`,
        `${fmt(correcaoMeq)} mEq em ${VOLUME_FINAL_BIC_ML} mL dariam ≈ ${fmt(concNaSeringa12, 0)} mEq/L — mais de ${vezesAcimaDoLimite} vezes o máximo para veia periférica (${K_MAXIMO_PERIFERICO_MEQ_L} mEq/L). Queima a veia e pode causar arritmia grave. NÃO serve.`,
      ],
      conta: {
        formula: 'Concentração (mEq/L) = mEq ÷ volume (L)',
        substituicao: `${fmt(correcaoMeq)} mEq ÷ ${fmt(VOLUME_FINAL_BIC_ML / 1000, 3)} L`,
        resultado: `≈ ${fmt(concNaSeringa12, 0)} mEq/L — muito acima de ${K_MAXIMO_PERIFERICO_MEQ_L}!`,
        rascunho: `Seringa ${VOLUME_FINAL_BIC_ML} mL: ${fmt(correcaoMeq)} ÷ ${fmt(VOLUME_FINAL_BIC_ML / 1000, 3)} ≈ ${fmt(concNaSeringa12, 0)} mEq/L ✗`,
      },
      aValidar: `Concentração máxima de K⁺ em veia periférica (${K_MAXIMO_PERIFERICO_MEQ_L} mEq/L; em acesso central, conforme protocolo).`,
      fonte: 'PALS / protocolo do serviço',
      cena: {
        tipo: 'barras',
        titulo: 'Concentração de potássio na solução',
        unidade: 'mEq/L',
        casas: 0,
        barras: [
          { rotulo: `Seringa de ${VOLUME_FINAL_BIC_ML} mL`, detalhe: `${fmt(correcaoMeq)} mEq em ${VOLUME_FINAL_BIC_ML} mL`, valor: concNaSeringa12, tom: 'perigo' },
          { rotulo: 'Soro de manutenção', detalhe: 'da Júlia', valor: kManutMeqL, tom: 'normal' },
        ],
        limite: { valor: K_MAXIMO_PERIFERICO_MEQ_L, rotulo: `máx. periférica: ${K_MAXIMO_PERIFERICO_MEQ_L}` },
      },
    },
    {
      id: 'correcao-diluir',
      secao: 'volemia',
      curto: 'Correção: diluir',
      titulo: 'Diluindo o potássio do jeito seguro',
      explicacao: [
        `A pergunta certa é: em QUANTO soro, no mínimo, cabem ${fmt(correcaoMeq)} mEq sem passar de ${K_MAXIMO_PERIFERICO_MEQ_L} mEq/L? Divide-se os mEq pela concentração máxima.`,
        `Depois, completa-se com SF 0,9% até esse volume: ${fmt(volumeCorrecao)} − ${fmt(kclCorrMl)} mL de KCl.`,
      ],
      conta: {
        formula: 'Volume mínimo = mEq ÷ concentração máxima',
        substituicao: `${fmt(correcaoMeq)} mEq ÷ ${K_MAXIMO_PERIFERICO_MEQ_L} mEq/L = ${fmt(volumeCorrecao / 1000, 3)} L = ${fmt(volumeCorrecao)} mL`,
        passos: [`SF 0,9% = ${fmt(volumeCorrecao)} − ${fmt(kclCorrMl)} = ${fmt(sfCorrecao)} mL`],
        resultado: `KCl 19,1% ${fmt(kclCorrMl)} mL + SF 0,9% ${fmt(sfCorrecao)} mL = ${fmt(volumeCorrecao)} mL`,
        rascunho: `Diluir: ${fmt(correcaoMeq)} ÷ ${K_MAXIMO_PERIFERICO_MEQ_L} = ${fmt(volumeCorrecao)} mL → SF ${fmt(sfCorrecao)} mL + KCl ${fmt(kclCorrMl)} mL`,
      },
      dica: 'Dilua em SF 0,9%, não em soro glicosado: a glicose estimula a insulina, que "empurra" o potássio para dentro das células e atrapalha a correção.',
      aValidar: 'Diluente (SF 0,9%) e concentração máxima em veia periférica.',
      fonte: 'PALS / protocolo do serviço',
      cena: {
        tipo: 'mistura',
        recipiente: `Correção de K⁺ — ${fmt(volumeCorrecao)} mL`,
        componentes: [
          { rotulo: `SF 0,9% — ${fmt(sfCorrecao)} mL`, volumeMl: sfCorrecao, cor: 'sf' },
          { rotulo: `KCl 19,1% — ${fmt(kclCorrMl)} mL`, volumeMl: kclCorrMl, cor: 'medicacao' },
        ],
        resumo: [
          { rotulo: 'K⁺', valor: `${K_MAXIMO_PERIFERICO_MEQ_L} mEq/L`, tom: 'normal' },
          { rotulo: 'Total', valor: `${fmt(correcaoMeq)} mEq em ${fmt(volumeCorrecao)} mL`, tom: 'info' },
        ],
      },
      linha: { id: 'correcao', secao: 'volemia', texto: correcaoTexto, detalhe: correcaoPreparo },
    },
    {
      id: 'correcao-vazao',
      secao: 'volemia',
      curto: 'Correção: BIC',
      titulo: 'Velocidade: nem rápido demais',
      explicacao: [
        `Os ${fmt(volumeCorrecao)} mL correm em ${CORRECAO_TEMPO_H} horas. Além da vazão, conferimos a VELOCIDADE do potássio em mEq por kg por hora — ela não pode passar de ${fmt(VELOCIDADE_MAX_MEQ_KG_H)}.`,
        'Potássio EV corre sempre em bomba de infusão, com monitor cardíaco, e NUNCA em bolus (empurrado com a seringa): isso pode parar o coração.',
      ],
      conta: {
        formula: 'Vazão = volume ÷ tempo · Velocidade = mEq ÷ horas ÷ peso',
        substituicao: `${fmt(volumeCorrecao)} mL ÷ ${CORRECAO_TEMPO_H} h = ${fmt(vazaoCorrecao)} mL/h`,
        passos: [`${fmt(correcaoMeq)} mEq ÷ ${CORRECAO_TEMPO_H} h ÷ ${fmt(PESO_KG)} kg = ${fmt(velocidade)} mEq/kg/h (limite ${fmt(VELOCIDADE_MAX_MEQ_KG_H)})`],
        resultado: `BIC ${fmt(vazaoCorrecao)} mL/h — ${fmt(velocidade)} mEq/kg/h ✓`,
        rascunho: `Vazão correção: ${fmt(volumeCorrecao)} ÷ ${CORRECAO_TEMPO_H} = ${fmt(vazaoCorrecao)} mL/h · ${fmt(velocidade)} mEq/kg/h ✓`,
      },
      dica: 'Esses mL também são água. Some com a manutenção e veja se o total do dia faz sentido; alguns serviços descontam da manutenção.',
      aValidar: `Velocidade máxima de ${fmt(VELOCIDADE_MAX_MEQ_KG_H)} mEq/kg/h (rascunho: 0,5 a 1).`,
      fonte: 'PALS',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          bolsa: { rotulo: `K⁺ ${K_MAXIMO_PERIFERICO_MEQ_L}/L`, cor: 'sf', gotejando: false },
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC da correção' },
        },
        estado: {
          bolsa: { rotulo: `K⁺ ${K_MAXIMO_PERIFERICO_MEQ_L}/L`, cor: 'sf', gotejando: true },
          bic: { vazaoMlH: vazaoCorrecao, ligada: true, rotulo: 'BIC da correção' },
          fluxos: ['bolsa-bic', 'bic-paciente'],
          balao: `${fmt(velocidade)} mEq/kg/h · com monitor`,
        },
      },
      linha: {
        id: 'correcao',
        secao: 'volemia',
        texto: `Correção de K⁺: KCl 19,1% ${fmt(kclCorrMl)} mL (${fmt(correcaoMeq)} mEq = ${fmt(CORRECAO_MEQ_KG)} mEq/kg) + SF 0,9% ${fmt(sfCorrecao)} mL — EV em ${CORRECAO_TEMPO_H} h, BIC ${fmt(vazaoCorrecao)} mL/h`,
        detalhe: `K⁺ ${K_MAXIMO_PERIFERICO_MEQ_L} mEq/L · ${fmt(velocidade)} mEq/kg/h · com monitor cardíaco · NUNCA em bolus`,
      },
    },

    // 7. EXAMES ----------------------------------------------------------------
    {
      id: 'exames',
      secao: 'exames',
      curto: 'Exames',
      titulo: 'Exames solicitados',
      explicacao: [
        'Ao fim da correção, dosa-se o potássio de novo para decidir se repete.',
        'Pegadinha: se o MAGNÉSIO estiver baixo, o potássio não sobe (o rim continua perdendo). Por isso ele entra na lista.',
      ],
      aValidar: 'Momento do controle e lista de exames.',
      fonte: 'SBP / PALS',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'tubo', titulo: 'K⁺', texto: 'ao fim da correção', estado: 'atencao' },
          { icone: 'tubo', titulo: 'Magnésio', texto: 'se baixo, K não sobe', estado: 'atencao' },
          { icone: 'tubo', titulo: 'Na, Ca, gasometria', estado: 'sim' },
          { icone: 'ecg', titulo: 'ECG', texto: 'de controle', estado: 'sim' },
        ],
      },
      linha: {
        id: 'exames',
        secao: 'exames',
        texto: `K⁺ ao fim da correção (${CORRECAO_TEMPO_H} h) · Magnésio · Na · Cálcio iônico · Gasometria venosa · Glicemia`,
        detalhe: 'ECG de controle',
      },
    },

    // 8. ORIENTAÇÕES -------------------------------------------------------------
    {
      id: 'orientacoes',
      secao: 'cuidados',
      curto: 'Cuidados',
      titulo: 'Orientações e cuidados',
      explicacao: [
        'Durante a correção: monitor cardíaco contínuo e olho na veia (dor, vermelhidão ou inchaço no acesso = flebite).',
        'E, como sempre com potássio: só com a criança urinando.',
      ],
      aValidar: 'Critérios para comunicar — conferir com o protocolo do serviço.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'ecg', titulo: 'Monitor cardíaco', texto: 'contínuo na correção', estado: 'sim' },
          { icone: 'seringa', titulo: 'Acesso venoso', texto: 'observar dor e vermelhidão', estado: 'atencao' },
          { icone: 'gota', titulo: 'Diurese', texto: 'balanço hídrico', estado: 'sim' },
          { icone: 'alerta', titulo: 'Comunicar', texto: 'arritmia, dor no acesso, pouca urina', estado: 'atencao' },
        ],
      },
      linha: {
        id: 'orientacoes',
        secao: 'cuidados',
        texto: 'Monitor cardíaco contínuo durante a correção · Observar o acesso venoso · Balanço hídrico',
        detalhe: 'Comunicar: arritmia, dor ou vermelhidão no acesso, diurese baixa, piora da fraqueza',
      },
    },

    // REVISÃO --------------------------------------------------------------------
    {
      id: 'revisao',
      secao: 'revisao',
      curto: 'Revisão',
      titulo: 'Revisão final',
      explicacao: [
        'Para qualquer potássio EV, confira sempre três números: a DOSE (mEq), a CONCENTRAÇÃO (mEq/L) e a VELOCIDADE (mEq/kg/h).',
        `Repare que a regra da seringa de ${VOLUME_FINAL_BIC_ML} mL, ótima para antibióticos, seria perigosa aqui.`,
      ],
      cena: {
        tipo: 'conclusao',
        itens: [
          `Paciente certa — Júlia, ${fmt(PESO_KG)} kg`,
          `Dose — ${fmt(correcaoMeq)} mEq = ${fmt(kclCorrMl)} mL de KCl 19,1%`,
          `Concentração — ${K_MAXIMO_PERIFERICO_MEQ_L} mEq/L em ${fmt(volumeCorrecao)} mL`,
          `Velocidade — ${fmt(velocidade)} mEq/kg/h em BIC`,
          'Monitor cardíaco — sim · bolus — nunca',
        ],
      },
    },
  ],
};
