/** Curvas suaves para os desenhos da RCP (contornos que se deformam a cada quadro). */

import type { Ponto } from '../formas';

const f = (n: number) => Math.round(n * 10) / 10;

/**
 * Curva suave passando por todos os pontos (Catmull-Rom → Bézier). `fechada` liga o último ao primeiro.
 * `continua` = true começa com "L" em vez de "M" (para emendar num caminho já começado).
 */
export function curva(pontos: readonly Ponto[], fechada = false, continua = false, tensao = 1): string {
  const n = pontos.length;
  if (n < 2) return '';
  const p = (i: number) => (fechada ? pontos[(i + n) % n]! : pontos[Math.min(n - 1, Math.max(0, i))]!);
  let d = `${continua ? 'L' : 'M'} ${f(pontos[0]!.x)} ${f(pontos[0]!.y)}`;
  const ultimo = fechada ? n : n - 1;
  for (let i = 0; i < ultimo; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * tensao, y: p1.y + ((p2.y - p0.y) / 6) * tensao };
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * tensao, y: p2.y - ((p3.y - p1.y) / 6) * tensao };
    d += ` C ${f(c1.x)} ${f(c1.y)}, ${f(c2.x)} ${f(c2.y)}, ${f(p2.x)} ${f(p2.y)}`;
  }
  return fechada ? `${d} Z` : d;
}

/** Linha reta por vários pontos (emendando no caminho). */
export function linhas(pontos: readonly Ponto[]): string {
  return pontos.map((q) => `L ${f(q.x)} ${f(q.y)}`).join(' ');
}

/** Ponto girado em volta de um centro (graus, sentido horário na tela). */
export function girar(p: Ponto, centro: Ponto, graus: number): Ponto {
  const r = (graus * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const dx = p.x - centro.x;
  const dy = p.y - centro.y;
  return { x: centro.x + dx * c - dy * s, y: centro.y + dx * s + dy * c };
}

/** Ângulo (graus) de a para b. */
export function angulo(a: Ponto, b: Ponto): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

export const arred = f;
