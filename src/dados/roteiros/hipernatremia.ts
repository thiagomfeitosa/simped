/**
 * Roteiro — Desidratação hipernatrêmica num lactente (Na 160): por que corrigir
 * devagar, déficit de água livre, plano de 48 h (déficit + manutenção) e soro 1:1.
 *
 * CASO DIDÁTICO. Fórmulas e condutas de conhecimento geral do assistente — TUDO "A VALIDAR"
 * (velocidade máxima de queda, tempo de correção, escolha do soro, fração de água 0,6).
 * Os números são calculados pelo motor de cálculo src/calculos/ (o mesmo do Prescrever).
 */
import {
  arredondar,
  deficitDeAguaLivre,
  dividirEmProporcao,
  hollidaySegarMlDia,
  meqPorLitro,
  meqPorMl,
  MG_POR_MEQ,
  percentualPerdaPeso,
  vazaoDoVolume,
} from '../../calculos';
import { fmt } from '../../logica/formatacao';
import type { Roteiro } from './tipos';

// ---- Dados do caso ---------------------------------------------------------
const PESO_ANTES_KG = 6.6;
const PESO_KG = 6;
const IDADE = '5 meses';
const NA_ATUAL = 160;

// Correção (A VALIDAR)
const QUEDA_MAX_24H = 10; // mEq/L em 24 h (≈ 0,5 mEq/L/h)
const QUEDA_MAX_HORA = 0.5;
const HORAS_CORRECAO = 48;
const ML_AGUA_LIVRE_POR_KG_POR_MEQ = 4; // regra prática (conferência da fórmula)
// Soro (A VALIDAR): SG 5% + SF 0,9% 1:1 (≈ 77 mEq/L de Na) + KCl 2 mEq/100 mL após diurese
const PROPORCAO_SG_SF = [1, 1] as const;
const NA_SF_MEQ_L = 154;
const K_MEQ_POR_100ML = 2;
const KCL_PCT = 19.1;
const NA_CONTROLE_H = 4;

// ---- Contas ----------------------------------------------------------------
const naAlvo24h = NA_ATUAL - QUEDA_MAX_24H;
const quedaPorHora = QUEDA_MAX_24H / 24;
const perdaPct = percentualPerdaPeso(PESO_ANTES_KG, PESO_KG);
const deficitMl = arredondar((PESO_ANTES_KG - PESO_KG) * 1000, 0);
const aguaLivre = arredondar(deficitDeAguaLivre({ sodioAtual: NA_ATUAL, sodioDesejado: naAlvo24h, pesoKg: PESO_KG }), 0);
const aguaLivreRegra = ML_AGUA_LIVRE_POR_KG_POR_MEQ * PESO_KG * QUEDA_MAX_24H;
const hollidayDia = hollidaySegarMlDia(PESO_KG);
const manut48 = hollidayDia * (HORAS_CORRECAO / 24);
const total48 = deficitMl + manut48;
const porDia = total48 / (HORAS_CORRECAO / 24);
const [sgMl, sfMl] = dividirEmProporcao(porDia, PROPORCAO_SG_SF);
const kclMeqMl = meqPorMl(KCL_PCT, MG_POR_MEQ.KCl);
const kMeq = (porDia / 100) * K_MEQ_POR_100ML;
const kclMl = arredondar(kMeq / kclMeqMl, 1);
const bolsaTotal = arredondar(porDia + kclMl, 1);
const naMeq = (sfMl * NA_SF_MEQ_L) / 1000;
const naBolsa = meqPorLitro(naMeq, bolsaTotal);
const kBolsa = meqPorLitro(kMeq, bolsaTotal);
const vazao = vazaoDoVolume(bolsaTotal, 24 * 60);

// ---- Textos ----------------------------------------------------------------
const idTexto = `Ana · ${IDADE} · Peso ${fmt(PESO_KG)} kg (habitual ${fmt(PESO_ANTES_KG)} kg)`;
const soroComposicao = `SG 5% ${fmt(sgMl)} mL + SF 0,9% ${fmt(sfMl)} mL + KCl 19,1% ${fmt(kclMl)} mL`;

export const roteiroHipernatremia: Roteiro = {
  id: 'hipernatremia',
  tema: 'Distúrbios hidroeletrolíticos',
  titulo: 'Hipernatremia — correção lenta da água livre',
  resumo: 'Por que o sódio alto se corrige devagar, déficit de água livre, plano de 48 h e soro 1:1 com Na de controle.',
  paciente: {
    nome: 'Ana',
    descricao: `${IDADE}, ${fmt(PESO_KG)} kg, diarreia, Na ${NA_ATUAL}`,
  },
  etapas: [
    // 1. IDENTIFICAÇÃO -------------------------------------------------------
    {
      id: 'identificacao',
      secao: 'identificacao',
      curto: 'Paciente',
      titulo: 'Quem é a paciente?',
      explicacao: [
        `Ana, ${IDADE}. Pesava ${fmt(PESO_ANTES_KG)} kg na última consulta e hoje pesa ${fmt(PESO_KG)} kg. Está com diarreia há 4 dias, muito irritada, com choro agudo e a pele "pastosa".`,
        'A mãe conta que, para "sustentar mais", estava pondo mais pó de leite na mamadeira do que o rótulo manda. Mamadeira concentrada + diarreia = muito sal e pouca água.',
      ],
      cena: {
        tipo: 'paciente',
        perfil: 'crianca',
        pesoKg: PESO_KG,
        rotulos: [
          { rotulo: 'Idade', valor: IDADE },
          { rotulo: 'Peso', valor: `${fmt(PESO_KG)} kg (era ${fmt(PESO_ANTES_KG)})` },
          { rotulo: 'Quadro', valor: 'diarreia · irritada · pele pastosa' },
          { rotulo: 'Pista', valor: 'mamadeira concentrada' },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto, detalhe: 'Enfermaria' },
    },
    {
      id: 'sodio',
      secao: 'identificacao',
      curto: `Na ${NA_ATUAL}`,
      titulo: `Sódio de ${NA_ATUAL} e perda de ${fmt(perdaPct, 0)}% do peso`,
      explicacao: [
        `O sódio normal vai de 135 a 145. Com ${NA_ATUAL}, a água saiu das células (inclusive do cérebro) para o sangue — por isso a irritabilidade.`,
        `Ela perdeu ${fmt(perdaPct, 1)}% do peso. Na hipernatremia a desidratação "se esconde": a água que sobra fica dentro dos vasos e a criança parece menos desidratada do que está.`,
      ],
      conta: {
        formula: 'Perda (%) = (peso antes − peso agora) ÷ peso antes × 100',
        substituicao: `(${fmt(PESO_ANTES_KG)} − ${fmt(PESO_KG)}) ÷ ${fmt(PESO_ANTES_KG)} × 100`,
        resultado: `≈ ${fmt(perdaPct, 1)}% do peso`,
        rascunho: `Perda de peso: (${fmt(PESO_ANTES_KG)} − ${fmt(PESO_KG)}) ÷ ${fmt(PESO_ANTES_KG)} ≈ ${fmt(perdaPct, 1)}%`,
      },
      aValidar: 'Faixas de gravidade da hipernatremia.',
      fonte: 'SBP / Nelson',
      cena: {
        tipo: 'regua',
        reguas: [
          {
            titulo: 'Sódio (Na⁺)',
            unidade: 'mEq/L',
            minimo: 125,
            maximo: 175,
            faixas: [
              { ate: 135, rotulo: 'Baixo (< 135)', tom: 'atencao' },
              { ate: 145, rotulo: 'Normal (135 a 145)', tom: 'normal' },
              { ate: 155, rotulo: 'Alto (145 a 155)', tom: 'atencao' },
              { ate: 175, rotulo: 'Muito alto (> 155)', tom: 'perigo' },
            ],
            valor: NA_ATUAL,
            rotuloValor: 'Ana',
            casas: 0,
          },
          {
            titulo: 'Perda de peso',
            unidade: '%',
            minimo: 0,
            maximo: 15,
            faixas: [
              { ate: 5, rotulo: 'Leve (< 5%)', tom: 'normal' },
              { ate: 10, rotulo: 'Moderada (5 a 10%)', tom: 'atencao' },
              { ate: 15, rotulo: 'Grave (> 10%)', tom: 'perigo' },
            ],
            valor: perdaPct,
            rotuloValor: 'Ana',
            casas: 1,
          },
        ],
      },
      linha: { id: 'id', secao: 'identificacao', texto: idTexto, detalhe: `Desidratação hipernatrêmica: Na ${NA_ATUAL} mEq/L, perda de ${fmt(perdaPct, 1)}% do peso · Enfermaria` },
    },
    {
      id: 'choque',
      secao: 'identificacao',
      curto: 'Choque?',
      titulo: 'Primeiro: está em choque?',
      explicacao: [
        'Se houvesse choque, a primeira conduta seria a mesma de qualquer desidratação: soro fisiológico 0,9% em bolus — mesmo com o sódio alto. Primeiro a vida, depois o sódio.',
        'A Ana tem pulsos cheios e enchimento capilar de 2 segundos: sem choque. Então o soro pode ser planejado com calma.',
      ],
      aValidar: 'Conduta no choque com hipernatremia (SF 0,9% 20 mL/kg).',
      fonte: 'PALS / MS',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'coracao', titulo: 'Pulsos', texto: 'cheios', estado: 'sim' },
          { icone: 'relogio', titulo: 'Enchimento capilar', texto: '2 segundos', estado: 'sim' },
          { icone: 'x', titulo: 'Choque', texto: 'não há', estado: 'nao' },
          { icone: 'alerta', titulo: 'Se houvesse', texto: 'SF 0,9% em bolus primeiro', estado: 'atencao' },
        ],
      },
    },

    // 3. DIETA ---------------------------------------------------------------
    {
      id: 'dieta',
      secao: 'dieta',
      curto: 'Dieta',
      titulo: 'Dieta: o leite certo, do jeito certo',
      explicacao: [
        'Assim que estiver aceitando, a Ana volta a mamar — mas com a mamadeira preparada EXATAMENTE como diz o rótulo (ou leite materno, se houver).',
        'Mostrar à mãe a medida certa é parte do tratamento: senão, a hipernatremia volta.',
      ],
      aValidar: 'Conduta do caso didático (realimentação e orientação).',
      fonte: 'SBP',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'mamadeira', titulo: 'Fórmula', texto: 'medida do rótulo', estado: 'sim' },
          { icone: 'seio', titulo: 'Leite materno', texto: 'se houver', estado: 'sim' },
          { icone: 'x', titulo: 'Pó a mais', texto: 'nunca', estado: 'nao' },
        ],
      },
      linha: { id: 'dieta', secao: 'dieta', texto: 'Fórmula infantil preparada conforme o rótulo, livre demanda, assim que aceitar', detalhe: 'Orientar a mãe sobre o preparo correto' },
    },

    // 4. SORO ----------------------------------------------------------------
    {
      id: 'devagar',
      secao: 'volemia',
      curto: 'Devagar!',
      titulo: 'Por que baixar o sódio DEVAGAR?',
      explicacao: [
        'Em dias de sódio alto, o cérebro se defende fabricando partículas que seguram água dentro das células. Se o sódio do sangue cair rápido, a água entra correndo no cérebro: edema cerebral e convulsão.',
        `Por isso a meta é baixar no máximo ${QUEDA_MAX_24H} mEq/L em 24 h — de ${NA_ATUAL} para ${naAlvo24h} no 1º dia.`,
      ],
      conta: {
        formula: 'Velocidade de queda = queda máxima ÷ 24 h',
        substituicao: `${QUEDA_MAX_24H} mEq/L ÷ 24 h`,
        resultado: `≈ ${fmt(quedaPorHora, 2)} mEq/L por hora (limite ${fmt(QUEDA_MAX_HORA)})`,
        rascunho: `Meta: ${NA_ATUAL} → ${naAlvo24h} em 24 h (≈ ${fmt(quedaPorHora, 2)} mEq/L/h)`,
      },
      aValidar: `Queda máxima de ${QUEDA_MAX_24H} mEq/L em 24 h (≈ ${fmt(QUEDA_MAX_HORA)} mEq/L/h).`,
      fonte: 'SBP / Nelson / PALS',
      cena: {
        tipo: 'regua',
        reguas: [
          {
            titulo: 'Sódio: de hoje para amanhã',
            unidade: 'mEq/L',
            minimo: 135,
            maximo: 170,
            faixas: [
              { ate: 145, rotulo: 'Normal', tom: 'normal' },
              { ate: 155, rotulo: 'Alto', tom: 'atencao' },
              { ate: 170, rotulo: 'Muito alto', tom: 'perigo' },
            ],
            valorInicial: NA_ATUAL,
            valor: naAlvo24h,
            rotuloValor: 'meta em 24 h',
            marcos: [{ valor: NA_ATUAL, rotulo: 'agora' }],
            casas: 0,
          },
        ],
        legenda: 'Cair mais rápido que isso é perigoso — mesmo que o número "fique bonito".',
      },
    },
    {
      id: 'agua-livre',
      secao: 'volemia',
      curto: 'Água livre',
      titulo: 'Quanta água livre falta?',
      explicacao: [
        `"Água livre" é água sem sódio. A fórmula estima quanto dela baixaria o Na de ${NA_ATUAL} para ${naAlvo24h}, considerando que a água do corpo é cerca de 60% do peso.`,
        `Regra prática para conferir: ${ML_AGUA_LIVRE_POR_KG_POR_MEQ} mL/kg de água livre baixam ≈ 1 mEq/L. Para ${QUEDA_MAX_24H} mEq/L: ${ML_AGUA_LIVRE_POR_KG_POR_MEQ} × ${fmt(PESO_KG)} × ${QUEDA_MAX_24H} = ${fmt(aguaLivreRegra)} mL. As duas contas batem.`,
      ],
      conta: {
        formula: 'Água livre = 0,6 × peso × (Na atual ÷ Na meta − 1)',
        substituicao: `0,6 × ${fmt(PESO_KG)} × (${NA_ATUAL} ÷ ${naAlvo24h} − 1)`,
        passos: [`${fmt(0.6 * PESO_KG, 1)} L × ${fmt(NA_ATUAL / naAlvo24h - 1, 4)}`],
        resultado: `≈ ${fmt(aguaLivre)} mL de água livre (regra prática: ${fmt(aguaLivreRegra)} mL ✓)`,
        rascunho: `Água livre: 0,6 × ${fmt(PESO_KG)} × (${NA_ATUAL}/${naAlvo24h} − 1) ≈ ${fmt(aguaLivre)} mL`,
      },
      dica: 'A conta é uma estimativa: a criança continua perdendo água (diarreia, urina, pele). Por isso quem manda é o sódio dosado de tempos em tempos.',
      aValidar: `Fórmula do déficit de água livre (fração 0,6) e regra de ${ML_AGUA_LIVRE_POR_KG_POR_MEQ} mL/kg por mEq/L.`,
      fonte: 'Nelson / SBP',
      cena: {
        tipo: 'multiplicacao',
        valorPorKg: ML_AGUA_LIVRE_POR_KG_POR_MEQ * QUEDA_MAX_24H,
        unidade: 'mL',
        pesoKg: PESO_KG,
        total: aguaLivreRegra,
        rotuloTotal: `${fmt(aguaLivreRegra)} mL de água livre para baixar ${QUEDA_MAX_24H} mEq/L`,
      },
    },
    {
      id: 'deficit',
      secao: 'volemia',
      curto: 'Déficit',
      titulo: 'Quanto de líquido ela perdeu?',
      explicacao: [
        `A balança responde: ${fmt(PESO_ANTES_KG)} − ${fmt(PESO_KG)} = ${fmt(PESO_ANTES_KG - PESO_KG, 1)} kg. Em pouco tempo, quase todo peso perdido é água: 1 kg ≈ 1 litro.`,
      ],
      conta: {
        formula: 'Déficit (mL) = peso perdido (kg) × 1.000',
        substituicao: `(${fmt(PESO_ANTES_KG)} − ${fmt(PESO_KG)}) kg × 1.000`,
        resultado: `${fmt(deficitMl)} mL de déficit`,
        rascunho: `Déficit: ${fmt(PESO_ANTES_KG)} − ${fmt(PESO_KG)} = ${fmt(deficitMl)} mL`,
      },
      cena: {
        tipo: 'paciente',
        perfil: 'crianca',
        pesoKg: PESO_KG,
        rotulos: [
          { rotulo: 'Antes', valor: `${fmt(PESO_ANTES_KG)} kg` },
          { rotulo: 'Agora', valor: `${fmt(PESO_KG)} kg` },
          { rotulo: 'Perdeu', valor: `${fmt(deficitMl)} g ≈ ${fmt(deficitMl)} mL` },
        ],
      },
    },
    {
      id: 'plano-48h',
      secao: 'volemia',
      curto: 'Plano 48 h',
      titulo: `O plano: repor em ${HORAS_CORRECAO} horas`,
      explicacao: [
        `Na hipernatremia, o déficit é reposto devagar, em ${HORAS_CORRECAO} h, somado à manutenção desses ${HORAS_CORRECAO / 24} dias (Holliday-Segar: ${fmt(hollidayDia)} mL por dia para ${fmt(PESO_KG)} kg).`,
        `Total: ${fmt(deficitMl)} + ${fmt(manut48)} = ${fmt(total48)} mL em ${HORAS_CORRECAO} h, ou seja, ${fmt(porDia)} mL a cada 24 h.`,
      ],
      conta: {
        formula: `Total = déficit + manutenção de ${HORAS_CORRECAO} h`,
        substituicao: `Manutenção: ${fmt(PESO_KG)} kg × 100 mL = ${fmt(hollidayDia)} mL/dia × ${HORAS_CORRECAO / 24} = ${fmt(manut48)} mL`,
        passos: [`${fmt(deficitMl)} + ${fmt(manut48)} = ${fmt(total48)} mL em ${HORAS_CORRECAO} h`],
        resultado: `${fmt(porDia)} mL por dia`,
        rascunho: `Plano: ${fmt(deficitMl)} + ${fmt(manut48)} = ${fmt(total48)} mL/${HORAS_CORRECAO} h = ${fmt(porDia)} mL/dia`,
      },
      aValidar: `Reposição do déficit em ${HORAS_CORRECAO} h junto com a manutenção.`,
      fonte: 'Nelson / SBP',
      cena: {
        tipo: 'barras',
        titulo: `Volume em ${HORAS_CORRECAO} horas`,
        unidade: 'mL',
        casas: 0,
        barras: [
          { rotulo: 'Déficit', detalhe: 'peso perdido', valor: deficitMl, tom: 'atencao' },
          { rotulo: `Manutenção ${HORAS_CORRECAO} h`, detalhe: `${fmt(hollidayDia)} mL/dia × ${HORAS_CORRECAO / 24}`, valor: manut48, tom: 'info' },
          { rotulo: 'Total', detalhe: `= ${fmt(porDia)} mL por dia`, valor: total48, tom: 'normal' },
        ],
      },
      linha: { id: 'soro', secao: 'volemia', texto: `Soro de reidratação — ${fmt(total48)} mL em ${HORAS_CORRECAO} h (${fmt(porDia)} mL/dia), EV` },
    },
    {
      id: 'soro',
      secao: 'volemia',
      curto: 'Qual soro?',
      titulo: 'Qual soro? Nem água pura, nem soro fisiológico',
      explicacao: [
        `Usamos SG 5% + SF 0,9% meio a meio (1:1): o sódio do soro fica ≈ ${fmt(naBolsa, 0)} mEq/L — mais baixo que o da Ana (${NA_ATUAL}), então o Na dela desce, mas sem despencar.`,
        `Com diurese presente, entra o potássio: ${K_MEQ_POR_100ML} mEq para cada 100 mL → ${fmt(kMeq)} mEq = ${fmt(kclMl)} mL de KCl 19,1%.`,
      ],
      conta: {
        formula: 'SG 5% : SF 0,9% = 1 : 1 · KCl = mEq ÷ 2,56 mEq/mL',
        substituicao: `${fmt(porDia)} mL ÷ 2 = ${fmt(sgMl)} mL de SG 5% + ${fmt(sfMl)} mL de SF 0,9%`,
        passos: [
          `K⁺: ${fmt(porDia)} ÷ 100 × ${K_MEQ_POR_100ML} = ${fmt(kMeq)} mEq ÷ ${fmt(kclMeqMl)} ≈ ${fmt(kclMl)} mL de KCl 19,1%`,
          `Na⁺: ${fmt(sfMl)} mL × 0,154 = ${fmt(naMeq, 1)} mEq em ${fmt(bolsaTotal)} mL`,
        ],
        resultado: `Na⁺ ≈ ${fmt(naBolsa, 0)} mEq/L · K⁺ ≈ ${fmt(kBolsa, 0)} mEq/L`,
        rascunho: `Soro 1:1: SG5% ${fmt(sgMl)} + SF ${fmt(sfMl)} + KCl ${fmt(kclMl)} mL → Na ≈ ${fmt(naBolsa, 0)}, K ≈ ${fmt(kBolsa, 0)} mEq/L`,
      },
      dica: 'Nunca dar água destilada pura na veia: ela estoura as hemácias (hemólise). A água livre entra "escondida" dentro do soro glicosado.',
      aValidar: `Escolha do soro (1:1, Na ≈ ${fmt(naBolsa, 0)} mEq/L) e K⁺ de ${K_MEQ_POR_100ML} mEq/100 mL após diurese.`,
      fonte: 'Nelson / SBP',
      cena: {
        tipo: 'mistura',
        recipiente: `Soro de 24 h — ${fmt(bolsaTotal)} mL`,
        componentes: [
          { rotulo: `SG 5% — ${fmt(sgMl)} mL`, volumeMl: sgMl, cor: 'glicose' },
          { rotulo: `SF 0,9% — ${fmt(sfMl)} mL`, volumeMl: sfMl, cor: 'sf' },
          { rotulo: `KCl 19,1% — ${fmt(kclMl)} mL`, volumeMl: kclMl, cor: 'medicacao' },
        ],
        resumo: [
          { rotulo: 'Na⁺', valor: `≈ ${fmt(naBolsa, 0)} mEq/L`, tom: 'normal' },
          { rotulo: 'K⁺', valor: `≈ ${fmt(kBolsa, 0)} mEq/L`, tom: 'normal' },
        ],
      },
      linha: { id: 'soro', secao: 'volemia', texto: `${soroComposicao} — EV em 24 h (repetir no 2º dia conforme Na)` },
    },
    {
      id: 'vazao',
      secao: 'volemia',
      curto: 'Vazão',
      titulo: 'Vazão do soro',
      explicacao: [`${fmt(bolsaTotal)} mL em 24 horas na bomba de infusão.`],
      conta: {
        formula: 'Vazão = volume ÷ 24 h',
        substituicao: `${fmt(bolsaTotal)} mL ÷ 24 h`,
        resultado: `≈ ${fmt(vazao, 1)} mL/h`,
        rascunho: `Vazão: ${fmt(bolsaTotal)} ÷ 24 ≈ ${fmt(vazao, 1)} mL/h`,
      },
      cena: {
        tipo: 'bancada',
        estadoInicial: {
          bolsa: { rotulo: 'Soro 1:1 + K', cor: 'mistura', gotejando: false },
          bic: { vazaoMlH: 0, ligada: false, rotulo: 'BIC do soro' },
        },
        estado: {
          bolsa: { rotulo: 'Soro 1:1 + K', cor: 'mistura', gotejando: true },
          bic: { vazaoMlH: vazao, ligada: true, rotulo: 'BIC do soro' },
          fluxos: ['bolsa-bic', 'bic-paciente'],
        },
      },
      linha: {
        id: 'soro',
        secao: 'volemia',
        texto: `${soroComposicao} — EV em 24 h, BIC ${fmt(vazao, 1)} mL/h`,
        detalhe: `Na⁺ ≈ ${fmt(naBolsa, 0)} mEq/L · K⁺ só com diurese · plano de ${HORAS_CORRECAO} h (${fmt(total48)} mL)`,
      },
    },
    {
      id: 'controle',
      secao: 'volemia',
      curto: 'Ajustar',
      titulo: `Na de ${NA_CONTROLE_H}/${NA_CONTROLE_H} h: o soro se ajusta ao sódio`,
      explicacao: [
        `O sódio é dosado de ${NA_CONTROLE_H} em ${NA_CONTROLE_H} horas. Se estiver caindo mais de ${fmt(QUEDA_MAX_HORA)} mEq/L por hora, o soro precisa de MAIS sódio (menos água livre) ou de menos velocidade.`,
        'Se o sódio não cair, falta água livre: aumenta-se a proporção de soro glicosado. É o paciente que diz se a conta estava certa.',
      ],
      aValidar: `Intervalo de controle (${NA_CONTROLE_H}/${NA_CONTROLE_H} h) e condutas de ajuste.`,
      fonte: 'Nelson / SBP',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'tubo', titulo: `Na de ${NA_CONTROLE_H}/${NA_CONTROLE_H} h`, estado: 'sim' },
          { icone: 'alerta', titulo: `Caiu > ${fmt(QUEDA_MAX_HORA)}/h`, texto: 'mais Na no soro / mais devagar', estado: 'atencao' },
          { icone: 'gota', titulo: 'Não caiu', texto: 'mais água livre', estado: 'atencao' },
          { icone: 'cerebro', titulo: 'Convulsão', texto: 'pensar em queda rápida', estado: 'atencao' },
        ],
      },
    },

    // 7. EXAMES ----------------------------------------------------------------
    {
      id: 'exames',
      secao: 'exames',
      curto: 'Exames',
      titulo: 'Exames solicitados',
      explicacao: ['Na hipernatremia também é comum glicose alta e cálcio baixo; e a função do rim mostra o tamanho da desidratação.'],
      aValidar: 'Lista de exames do caso didático.',
      fonte: 'SBP / Nelson',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'tubo', titulo: `Na de ${NA_CONTROLE_H}/${NA_CONTROLE_H} h`, estado: 'atencao' },
          { icone: 'tubo', titulo: 'K, Ca, glicemia', estado: 'sim' },
          { icone: 'tubo', titulo: 'Ureia e creatinina', estado: 'sim' },
          { icone: 'tubo', titulo: 'Gasometria venosa', estado: 'sim' },
        ],
      },
      linha: { id: 'exames', secao: 'exames', texto: `Na⁺ de ${NA_CONTROLE_H}/${NA_CONTROLE_H} h · K⁺ · Cálcio · Glicemia · Ureia · Creatinina · Gasometria venosa` },
    },

    // 8. CUIDADOS ----------------------------------------------------------------
    {
      id: 'cuidados',
      secao: 'cuidados',
      curto: 'Cuidados',
      titulo: 'Orientações e cuidados',
      explicacao: ['Peso diário e balanço hídrico mostram se a reposição está andando; a enfermagem deve avisar na hora qualquer convulsão, sonolência ou piora da irritabilidade.'],
      aValidar: 'Intervalos de cuidados — conferir com o protocolo do serviço.',
      fonte: 'Protocolo do serviço',
      cena: {
        tipo: 'cartoes',
        cartoes: [
          { icone: 'balanca', titulo: 'Peso diário', estado: 'sim' },
          { icone: 'gota', titulo: 'Balanço hídrico', texto: 'diurese e evacuações', estado: 'sim' },
          { icone: 'cerebro', titulo: 'Comunicar', texto: 'convulsão, sonolência', estado: 'atencao' },
          { icone: 'mamadeira', titulo: 'Orientar a mãe', texto: 'preparo da fórmula', estado: 'sim' },
        ],
      },
      linha: {
        id: 'cuidados',
        secao: 'cuidados',
        texto: 'Peso diário · Balanço hídrico (diurese e evacuações) · SSVV de 4/4 h · Orientar a mãe sobre o preparo da fórmula',
        detalhe: 'Comunicar: convulsão, sonolência, piora da irritabilidade, diurese baixa',
      },
    },

    // REVISÃO --------------------------------------------------------------------
    {
      id: 'revisao',
      secao: 'revisao',
      curto: 'Revisão',
      titulo: 'Revisão final',
      explicacao: ['Sódio alto: choque primeiro; depois, devagar. O plano é uma estimativa — o sódio de controle é quem corrige o rumo.'],
      cena: {
        tipo: 'conclusao',
        itens: [
          `Choque — não (se houvesse: SF 0,9% em bolus)`,
          `Meta — ${NA_ATUAL} → ${naAlvo24h} em 24 h (≤ ${fmt(QUEDA_MAX_HORA)} mEq/L/h)`,
          `Volume — ${fmt(deficitMl)} (déficit) + ${fmt(manut48)} (manutenção) em ${HORAS_CORRECAO} h`,
          `Soro — 1:1 + KCl, Na ≈ ${fmt(naBolsa, 0)} mEq/L, ${fmt(vazao, 1)} mL/h`,
          `Controle — Na de ${NA_CONTROLE_H}/${NA_CONTROLE_H} h · orientar a mamadeira`,
        ],
      },
    },
  ],
};
