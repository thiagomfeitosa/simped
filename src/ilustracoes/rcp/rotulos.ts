/**
 * Onde ficam os nomes (etiquetas) e os balões de fala da cena da RCP (sem tela).
 * Regras: nada sai do quadro; etiqueta não bate em etiqueta; balão não bate em etiqueta, em outro
 * balão, na cabeça de ninguém nem no paciente. Tudo em coordenadas da tela (viewBox 800 × 380).
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
  for (const c of texto) n += /[←-⯿\u{1F300}-\u{1FAFF}]/u.test(c) ? 1.6 : /[A-ZÁÉÍÓÚÂÊÔÃÕÇMW]/.test(c) ? 1.25 : /[iljtfI.,:;!' ]/.test(c) ? 0.6 : 1;
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
  /** Para onde aponta a ponta do balão (a etiqueta de quem fala). */
  alvo: Ponto;
}

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
 * `paciente`: caixa do paciente (balão nunca cobre).
 */
export function arrumarRotulos(pedidos: readonly PedidoRotulo[], cabecas: readonly Caixa[], paciente: Caixa, fonte: number): { rotulos: RotuloPosto[]; baloes: BalaoPosto[] } {
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

  // balões: o líder primeiro; depois da esquerda para a direita
  const baloes: BalaoPosto[] = [];
  const falas = ordem.filter(({ p }) => p.balao).sort((a, b) => (a.p.papel === 'lider' ? -1 : b.p.papel === 'lider' ? 1 : a.p.ancora.x - b.p.ancora.x));
  for (const { p, i } of falas) {
    const porLinha = Math.max(12, Math.round((M.larguraMaxBalao - fonte * 1.6) / (fonte * 0.6)));
    const linhas = quebrarTexto(p.balao!, Math.min(fonte > 15 ? 17 : 22, porLinha), 3);
    const w = Math.min(M.larguraMaxBalao, Math.max(...linhas.map((l) => larguraTexto(l, fonte))) + fonte * 1.6);
    const bh = linhas.length * M.linhaBalao + M.folgaBalao;
    const et = rotulos.find((r) => r.papel === p.papel)!.caixa;
    const cx = et.x + et.w / 2;
    const cand: Caixa[] = [];
    const lado = et.w / 2 + w / 2 + 8;
    const cabeca = cabecas[i];
    // em cima da etiqueta (centro, puxado para os lados), mais alto, ao lado da etiqueta, abaixo dela e, por fim,
    // abaixo da própria cabeça (cobre só o corpo de alguém, nunca uma cabeça nem o paciente)
    const alturas = [et.y - 9 - bh, et.y - 9 - bh * 1.6, et.y + et.h / 2 - bh / 2, et.y + et.h + 12, et.y + et.h + 12 + bh * 0.8, et.y + et.h + 12 + bh * 1.6];
    if (cabeca) alturas.push(cabeca.y + cabeca.h + 6, cabeca.y + cabeca.h + 6 + bh * 0.8);
    for (const y of alturas) {
      for (const dx of [0, -0.4 * w, 0.4 * w, -lado, lado, -0.8 * w, 0.8 * w, -1.2 * w, 1.2 * w]) cand.push({ x: limitarX(cx - w / 2 + dx, w), y: limitarY(y, bh), w, h: bh });
    }
    // o rosto de quem fala nunca fica embaixo do próprio balão (custa como um nome); as outras cabeças, menos
    const caixa = melhor(cand, [...postas, ...baloes.map((b) => b.caixa), ...(cabeca ? [cabeca] : [])], cabecas.filter((_, j) => j !== i), 3, paciente);
    baloes.push({ papel: p.papel, caixa, linhas, alvo: alvoDoBalao(caixa, et, cabeca) });
  }
  return { rotulos, baloes };
}

/**
 * Para onde a ponta do balão aponta: a borda da etiqueta de quem fala mais perto do balão
 * (de cima, de baixo ou do lado); balão abaixo da cabeça aponta para o queixo.
 */
export function alvoDoBalao(balao: Caixa, et: Caixa, cabeca?: Caixa): Ponto {
  const cx = et.x + et.w / 2;
  if (balao.y + balao.h <= et.y) return { x: cx, y: et.y };
  if (balao.y >= et.y + et.h) {
    if (cabeca && balao.y >= cabeca.y + cabeca.h) return { x: cabeca.x + cabeca.w / 2, y: cabeca.y + cabeca.h };
    return { x: cx, y: et.y + et.h };
  }
  return { x: balao.x + balao.w / 2 < cx ? et.x : et.x + et.w, y: et.y + et.h / 2 };
}

/** Lado do balão de onde sai a ponta, para apontar para o alvo (quem fala). */
export function ladoDaPonta(c: Caixa, alvo: Ponto): 'baixo' | 'cima' | 'esquerda' | 'direita' {
  if (alvo.y >= c.y + c.h) return 'baixo';
  if (alvo.y <= c.y) return 'cima';
  return alvo.x < c.x + c.w / 2 ? 'esquerda' : 'direita';
}

/** Contorno do balão com a ponta saindo do lado de quem fala (de baixo, de cima ou do lado). */
export function caminhoBalao(c: Caixa, alvo: Ponto): string {
  const r = Math.min(8, c.h / 2);
  const { x, y, w, h } = c;
  const f = (n: number) => Math.round(n * 10) / 10;
  const lado = ladoDaPonta(c, alvo);
  const b = Math.min(x + w - r - 5, Math.max(x + r + 5, alvo.x));
  if (lado === 'baixo') {
    const pontaY = Math.max(y + h + 4, alvo.y - 1);
    return `M ${f(x + r)} ${f(y)} H ${f(x + w - r)} Q ${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} V ${f(y + h - r)} Q ${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} H ${f(b + 5)} L ${f(alvo.x)} ${f(pontaY)} L ${f(b - 5)} ${f(y + h)} H ${f(x + r)} Q ${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)} V ${f(y + r)} Q ${f(x)} ${f(y)} ${f(x + r)} ${f(y)} Z`;
  }
  if (lado === 'cima') {
    const pontaY = Math.min(y - 4, alvo.y + 1);
    return `M ${f(x + r)} ${f(y)} H ${f(b - 5)} L ${f(alvo.x)} ${f(pontaY)} L ${f(b + 5)} ${f(y)} H ${f(x + w - r)} Q ${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} V ${f(y + h - r)} Q ${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} H ${f(x + r)} Q ${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)} V ${f(y + r)} Q ${f(x)} ${f(y)} ${f(x + r)} ${f(y)} Z`;
  }
  const m = Math.min(y + h - r - 4, Math.max(y + r + 4, alvo.y));
  if (lado === 'esquerda') {
    return `M ${f(x + r)} ${f(y)} H ${f(x + w - r)} Q ${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} V ${f(y + h - r)} Q ${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} H ${f(x + r)} Q ${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)} V ${f(m + 4)} L ${f(Math.min(x - 4, alvo.x + 2))} ${f(alvo.y)} L ${f(x)} ${f(m - 4)} V ${f(y + r)} Q ${f(x)} ${f(y)} ${f(x + r)} ${f(y)} Z`;
  }
  return `M ${f(x + r)} ${f(y)} H ${f(x + w - r)} Q ${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} V ${f(m - 4)} L ${f(Math.max(x + w + 4, alvo.x - 2))} ${f(alvo.y)} L ${f(x + w)} ${f(m + 4)} V ${f(y + h - r)} Q ${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} H ${f(x + r)} Q ${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)} V ${f(y + r)} Q ${f(x)} ${f(y)} ${f(x + r)} ${f(y)} Z`;
}
