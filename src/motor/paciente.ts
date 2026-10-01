/**
 * Motor do paciente: estado + eventos (CLAUDE.md, "Arquitetura").
 * Função pura: (estado, evento) → novo estado. A mesma lista de eventos sempre gera o mesmo paciente,
 * o que permite, no futuro, o professor enviar eventos pela rede (modo online).
 *
 * O motor não sabe nada de farmacologia: quanto cada sinal muda vem do arquivo do caso.
 */

import type { CasoClinico, MudancaDeSinal, NomeSinal, SinaisVitais } from '../casos/tipos';

export type EventoPaciente =
  | { tipo: 'tempoPassou'; minutos: number }
  | { tipo: 'medicacaoAdministrada'; medicacaoId: string; descricao: string }
  | { tipo: 'professorAlterouSinais'; sinais: Partial<SinaisVitais> };

/** Mudança agendada ou em andamento num sinal. */
interface MudancaAtiva {
  sinal: NomeSinal;
  alvo: number;
  inicioMin: number;
  fimMin: number;
  /** Valor do sinal no momento em que a mudança começou (preenchido ao começar). */
  valorInicial?: number;
}

export interface RegistroDeEvento {
  tempoMin: number;
  descricao: string;
}

export interface EstadoPaciente {
  tempoMin: number;
  sinais: SinaisVitais;
  mudancas: MudancaAtiva[];
  registro: RegistroDeEvento[];
}

function agendar(mudancas: readonly MudancaDeSinal[], agoraMin: number): MudancaAtiva[] {
  return mudancas.map((m) => ({
    sinal: m.sinal,
    alvo: m.alvo,
    inicioMin: agoraMin + m.atrasoMin,
    fimMin: agoraMin + m.atrasoMin + m.duracaoMin,
  }));
}

export function iniciarPaciente(caso: CasoClinico): EstadoPaciente {
  const inicial: EstadoPaciente = {
    tempoMin: 0,
    sinais: { ...caso.sinaisIniciais },
    mudancas: agendar(caso.evolucaoNatural ?? [], 0),
    registro: [{ tempoMin: 0, descricao: 'Início do caso' }],
  };
  // aplica o que começa já no minuto 0 (ex.: mudança imediata)
  return avancarUmMinuto(inicial, 0);
}

/**
 * Atualiza os sinais no minuto `t`:
 * - mudança que começa agora guarda o valor atual e substitui as mais antigas do mesmo sinal;
 * - mudança em andamento leva o sinal em linha reta até o alvo;
 * - mudança terminada fixa o alvo e sai da lista.
 */
function avancarUmMinuto(estado: EstadoPaciente, t: number): EstadoPaciente {
  const sinais = { ...estado.sinais };
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
    ativas = [...ativas.filter((outra) => outra.sinal !== m.sinal), m];
    aplicarMudanca(sinais, m, t);
  }

  // 3. mudanças terminadas saem da lista (o sinal fica no alvo)
  const restantes = [...ativas.filter((m) => t < m.fimMin), ...aindaAguardando];
  return { ...estado, tempoMin: t, sinais, mudancas: restantes };
}

/** Leva o sinal em linha reta do valor inicial até o alvo, conforme o minuto t. */
function aplicarMudanca(sinais: SinaisVitais, m: MudancaAtiva, t: number): void {
  const inicial = m.valorInicial ?? sinais[m.sinal];
  if (t >= m.fimMin) {
    sinais[m.sinal] = m.alvo;
  } else {
    const fracao = (t - m.inicioMin) / (m.fimMin - m.inicioMin);
    sinais[m.sinal] = inicial + (m.alvo - inicial) * fracao;
  }
}

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
      const registro = [
        ...estado.registro,
        {
          tempoMin: estado.tempoMin,
          descricao: resposta
            ? `Administrado: ${evento.descricao}`
            : `Administrado: ${evento.descricao} (sem efeito definido neste caso)`,
        },
      ];
      const mudancas = resposta
        ? [...estado.mudancas, ...agendar(resposta.mudancas, estado.tempoMin)]
        : estado.mudancas;
      return avancarUmMinuto({ ...estado, mudancas, registro }, estado.tempoMin);
    }

    case 'professorAlterouSinais': {
      const alterados = Object.keys(evento.sinais) as NomeSinal[];
      return {
        ...estado,
        sinais: { ...estado.sinais, ...evento.sinais },
        // o professor manda: mudanças em andamento nesses sinais são canceladas
        mudancas: estado.mudancas.filter((m) => !alterados.includes(m.sinal)),
        registro: [
          ...estado.registro,
          { tempoMin: estado.tempoMin, descricao: `Professor alterou: ${alterados.join(', ')}` },
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
