/**
 * Roteiro — Infusão contínua: adrenalina no choque séptico frio.
 * mcg/kg/min → solução padrão → mL/h na bomba, conferência de volta, titulação
 * e duração da seringa.
 *
 * CASO DIDÁTICO. Faixa de dose do docs/fase-0/doses-rascunho.md (PALS) — TUDO "A VALIDAR".
 * A solução padrão (1 mg em 50 mL) e o diluente são exemplo didático: conferir o protocolo do serviço.
 * Os números são calculados pelo motor de cálculo src/calculos/ (o mesmo do Prescrever).
 */
import {
  arredondar,
  concentracao,
  converterMassa,
  dosePorKgDaVazao,
  vazaoMlPorHora,
} from '../../calculos';
import { fmt } from '../../logica/formatacao';
import type { Roteiro } from './tipos';

// ---- Dados do caso ---------------------------------------------------------
const PESO_KG = 20;
const IDADE = '6 anos';
const EXPANSAO_ML_KG = 60; // já recebida antes do roteiro (3 × 20 mL/kg)

// Adrenalina contínua (A VALIDAR — PALS: 0,05 a 1 mcg/kg/min)
const DOSE_INICIAL = 0.1; // mcg/kg/min
const FAIXA_MIN = 0.05;
const FAIXA_MAX = 1;
const AMPOLA_MG_ML = 1; // 1:1.000
// Solução padrão (A VALIDAR — protocolo do serviço): 1 ampola (1 mg) + SF até 50 mL
const AMPOLAS = 1;
const VOLUME_SOLUCAO_ML = 50;
const DOSES_TITULACAO = [0.05, 0.1, 0.2, 0.3, 0.5];

// ---- Contas ----------------------------------------------------------------
const mcgPorMin = DOSE_INICIAL * PESO_KG;
const mcgPorHora = mcgPorMin * 60;
const volumeAdrenalina = AMPOLAS / AMPOLA_MG_ML; // mL de ampola (1 mg/mL)
const sfSolucao = VOLUME_SOLUCAO_ML - volumeAdrenalina;
const mcgNaSeringa = converterMassa(AMPOLAS, 'mg', 'mcg');
const concSolucao = concentracao({ quantidade: mcgNaSeringa, volumeMl: VOLUME_SOLUCAO_ML });
const vazao = arredondar(vazaoMlPorHora({ dosePorKg: DOSE_INICIAL, pesoKg: PESO_KG, concentracao: concSolucao, por: 'min' }), 2);
const doseDeVolta = dosePorKgDaVazao({ vazaoMlPorHora: vazao, concentracao: concSolucao, pesoKg: PESO_KG, por: 'min' });
const vazaoPorDegrau = arredondar(vazaoMlPorHora({ dosePorKg: FAIXA_MIN, pesoKg: PESO_KG, concentracao: concSolucao, por: 'min' }), 2);
const titulacao = DOSES_TITULACAO.map((d) => ({
  dose: d,
  vazao: arredondar(vazaoMlPorHora({ dosePorKg: d, pesoKg: PESO_KG, concentracao: concSolucao, por: 'min' }), 1),
}));
const vazaoNoMaximo = arredondar(vazaoMlPorHora({ dosePorKg: FAIXA_MAX, pesoKg: PESO_KG, concentracao: concSolucao, por: 'min' }), 0);
const duracaoSeringaH = VOLUME_SOLUCAO_ML / vazao;
const exemploVazaoLida = vazao * 1.5;
const exemploDoseLida = dosePorKgDaVazao({ vazaoMlPorHora: exemploVazaoLida, concentracao: concSolucao, pesoKg: PESO_KG, por: 'min' });

// ---- Textos ----------------------------------------------------------------
const mcgKgMin = (d: number) => `${fmt(d, 2)} mcg/kg/min`;
const solucaoTexto = `Adrenalina 1 mg/mL ${fmt(volumeAdrenalina)} mL + SF 0,9% ${fmt(sfSolucao)} mL = ${VOLUME_SOLUCAO_ML} mL (${fmt(concSolucao)} mcg/mL)`;
const adrTexto = `Adrenalina — infusão contínua ${mcgKgMin(DOSE_INICIAL)} EV`;

// ---- Desenhos ----------------------------------------------------------------
const ampola = { modelo: 'ampola' as const, rotulo: 'Adrenalina 1 mg/mL', sublinha: '1:1.000 · ampola 1 mL', nivel: 0.85, cor: 'adrenalina' as const };
const seringaSolucao = {
  capacidadeMl: 60,
  rotulo: `Seringa 60 mL — ${fmt(concSolucao)} mcg/mL`,
  camadas: [{ volumeMl: VOLUME_SOLUCAO_ML, cor: 'mistura' as const, rotulo: `${fmt(concSolucao)} mcg/mL` }],
};

export const roteiroInfusaoContinuaAdrenalina: Roteiro = {
  id: 'infusao-continua-adrenalina',
  tema: 'Preparo: diluição, BIC e infusão',
  titulo: 'Infusão contínua — adrenalina no choque',
  resumo: 'mcg/kg/min → solução padrão → mL/h na bomba; conferir de volta, titular e saber quanto dura a seringa.',
  paciente: {
    nome: 'Pedro',
    descricao: `${IDADE}, ${fmt(PESO_KG)} kg, choque séptico após ${EXPANSAO_ML_KG} mL/kg de SF`,
  },
  etapas: [
    // 1. IDENTIFICAÇÃO -------------------------------------------------------
    {
      id: 'identificacao',
      secao: 'identificacao',
      curto: 'Paciente',
      titulo: 'Quem é o paciente?',
      explicacao: [
        `Pedro, ${IDADE}, ${fmt(PESO_KG)} kg, com febre, extremidades frias, pulsos finos e tempo de enchimento capilar de 5 segundos. Já recebeu ${EXPANSAO_ML_KG} mL/kg de soro fisiológico e o antibiótico.`,
        'Mesmo assim continua em choque: é choque refratário a volume. A próxima medicação é um vasoativo em INFUSÃO CONTÍNUA — aqui, a adrenalina.',
      ],
      aValidar: 'Conduta do caso didático (escolha do vasoativo, momento de iniciar).',
      fonte: 'PALS / Surviving Sepsis Pediátrico',
      cena: {
        tipo: 'paciente',
        perfil: 'crianca',
        pesoKg: PESO_KG,
        rotulos: [
          { rotulo: 'Idade', valor: IDADE },
          { rotulo: 'Peso', valor: `${fmt(PESO_KG)} kg` },
          { rotulo: 'Perfusão', valor: 'TEC 5 s · extremidades frias' },
          { rotulo: 'Já recebeu', valor: `SF ${EXPANSAO_ML_KG} mL/kg + antibiótico` },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: `Pedro · ${IDADE} · Peso ${fmt(PESO_KG)} kg`, detalhe: `Sala de emergência · Choque séptico frio refratário a volume (recebeu ${EXPANSAO_ML_KG} mL/kg de SF)` },
    },
    {
      id: 'por-que-continua',
      secao: 'medicacoes',
      curto: 'Contínua?',
      titulo: 'Por que "infusão contínua"?',
      explicacao: [
        'A adrenalina age por poucos minutos: se fosse dada uma vez só, o efeito sumiria logo. Por isso ela corre sem parar na bomba, e a dose é dada por MINUTO.',
        `A dose de infusão contínua tem três partes: quanto (mcg), por quilo (kg) e por quanto tempo (min). Ex.: ${mcgKgMin(DOSE_INICIAL)}.`,
      ],
      dica: 'Atenção às unidades: infusão contínua costuma vir em MICROgramas (mcg), e a ampola em MILIgramas (mg). 1 mg = 1.000 mcg.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'seringa', titulo: 'Bolus', texto: 'dose única (ex.: PCR)', estado: 'nao' },
          { icone: 'relogio', titulo: 'Contínua', texto: 'corre sem parar na BIC', estado: 'sim' },
          { icone: 'balanca', titulo: 'mcg / kg', texto: 'quanto por quilo', estado: 'sim' },
          { icone: 'relogio', titulo: '/ min', texto: 'a cada minuto', estado: 'sim' },
        ],
      },
    },
    {
      id: 'dose-faixa',
      secao: 'medicacoes',
      curto: 'Dose',
      titulo: 'Qual dose começar?',
      explicacao: [
        `A faixa de dose da adrenalina contínua vai de ${mcgKgMin(FAIXA_MIN)} a ${mcgKgMin(FAIXA_MAX)}. Começa-se baixo e sobe-se aos poucos (titula), olhando a perfusão e a pressão.`,
        `Para o Pedro, vamos começar com ${mcgKgMin(DOSE_INICIAL)}.`,
      ],
      aValidar: `Faixa de ${mcgKgMin(FAIXA_MIN)} a ${mcgKgMin(FAIXA_MAX)} e dose inicial de ${mcgKgMin(DOSE_INICIAL)}.`,
      fonte: 'PALS',
      cena: {
        tipo: 'regua',
        reguas: [
          {
            titulo: 'Adrenalina contínua',
            unidade: 'mcg/kg/min',
            minimo: 0,
            maximo: 1.2,
            faixas: [
              { ate: FAIXA_MIN, rotulo: `abaixo da faixa (< ${fmt(FAIXA_MIN)})`, tom: 'info' },
              { ate: FAIXA_MAX, rotulo: `faixa usual (${fmt(FAIXA_MIN)} a ${fmt(FAIXA_MAX)})`, tom: 'normal' },
              { ate: 1.2, rotulo: 'acima da faixa', tom: 'perigo' },
            ],
            valor: DOSE_INICIAL,
            rotuloValor: 'dose inicial do Pedro',
          },
        ],
      },
      linha: { id: 'adr', secao: 'medicacoes', texto: adrTexto, detalhe: `Titular de ${fmt(FAIXA_MIN)} em ${fmt(FAIXA_MIN)} até ${mcgKgMin(FAIXA_MAX)} conforme perfusão e PA` },
    },
    {
      id: 'mcg-por-minuto',
      secao: 'medicacoes',
      curto: 'mcg/min',
      titulo: 'Quantos mcg por minuto? E por hora?',
      explicacao: [
        `Primeiro tiramos o "por kg": ${fmt(DOSE_INICIAL)} mcg para cada kg, e o Pedro tem ${fmt(PESO_KG)} kg.`,
        'Depois passamos de minuto para hora (a bomba trabalha em mL por HORA): uma hora tem 60 minutos.',
      ],
      conta: {
        formula: 'mcg/min = dose × peso · mcg/h = mcg/min × 60',
        substituicao: `${fmt(DOSE_INICIAL)} mcg/kg/min × ${fmt(PESO_KG)} kg = ${fmt(mcgPorMin)} mcg/min`,
        passos: [`${fmt(mcgPorMin)} mcg/min × 60 min`],
        resultado: `${fmt(mcgPorHora)} mcg por hora`,
        rascunho: `${fmt(DOSE_INICIAL)} × ${fmt(PESO_KG)} = ${fmt(mcgPorMin)} mcg/min × 60 = ${fmt(mcgPorHora)} mcg/h`,
      },
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: DOSE_INICIAL,
        unidade: 'mcg/min',
        pesoKg: PESO_KG,
        total: mcgPorMin,
        rotuloTotal: `${fmt(mcgPorMin)} mcg por minuto = ${fmt(mcgPorHora)} mcg por hora`,
      },
    },
    {
      id: 'solucao',
      secao: 'medicacoes',
      curto: 'Solução',
      titulo: 'Preparar a solução da seringa',
      explicacao: [
        `Uma solução padrão: ${AMPOLAS} ampola de adrenalina (${fmt(AMPOLAS)} mg = ${fmt(mcgNaSeringa)} mcg) completada com SF 0,9% até ${VOLUME_SOLUCAO_ML} mL, numa seringa de 60 mL.`,
        `Concentração: ${fmt(mcgNaSeringa)} mcg ÷ ${VOLUME_SOLUCAO_ML} mL = ${fmt(concSolucao)} mcg/mL. É com ESSE número (em mcg/mL, mesma unidade da dose) que a vazão é calculada.`,
      ],
      conta: {
        formula: 'Concentração = quantidade (mcg) ÷ volume (mL)',
        substituicao: `${fmt(AMPOLAS)} mg = ${fmt(mcgNaSeringa)} mcg`,
        passos: [`${fmt(mcgNaSeringa)} mcg ÷ ${VOLUME_SOLUCAO_ML} mL`],
        resultado: `${fmt(concSolucao)} mcg/mL (${fmt(volumeAdrenalina)} mL + ${fmt(sfSolucao)} mL de SF)`,
        rascunho: `Solução: ${fmt(mcgNaSeringa)} mcg ÷ ${VOLUME_SOLUCAO_ML} mL = ${fmt(concSolucao)} mcg/mL`,
      },
      dica: 'Muitos serviços têm soluções padronizadas (sempre a mesma concentração para todos os pacientes, e só a vazão muda). Isso diminui erro. Use a do seu hospital.',
      aValidar: `Solução padrão (${fmt(AMPOLAS)} mg em ${VOLUME_SOLUCAO_ML} mL) e diluente (SF 0,9% ou SG 5%) — conferir no protocolo do serviço.`,
      fonte: 'Protocolo do serviço',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          frasco: ampola,
          seringa: { capacidadeMl: 60, rotulo: 'Seringa 60 mL', camadas: [] },
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: false },
        },
        estado: {
          frasco: { ...ampola, nivel: 0 },
          seringa: {
            capacidadeMl: 60,
            rotulo: 'Seringa 60 mL',
            camadas: [
              { volumeMl: volumeAdrenalina, cor: 'adrenalina', rotulo: `Adrenalina ${fmt(volumeAdrenalina)} mL` },
              { volumeMl: sfSolucao, cor: 'sf', rotulo: `SF 0,9% ${fmt(sfSolucao)} mL` },
            ],
          },
          bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: true },
          fluxos: ['frasco-seringa', 'bolsa-seringa'],
          balao: `${fmt(mcgNaSeringa)} mcg em ${VOLUME_SOLUCAO_ML} mL = ${fmt(concSolucao)} mcg/mL`,
        },
      },
      linha: { id: 'adr', secao: 'medicacoes', texto: adrTexto, detalhe: `Solução: ${solucaoTexto}` },
    },
    {
      id: 'vazao',
      secao: 'medicacoes',
      curto: 'mL/h',
      titulo: 'Quantos mL por hora na bomba?',
      explicacao: [
        `O Pedro precisa de ${fmt(mcgPorHora)} mcg por hora, e cada mL da seringa tem ${fmt(concSolucao)} mcg. Quantos mL por hora levam ${fmt(mcgPorHora)} mcg?`,
        'Tudo numa fórmula só: dose × peso × 60 ÷ concentração.',
      ],
      conta: {
        formula: 'mL/h = dose (mcg/kg/min) × peso × 60 ÷ concentração (mcg/mL)',
        substituicao: `${fmt(DOSE_INICIAL)} × ${fmt(PESO_KG)} × 60 ÷ ${fmt(concSolucao)}`,
        passos: [`${fmt(mcgPorHora)} mcg/h ÷ ${fmt(concSolucao)} mcg/mL`],
        resultado: `${fmt(vazao)} mL/h`,
        rascunho: `Vazão: ${fmt(DOSE_INICIAL)} × ${fmt(PESO_KG)} × 60 ÷ ${fmt(concSolucao)} = ${fmt(vazao)} mL/h`,
      },
      dica: 'Se a dose for por HORA (ex.: insulina em UI/kg/h na cetoacidose), não se multiplica por 60: mL/h = dose × peso ÷ concentração.',
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          seringa: seringaSolucao,
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC da adrenalina' },
        },
        estado: {
          seringa: seringaSolucao,
          bic: { vazaoMlH: vazao, ligada: true, rotulo: 'BIC da adrenalina' },
          fluxos: ['seringa-bic', 'bic-paciente'],
          balao: `${mcgKgMin(DOSE_INICIAL)} = ${fmt(vazao)} mL/h`,
        },
      },
      linha: { id: 'adr', secao: 'medicacoes', texto: adrTexto, detalhe: `Solução: ${solucaoTexto} · BIC ${fmt(vazao)} mL/h` },
    },
    {
      id: 'conferir',
      secao: 'medicacoes',
      curto: 'Conferir',
      titulo: 'Conferir de trás para frente',
      explicacao: [
        `Antes de ligar, faça a conta ao contrário: a bomba a ${fmt(vazao)} mL/h, com ${fmt(concSolucao)} mcg/mL, num paciente de ${fmt(PESO_KG)} kg, dá quantos mcg/kg/min?`,
        `Se der a dose prescrita (${mcgKgMin(DOSE_INICIAL)}), a conta está certa. Essa mesma conta serve na passagem de plantão: você chega, lê a bomba (ex.: ${fmt(exemploVazaoLida)} mL/h) e descobre a dose (${mcgKgMin(exemploDoseLida)}).`,
      ],
      conta: {
        formula: 'mcg/kg/min = mL/h × concentração ÷ (peso × 60)',
        substituicao: `${fmt(vazao)} × ${fmt(concSolucao)} ÷ (${fmt(PESO_KG)} × 60)`,
        passos: [`${fmt(vazao * concSolucao)} ÷ ${fmt(PESO_KG * 60)}`],
        resultado: `${mcgKgMin(doseDeVolta)} ✓ igual à prescrita`,
        rascunho: `Conferência: ${fmt(vazao)} × ${fmt(concSolucao)} ÷ (${fmt(PESO_KG)} × 60) = ${mcgKgMin(doseDeVolta)} ✓`,
      },
      cena: {
        tipo: 'bancada',
        estado: {
          seringa: seringaSolucao,
          bic: { vazaoMlH: vazao, ligada: true, rotulo: 'BIC da adrenalina' },
          fluxos: ['seringa-bic', 'bic-paciente'],
          balao: `${fmt(vazao)} mL/h → ${mcgKgMin(doseDeVolta)} ✓`,
        },
      },
    },
    {
      id: 'titular',
      secao: 'medicacoes',
      curto: 'Titular',
      titulo: 'Subir ou descer a dose (titulação)',
      explicacao: [
        `Com a solução padrão, cada ${mcgKgMin(FAIXA_MIN)} vale ${fmt(vazaoPorDegrau)} mL/h para o Pedro. Subir de ${fmt(DOSE_INICIAL)} para 0,2 é ir de ${fmt(vazao)} para ${fmt(titulacao.find((t) => t.dose === 0.2)?.vazao ?? 0)} mL/h.`,
        `Na dose máxima da faixa (${mcgKgMin(FAIXA_MAX)}), seriam ${fmt(vazaoNoMaximo)} mL/h — muito líquido para uma criança de ${fmt(PESO_KG)} kg. Por isso, em doses altas, os serviços usam soluções mais concentradas.`,
      ],
      conta: {
        formula: 'Cada degrau de dose = mesma conta da vazão',
        substituicao: `${fmt(FAIXA_MIN)} × ${fmt(PESO_KG)} × 60 ÷ ${fmt(concSolucao)} = ${fmt(vazaoPorDegrau)} mL/h`,
        resultado: `Cada ${fmt(FAIXA_MIN)} mcg/kg/min = ${fmt(vazaoPorDegrau)} mL/h`,
        rascunho: `Titulação: cada ${fmt(FAIXA_MIN)} mcg/kg/min = ${fmt(vazaoPorDegrau)} mL/h`,
      },
      aValidar: 'Quando e como concentrar a solução para doses altas — protocolo do serviço.',
      fonte: 'Protocolo do serviço',
      cena: {
        tipo: 'barras',
        titulo: `Vazão para cada dose (solução de ${fmt(concSolucao)} mcg/mL, ${fmt(PESO_KG)} kg)`,
        unidade: 'mL/h',
        casas: 1,
        barras: titulacao.map((t) => ({
          rotulo: mcgKgMin(t.dose),
          valor: t.vazao,
          tom: t.dose === DOSE_INICIAL ? ('normal' as const) : ('info' as const),
          detalhe: t.dose === DOSE_INICIAL ? 'dose inicial' : undefined,
        })),
      },
      linha: {
        id: 'adr',
        secao: 'medicacoes',
        texto: adrTexto,
        detalhe: `Solução: ${solucaoTexto} · BIC ${fmt(vazao)} mL/h · cada ${fmt(FAIXA_MIN)} mcg/kg/min = ${fmt(vazaoPorDegrau)} mL/h`,
      },
    },
    {
      id: 'duracao',
      secao: 'medicacoes',
      curto: 'Dura quanto?',
      titulo: 'Quanto tempo dura a seringa?',
      explicacao: [
        `${VOLUME_SOLUCAO_ML} mL a ${fmt(vazao)} mL/h duram cerca de ${fmt(duracaoSeringaH, 1)} horas.`,
        'A próxima seringa tem de estar pronta ANTES de esta acabar: interromper a adrenalina, mesmo por poucos minutos, pode derrubar a pressão.',
      ],
      conta: {
        formula: 'Duração = volume da seringa ÷ vazão',
        substituicao: `${VOLUME_SOLUCAO_ML} mL ÷ ${fmt(vazao)} mL/h`,
        resultado: `≈ ${fmt(duracaoSeringaH, 1)} horas`,
        rascunho: `Duração: ${VOLUME_SOLUCAO_ML} ÷ ${fmt(vazao)} ≈ ${fmt(duracaoSeringaH, 1)} h`,
      },
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'relogio', titulo: `≈ ${fmt(duracaoSeringaH, 1)} h`, texto: `com ${fmt(vazao)} mL/h`, estado: 'sim' },
          { icone: 'seringa', titulo: 'Próxima seringa', texto: 'pronta antes de acabar', estado: 'atencao' },
          { icone: 'alerta', titulo: 'Se a dose subir', texto: 'a seringa acaba mais cedo', estado: 'atencao' },
        ],
      },
    },

    // 7. EXAMES ----------------------------------------------------------------
    {
      id: 'exames',
      secao: 'exames',
      curto: 'Exames',
      titulo: 'Exames solicitados',
      explicacao: ['No choque, os exames ajudam a ver se a perfusão está melhorando (lactato) e a achar o que piora o coração (glicose, cálcio, potássio, acidose).'],
      aValidar: 'Lista de exames do caso didático.',
      fonte: 'PALS / Surviving Sepsis Pediátrico',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'tubo', titulo: 'Gasometria + lactato', texto: 'repetir', estado: 'atencao' },
          { icone: 'glicemia', titulo: 'Glicemia', estado: 'sim' },
          { icone: 'tubo', titulo: 'Na, K, Ca iônico', estado: 'sim' },
          { icone: 'hemocultura', titulo: 'Hemocultura', texto: 'já colhida', estado: 'sim' },
        ],
      },
      linha: { id: 'exames', secao: 'exames', texto: 'Gasometria arterial + lactato (repetir) · Glicemia · Na · K · Cálcio iônico · Hemograma · Hemocultura (já colhida)' },
    },

    // 8. CUIDADOS ----------------------------------------------------------------
    {
      id: 'cuidados',
      secao: 'cuidados',
      curto: 'Cuidados',
      titulo: 'Orientações e cuidados',
      explicacao: [
        'Via EXCLUSIVA: nada de bolus ou "flush" pela mesma via — o líquido empurra de uma vez a adrenalina que estava no equipo.',
        'De preferência em acesso central; em veia periférica, vigiar a pele (a adrenalina que vaza pode necrosar). Monitor e pressão arterial contínuos.',
      ],
      aValidar: 'Cuidados com vasoativo (via, acesso) — conferir com o protocolo do serviço.',
      fonte: 'Protocolo do serviço',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'x', titulo: 'Via exclusiva', texto: 'sem bolus na mesma via', estado: 'atencao' },
          { icone: 'seringa', titulo: 'Acesso', texto: 'central de preferência', estado: 'sim' },
          { icone: 'coracao', titulo: 'Monitor + PA', texto: 'contínuos', estado: 'sim' },
          { icone: 'relogio', titulo: 'Troca de seringa', texto: 'sem interromper', estado: 'atencao' },
        ],
      },
      linha: {
        id: 'cuidados',
        secao: 'cuidados',
        texto: 'Monitorização contínua (ECG, SpO₂, PA) · Via exclusiva para a adrenalina · Preparar a seringa seguinte antes de acabar · Diurese horária',
        detalhe: 'Comunicar: piora da perfusão, arritmia, extravasamento no acesso',
      },
    },

    // REVISÃO --------------------------------------------------------------------
    {
      id: 'revisao',
      secao: 'revisao',
      curto: 'Revisão',
      titulo: 'Revisão final',
      explicacao: ['Em toda infusão contínua, deixe escritos na folha: a dose (mcg/kg/min), a solução (quanto de droga em quanto volume) e a vazão (mL/h). Quem chega no plantão precisa conseguir refazer a conta.'],
      cena: {
        tipo: 'conclusao',
        itens: [
          `Dose — ${mcgKgMin(DOSE_INICIAL)} (faixa ${fmt(FAIXA_MIN)} a ${fmt(FAIXA_MAX)})`,
          `Solução — ${fmt(AMPOLAS)} mg em ${VOLUME_SOLUCAO_ML} mL = ${fmt(concSolucao)} mcg/mL`,
          `Vazão — ${fmt(vazao)} mL/h (conferida de volta ✓)`,
          `Titulação — cada ${fmt(FAIXA_MIN)} = ${fmt(vazaoPorDegrau)} mL/h`,
          `Seringa — dura ≈ ${fmt(duracaoSeringaH, 1)} h · via exclusiva`,
        ],
      },
    },
  ],
};
