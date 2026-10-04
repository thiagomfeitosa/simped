/**
 * Geometria da cena da RCP (sem tela): sala vista de lado e um pouco de cima (3/4), maca (ou berço
 * aquecido) no centro, paciente deitado de barriga para cima com a cabeça à esquerda, equipe em volta.
 *
 * Coordenadas do "mundo" em unidades do viewBox (800 × 380); a "câmera" enquadra quem está na cena
 * (aproxima quando há menos gente). O paciente é o protagonista: é desenhado MAIOR que o tamanho
 * real em relação à equipe (DESTAQUE_PACIENTE), para o tórax afundando ser bem visto.
 * Proporções do corpo: só desenho (não são dados clínicos).
 */

import { TECNICA_POR_FAIXA } from '../../dados/parada-cena-a-validar';
import type { FaixaPaciente, LugarNaCena, TecnicaCompressao } from '../../parada/cena';
import { lerp, type Ponto } from '../formas';

export const LARGURA_CENA = 800;
export const ALTURA_CENA = 380;
/** Onde a parede encontra o chão. */
export const HORIZONTE = 246;
/** Pixels por centímetro da equipe (pessoa de 168 cm = 210 de altura). */
export const PX_CM = 1.25;
/** Altura do avatar (escala 1), dos pés ao alto da cabeça. */
export const ALTURA_AVATAR = 210;
/** Altura dos ombros do avatar (dos pés). */
export const OMBRO_AVATAR = 166;
/** Braço e antebraço do avatar (até o punho) e tamanho da mão. */
export const BRACO_AVATAR = 38;
export const ANTEBRACO_AVATAR = 33;
export const MAO_AVATAR = 13;
/** Meia largura dos ombros (de frente). */
export const MEIO_OMBRO = 22;
/** Distância mínima entre duas pessoas lado a lado atrás da maca (sem uma encobrir a outra nem as etiquetas baterem). */
export const DISTANCIA_LADO_A_LADO = 62;

/**
 * Quanto o paciente é desenhado maior que o real, em relação à equipe (só desenho).
 * Bebês ficam bem maiores para o tórax e as mãos de quem comprime aparecerem.
 */
export const DESTAQUE_PACIENTE: Record<FaixaPaciente, number> = { rn: 2, lactente: 1.6, crianca: 1.32, adolescente: 1.14 };

/** Vista um pouco de cima: quanto a profundidade (do lado de lá para o de cá da maca) desce na tela. */
export const PROFUNDIDADE = 0.42;

/** Aproximação máxima da câmera. */
const ZOOM_MAXIMO = 2.2;
/** Espaço (na tela) acima das cabeças para os nomes e um balão de fala. */
const ESPACO_NOMES = 56;
/** A câmera mostra até este tanto abaixo da borda de cá do colchão (mundo). */
const CORTE_ABAIXO_DO_COLCHAO = 34;

/** Quem comprime fica um pouco para o lado (uma mão: o ombro sobre a mão; dois polegares: os braços não passam pelo rosto). */
export function desvioDoCompressor(tecnica: TecnicaCompressao): number {
  return tecnica === 'uma-mao' ? MEIO_OMBRO - 2 : tecnica === 'dois-polegares' ? 13 : 0;
}

// ---- Proporções do corpo deitado (cm, do vértice da cabeça) ---------------------------------

export interface ProporcoesCorpo {
  /** Vértice ao calcanhar. */
  comprimento: number;
  /** Vértice ao queixo (ao longo do corpo). */
  cabeca: number;
  /** Altura da cabeça deitada (nuca à ponta do nariz). */
  profCabeca: number;
  ombro: number;
  mamilos: number;
  xifoide: number;
  umbigo: number;
  pube: number;
  joelho: number;
  tornozelo: number;
  /** Diâmetro anteroposterior do tórax e do abdome. */
  apTorax: number;
  apAbdome: number;
  /** Largura do tórax (de um lado ao outro). */
  larguraTorax: number;
  /** Altura da coxa e da perna deitado. */
  coxa: number;
  perna: number;
  pe: number;
  braco: number;
  antebraco: number;
  mao: number;
  grossuraBraco: number;
  /** Rosto de bebê (testa grande, nariz curto) ou de criança maior. */
  rosto: 'bebe' | 'crianca';
  /** Quanto o nariz sobressai (0 a 1). */
  nariz: number;
  /** Joelhos dobrados (graus): bebês ficam com as pernas um pouco fletidas. */
  flexaoJoelho: number;
  /** Ponto da compressão entre os mamilos (0) e o apêndice xifoide (1). */
  pontoCompressao: number;
}

export const PROPORCOES: Record<FaixaPaciente, ProporcoesCorpo> = {
  rn: {
    comprimento: 50, cabeca: 12, profCabeca: 11.5, ombro: 13.4, mamilos: 17.6, xifoide: 20.6, umbigo: 24.6, pube: 29,
    joelho: 38.5, tornozelo: 47.5, apTorax: 9, apAbdome: 9.6, larguraTorax: 10.5, coxa: 6.4, perna: 4.6, pe: 7.6, braco: 8.6, antebraco: 7.4, mao: 5.4,
    grossuraBraco: 3.2, rosto: 'bebe', nariz: 0.25, flexaoJoelho: 32, pontoCompressao: 0.35,
  },
  lactente: {
    comprimento: 70, cabeca: 14.5, profCabeca: 14.2, ombro: 16.6, mamilos: 22, xifoide: 26.2, umbigo: 32.5, pube: 39,
    joelho: 53, tornozelo: 66, apTorax: 11.2, apAbdome: 11.6, larguraTorax: 14, coxa: 8.4, perna: 6, pe: 10.4, braco: 11.6, antebraco: 10, mao: 7,
    grossuraBraco: 4.3, rosto: 'bebe', nariz: 0.4, flexaoJoelho: 20, pontoCompressao: 0.3,
  },
  crianca: {
    comprimento: 120, cabeca: 19, profCabeca: 17.6, ombro: 23.6, mamilos: 32, xifoide: 38.4, umbigo: 50, pube: 63,
    joelho: 90, tornozelo: 115, apTorax: 15, apAbdome: 14.2, larguraTorax: 21, coxa: 11.4, perna: 8, pe: 18, braco: 21, antebraco: 18, mao: 12.5,
    grossuraBraco: 6.4, rosto: 'crianca', nariz: 0.7, flexaoJoelho: 4, pontoCompressao: 0.6,
  },
  adolescente: {
    comprimento: 160, cabeca: 22, profCabeca: 20, ombro: 29, mamilos: 41, xifoide: 49, umbigo: 66, pube: 82,
    joelho: 119, tornozelo: 154, apTorax: 20, apAbdome: 17.6, larguraTorax: 29, coxa: 14.6, perna: 10, pe: 24, braco: 30, antebraco: 25, mao: 18,
    grossuraBraco: 8.4, rosto: 'crianca', nariz: 1, flexaoJoelho: 3, pontoCompressao: 0.6,
  },
};

// ---- Leito e lugares de cada faixa --------------------------------------------------------

export interface Leito {
  tipo: 'maca' | 'berco';
  /** Pontas (x) do colchão. */
  x0: number;
  x1: number;
  /** Linha do meio do colchão (onde as costas do paciente encostam, no meio da maca). */
  topo: number;
  /** Metade da faixa de cima do colchão vista de 3/4 (a borda de lá fica em topo − meiaProf, a de cá em topo + meiaProf). */
  meiaProf: number;
  /** Chão sob as rodas. */
  chao: number;
}

export interface LugarGeo {
  x: number;
  /** Pés (no chão). */
  y: number;
  escala: number;
  /** Para onde o corpo está virado: -1 esquerda, 0 de frente, 1 direita. */
  giro: number;
  /** Quem fica atrás da maca (corpo antes do leito, braços depois do paciente), na cabeceira, à frente ou ao fundo. */
  camada: 'fundo' | 'atras' | 'cabeceira' | 'pes' | 'carrinho' | 'frente';
}

export interface Camera {
  zoom: number;
  /** Canto de cima à esquerda do que aparece (mundo). */
  x: number;
  y: number;
}

export interface Carrinho {
  /** Centro (x) e chão. */
  x: number;
  chao: number;
  /** Topo do carrinho (onde fica o monitor/desfibrilador). */
  topo: number;
  largura: number;
  /** Menor quando fica mais ao fundo. */
  escala: number;
  /** Tela do monitor (centro) e botões do desfibrilador. */
  tela: Ponto;
  botaoCarga: Ponto;
  botaoChoque: Ponto;
  /** Saída dos cabos. */
  saidaCabos: Ponto;
}

export interface LayoutFaixa {
  faixa: FaixaPaciente;
  leito: Leito;
  /** Pixels por centímetro do paciente (PX_CM × destaque). */
  k: number;
  /** Vértice da cabeça do paciente (x) — o corpo vai para a direita. */
  xPaciente: number;
  carrinho: Carrinho;
  /** Régua de oxigênio na parede (fluxômetro). */
  oxigenio: Ponto;
  lugares: Record<LugarNaCena, LugarGeo>;
  /** Câmera com a equipe inteira (cameraDaCena enquadra só quem está presente). */
  camera: Camera;
  /** Tamanho da bolsa-válvula (comprimento) e da máscara. */
  bolsa: number;
}

const TOPO_MACA = 236;
const TOPO_BERCO = 228;

function carrinhoEm(x: number, chao: number, escala = 1): Carrinho {
  const e = escala;
  const topo = chao - 116 * e;
  return {
    x,
    chao,
    topo,
    largura: 70 * e,
    escala: e,
    tela: { x: x - 10 * e, y: topo - 25 * e },
    botaoCarga: { x: x + 20 * e, y: topo - 26 * e },
    botaoChoque: { x: x + 20 * e, y: topo - 14 * e },
    saidaCabos: { x: x - 30 * e, y: topo - 8 * e },
  };
}

/**
 * Monta o lugar de cada um em volta do leito (mundo) e a câmera que enquadra todos.
 * Três faixas de profundidade (cada vez menores e mais altas na tela):
 * - na frente, nas pontas do leito: via aérea (cabeceira) e líder (pés);
 * - logo atrás da maca: quem comprime, quem pega o acesso e o 2º compressor, lado a lado;
 * - ao fundo: anotação (do lado da cabeceira), o carrinho com quem cuida do monitor/desfibrilador e o tempo.
 * Ninguém fica na frente do paciente.
 */
function layout(faixa: FaixaPaciente): LayoutFaixa {
  const p = PROPORCOES[faixa];
  const k = PX_CM * DESTAQUE_PACIENTE[faixa];
  const berco = faixa === 'rn';
  const bebe = faixa === 'rn' || faixa === 'lactente';
  // RN no berço aquecido; lactente numa maca pediátrica (mais curta); maiores na maca comum.
  // O leito cresce junto com o paciente desenhado maior.
  const real = (berco ? 100 : faixa === 'lactente' ? 132 : 190) * PX_CM;
  const comprimentoLeito = Math.max(real, p.comprimento * k + (berco ? 40 : 32));
  const centro = 404;
  const x0 = Math.round(centro - comprimentoLeito / 2);
  const x1 = Math.round(centro + comprimentoLeito / 2);
  const topo = berco ? TOPO_BERCO : TOPO_MACA;
  // largura do colchão: a real ou a que cabe o paciente (desenhado maior) com os braços ao lado do corpo
  const meiaLarguraCm = Math.max(((berco ? 60 : faixa === 'lactente' ? 64 : 70) / 2) * (PX_CM / k), (p.larguraTorax * 0.55 + p.grossuraBraco) * 1.3);
  const meiaProf = Math.round(meiaLarguraCm * k * PROFUNDIDADE * 10) / 10;
  const xPaciente = x0 + (berco ? 18 : 10);
  const leito: Leito = { tipo: berco ? 'berco' : 'maca', x0, x1, topo, meiaProf, chao: 332 };
  const X = (cm: number) => xPaciente + cm * k;
  const xTorax = X(lerp(p.mamilos, p.xifoide, p.pontoCompressao));
  const tecnica = TECNICA_POR_FAIXA[faixa].tecnica;
  const xCompressor = xTorax + desvioDoCompressor(tecnica);
  // quem pega o acesso fica perto do braço (periférico dos maiores) ou da perna (intraóssea e veia do pé dos bebês), à direita de quem comprime
  const xSitio = bebe ? X(p.joelho + (p.tornozelo - p.joelho) * 0.14) : X(p.ombro + 1.5 + p.braco * 0.97 + p.antebraco * 0.7);
  const xAcesso = Math.max(xSitio + 8, xCompressor + DISTANCIA_LADO_A_LADO);
  // o 2º compressor espera do outro lado de quem pega o acesso; se não couber atrás do leito, fica do lado da cabeceira
  const depois = xAcesso + DISTANCIA_LADO_A_LADO - 4;
  const xEspera = depois <= x1 - 6 ? depois : xCompressor - DISTANCIA_LADO_A_LADO;
  const xCabeca = x0 - (berco ? 24 : 26);
  const xLider = x1 + 30;
  const carrinho = carrinhoEm(x1 + 46, 280, 0.84);
  const lugares: Record<LugarNaCena, LugarGeo> = {
    tempo: { x: carrinho.x + 98, y: 276, escala: 0.8, giro: -0.4, camada: 'fundo' },
    registro: { x: xCabeca - 50, y: 280, escala: 0.8, giro: 0.35, camada: 'fundo' },
    cabeca: { x: xCabeca, y: 338, escala: 1, giro: 0.62, camada: 'cabeceira' },
    torax: { x: xCompressor, y: 318, escala: 0.95, giro: 0, camada: 'atras' },
    acesso: { x: xAcesso, y: 312, escala: 0.93, giro: -0.5, camada: 'atras' },
    espera: { x: xEspera, y: 304, escala: 0.9, giro: xEspera < xCompressor ? 0.3 : -0.3, camada: 'atras' },
    pes: { x: xLider, y: 342, escala: 1, giro: -0.5, camada: 'pes' },
    desfibrilador: { x: carrinho.x + 50, y: 288, escala: 0.84, giro: -0.55, camada: 'carrinho' },
  };
  const bolsa = faixa === 'adolescente' ? 36 : faixa === 'crianca' ? 31 : faixa === 'lactente' ? 26 : 23;
  const L: LayoutFaixa = {
    faixa,
    leito,
    k,
    xPaciente,
    carrinho,
    oxigenio: { x: x0 - 70, y: 150 },
    lugares,
    camera: { zoom: 1, x: 0, y: 0 },
    bolsa,
  };
  L.camera = cameraPara(L, Object.keys(lugares) as LugarNaCena[]);
  return L;
}

/**
 * Câmera (plano médio): enquadra o leito, o carrinho e quem está na cena, das cabeças (com espaço para
 * os nomes em cima) até um pouco abaixo do colchão — as pernas de quem está de pé podem ficar de fora.
 * Com menos gente, aproxima. Sobra de altura vai para cima (balões); sobra de largura, para os lados.
 */
export function cameraPara(L: LayoutFaixa, presentes: readonly LugarNaCena[]): Camera {
  const c = L.carrinho;
  let xMin = L.leito.x0 - 30;
  let xMax = Math.max(L.leito.x1 + 30, c.x + c.largura / 2 + 6);
  let topo = c.topo - 50 * c.escala;
  for (const l of presentes) {
    const g = L.lugares[l];
    xMin = Math.min(xMin, g.x - 30 * g.escala);
    xMax = Math.max(xMax, g.x + 30 * g.escala);
    topo = Math.min(topo, g.y - (ALTURA_AVATAR + 2) * g.escala);
  }
  const base = L.leito.topo + L.leito.meiaProf + CORTE_ABAIXO_DO_COLCHAO;
  const zoom = Math.min(ZOOM_MAXIMO, LARGURA_CENA / (xMax - xMin), (ALTURA_CENA - ESPACO_NOMES) / (base - topo));
  return { zoom, x: (xMin + xMax) / 2 - LARGURA_CENA / zoom / 2, y: base - ALTURA_CENA / zoom };
}

const CACHE: Partial<Record<FaixaPaciente, LayoutFaixa>> = {};

export function layoutDaFaixa(faixa: FaixaPaciente): LayoutFaixa {
  return (CACHE[faixa] ??= layout(faixa));
}

const CAMERAS = new Map<string, Camera>();

/** Câmera para quem está na cena agora (a mesma em todas as telas). */
export function cameraDaCena(faixa: FaixaPaciente, presentes: readonly LugarNaCena[]): Camera {
  const chave = `${faixa}:${[...new Set(presentes)].sort().join(',')}`;
  let c = CAMERAS.get(chave);
  if (!c) CAMERAS.set(chave, (c = cameraPara(layoutDaFaixa(faixa), [...new Set(presentes)])));
  return c;
}

/** Converte um ponto do mundo para a tela (viewBox) com a câmera. */
export function naTela(c: Camera, p: Ponto): Ponto {
  return { x: (p.x - c.x) * c.zoom, y: (p.y - c.y) * c.zoom };
}

// ---- Corpo do paciente (pontos do mundo) ----------------------------------------------------

export interface CorpoPaciente {
  P: ProporcoesCorpo;
  /** Pixels por centímetro do paciente. */
  k: number;
  /** cm → mundo, no meio do corpo (z = 0); z > 0 vai para o lado de lá da maca (sobe na tela). */
  em: (x: number, h: number, z?: number) => Ponto;
  /** Ponto da cabeça (frações do comprimento e da altura da cabeça), com a vista de 3/4. */
  naCabeca: (u: number, v: number) => Ponto;
  /** Altura (cm) do contorno da frente do tronco em x (cm), já com compressão e expansão. */
  alturaTronco: (x: number) => number;
  /** Altura (cm, negativa) do contorno de baixo do tronco: o flanco do lado de cá, visto de cima. */
  baseTronco: (x: number) => number;
  /** Afundamento agora (cm). */
  afundaCm: number;
  /** Onde as mãos comprimem (contorno do tórax agora). */
  torax: Ponto;
  /** Mesmo ponto em repouso (sem compressão). */
  toraxRepouso: Ponto;
  boca: Ponto;
  nariz: Ponto;
  /** Ponto da máscara (sobre nariz e boca, no rosto). */
  mascara: Ponto;
  /** Borda da máscara no rosto (na raiz do nariz e no queixo) e a conexão no alto da máscara. */
  mascaraBase: [Ponto, Ponto];
  mascaraTopo: Ponto;
  /** Conexão do tubo (onde a bolsa encaixa com via aérea avançada). */
  tuboTopo: Ponto;
  /** Acesso periférico (dorso da mão/antebraço) e intraósseo (tíbia). */
  periferico: Ponto;
  tibia: Ponto;
  /** Membros do lado de cá (ombro → cotovelo → punho → ponta da mão; quadril → joelho → tornozelo → ponta do pé). */
  braco: { ombro: Ponto; cotovelo: Ponto; punho: Ponto; ponta: Ponto };
  perna: { quadril: Ponto; joelho: Ponto; tornozelo: Ponto; ponta: Ponto; calcanhar: Ponto };
  /** Braço do lado de lá (atrás do tronco) e quanto a perna de lá sobe na tela (mundo). */
  bracoLonge: { ombro: Ponto; cotovelo: Ponto; punho: Ponto; ponta: Ponto };
  sobePernaLonge: number;
}

/** Rosto de perfil, deitado (olhando para cima): frações [ao longo do corpo, altura] do tamanho da cabeça. */
export interface PerfilRosto {
  /** Contorno da cabeça em sentido horário, começando na nuca encostada no colchão. */
  contorno: readonly (readonly [number, number])[];
  /** Pontos do nariz que sobem com P.nariz: [índice, quanto]. */
  ajusteNariz: readonly (readonly [number, number])[];
  /** Lábios (do lábio de cima ao de baixo) e ponta do queixo no contorno. */
  iLabios: readonly [number, number];
  iQueixo: number;
  /** Ponta do nariz no contorno. */
  iNariz: number;
  boca: readonly [number, number];
  nariz: readonly [number, number];
  mascara: readonly [number, number];
  mascaraBase: readonly [readonly [number, number], readonly [number, number]];
  mascaraTopo: readonly [number, number];
  olho: readonly [number, number];
  sobrancelha: readonly [number, number];
  orelha: readonly [number, number];
  narina: readonly [number, number];
  bochecha: readonly [number, number];
  /** Linha do cabelo: testa → frente da orelha → nuca. */
  linhaCabelo: readonly (readonly [number, number])[];
}

export const ROSTOS: Record<ProporcoesCorpo['rosto'], PerfilRosto> = {
  crianca: {
    contorno: [
      [0.45, 0], [0.24, 0.04], [0.08, 0.17], [0, 0.4], [0.04, 0.6], [0.15, 0.75], [0.29, 0.835], [0.4, 0.865],
      [0.47, 0.835], [0.54, 0.885], [0.6, 0.95], [0.63, 0.905], [0.655, 0.855], [0.69, 0.88], [0.725, 0.858], [0.76, 0.875],
      [0.8, 0.83], [0.855, 0.86], [0.92, 0.79], [0.975, 0.64], [0.95, 0.38], [0.72, 0.08],
    ],
    ajusteNariz: [[9, 0.02], [10, 0.04], [11, 0.015]],
    iLabios: [13, 15],
    iQueixo: 18,
    iNariz: 10,
    boca: [0.725, 0.86],
    nariz: [0.6, 0.95],
    mascara: [0.66, 0.93],
    mascaraBase: [[0.47, 0.83], [0.875, 0.845]],
    mascaraTopo: [0.665, 1.13],
    olho: [0.47, 0.735],
    sobrancelha: [0.405, 0.79],
    orelha: [0.6, 0.37],
    narina: [0.635, 0.88],
    bochecha: [0.67, 0.67],
    linhaCabelo: [[0.15, 0.75], [0.26, 0.65], [0.37, 0.55], [0.47, 0.42], [0.56, 0.2], [0.72, 0.08]],
  },
  bebe: {
    contorno: [
      [0.45, 0], [0.22, 0.05], [0.06, 0.2], [0, 0.45], [0.05, 0.68], [0.16, 0.83], [0.3, 0.905], [0.42, 0.91],
      [0.5, 0.87], [0.56, 0.905], [0.605, 0.965], [0.635, 0.93], [0.655, 0.89], [0.69, 0.91], [0.725, 0.888], [0.76, 0.902],
      [0.795, 0.862], [0.845, 0.878], [0.9, 0.8], [0.935, 0.64], [0.9, 0.38], [0.7, 0.08],
    ],
    ajusteNariz: [[9, 0.02], [10, 0.04], [11, 0.015]],
    iLabios: [13, 15],
    iQueixo: 18,
    iNariz: 10,
    boca: [0.725, 0.89],
    nariz: [0.605, 0.965],
    mascara: [0.67, 0.95],
    mascaraBase: [[0.49, 0.87], [0.865, 0.87]],
    mascaraTopo: [0.675, 1.16],
    olho: [0.5, 0.77],
    sobrancelha: [0.44, 0.82],
    orelha: [0.6, 0.38],
    narina: [0.637, 0.905],
    bochecha: [0.7, 0.72],
    linhaCabelo: [[0.13, 0.8], [0.21, 0.67], [0.3, 0.53], [0.4, 0.38], [0.5, 0.2], [0.6, 0.07]],
  },
};

/** Curva suave h(x) pelos pontos de controle (Hermite com tangentes de Catmull-Rom). */
export function interpolar(pts: readonly (readonly [number, number])[], x: number): number {
  const n = pts.length;
  if (x <= pts[0]![0]) return pts[0]![1];
  if (x >= pts[n - 1]![0]) return pts[n - 1]![1];
  let i = 0;
  while (i < n - 2 && x > pts[i + 1]![0]) i++;
  const [x0, h0] = pts[i]!;
  const [x1, h1] = pts[i + 1]!;
  const tang = (j: number) => {
    const a = pts[Math.max(0, j - 1)]!;
    const b = pts[Math.min(n - 1, j + 1)]!;
    return (b[1] - a[1]) / (b[0] - a[0]);
  };
  const dx = x1 - x0;
  const t = (x - x0) / dx;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * h0 + (t3 - 2 * t2 + t) * dx * tang(i) + (-2 * t3 + 3 * t2) * h1 + (t3 - t2) * dx * tang(i + 1);
}

/** Pontos de controle da frente do tronco (cm do vértice, cm acima do colchão), do pescoço à virilha. */
export function controleTronco(P: ProporcoesCorpo): [number, number][] {
  const bebe = P.rosto === 'bebe';
  const ap = P.apTorax;
  const ab = P.apAbdome;
  return [
    [P.cabeca * 0.97, P.profCabeca * 0.52],
    [P.cabeca + (P.ombro - P.cabeca) * 0.55, P.profCabeca * (bebe ? 0.5 : 0.47)],
    [P.ombro - 0.4, ap * 0.62],
    [P.ombro + (P.mamilos - P.ombro) * 0.4, ap * 0.87],
    [P.mamilos, ap * 0.99],
    [P.mamilos + (P.xifoide - P.mamilos) * 0.5, ap],
    [P.xifoide + (P.umbigo - P.xifoide) * 0.12, ap * (bebe ? 0.97 : 0.93)],
    [(P.xifoide + P.umbigo) / 2, ab * (bebe ? 1 : 0.9)],
    [P.umbigo, ab * (bebe ? 1.02 : 0.92)],
    [P.umbigo + (P.pube - P.umbigo) * 0.55, ab * (bebe ? 0.93 : 0.87)],
    [P.pube, ab * 0.74],
  ];
}

/** Meia largura do tronco (cm) ao longo do corpo: pescoço, ombros, tórax, cintura, quadril. */
export function controleLargura(P: ProporcoesCorpo): [number, number][] {
  const l = P.larguraTorax;
  return [
    [P.cabeca * 0.97, P.profCabeca * 0.3],
    [P.ombro - 0.5, l * 0.56],
    [P.mamilos, l * 0.5],
    [P.xifoide, l * 0.48],
    [P.umbigo, l * (P.rosto === 'bebe' ? 0.47 : 0.42)],
    [P.pube, l * 0.46],
  ];
}

/** Contorno da frente do tronco em repouso (cm acima do colchão). */
const CONTROLE = new Map<ProporcoesCorpo, { frente: [number, number][]; largura: [number, number][] }>();
function controles(P: ProporcoesCorpo) {
  let c = CONTROLE.get(P);
  if (!c) CONTROLE.set(P, (c = { frente: controleTronco(P), largura: controleLargura(P) }));
  return c;
}
function alturaBase(P: ProporcoesCorpo, x: number): number {
  return interpolar(controles(P).frente, x);
}
/** Meia largura do tronco (cm) em x. */
export function meiaLarguraTronco(P: ProporcoesCorpo, x: number): number {
  return interpolar(controles(P).largura, x);
}

/**
 * Corpo do paciente no mundo. `compressao` 0–1 afunda o esterno (o contorno do peito desce de verdade),
 * `expansao` 0–1 sobe o tórax, `choque` 0–1 dá o tranco (o corpo sobe e os braços pulam).
 */
export function corpoDoPaciente(faixa: FaixaPaciente, compressao = 0, expansao = 0, choque = 0): CorpoPaciente {
  const L = layoutDaFaixa(faixa);
  const P = PROPORCOES[faixa];
  const k = L.k;
  const sz = PROFUNDIDADE;
  const tranco = choque > 0 ? Math.sin(choque * Math.PI) * 3.2 : 0;
  const em = (x: number, h: number, z = 0): Ponto => ({ x: L.xPaciente + x * k, y: L.leito.topo - (h + z * sz) * k - tranco });
  const xc = lerp(P.mamilos, P.xifoide, P.pontoCompressao);
  // afundamento um pouco exagerado no desenho para ver bem (1/3 do AP × 1,15)
  const afundaCm = Math.min(1, Math.max(0, compressao)) * P.apTorax * 0.38;
  const sigma = (P.xifoide - P.ombro) * 0.55;
  const sobe = Math.min(1, Math.max(0, expansao)) * P.apTorax * 0.1;
  const alturaTronco = (x: number) => {
    const d = (x - xc) / sigma;
    const afunda = afundaCm * Math.exp(-d * d);
    // a expansão sobe o tórax inteiro e um pouco o abdome
    const e = (x - (P.ombro + P.xifoide) / 2) / ((P.xifoide - P.ombro) * 0.9);
    const exp = sobe * Math.exp(-e * e) + (x > P.xifoide && x < P.pube ? sobe * 0.35 : 0);
    return alturaBase(P, x) - afunda + exp;
  };
  // visto um pouco de cima, o flanco do lado de cá aparece abaixo da linha do meio
  const baseTronco = (x: number) => -meiaLarguraTronco(P, x) * sz * 0.62;
  const torax = em(xc, alturaTronco(xc));
  const toraxRepouso = em(xc, alturaBase(P, xc));

  // cabeça de perfil, um pouco virada para quem olha: a parte de baixo (nuca e bochecha de cá) desce na tela
  const meiaCabeca = P.profCabeca * 0.42;
  const naCabeca = (u: number, v: number): Ponto => {
    const p = em(u * P.cabeca, v * P.profCabeca);
    return { x: p.x, y: p.y + (1 - Math.min(1, Math.max(0, v))) * meiaCabeca * sz * k * 0.9 };
  };
  const R = ROSTOS[P.rosto];
  const doRosto = (f: readonly [number, number], extra = 0) => naCabeca(f[0], f[1] + extra);
  const boca = doRosto(R.boca);
  const nariz = doRosto(R.nariz, 0.04 * P.nariz);
  const mascara = doRosto(R.mascara, 0.02 * P.nariz);
  const mascaraBase: [Ponto, Ponto] = [doRosto(R.mascaraBase[0]), doRosto(R.mascaraBase[1])];
  const mascaraTopo = doRosto(R.mascaraTopo, 0.04 * P.nariz);
  // tubo: sai da boca para cima e entorta um pouco para a cabeceira (onde fica quem ventila)
  const tuboTopo = { x: boca.x - P.cabeca * k * 0.1, y: boca.y - P.profCabeca * k * 0.62 };

  // braços: nos maiores, deitados ao lado do corpo; nos bebês, dobrados para cima (mãos perto da cabeça),
  // como o bebê fica deitado — e o tórax fica livre para as mãos de quem comprime.
  // O braço de cá desce na tela (mais perto); o de lá sobe (atrás do tronco).
  const gb = P.grossuraBraco;
  const pulo = choque > 0 ? Math.sin(choque * Math.PI) * gb * 0.9 : 0;
  const bebe = P.rosto === 'bebe';
  const zBraco = P.larguraTorax * 0.55 + gb * 0.6;
  const xOmbro = P.ombro + 1.5;
  const braco = (s: 1 | -1) => {
    const f = s > 0 ? (bebe ? 0.75 : 0.5) : 1;
    if (bebe) {
      // cotovelo afastado do corpo (desce na tela) e a mão de volta, perto da orelha
      const xCotovelo = xOmbro + P.braco * 0.32;
      const xPunho = xCotovelo - P.antebraco * 0.72;
      const zCot = zBraco + P.braco * 0.75;
      return {
        ombro: em(xOmbro, P.apTorax * 0.5, s * zBraco * 0.72 * f),
        cotovelo: em(xCotovelo, gb * 0.5 + pulo, s * zCot * f),
        punho: em(xPunho, gb * 0.45 + pulo * 1.4, s * (zBraco + P.braco * 0.2) * f),
        ponta: em(xPunho - P.mao * 0.75, gb * 0.35 + pulo * 1.4, s * (zBraco * 0.95) * f),
      };
    }
    const xCotovelo = xOmbro + P.braco * 0.97;
    const xPunho = xCotovelo + P.antebraco;
    return {
      ombro: em(xOmbro, P.apTorax * 0.5, s * zBraco * 0.72 * f),
      cotovelo: em(xCotovelo, gb * 0.5 + pulo, s * zBraco * f),
      punho: em(xPunho, gb * 0.38 + pulo * 1.4, s * zBraco * 0.97 * f),
      ponta: em(xPunho + P.mao, gb * 0.16 + pulo * 1.4, s * zBraco * 0.94 * f),
    };
  };
  const bracoCa = braco(-1);
  // acesso periférico: face de cima do antebraço, perto do punho
  const sobreAntebraco = (t: number) => ({ x: lerp(bracoCa.cotovelo.x, bracoCa.punho.x, t), y: lerp(bracoCa.cotovelo.y, bracoCa.punho.y, t) - gb * k * 0.42 });

  // pernas: a de cá um pouco mais embaixo na tela, a de lá mais em cima
  const zPerna = meiaLarguraTronco(P, P.pube) * 0.55;
  const quadrilCm = { x: P.pube - P.coxa * 0.15, h: P.coxa * 0.5 };
  const coxaLen = P.joelho - quadrilCm.x;
  const pernaLen = P.tornozelo - P.joelho;
  const ang = (P.flexaoJoelho * Math.PI) / 180;
  const joelhoCm = { x: quadrilCm.x + coxaLen * Math.cos(ang), h: quadrilCm.h + coxaLen * Math.sin(ang) };
  const tornozeloH = P.perna * 0.42;
  const desce = Math.min(0.999, Math.max(-0.999, (joelhoCm.h - tornozeloH) / pernaLen));
  const tornozeloCm = { x: joelhoCm.x + pernaLen * Math.cos(Math.asin(desce)), h: tornozeloH };
  const angPe = (64 * Math.PI) / 180;
  const zc = -zPerna;
  const quadril = em(quadrilCm.x, quadrilCm.h, zc);
  const joelho = em(joelhoCm.x, joelhoCm.h, zc);
  const tornozelo = em(tornozeloCm.x, tornozeloCm.h, zc);
  const pontaPe = em(tornozeloCm.x + P.pe * 0.82 * Math.cos(angPe), tornozeloH + P.pe * 0.82 * Math.sin(angPe), zc);
  const calcanhar = em(tornozeloCm.x + P.perna * 0.1, P.perna * 0.05, zc);
  // tíbia (intraóssea): logo abaixo do joelho, na face de cima da perna
  const dx = tornozeloCm.x - joelhoCm.x;
  const dh = tornozeloCm.h - joelhoCm.h;
  const dl = Math.hypot(dx, dh) || 1;
  const tibia = em(joelhoCm.x + dx * 0.14 - (dh / dl) * P.perna * 0.47, joelhoCm.h + dh * 0.14 + (dx / dl) * P.perna * 0.47, zc);
  // acesso periférico: nos maiores, no antebraço perto do punho; nos bebês (braços dobrados perto da cabeça),
  // na veia do tornozelo/dorso do pé — fica perto de quem cuida das medicações
  const periferico = bebe ? em(tornozeloCm.x - P.perna * 0.25, tornozeloH + P.perna * 0.5, zc) : sobreAntebraco(0.7);

  return {
    P,
    k,
    em,
    naCabeca,
    alturaTronco,
    baseTronco,
    afundaCm,
    torax,
    toraxRepouso,
    boca,
    nariz,
    mascara,
    mascaraBase,
    mascaraTopo,
    tuboTopo,
    periferico,
    tibia,
    braco: bracoCa,
    perna: { quadril, joelho, tornozelo, ponta: pontaPe, calcanhar },
    bracoLonge: braco(1),
    sobePernaLonge: 2 * zPerna * sz * k,
  };
}

// ---- Braço com cotovelo (dois segmentos até o alvo) ---------------------------------------

/**
 * Cotovelo do braço que vai do ombro até o alvo da mão. `lado` = 1 dobra o cotovelo para um lado
 * (sentido horário), -1 para o outro. Alvo longe demais: o braço estica e a mão para antes.
 */
export function cotoveloAte(ombro: Ponto, alvo: Ponto, braco: number, antebraco: number, lado: 1 | -1): { cotovelo: Ponto; punho: Ponto } {
  const dx = alvo.x - ombro.x;
  const dy = alvo.y - ombro.y;
  let d = Math.hypot(dx, dy) || 0.001;
  const max = braco + antebraco - 0.05;
  const min = Math.abs(braco - antebraco) + 0.5;
  let punho = alvo;
  if (d > max) {
    punho = { x: ombro.x + (dx / d) * max, y: ombro.y + (dy / d) * max };
    d = max;
  }
  d = Math.max(d, min);
  const cosA = Math.min(1, Math.max(-1, (braco * braco + d * d - antebraco * antebraco) / (2 * braco * d)));
  const ang = Math.atan2(dy, dx) + lado * Math.acos(cosA);
  return { cotovelo: { x: ombro.x + Math.cos(ang) * braco, y: ombro.y + Math.sin(ang) * braco }, punho };
}

/** Técnica que exige o compressor mais baixo (mãos envolvendo o tórax, cotovelos dobrados). */
export function alcanceCompressao(tecnica: TecnicaCompressao): number {
  if (tecnica === 'dois-polegares') return 60;
  // braços quase esticados (cotovelos travados)
  return Math.sqrt((BRACO_AVATAR + ANTEBRACO_AVATAR) ** 2 * 0.997 - (tecnica === 'duas-maos' ? (MEIO_OMBRO - 2) ** 2 : 0));
}

/** Corta nomes longos para a etiqueta. */
export function nomeCurto(nome: string, maximo = 12): string {
  const n = nome.trim();
  return n.length <= maximo ? n : `${n.slice(0, maximo - 1).trimEnd()}…`;
}

/** Quebra o texto do balão em linhas (sem quebrar palavras, no máximo `linhas`). */
export function quebrarTexto(texto: string, porLinha: number, linhas = 3): string[] {
  const palavras = texto.trim().split(/\s+/);
  const r: string[] = [];
  let atual = '';
  for (const p of palavras) {
    if (!atual) atual = p;
    else if ((atual + ' ' + p).length <= porLinha) atual += ' ' + p;
    else {
      r.push(atual);
      atual = p;
    }
  }
  if (atual) r.push(atual);
  if (r.length > linhas) {
    const corte = r.slice(0, linhas);
    corte[linhas - 1] = `${corte[linhas - 1]!.slice(0, porLinha - 1)}…`;
    return corte;
  }
  return r;
}
