/**
 * Geometria da cena da RCP (sem tela): sala vista de lado, maca (ou berço aquecido) no centro,
 * paciente deitado de barriga para cima com a cabeça à esquerda, equipe em volta.
 *
 * Coordenadas do "mundo" em unidades do viewBox (800 × 380); a "câmera" de cada faixa aproxima
 * a imagem quando o paciente é pequeno (RN e lactente), para o tórax continuar visível.
 * Proporções do corpo: só desenho (não são dados clínicos).
 */

import { TECNICA_POR_FAIXA } from '../../dados/parada-cena-a-validar';
import type { FaixaPaciente, LugarNaCena, TecnicaCompressao } from '../../parada/cena';
import { lerp, type Ponto } from '../formas';

export const LARGURA_CENA = 800;
export const ALTURA_CENA = 380;
/** Onde a parede encontra o chão. */
export const HORIZONTE = 246;
/** Pixels por centímetro (pessoa de 168 cm = 210 de altura). */
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
/** Distância mínima entre duas pessoas lado a lado atrás da maca (sem uma encobrir a outra). */
export const DISTANCIA_LADO_A_LADO = 50;

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
    joelho: 38.5, tornozelo: 47.5, apTorax: 9, apAbdome: 9.6, coxa: 6.4, perna: 4.6, pe: 7.6, braco: 8.6, antebraco: 7.4, mao: 5.4,
    grossuraBraco: 3.2, rosto: 'bebe', nariz: 0.25, flexaoJoelho: 32, pontoCompressao: 0.35,
  },
  lactente: {
    comprimento: 70, cabeca: 14.5, profCabeca: 14.2, ombro: 16.6, mamilos: 22, xifoide: 26.2, umbigo: 32.5, pube: 39,
    joelho: 53, tornozelo: 66, apTorax: 11.2, apAbdome: 11.6, coxa: 8.4, perna: 6, pe: 10.4, braco: 11.6, antebraco: 10, mao: 7,
    grossuraBraco: 4.3, rosto: 'bebe', nariz: 0.4, flexaoJoelho: 20, pontoCompressao: 0.3,
  },
  crianca: {
    comprimento: 120, cabeca: 19, profCabeca: 17.6, ombro: 23.6, mamilos: 32, xifoide: 38.4, umbigo: 50, pube: 63,
    joelho: 90, tornozelo: 115, apTorax: 15, apAbdome: 14.2, coxa: 11.4, perna: 8, pe: 18, braco: 21, antebraco: 18, mao: 12.5,
    grossuraBraco: 6.4, rosto: 'crianca', nariz: 0.7, flexaoJoelho: 4, pontoCompressao: 0.6,
  },
  adolescente: {
    comprimento: 160, cabeca: 22, profCabeca: 20, ombro: 29, mamilos: 41, xifoide: 49, umbigo: 66, pube: 82,
    joelho: 119, tornozelo: 154, apTorax: 20, apAbdome: 17.6, coxa: 14.6, perna: 10, pe: 24, braco: 30, antebraco: 25, mao: 18,
    grossuraBraco: 8.4, rosto: 'crianca', nariz: 1, flexaoJoelho: 3, pontoCompressao: 0.6,
  },
};

// ---- Leito e lugares de cada faixa --------------------------------------------------------

export interface Leito {
  tipo: 'maca' | 'berco';
  /** Pontas (x) do colchão. */
  x0: number;
  x1: number;
  /** Topo do colchão (onde o paciente encosta). */
  topo: number;
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
  /** Vértice da cabeça do paciente (x) — o corpo vai para a direita. */
  xPaciente: number;
  carrinho: Carrinho;
  /** Régua de oxigênio na parede (fluxômetro). */
  oxigenio: Ponto;
  lugares: Record<LugarNaCena, LugarGeo>;
  camera: Camera;
  /** Tamanho da bolsa-válvula (comprimento) e da máscara. */
  bolsa: number;
}

const TOPO_MACA = 230;
const TOPO_BERCO = 224;

function carrinhoEm(x: number, chao: number): Carrinho {
  const topo = chao - 116;
  return {
    x,
    chao,
    topo,
    largura: 70,
    tela: { x: x - 4, y: topo - 21 },
    botaoCarga: { x: x + 20, y: topo - 26 },
    botaoChoque: { x: x + 20, y: topo - 14 },
    saidaCabos: { x: x - 30, y: topo - 8 },
  };
}

/**
 * Monta o lugar de cada um em volta do leito (mundo) e a câmera que enquadra todos.
 * Ninguém fica na frente do paciente: quem comprime, o 2º compressor e quem faz o acesso ficam atrás
 * da maca; via aérea na cabeceira; líder nos pés; monitor/desfibrilador ao lado do carrinho.
 */
function layout(faixa: FaixaPaciente): LayoutFaixa {
  const p = PROPORCOES[faixa];
  const berco = faixa === 'rn';
  // RN no berço aquecido; lactente numa maca pediátrica (mais curta); maiores na maca comum
  const comprimentoLeito = berco ? 100 : faixa === 'lactente' ? 132 : 190;
  const centro = 404;
  const x0 = Math.round(centro - (comprimentoLeito * PX_CM) / 2);
  const x1 = Math.round(centro + (comprimentoLeito * PX_CM) / 2);
  const topo = berco ? TOPO_BERCO : TOPO_MACA;
  const xPaciente = berco ? x0 + 16 : x0 + 6;
  const leito: Leito = { tipo: berco ? 'berco' : 'maca', x0, x1, topo, chao: 330 };
  const X = (cm: number) => xPaciente + cm * PX_CM;
  // em volta do berço a equipe fica mais junta
  const junto = berco ? 0.78 : faixa === 'lactente' ? 0.9 : 1;
  const xTorax = X(lerp(p.mamilos, p.xifoide, p.pontoCompressao));
  const xPeriferico = X(p.ombro + 1.5 + p.braco * 0.97 + p.antebraco * 0.7);
  const xTibia = X(p.joelho + (p.tornozelo - p.joelho) * 0.14);
  // quem pega o acesso fica à direita de quem comprime (sem se encobrirem); o 2º compressor depois dele
  const xCompressor = xTorax + (TECNICA_POR_FAIXA[faixa].tecnica === 'uma-mao' ? MEIO_OMBRO - 2 : 0);
  const xAcesso = Math.max(Math.max(xPeriferico, xTibia) + 16, xCompressor + DISTANCIA_LADO_A_LADO);
  const xEspera = Math.max(xTorax + 54, xAcesso + 46);
  const xLider = Math.max(x1 + 40 * junto, xEspera + 46);
  const carrinho = carrinhoEm(xLider + 80 * junto, 304);
  const xCabeca = x0 - 28;
  const xRegistro = xCabeca - 84 * junto;
  const lugares: Record<LugarNaCena, LugarGeo> = {
    tempo: { x: xRegistro - 78 * junto, y: 290, escala: 0.86, giro: 0.45, camada: 'fundo' },
    registro: { x: xRegistro, y: 288, escala: 0.86, giro: 0.3, camada: 'fundo' },
    cabeca: { x: xCabeca, y: 336, escala: 1, giro: 0.62, camada: 'cabeceira' },
    torax: { x: xTorax, y: 318, escala: 1, giro: 0, camada: 'atras' },
    acesso: { x: xAcesso, y: 316, escala: 0.98, giro: -0.5, camada: 'atras' },
    espera: { x: xEspera, y: 314, escala: 0.97, giro: -0.25, camada: 'atras' },
    pes: { x: xLider, y: 340, escala: 1, giro: -0.5, camada: 'pes' },
    desfibrilador: { x: carrinho.x + 62 * junto, y: 334, escala: 1, giro: -0.55, camada: 'carrinho' },
  };
  // câmera: do cronometrista ao monitor, com espaço em cima para nomes e balões
  const xMin = lugares.tempo.x - 32;
  const xMax = lugares.desfibrilador.x + 36;
  const zoom = Math.min(1.7, LARGURA_CENA / (xMax - xMin));
  const xCam = (xMin + xMax) / 2 - LARGURA_CENA / zoom / 2;
  const topoNomes = 318 - ALTURA_AVATAR - 18;
  const yCam = topoNomes - 60 / zoom;
  const bolsa = faixa === 'adolescente' ? 34 : faixa === 'crianca' ? 27 : 21;
  return {
    faixa,
    leito,
    xPaciente,
    carrinho,
    oxigenio: { x: x0 - 66, y: 150 },
    lugares,
    camera: { zoom, x: xCam, y: yCam },
    bolsa,
  };
}

const CACHE: Partial<Record<FaixaPaciente, LayoutFaixa>> = {};

export function layoutDaFaixa(faixa: FaixaPaciente): LayoutFaixa {
  return (CACHE[faixa] ??= layout(faixa));
}

/** Converte um ponto do mundo para a tela (viewBox) com a câmera. */
export function naTela(c: Camera, p: Ponto): Ponto {
  return { x: (p.x - c.x) * c.zoom, y: (p.y - c.y) * c.zoom };
}

// ---- Corpo do paciente (pontos do mundo) ----------------------------------------------------

export interface CorpoPaciente {
  P: ProporcoesCorpo;
  /** cm → mundo. */
  em: (x: number, h: number) => Ponto;
  /** Altura (cm) do contorno da frente do tronco em x (cm), já com compressão e expansão. */
  alturaTronco: (x: number) => number;
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
  /** Borda da máscara no rosto (perto do nariz e no queixo) e a conexão no alto da máscara. */
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
      [0.45, 0], [0.24, 0.04], [0.08, 0.17], [0, 0.4], [0.04, 0.6], [0.16, 0.74], [0.3, 0.815], [0.41, 0.84], [0.46, 0.825],
      [0.53, 0.86], [0.6, 0.85], [0.635, 0.84], [0.65, 0.825], [0.7, 0.855], [0.74, 0.84], [0.78, 0.85], [0.83, 0.815],
      [0.91, 0.84], [0.985, 0.75], [0.98, 0.58], [0.86, 0.36], [0.68, 0.1],
    ],
    ajusteNariz: [[9, 0.05], [10, 0.1], [11, 0.04]],
    iLabios: [13, 15],
    iQueixo: 18,
    boca: [0.74, 0.845],
    nariz: [0.6, 0.85],
    mascara: [0.68, 0.9],
    mascaraBase: [[0.45, 0.83], [0.95, 0.8]],
    mascaraTopo: [0.68, 1.12],
    olho: [0.49, 0.72],
    sobrancelha: [0.42, 0.75],
    orelha: [0.55, 0.36],
    narina: [0.635, 0.815],
    bochecha: [0.66, 0.66],
    linhaCabelo: [[0.16, 0.75], [0.26, 0.66], [0.38, 0.56], [0.45, 0.44], [0.55, 0.2], [0.68, 0.1]],
  },
  bebe: {
    contorno: [
      [0.45, 0], [0.22, 0.05], [0.06, 0.2], [0, 0.45], [0.05, 0.68], [0.17, 0.84], [0.32, 0.91], [0.46, 0.9], [0.52, 0.865],
      [0.57, 0.875], [0.615, 0.875], [0.64, 0.865], [0.66, 0.85], [0.705, 0.875], [0.74, 0.86], [0.775, 0.868], [0.815, 0.835],
      [0.87, 0.845], [0.925, 0.75], [0.94, 0.58], [0.84, 0.34], [0.66, 0.08],
    ],
    ajusteNariz: [[9, 0.05], [10, 0.1], [11, 0.04]],
    iLabios: [13, 15],
    iQueixo: 18,
    boca: [0.74, 0.865],
    nariz: [0.615, 0.875],
    mascara: [0.69, 0.92],
    mascaraBase: [[0.5, 0.88], [0.9, 0.8]],
    mascaraTopo: [0.69, 1.14],
    olho: [0.54, 0.76],
    sobrancelha: [0.47, 0.8],
    orelha: [0.6, 0.38],
    narina: [0.645, 0.845],
    bochecha: [0.7, 0.7],
    linhaCabelo: [[0.12, 0.8], [0.22, 0.66], [0.34, 0.5], [0.45, 0.36], [0.55, 0.18], [0.64, 0.06]],
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
    [P.cabeca * 0.97, P.profCabeca * 0.54],
    [P.cabeca + (P.ombro - P.cabeca) * 0.55, P.profCabeca * (bebe ? 0.52 : 0.49)],
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

/** Contorno da frente do tronco em repouso (cm acima do colchão). */
const CONTROLE = new Map<ProporcoesCorpo, [number, number][]>();
function alturaBase(P: ProporcoesCorpo, x: number): number {
  let c = CONTROLE.get(P);
  if (!c) CONTROLE.set(P, (c = controleTronco(P)));
  return interpolar(c, x);
}

/**
 * Corpo do paciente no mundo. `compressao` 0–1 afunda o esterno (o contorno do peito desce de verdade),
 * `expansao` 0–1 sobe o tórax, `choque` 0–1 dá o tranco (o corpo sobe e os braços pulam).
 */
export function corpoDoPaciente(faixa: FaixaPaciente, compressao = 0, expansao = 0, choque = 0): CorpoPaciente {
  const L = layoutDaFaixa(faixa);
  const P = PROPORCOES[faixa];
  const tranco = choque > 0 ? Math.sin(choque * Math.PI) * 3.2 : 0;
  const em = (x: number, h: number): Ponto => ({ x: L.xPaciente + x * PX_CM, y: L.leito.topo - h * PX_CM - tranco });
  const xc = lerp(P.mamilos, P.xifoide, P.pontoCompressao);
  // afundamento um pouco exagerado no desenho para ver bem (1/3 do AP × 1,1)
  const afundaCm = Math.min(1, Math.max(0, compressao)) * P.apTorax * 0.36;
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
  const torax = em(xc, alturaTronco(xc));
  const toraxRepouso = em(xc, alturaBase(P, xc));

  // rosto (frações do tamanho da cabeça): boca e nariz para cima
  const R = ROSTOS[P.rosto];
  const doRosto = (f: readonly [number, number], extra = 0) => em(f[0] * P.cabeca, (f[1] + extra) * P.profCabeca);
  const boca = doRosto(R.boca);
  const nariz = doRosto(R.nariz, 0.1 * P.nariz);
  const mascara = doRosto(R.mascara, 0.05 * P.nariz);
  const mascaraBase: [Ponto, Ponto] = [doRosto(R.mascaraBase[0]), doRosto(R.mascaraBase[1])];
  const mascaraTopo = doRosto(R.mascaraTopo, 0.08 * P.nariz);
  const tuboTopo = { x: boca.x - 1, y: boca.y - P.profCabeca * PX_CM * 0.62 };

  // braço do lado de cá (direito do paciente), deitado ao lado do corpo; o choque faz o braço pular
  const gb = P.grossuraBraco;
  const pulo = choque > 0 ? Math.sin(choque * Math.PI) * gb * 0.9 : 0;
  const xOmbro = P.ombro + 1.5;
  const xCotovelo = xOmbro + P.braco * 0.97;
  const xPunho = xCotovelo + P.antebraco;
  const ombro = em(xOmbro, P.apTorax * 0.5);
  const cotovelo = em(xCotovelo, gb * 0.5 + pulo);
  const punho = em(xPunho, gb * 0.38 + pulo * 1.4);
  const ponta = em(xPunho + P.mao, gb * 0.16 + pulo * 1.4);
  // acesso periférico: face de cima do antebraço, perto do punho
  const periferico = em(lerp(xCotovelo, xPunho, 0.7), lerp(gb * 0.5, gb * 0.38, 0.7) + pulo * 1.3 + gb * 0.37);

  // perna do lado de cá: coxa sobe até o joelho (flexão nos bebês), perna desce até o tornozelo
  const quadrilCm = { x: P.pube - P.coxa * 0.15, h: P.coxa * 0.5 };
  const coxaLen = P.joelho - quadrilCm.x;
  const pernaLen = P.tornozelo - P.joelho;
  const ang = (P.flexaoJoelho * Math.PI) / 180;
  const joelhoCm = { x: quadrilCm.x + coxaLen * Math.cos(ang), h: quadrilCm.h + coxaLen * Math.sin(ang) };
  const tornozeloH = P.perna * 0.42;
  const desce = Math.min(0.999, Math.max(-0.999, (joelhoCm.h - tornozeloH) / pernaLen));
  const tornozeloCm = { x: joelhoCm.x + pernaLen * Math.cos(Math.asin(desce)), h: tornozeloH };
  const angPe = (64 * Math.PI) / 180;
  const quadril = em(quadrilCm.x, quadrilCm.h);
  const joelho = em(joelhoCm.x, joelhoCm.h);
  const tornozelo = em(tornozeloCm.x, tornozeloCm.h);
  const pontaPe = em(tornozeloCm.x + P.pe * 0.82 * Math.cos(angPe), tornozeloH + P.pe * 0.82 * Math.sin(angPe));
  const calcanhar = em(tornozeloCm.x + P.perna * 0.1, P.perna * 0.05);
  // tíbia (intraóssea): logo abaixo do joelho, na face de cima da perna
  const dx = tornozeloCm.x - joelhoCm.x;
  const dh = tornozeloCm.h - joelhoCm.h;
  const dl = Math.hypot(dx, dh) || 1;
  const tibia = em(joelhoCm.x + dx * 0.14 - (dh / dl) * P.perna * 0.47, joelhoCm.h + dh * 0.14 + (dx / dl) * P.perna * 0.47);

  return {
    P,
    em,
    alturaTronco,
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
    braco: { ombro, cotovelo, punho, ponta },
    perna: { quadril, joelho, tornozelo, ponta: pontaPe, calcanhar },
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
  if (tecnica === 'dois-polegares') return 50;
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
