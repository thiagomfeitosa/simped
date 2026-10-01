/**
 * Roteiro — Icterícia neonatal (hiperbilirrubinemia indireta) com indicação de fototerapia:
 * zonas de Kramer, bilirrubina transcutânea e sérica, horas de vida, perda de peso,
 * comparação com o limiar de fototerapia e prescrição completa.
 *
 * CASO DIDÁTICO. Limiares, faixas e condutas estão TODOS "A VALIDAR" até o usuário
 * conferir nas fontes (SBP — Icterícia no RN ≥ 35 semanas; AAP 2022).
 * Os números são calculados pelas funções de o motor de cálculo src/calculos/ (o mesmo do Prescrever) (não digitados à mão).
 */
import {
  arredondar,
  horasDeVida,
  percentualPerdaPeso,
} from '../../calculos';
import { fmt } from '../../logica/formatacao';
import type { Roteiro } from './tipos';

// ---- Dados do caso ---------------------------------------------------------
const IG_SEMANAS = 39;
const DIAS_DE_VIDA = 2;
const HORAS_ALEM_DOS_DIAS = 0;
const PESO_NASCIMENTO_G = 3200;
const PESO_ATUAL_G = 2944;
const BT_TRANSCUTANEA = 16.4;
const BT_SERICA = 17;
const BD_SERICA = 0.6;

// Limiares para 48 h de vida, IG ≥ 38 semanas, sem fatores de risco (A VALIDAR — SBP)
const HORAS_DO_LIMIAR = 48;
const LIMIAR_FOTOTERAPIA = 13;
const LIMIAR_EXSANGUINEO = 21;

// Faixas aproximadas de bilirrubina por zona de Kramer (A VALIDAR — Kramer 1969, citado pela SBP)
const FAIXAS_KRAMER = ['4 a 8 mg/dL', '5 a 12 mg/dL', '8 a 16 mg/dL', '11 a 18 mg/dL', '> 15 mg/dL'];

// Perda de peso (A VALIDAR — SBP / ABM)
const PERDA_ESPERADA_ATE = 7;
const PERDA_EXCESSIVA_ACIMA = 10;

// ---- Contas ----------------------------------------------------------------
const horas = horasDeVida(DIAS_DE_VIDA, HORAS_ALEM_DOS_DIAS);
const perdaG = PESO_NASCIMENTO_G - PESO_ATUAL_G;
const perdaPct = percentualPerdaPeso(PESO_NASCIMENTO_G, PESO_ATUAL_G);
const acimaDaFoto = arredondar(BT_SERICA - LIMIAR_FOTOTERAPIA, 1);
const abaixoDaExsanguineo = arredondar(LIMIAR_EXSANGUINEO - BT_SERICA, 1);
const btIndireta = arredondar(BT_SERICA - BD_SERICA, 1);

// ---- Textos da folha ---------------------------------------------------------
const idTexto = (idade: string) => `RN de Carla Lima · ${idade} · IG ${IG_SEMANAS} sem · PN ${fmt(PESO_NASCIMENTO_G)} g · Peso atual ${fmt(PESO_ATUAL_G)} g`;
const idDiagnostico = `Hiperbilirrubinemia indireta: BT ${fmt(BT_SERICA, 1)} mg/dL (BD ${fmt(BD_SERICA, 1)}) com ${horas} h de vida · Alojamento conjunto`;

export const roteiroIctericiaNeonatal: Roteiro = {
  id: 'ictericia-neonatal',
  tema: 'Neonatologia',
  titulo: 'Icterícia neonatal — fototerapia',
  resumo: 'Zonas de Kramer, bilirrubinômetro, horas de vida, limiar de fototerapia e prescrição completa.',
  paciente: {
    nome: 'RN de Carla Lima',
    descricao: `Termo (${IG_SEMANAS} sem), ${horas} h de vida, icterícia`,
  },
  etapas: [
    // 1. IDENTIFICAÇÃO -------------------------------------------------------
    {
      id: 'identificacao',
      secao: 'identificacao',
      curto: 'Paciente',
      titulo: 'Quem é o paciente?',
      explicacao: [
        `RN a termo (${IG_SEMANAS} semanas), no 2º dia de vida, em aleitamento materno exclusivo no alojamento conjunto. A enfermagem notou a pele bem amarelada.`,
        'Na icterícia, além do peso, dois dados mudam tudo: a idade gestacional e a idade em HORAS de vida.',
      ],
      cena: {
        tipo: 'paciente',
        perfil: 'rn',
        pesoKg: PESO_ATUAL_G / 1000,
        rotulos: [
          { rotulo: 'Idade gestacional', valor: `${IG_SEMANAS} semanas (termo)` },
          { rotulo: 'Idade', valor: '2º dia de vida' },
          { rotulo: 'Peso', valor: `nasceu com ${fmt(PESO_NASCIMENTO_G)} g · hoje ${fmt(PESO_ATUAL_G)} g` },
          { rotulo: 'Alimentação', valor: 'seio materno exclusivo' },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto('2º dia de vida'), detalhe: 'Alojamento conjunto' },
    },
    {
      id: 'kramer',
      secao: 'identificacao',
      curto: 'Kramer',
      titulo: 'Até onde vai o amarelo? (zonas de Kramer)',
      explicacao: [
        'A icterícia aparece primeiro no rosto e vai "descendo" pelo corpo conforme a bilirrubina sobe. Kramer dividiu o corpo em 5 zonas.',
        'Aqui o amarelo chega até as pernas abaixo dos joelhos (zona 4). Isso sugere bilirrubina alta — mas o olho engana (luz do quarto, cor da pele). A zona serve de alerta; o número vem da medida.',
      ],
      aValidar: 'Faixas de bilirrubina de cada zona de Kramer.',
      fonte: 'Kramer (1969) / SBP — Icterícia no RN ≥ 35 semanas',
      cena: { tipo: 'ictericia', zona: 4, tabelaZonas: FAIXAS_KRAMER },
    },
    {
      id: 'medir',
      secao: 'identificacao',
      curto: 'Medir BT',
      titulo: 'Medindo a bilirrubina',
      explicacao: [
        `O bilirrubinômetro transcutâneo (BTc) mede pela pele, sem picar, encostado na testa (glabela) ou no esterno. Ele mostrou ${fmt(BT_TRANSCUTANEA, 1)} mg/dL — valor alto, que precisa ser confirmado no sangue.`,
        `Bilirrubina sérica: total (BT) ${fmt(BT_SERICA, 1)} mg/dL, direta (BD) ${fmt(BD_SERICA, 1)}. Quase toda é INDIRETA (${fmt(btIndireta, 1)} mg/dL) — é essa que a fototerapia trata.`,
      ],
      aValidar: 'Quando confirmar a BTc com a bilirrubina sérica.',
      fonte: 'SBP — Icterícia no RN ≥ 35 semanas',
      cena: { tipo: 'ictericia', zona: 4, bilirrubinometro: { local: 'esterno', valor: BT_TRANSCUTANEA } },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto('2º dia de vida'), detalhe: `BTc ${fmt(BT_TRANSCUTANEA, 1)} · BT ${fmt(BT_SERICA, 1)} mg/dL (BD ${fmt(BD_SERICA, 1)}) · Alojamento conjunto` },
    },
    {
      id: 'horas',
      secao: 'identificacao',
      curto: 'Horas de vida',
      titulo: 'Quantas HORAS de vida?',
      explicacao: [
        'As tabelas de icterícia usam horas, não dias: a mesma bilirrubina pode ser tranquila com 96 h e perigosa com 24 h, porque o normal sobe ao longo dos primeiros dias.',
        'O bebê nasceu anteontem às 10 h; agora são 10 h. Então são 2 dias completos.',
      ],
      conta: {
        formula: 'Horas de vida = dias completos × 24 + horas',
        substituicao: `${DIAS_DE_VIDA} × 24 + ${HORAS_ALEM_DOS_DIAS}`,
        resultado: `${horas} horas de vida`,
        rascunho: `Horas de vida: ${DIAS_DE_VIDA} × 24 + ${HORAS_ALEM_DOS_DIAS} = ${horas} h`,
      },
      dica: 'Anote a hora do nascimento na folha. "2º dia de vida" pode significar de 24 a 47 horas — a diferença muda a conduta.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'berco', titulo: 'Nasceu', texto: 'anteontem, 10 h', estado: 'sim' },
          { icone: 'relogio', titulo: 'Agora', texto: 'hoje, 10 h', estado: 'sim' },
          { icone: 'check', titulo: `${horas} h de vida`, texto: 'use na tabela', estado: 'atencao' },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto(`${horas} h de vida`), detalhe: `BTc ${fmt(BT_TRANSCUTANEA, 1)} · BT ${fmt(BT_SERICA, 1)} mg/dL (BD ${fmt(BD_SERICA, 1)}) · Alojamento conjunto` },
    },
    {
      id: 'indicacao',
      secao: 'identificacao',
      curto: 'Fototerapia?',
      titulo: 'Precisa de fototerapia?',
      explicacao: [
        `Compara-se a BT com o LIMIAR da tabela para a idade em horas (${HORAS_DO_LIMIAR} h) e a idade gestacional (≥ 38 semanas). Acima do limiar de fototerapia: indica fototerapia. Acima do limiar de exsanguineotransfusão: preparar a troca de sangue.`,
        `BT ${fmt(BT_SERICA, 1)} está ${fmt(acimaDaFoto, 1)} mg/dL ACIMA do limiar de fototerapia e ${fmt(abaixoDaExsanguineo, 1)} mg/dL ABAIXO do de exsanguineotransfusão.`,
      ],
      conta: {
        formula: 'Distância = BT do paciente − limiar da tabela (mesmas horas de vida e IG)',
        substituicao: `Fototerapia (${HORAS_DO_LIMIAR} h, ≥ 38 sem): ${fmt(BT_SERICA, 1)} − ${LIMIAR_FOTOTERAPIA} = +${fmt(acimaDaFoto, 1)} mg/dL`,
        passos: [`Exsanguineotransfusão (${HORAS_DO_LIMIAR} h): ${fmt(BT_SERICA, 1)} − ${LIMIAR_EXSANGUINEO} = −${fmt(abaixoDaExsanguineo, 1)} mg/dL`],
        resultado: 'Indica FOTOTERAPIA (sem indicação de exsanguineotransfusão)',
        rascunho: `BT ${fmt(BT_SERICA, 1)} − limiar ${LIMIAR_FOTOTERAPIA} = +${fmt(acimaDaFoto, 1)} → fototerapia; ${fmt(abaixoDaExsanguineo, 1)} abaixo da EST`,
      },
      dica: 'Fatores de risco (doença hemolítica, deficiência de G6PD, asfixia, sepse, acidose, albumina baixa) BAIXAM os limiares. A AAP 2022 usa curvas próprias, com valores diferentes — o programa vai permitir escolher a fonte.',
      aValidar: `Limiares para ${HORAS_DO_LIMIAR} h e IG ≥ 38 semanas sem fatores de risco: fototerapia ${LIMIAR_FOTOTERAPIA} mg/dL e exsanguineotransfusão ${LIMIAR_EXSANGUINEO} mg/dL.`,
      fonte: 'SBP — Icterícia no RN ≥ 35 semanas (tabela por horas de vida)',
      linhaDaConta: 'fototerapia',
      cena: {
        tipo: 'regua',
        reguas: [
          {
            titulo: `Bilirrubina total com ${HORAS_DO_LIMIAR} h de vida (IG ≥ 38 sem)`,
            unidade: 'mg/dL',
            minimo: 0,
            maximo: 25,
            faixas: [
              { ate: LIMIAR_FOTOTERAPIA, rotulo: `Abaixo do limiar (< ${LIMIAR_FOTOTERAPIA}): observar`, tom: 'normal' },
              { ate: LIMIAR_EXSANGUINEO, rotulo: `Fototerapia (${LIMIAR_FOTOTERAPIA} a ${LIMIAR_EXSANGUINEO})`, tom: 'atencao' },
              { ate: 25, rotulo: `Exsanguineotransfusão (≥ ${LIMIAR_EXSANGUINEO})`, tom: 'perigo' },
            ],
            valor: BT_SERICA,
            rotuloValor: 'BT do RN',
            marcos: [
              { valor: LIMIAR_FOTOTERAPIA, rotulo: `fototerapia ${LIMIAR_FOTOTERAPIA}` },
              { valor: LIMIAR_EXSANGUINEO, rotulo: `EST ${LIMIAR_EXSANGUINEO}` },
            ],
          },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto(`${horas} h de vida`), detalhe: idDiagnostico },
    },

    // 3. DIETA ---------------------------------------------------------------
    {
      id: 'perda-peso',
      secao: 'dieta',
      curto: 'Perda de peso',
      titulo: 'O bebê está mamando o suficiente?',
      explicacao: [
        'Pouco leite = intestino mais lento = mais bilirrubina reabsorvida. Por isso a perda de peso entra na avaliação da icterícia.',
        `Perder algum peso nos primeiros dias é esperado. Mais de ${PERDA_ESPERADA_ATE}% acende o alerta para a amamentação; mais de ${PERDA_EXCESSIVA_ACIMA}% é excessivo.`,
      ],
      conta: {
        formula: 'Perda (%) = (peso de nascimento − peso atual) ÷ peso de nascimento × 100',
        substituicao: `(${fmt(PESO_NASCIMENTO_G)} − ${fmt(PESO_ATUAL_G)}) ÷ ${fmt(PESO_NASCIMENTO_G)} × 100`,
        passos: [`${fmt(perdaG)} ÷ ${fmt(PESO_NASCIMENTO_G)} × 100`],
        resultado: `${fmt(perdaPct, 1)}% — atenção: avaliar a amamentação`,
        rascunho: `Perda de peso: ${fmt(perdaG)} ÷ ${fmt(PESO_NASCIMENTO_G)} × 100 = ${fmt(perdaPct, 1)}%`,
      },
      aValidar: `Faixas de perda de peso (até ${PERDA_ESPERADA_ATE}% esperada; > ${PERDA_EXCESSIVA_ACIMA}% excessiva).`,
      fonte: 'SBP / Academy of Breastfeeding Medicine',
      cena: {
        tipo: 'regua',
        reguas: [
          {
            titulo: 'Perda de peso desde o nascimento',
            unidade: '%',
            minimo: 0,
            maximo: 15,
            faixas: [
              { ate: PERDA_ESPERADA_ATE, rotulo: `Esperada (até ${PERDA_ESPERADA_ATE}%)`, tom: 'normal' },
              { ate: PERDA_EXCESSIVA_ACIMA, rotulo: `Atenção: avaliar a amamentação (${PERDA_ESPERADA_ATE} a ${PERDA_EXCESSIVA_ACIMA}%)`, tom: 'atencao' },
              { ate: 15, rotulo: `Excessiva (> ${PERDA_EXCESSIVA_ACIMA}%)`, tom: 'perigo' },
            ],
            valor: perdaPct,
            rotuloValor: 'RN',
          },
        ],
      },
      linha: { id: 'dieta', secao: 'dieta', texto: 'Seio materno em livre demanda' },
    },
    {
      id: 'dieta',
      secao: 'dieta',
      curto: 'Dieta',
      titulo: 'Dieta: NÃO suspender a amamentação',
      explicacao: [
        'Pegadinha clássica: a fototerapia NÃO é motivo para parar de amamentar. Ao contrário — mamar bem ajuda a eliminar a bilirrubina.',
        'O bebê sai da luz só pelo tempo da mamada, no mínimo 8 a 12 vezes por dia. Com a perda de peso de 8%, avaliar a pega e a sucção; complemento só se houver indicação.',
      ],
      aValidar: 'Frequência mínima de mamadas e critérios de complemento.',
      fonte: 'SBP / AAP 2022',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'seio', titulo: 'Seio materno', texto: 'livre demanda, 8 a 12×/dia', estado: 'sim' },
          { icone: 'lampada', titulo: 'Pausa na luz', texto: 'só para mamar', estado: 'sim' },
          { icone: 'mamadeira', titulo: 'Complemento', texto: 'só se indicado', estado: 'atencao' },
        ],
      },
      linha: {
        id: 'dieta',
        secao: 'dieta',
        texto: 'Seio materno em livre demanda (mínimo 8 a 12 vezes ao dia)',
        detalhe: 'Não suspender durante a fototerapia · Avaliar pega e sucção (perda de peso de 8%)',
      },
    },

    // 4. HIDRATAÇÃO ----------------------------------------------------------
    {
      id: 'hidratacao',
      secao: 'volemia',
      curto: 'Soro?',
      titulo: 'Precisa de soro?',
      explicacao: [
        'Um RN que mama bem e não tem sinais de desidratação não precisa de soro só porque está em fototerapia.',
        'A fototerapia aumenta um pouco a perda de água pela pele — por isso se acompanham peso, diurese e evacuações.',
      ],
      aValidar: 'Indicação de hidratação venosa na fototerapia.',
      fonte: 'AAP 2022 / SBP',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'seio', titulo: 'Mamando', texto: 'hidratação pela boca', estado: 'sim' },
          { icone: 'gota', titulo: 'Diurese', texto: 'acompanhar fraldas', estado: 'sim' },
          { icone: 'x', titulo: 'Soro EV', texto: 'não se aplica agora', estado: 'nao' },
        ],
      },
      linha: {
        id: 'hidratacao',
        secao: 'volemia',
        texto: 'Não se aplica (hidratação pelo seio materno)',
        detalhe: 'Reavaliar se perda de peso > 10% ou sinais de desidratação',
      },
    },

    // 6. DEMAIS (TERAPIAS) ------------------------------------------------------
    {
      id: 'fototerapia',
      secao: 'medicacoes',
      curto: 'Fototerapia',
      titulo: 'Prescrevendo a fototerapia',
      explicacao: [
        'A luz azul transforma a bilirrubina da pele em formas que saem pela urina e pelas fezes. Quanto mais pele exposta e mais intensa a luz, melhor funciona.',
        'Não é remédio, mas é um tratamento prescrito — por isso entra aqui, junto das "demais medicações". Os olhos ficam protegidos o tempo todo em que a luz estiver ligada.',
      ],
      aValidar: 'Irradiância mínima da fototerapia intensiva e local do item na folha do serviço.',
      fonte: 'AAP 2022 / SBP',
      cena: { tipo: 'ictericia', zona: 4, fototerapia: true },
      linha: {
        id: 'fototerapia',
        secao: 'medicacoes',
        texto: 'Fototerapia contínua (LED) — irradiância ≥ 30 µW/cm²/nm',
        detalhe: 'Expor o máximo de pele (só fralda) · Proteção ocular · Pausas só para mamar',
      },
    },

    // 7. EXAMES ----------------------------------------------------------------
    {
      id: 'exames',
      secao: 'exames',
      curto: 'Exames',
      titulo: 'Exames solicitados',
      explicacao: [
        'Na fototerapia, a pele fica "clareada" pela luz: o bilirrubinômetro deixa de ser confiável. O controle é pela BT no sangue.',
        'Também procuramos a causa: incompatibilidade de sangue entre mãe e bebê (tipagem e Coombs), hemólise (hemograma e reticulócitos) e deficiência de G6PD.',
      ],
      aValidar: 'Intervalo do controle da BT e lista de exames.',
      fonte: 'SBP / AAP 2022',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'tubo', titulo: 'BT e frações', texto: 'em até 12 h', estado: 'atencao' },
          { icone: 'tubo', titulo: 'Tipagem ABO/Rh', texto: 'mãe e RN + Coombs direto', estado: 'sim' },
          { icone: 'tubo', titulo: 'Hemograma', texto: 'com reticulócitos', estado: 'sim' },
          { icone: 'tubo', titulo: 'G6PD', estado: 'sim' },
        ],
      },
      linha: {
        id: 'exames',
        secao: 'exames',
        texto: 'BT e frações em até 12 h do início da fototerapia · Tipagem ABO/Rh da mãe e do RN · Coombs direto',
        detalhe: 'Hemograma com reticulócitos · G6PD',
      },
    },

    // 8. ORIENTAÇÕES -------------------------------------------------------------
    {
      id: 'orientacoes',
      secao: 'cuidados',
      curto: 'Cuidados',
      titulo: 'Orientações e cuidados',
      explicacao: [
        'Os cuidados garantem que a fototerapia funcione (pele exposta, aparelho na distância certa) e que seja segura (olhos protegidos, temperatura controlada).',
        'A equipe precisa reconhecer os sinais de que a bilirrubina está afetando o cérebro — é uma urgência.',
      ],
      aValidar: 'Frequência de controle de temperatura e sinais de alerta — conferir com o protocolo do serviço.',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'olho', titulo: 'Protetor ocular', texto: 'sempre com a luz ligada', estado: 'sim' },
          { icone: 'termometro', titulo: 'Temperatura', texto: 'de 3/3 h', estado: 'sim' },
          { icone: 'balanca', titulo: 'Peso diário', texto: 'e diurese/evacuações', estado: 'sim' },
          { icone: 'alerta', titulo: 'Comunicar', texto: 'sonolência, recusa das mamadas, choro agudo, arqueamento', estado: 'atencao' },
        ],
      },
      linha: {
        id: 'orientacoes',
        secao: 'cuidados',
        texto: 'Protetor ocular com a luz ligada · Temperatura de 3/3 h · Peso diário · Anotar diurese e evacuações',
        detalhe: 'Comunicar: sonolência, recusa das mamadas, choro agudo, hipertonia ou arqueamento do corpo, febre',
      },
    },

    // REVISÃO --------------------------------------------------------------------
    {
      id: 'revisao',
      secao: 'revisao',
      curto: 'Revisão',
      titulo: 'Revisão final',
      explicacao: [
        'Na icterícia, os erros mais comuns não são de conta, e sim de COMPARAÇÃO: usar dias em vez de horas, a curva da idade gestacional errada ou esquecer os fatores de risco.',
        'E a pegadinha da dieta: amamentação mantida, sempre.',
      ],
      cena: {
        tipo: 'conclusao',
        itens: [
          `Idade certa — ${horas} horas de vida`,
          `Limiar certo — ${HORAS_DO_LIMIAR} h, IG ≥ 38 sem, sem fatores de risco`,
          `BT ${fmt(BT_SERICA, 1)} > ${LIMIAR_FOTOTERAPIA} → fototerapia`,
          'Amamentação mantida — 8 a 12×/dia',
          'Olhos protegidos e BT de controle',
        ],
      },
    },
  ],
};
