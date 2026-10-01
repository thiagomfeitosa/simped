/**
 * Roteiro 2 — Diluição passo a passo: adrenalina 1:10.000 na parada cardiorrespiratória.
 *
 * CASO DIDÁTICO. Doses do docs/fase-0/doses-rascunho.md (PALS), todas "A VALIDAR".
 */
import {
  concentracao,
  diluir,
  doseTotal,
  volumeAspirar,
} from '../../calculos';
import { fmt } from '../../logica/formatacao';
import type { Roteiro } from './tipos';

const PESO_KG = 10;
const DOSE_MG_KG = 0.01; // A VALIDAR — PALS
const DOSE_MAXIMA_MG = 1; // A VALIDAR — PALS
const AMPOLA_MG_ML = 1; // 1:1.000
const AMPOLA_ML = 1;
const VOLUME_DILUICAO_ML = 10;

const dose = doseTotal({ dosePorKg: DOSE_MG_KG, pesoKg: PESO_KG, doseMaxima: DOSE_MAXIMA_MG }).dose;
const volumeSemDiluir = volumeAspirar({ dose: dose, concentracao: AMPOLA_MG_ML });
const concDiluida = diluir({ concentracaoInicial: AMPOLA_MG_ML, volumeAspiradoMl: AMPOLA_ML, volumeFinalMl: VOLUME_DILUICAO_ML }).concentracaoFinal;
const sfDiluicao = VOLUME_DILUICAO_ML - AMPOLA_ML;
const volumeDose = volumeAspirar({ dose: dose, concentracao: concDiluida });

const ampolaCheia = { modelo: 'ampola' as const, rotulo: 'Adrenalina 1 mg/mL', sublinha: '1:1.000 · ampola 1 mL', nivel: 0.85, cor: 'adrenalina' as const };
const ampolaVazia = { ...ampolaCheia, nivel: 0 };

const seringaSoAdrenalina = {
  capacidadeMl: VOLUME_DILUICAO_ML,
  rotulo: `Seringa ${VOLUME_DILUICAO_ML} mL`,
  camadas: [{ volumeMl: AMPOLA_ML, cor: 'adrenalina' as const, rotulo: `Adrenalina ${fmt(AMPOLA_ML)} mL` }],
};
const seringaMisturada = {
  capacidadeMl: VOLUME_DILUICAO_ML,
  rotulo: `Seringa ${VOLUME_DILUICAO_ML} mL — 1:10.000`,
  camadas: [{ volumeMl: VOLUME_DILUICAO_ML, cor: 'mistura' as const, rotulo: `${fmt(concDiluida)} mg/mL` }],
};

const linhaTexto = `Adrenalina 1:10.000 — ${fmt(volumeDose)} mL (${fmt(dose)} mg) EV/IO`;
const linhaPreparo = `Diluir 1 ampola (1 mg/mL) + SF 0,9% ${fmt(sfDiluicao)} mL = ${VOLUME_DILUICAO_ML} mL (${fmt(concDiluida)} mg/mL)`;

export const roteiroAdrenalinaPcr: Roteiro = {
  id: 'adrenalina-pcr',
  tema: 'Emergência',
  titulo: 'Diluição: adrenalina 1:10.000 na PCR',
  resumo: 'Por que diluir, como fazer a conta C1 × V1 = C2 × V2 e quanto aspirar.',
  paciente: {
    nome: 'Lucas',
    descricao: `1 ano, ${fmt(PESO_KG)} kg, em parada cardiorrespiratória`,
  },
  etapas: [
    {
      id: 'paciente',
      secao: 'identificacao',
      curto: 'Paciente',
      titulo: 'Emergência: parada cardiorrespiratória',
      explicacao: [
        `Lucas, 1 ano, ${fmt(PESO_KG)} kg, está em parada cardiorrespiratória (PCR) com ritmo não chocável. A equipe já iniciou compressões e ventilação.`,
        'A adrenalina é a medicação da PCR. Como tudo é por peso, o primeiro dado a confirmar é, de novo, o peso.',
      ],
      dica: 'Na emergência sem balança, usa-se o peso estimado (fita de Broselow ou fórmula por idade). O programa terá um roteiro só para isso.',
      cena: {
        tipo: 'paciente',
        perfil: 'crianca',
        pesoKg: PESO_KG,
        rotulos: [
          { rotulo: 'Idade', valor: '1 ano' },
          { rotulo: 'Peso', valor: `${fmt(PESO_KG)} kg` },
          { rotulo: 'Situação', valor: 'PCR — ritmo não chocável' },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: `Lucas · 1 ano · Peso ${fmt(PESO_KG)} kg`, detalhe: 'Sala de emergência' },
    },
    {
      id: 'dose',
      secao: 'medicacoes',
      curto: 'Dose',
      titulo: 'Quanto de adrenalina?',
      explicacao: [
        `A dose da adrenalina na PCR é de ${fmt(DOSE_MG_KG)} mg por kg. Cada bloco é 1 kg da criança.`,
        `Somando os ${fmt(PESO_KG)} blocos: ${fmt(dose)} mg. Esse valor está abaixo da dose máxima (${fmt(DOSE_MAXIMA_MG)} mg), então usamos a dose calculada.`,
      ],
      conta: {
        formula: 'Dose = mg/kg × peso',
        substituicao: `${fmt(DOSE_MG_KG)} mg/kg × ${fmt(PESO_KG)} kg`,
        resultado: `${fmt(dose)} mg`,
        rascunho: `Adrenalina: ${fmt(DOSE_MG_KG)} × ${fmt(PESO_KG)} = ${fmt(dose)} mg`,
      },
      aValidar: `${fmt(DOSE_MG_KG)} mg/kg EV/IO (máx. ${fmt(DOSE_MAXIMA_MG)} mg), a cada 3–5 min.`,
      fonte: 'PALS / AHA',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: DOSE_MG_KG,
        unidade: 'mg',
        pesoKg: PESO_KG,
        total: dose,
        rotuloTotal: `${fmt(dose)} mg`,
      },
      linha: { id: 'adr', secao: 'medicacoes', texto: `Adrenalina — ${fmt(dose)} mg EV/IO` },
    },
    {
      id: 'problema',
      secao: 'medicacoes',
      curto: 'O problema',
      titulo: 'Por que não usar a ampola direto?',
      explicacao: [
        `A ampola tem 1 mg em 1 mL (chamada de 1:1.000). Para dar ${fmt(dose)} mg, seriam só ${fmt(volumeSemDiluir)} mL — uma gotinha no fundo da seringa.`,
        'Numa emergência, medir um volume tão pequeno é fácil de errar: um pouquinho a mais já é uma dose muito maior. A solução é DILUIR, para que a mesma dose ocupe um volume maior e mais fácil de medir.',
      ],
      conta: {
        formula: 'Volume = dose ÷ concentração',
        substituicao: `${fmt(dose)} mg ÷ ${fmt(AMPOLA_MG_ML)} mg/mL`,
        resultado: `${fmt(volumeSemDiluir)} mL — pequeno demais!`,
        rascunho: `Sem diluir: ${fmt(dose)} ÷ 1 = ${fmt(volumeSemDiluir)} mL (muito pouco)`,
      },
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: ampolaCheia,
          seringa: { capacidadeMl: 1, rotulo: 'Seringa 1 mL', camadas: [] },
        },
        estado: {
          frasco: { ...ampolaCheia, nivel: 0.85 * (1 - volumeSemDiluir) },
          seringa: {
            capacidadeMl: 1,
            rotulo: 'Seringa 1 mL',
            camadas: [{ volumeMl: volumeSemDiluir, cor: 'adrenalina', rotulo: `${fmt(volumeSemDiluir)} mL` }],
          },
          fluxos: ['frasco-seringa'],
          balao: `Só ${fmt(volumeSemDiluir)} mL: difícil de medir!`,
        },
      },
    },
    {
      id: 'aspirar-ampola',
      secao: 'medicacoes',
      curto: 'Aspirar 1 mL',
      titulo: 'Diluição, passo 1: aspirar a ampola inteira',
      explicacao: [
        `Pegamos uma seringa de ${VOLUME_DILUICAO_ML} mL e aspiramos a ampola inteira: 1 mL, que contém 1 mg de adrenalina.`,
        'Guarde este número: a quantidade de remédio (1 mg) não muda quando colocamos soro. O que muda é o volume em que ela fica espalhada.',
      ],
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: ampolaCheia,
          seringa: { capacidadeMl: VOLUME_DILUICAO_ML, rotulo: `Seringa ${VOLUME_DILUICAO_ML} mL`, camadas: [] },
        },
        estado: {
          frasco: ampolaVazia,
          seringa: seringaSoAdrenalina,
          fluxos: ['frasco-seringa'],
          balao: '1 mL = 1 mg',
        },
      },
    },
    {
      id: 'completar',
      secao: 'medicacoes',
      curto: 'Completar 10 mL',
      titulo: 'Diluição, passo 2: completar com soro até 10 mL',
      explicacao: [
        `Completamos a seringa com ${fmt(sfDiluicao)} mL de SF 0,9% até ${VOLUME_DILUICAO_ML} mL e misturamos.`,
        `Agora o mesmo 1 mg está espalhado em ${VOLUME_DILUICAO_ML} mL. A regra C1 × V1 = C2 × V2 mostra a nova concentração: ${fmt(concDiluida)} mg/mL. É a adrenalina "1:10.000".`,
      ],
      conta: {
        formula: 'C1 × V1 = C2 × V2  →  C2 = C1 × V1 ÷ V2',
        substituicao: `1 mg/mL × 1 mL ÷ ${VOLUME_DILUICAO_ML} mL`,
        resultado: `${fmt(concDiluida)} mg/mL (1:10.000)`,
        rascunho: `Diluição: 1 × 1 = C2 × ${VOLUME_DILUICAO_ML} → C2 = ${fmt(concDiluida)} mg/mL`,
      },
      dica: '"1:10.000" quer dizer 1 g em 10.000 mL, que é o mesmo que 0,1 mg/mL. A ampola "1:1.000" é 1 g em 1.000 mL = 1 mg/mL.',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: ampolaVazia,
          seringa: seringaSoAdrenalina,
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: false },
        },
        estado: {
          seringa: {
            capacidadeMl: VOLUME_DILUICAO_ML,
            rotulo: `Seringa ${VOLUME_DILUICAO_ML} mL`,
            camadas: [
              { volumeMl: AMPOLA_ML, cor: 'adrenalina', rotulo: `Adrenalina ${fmt(AMPOLA_ML)} mL` },
              { volumeMl: sfDiluicao, cor: 'sf', rotulo: `SF 0,9% ${fmt(sfDiluicao)} mL` },
            ],
          },
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: true },
          fluxos: ['bolsa-seringa'],
          balao: `1 mg em ${VOLUME_DILUICAO_ML} mL = ${fmt(concDiluida)} mg/mL`,
        },
      },
      linha: { id: 'adr', secao: 'medicacoes', texto: `Adrenalina — ${fmt(dose)} mg EV/IO`, detalhe: linhaPreparo },
    },
    {
      id: 'volume',
      secao: 'medicacoes',
      curto: 'Quanto dar',
      titulo: 'Quantos mL da solução diluída?',
      explicacao: [
        `Com a nova concentração (${fmt(concDiluida)} mg/mL), repetimos a conta de sempre: dose ÷ concentração.`,
        `Resultado: ${fmt(volumeDose)} mL — agora um volume fácil de medir. Na animação, esse volume sai da seringa para o paciente.`,
      ],
      conta: {
        formula: 'Volume = dose ÷ concentração',
        substituicao: `${fmt(dose)} mg ÷ ${fmt(concDiluida)} mg/mL`,
        resultado: `${fmt(volumeDose)} mL EV/IO`,
        rascunho: `Dar: ${fmt(dose)} ÷ ${fmt(concDiluida)} = ${fmt(volumeDose)} mL`,
      },
      dica: 'Atalho: com a adrenalina 1:10.000, a dose de 0,01 mg/kg é igual a 0,1 mL/kg. Sempre confira pela conta completa.',
      cena: {
        tipo: 'bancada',
        estadoInicial: { seringa: seringaMisturada },
        estado: {
          seringa: {
            ...seringaMisturada,
            camadas: [{ volumeMl: VOLUME_DILUICAO_ML - volumeDose, cor: 'mistura', rotulo: `restam ${fmt(VOLUME_DILUICAO_ML - volumeDose)} mL` }],
          },
          fluxos: ['seringa-paciente'],
          balao: `${fmt(volumeDose)} mL = ${fmt(dose)} mg`,
        },
      },
      linha: { id: 'adr', secao: 'medicacoes', texto: linhaTexto, detalhe: linhaPreparo },
    },
    {
      id: 'repetir',
      secao: 'medicacoes',
      curto: 'Flush e repetir',
      titulo: 'Depois da dose: flush e repetição',
      explicacao: [
        'Logo após cada dose, empurra-se soro fisiológico (flush) para a adrenalina sair do equipo e chegar à circulação.',
        'Enquanto durar a parada, a dose pode ser repetida a cada 3 a 5 minutos. A seringa diluída fica pronta e identificada para as próximas doses.',
      ],
      aValidar: 'Intervalo de 3–5 min e volume do flush — conferir no PALS/AHA vigente.',
      fonte: 'PALS / AHA',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'seringa', titulo: 'Flush de SF 0,9%', texto: 'após cada dose', estado: 'sim' },
          { icone: 'relogio', titulo: 'Repetir', texto: 'a cada 3–5 min, enquanto em PCR', estado: 'sim' },
          { icone: 'alerta', titulo: 'Dose máxima', texto: `${fmt(DOSE_MAXIMA_MG)} mg por dose`, estado: 'atencao' },
        ],
      },
      linha: {
        id: 'adr',
        secao: 'medicacoes',
        texto: linhaTexto,
        detalhe: `${linhaPreparo} · flush de SF após cada dose · repetir a cada 3–5 min`,
      },
    },
    {
      id: 'revisao',
      secao: 'revisao',
      curto: 'Revisão',
      titulo: 'Revisão: o que aprendemos',
      explicacao: [
        'Diluir não muda a quantidade de remédio — só o volume em que ele está. Por isso a conta C1 × V1 = C2 × V2 funciona: o "C × V" (a quantidade) é igual antes e depois.',
        'A rediluição segue a mesma regra, partindo de uma solução que já foi diluída. Ela terá um roteiro próprio quando as apresentações da Santa Casa estiverem cadastradas.',
      ],
      cena: {
        tipo: 'conclusao',
        itens: [
          `Dose: ${fmt(DOSE_MG_KG)} mg/kg × ${fmt(PESO_KG)} kg = ${fmt(dose)} mg`,
          `Diluição: 1 mL da ampola + ${fmt(sfDiluicao)} mL de SF = ${fmt(concDiluida)} mg/mL`,
          `Volume: ${fmt(dose)} ÷ ${fmt(concDiluida)} = ${fmt(volumeDose)} mL`,
          'Flush de SF e repetir a cada 3–5 min',
        ],
      },
    },
  ],
};
