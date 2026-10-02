/**
 * Pés, mãos e quadril do RN.
 * - Pé (planta): normal, pé torto postural, pé torto congênito (formato de feijão, prega medial funda).
 *   A linha tracejada é a bissetriz do calcanhar: no pé normal passa entre o 2º e o 3º dedo.
 * - Mão (palma): pregas normais, prega palmar única, polidactilia pós-axial.
 * - Quadril (esquema do encaixe): normal × luxado que reduz (Ortolani).
 */

import { useId } from 'react';
import type { TomDePele } from '../../neonatal/exame';
import { FiltrosPele, Lencol } from '../FiltrosPele';
import { capsula, type Ponto } from '../formas';
import { idSvg, misturar, PALETAS } from '../pele';

export type AchadoPe = 'normal' | 'postural' | 'pe-torto';
export type AchadoMao = 'normal' | 'prega-unica' | 'polidactilia';
export type AchadoQuadril = 'normal' | 'ortolani';

const f = (n: number) => Math.round(n * 10) / 10;

/** Contorno da planta do pé a partir de uma "coluna" curva (curvatura 0 = reta). */
function contornoPe(curvatura: number) {
  const H = { x: 150, y: 206 };
  const T = { x: 150 + 74 * curvatura, y: 76 + 22 * curvatura };
  const C = { x: 150 - 6 * curvatura, y: 120 };
  const ponto = (t: number) => ({ x: (1 - t) ** 2 * H.x + 2 * (1 - t) * t * C.x + t ** 2 * T.x, y: (1 - t) ** 2 * H.y + 2 * (1 - t) * t * C.y + t ** 2 * T.y });
  // calcanhar ~46, meio do pé mais estreito, antepé mais largo
  const largura = (t: number) => (t < 0.3 ? 46 - t * 16 : t < 0.8 ? 41 + (t - 0.3) * 50 : 66 - (t - 0.8) * 20) + curvatura * -4;
  const N = 24;
  const esquerda: Ponto[] = [];
  const direita: Ponto[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = ponto(Math.max(0, t - 0.01));
    const b = ponto(Math.min(1, t + 0.01));
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    const c = ponto(t);
    const w = largura(t) / 2;
    esquerda.push({ x: c.x + nx * w, y: c.y + ny * w });
    direita.push({ x: c.x - nx * w, y: c.y - ny * w });
  }
  const rFim = largura(1) / 2;
  const rIni = largura(0) / 2;
  const lado = (lista: Ponto[]) => lista.map((q) => `${f(q.x)} ${f(q.y)}`).join(' L ');
  const ladoDireito = [...direita].reverse();
  const d = `M ${lado(esquerda)} A ${f(rFim)} ${f(rFim * 0.8)} 0 0 0 ${lado(ladoDireito)} A ${f(rIni)} ${f(rIni * 0.75)} 0 0 0 ${f(esquerda[0]!.x)} ${f(esquerda[0]!.y)} Z`;
  // dedos ao longo da borda da frente (perpendicular à coluna no fim)
  const fim = ponto(1);
  const antes = ponto(0.95);
  const len = Math.hypot(fim.x - antes.x, fim.y - antes.y) || 1;
  const dir = { x: (fim.x - antes.x) / len, y: (fim.y - antes.y) / len };
  const nrm = { x: -dir.y, y: dir.x };
  // hálux do lado medial (esquerda de quem olha, pé direito visto pela planta)
  const dedos = [-1.25, -0.42, 0.28, 0.9, 1.42].map((k, i) => {
    const frente = rFim * 0.8 + (i === 0 ? 6 : 4 - Math.abs(k) * 4);
    return { c: { x: fim.x + nrm.x * k * 21 + dir.x * frente, y: fim.y + nrm.y * k * 21 + dir.y * frente }, r: i === 0 ? 12 : 9 - i * 0.7 };
  });
  return { d, H, fim, ponto, dedos };
}

export function PeDetalhe({ achado, tom = 'claro' }: { achado: AchadoPe; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const curv = achado === 'pe-torto' ? -0.75 : achado === 'postural' ? -0.3 : 0;
  const pe = contornoPe(curv);
  const meio = pe.ponto(0.5);
  return (
    <svg viewBox="0 0 300 240" className="ilustracao detalhe-pe" role="img" aria-label={`Planta do pé do RN: ${achado}`}>
      <FiltrosPele id={id} paleta={p} />
      <Lencol largura={300} altura={240} id={id} />
      <g filter={`url(#${id('textura')})`}>
        <path d={pe.d} fill={p.sombra} opacity="0.4" transform="translate(4 5)" filter={`url(#${id('borrar')})`} />
        <path d={pe.d} fill={`url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.35" />
        {pe.dedos.map((dd, i) => (
          <g key={i}>
            <circle cx={dd.c.x + 1.5} cy={dd.c.y + 2} r={dd.r} fill={p.sombra} opacity="0.45" filter={`url(#${id('borrar-leve')})`} />
            <circle cx={dd.c.x} cy={dd.c.y} r={dd.r} fill={`url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.35" />
          </g>
        ))}
        <ellipse cx={pe.H.x} cy={pe.H.y - 22} rx={20} ry={16} fill={p.luz} opacity="0.5" filter={`url(#${id('borrar')})`} />
      </g>
      {/* pregas plantares */}
      <g fill="none" stroke={p.sombra} strokeWidth="1.4" opacity="0.6">
        {[0.7, 0.78, 0.86].map((t) => {
          const c = pe.ponto(t);
          return <path key={t} d={`M ${c.x - 22} ${c.y + 2} q 22 -8 44 -2`} />;
        })}
      </g>
      {achado === 'pe-torto' && (
        <path d={`M ${meio.x - 24} ${meio.y - 14} q 14 10 10 30`} fill="none" stroke={p.contorno} strokeWidth="3.2" opacity="0.85" />
      )}
      {/* bissetriz do calcanhar */}
      <path d={`M ${pe.H.x} ${pe.H.y + 6} L ${pe.H.x + (pe.fim.x - pe.H.x) * 0.15} ${pe.H.y - 70} L ${pe.H.x + (pe.fim.x - pe.H.x) * 0.15} 30`} fill="none" stroke="#4b2580" strokeWidth="1.6" strokeDasharray="5 4" />
      <text x="12" y="230" fontSize="10" fill="#4b2580">
        - - - bissetriz do calcanhar
      </text>
      {achado === 'postural' && (
        <g fill="none" stroke="#22935a" strokeWidth="2.5" strokeLinecap="round">
          <path d="M 230 70 q 22 26 4 56" markerEnd={`url(#${id('seta')})`} />
          <text x="206" y="146" fontSize="9" fill="#22935a" stroke="none">
            corrige com a mão
          </text>
        </g>
      )}
      <defs>
        <marker id={id('seta')} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#22935a" />
        </marker>
      </defs>
    </svg>
  );
}

export function MaoDetalhe({ achado, tom = 'claro' }: { achado: AchadoMao; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const palmaCor = misturar(p.base, p.luz, 0.45);
  // mão direita, palma para cima, dedos para cima, polegar à direita de quem olha
  const dedos: { a: Ponto; b: Ponto; w: number }[] = [
    { a: { x: 106, y: 108 }, b: { x: 96, y: 40 }, w: 20 }, // mínimo
    { a: { x: 128, y: 100 }, b: { x: 124, y: 22 }, w: 22 },
    { a: { x: 152, y: 98 }, b: { x: 154, y: 16 }, w: 23 },
    { a: { x: 175, y: 102 }, b: { x: 184, y: 26 }, w: 22 },
  ];
  const polegar = { a: { x: 196, y: 160 }, b: { x: 236, y: 112 }, w: 26 };
  return (
    <svg viewBox="0 0 300 240" className="ilustracao detalhe-mao" role="img" aria-label={`Palma da mão do RN: ${achado}`}>
      <FiltrosPele id={id} paleta={p} />
      <Lencol largura={300} altura={240} id={id} />
      <g filter={`url(#${id('textura')})`}>
        {achado === 'polidactilia' && (
          <g>
            <path d="M 90 128 Q 74 128 66 120" stroke={palmaCor} strokeWidth="5" fill="none" />
            <ellipse cx="58" cy="114" rx="11" ry="13" fill={`url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.4" />
            <ellipse cx="55" cy="106" rx="5" ry="3.4" fill={p.unha} />
          </g>
        )}
        {[...dedos, polegar].map((d, i) => (
          <path key={i} d={capsula(d.a, d.b, d.w, d.w * 0.85)} fill={`url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.35" />
        ))}
        <path d="M 92 104 C 120 88, 186 88, 200 110 C 214 140, 210 196, 190 222 L 112 222 C 92 196, 84 140, 92 104 Z" fill={palmaCor} stroke={p.contorno} strokeOpacity="0.35" />
        <ellipse cx="196" cy="176" rx="22" ry="34" fill={p.luz} opacity="0.45" filter={`url(#${id('borrar')})`} />
        <ellipse cx="112" cy="176" rx="16" ry="30" fill={p.luz} opacity="0.35" filter={`url(#${id('borrar')})`} />
      </g>
      {/* pregas das falanges */}
      <g fill="none" stroke={p.sombra} strokeWidth="1.3" opacity="0.6">
        {dedos.map((d, i) => {
          const m1 = { x: d.a.x + (d.b.x - d.a.x) * 0.38, y: d.a.y + (d.b.y - d.a.y) * 0.38 };
          const m2 = { x: d.a.x + (d.b.x - d.a.x) * 0.7, y: d.a.y + (d.b.y - d.a.y) * 0.7 };
          return (
            <g key={i}>
              <path d={`M ${m1.x - 8} ${m1.y} q 8 3 16 0`} />
              <path d={`M ${m2.x - 7} ${m2.y} q 7 3 14 0`} />
            </g>
          );
        })}
      </g>
      {/* pregas palmares */}
      <g fill="none" stroke={p.contorno} strokeWidth="2.6" strokeLinecap="round" opacity="0.75">
        {achado === 'prega-unica' ? (
          <path d="M 92 140 C 130 132, 170 132, 206 140" />
        ) : (
          <>
            <path d="M 92 128 C 116 122, 140 120, 166 112" />
            <path d="M 206 140 C 176 140, 140 146, 104 158" />
          </>
        )}
        <path d="M 188 120 C 170 150, 168 190, 176 218" />
      </g>
    </svg>
  );
}

export function QuadrilDetalhe({ achado }: { achado: AchadoQuadril }) {
  const id = idSvg(useId());
  const luxado = achado === 'ortolani';
  const cabeca = luxado ? { x: 196, y: 92 } : { x: 168, y: 118 };
  return (
    <svg viewBox="0 0 300 220" className="ilustracao detalhe-quadril" role="img" aria-label={luxado ? 'Quadril luxado que reduz (Ortolani positivo)' : 'Quadril normal: cabeça do fêmur dentro do acetábulo'}>
      <defs>
        <linearGradient id={id('osso')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbf3df" />
          <stop offset="1" stopColor="#e2cf9f" />
        </linearGradient>
        <radialGradient id={id('cartilagem')} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#e9f3ff" />
          <stop offset="1" stopColor="#a9c3e3" />
        </radialGradient>
        <marker id={id('seta')} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#c2413b" />
        </marker>
      </defs>
      <rect width="300" height="220" fill="#f6f1fc" />
      {/* ilíaco com o acetábulo (taça) */}
      <path d="M 40 20 C 110 10, 170 40, 186 82 C 170 96, 158 108, 154 124 C 156 142, 172 150, 190 150 L 190 164 C 150 170, 120 160, 100 190 L 40 190 Z" fill={`url(#${id('osso')})`} stroke="#b99a5c" strokeWidth="2" />
      <path d="M 186 82 C 168 96, 152 112, 152 128 C 154 146, 172 152, 190 150" fill="none" stroke="#7fa6d1" strokeWidth="6" opacity="0.6" />
      {/* fêmur */}
      <path d={`M ${cabeca.x + 8} ${cabeca.y + 10} L ${cabeca.x + 50} ${cabeca.y + 44} L ${cabeca.x + 60} ${cabeca.y + 120} L ${cabeca.x + 90} ${cabeca.y + 120} L ${cabeca.x + 78} ${cabeca.y + 40} L ${cabeca.x + 22} ${cabeca.y - 8} Z`} fill={`url(#${id('osso')})`} stroke="#b99a5c" strokeWidth="2" />
      <circle cx={cabeca.x} cy={cabeca.y} r={22} fill={`url(#${id('cartilagem')})`} stroke="#6b8fbf" strokeWidth="2" />
      {luxado && (
        <g>
          <circle cx={168} cy={118} r={22} fill="none" stroke="#c2413b" strokeWidth="2" strokeDasharray="5 4" />
          <path d="M 196 78 C 214 92, 200 118, 182 120" fill="none" stroke="#c2413b" strokeWidth="3" markerEnd={`url(#${id('seta')})`} />
          <text x="206" y="56" fontSize="12" fontWeight="700" fill="#c2413b">
            “clunk”
          </text>
          <text x="206" y="70" fontSize="10" fill="#c2413b">
            volta ao lugar
          </text>
        </g>
      )}
      <text x="12" y="210" fontSize="10" fill="#2e1450">
        {luxado ? 'Ortolani: abduzir e elevar o trocânter → a cabeça entra' : 'Normal: cabeça do fêmur dentro do acetábulo'}
      </text>
    </svg>
  );
}
