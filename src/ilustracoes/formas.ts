/**
 * Formas básicas das ilustrações (sem tela): "cápsulas" para braços e pernas
 * (segmento com pontas arredondadas, mais grosso numa ponta que na outra),
 * arcos de ângulo e pontos de uma pose articulada.
 */

export interface Ponto {
  x: number;
  y: number;
}

const f = (n: number) => Math.round(n * 10) / 10;

/**
 * Cápsula entre dois pontos (braço, perna, dedo): largura w1 numa ponta e w2 na outra.
 * Devolve o "d" de um <path> preenchível (serve de clipPath, aceita gradiente).
 */
export function capsula(a: Ponto, b: Ponto, w1: number, w2 = w1): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const r1 = w1 / 2;
  const r2 = w2 / 2;
  const A = { x: a.x + nx * r1, y: a.y + ny * r1 };
  const B = { x: b.x + nx * r2, y: b.y + ny * r2 };
  const C = { x: b.x - nx * r2, y: b.y - ny * r2 };
  const D = { x: a.x - nx * r1, y: a.y - ny * r1 };
  return `M ${f(A.x)} ${f(A.y)} L ${f(B.x)} ${f(B.y)} A ${f(r2)} ${f(r2)} 0 0 0 ${f(C.x)} ${f(C.y)} L ${f(D.x)} ${f(D.y)} A ${f(r1)} ${f(r1)} 0 0 0 ${f(A.x)} ${f(A.y)} Z`;
}

/** Ponto a uma distância e ângulo (graus; 0 = para a direita, 90 = para baixo). */
export function polar(origem: Ponto, distancia: number, anguloGraus: number): Ponto {
  const r = (anguloGraus * Math.PI) / 180;
  return { x: origem.x + Math.cos(r) * distancia, y: origem.y + Math.sin(r) * distancia };
}

/** Arco (para marcar um ângulo) com centro, raio e ângulos inicial/final em graus. */
export function arco(c: Ponto, raio: number, deGraus: number, ateGraus: number): string {
  const a = polar(c, raio, deGraus);
  const b = polar(c, raio, ateGraus);
  let delta = ateGraus - deGraus;
  while (delta < 0) delta += 360;
  const grande = delta > 180 ? 1 : 0;
  return `M ${f(a.x)} ${f(a.y)} A ${raio} ${raio} 0 ${grande} 1 ${f(b.x)} ${f(b.y)}`;
}

/** Interpola dois números. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpola dois pontos. */
export function lerpPonto(a: Ponto, b: Ponto, t: number): Ponto {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}
