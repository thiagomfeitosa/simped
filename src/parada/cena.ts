/**
 * Cena animada da RCP (sem tela): o que cada membro da equipe está fazendo AGORA, para a animação
 * que todos veem (alunos, líder e professor). Tudo sai da sala (eventos + marcas da RCP + relógio):
 * cada tela calcula a mesma cena a partir da mesma lista, então as janelas ficam iguais sem mandar
 * nada a mais. A tela só desenha (src/telas/parada/CenaRcp.tsx).
 *
 * Como a cena é função do tempo, o debriefing pode "rever" o código: é só pedir a cena num tempo passado.
 * Técnica de compressão e faixas etárias: src/dados/parada-cena-a-validar.ts (A VALIDAR).
 */

import type { CenarioParada } from '../dados/parada-a-validar';
import type { TomDePele } from '../neonatal/exame';
import type { EstadoParada, EventoParada } from './parada';
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

/** Monta a cena no tempo `tS`. Implementação: ver abaixo. */
export function montarCena(_entrada: EntradaCena): CenaRcp {
  throw new Error('montarCena: ainda não implementada');
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

/** Aparência padrão de cada papel (sempre a mesma em todas as telas). Implementação: ver abaixo. */
export function aparenciaPadrao(_papel: string): AparenciaAvatar {
  throw new Error('aparenciaPadrao: ainda não implementada');
}

/** Aparência que vale para o membro (a escolhida ou a padrão do papel). */
export function aparenciaDoMembro(papel: string, membro: Membro | undefined): AparenciaAvatar {
  return membro?.avatar ?? aparenciaPadrao(papel);
}
