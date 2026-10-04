/**
 * Onde ficam os nomes (etiquetas) e os balões de fala da cena da RCP (sem tela).
 * Regras: nada sai do quadro; etiqueta não bate em etiqueta; balão não bate em etiqueta, em outro
 * balão, na cabeça de ninguém nem no paciente; o balão fica perto de quem fala, com a ponta curta e
 * larga, sem passar por baixo de outro balão. Para isso, o nome de quem não está falando pode sair do
 * lugar (vai para o lado ou para o peito, como um crachá). Tudo em coordenadas da tela (viewBox 800 × 380).
 * Quando não há lugar perfeito, fica onde atrapalha menos.
 */

import { ALTURA_CENA, LARGURA_CENA, quebrarTexto } from './geometria';
import type { Ponto } from '../formas';

export interface Caixa {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** As duas caixas se encostam (com folga)? */
export function batem(a: Caixa, b: Caixa, folga = 2): boolean {
  return a.x < b.x + b.w + folga && a.x + a.w + folga > b.x && a.y < b.y + b.h + folga && a.y + a.h + folga > b.y;
}

function area(a: Caixa, b: Caixa): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Caixa inteira dentro do quadro? */
export function dentroDoQuadro(c: Caixa, margem = 2): boolean {
  return c.x >= margem && c.y >= margem && c.x + c.w <= LARGURA_CENA - margem && c.y + c.h <= ALTURA_CENA - margem;
}

/** Largura aproximada do texto (fonte do sistema, negrito). */
export function larguraTexto(texto: string, tamanho: number): number {
  let n = 0;
  for (const c of texto) n += /[←-⯿\u{1F300}-\u{1FAFF}]/u.test(c) ? 1.6 : /[A-ZÁÉÍÓÚÂÊÔÃÕÇMW]/.test(c) ? 1.25 : /[iljtfI.,:;!' \u00a0]/.test(c) ? 0.6 : 1;
  return n * tamanho * 0.6;
}

export interface PedidoRotulo {
  papel: string;
  /** Topo da cabeça na tela (a etiqueta fica logo acima). */
  ancora: Ponto;
  nome: string;
  balao?: string;
  /** Menor = escolhe o lugar primeiro (quem comprime, depois o líder...). */
  prioridade: number;
  /** Tronco e mãos de quem está fazendo algo com as mãos (o próprio balão evita cobrir). */
  maos?: Caixa;
}

export interface RotuloPosto {
  papel: string;
  caixa: Caixa;
  ancora: Ponto;
  /** Saiu de cima da cabeça (desenha um tracinho até a cabeça). */
  deslocado: boolean;
}

export interface BalaoPosto {
  papel: string;
  caixa: Caixa;
  linhas: string[];
  /** Para onde aponta a ponta do balão (a etiqueta, o rosto ou o queixo de quem fala). */
  alvo: Ponto;
}

/** Custos da escolha do lugar dos balões (quanto maior, mais se evita). */
const CUSTO = {
  /** Nome, outro balão, a ponta de outro balão ou o próprio rosto: só quando não há outro jeito. */
  forte: 4000,
  /** Rosto de outra pessoa: evita; um rosto inteiro coberto pesa mais que o balão ficar um pouco mais longe. */
  rosto: 400,
  /** Nome de quem não está falando: ele sai do lugar depois (para o lado, com um tracinho até a cabeça, ou para o peito). */
  nomeQueSai: 300,
  /** O que precisa ficar à vista (tela e botões do desfibrilador). */
  aVista: 300,
  /** Tronco e mãos de quem fala, quando está fazendo algo com elas. */
  maos: 150,
  /** Por unidade de ponta além do tamanho normal: o balão fica perto de quem fala. */
  pontaPorUnidade: 10,
  pontaNormal: 14,
} as const;

/** Tamanhos dos rótulos para uma fonte (unidades do viewBox). */
export function medidas(fonte: number) {
  return { alturaEtiqueta: fonte * 1.48, linhaBalao: fonte * 1.17, folgaBalao: fonte * 0.8, larguraMaxBalao: fonte * 14.5 };
}

/**
 * O primeiro candidato livre; se nenhum estiver livre, o que atrapalha menos. Pior de tudo: sair do quadro;
 * depois, cobrir o paciente; depois, cobrir outro nome ou balão (`fortes`); por último, cobrir uma cabeça (`fracos`).
 */
function melhor(candidatos: readonly Caixa[], fortes: readonly Caixa[], fracos: readonly Caixa[], folga: number, proibido?: Caixa): Caixa {
  let escolhido: Caixa | undefined;
  let menor = Infinity;
  for (const c of candidatos) {
    const fora = dentroDoQuadro(c) ? 0 : 1e8;
    const noPaciente = proibido && batem(c, proibido, 0) ? 1e7 + area(c, proibido) : 0;
    const custo =
      fora +
      noPaciente +
      fortes.reduce((s, o) => s + (batem(c, o, folga) ? 4000 + 5 * area(c, o) : 0), 0) +
      fracos.reduce((s, o) => s + (batem(c, o, folga) ? 50 + area(c, o) : 0), 0);
    if (custo === 0) return c;
    if (custo < menor) {
      menor = custo;
      escolhido = c;
    }
  }
  return escolhido ?? candidatos[0]!;
}

const limitarX = (x: number, w: number) => Math.min(LARGURA_CENA - w - 3, Math.max(3, x));
const limitarY = (y: number, h: number) => Math.min(ALTURA_CENA - h - 3, Math.max(3, y));

/**
 * Arruma etiquetas e balões. `cabecas`: caixas das cabeças (na tela, na mesma ordem dos pedidos);
 * `paciente`: caixa do paciente (balão nunca cobre); `aVista`: o que o balão evita cobrir (o desfibrilador).
 * Cada balão fica perto de quem fala (a ponta curta pesa na escolha) e nem ele nem a ponta passam por cima
 * de nomes, de outros balões e das pontas deles.
 */
export function arrumarRotulos(
  pedidos: readonly PedidoRotulo[],
  cabecas: readonly Caixa[],
  paciente: Caixa,
  fonte: number,
  aVista: readonly Caixa[] = [],
): { rotulos: RotuloPosto[]; baloes: BalaoPosto[] } {
  // a cena é desenhada 60 vezes por segundo, mas nomes e balões só mudam quando alguém fala, chega ou troca de lugar
  const chave = JSON.stringify([pedidos, cabecas, paciente, fonte, aVista]);
  const guardado = ARRUMADOS.get(chave);
  if (guardado) return guardado;
  const r = arrumar(pedidos, cabecas, paciente, fonte, aVista);
  if (ARRUMADOS.size >= 60) ARRUMADOS.delete(ARRUMADOS.keys().next().value!);
  ARRUMADOS.set(chave, r);
  return r;
}

const ARRUMADOS = new Map<string, { rotulos: RotuloPosto[]; baloes: BalaoPosto[] }>();

function arrumar(pedidos: readonly PedidoRotulo[], cabecas: readonly Caixa[], paciente: Caixa, fonte: number, aVista: readonly Caixa[]): { rotulos: RotuloPosto[]; baloes: BalaoPosto[] } {
  const M = medidas(fonte);
  const h = M.alturaEtiqueta;
  const ordem = pedidos.map((p, i) => ({ p, i })).sort((a, b) => a.p.prioridade - b.p.prioridade || a.p.ancora.x - b.p.ancora.x);
  const rotulos: RotuloPosto[] = [];
  const postas: Caixa[] = [];
  for (const { p, i } of ordem) {
    const w = Math.max(fonte * 2.6, larguraTexto(p.nome, fonte) + fonte * 1.3);
    const x0 = p.ancora.x - w / 2;
    const y0 = p.ancora.y - h - 2;
    const passo = h + 3;
    const deslocs: [number, number][] = [[0, 0], [0, -1], [-0.55, 0], [0.55, 0], [-0.55, -1], [0.55, -1], [0, -2], [0, 1]];
    const candidatos = deslocs.map(([dx, dy]) => ({ x: limitarX(x0 + dx * w, w), y: limitarY(y0 + dy * passo, h), w, h }));
    const outrasCabecas = cabecas.filter((_, j) => j !== i);
    const caixa = melhor(candidatos, postas, outrasCabecas, 2, paciente);
    postas.push(caixa);
    rotulos.push({ papel: p.papel, caixa, ancora: p.ancora, deslocado: Math.abs(caixa.y - y0) > 1 || Math.abs(caixa.x - limitarX(x0, w)) > w * 0.3 });
  }
  // nomes de quem não está falando podem sair do lugar para o balão de quem fala ficar perto dele
  const falantes = new Set(pedidos.filter((p) => p.balao).map((p) => p.papel));
  /** Caixa do nome → posição dele em `rotulos` (só os nomes que podem sair). */
  const nomesQueSaem = new Map(rotulos.flatMap((r, k) => (falantes.has(r.papel) ? [] : [[r.caixa, k] as const])));
  const pedidoDe = new Map(ordem.map(({ p, i }) => [p.papel, { p, i }]));
  /**
   * Para onde vai o nome `k` se balões e pontas ocuparem o lugar dele: o lugar livre mais perto, sem cobrir
   * outro nome, o paciente nem o próprio rosto. Devolve também quanto isso atrapalha (entra na escolha do balão).
   */
  const realocar = (k: number, caixasBaloes: readonly Caixa[], segs: readonly (readonly [Ponto, Ponto])[], nomes: readonly Caixa[]): { caixa: Caixa; custo: number } => {
    const r = rotulos[k]!;
    const { p, i } = pedidoDe.get(r.papel)!;
    const { w } = r.caixa;
    const x0 = p.ancora.x - w / 2;
    const y0 = p.ancora.y - h - 2;
    const passo = h + 3;
    const custoDe = (c: Caixa) => {
      let custo = dentroDoQuadro(c) ? 0 : 1e8;
      if (batem(c, paciente, 0)) custo += 1e7;
      for (const b of caixasBaloes) if (batem(c, b, 2)) custo += 1e6;
      for (const [a, b] of segs) if (segmentoBate(a, b, c, 1)) custo += 1e6;
      nomes.forEach((o, j) => {
        if (j !== k && batem(c, o, 2)) custo += CUSTO.forte + 5 * area(c, o);
      });
      cabecas.forEach((o, j) => {
        // descer para cima dos olhos de quem é o nome atrapalha tanto quanto cobrir outro nome; o rosto dos outros, menos
        if (batem(c, o, j === i ? 0 : 2)) custo += j === i ? CUSTO.forte + 5 * area(c, o) : CUSTO.rosto + 2 * area(c, o);
      });
      return custo + 2 * Math.hypot(c.x - x0, c.y - y0);
    };
    const candidatos = DESLOCAMENTOS_DO_NOME.map(([dx, dy]) => ({ x: limitarX(x0 + dx * w, w), y: limitarY(y0 + dy * passo, h), w, h }));
    // por fim, no peito, como um crachá (logo abaixo do queixo)
    const propria = cabecas[i];
    if (propria) candidatos.push({ x: limitarX(x0, w), y: limitarY(propria.y + propria.h + 4, h), w, h });
    let caixa = r.caixa;
    let menor = custoDe(r.caixa);
    for (const c of candidatos) {
      const custo = custoDe(c);
      if (custo < menor) {
        menor = custo;
        caixa = c;
      }
    }
    return { caixa, custo: menor };
  };

  // balões: tamanho e lugares possíveis de cada um (não dependem da ordem)
  const falas = ordem
    .filter(({ p }) => p.balao)
    .sort((a, b) => (a.p.papel === 'lider' ? -1 : b.p.papel === 'lider' ? 1 : a.p.ancora.x - b.p.ancora.x))
    .map(({ p, i }) => {
      const porLinha = Math.max(12, Math.round((M.larguraMaxBalao - fonte * 1.6) / (fonte * 0.6)));
      const linhas = quebrarTexto(p.balao!, Math.min(fonte > 15 ? 17 : 22, porLinha), 3);
      const w = Math.min(M.larguraMaxBalao, Math.max(...linhas.map((l) => larguraTexto(l, fonte))) + fonte * 1.6);
      const bh = linhas.length * M.linhaBalao + M.folgaBalao;
      const et = rotulos.find((r) => r.papel === p.papel)!.caixa;
      const cabeca = cabecas[i];
      return { p, i, linhas, et, cabeca, cand: lugaresDoBalao(w, bh, et, cabeca) };
    });

  /** Põe os balões nesta ordem (cada um no lugar que atrapalha menos, vendo os que já estão postos). */
  const colocar = (seq: typeof falas): { baloes: BalaoPosto[]; total: number } => {
    const baloes: BalaoPosto[] = [];
    /** Pontas já desenhadas (do lado do balão até quem fala): os balões seguintes não passam por cima. */
    const pontas: [Ponto, Ponto][] = [];
    let total = 0;
    for (const { p, i, linhas, et, cabeca, cand } of seq) {
      const outrosRostos = cabecas.filter((_, j) => j !== i);
      const fortes = [...postas, ...baloes.map((b) => b.caixa)];
      const custoDe = (c: Caixa): number => {
        let custo = dentroDoQuadro(c) ? 0 : 1e8;
        if (batem(c, paciente, 0)) custo += 1e7 + area(c, paciente);
        const pt = pontaDoBalao(c, alvoDoBalao(c, et, cabeca));
        for (const o of fortes) {
          const k = nomesQueSaem.get(o);
          const noCaminho = batem(c, o, 3) || (o !== et && segmentoBate(pt.base, pt.ponta, o, 1));
          if (!noCaminho) continue;
          // nome de quem não fala: sai do lugar (custa o quanto atrapalha onde ele for parar); o resto, só se não houver jeito
          if (k !== undefined) custo += CUSTO.nomeQueSai + realocar(k, [...baloes.map((b) => b.caixa), c], [...pontas, [pt.base, pt.ponta]], postas).custo;
          else custo += CUSTO.forte + 5 * area(c, o);
        }
        // o rosto de quem fala nunca fica embaixo do próprio balão (custa como um nome)
        if (cabeca && batem(c, cabeca, 3)) custo += CUSTO.forte + 5 * area(c, cabeca);
        for (const o of outrosRostos) if (batem(c, o, 3)) custo += CUSTO.rosto + 2 * area(c, o);
        for (const o of aVista) if (batem(c, o, 2)) custo += CUSTO.aVista + 2 * area(c, o);
        if (p.maos && batem(c, p.maos, 0)) custo += CUSTO.maos + 0.15 * area(c, p.maos);
        for (const [a, b] of pontas) if (segmentoBate(a, b, c, 3)) custo += CUSTO.forte;
        // a ponta: curta (o balão perto de quem fala) e sem passar por cima de rostos
        custo += CUSTO.pontaPorUnidade * Math.max(0, pt.comprimento - CUSTO.pontaNormal);
        for (const o of outrosRostos) if (segmentoBate(pt.base, pt.ponta, o, 0)) custo += CUSTO.rosto;
        return custo;
      };
      let caixa = cand[0]!;
      let menor = Infinity;
      for (const c of cand) {
        const custo = custoDe(c);
        if (custo < menor) {
          menor = custo;
          caixa = c;
        }
        if (custo === 0) break;
      }
      total += menor;
      const alvo = alvoDoBalao(caixa, et, cabeca);
      const pt = pontaDoBalao(caixa, alvo);
      pontas.push([pt.base, pt.ponta]);
      baloes.push({ papel: p.papel, caixa, linhas, alvo });
    }
    return { baloes, total };
  };

  // o líder primeiro, depois da esquerda para a direita; com até 4 falas, experimenta todas as ordens e fica
  // com a que atrapalha menos (quem está espremido no canto escolhe antes de quem tem espaço)
  let melhorArranjo = colocar(falas);
  if (falas.length > 1 && falas.length <= 4) {
    for (const seq of permutacoes(falas)) {
      if (melhorArranjo.total === 0) break;
      const r = colocar(seq);
      if (r.total < melhorArranjo.total) melhorArranjo = r;
    }
  }
  const baloes = melhorArranjo.baloes;

  // os nomes que ficaram embaixo de um balão (ou de uma ponta) saem para o lugar livre mais perto
  const caixasBaloes = baloes.map((b) => b.caixa);
  const segs = baloes.map((b) => {
    const pt = pontaDoBalao(b.caixa, b.alvo);
    return [pt.base, pt.ponta] as const;
  });
  for (const k of nomesQueSaem.values()) {
    const r = rotulos[k]!;
    if (!caixasBaloes.some((b) => batem(r.caixa, b, 2)) && !segs.some(([a, b]) => segmentoBate(a, b, r.caixa, 1))) continue;
    const { caixa } = realocar(k, caixasBaloes, segs, rotulos.map((o) => o.caixa));
    const { p } = pedidoDe.get(r.papel)!;
    const y0 = p.ancora.y - h - 2;
    const x0 = limitarX(p.ancora.x - caixa.w / 2, caixa.w);
    // no peito (abaixo da cabeça) não precisa do tracinho: já está em cima da pessoa
    const noPeito = caixa.y > p.ancora.y;
    rotulos[k] = { ...r, caixa, deslocado: !noPeito && (Math.abs(caixa.y - y0) > 1 || Math.abs(caixa.x - x0) > caixa.w * 0.3) };
  }
  // desenhados na ordem em que foram postos: quem veio depois desviou das pontas dos anteriores (nenhuma fica escondida)
  return { rotulos, baloes };
}

/** Para onde o nome pode ir quando um balão ocupa o lugar dele (em alturas de etiqueta e larguras do nome). */
const DESLOCAMENTOS_DO_NOME: readonly [number, number][] = [
  [0, -1],
  [-0.55, 0],
  [0.55, 0],
  [-0.55, -1],
  [0.55, -1],
  [0, 1],
  [-0.55, 1],
  [0.55, 1],
  [-1.1, 0],
  [1.1, 0],
  [0, -2],
  [-1.1, 1],
  [1.1, 1],
  [0, 2],
];

/** Todas as ordens de uma lista curta. */
function permutacoes<T>(lista: readonly T[]): T[][] {
  if (lista.length <= 1) return [[...lista]];
  return lista.flatMap((x, k) => permutacoes([...lista.slice(0, k), ...lista.slice(k + 1)]).map((resto) => [x, ...resto]));
}

/**
 * Lugares possíveis do balão (w × bh), do melhor para o pior quando empatam: em cima do nome, ao lado do nome,
 * ao lado do rosto, abaixo do queixo e logo abaixo do nome.
 */
function lugaresDoBalao(w: number, bh: number, et: Caixa, cabeca: Caixa | undefined): Caixa[] {
  const cand: Caixa[] = [];
  const por = (x: number, y: number) => cand.push({ x: limitarX(x, w), y: limitarY(y, bh), w, h: bh });
  const cx = et.x + et.w / 2;
  // 1) em cima do nome (centro e puxado para os lados), um pouco mais alto
  for (const y of [et.y - 9 - bh, et.y - 9 - bh * 1.6]) for (const dx of [0, -0.3, 0.3, -0.45, 0.45, -0.7, 0.7]) por(cx - w / 2 + dx * w, y);
  // 2) ao lado do nome
  for (const dy of [0, -0.5, 0.5]) for (const x of [et.x - 8 - w, et.x + et.w + 8]) por(x, et.y + et.h / 2 - bh / 2 + dy * bh);
  if (cabeca) {
    const cc = cabeca.x + cabeca.w / 2;
    // 3) ao lado do rosto (a ponta aponta para a bochecha)
    for (const y of [cabeca.y + cabeca.h / 2 - bh / 2, cabeca.y - bh / 2]) for (const x of [cabeca.x - 8 - w, cabeca.x + cabeca.w + 8]) por(x, y);
    // 4) abaixo do queixo (cobre o corpo de quem fala ou de quem está ao lado, nunca um rosto nem o paciente)
    for (const y of [cabeca.y + cabeca.h + 6, cabeca.y + cabeca.h + 6 + bh * 0.6]) for (const dx of [0, -0.3, 0.3, -0.5, 0.5]) por(cc - w / 2 + dx * w, y);
  }
  // 5) logo abaixo do nome (quando o nome subiu e sobrou espaço até a cabeça)
  for (const dx of [0, -0.3, 0.3]) por(cx - w / 2 + dx * w, et.y + et.h + 8);
  return cand;
}

/** O segmento a→b passa pela caixa (com folga)? */
export function segmentoBate(a: Ponto, b: Ponto, c: Caixa, folga = 0): boolean {
  // recorte de Liang–Barsky
  const x0 = c.x - folga;
  const x1 = c.x + c.w + folga;
  const y0 = c.y - folga;
  const y1 = c.y + c.h + folga;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let t0 = 0;
  let t1 = 1;
  for (const [pp, qq] of [
    [-dx, a.x - x0],
    [dx, x1 - a.x],
    [-dy, a.y - y0],
    [dy, y1 - a.y],
  ] as const) {
    if (pp === 0) {
      if (qq < 0) return false;
    } else {
      const r = qq / pp;
      if (pp < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
      if (t0 > t1) return false;
    }
  }
  return true;
}

/**
 * Para onde a ponta do balão aponta: a borda do nome de quem fala mais perto do balão (de cima, de baixo
 * ou do lado); balão ao lado do rosto aponta para a bochecha; abaixo da cabeça, para o queixo.
 */
export function alvoDoBalao(balao: Caixa, et: Caixa, cabeca?: Caixa): Ponto {
  const meio = balao.x + balao.w / 2;
  // x da borda de cima/de baixo do nome: debaixo do balão (ponta reta) ou o canto do nome mais perto dele
  const xNoNome = Math.min(et.x + et.w - 6, Math.max(et.x + 6, Math.min(balao.x + balao.w - 14, Math.max(balao.x + 14, et.x + et.w / 2))));
  if (balao.y + balao.h <= et.y) return { x: xNoNome, y: et.y };
  if (cabeca && balao.y >= cabeca.y + cabeca.h) return { x: cabeca.x + cabeca.w / 2, y: cabeca.y + cabeca.h };
  if (cabeca && balao.y < cabeca.y + cabeca.h && balao.y + balao.h > cabeca.y && (balao.x >= cabeca.x + cabeca.w || balao.x + balao.w <= cabeca.x)) {
    const y = Math.min(cabeca.y + cabeca.h * 0.75, Math.max(cabeca.y + cabeca.h * 0.4, Math.min(balao.y + balao.h - 8, Math.max(balao.y + 8, cabeca.y + cabeca.h * 0.6))));
    return { x: balao.x >= cabeca.x + cabeca.w ? cabeca.x + cabeca.w : cabeca.x, y };
  }
  if (balao.y >= et.y + et.h) return { x: xNoNome, y: et.y + et.h };
  return { x: meio < et.x + et.w / 2 ? et.x : et.x + et.w, y: Math.min(balao.y + balao.h - 6, Math.max(balao.y + 6, et.y + et.h / 2)) };
}

type Lado = 'baixo' | 'cima' | 'esquerda' | 'direita';

/** Lado do balão de onde sai a ponta: o que fica de frente para quem fala (o maior afastamento manda). */
export function ladoDaPonta(c: Caixa, alvo: Ponto): Lado {
  const dx = Math.max(c.x - alvo.x, alvo.x - (c.x + c.w), 0);
  const dy = Math.max(c.y - alvo.y, alvo.y - (c.y + c.h), 0);
  if (dy > 0 && dy >= dx) return alvo.y > c.y ? 'baixo' : 'cima';
  if (dx > 0) return alvo.x < c.x ? 'esquerda' : 'direita';
  return alvo.y >= c.y + c.h / 2 ? 'baixo' : 'cima';
}

export interface PontaBalao {
  lado: Lado;
  /** Meio da base (na borda do balão), meia largura da base e a ponta. */
  base: Ponto;
  meia: number;
  ponta: Ponto;
  comprimento: number;
}

/** Ponta do balão: sai do lado de quem fala; quanto mais comprida, mais larga a base (nunca vira agulha). */
export function pontaDoBalao(c: Caixa, alvo: Ponto): PontaBalao {
  const r = Math.min(8, c.h / 2);
  const { x, y, w, h } = c;
  const lado = ladoDaPonta(c, alvo);
  const vertical = lado === 'baixo' || lado === 'cima';
  const borda = lado === 'baixo' ? y + h : lado === 'cima' ? y : lado === 'esquerda' ? x : x + w;
  const ponta = vertical
    ? { x: alvo.x, y: lado === 'baixo' ? Math.max(y + h + 4, alvo.y - 1) : Math.min(y - 4, alvo.y + 1) }
    : { x: lado === 'esquerda' ? Math.min(x - 4, alvo.x + 2) : Math.max(x + w + 4, alvo.x - 2), y: alvo.y };
  const [ini, fim] = vertical ? [x + r, x + w - r] : [y + r, y + h - r];
  const maxMeia = Math.max(3, (fim - ini) / 2 - 1);
  const noLado = (meia: number) => Math.min(fim - meia, Math.max(ini + meia, vertical ? alvo.x : alvo.y));
  let meia = Math.min(5, maxMeia);
  let base = vertical ? { x: noLado(meia), y: borda } : { x: borda, y: noLado(meia) };
  const comprimento = Math.hypot(ponta.x - base.x, ponta.y - base.y);
  meia = Math.min(maxMeia, Math.max(meia, comprimento * 0.2));
  base = vertical ? { x: noLado(meia), y: borda } : { x: borda, y: noLado(meia) };
  return { lado, base, meia, ponta, comprimento: Math.hypot(ponta.x - base.x, ponta.y - base.y) };
}

/** Contorno do balão com a ponta saindo do lado de quem fala (de baixo, de cima ou do lado). */
export function caminhoBalao(c: Caixa, alvo: Ponto): string {
  const r = Math.min(8, c.h / 2);
  const { x, y, w, h } = c;
  const f = (n: number) => Math.round(n * 10) / 10;
  const { lado, base, meia, ponta } = pontaDoBalao(c, alvo);
  const P = `L ${f(ponta.x)} ${f(ponta.y)}`;
  // cantos arredondados no sentido horário, a partir do canto de cima à esquerda
  const cima = lado === 'cima' ? `H ${f(base.x - meia)} ${P} L ${f(base.x + meia)} ${f(y)} H ${f(x + w - r)}` : `H ${f(x + w - r)}`;
  const direita = lado === 'direita' ? `V ${f(base.y - meia)} ${P} L ${f(x + w)} ${f(base.y + meia)} V ${f(y + h - r)}` : `V ${f(y + h - r)}`;
  const baixo = lado === 'baixo' ? `H ${f(base.x + meia)} ${P} L ${f(base.x - meia)} ${f(y + h)} H ${f(x + r)}` : `H ${f(x + r)}`;
  const esquerda = lado === 'esquerda' ? `V ${f(base.y + meia)} ${P} L ${f(x)} ${f(base.y - meia)} V ${f(y + r)}` : `V ${f(y + r)}`;
  return [
    `M ${f(x + r)} ${f(y)} ${cima}`,
    `Q ${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} ${direita}`,
    `Q ${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} ${baixo}`,
    `Q ${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)} ${esquerda}`,
    `Q ${f(x)} ${f(y)} ${f(x + r)} ${f(y)} Z`,
  ].join(' ');
}
