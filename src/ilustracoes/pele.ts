/**
 * Cores de pele e utilidades de cor das ilustrações (sem tela).
 * Três tons (claro, moreno, negro) — os achados (icterícia, cianose, manchas) mudam de
 * aparência conforme o tom, como na vida real.
 */

import type { TomDePele } from '../neonatal/exame';

export interface PaletaPele {
  base: string;
  sombra: string;
  luz: string;
  contorno: string;
  labio: string;
  rubor: string;
  unha: string;
  cabelo: string;
  /** Mucosa (boca, conjuntiva). */
  mucosa: string;
}

export const PALETAS: Record<TomDePele, PaletaPele> = {
  claro: {
    base: '#f3c4a6',
    sombra: '#d48f72',
    luz: '#fde3d2',
    contorno: '#b9735c',
    labio: '#d9777b',
    rubor: '#ef8f8c',
    unha: '#f7d9cf',
    cabelo: '#6b4a32',
    mucosa: '#e0848c',
  },
  moreno: {
    base: '#c98c62',
    sombra: '#97603d',
    luz: '#e5b38d',
    contorno: '#7c4a2c',
    labio: '#a95b55',
    rubor: '#cf7a62',
    unha: '#e4c0a8',
    cabelo: '#2e1d12',
    mucosa: '#c86f74',
  },
  negro: {
    base: '#7b4b2f',
    sombra: '#4b2b19',
    luz: '#a26a45',
    contorno: '#3a2013',
    labio: '#5d3427',
    rubor: '#8d4a35',
    unha: '#c39a86',
    cabelo: '#140c08',
    mucosa: '#b35f68',
  },
};

export const NOME_TOM: Record<TomDePele, string> = { claro: 'Pele clara', moreno: 'Pele parda', negro: 'Pele negra' };

function paraRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const cheio = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(cheio.slice(i, i + 2), 16)) as [number, number, number];
}

function paraHex(rgb: readonly number[]): string {
  return `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
}

/** Mistura duas cores: t = 0 → a; t = 1 → b. */
export function misturar(a: string, b: string, t: number): string {
  const x = paraRgb(a);
  const y = paraRgb(b);
  return paraHex(x.map((v, i) => v + (y[i]! - v) * t));
}

/** Cor da pele com um "tom" por cima (cianose, palidez, pletora...). */
export type TintaPele = 'cianose' | 'palidez' | 'pletora' | 'ictericia';

const TINTAS: Record<TintaPele, { cor: string; forca: Record<TomDePele, number> }> = {
  cianose: { cor: '#6d79b8', forca: { claro: 0.42, moreno: 0.34, negro: 0.26 } },
  palidez: { cor: '#efe6df', forca: { claro: 0.5, moreno: 0.36, negro: 0.24 } },
  pletora: { cor: '#b8262b', forca: { claro: 0.34, moreno: 0.26, negro: 0.18 } },
  ictericia: { cor: '#f0c419', forca: { claro: 0.5, moreno: 0.3, negro: 0.14 } },
};

/** Paleta inteira com a tinta aplicada (lábios também mudam na cianose e na palidez). */
export function paletaComTinta(tom: TomDePele, tinta?: TintaPele): PaletaPele {
  const p = PALETAS[tom];
  if (!tinta) return p;
  const t = TINTAS[tinta];
  const f = t.forca[tom];
  const mudar = (c: string, extra = 1) => misturar(c, t.cor, Math.min(1, f * extra));
  return {
    ...p,
    base: mudar(p.base),
    sombra: mudar(p.sombra, 0.8),
    luz: mudar(p.luz),
    rubor: tinta === 'palidez' || tinta === 'cianose' ? mudar(p.rubor, 1.5) : mudar(p.rubor),
    labio: tinta === 'cianose' ? misturar(p.labio, '#6a4c9c', 0.6) : tinta === 'palidez' ? misturar(p.labio, '#ead8d3', 0.55) : mudar(p.labio, 0.6),
    mucosa: tinta === 'cianose' ? misturar(p.mucosa, '#6a4c9c', 0.55) : tinta === 'palidez' ? misturar(p.mucosa, '#f0dedb', 0.5) : p.mucosa,
    unha: tinta === 'cianose' ? misturar(p.unha, '#7a7fc0', 0.5) : p.unha,
  };
}

/** Gerador pseudoaleatório fixo (as manchas ficam sempre no mesmo lugar). */
export function pontosFixos(semente: number, quantos: number): number[] {
  let s = semente >>> 0 || 1;
  const r: number[] = [];
  for (let i = 0; i < quantos; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    r.push(s / 4294967296);
  }
  return r;
}

/** Ids únicos para gradientes/filtros dentro de um SVG (useId do React tem ":"). */
export function idSvg(base: string): (nome: string) => string {
  const limpo = base.replace(/[^a-zA-Z0-9_-]/g, '');
  return (nome) => `${limpo}-${nome}`;
}
