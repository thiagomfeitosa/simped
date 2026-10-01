/**
 * Registro completo da sessão (B12): tudo o que acontece num caso vira um registro com horário real
 * e minuto do caso — o aluno escreve e corrige itens, confere, administra, pede exame, checa horário,
 * anota balanço, escreve no rascunho; o professor altera sinais ou dispara complicação.
 *
 * O estado da tela (folha, receita, paciente, exames, balanço...) é sempre RECALCULADO a partir
 * da lista de registros. Por isso dá para:
 * - rever o caso passo a passo depois (B12);
 * - salvar e continuar de onde parou (B13);
 * - mandar os registros para outra janela/computador (professor, modo online — B14/B15).
 *
 * Sem tela e sem relógio de verdade: a hora real entra pronta em cada registro.
 */

import { type EstadoClinico, NOME_PADRAO_RESPIRATORIO, NOME_RITMO, type NomeSinal, type SinaisVitais } from '../casos/tipos';
import type { PedidoExame } from '../exames/exames';
import type { Infusao, RegistroManual } from '../motor/balanco';
import { acrescentarEvento, type AvaliacaoDoseEvento, type EventoPaciente } from '../motor/paciente';
import type { Checagem } from '../prescricao/aprazamento';
import { type AcaoPrescricao, type EstadoPrescricao, prescricaoVazia, reduzirPrescricao } from '../prescricao/estado';
import { type CamposReceita, type ItemReceita, receitaVazia } from '../prescricao/receita';

export type Autor = 'aluno' | 'professor';

/** O que pode acontecer numa sessão. */
export type AcaoSessao =
  /** Escrever, editar ou apagar itens da folha (as mesmas ações da folha). */
  | { tipo: 'prescricao'; acao: AcaoPrescricao }
  | { tipo: 'receitaAdicionar' }
  | { tipo: 'receitaEditar'; id: number; campos: CamposReceita }
  | { tipo: 'receitaRemover'; id: number }
  | { tipo: 'rascunho'; texto: string }
  /** O relógio do caso andou. */
  | { tipo: 'tempo'; minutos: number }
  /** Medicação (ou soro) dada ao paciente; vazão em mL/h entra no balanço hídrico. */
  | { tipo: 'administrar'; medicacaoId: string; descricao: string; vazaoMlH?: number; avaliacao?: AvaliacaoDoseEvento }
  /** Dose checada no quadro de horários da enfermagem. */
  | { tipo: 'checarDose'; itemId: number; minutoMarcado: number; medicacaoId: string; descricao: string; avaliacao?: AvaliacaoDoseEvento }
  | { tipo: 'pedirExame'; exameId: string; nome: string }
  | { tipo: 'balanco'; registro: Omit<RegistroManual, 'id' | 'minuto'> }
  /** O aluno abriu a conferência de um item (só registra). */
  | { tipo: 'conferir'; itemId: number; descricao: string }
  /** O aluno abriu o relatório final (só registra). */
  | { tipo: 'relatorio' }
  /** Professor: muda sinais vitais na hora. */
  | { tipo: 'professorSinais'; sinais: Partial<SinaisVitais>; clinico?: Partial<EstadoClinico>; motivo?: string }
  /** Professor: complicação pronta (ex.: "Convulsão"); os sinais mudam aos poucos. */
  | {
      tipo: 'complicacao';
      id: string;
      nome: string;
      mudancas: { sinal: NomeSinal; alvo: number; duracaoMin: number; modo?: 'alvo' | 'soma' }[];
      clinico?: Partial<EstadoClinico>;
    }
  /** Professor: mensagem que aparece para o aluno. */
  | { tipo: 'mensagem'; texto: string };

export interface RegistroSessao {
  /** Número do registro (1, 2, 3...). */
  n: number;
  /** Data e hora real (ISO). */
  horaReal: string;
  /** Minuto do relógio do caso em que aconteceu. */
  minutoCaso: number;
  autor: Autor;
  acao: AcaoSessao;
}

export interface MensagemProfessor {
  minutoCaso: number;
  texto: string;
}

export interface EstadoSessao {
  prescricao: EstadoPrescricao;
  receita: ItemReceita[];
  rascunho: string;
  /** Eventos do motor do paciente (src/motor/paciente.ts). */
  eventosPaciente: EventoPaciente[];
  checagens: Checagem[];
  infusoes: Infusao[];
  registrosBalanco: RegistroManual[];
  pedidos: PedidoExame[];
  mensagens: MensagemProfessor[];
  /** Minuto atual do relógio do caso. */
  minutoCaso: number;
}

export function sessaoVazia(): EstadoSessao {
  return {
    prescricao: prescricaoVazia(),
    receita: [],
    rascunho: '',
    eventosPaciente: [],
    checagens: [],
    infusoes: [],
    registrosBalanco: [],
    pedidos: [],
    mensagens: [],
    minutoCaso: 0,
  };
}

function comPaciente(estado: EstadoSessao, evento: EventoPaciente): EstadoSessao {
  return { ...estado, eventosPaciente: acrescentarEvento(estado.eventosPaciente, evento) };
}

/** Aplica um registro ao estado (função pura). */
export function aplicarRegistro(estado: EstadoSessao, registro: Pick<RegistroSessao, 'acao' | 'autor'>): EstadoSessao {
  const a = registro.acao;
  const agora = estado.minutoCaso;
  switch (a.tipo) {
    case 'prescricao':
      return { ...estado, prescricao: reduzirPrescricao(estado.prescricao, a.acao) };
    case 'receitaAdicionar': {
      const id = estado.receita.reduce((max, i) => Math.max(max, i.id), 0) + 1;
      return { ...estado, receita: [...estado.receita, { id, campos: receitaVazia() }] };
    }
    case 'receitaEditar':
      return { ...estado, receita: estado.receita.map((i) => (i.id === a.id ? { ...i, campos: a.campos } : i)) };
    case 'receitaRemover':
      return { ...estado, receita: estado.receita.filter((i) => i.id !== a.id) };
    case 'rascunho':
      return { ...estado, rascunho: a.texto };
    case 'tempo': {
      const minutos = Math.max(0, Math.floor(a.minutos));
      if (minutos === 0) return estado;
      return { ...comPaciente(estado, { tipo: 'tempoPassou', minutos }), minutoCaso: agora + minutos };
    }
    case 'administrar': {
      const novo = comPaciente(estado, {
        tipo: 'medicacaoAdministrada',
        medicacaoId: a.medicacaoId,
        descricao: a.descricao,
        ...(a.avaliacao && { avaliacao: a.avaliacao }),
      });
      if (a.vazaoMlH === undefined || !(a.vazaoMlH > 0)) return novo;
      const infusao: Infusao = { id: estado.infusoes.length + 1, descricao: a.descricao.slice(0, 60), inicioMin: agora, vazaoMlH: a.vazaoMlH };
      return { ...novo, infusoes: [...estado.infusoes, infusao] };
    }
    case 'checarDose': {
      const checagem: Checagem = { itemId: a.itemId, minutoMarcado: a.minutoMarcado, feitaNoMinuto: agora };
      return {
        ...comPaciente(estado, {
          tipo: 'medicacaoAdministrada',
          medicacaoId: a.medicacaoId,
          descricao: a.descricao,
          ...(a.avaliacao && { avaliacao: a.avaliacao }),
        }),
        checagens: [...estado.checagens, checagem],
      };
    }
    case 'pedirExame': {
      const pedido: PedidoExame = { id: estado.pedidos.length + 1, exameId: a.exameId, pedidoNoMinuto: agora };
      const comPedido = { ...estado, pedidos: [...estado.pedidos, pedido] };
      const comFolha = { ...comPedido, prescricao: reduzirPrescricao(comPedido.prescricao, { tipo: 'adicionar', secao: 'exames', texto: a.nome }) };
      return comPaciente(comFolha, { tipo: 'anotacao', descricao: `Exame pedido: ${a.nome}` });
    }
    case 'balanco':
      return {
        ...estado,
        registrosBalanco: [...estado.registrosBalanco, { ...a.registro, id: estado.registrosBalanco.length + 1, minuto: agora }],
      };
    case 'conferir':
    case 'relatorio':
      return estado;
    case 'professorSinais': {
      const novo = comPaciente(estado, { tipo: 'professorAlterouSinais', sinais: a.sinais, ...(a.clinico && { clinico: a.clinico }) });
      return a.motivo ? comPaciente(novo, { tipo: 'anotacao', descricao: `Professor: ${a.motivo}` }) : novo;
    }
    case 'complicacao':
      return comPaciente(estado, { tipo: 'complicacao', nome: a.nome, mudancas: a.mudancas, ...(a.clinico && { clinico: a.clinico }) });
    case 'mensagem':
      return {
        ...comPaciente(estado, { tipo: 'anotacao', descricao: `Mensagem do professor: ${a.texto}` }),
        mensagens: [...estado.mensagens, { minutoCaso: agora, texto: a.texto }],
      };
  }
}

/** Reconstrói a sessão inteira a partir dos registros (até o registro `ate`, se informado). */
export function reproduzirSessao(registros: readonly RegistroSessao[], ate = registros.length): EstadoSessao {
  return registros.slice(0, ate).reduce(aplicarRegistro, sessaoVazia());
}

/**
 * Duas ações "do mesmo tipo e no mesmo lugar" seguidas viram um registro só:
 * digitar no rascunho letra por letra, editar o mesmo item campo a campo, o relógio andando minuto a minuto.
 * O resultado (estado) é o mesmo; a lista só não cresce a cada tecla.
 */
function juntaComAnterior(anterior: RegistroSessao, nova: AcaoSessao, autor: Autor): AcaoSessao | null {
  if (anterior.autor !== autor) return null;
  const a = anterior.acao;
  if (a.tipo === 'rascunho' && nova.tipo === 'rascunho') return nova;
  if (a.tipo === 'tempo' && nova.tipo === 'tempo') return { tipo: 'tempo', minutos: a.minutos + nova.minutos };
  if (a.tipo === 'receitaEditar' && nova.tipo === 'receitaEditar' && a.id === nova.id) return nova;
  if (a.tipo === 'prescricao' && nova.tipo === 'prescricao') {
    const x = a.acao;
    const y = nova.acao;
    const mesmoItem = 'id' in x && 'id' in y && x.id === y.id && x.secao === y.secao;
    if (mesmoItem && x.tipo === y.tipo && (x.tipo === 'editar' || x.tipo === 'editarMedicacao' || x.tipo === 'editarSoro')) return nova;
  }
  return null;
}

/** Acrescenta uma ação ao registro (juntando com a anterior quando for o caso). */
export function registrar(
  registros: readonly RegistroSessao[],
  acao: AcaoSessao,
  contexto: { horaReal: Date; minutoCaso: number; autor?: Autor },
): RegistroSessao[] {
  const autor = contexto.autor ?? 'aluno';
  const ultimo = registros[registros.length - 1];
  if (ultimo) {
    const junta = juntaComAnterior(ultimo, acao, autor);
    if (junta) return [...registros.slice(0, -1), { ...ultimo, acao: junta, horaReal: contexto.horaReal.toISOString() }];
  }
  return [
    ...registros,
    { n: (ultimo?.n ?? 0) + 1, horaReal: contexto.horaReal.toISOString(), minutoCaso: contexto.minutoCaso, autor, acao },
  ];
}

/** Sessão em uso: a lista de registros e o estado já calculado (para não recalcular tudo a cada tecla). */
export interface Sessao {
  registros: RegistroSessao[];
  estado: EstadoSessao;
}

export function iniciarSessao(registros: readonly RegistroSessao[] = []): Sessao {
  return { registros: [...registros], estado: reproduzirSessao(registros) };
}

/**
 * Faz uma ação na sessão: acrescenta o registro e aplica no estado.
 * Dá exatamente o mesmo resultado que reproduzir a lista inteira (está nos testes).
 */
export function fazerNaSessao(sessao: Sessao, acao: AcaoSessao, horaReal: Date, autor: Autor = 'aluno'): Sessao {
  if (acao.tipo === 'tempo' && !(Math.floor(acao.minutos) > 0)) return sessao;
  return {
    registros: registrar(sessao.registros, acao, { horaReal, minutoCaso: sessao.estado.minutoCaso, autor }),
    estado: aplicarRegistro(sessao.estado, { acao, autor }),
  };
}

const NOME_SECAO_CURTO: Record<string, string> = {
  oxigenoterapia: 'oxigenoterapia',
  dieta: 'dieta',
  volemia: 'seção 4',
  antimicrobianos: 'seção 5',
  medicacoes: 'seção 6',
  exames: 'exames',
  cuidados: 'cuidados',
  sinan: 'SINAN',
};

const NOME_SINAL: Record<NomeSinal, string> = {
  fc: 'FC',
  fr: 'FR',
  spo2: 'SpO₂',
  paSistolica: 'PAS',
  paDiastolica: 'PAD',
  temperaturaC: 'Temp.',
  glicemiaMgDl: 'Glicemia',
  tecS: 'TEC',
  glasgow: 'Glasgow',
};

/** Texto curto de um registro, para a lista "rever o caso". */
export function descreverRegistro(r: RegistroSessao): string {
  const a = r.acao;
  switch (a.tipo) {
    case 'prescricao': {
      const x = a.acao;
      if (x.tipo === 'limpar') return 'Limpou a folha';
      const onde = NOME_SECAO_CURTO[x.secao] ?? x.secao;
      switch (x.tipo) {
        case 'adicionar':
          return x.texto ? `Escreveu em ${onde}: ${x.texto}` : `Novo item em texto (${onde})`;
        case 'editar':
          return `Escreveu em ${onde}: ${x.texto}`;
        case 'adicionarMedicacao':
          return `Novo item de medicação (${onde})`;
        case 'editarMedicacao':
          return `Preencheu medicação (${onde}): ${[x.campos.medicacaoId, x.campos.dose && `${x.campos.dose} ${x.campos.unidadeDose}`].filter(Boolean).join(' ')}`;
        case 'adicionarSoro':
          return `Novo soro (${onde})`;
        case 'editarSoro':
          return `Montou o soro (${onde})`;
        case 'remover':
          return `Apagou um item (${onde})`;
      }
      return 'Mexeu na folha';
    }
    case 'receitaAdicionar':
      return 'Novo item na receita de alta';
    case 'receitaEditar':
      return `Preencheu a receita: ${a.campos.medicacaoId || 'medicação'}`;
    case 'receitaRemover':
      return 'Apagou item da receita';
    case 'rascunho':
      return 'Escreveu no rascunho de cálculos';
    case 'tempo':
      return `Relógio do caso: +${a.minutos} min`;
    case 'administrar':
      return `Administrou: ${a.descricao}${a.avaliacao && a.avaliacao.nivel !== 'certa' ? ` (${a.avaliacao.nivel === 'subdose' ? 'dose abaixo da faixa' : 'dose acima da faixa'})` : ''}`;
    case 'checarDose':
      return `Checou dose no horário: ${a.descricao}`;
    case 'pedirExame':
      return `Pediu exame: ${a.nome}`;
    case 'balanco':
      return `Balanço: ${a.registro.tipo === 'entrada' ? 'entrada' : 'saída'} ${a.registro.volumeMl} mL (${a.registro.descricao})`;
    case 'conferir':
      return `Conferiu o item ${a.itemId}: ${a.descricao}`;
    case 'relatorio':
      return 'Abriu o relatório';
    case 'professorSinais': {
      const partes = [
        ...Object.entries(a.sinais).map(([s, v]) => `${NOME_SINAL[s as NomeSinal]} ${Math.round(Number(v) * 10) / 10}`),
        ...(a.clinico?.ritmo ? [NOME_RITMO[a.clinico.ritmo]] : []),
        ...(a.clinico?.padraoRespiratorio ? [NOME_PADRAO_RESPIRATORIO[a.clinico.padraoRespiratorio]] : []),
      ];
      return `Professor alterou ${partes.join(', ')}${a.motivo ? ` (${a.motivo})` : ''}`;
    }
    case 'complicacao':
      return `Professor disparou complicação: ${a.nome}`;
    case 'mensagem':
      return `Mensagem do professor: ${a.texto}`;
  }
}

// ---- Salvar e continuar (B13) -------------------------------------------------

export interface SessaoGuardada {
  versao: 1;
  casoId: string;
  casoTitulo: string;
  iniciadaEm: string;
  salvaEm: string;
  registros: RegistroSessao[];
}

export function guardarSessao(casoId: string, casoTitulo: string, registros: readonly RegistroSessao[], agora: Date): SessaoGuardada {
  return {
    versao: 1,
    casoId,
    casoTitulo,
    iniciadaEm: registros[0]?.horaReal ?? agora.toISOString(),
    salvaEm: agora.toISOString(),
    registros: [...registros],
  };
}

function ehRegistro(x: unknown): x is RegistroSessao {
  if (!x || typeof x !== 'object') return false;
  const r = x as RegistroSessao;
  return (
    typeof r.n === 'number' &&
    typeof r.horaReal === 'string' &&
    typeof r.minutoCaso === 'number' &&
    (r.autor === 'aluno' || r.autor === 'professor') &&
    !!r.acao &&
    typeof r.acao === 'object' &&
    typeof r.acao.tipo === 'string'
  );
}

/** Lê uma sessão guardada; devolve null se não houver ou se estiver estragada. */
export function lerSessaoGuardada(texto: string | null): SessaoGuardada | null {
  if (!texto) return null;
  try {
    const s = JSON.parse(texto) as SessaoGuardada;
    if (s?.versao !== 1 || typeof s.casoId !== 'string' || !Array.isArray(s.registros)) return null;
    const registros = s.registros.filter(ehRegistro);
    // testa se a lista reproduz sem erro (ex.: arquivo de versão antiga)
    reproduzirSessao(registros);
    return { ...s, registros };
  } catch {
    return null;
  }
}

/** Vale a pena perguntar "continuar?" (houve trabalho de verdade, não só o relógio andando)? */
export function temTrabalho(registros: readonly RegistroSessao[]): boolean {
  return registros.some((r) => r.acao.tipo !== 'tempo' && r.acao.tipo !== 'relatorio');
}
