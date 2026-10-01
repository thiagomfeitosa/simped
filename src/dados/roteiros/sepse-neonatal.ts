/**
 * Roteiro 1 — Prescrição completa de um RN com suspeita de sepse neonatal precoce.
 *
 * CASO DIDÁTICO. Todas as doses, tempos e condutas vêm de docs/fase-0/doses-rascunho.md
 * e estão marcados "A VALIDAR" até o usuário conferir nas fontes.
 * Os números são calculados pelas funções de o motor de cálculo src/calculos/ (o mesmo do Prescrever) (não digitados à mão).
 */
import {
  concentracao,
  diluir,
  doseTotal,
  prepararSeringaBic,
  vazaoDoVolume,
  vig,
  volumeAspirar,
} from '../../calculos';
import { fmt } from '../../logica/formatacao';
import type { Roteiro } from './tipos';

// ---- Dados do caso ---------------------------------------------------------
const PESO_KG = 3;
const VOLUME_FINAL_BIC_ML = 12; // Santa Casa (configurável por hospital)

// Hidratação (A VALIDAR — SBP Neonatologia)
const HIDRICO_ML_KG_DIA = 80;
const GLICOSE_PERCENT = 10;

// Ampicilina (A VALIDAR — Neofax / Red Book)
const AMPI_MG_KG = 50;
const AMPI_FRASCO_MG = 500;
const AMPI_DILUENTE_ML = 5;
const AMPI_TEMPO_MIN = 30;

// Gentamicina (A VALIDAR — Neofax)
const GENTA_MG_KG = 4;
const GENTA_AMPOLA_MG_ML = 40;
const GENTA_AMPOLA_ML = 2;
const GENTA_TEMPO_MIN = 30;

// ---- Contas ----------------------------------------------------------------
/** Fator de correção da BIC: medicação + SF até o volume final; a concentração final é dose ÷ volume final. */
function seringaBic(volumeMedicacaoMl: number, doseMg: number) {
  const r = prepararSeringaBic({ volumeMedicacaoMl, volumeFinalMl: VOLUME_FINAL_BIC_ML });
  if (!r.aplicavel) throw new Error(r.motivo);
  return {
    volumeSF: r.volumeSoroMl,
    concentracaoFinal: concentracao({ quantidade: doseMg, volumeMl: VOLUME_FINAL_BIC_ML }),
  };
}

const hidricoDia = doseTotal({ dosePorKg: HIDRICO_ML_KG_DIA, pesoKg: PESO_KG }).dose;
const vazaoSoro = vazaoDoVolume(hidricoDia, 24 * 60);
const vigSoro = vig({ vazaoMlPorHora: vazaoSoro, concentracaoGlicosePct: GLICOSE_PERCENT, pesoKg: PESO_KG });

const ampiDose = doseTotal({ dosePorKg: AMPI_MG_KG, pesoKg: PESO_KG }).dose;
const ampiConc = concentracao({ quantidade: AMPI_FRASCO_MG, volumeMl: AMPI_DILUENTE_ML });
const ampiVolume = volumeAspirar({ dose: ampiDose, concentracao: ampiConc });
const ampiBic = seringaBic(ampiVolume, ampiDose);
const ampiVazao = vazaoDoVolume(VOLUME_FINAL_BIC_ML, AMPI_TEMPO_MIN);

const gentaDose = doseTotal({ dosePorKg: GENTA_MG_KG, pesoKg: PESO_KG }).dose;
const gentaVolume = volumeAspirar({ dose: gentaDose, concentracao: GENTA_AMPOLA_MG_ML });
const gentaBic = seringaBic(gentaVolume, gentaDose);
const gentaVazao = vazaoDoVolume(VOLUME_FINAL_BIC_ML, GENTA_TEMPO_MIN);

// Nível do líquido no frasco da ampicilina (desenho): cheio = 0,6
const AMPI_NIVEL_CHEIO = 0.6;
const ampiNivelDepois = AMPI_NIVEL_CHEIO * (1 - ampiVolume / AMPI_DILUENTE_ML);
const GENTA_NIVEL_CHEIO = 0.85;
const gentaNivelDepois = GENTA_NIVEL_CHEIO * (1 - gentaVolume / GENTA_AMPOLA_ML);

const soroTexto = `SG ${GLICOSE_PERCENT}% — ${fmt(hidricoDia)} mL/dia, EV, em BIC a ${fmt(vazaoSoro)} mL/h`;
const ampiTexto = `Ampicilina — ${fmt(ampiDose)} mg EV de 12/12 h`;
const ampiPreparo = `Reconstituir ${AMPI_FRASCO_MG} mg em ${AMPI_DILUENTE_ML} mL de AD (${fmt(ampiConc)} mg/mL) → aspirar ${fmt(ampiVolume)} mL`;
const ampiBicTexto = `${ampiPreparo} + SF 0,9% ${fmt(ampiBic.volumeSF)} mL = ${VOLUME_FINAL_BIC_ML} mL`;
const gentaTexto = `Gentamicina — ${fmt(gentaDose)} mg EV de 24/24 h`;
const gentaPreparo = `Ampola ${GENTA_AMPOLA_MG_ML} mg/mL → aspirar ${fmt(gentaVolume)} mL`;
const gentaBicTexto = `${gentaPreparo} + SF 0,9% ${fmt(gentaBic.volumeSF)} mL = ${VOLUME_FINAL_BIC_ML} mL`;

const seringaAmpiPronta = {
  capacidadeMl: 20,
  rotulo: `Seringa 20 mL — ${VOLUME_FINAL_BIC_ML} mL`,
  camadas: [
    { volumeMl: ampiVolume, cor: 'medicacao' as const, rotulo: `Ampicilina ${fmt(ampiVolume)} mL` },
    { volumeMl: ampiBic.volumeSF, cor: 'sf' as const, rotulo: `SF 0,9% ${fmt(ampiBic.volumeSF)} mL` },
  ],
};

const seringaGentaPronta = {
  capacidadeMl: 20,
  rotulo: `Seringa 20 mL — ${VOLUME_FINAL_BIC_ML} mL`,
  camadas: [
    { volumeMl: gentaVolume, cor: 'medicacao2' as const, rotulo: `Gentamicina ${fmt(gentaVolume)} mL` },
    { volumeMl: gentaBic.volumeSF, cor: 'sf' as const, rotulo: `SF 0,9% ${fmt(gentaBic.volumeSF)} mL` },
  ],
};

export const roteiroSepseNeonatal: Roteiro = {
  id: 'sepse-neonatal',
  tema: 'Neonatologia',
  titulo: 'RN com suspeita de sepse — prescrição completa',
  resumo: 'Da identificação à revisão final: soro com VIG, ampicilina (reconstituição + BIC) e gentamicina (BIC 12 mL).',
  paciente: {
    nome: 'RN de Maria Souza',
    descricao: `Termo (39 sem), 2 dias de vida, ${fmt(PESO_KG * 1000)} g`,
  },
  etapas: [
    // 1. IDENTIFICAÇÃO -------------------------------------------------------
    {
      id: 'identificacao',
      secao: 'identificacao',
      curto: 'Paciente',
      titulo: 'Quem é o paciente?',
      explicacao: [
        'Toda prescrição começa pela identificação: nome, idade (no RN, em dias de vida), idade gestacional, peso e leito.',
        'O peso é o dado mais importante da folha: todas as contas das próximas etapas partem dele. Um erro aqui se multiplica em todas as doses.',
      ],
      dica: `No RN, o peso costuma vir em gramas. Converta para kg antes das contas: ${fmt(PESO_KG * 1000)} g = ${fmt(PESO_KG)} kg.`,
      cena: {
        tipo: 'paciente',
        perfil: 'rn',
        pesoKg: PESO_KG,
        rotulos: [
          { rotulo: 'Idade', valor: '2 dias de vida' },
          { rotulo: 'Idade gestacional', valor: '39 semanas (termo)' },
          { rotulo: 'Peso', valor: `${fmt(PESO_KG * 1000)} g = ${fmt(PESO_KG)} kg` },
          { rotulo: 'Motivo', valor: 'suspeita de sepse neonatal precoce' },
        ],
      },
      linha: {
        id: 'id',
        secao: 'identificacao',
        texto: 'RN de Maria Souza · 2 dias de vida · IG 39 sem · Peso 3.000 g',
        detalhe: 'Leito 4',
      },
    },

    // 2. OXIGENOTERAPIA ------------------------------------------------------
    {
      id: 'oxigenio',
      secao: 'oxigenoterapia',
      curto: 'O₂',
      titulo: 'Precisa de oxigênio?',
      explicacao: [
        'A oxigenoterapia vem logo depois da identificação porque é prioridade: se o paciente precisa de O₂, isso não pode se perder no meio da folha.',
        'Aqui o RN está com SpO₂ de 97% em ar ambiente e respira sem esforço. O item fica como "não se aplica" — mas continua escrito, para mostrar que foi pensado.',
      ],
      dica: 'Quando se aplica, escreva: o modo (cateter nasal, capuz, CPAP…), o fluxo (L/min) ou a FiO₂ e a meta de saturação.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'saturacao', titulo: 'SpO₂ 97%', texto: 'em ar ambiente', estado: 'sim' },
          { icone: 'pulmao', titulo: 'Sem desconforto', texto: 'respiração tranquila', estado: 'sim' },
          { icone: 'x', titulo: 'Oxigenoterapia', texto: 'não se aplica agora', estado: 'nao' },
        ],
      },
      linha: {
        id: 'o2',
        secao: 'oxigenoterapia',
        texto: 'Não se aplica no momento (SpO₂ 97% em ar ambiente)',
      },
    },

    // 3. DIETA ---------------------------------------------------------------
    {
      id: 'dieta',
      secao: 'dieta',
      curto: 'Dieta',
      titulo: 'Dieta',
      explicacao: [
        'A dieta é sempre o 3º item. No RN, as opções mais comuns são: seio materno em livre demanda, fórmula (via oral ou sonda) ou dieta zero.',
        'Neste caso didático, o plano é deixar o bebê em dieta zero nas primeiras 24 horas. Por isso, TODA a água e a glicose de que ele precisa virão do soro — que é a próxima seção.',
      ],
      aValidar: 'Conduta do caso didático (dieta zero por 24 h) — conferir com o protocolo do serviço.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'seio', titulo: 'Seio materno', texto: 'suspenso por ora', estado: 'nao' },
          { icone: 'mamadeira', titulo: 'Fórmula', texto: 'não', estado: 'nao' },
          { icone: 'jejum', titulo: 'Dieta zero', texto: 'por 24 h — reavaliar', estado: 'sim' },
        ],
      },
      linha: { id: 'dieta', secao: 'dieta', texto: 'Dieta zero — reavaliar em 24 h' },
    },

    // 4. HIDRATAÇÃO ----------------------------------------------------------
    {
      id: 'soro-volume',
      secao: 'volemia',
      curto: 'Volume/dia',
      titulo: 'Quanto líquido por dia?',
      explicacao: [
        'No RN, a hidratação é calculada em mL por kg por dia. Cada bloco da animação é 1 kg do bebê recebendo a sua parte.',
        'Somando os blocos, temos o volume total que o soro vai correr em 24 horas.',
      ],
      conta: {
        formula: 'Volume do dia = mL/kg/dia × peso',
        substituicao: `${HIDRICO_ML_KG_DIA} mL/kg/dia × ${fmt(PESO_KG)} kg`,
        resultado: `${fmt(hidricoDia)} mL por dia`,
        rascunho: `Hídrico: ${HIDRICO_ML_KG_DIA} × ${fmt(PESO_KG)} = ${fmt(hidricoDia)} mL/dia`,
      },
      aValidar: `Oferta hídrica de ${HIDRICO_ML_KG_DIA} mL/kg/dia no 2º dia de vida (RN termo).`,
      fonte: 'SBP — Neonatologia',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: HIDRICO_ML_KG_DIA,
        unidade: 'mL',
        pesoKg: PESO_KG,
        total: hidricoDia,
        rotuloTotal: `${fmt(hidricoDia)} mL em 24 h`,
      },
      linha: { id: 'soro', secao: 'volemia', texto: `SG ${GLICOSE_PERCENT}% — ${fmt(hidricoDia)} mL/dia, EV` },
    },
    {
      id: 'soro-vazao',
      secao: 'volemia',
      curto: 'Vazão',
      titulo: 'Quantos mL por hora?',
      explicacao: [
        'A bomba de infusão (BIC) é programada em mL por hora. Como o dia tem 24 horas, dividimos o volume do dia por 24.',
        `Na animação, a bolsa de SG ${GLICOSE_PERCENT}% é ligada à BIC, e o visor mostra a velocidade programada.`,
      ],
      conta: {
        formula: 'Vazão = volume do dia ÷ 24 h',
        substituicao: `${fmt(hidricoDia)} mL ÷ 24 h`,
        resultado: `${fmt(vazaoSoro)} mL/h`,
        rascunho: `Vazão: ${fmt(hidricoDia)} ÷ 24 = ${fmt(vazaoSoro)} mL/h`,
      },
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          bolsa: { rotulo: `SG ${GLICOSE_PERCENT}%`, cor: 'glicose', gotejando: false },
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC do soro' },
        },
        estado: {
          bolsa: { rotulo: `SG ${GLICOSE_PERCENT}%`, cor: 'glicose', gotejando: true },
          bic: { vazaoMlH: vazaoSoro, ligada: true, rotulo: 'BIC do soro' },
          fluxos: ['bolsa-bic', 'bic-paciente'],
        },
      },
      linha: { id: 'soro', secao: 'volemia', texto: soroTexto },
    },
    {
      id: 'soro-vig',
      secao: 'volemia',
      curto: 'VIG',
      titulo: 'Quanta glicose isso dá? (VIG)',
      explicacao: [
        'A velocidade de infusão de glicose (VIG) diz quantos miligramas de glicose o bebê recebe por kg a cada minuto. É o jeito de conferir se o soro vai manter a glicemia sem exagerar.',
        `A fórmula usa a vazão, a concentração do soro (${GLICOSE_PERCENT}%) e o peso. O número 6 vem da conversão de unidades (gramas → miligramas e horas → minutos).`,
        'Eletrólitos (sódio, potássio, cálcio) entram no soro conforme os dias de vida e os exames — isso terá um roteiro próprio.',
      ],
      conta: {
        formula: 'VIG = vazão (mL/h) × glicose (%) ÷ (6 × peso)',
        substituicao: `${fmt(vazaoSoro)} × ${GLICOSE_PERCENT} ÷ (6 × ${fmt(PESO_KG)}) = ${fmt(vazaoSoro * GLICOSE_PERCENT)} ÷ ${fmt(6 * PESO_KG)}`,
        resultado: `≈ ${fmt(vigSoro, 1)} mg/kg/min`,
        rascunho: `VIG: ${fmt(vazaoSoro)} × ${GLICOSE_PERCENT} ÷ ${fmt(6 * PESO_KG)} ≈ ${fmt(vigSoro, 1)} mg/kg/min`,
      },
      dica: 'Se a VIG ficar baixa, aumenta-se a concentração do soro (ex.: SG 10% + glicose 50%) ou o volume.',
      aValidar: 'Faixa inicial de VIG de 4 a 6 mg/kg/min no RN (faixa verde da régua).',
      fonte: 'SBP — Neonatologia',
      cena: {
        tipo: 'bancada',
        estado: {
          bolsa: { rotulo: `SG ${GLICOSE_PERCENT}%`, cor: 'glicose', gotejando: true },
          bic: { vazaoMlH: vazaoSoro, ligada: true, rotulo: 'BIC do soro' },
          fluxos: ['bolsa-bic', 'bic-paciente'],
          medidor: {
            rotulo: 'VIG',
            valor: vigSoro,
            unidade: 'mg/kg/min',
            minimo: 0,
            maximo: 10,
            faixaAlvo: [4, 6],
          },
        },
      },
      linha: {
        id: 'soro',
        secao: 'volemia',
        texto: soroTexto,
        detalhe: `VIG ≈ ${fmt(vigSoro, 1)} mg/kg/min`,
      },
    },

    // 5. ANTIBIÓTICOS — AMPICILINA ------------------------------------------
    {
      id: 'ampi-dose',
      secao: 'antimicrobianos',
      curto: 'Ampi: dose',
      titulo: 'Ampicilina — quanto vai em cada dose?',
      explicacao: [
        'Na sepse neonatal precoce, o esquema clássico é ampicilina + gentamicina. Começamos pela ampicilina.',
        'A dose vem em mg por kg por DOSE. Multiplicando pelo peso, temos quanto vai em cada aplicação.',
      ],
      conta: {
        formula: 'Dose = mg/kg/dose × peso',
        substituicao: `${AMPI_MG_KG} mg/kg × ${fmt(PESO_KG)} kg`,
        resultado: `${fmt(ampiDose)} mg por dose`,
        rascunho: `Ampicilina: ${AMPI_MG_KG} × ${fmt(PESO_KG)} = ${fmt(ampiDose)} mg/dose`,
      },
      aValidar: `${AMPI_MG_KG} mg/kg/dose de 12/12 h (≤ 7 dias de vida). O intervalo muda com a IG e os dias de vida.`,
      fonte: 'Neofax / Red Book',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: AMPI_MG_KG,
        unidade: 'mg',
        pesoKg: PESO_KG,
        total: ampiDose,
        rotuloTotal: `${fmt(ampiDose)} mg por dose`,
      },
      linha: { id: 'ampi', secao: 'antimicrobianos', texto: ampiTexto },
    },
    {
      id: 'ampi-reconstituir',
      secao: 'antimicrobianos',
      curto: 'Ampi: diluir',
      titulo: 'Transformar o pó em líquido (reconstituição)',
      explicacao: [
        `A ampicilina vem em pó, num frasco-ampola de ${AMPI_FRASCO_MG} mg. Para usar, injetamos um diluente (água destilada, AD) dentro do frasco. Isso é a reconstituição (1ª diluição).`,
        `Com ${AMPI_DILUENTE_ML} mL de AD em ${AMPI_FRASCO_MG} mg, cada mL passa a ter ${fmt(ampiConc)} mg. É essa concentração que usamos na próxima conta.`,
      ],
      conta: {
        formula: 'Concentração = quantidade ÷ volume',
        substituicao: `${AMPI_FRASCO_MG} mg ÷ ${AMPI_DILUENTE_ML} mL`,
        resultado: `${fmt(ampiConc)} mg/mL`,
        rascunho: `Reconstituição: ${AMPI_FRASCO_MG} ÷ ${AMPI_DILUENTE_ML} = ${fmt(ampiConc)} mg/mL`,
      },
      dica: 'Para simplificar, consideramos que o pó não aumenta o volume. Quando a bula informar o volume final real, o programa usará esse dado.',
      aValidar: `Volume de reconstituição (${AMPI_DILUENTE_ML} mL) — conferir na bula do fabricante usado no hospital.`,
      fonte: 'Bula',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: { modelo: 'frasco-po', rotulo: `Ampicilina ${AMPI_FRASCO_MG} mg`, sublinha: 'pó', nivel: 0, cor: 'medicacao', po: true },
          seringa: {
            capacidadeMl: 10,
            rotulo: 'Seringa 10 mL',
            camadas: [{ volumeMl: AMPI_DILUENTE_ML, cor: 'agua', rotulo: `AD ${AMPI_DILUENTE_ML} mL` }],
          },
        },
        estado: {
          frasco: {
            modelo: 'frasco-po',
            rotulo: `Ampicilina ${AMPI_FRASCO_MG} mg`,
            sublinha: `${fmt(ampiConc)} mg/mL`,
            nivel: AMPI_NIVEL_CHEIO,
            cor: 'medicacao',
            po: false,
          },
          seringa: { capacidadeMl: 10, rotulo: 'Seringa 10 mL', camadas: [] },
          fluxos: ['seringa-frasco'],
          balao: `${AMPI_DILUENTE_ML} mL de AD → ${fmt(ampiConc)} mg/mL`,
        },
      },
      linha: { id: 'ampi', secao: 'antimicrobianos', texto: ampiTexto, detalhe: `Reconstituir ${AMPI_FRASCO_MG} mg em ${AMPI_DILUENTE_ML} mL de AD (${fmt(ampiConc)} mg/mL)` },
    },
    {
      id: 'ampi-aspirar',
      secao: 'antimicrobianos',
      curto: 'Ampi: aspirar',
      titulo: 'Quantos mL aspirar?',
      explicacao: [
        `Já sabemos a dose (${fmt(ampiDose)} mg) e a concentração (${fmt(ampiConc)} mg/mL). Para achar o volume, dividimos a dose pela concentração.`,
        `Na animação, a seringa aspira exatamente ${fmt(ampiVolume)} mL do frasco reconstituído.`,
      ],
      conta: {
        formula: 'Volume = dose ÷ concentração',
        substituicao: `${fmt(ampiDose)} mg ÷ ${fmt(ampiConc)} mg/mL`,
        resultado: `${fmt(ampiVolume)} mL`,
        rascunho: `Aspirar: ${fmt(ampiDose)} ÷ ${fmt(ampiConc)} = ${fmt(ampiVolume)} mL`,
      },
      dica: 'Confira sempre a unidade: mg ÷ (mg/mL) = mL. Se sobrar outra unidade, a conta foi montada errada.',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: { modelo: 'frasco-po', rotulo: `Ampicilina ${AMPI_FRASCO_MG} mg`, sublinha: `${fmt(ampiConc)} mg/mL`, nivel: AMPI_NIVEL_CHEIO, cor: 'medicacao' },
          seringa: { capacidadeMl: 20, rotulo: 'Seringa 20 mL', camadas: [] },
        },
        estado: {
          frasco: { modelo: 'frasco-po', rotulo: `Ampicilina ${AMPI_FRASCO_MG} mg`, sublinha: `${fmt(ampiConc)} mg/mL`, nivel: ampiNivelDepois, cor: 'medicacao' },
          seringa: {
            capacidadeMl: 20,
            rotulo: 'Seringa 20 mL',
            camadas: [{ volumeMl: ampiVolume, cor: 'medicacao', rotulo: `Ampicilina ${fmt(ampiVolume)} mL` }],
          },
          fluxos: ['frasco-seringa'],
          balao: `${fmt(ampiVolume)} mL = ${fmt(ampiDose)} mg`,
        },
      },
      linha: { id: 'ampi', secao: 'antimicrobianos', texto: ampiTexto, detalhe: ampiPreparo },
    },
    {
      id: 'ampi-bic',
      secao: 'antimicrobianos',
      curto: 'Ampi: 12 mL',
      titulo: `Fator de correção da BIC: completar até ${VOLUME_FINAL_BIC_ML} mL`,
      explicacao: [
        `Na Santa Casa, a medicação vai para a bomba numa seringa com volume final fixo de ${VOLUME_FINAL_BIC_ML} mL (esse número poderá ser configurado para cada hospital).`,
        `A conta: ${VOLUME_FINAL_BIC_ML} menos o volume da medicação = quanto de soro fisiológico (SF 0,9%) acrescentar. Na animação, o SF entra por cima da medicação até a marca de ${VOLUME_FINAL_BIC_ML} mL.`,
        `Os ${fmt(ampiDose)} mg agora estão espalhados em ${VOLUME_FINAL_BIC_ML} mL: a concentração final fica ${fmt(ampiBic.concentracaoFinal)} mg/mL.`,
      ],
      conta: {
        formula: `SF = ${VOLUME_FINAL_BIC_ML} mL − volume da medicação`,
        substituicao: `${VOLUME_FINAL_BIC_ML} − ${fmt(ampiVolume)}`,
        resultado: `${fmt(ampiBic.volumeSF)} mL de SF (total ${VOLUME_FINAL_BIC_ML} mL)`,
        rascunho: `BIC: ${fmt(ampiVolume)} + ${fmt(ampiBic.volumeSF)} SF = ${VOLUME_FINAL_BIC_ML} mL (${fmt(ampiBic.concentracaoFinal)} mg/mL)`,
      },
      aValidar: `Se a ampicilina segue a regra dos ${VOLUME_FINAL_BIC_ML} mL em BIC — confirmar com o protocolo do hospital.`,
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          seringa: {
            capacidadeMl: 20,
            rotulo: 'Seringa 20 mL',
            camadas: [{ volumeMl: ampiVolume, cor: 'medicacao', rotulo: `Ampicilina ${fmt(ampiVolume)} mL` }],
          },
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: false },
        },
        estado: {
          seringa: seringaAmpiPronta,
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: true },
          fluxos: ['bolsa-seringa'],
          balao: `${fmt(ampiVolume)} + ${fmt(ampiBic.volumeSF)} = ${VOLUME_FINAL_BIC_ML} mL`,
        },
      },
      linha: { id: 'ampi', secao: 'antimicrobianos', texto: ampiTexto, detalhe: ampiBicTexto },
    },
    {
      id: 'ampi-vazao',
      secao: 'antimicrobianos',
      curto: 'Ampi: BIC',
      titulo: 'Programar a bomba (BIC)',
      explicacao: [
        'Falta dizer em quanto tempo a seringa deve correr. Com o tempo definido, a vazão é o volume dividido pelo tempo em horas.',
        `${VOLUME_FINAL_BIC_ML} mL em ${AMPI_TEMPO_MIN} minutos (meia hora) = ${fmt(ampiVazao)} mL/h. Na animação, a seringa é conectada à BIC e o visor mostra a velocidade.`,
      ],
      conta: {
        formula: 'Vazão = volume ÷ tempo (em horas)',
        substituicao: `${VOLUME_FINAL_BIC_ML} mL ÷ ${fmt(AMPI_TEMPO_MIN / 60)} h`,
        resultado: `${fmt(ampiVazao)} mL/h`,
        rascunho: `Vazão: ${VOLUME_FINAL_BIC_ML} mL em ${AMPI_TEMPO_MIN} min = ${fmt(ampiVazao)} mL/h`,
      },
      aValidar: `Tempo de infusão da ampicilina (${AMPI_TEMPO_MIN} min neste exemplo) — conferir na bula/protocolo.`,
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          seringa: seringaAmpiPronta,
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC da ampicilina' },
        },
        estado: {
          seringa: seringaAmpiPronta,
          bic: { vazaoMlH: ampiVazao, ligada: true, rotulo: 'BIC da ampicilina' },
          fluxos: ['seringa-bic', 'bic-paciente'],
        },
      },
      linha: {
        id: 'ampi',
        secao: 'antimicrobianos',
        texto: ampiTexto,
        detalhe: `${ampiBicTexto} · BIC a ${fmt(ampiVazao)} mL/h (${AMPI_TEMPO_MIN} min)`,
      },
    },

    // 5. ANTIBIÓTICOS — GENTAMICINA -----------------------------------------
    {
      id: 'genta-dose',
      secao: 'antimicrobianos',
      curto: 'Genta: dose',
      titulo: 'Gentamicina — a dose',
      explicacao: [
        'O segundo antibiótico do esquema é a gentamicina. No RN, a dose e o intervalo mudam conforme a idade gestacional e os dias de vida — é por isso que a IG está na identificação.',
        `Para um RN de termo (39 semanas), o rascunho indica ${GENTA_MG_KG} mg/kg a cada 24 horas.`,
      ],
      conta: {
        formula: 'Dose = mg/kg/dose × peso',
        substituicao: `${GENTA_MG_KG} mg/kg × ${fmt(PESO_KG)} kg`,
        resultado: `${fmt(gentaDose)} mg por dose`,
        rascunho: `Gentamicina: ${GENTA_MG_KG} × ${fmt(PESO_KG)} = ${fmt(gentaDose)} mg/dose`,
      },
      aValidar: `${GENTA_MG_KG} mg/kg de 24/24 h para IG ≥ 35 semanas.`,
      fonte: 'Neofax',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: GENTA_MG_KG,
        unidade: 'mg',
        pesoKg: PESO_KG,
        total: gentaDose,
        rotuloTotal: `${fmt(gentaDose)} mg por dose`,
      },
      linha: { id: 'genta', secao: 'antimicrobianos', texto: gentaTexto },
    },
    {
      id: 'genta-aspirar',
      secao: 'antimicrobianos',
      curto: 'Genta: aspirar',
      titulo: 'Da ampola para a seringa',
      explicacao: [
        `A gentamicina já vem líquida, em ampola. Neste exemplo, a apresentação é de ${GENTA_AMPOLA_MG_ML} mg/mL — não há pó para reconstituir.`,
        `Dividindo a dose pela concentração, o volume é de ${fmt(gentaVolume)} mL. Volumes tão pequenos pedem uma seringa de 1 mL (marcação de 0,01 mL) para medir com precisão.`,
      ],
      conta: {
        formula: 'Volume = dose ÷ concentração',
        substituicao: `${fmt(gentaDose)} mg ÷ ${GENTA_AMPOLA_MG_ML} mg/mL`,
        resultado: `${fmt(gentaVolume)} mL`,
        rascunho: `Aspirar: ${fmt(gentaDose)} ÷ ${GENTA_AMPOLA_MG_ML} = ${fmt(gentaVolume)} mL`,
      },
      dica: 'Existem ampolas de gentamicina de 10, 20 e 40 mg/mL. Leia sempre o rótulo: a mesma dose dá volumes diferentes!',
      aValidar: 'Apresentação de 40 mg/mL — conferir com as apresentações da Santa Casa.',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: { modelo: 'ampola', rotulo: `Gentamicina ${GENTA_AMPOLA_MG_ML} mg/mL`, sublinha: `ampola ${GENTA_AMPOLA_ML} mL`, nivel: GENTA_NIVEL_CHEIO, cor: 'medicacao2' },
          seringa: { capacidadeMl: 1, rotulo: 'Seringa 1 mL', camadas: [] },
        },
        estado: {
          frasco: { modelo: 'ampola', rotulo: `Gentamicina ${GENTA_AMPOLA_MG_ML} mg/mL`, sublinha: `ampola ${GENTA_AMPOLA_ML} mL`, nivel: gentaNivelDepois, cor: 'medicacao2' },
          seringa: {
            capacidadeMl: 1,
            rotulo: 'Seringa 1 mL',
            camadas: [{ volumeMl: gentaVolume, cor: 'medicacao2', rotulo: `Gentamicina ${fmt(gentaVolume)} mL` }],
          },
          fluxos: ['frasco-seringa'],
          balao: `${fmt(gentaVolume)} mL = ${fmt(gentaDose)} mg`,
        },
      },
      linha: { id: 'genta', secao: 'antimicrobianos', texto: gentaTexto, detalhe: gentaPreparo },
    },
    {
      id: 'genta-bic',
      secao: 'antimicrobianos',
      curto: 'Genta: 12 mL',
      titulo: `Fator de correção: ${fmt(gentaVolume)} mL + ${fmt(gentaBic.volumeSF)} mL de SF`,
      explicacao: [
        `Mesma regra da ampicilina: a seringa da BIC precisa terminar com ${VOLUME_FINAL_BIC_ML} mL.`,
        `${VOLUME_FINAL_BIC_ML} − ${fmt(gentaVolume)} = ${fmt(gentaBic.volumeSF)} mL de SF. Repare como a medicação é só uma fatia fininha no fundo da seringa: quase todo o volume é soro. Os ${fmt(gentaDose)} mg ficam distribuídos em ${VOLUME_FINAL_BIC_ML} mL (${fmt(gentaBic.concentracaoFinal)} mg/mL).`,
      ],
      conta: {
        formula: `SF = ${VOLUME_FINAL_BIC_ML} mL − volume da medicação`,
        substituicao: `${VOLUME_FINAL_BIC_ML} − ${fmt(gentaVolume)}`,
        resultado: `${fmt(gentaBic.volumeSF)} mL de SF (total ${VOLUME_FINAL_BIC_ML} mL)`,
        rascunho: `BIC: ${fmt(gentaVolume)} + ${fmt(gentaBic.volumeSF)} SF = ${VOLUME_FINAL_BIC_ML} mL (${fmt(gentaBic.concentracaoFinal)} mg/mL)`,
      },
      dica: 'Este é o exemplo que você trouxe da Santa Casa: 0,3 mL + 11,7 mL = 12 mL.',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          seringa: {
            capacidadeMl: 20,
            rotulo: 'Seringa 20 mL',
            camadas: [{ volumeMl: gentaVolume, cor: 'medicacao2', rotulo: `Gentamicina ${fmt(gentaVolume)} mL` }],
          },
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: false },
        },
        estado: {
          seringa: seringaGentaPronta,
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: true },
          fluxos: ['bolsa-seringa'],
          balao: `${fmt(gentaVolume)} + ${fmt(gentaBic.volumeSF)} = ${VOLUME_FINAL_BIC_ML} mL`,
        },
      },
      linha: { id: 'genta', secao: 'antimicrobianos', texto: gentaTexto, detalhe: gentaBicTexto },
    },
    {
      id: 'genta-vazao',
      secao: 'antimicrobianos',
      curto: 'Genta: BIC',
      titulo: `Gentamicina na bomba: ${GENTA_TEMPO_MIN} minutos`,
      explicacao: [
        `A gentamicina deve correr em ${GENTA_TEMPO_MIN} minutos. Mesma conta: ${VOLUME_FINAL_BIC_ML} mL em meia hora = ${fmt(gentaVazao)} mL/h.`,
        'Cada antibiótico vai na sua própria seringa: a ampicilina e a gentamicina não são misturadas.',
      ],
      conta: {
        formula: 'Vazão = volume ÷ tempo (em horas)',
        substituicao: `${VOLUME_FINAL_BIC_ML} mL ÷ ${fmt(GENTA_TEMPO_MIN / 60)} h`,
        resultado: `${fmt(gentaVazao)} mL/h`,
        rascunho: `Vazão: ${VOLUME_FINAL_BIC_ML} mL em ${GENTA_TEMPO_MIN} min = ${fmt(gentaVazao)} mL/h`,
      },
      aValidar: `Infusão em ${GENTA_TEMPO_MIN} min — conferir no Neofax/bula.`,
      fonte: 'Neofax',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          seringa: seringaGentaPronta,
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC da gentamicina' },
        },
        estado: {
          seringa: seringaGentaPronta,
          bic: { vazaoMlH: gentaVazao, ligada: true, rotulo: 'BIC da gentamicina' },
          fluxos: ['seringa-bic', 'bic-paciente'],
        },
      },
      linha: {
        id: 'genta',
        secao: 'antimicrobianos',
        texto: gentaTexto,
        detalhe: `${gentaBicTexto} · BIC a ${fmt(gentaVazao)} mL/h (${GENTA_TEMPO_MIN} min)`,
      },
    },

    // 6. DEMAIS MEDICAÇÕES ---------------------------------------------------
    {
      id: 'demais',
      secao: 'medicacoes',
      curto: 'Demais',
      titulo: 'Demais medicações',
      explicacao: [
        'Aqui entram antitérmicos, analgésicos, broncodilatadores, corticoides etc. Neste momento o RN não precisa de nenhuma, e a seção fica registrada como "nenhuma no momento".',
        'Pegadinha comum: a dipirona NÃO deve ser usada em menores de 3 meses ou com menos de 5 kg (bula). Se o bebê tiver febre, a equipe deve comunicar o médico (ver orientações).',
      ],
      fonte: 'Bula da dipirona',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'alerta', titulo: 'Dipirona', texto: 'não usar em < 3 meses ou < 5 kg', estado: 'atencao' },
          { icone: 'check', titulo: 'Nenhuma no momento', estado: 'sim' },
        ],
      },
      linha: { id: 'demais', secao: 'medicacoes', texto: 'Nenhuma no momento' },
    },

    // 7. EXAMES --------------------------------------------------------------
    {
      id: 'exames',
      secao: 'exames',
      curto: 'Exames',
      titulo: 'Exames solicitados',
      explicacao: [
        'Na suspeita de sepse neonatal, pedimos exames para ajudar a confirmar a infecção e acompanhar a resposta ao tratamento.',
        'A hemocultura deve ser colhida ANTES da primeira dose de antibiótico, para que o remédio não atrapalhe o crescimento da bactéria no exame.',
      ],
      aValidar: 'Lista de exames do caso didático — conferir com o protocolo de sepse neonatal.',
      fonte: 'SBP',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'hemocultura', titulo: 'Hemocultura', texto: 'antes do 1º antibiótico', estado: 'atencao' },
          { icone: 'tubo', titulo: 'Hemograma completo', estado: 'sim' },
          { icone: 'tubo', titulo: 'PCR', estado: 'sim' },
          { icone: 'glicemia', titulo: 'Glicemia', estado: 'sim' },
        ],
      },
      linha: {
        id: 'exames',
        secao: 'exames',
        texto: 'Hemocultura (colher antes do ATB) · Hemograma completo · PCR · Glicemia',
      },
    },

    // 8. ORIENTAÇÕES ---------------------------------------------------------
    {
      id: 'orientacoes',
      secao: 'cuidados',
      curto: 'Cuidados',
      titulo: 'Orientações e cuidados',
      explicacao: [
        'Esta seção diz à equipe O QUE observar e QUANDO avisar. Boas orientações são específicas: dizem o intervalo e o motivo para chamar o médico.',
        'Como o bebê está em dieta zero recebendo glicose pelo soro, a glicemia capilar e o balanço hídrico são essenciais.',
      ],
      aValidar: 'Intervalos (sinais vitais de 4/4 h, glicemia de 6/6 h) do caso didático — conferir com o protocolo do serviço.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'coracao', titulo: 'Sinais vitais + SpO₂', texto: 'de 4/4 h', estado: 'sim' },
          { icone: 'glicemia', titulo: 'Glicemia capilar', texto: 'de 6/6 h', estado: 'sim' },
          { icone: 'balanca', titulo: 'Balanço hídrico', texto: 'e peso diário', estado: 'sim' },
          { icone: 'alerta', titulo: 'Comunicar', texto: 'febre, hipotermia, apneia, gemência ou má perfusão', estado: 'atencao' },
        ],
      },
      linha: {
        id: 'orientacoes',
        secao: 'cuidados',
        texto: 'SSVV + SpO₂ de 4/4 h · Glicemia capilar de 6/6 h · Balanço hídrico e peso diário',
        detalhe: 'Comunicar: febre, hipotermia, apneia, gemência ou má perfusão',
      },
    },

    // 9. SINAN ---------------------------------------------------------------
    {
      id: 'sinan',
      secao: 'sinan',
      curto: 'SINAN',
      titulo: 'Notificação SINAN',
      explicacao: [
        'Algumas doenças são de notificação compulsória: preenche-se a ficha do SINAN e a vigilância epidemiológica é avisada.',
        'Na neonatologia, exemplos comuns são a sífilis congênita, a toxoplasmose congênita e a criança exposta ao HIV. A sepse neonatal, por si só, não está na lista — então aqui fica "não se aplica".',
      ],
      aValidar: 'Conferir a lista nacional de notificação compulsória vigente.',
      fonte: 'MS',
      cena: {
        tipo: 'cartoes',
        titulo: 'Exemplos que precisam de notificação:',
        cartoes: [
          { icone: 'documento', titulo: 'Sífilis congênita', texto: 'notificar', estado: 'atencao' },
          { icone: 'documento', titulo: 'Toxoplasmose congênita', texto: 'notificar', estado: 'atencao' },
          { icone: 'documento', titulo: 'Criança exposta ao HIV', texto: 'notificar', estado: 'atencao' },
          { icone: 'x', titulo: 'Este caso: sepse', texto: 'não se aplica', estado: 'nao' },
        ],
      },
      linha: { id: 'sinan', secao: 'sinan', texto: 'Não se aplica' },
    },

    // REVISÃO ----------------------------------------------------------------
    {
      id: 'revisao',
      secao: 'revisao',
      curto: 'Revisão',
      titulo: 'Revisão final',
      explicacao: [
        'Pronto! A folha está completa e na ordem certa. Antes de assinar, faça sempre uma última conferência: paciente certo, medicação certa, dose certa, via certa e horário certo.',
        `Repare também: cada seringa de antibiótico tem ${VOLUME_FINAL_BIC_ML} mL, e esse volume entra no bebê junto com o soro. Alguns serviços descontam esse volume do soro de manutenção.`,
      ],
      aValidar: 'Desconto (ou não) do volume das medicações no hídrico total — definir com o serviço.',
      cena: {
        tipo: 'conclusao',
        itens: [
          'Paciente certo — RN de Maria Souza, 3 kg',
          'Medicações certas — ampicilina + gentamicina',
          `Doses certas — ${fmt(ampiDose)} mg e ${fmt(gentaDose)} mg`,
          'Vias certas — EV, em BIC',
          'Horários certos — 12/12 h e 24/24 h',
        ],
      },
    },
  ],
};
