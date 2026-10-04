/**
 * Cena animada da RCP (sem tela): o que cada membro da equipe está fazendo AGORA, para a animação
 * que todos veem (alunos, líder e professor). Tudo sai da sala (eventos + marcas da RCP + relógio):
 * cada tela calcula a mesma cena a partir da mesma lista, então as janelas ficam iguais sem mandar
 * nada a mais. A tela só desenha (src/telas/parada/CenaRcp.tsx).
 *
 * Como a cena é função do tempo, o debriefing pode "rever" o código: é só pedir a cena num tempo passado.
 * Técnica de compressão e faixas etárias: src/dados/parada-cena-a-validar.ts (A VALIDAR).
 */

import { type CenarioParada, DROGAS_PARADA } from '../dados/parada-a-validar';
import { PAPEIS_EQUIPE } from '../dados/parada-briefing-a-validar';
import { FAIXAS_CENA, TECNICA_POR_FAIXA, TEMPOS_CENA as T } from '../dados/parada-cena-a-validar';
import { RCP } from '../dados/parada-rcp-a-validar';
import type { TomDePele } from '../neonatal/exame';
import { formatarNumero } from '../prescricao/comum';
import { type AvisoTempo, ehViaAvancada, type EstadoParada, type EventoParada } from './parada';
import type { EstadoRcp, FaixaRitmo, MarcaRcp } from './rcp';
import type { Membro } from './sala';

/** Como o paciente é desenhado (tamanho do corpo, técnica de compressão). */
export type FaixaPaciente = 'rn' | 'lactente' | 'crianca' | 'adolescente';

/** Técnica de compressão mostrada na animação. */
export type TecnicaCompressao = 'dois-polegares' | 'uma-mao' | 'duas-maos';

/** Cabelo do avatar. */
export type Cabelo = 'curto' | 'raspado' | 'cacheado' | 'longo' | 'preso';

/** Aparência do avatar de um membro (escolhida no "Preparar"; sem escolha, sai uma pelo papel). */
export interface AparenciaAvatar {
  pele: TomDePele;
  cabelo: Cabelo;
  /** Cor do jaleco/pijama (hex, ex.: "#6b3fa0"). */
  roupa: string;
}

/** Lugar de cada um em volta da maca (a tela converte em coordenadas). */
export type LugarNaCena =
  | 'torax' // quem comprime (atrás da maca, sobre o tórax)
  | 'cabeca' // via aérea (na cabeceira)
  | 'acesso' // medicação (do lado de cá da maca, no braço ou na perna)
  | 'desfibrilador' // monitor e desfibrilador (ao lado do carrinho)
  | 'pes' // líder (aos pés da maca, de olho em tudo)
  | 'espera' // 2º compressor esperando a troca (perto do tórax)
  | 'tempo' // cronometrista (ao fundo)
  | 'registro'; // anotação (ao fundo, com a prancheta)

/** O que o avatar está fazendo. `fase` (0 a 1) diz em que ponto do movimento ele está. */
export type AcaoAvatar =
  | 'parado' // de pé, pronto
  | 'comprimindo' // mãos no tórax; fase = quanto o tórax está afundado (0 em cima, 1 no fundo)
  | 'maos-no-torax' // compressor da vez com as mãos no tórax, mas sem comprimir (pausa)
  | 'ventilando' // aperta a bolsa; fase = quanto a bolsa está apertada
  | 'segurando-mascara' // via aérea entre as ventilações (máscara ou tubo)
  | 'intubando' // laringoscópio; fase = progresso
  | 'puncionando' // pegando o acesso (EV/IO); fase = progresso
  | 'injetando' // seringa no acesso; fase = progresso do êmbolo
  | 'carregando' // mão no desfibrilador carregando
  | 'chocando' // apertou o choque
  | 'maos-ao-alto' // "afastem-se!" (desfibrilador carregado)
  | 'olhando-monitor' // checagem de ritmo
  | 'cronometrando' // olha o relógio
  | 'anotando'; // escreve na prancheta

export interface AvatarNaCena {
  /** Papel da equipe (src/dados/parada-briefing-a-validar.ts). */
  papel: string;
  /** Nome do membro (ou do papel, se não tiver nome). */
  nome: string;
  lugar: LugarNaCena;
  acao: AcaoAvatar;
  /** 0 a 1 (ver AcaoAvatar). */
  fase: number;
  aparencia: AparenciaAvatar;
  /** Fala em balão (ordem do líder, "Entendido!", aviso do tempo, dose em voz alta...). */
  balao?: string;
  /** Ritmo das compressões deste avatar (só de quem comprime, com as teclas). */
  ritmo?: FaixaRitmo;
}

export interface CenaRcp {
  faixa: FaixaPaciente;
  tecnica: TecnicaCompressao;
  /** Tom de pele do paciente (sai do cenário, fixo). */
  pelePaciente: TomDePele;
  /** Tórax afundado agora (0 a 1). */
  compressao: number;
  /** Tórax subindo com a ventilação agora (0 a 1). */
  expansao: number;
  /** Máscara (bolsa-válvula-máscara) ou tubo (via aérea avançada). */
  viaAerea: 'mascara' | 'tubo';
  /** Acesso já colocado (e onde). */
  acesso?: 'periferico' | 'intraosseo';
  /** Retorno da circulação: a pele fica corada e o tórax se mexe sozinho. */
  rce: boolean;
  /** Choque agora (1 no instante do choque, cai a 0 em ~0,6 s): clarão e o corpo dá um tranco. */
  choque: number;
  /** Desfibrilador carregado: aviso "afastem-se". */
  carregado: boolean;
  /** Pausa da checagem de ritmo (mãos fora do tórax, todos olham o monitor). */
  checandoRitmo: boolean;
  /** Código ainda não começou ou já terminou (todos parados). */
  ativo: boolean;
  avatares: AvatarNaCena[];
  /** Texto curto do que acontece agora (legenda e leitor de tela). Ex.: "Ana comprime (112/min) · Bruno ventila". */
  legenda: string;
}

export interface EntradaCena {
  cenario: CenarioParada;
  eventos: readonly EventoParada[];
  marcas: readonly MarcaRcp[];
  /** Tempo do código no instante desenhado (s). Pode ser fracionado (animação a 60 quadros/s). */
  tS: number;
  membros: Readonly<Record<string, Membro>>;
  /** Estado do código em tS (src/parada/parada.ts). */
  estado: EstadoParada;
  /** Estado da RCP pelas teclas (null = RCP automática: a cena inventa as compressões no ritmo certo). */
  rcp: EstadoRcp | null;
  relacao: number;
  compressorDaVez: 'compressor-1' | 'compressor-2';
  /** Relógio pausado: a cena congela (sem compressões automáticas). */
  pausado: boolean;
}

/** Cores de roupa para escolher (hex) e o nome de cada cabelo — usados no "Preparar". */
export const CORES_ROUPA: readonly { cor: string; nome: string }[] = [
  { cor: '#6b3fa0', nome: 'Roxo' },
  { cor: '#2f6fb3', nome: 'Azul' },
  { cor: '#1f8a70', nome: 'Verde' },
  { cor: '#c2410c', nome: 'Laranja' },
  { cor: '#be185d', nome: 'Rosa' },
  { cor: '#475569', nome: 'Cinza' },
  { cor: '#f1f5f9', nome: 'Branco (jaleco)' },
];

export const NOME_CABELO: Record<Cabelo, string> = { curto: 'Curto', raspado: 'Raspado', cacheado: 'Cacheado', longo: 'Longo', preso: 'Preso' };

/** Aparência padrão de cada papel: cada um diferente (pele, cabelo e roupa), sempre a mesma em todas as telas. */
const APARENCIA_DO_PAPEL: Record<string, AparenciaAvatar> = {
  lider: { pele: 'moreno', cabelo: 'curto', roupa: CORES_ROUPA[0]!.cor },
  'compressor-1': { pele: 'negro', cabelo: 'raspado', roupa: CORES_ROUPA[1]!.cor },
  'compressor-2': { pele: 'claro', cabelo: 'preso', roupa: CORES_ROUPA[2]!.cor },
  'via-aerea': { pele: 'claro', cabelo: 'cacheado', roupa: CORES_ROUPA[3]!.cor },
  medicacao: { pele: 'negro', cabelo: 'longo', roupa: CORES_ROUPA[4]!.cor },
  monitor: { pele: 'moreno', cabelo: 'raspado', roupa: CORES_ROUPA[5]!.cor },
  tempo: { pele: 'negro', cabelo: 'cacheado', roupa: CORES_ROUPA[6]!.cor },
  registro: { pele: 'claro', cabelo: 'longo', roupa: CORES_ROUPA[1]!.cor },
};

const TONS: readonly TomDePele[] = ['claro', 'moreno', 'negro'];
const CABELOS: readonly Cabelo[] = ['curto', 'raspado', 'cacheado', 'longo', 'preso'];

/** Aparência padrão de cada papel (sempre a mesma em todas as telas; papel desconhecido: sai do nome). */
export function aparenciaPadrao(papel: string): AparenciaAvatar {
  const conhecida = APARENCIA_DO_PAPEL[papel];
  if (conhecida) return { ...conhecida };
  let h = 0;
  for (const c of papel) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { pele: TONS[h % TONS.length]!, cabelo: CABELOS[h % CABELOS.length]!, roupa: CORES_ROUPA[h % CORES_ROUPA.length]!.cor };
}

/** Aparência que vale para o membro (a escolhida ou a padrão do papel). */
export function aparenciaDoMembro(papel: string, membro: Membro | undefined): AparenciaAvatar {
  return membro?.avatar ?? aparenciaPadrao(papel);
}

// ---- Faixa do paciente --------------------------------------------------------------------

/** Faixa em que o paciente é desenhado, pela idade do cenário (A VALIDAR). */
export function faixaDoPaciente(cenario: CenarioParada): FaixaPaciente {
  const F = FAIXAS_CENA;
  if (cenario.idadeAnos * 365.25 < F.rnMenosDeDias) return 'rn';
  if (cenario.idadeAnos < F.lactenteMenosDeAnos) return 'lactente';
  if (cenario.idadeAnos >= F.adolescenteAPartirDeAnos || cenario.relacaoCompressaoVentilacao === F.relacaoDeAdolescente) return 'adolescente';
  return 'crianca';
}

// ---- Movimentos (0 a 1) -------------------------------------------------------------------

const limitar = (x: number) => Math.min(1, Math.max(0, x));
const suave = (x: number) => {
  const y = limitar(x);
  return y * y * (3 - 2 * y);
};

/** Tórax afundado `dt` s depois de uma compressão: desce rápido e volta todo (retorno total). */
export function afundamento(dt: number): number {
  if (dt < 0) return 0;
  if (dt < T.descidaCompressaoS) return suave(dt / T.descidaCompressaoS);
  const subida = dt - T.descidaCompressaoS;
  return subida < T.subidaCompressaoS ? 1 - suave(subida / T.subidaCompressaoS) : 0;
}

/** Bolsa apertada (e tórax subindo) `dt` s depois do início de uma ventilação. */
export function insuflacao(dt: number): number {
  return dt < 0 || dt >= T.ventilacaoS ? 0 : Math.sin((Math.PI * dt) / T.ventilacaoS);
}

// ---- Marcas da RCP (milhares: nada de ordenar a cada quadro) ------------------------------

/** Índice da última marca com tS ≤ t (as marcas da sala vêm em ordem de tempo); -1 se nenhuma. */
function ultimaAte(marcas: readonly MarcaRcp[], t: number): number {
  let lo = 0;
  let hi = marcas.length - 1;
  let r = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (marcas[m]!.tS <= t) {
      r = m;
      lo = m + 1;
    } else hi = m - 1;
  }
  return r;
}

/** Primeira marca de cada papel ("por:papel") e de cada tipo ("tipo:compressao"), guardada por lista. */
const primeiras = new WeakMap<readonly MarcaRcp[], Map<string, number>>();

function primeirasMarcas(marcas: readonly MarcaRcp[]): Map<string, number> {
  let r = primeiras.get(marcas);
  if (!r) {
    r = new Map();
    for (const m of marcas) {
      for (const chave of [`tipo:${m.tipo}`, ...(m.por ? [`por:${m.por}`] : [])]) {
        const antes = r.get(chave);
        if (antes === undefined || m.tS < antes) r.set(chave, m.tS);
      }
    }
    primeiras.set(marcas, r);
  }
  return r;
}

// ---- RCP automática (sem teclas) -----------------------------------------------------------

interface RcpInventada {
  compressao: number;
  /** Mãos comprimindo agora (fora da pausa para ventilar). */
  comprimindo: boolean;
  /** Compressão da série (modo sincronizado). */
  serie?: number;
  /** Bolsa apertada agora (0 a 1). */
  ventilacao: number;
}

/** Compressões a 110/min desde `baseS`: em séries de `relacao` com pausa para 2 ventilações, ou contínuas com via aérea avançada. */
function rcpInventada(dt: number, relacao: number, continua: boolean): RcpInventada {
  const periodo = 60 / T.automaticaPorMin;
  if (continua) {
    const i = Math.floor(dt / periodo);
    return { compressao: afundamento(dt - i * periodo), comprimindo: true, ventilacao: insuflacao(dt % T.ventilacaoComViaCadaS) };
  }
  const serieS = relacao * periodo;
  const u = dt % (serieS + T.pausaVentilacoesS);
  if (u < serieS) {
    const i = Math.floor(u / periodo);
    return { compressao: afundamento(u - i * periodo), comprimindo: true, serie: i + 1, ventilacao: 0 };
  }
  // pausa: as ventilações espalhadas por igual
  const n = RCP.ventilacoesPorPausa;
  const folga = Math.max(0, (T.pausaVentilacoesS - n * T.ventilacaoS) / (n + 1));
  const w = u - serieS;
  let ventilacao = 0;
  for (let j = 0; j < n; j++) ventilacao = Math.max(ventilacao, insuflacao(w - folga - j * (T.ventilacaoS + folga)));
  return { compressao: 0, comprimindo: false, serie: relacao, ventilacao };
}

// ---- Montagem -------------------------------------------------------------------------------

/** Quem vence quando duas coisas acontecem com o mesmo avatar (empate: a mais recente). */
const PRIORIDADE = { parado: 0, rcp: 1, checagem: 2, acao: 3, choque: 4 } as const;

interface Gesto {
  acao: AcaoAvatar;
  fase: number;
  prioridade: number;
  desde: number;
}

/** Papéis que sempre aparecem; os outros (2º compressor, tempo, anotação) só com nome ou depois de agir. */
const ESSENCIAIS: readonly string[] = ['lider', 'compressor-1', 'via-aerea', 'medicacao', 'monitor'];

const LUGAR_DO_PAPEL: Record<string, LugarNaCena> = {
  lider: 'pes',
  'via-aerea': 'cabeca',
  medicacao: 'acesso',
  monitor: 'desfibrilador',
  tempo: 'tempo',
  registro: 'registro',
};

const TEXTO_AVISO: Record<AvisoTempo, string> = {
  'checar-ritmo': '2 minutos: checar o ritmo e trocar!',
  adrenalina: 'Hora da adrenalina!',
};

const TEXTO_FAIXA: Record<FaixaRitmo, string> = { boa: 'no ritmo', lenta: 'lento', rapida: 'rápido' };

const n = formatarNumero;
/** Espaço que não quebra: a dose nunca fica separada da unidade ("2" numa linha e "mL" na outra). */
const NBSP = '\u00a0';

/** Acesso intraósseo pela descrição ("Acesso intraósseo (IO)"). */
const ehIntraosseo = (descricao: string) => /intra[óo]sse/i.test(descricao) || /\bIO\b/.test(descricao);

/** Monta a cena no tempo `tS` (função pura: mesma entrada, mesma cena em todas as telas). */
export function montarCena(en: EntradaCena): CenaRcp {
  const { cenario, estado, membros, tS, rcp } = en;
  const faixa = faixaDoPaciente(cenario);
  const ativo = estado.iniciada && !estado.encerrada;
  const rce = estado.rce && (estado.rceEmS === undefined || estado.rceEmS <= tS);
  const nomeDe = (papel: string) => membros[papel]?.nome.trim() || (PAPEIS_EQUIPE.find((p) => p.id === papel)?.nome ?? papel);

  // ---- eventos até tS (poucos: percorre todos, na ordem de tempo da sala) ----
  const gestos = new Map<string, Gesto>();
  const baloes = new Map<string, { texto: string; desde: number }>();
  const propor = (papel: string, acao: AcaoAvatar, fase: number, prioridade: number, desde: number) => {
    const g = gestos.get(papel);
    if (!g || prioridade > g.prioridade || (prioridade === g.prioridade && desde >= g.desde)) gestos.set(papel, { acao, fase: limitar(fase), prioridade, desde });
  };
  const falar = (papel: string, texto: string, desde: number, duracaoS: number = T.balaoS) => {
    if (tS - desde >= duracaoS) return;
    const b = baloes.get(papel);
    if (!b || desde >= b.desde) baloes.set(papel, { texto, desde });
  };

  const agiram = new Set<string>();
  const paraDaOrdem = new Map<string, string>();
  let inicioS: number | undefined;
  let checagem: { tS: number; por?: string } | undefined;
  /** Carga ou choque depois da última checagem (encerra a pausa da checagem). */
  let checagemInterrompidaS: number | undefined;
  let carga: { tS: number; joules: number } | undefined;
  let choque: { tS: number; joules: number } | undefined;
  let cargaCanceladaS: number | undefined;
  let viaAvancadaS: number | undefined;
  let intubacaoS: number | undefined;
  let acesso: CenaRcp['acesso'];
  let puncao: { tS: number; io: boolean } | undefined;
  let injecao: { tS: number; texto: string } | undefined;
  let anotouS: number | undefined;

  for (const e of en.eventos) {
    if (e.tS > tS) continue;
    if (e.por) agiram.add(e.por);
    switch (e.tipo) {
      case 'iniciar':
        inicioS ??= e.tS;
        falar('lider', 'Começar RCP!', e.tS);
        break;
      case 'ordem': {
        if (e.id) paraDaOrdem.set(e.id, e.para);
        const alvo = membros[e.para]?.nome.trim();
        falar('lider', alvo ? `${alvo}: ${e.texto}` : e.texto, e.tS);
        break;
      }
      case 'entendido': {
        const papel = e.por ?? paraDaOrdem.get(e.ordemId);
        if (papel) {
          agiram.add(papel);
          falar(papel, 'Entendido!', e.tS);
        }
        break;
      }
      case 'aviso':
        agiram.add('tempo');
        falar('tempo', TEXTO_AVISO[e.aviso], e.tS);
        break;
      case 'checarRitmo':
        checagem = { tS: e.tS, ...(e.por && { por: e.por }) };
        checagemInterrompidaS = undefined;
        break;
      case 'carga':
        if (checagem && checagemInterrompidaS === undefined) checagemInterrompidaS = e.tS;
        if (e.joules > 0) carga = { tS: e.tS, joules: e.joules };
        else {
          carga = undefined;
          cargaCanceladaS = e.tS;
        }
        break;
      case 'choque':
        if (checagem && checagemInterrompidaS === undefined) checagemInterrompidaS = e.tS;
        choque = { tS: e.tS, joules: e.joules };
        carga = undefined;
        break;
      case 'droga': {
        const nome = DROGAS_PARADA.find((d) => d.id === e.drogaId)?.nome ?? e.drogaId;
        injecao = { tS: e.tS, texto: `${nome} — ${n(e.volumeMl)}${NBSP}mL` };
        break;
      }
      case 'fluido':
        injecao = { tS: e.tS, texto: `SF 0,9% ${n(e.volumeMl)}${NBSP}mL` };
        break;
      case 'acesso': {
        const io = ehIntraosseo(e.descricao);
        puncao = { tS: e.tS, io };
        if (tS - e.tS >= T.acaoCurtaS) acesso = io ? 'intraosseo' : 'periferico';
        break;
      }
      case 'viaAerea':
        if (ehViaAvancada(e)) {
          viaAvancadaS ??= e.tS;
          intubacaoS = e.tS;
        }
        break;
      case 'anotacao':
      case 'anotado':
        agiram.add('registro');
        anotouS = e.tS;
        break;
      default:
        break;
    }
  }

  // ---- marcas da RCP: só as últimas (busca binária e volta poucos segundos) ----
  const teclas = rcp !== null;
  let ultCompressao: MarcaRcp | undefined;
  let ultVentilacao: MarcaRcp | undefined;
  if (teclas) {
    const janelaS = tS - Math.max(T.compressorNoToraxS, T.checagemMaximaS, T.ventilacaoS);
    for (let i = ultimaAte(en.marcas, tS); i >= 0; i--) {
      const m = en.marcas[i]!;
      if (m.tS < janelaS) break;
      if (!ultCompressao && m.tipo === 'compressao') ultCompressao = m;
      if (!ultVentilacao && m.tipo === 'ventilacao') ultVentilacao = m;
      if (ultCompressao && ultVentilacao) break;
    }
  }
  const primeirasM = primeirasMarcas(en.marcas);
  const jaComprimiu = (primeirasM.get('tipo:compressao') ?? Infinity) <= tS;

  // ---- estado da cena ----
  const carregado = ativo && carga !== undefined;
  const dtChoque = choque ? tS - choque.tS : Infinity;
  const choqueAgora = ativo && dtChoque < T.choqueS ? 1 - dtChoque / T.choqueS : 0;
  const duracaoChecagem = teclas ? T.checagemMaximaS : T.checagemS;
  const checandoRitmo =
    ativo &&
    !!checagem &&
    tS - checagem.tS < duracaoChecagem &&
    checagemInterrompidaS === undefined &&
    !(teclas && ultCompressao !== undefined && ultCompressao.tS > checagem.tS);
  const maosFora = carregado || choqueAgora > 0;

  // quem está no tórax: quem apertou agora há pouco (troca na hora), senão o compressor da vez
  const autor = ultCompressao?.por;
  const noTorax: 'compressor-1' | 'compressor-2' =
    ultCompressao && (autor === 'compressor-1' || autor === 'compressor-2') && tS - ultCompressao.tS < T.compressorNoToraxS ? autor : en.compressorDaVez;
  const emEspera = noTorax === 'compressor-1' ? 'compressor-2' : 'compressor-1';

  let compressao = 0;
  let expansao = 0;
  let serie: number | undefined;
  let comprimindo = false;
  let ritmo: FaixaRitmo | undefined;

  if (ativo) {
    // fixos: líder, medicação e monitor de pé; tempo e anotação nas suas tarefas
    for (const p of ['lider', 'medicacao', 'monitor', emEspera]) propor(p, 'parado', 0, PRIORIDADE.parado, -Infinity);
    propor('tempo', 'cronometrando', 0, PRIORIDADE.parado, -Infinity);
    propor('registro', 'anotando', 0, PRIORIDADE.parado, -Infinity);

    let ventilacao = 0;
    let ventilacaoDesde = -Infinity;
    if (teclas) {
      if (ultCompressao) compressao = afundamento(tS - ultCompressao.tS);
      // 15:2 (ou 30:2): depois da última compressão da série, as mãos param para as ventilações — a pausa
      // começa quando alguém ventila ou quando o último aperto termina (não "comprime e ventila" ao mesmo tempo)
      const pausaDaSerie =
        rcp.modo === 'sincronizado' &&
        !!ultCompressao &&
        ((!!ultVentilacao && ultVentilacao.tS > ultCompressao.tS) || (rcp.fase === 'ventilar' && tS - ultCompressao.tS >= T.descidaCompressaoS + T.subidaCompressaoS));
      comprimindo = !!ultCompressao && tS - ultCompressao.tS < T.comprimindoAteS && !pausaDaSerie;
      if (comprimindo) {
        serie = rcp.modo === 'sincronizado' ? rcp.serie : undefined;
        ritmo = rcp.faixaCompressao;
      }
      if (ultVentilacao && tS - ultVentilacao.tS < T.ventilacaoS) {
        ventilacao = insuflacao(tS - ultVentilacao.tS);
        ventilacaoDesde = ultVentilacao.tS;
      }
    } else if (!en.pausado && !rce && !checandoRitmo && !maosFora) {
      // RCP automática: recomeça depois da checagem, do choque e da carga cancelada
      const retomadaS = Math.max(
        inicioS ?? 0,
        checagem ? (checagemInterrompidaS ?? checagem.tS + T.checagemS) : -Infinity,
        choque ? choque.tS + T.choqueS : -Infinity,
        cargaCanceladaS ?? -Infinity,
      );
      const continua = viaAvancadaS !== undefined && viaAvancadaS <= tS;
      const baseS = continua ? Math.max(retomadaS, viaAvancadaS!) : retomadaS;
      if (tS >= baseS) {
        const r = rcpInventada(tS - baseS, en.relacao, continua);
        compressao = r.compressao;
        comprimindo = r.comprimindo;
        serie = r.serie;
        // durante a intubação não há ventilação
        ventilacao = intubacaoS !== undefined && tS - intubacaoS < T.intubandoS ? 0 : r.ventilacao;
        if (ventilacao > 0) ventilacaoDesde = tS;
      }
    }

    const acaoTorax: AcaoAvatar = comprimindo ? 'comprimindo' : !rce && (jaComprimiu || !teclas) ? 'maos-no-torax' : 'parado';
    propor(noTorax, acaoTorax, comprimindo ? compressao : 0, comprimindo ? PRIORIDADE.rcp : PRIORIDADE.parado, -Infinity);
    if (ventilacao > 0) {
      expansao = ventilacao;
      propor('via-aerea', 'ventilando', ventilacao, PRIORIDADE.acao, ventilacaoDesde);
    } else propor('via-aerea', 'segurando-mascara', 0, PRIORIDADE.parado, -Infinity);

    // checagem de ritmo: todos olham o monitor (menos quem tem outra ação)
    if (checandoRitmo && checagem) {
      for (const p of PAPEIS_EQUIPE) propor(p.id, 'olhando-monitor', 0, PRIORIDADE.checagem, checagem.tS);
      falar(checagem.por ?? 'monitor', 'Checando o ritmo…', checagem.tS, duracaoChecagem);
    }

    // ações curtas
    if (injecao && tS - injecao.tS < T.acaoCurtaS) propor('medicacao', 'injetando', (tS - injecao.tS) / T.acaoCurtaS, PRIORIDADE.acao, injecao.tS);
    if (injecao) falar('medicacao', injecao.texto, injecao.tS);
    if (puncao && tS - puncao.tS < T.acaoCurtaS) propor('medicacao', 'puncionando', (tS - puncao.tS) / T.acaoCurtaS, PRIORIDADE.acao, puncao.tS);
    if (intubacaoS !== undefined && tS - intubacaoS < T.intubandoS) propor('via-aerea', 'intubando', (tS - intubacaoS) / T.intubandoS, PRIORIDADE.acao, intubacaoS);
    if (anotouS !== undefined && tS - anotouS < T.anotandoS) propor('registro', 'anotando', (tS - anotouS) / T.anotandoS, PRIORIDADE.acao, anotouS);

    // desfibrilador: carregado = mãos ao alto; choque = clarão
    if (carregado && carga) {
      for (const p of PAPEIS_EQUIPE) if (p.id !== 'monitor') propor(p.id, 'maos-ao-alto', 0, PRIORIDADE.choque, carga.tS);
      propor('monitor', 'carregando', (tS - carga.tS) / T.cargaS, PRIORIDADE.choque, carga.tS);
      falar('monitor', `Carregando ${n(carga.joules)}${NBSP}J… Afastem-se!`, carga.tS, Infinity);
    }
    if (choque && choqueAgora > 0) {
      for (const p of PAPEIS_EQUIPE) if (p.id !== 'monitor') propor(p.id, 'maos-ao-alto', 0, PRIORIDADE.choque, choque.tS);
      propor('monitor', 'chocando', dtChoque / T.choqueS, PRIORIDADE.choque, choque.tS);
    }
    if (choque) falar('monitor', 'Choque!', choque.tS, T.balaoCurtoS);
    if (maosFora) {
      compressao = 0;
      expansao = 0;
      comprimindo = false;
    }

    if (rce && estado.rceEmS !== undefined) falar('lider', 'Temos pulso!', estado.rceEmS, T.rceS);
  }

  // ---- avatares ----
  const presente = (papel: string) =>
    ESSENCIAIS.includes(papel) || papel === noTorax || !!membros[papel]?.nome.trim() || agiram.has(papel) || (primeirasM.get(`por:${papel}`) ?? Infinity) <= tS;
  const avatares: AvatarNaCena[] = PAPEIS_EQUIPE.filter((p) => presente(p.id)).map((p) => {
    const g = ativo ? gestos.get(p.id) : undefined;
    const balao = ativo ? baloes.get(p.id)?.texto : undefined;
    const acao = g?.acao ?? 'parado';
    return {
      papel: p.id,
      nome: nomeDe(p.id),
      lugar: p.id === noTorax ? 'torax' : p.id === emEspera ? 'espera' : (LUGAR_DO_PAPEL[p.id] ?? 'registro'),
      acao,
      fase: g?.fase ?? 0,
      aparencia: aparenciaDoMembro(p.id, membros[p.id]),
      ...(balao !== undefined && { balao }),
      ...(acao === 'comprimindo' && ritmo !== undefined && { ritmo }),
    };
  });

  // ---- legenda: o que acontece agora ----
  const acaoDe = (papel: string) => avatares.find((a) => a.papel === papel)?.acao;
  let principal: string;
  if (!estado.iniciada) principal = 'Aguardando o início do código';
  else if (estado.encerrada) principal = rce ? 'Código encerrado · ✔ Retorno da circulação' : 'Código encerrado';
  else if (en.pausado) principal = '⏸ Relógio pausado';
  else if (choqueAgora > 0 && choque) principal = `⚡ Choque de ${n(choque.joules)}${NBSP}J`;
  else if (carregado) principal = '⚡ Afastem-se: desfibrilador carregado';
  else if (checandoRitmo) principal = '🔍 Checagem de ritmo';
  else if (comprimindo) {
    const freq = teclas ? rcp.freqCompressao : T.automaticaPorMin;
    const ritmoTexto = freq === null ? '' : ` — ${Math.round(freq)}/min${teclas && rcp.faixaCompressao ? ` (${TEXTO_FAIXA[rcp.faixaCompressao]})` : ''}`;
    principal = `${nomeDe(noTorax)} comprime${ritmoTexto} · ${serie !== undefined ? `série ${serie}/${en.relacao}` : 'contínuas'}`;
  } else if (rce) principal = '✔ Retorno da circulação';
  else if (teclas ? rcp.fase === 'ventilar' && jaComprimiu : serie !== undefined) principal = `Pausa: ${RCP.ventilacoesPorPausa} ventilações`;
  else if (teclas && jaComprimiu) principal = `Pausa nas compressões${rcp.semComprimirS === null ? '' : ` (${Math.floor(rcp.semComprimirS)} s)`}`;
  else principal = teclas ? 'Aguardando a 1ª compressão' : 'RCP em andamento';
  const partes = [principal];
  if (ativo && !en.pausado) {
    if (acaoDe('via-aerea') === 'ventilando') partes.push(`${nomeDe('via-aerea')} ventila`);
    if (acaoDe('via-aerea') === 'intubando') partes.push(`🫁 ${nomeDe('via-aerea')} intuba`);
    if (acaoDe('medicacao') === 'injetando' && injecao) partes.push(`💉 ${nomeDe('medicacao')}: ${injecao.texto}`);
    if (acaoDe('medicacao') === 'puncionando' && puncao) partes.push(`🩸 ${nomeDe('medicacao')}: acesso ${puncao.io ? 'intraósseo' : 'venoso'}`);
  }

  return {
    faixa,
    tecnica: TECNICA_POR_FAIXA[faixa].tecnica,
    pelePaciente: cenario.pele ?? 'moreno',
    compressao: ativo ? compressao : 0,
    expansao: ativo ? expansao : 0,
    viaAerea: viaAvancadaS !== undefined && tS - viaAvancadaS >= T.intubandoS ? 'tubo' : 'mascara',
    ...(acesso && { acesso }),
    rce,
    choque: choqueAgora,
    carregado,
    checandoRitmo,
    ativo,
    avatares,
    legenda: partes.join(' · '),
  };
}
