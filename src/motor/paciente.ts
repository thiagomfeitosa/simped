/**
 * Motor do paciente: estado + eventos (CLAUDE.md, "Arquitetura").
 * Função pura: (estado, evento) → novo estado. A mesma lista de eventos sempre gera o mesmo paciente,
 * o que permite, no futuro, o professor enviar eventos pela rede (modo online).
 *
 * O motor não sabe nada de farmacologia: quanto cada sinal muda vem do arquivo do caso
 * (e, para dose alta, de src/dados/efeitos-sobredose.ts).
 *
 * Três tipos de variável:
 * - sinais numéricos (FC, FR, SpO₂, PA, temperatura, glicemia, TEC, Glasgow): vão em linha reta até o alvo;
 * - laboratório (Fase 2: pCO₂, HCO₃⁻, lactato, K, Na, Cl, cetonemia): igual aos sinais, mas só aparecem
 *   quando o exame é colhido (src/motor/laboratorio.ts);
 * - estado clínico (ritmo, padrão respiratório): troca de uma vez, num minuto marcado.
 */

import {
  type CasoClinico,
  ESTADO_CLINICO_PADRAO,
  type EstadoClinico,
  type MudancaDeEstado,
  type MudancaDeSinal,
  type NomeSinal,
  type NomeVariavel,
  type SinaisVitais,
  SINAIS_PADRAO,
  VARIAVEIS_LAB,
  type VariavelLab,
} from '../casos/tipos';
import { EFEITOS_LABORATORIO } from '../dados/efeitos-laboratorio';
import { EFEITOS_SOBREDOSE } from '../dados/efeitos-sobredose';
import { LIMITES_LAB } from '../dados/laboratorio-dinamico';
import { MODELO_O2 } from '../dados/oxigenio-a-validar';
import { labInicial, type ValoresLab } from './laboratorio';
import { AR_AMBIENTE, dispositivo, type EstadoOxigenio, oxigenar } from './oxigenacao';

/** B9: como a dose dada se compara com a faixa (calculado na hora de administrar; ver avaliarDose.ts). */
export interface AvaliacaoDoseEvento {
  nivel: 'subdose' | 'certa' | 'sobredose';
  /** Na subdose: fração do efeito (0,1 a 0,9). */
  fracao?: number;
  /** Ex.: "5 mg/kg, abaixo da faixa 10–25 mg/kg". */
  texto?: string;
}

export type EventoPaciente =
  | { tipo: 'tempoPassou'; minutos: number }
  | { tipo: 'medicacaoAdministrada'; medicacaoId: string; descricao: string; avaliacao?: AvaliacaoDoseEvento }
  | { tipo: 'professorAlterouSinais'; sinais: Partial<SinaisVitais>; clinico?: Partial<EstadoClinico> }
  /** Complicação disparada pelo professor: os sinais vão até o alvo aos poucos, começando agora. */
  | {
      tipo: 'complicacao';
      nome: string;
      mudancas: { sinal: NomeVariavel; alvo: number; duracaoMin: number; modo?: 'alvo' | 'soma' }[];
      clinico?: Partial<EstadoClinico>;
    }
  /** Só registra na linha do tempo (ex.: exame pedido); não muda o paciente. */
  | { tipo: 'anotacao'; descricao: string }
  /** Oxigenoterapia instalada ou trocada (cateter, máscara, CPAP, bolsa, ventilador...). */
  | { tipo: 'oxigenio'; oxigenio: EstadoOxigenio; descricao: string };

/** Mudança agendada ou em andamento num sinal. */
interface MudancaAtiva {
  sinal: NomeVariavel;
  alvo: number;
  inicioMin: number;
  fimMin: number;
  modo?: 'alvo' | 'soma';
  /** B9: só esta fração do caminho até o alvo (subdose). */
  fracao?: number;
  /** Valor do sinal no momento em que a mudança começou (preenchido ao começar). */
  valorInicial?: number;
}

/** Troca de ritmo/padrão respiratório marcada para um minuto. */
interface TrocaAgendada {
  campo: MudancaDeEstado['campo'];
  valor: MudancaDeEstado['valor'];
  emMin: number;
}

export interface RegistroDeEvento {
  tempoMin: number;
  descricao: string;
}

export interface EstadoPaciente {
  tempoMin: number;
  sinais: SinaisVitais;
  /** Fase 2: valores de laboratório agora (o exame mostra os do minuto da coleta). */
  lab: ValoresLab;
  /** Oxigenoterapia em uso. A SpO₂ de `sinais` é a do paciente em ar ambiente (ver `sinaisVistos`). */
  oxigenio: EstadoOxigenio;
  /** Padrão respiratório de antes da ventilação (volta quando a bolsa/ventilador sai). */
  padraoAntesDaVentilacao?: EstadoClinico['padraoRespiratorio'];
  clinico: EstadoClinico;
  mudancas: MudancaAtiva[];
  trocas: TrocaAgendada[];
  registro: RegistroDeEvento[];
}

/** Limites físicos dos sinais (nada negativo, SpO₂ até 100, Glasgow 3–15) e do laboratório. */
const LIMITES: Partial<Record<NomeVariavel, [number, number]>> = {
  spo2: [0, 100],
  glasgow: [3, 15],
  ...LIMITES_LAB,
};

const EH_LAB = new Set<string>(VARIAVEIS_LAB);

function limitar(sinal: NomeVariavel, valor: number): number {
  const [min, max] = LIMITES[sinal] ?? [0, Number.POSITIVE_INFINITY];
  return Math.min(max, Math.max(min, valor));
}

function agendar(mudancas: readonly MudancaDeSinal[], agoraMin: number, fracao?: number): MudancaAtiva[] {
  return mudancas.map((m) => ({
    sinal: m.sinal,
    alvo: m.alvo,
    inicioMin: agoraMin + m.atrasoMin,
    fimMin: agoraMin + m.atrasoMin + m.duracaoMin,
    ...(m.modo && { modo: m.modo }),
    ...(fracao !== undefined && fracao < 1 && { fracao }),
  }));
}

function agendarTrocas(mudancas: readonly MudancaDeEstado[], agoraMin: number): TrocaAgendada[] {
  return mudancas.map((m) => ({ campo: m.campo, valor: m.valor, emMin: agoraMin + m.atrasoMin }));
}

export function iniciarPaciente(caso: CasoClinico): EstadoPaciente {
  const inicial: EstadoPaciente = {
    tempoMin: 0,
    sinais: { ...SINAIS_PADRAO, ...caso.sinaisIniciais },
    lab: labInicial(caso),
    oxigenio: AR_AMBIENTE,
    clinico: { ...ESTADO_CLINICO_PADRAO, ...caso.estadoInicial },
    mudancas: agendar(caso.evolucaoNatural ?? [], 0),
    trocas: agendarTrocas(caso.evolucaoDoEstado ?? [], 0),
    registro: [{ tempoMin: 0, descricao: 'Início do caso' }],
  };
  // aplica o que começa já no minuto 0 (ex.: mudança imediata)
  return avancarUmMinuto(inicial, 0);
}

/**
 * Atualiza os sinais no minuto `t`:
 * - mudança que começa agora guarda o valor atual e substitui as mais antigas do mesmo sinal;
 * - mudança em andamento leva o sinal em linha reta até o alvo;
 * - mudança terminada fixa o alvo e sai da lista;
 * - trocas de ritmo/padrão respiratório marcadas até `t` acontecem (na ordem em que foram marcadas).
 */
function avancarUmMinuto(estado: EstadoPaciente, t: number): EstadoPaciente {
  // sinais e laboratório andam juntos (as mudanças valem para os dois); no fim, cada um volta ao seu lugar
  const sinais: Record<NomeVariavel, number> = { ...estado.sinais, ...estado.lab };
  let ativas: MudancaAtiva[] = [];
  const aguardando: MudancaAtiva[] = [];

  // 1. mudanças já em andamento chegam ao valor do minuto t
  for (const m of estado.mudancas) {
    if (m.valorInicial === undefined) aguardando.push({ ...m });
    else ativas.push({ ...m });
  }
  for (const m of ativas) aplicarMudanca(sinais, m, t);

  // 2. mudanças que começam agora partem do valor atualizado e substituem as anteriores do mesmo sinal
  const aindaAguardando: MudancaAtiva[] = [];
  for (const m of aguardando) {
    if (t < m.inicioMin) {
      aindaAguardando.push(m);
      continue;
    }
    m.valorInicial = sinais[m.sinal];
    // o alvo final passa a ser absoluto: variação somada ('soma') e só uma fração na subdose
    const destino = m.modo === 'soma' ? m.valorInicial + m.alvo : m.alvo;
    m.alvo = limitar(m.sinal, m.valorInicial + (destino - m.valorInicial) * (m.fracao ?? 1));
    m.modo = 'alvo';
    ativas = [...ativas.filter((outra) => outra.sinal !== m.sinal), m];
    aplicarMudanca(sinais, m, t);
  }

  // 3. mudanças terminadas saem da lista (o sinal fica no alvo)
  const restantes = [...ativas.filter((m) => t < m.fimMin), ...aindaAguardando];

  // 4. trocas de ritmo / padrão respiratório
  let clinico = estado.clinico;
  const trocasRestantes: TrocaAgendada[] = [];
  for (const troca of estado.trocas) {
    if (troca.emMin <= t) clinico = { ...clinico, [troca.campo]: troca.valor };
    else trocasRestantes.push(troca);
  }

  const vitais = {} as SinaisVitais;
  const lab = {} as ValoresLab;
  for (const [nome, valor] of Object.entries(sinais) as [NomeVariavel, number][]) {
    if (EH_LAB.has(nome)) lab[nome as VariavelLab] = valor;
    else vitais[nome as NomeSinal] = valor;
  }
  return { ...estado, tempoMin: t, sinais: vitais, lab, clinico, mudancas: restantes, trocas: trocasRestantes };
}

/** Leva o sinal em linha reta do valor inicial até o alvo, conforme o minuto t. */
function aplicarMudanca(sinais: Record<NomeVariavel, number>, m: MudancaAtiva, t: number): void {
  const inicial = m.valorInicial ?? sinais[m.sinal];
  if (t >= m.fimMin) {
    sinais[m.sinal] = m.alvo;
  } else {
    const fracao = (t - m.inicioMin) / (m.fimMin - m.inicioMin);
    sinais[m.sinal] = inicial + (m.alvo - inicial) * fracao;
  }
}

const TEXTO_NIVEL: Record<AvaliacaoDoseEvento['nivel'], string> = {
  subdose: 'dose abaixo da faixa: efeito parcial',
  certa: 'dose na faixa',
  sobredose: 'dose acima da faixa: efeito adverso',
};

export function aplicarEvento(
  estado: EstadoPaciente,
  evento: EventoPaciente,
  caso: CasoClinico,
): EstadoPaciente {
  switch (evento.tipo) {
    case 'tempoPassou': {
      let novo = estado;
      const minutos = Math.max(0, Math.floor(evento.minutos));
      for (let i = 1; i <= minutos; i++) novo = avancarUmMinuto(novo, estado.tempoMin + i);
      return novo;
    }

    case 'medicacaoAdministrada': {
      const resposta = caso.respostas?.find((r) => r.medicacaoId === evento.medicacaoId);
      const nivel = evento.avaliacao?.nivel;
      const sobre = nivel === 'sobredose' ? (resposta?.sobredose ? { mudancas: resposta.sobredose } : EFEITOS_SOBREDOSE[evento.medicacaoId]) : undefined;
      const sufixo = [
        !resposta && 'sem efeito definido neste caso',
        nivel && nivel !== 'certa' && `${TEXTO_NIVEL[nivel]}${evento.avaliacao?.texto ? ` — ${evento.avaliacao.texto}` : ''}`,
        sobre && 'descricao' in sobre && sobre.descricao,
      ].filter(Boolean);
      const registro = [
        ...estado.registro,
        { tempoMin: estado.tempoMin, descricao: `Administrado: ${evento.descricao}${sufixo.length ? ` (${sufixo.join('; ')})` : ''}` },
      ];
      const fracao = nivel === 'subdose' ? (evento.avaliacao?.fracao ?? 0.5) : undefined;
      // Fase 2: efeito nos exames — o do caso, se ele disser algo sobre exames; senão, o geral (efeitos-laboratorio.ts)
      const casoMexeNoLab = (resposta?.mudancas ?? []).some((m) => EH_LAB.has(m.sinal));
      const noLab = casoMexeNoLab ? [] : (EFEITOS_LABORATORIO[evento.medicacaoId]?.mudancas ?? []);
      const mudancas = [
        ...estado.mudancas,
        ...agendar(resposta?.mudancas ?? [], estado.tempoMin, fracao),
        ...agendar(noLab, estado.tempoMin, fracao),
        ...agendar(sobre?.mudancas ?? [], estado.tempoMin),
      ];
      // na subdose, a troca de ritmo/padrão (ex.: TSV → sinusal) não acontece
      const novas = [
        ...(nivel === 'subdose' ? [] : agendarTrocas(resposta?.mudancasDeEstado ?? [], estado.tempoMin)),
        ...agendarTrocas((sobre && 'mudancasDeEstado' in sobre ? sobre.mudancasDeEstado : undefined) ?? [], estado.tempoMin),
      ];
      // trocas novas cancelam as pendentes do mesmo campo (ex.: o ritmo voltou: a FV não degenera mais)
      const campos = new Set(novas.map((t) => t.campo));
      const trocas = [...estado.trocas.filter((t) => !campos.has(t.campo)), ...novas];
      return avancarUmMinuto({ ...estado, mudancas, trocas, registro }, estado.tempoMin);
    }

    case 'anotacao':
      return { ...estado, registro: [...estado.registro, { tempoMin: estado.tempoMin, descricao: evento.descricao }] };

    case 'oxigenio': {
      const ventilaAgora = !!dispositivo(evento.oxigenio.dispositivo).ventila;
      const ventilavaAntes = !!dispositivo(estado.oxigenio.dispositivo).ventila;
      let clinico = estado.clinico;
      let sinais = estado.sinais;
      let padraoAntesDaVentilacao = estado.padraoAntesDaVentilacao;
      let mudancas = estado.mudancas;
      if (ventilaAgora && !ventilavaAntes) {
        // ventilando: o padrão vira "assistida" e a FR passa a ser a da bolsa/ventilador
        padraoAntesDaVentilacao = clinico.padraoRespiratorio;
        clinico = { ...clinico, padraoRespiratorio: 'assistida' };
        if (sinais.fr < MODELO_O2.frVentilado) sinais = { ...sinais, fr: MODELO_O2.frVentilado };
        mudancas = mudancas.filter((m) => m.sinal !== 'fr');
      } else if (!ventilaAgora && ventilavaAntes && clinico.padraoRespiratorio === 'assistida') {
        clinico = { ...clinico, padraoRespiratorio: padraoAntesDaVentilacao ?? 'normal' };
        padraoAntesDaVentilacao = undefined;
      }
      const { padraoAntesDaVentilacao: _antigo, ...semPadrao } = estado;
      return {
        ...semPadrao,
        ...(padraoAntesDaVentilacao !== undefined && { padraoAntesDaVentilacao }),
        oxigenio: evento.oxigenio,
        clinico,
        sinais,
        mudancas,
        registro: [...estado.registro, { tempoMin: estado.tempoMin, descricao: `Oxigênio: ${evento.descricao}` }],
      };
    }

    case 'complicacao': {
      const mudancas = [...estado.mudancas, ...agendar(evento.mudancas.map((m) => ({ ...m, atrasoMin: 0 })), estado.tempoMin)];
      const registro = [...estado.registro, { tempoMin: estado.tempoMin, descricao: `Complicação: ${evento.nome}` }];
      const clinico = { ...estado.clinico, ...evento.clinico };
      return avancarUmMinuto({ ...estado, clinico, mudancas, registro }, estado.tempoMin);
    }

    case 'professorAlterouSinais': {
      const alterados = Object.keys(evento.sinais) as NomeSinal[];
      const trocados = Object.keys(evento.clinico ?? {}) as (keyof EstadoClinico)[];
      const sinais = { ...estado.sinais };
      for (const s of alterados) {
        const v = evento.sinais[s];
        if (v !== undefined) sinais[s] = limitar(s, v);
      }
      return {
        ...estado,
        sinais,
        clinico: { ...estado.clinico, ...evento.clinico },
        // o professor manda: mudanças em andamento nesses sinais (e trocas pendentes desses campos) são canceladas
        mudancas: estado.mudancas.filter((m) => !(alterados as NomeVariavel[]).includes(m.sinal)),
        trocas: estado.trocas.filter((x) => !trocados.includes(x.campo)),
        registro: [
          ...estado.registro,
          { tempoMin: estado.tempoMin, descricao: `Professor alterou: ${[...alterados, ...trocados].join(', ')}` },
        ],
      };
    }
  }
}

/** Reconstrói o paciente a partir da lista de eventos (útil para o modo online e para "voltar no tempo"). */
export function reproduzirEventos(caso: CasoClinico, eventos: readonly EventoPaciente[]): EstadoPaciente {
  return eventos.reduce((estado, evento) => aplicarEvento(estado, evento, caso), iniciarPaciente(caso));
}

/**
 * Acrescenta um evento à lista. "Tempo passou" seguido de "tempo passou" vira um só
 * (5 min + 1 min = 6 min): o paciente sai igual, e a lista não cresce a cada minuto do relógio.
 */
export function acrescentarEvento(lista: readonly EventoPaciente[], evento: EventoPaciente): EventoPaciente[] {
  const ultimo = lista[lista.length - 1];
  if (evento.tipo === 'tempoPassou' && ultimo?.tipo === 'tempoPassou') {
    return [...lista.slice(0, -1), { tipo: 'tempoPassou', minutos: ultimo.minutos + evento.minutos }];
  }
  return [...lista, evento];
}

/**
 * Sinais como o monitor mostra: a SpO₂ do motor é a do paciente em ar ambiente; com O₂ instalado,
 * a SpO₂ medida sai do modelo de oxigenação (src/motor/oxigenacao.ts).
 */
export function sinaisVistos(estado: Pick<EstadoPaciente, 'sinais' | 'lab' | 'oxigenio' | 'clinico'>): SinaisVitais {
  const o = oxigenar({ spo2Ar: estado.sinais.spo2, oxigenio: estado.oxigenio, pco2: estado.lab.pco2, padrao: estado.clinico.padraoRespiratorio });
  return { ...estado.sinais, spo2: Math.round(o.spo2 * 10) / 10 };
}
