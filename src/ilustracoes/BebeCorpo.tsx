/**
 * RN de corpo inteiro, deitado de barriga para cima, de fralda, visto de frente.
 * Desenho em camadas (lençol, sombra, pernas, tronco, braços, cabeça, rosto, achados,
 * luz, coto umbilical e fralda) para dar volume. Os achados mudam o desenho:
 * cor (cianose, palidez, pletora, acrocianose, cutis marmorata), icterícia por zona de Kramer,
 * eritema tóxico, petéquias, paralisia de Erb, fratura de clavícula, mamas, tiragem, umbigo.
 *
 * Lado: o lado DIREITO do bebê aparece à ESQUERDA de quem olha (como no exame real).
 */

import { type KeyboardEvent, useId } from 'react';
import type { AjusteCorpo } from '../dados/neonatal/exame-rn-a-validar';
import type { TomDePele } from '../neonatal/exame';
import { FiltrosPele, Lencol } from './FiltrosPele';
import { capsula, type Ponto } from './formas';
import { idSvg, misturar, type PaletaPele, paletaComTinta, PALETAS, pontosFixos } from './pele';

const L = 360;
const A = 480;

const CABECA = { cx: 180, cy: 106, rx: 70, ry: 76 };
const TRONCO =
  'M 136 188 C 150 180, 210 180, 224 188 C 240 198, 245 224, 245 252 C 247 290, 243 318, 235 334 C 223 354, 137 354, 125 334 C 117 318, 113 290, 115 252 C 115 224, 120 198, 136 188 Z';
const UMBIGO: Ponto = { x: 180, y: 298 };

interface Membro {
  a: Ponto;
  b: Ponto;
  w1: number;
  w2: number;
}

interface Pose {
  bracoD: Membro;
  antebracoD: Membro;
  maoD: { c: Ponto; rot: number; aberta?: boolean };
  bracoE: Membro;
  antebracoE: Membro;
  maoE: { c: Ponto; rot: number };
  coxaD: Membro;
  pernaD: Membro;
  peD: { c: Ponto; rot: number };
  coxaE: Membro;
  pernaE: Membro;
  peE: { c: Ponto; rot: number };
}

const m = (ax: number, ay: number, bx: number, by: number, w1: number, w2: number): Membro => ({ a: { x: ax, y: ay }, b: { x: bx, y: by }, w1, w2 });

function pose(ajuste: AjusteCorpo): Pose {
  const erb = ajuste.bracoDireito === 'erb';
  const fratura = ajuste.claviculaDireita === 'fratura';
  return {
    bracoD: erb ? m(130, 210, 112, 268, 31, 26) : fratura ? m(132, 208, 90, 258, 31, 26) : m(132, 208, 84, 252, 31, 26),
    antebracoD: erb ? m(112, 268, 113, 318, 25, 20) : fratura ? m(90, 258, 99, 222, 25, 20) : m(84, 252, 90, 200, 25, 20),
    maoD: erb ? { c: { x: 116, y: 332 }, rot: 200, aberta: true } : fratura ? { c: { x: 101, y: 210 }, rot: -10 } : { c: { x: 93, y: 188 }, rot: -12 },
    bracoE: m(228, 208, 276, 252, 31, 26),
    antebracoE: m(276, 252, 270, 200, 25, 20),
    maoE: { c: { x: 267, y: 188 }, rot: 12 },
    coxaD: m(152, 342, 98, 398, 46, 36),
    pernaD: m(98, 398, 128, 448, 33, 25),
    peD: { c: { x: 142, y: 458 }, rot: 18 },
    coxaE: m(208, 342, 262, 398, 46, 36),
    pernaE: m(262, 398, 232, 448, 33, 25),
    peE: { c: { x: 218, y: 458 }, rot: -18 },
  };
}

type NomeParte = 'cabeca' | 'troncoSup' | 'troncoInf' | 'bracos' | 'antebracos' | 'maos' | 'coxas' | 'pernas' | 'pes';

/** Partes do corpo atingidas pela icterícia em cada zona de Kramer. */
const PARTES_DA_ZONA: Record<1 | 2 | 3 | 4 | 5, NomeParte[]> = {
  1: ['cabeca'],
  2: ['cabeca', 'troncoSup'],
  3: ['cabeca', 'troncoSup', 'troncoInf', 'coxas'],
  4: ['cabeca', 'troncoSup', 'troncoInf', 'coxas', 'bracos', 'antebracos', 'pernas'],
  5: ['cabeca', 'troncoSup', 'troncoInf', 'coxas', 'bracos', 'antebracos', 'pernas', 'maos', 'pes'],
};

const caminhoMao = (c: Ponto, rot: number, aberta = false) =>
  aberta
    ? `M ${c.x - 9} ${c.y - 6} C ${c.x - 12} ${c.y + 8}, ${c.x - 4} ${c.y + 18}, ${c.x + 3} ${c.y + 16} C ${c.x + 10} ${c.y + 14}, ${c.x + 11} ${c.y + 2}, ${c.x + 9} ${c.y - 6} Z`
    : `M ${c.x - 13} ${c.y} a 13 11.5 ${rot} 1 0 26 0 a 13 11.5 ${rot} 1 0 -26 0 Z`;

const caminhoPe = (c: Ponto, rot: number) => {
  const r = (rot * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const p = (x: number, y: number) => `${Math.round((c.x + x * cos - y * sin) * 10) / 10} ${Math.round((c.y + x * sin + y * cos) * 10) / 10}`;
  return `M ${p(-20, -2)} C ${p(-20, -12)}, ${p(-4, -13)}, ${p(8, -11)} C ${p(18, -10)}, ${p(23, -4)}, ${p(22, 3)} C ${p(21, 10)}, ${p(10, 12)}, ${p(-2, 11)} C ${p(-14, 10)}, ${p(-20, 7)}, ${p(-20, -2)} Z`;
};

/** Desenha um conjunto de partes do corpo numa cor só (base para tintas e brilhos). */
function Silhueta({ pose: p, partes, cor, opacidade = 1, mistura, clipTroncoId }: { pose: Pose; partes: readonly NomeParte[]; cor: string; opacidade?: number; mistura?: 'multiply' | 'soft-light' | 'screen'; clipTroncoId: (n: string) => string }) {
  const tem = (n: NomeParte) => partes.includes(n);
  const membros: Membro[] = [
    ...(tem('bracos') ? [p.bracoD, p.bracoE] : []),
    ...(tem('antebracos') ? [p.antebracoD, p.antebracoE] : []),
    ...(tem('coxas') ? [p.coxaD, p.coxaE] : []),
    ...(tem('pernas') ? [p.pernaD, p.pernaE] : []),
  ];
  return (
    <g fill={cor} opacity={opacidade} style={mistura ? { mixBlendMode: mistura } : undefined}>
      {tem('cabeca') && (
        <>
          <ellipse cx={CABECA.cx} cy={CABECA.cy} rx={CABECA.rx} ry={CABECA.ry} />
          <ellipse cx={111} cy={114} rx={10} ry={17} />
          <ellipse cx={249} cy={114} rx={10} ry={17} />
        </>
      )}
      {tem('troncoSup') && <path d={TRONCO} clipPath={`url(#${clipTroncoId('sup')})`} />}
      {tem('troncoInf') && <path d={TRONCO} clipPath={`url(#${clipTroncoId('inf')})`} />}
      {membros.map((mb, i) => (
        <path key={i} d={capsula(mb.a, mb.b, mb.w1, mb.w2)} />
      ))}
      {tem('maos') && (
        <>
          <path d={caminhoMao(p.maoD.c, p.maoD.rot, p.maoD.aberta)} />
          <path d={caminhoMao(p.maoE.c, p.maoE.rot)} />
        </>
      )}
      {tem('pes') && (
        <>
          <path d={caminhoPe(p.peD.c, p.peD.rot)} />
          <path d={caminhoPe(p.peE.c, p.peE.rot)} />
        </>
      )}
    </g>
  );
}

/** Um membro com volume: base, contorno suave e brilho borrado do lado da luz. */
function MembroComVolume({ mb, paleta, id }: { mb: Membro; paleta: PaletaPele; id: (n: string) => string }) {
  const brilhoA = { x: mb.a.x - 3, y: mb.a.y - 3 };
  const brilhoB = { x: mb.b.x - 3, y: mb.b.y - 3 };
  return (
    <g>
      <path d={capsula(mb.a, mb.b, mb.w1 + 2, mb.w2 + 2)} fill={paleta.sombra} opacity="0.55" filter={`url(#${id('borrar-leve')})`} />
      <path d={capsula(mb.a, mb.b, mb.w1, mb.w2)} fill={`url(#${id('volume-suave')})`} />
      <path d={capsula(brilhoA, brilhoB, mb.w1 * 0.35, mb.w2 * 0.3)} fill={paleta.luz} opacity="0.55" filter={`url(#${id('borrar')})`} />
    </g>
  );
}

function Mao({ c, rot, aberta, paleta, id, cor }: { c: Ponto; rot: number; aberta?: boolean; paleta: PaletaPele; id: (n: string) => string; cor?: string }) {
  if (aberta) {
    return (
      <g>
        <path d={caminhoMao(c, rot, true)} fill={cor ?? `url(#${id('volume-suave')})`} stroke={paleta.contorno} strokeWidth="0.8" strokeOpacity="0.4" />
        {[-5, -1, 3, 7].map((dx) => (
          <path key={dx} d={`M ${c.x + dx} ${c.y + 6} L ${c.x + dx + 1} ${c.y + 15}`} stroke={paleta.contorno} strokeOpacity="0.35" strokeWidth="0.8" />
        ))}
      </g>
    );
  }
  return (
    <g transform={`rotate(${rot} ${c.x} ${c.y})`}>
      <ellipse cx={c.x} cy={c.y} rx={13} ry={11.5} fill={cor ?? `url(#${id('volume-suave')})`} stroke={paleta.contorno} strokeWidth="0.8" strokeOpacity="0.35" />
      {/* dedos fechados (pregas) e polegar */}
      {[-6, -1, 4].map((dx) => (
        <path key={dx} d={`M ${c.x + dx} ${c.y - 9} q 2 4 0 8`} fill="none" stroke={paleta.contorno} strokeOpacity="0.4" strokeWidth="0.9" />
      ))}
      <path d={`M ${c.x - 11} ${c.y + 2} q 6 6 14 4`} fill="none" stroke={paleta.contorno} strokeOpacity="0.45" strokeWidth="1" />
      <ellipse cx={c.x - 4} cy={c.y - 3} rx={5} ry={3} fill={paleta.luz} opacity="0.5" />
    </g>
  );
}

function Pe({ c, rot, paleta, id, cor }: { c: Ponto; rot: number; paleta: PaletaPele; id: (n: string) => string; cor?: string }) {
  return (
    <g>
      <path d={caminhoPe(c, rot)} fill={cor ?? `url(#${id('volume-suave')})`} stroke={paleta.contorno} strokeWidth="0.8" strokeOpacity="0.35" />
      {/* dedinhos */}
      {[0, 1, 2, 3, 4].map((i) => {
        const r = (rot * Math.PI) / 180;
        const x = 18 - i * 0.3;
        const y = -8 + i * 4.2;
        return (
          <circle
            key={i}
            cx={c.x + x * Math.cos(r) - y * Math.sin(r)}
            cy={c.y + x * Math.sin(r) + y * Math.cos(r)}
            r={i === 0 ? 3.6 : 2.6}
            fill={cor ?? paleta.base}
            stroke={paleta.contorno}
            strokeOpacity="0.35"
            strokeWidth="0.6"
          />
        );
      })}
    </g>
  );
}

export interface PropsBebeCorpo {
  tom: TomDePele;
  ajuste?: AjusteCorpo;
  /** Mostra as linhas das zonas de Kramer. */
  zonasKramer?: boolean;
  /** Regiões clicáveis (exame): id → nome. */
  regioes?: readonly { id: string; nome: string; x: number; y: number; r: number }[];
  regiaoAtiva?: string;
  aoEscolherRegiao?: (id: string) => void;
  titulo?: string;
  className?: string;
}

/** Áreas clicáveis do corpo inteiro (para o exame guiado). */
export const AREAS_DO_CORPO: Record<string, { x: number; y: number; r: number }> = {
  cabeca: { x: 180, y: 60, r: 26 },
  olhos: { x: 200, y: 112, r: 14 },
  boca: { x: 180, y: 151, r: 13 },
  'pescoco-clavicula': { x: 148, y: 192, r: 14 },
  torax: { x: 180, y: 232, r: 22 },
  coracao: { x: 212, y: 256, r: 14 },
  abdome: { x: 180, y: 296, r: 20 },
  genitalia: { x: 180, y: 362, r: 20 },
  'membros-quadril': { x: 100, y: 410, r: 22 },
  pele: { x: 262, y: 300, r: 16 },
};

export function BebeCorpo({ tom, ajuste = {}, zonasKramer, regioes, regiaoAtiva, aoEscolherRegiao, titulo = 'Recém-nascido deitado, visto de frente', className }: PropsBebeCorpo) {
  const id = idSvg(useId());
  const tinta = ajuste.cor === 'cianose-central' ? 'cianose' : ajuste.cor === 'palidez' ? 'palidez' : ajuste.cor === 'pletora' ? 'pletora' : undefined;
  const paleta = paletaComTinta(tom, tinta);
  const roxoDasExtremidades = { claro: 0.45, moreno: 0.36, negro: 0.26 }[tom];
  const paletaExtremidades =
    ajuste.cor === 'acrocianose'
      ? { ...paleta, base: misturar(PALETAS[tom].base, '#6c58b4', roxoDasExtremidades), luz: misturar(PALETAS[tom].luz, '#8f7cc8', roxoDasExtremidades), unha: misturar(PALETAS[tom].unha, '#6c58b4', 0.5) }
      : paleta;
  const p = pose(ajuste);
  const zona = ajuste.ictericiaZona;
  const corIctericia = '#ffe96a';
  const forcaIctericia = { claro: 0.55, moreno: 0.4, negro: 0.22 }[tom];
  const sorteio = pontosFixos(11, 400);

  const manchas = (quantas: number, deslocamento: number) =>
    Array.from({ length: quantas }, (_, i) => {
      const u = sorteio[(i * 3 + deslocamento) % sorteio.length]!;
      const v = sorteio[(i * 3 + 1 + deslocamento) % sorteio.length]!;
      const w = sorteio[(i * 3 + 2 + deslocamento) % sorteio.length]!;
      // metade no tronco, o resto em face, braços e coxas
      const area = i % 6;
      if (area <= 2) return { x: 132 + u * 96, y: 196 + v * 128, w };
      if (area === 3) return { x: 140 + u * 80, y: 64 + v * 70, w };
      if (area === 4) return { x: (u < 0.5 ? 76 : 254) + v * 28, y: 210 + w * 40, w };
      return { x: (u < 0.5 ? 100 : 228) + v * 34, y: 360 + w * 40, w };
    });

  const tecla = (rid: string) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      aoEscolherRegiao?.(rid);
    }
  };

  return (
    <svg viewBox={`0 0 ${L} ${A}`} className={`ilustracao bebe-corpo ${className ?? ''}`} role="img" aria-label={titulo}>
      <FiltrosPele id={id} paleta={paleta} />
      <defs>
        <clipPath id={id('sup')}>
          <rect x="0" y="0" width={L} height={UMBIGO.y} />
        </clipPath>
        <clipPath id={id('inf')}>
          <rect x="0" y={UMBIGO.y} width={L} height={A} />
        </clipPath>
        <clipPath id={id('tronco')}>
          <path d={TRONCO} />
        </clipPath>
        <linearGradient id={id('luz-global')} gradientUnits="userSpaceOnUse" x1="60" y1="30" x2="300" y2="470">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.5" stopColor="#808080" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <radialGradient id={id('onfalite')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#d2302c" stopOpacity="0.75" />
          <stop offset="0.6" stopColor="#e0483a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e0483a" stopOpacity="0" />
        </radialGradient>
        {/* cutis marmorata: rede irregular tirada de um ruído (só as faixas do meio do ruído viram "veias") */}
        <filter id={id('marmore')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.055 0.075" numOctaves="2" seed="4" result="ruido" />
          <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="alfa" />
          <feComponentTransfer in="alfa" result="rede">
            <feFuncA type="table" tableValues="0 0 0 0 0 0 0 0.5 1 0.5 0 0 0 0 0 0 0" />
          </feComponentTransfer>
          <feGaussianBlur in="rede" stdDeviation="0.8" result="redeSuave" />
          <feComposite in="SourceGraphic" in2="redeSuave" operator="in" />
        </filter>
        <radialGradient id={id('fralda')} cx="50%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6def2" />
        </radialGradient>
      </defs>

      <Lencol largura={L} altura={A} id={id} />
      {/* sombra do bebê no lençol */}
      <ellipse cx="184" cy="290" rx="132" ry="190" fill="#4b2580" opacity="0.16" filter={`url(#${id('borrar-forte')})`} />

      <g filter={`url(#${id('textura')})`}>
        {/* pernas e pés */}
        {[p.coxaD, p.coxaE, p.pernaD, p.pernaE].map((mb, i) => (
          <MembroComVolume key={i} mb={mb} paleta={paleta} id={id} />
        ))}
        {/* pregas das coxas (gordurinhas) */}
        <g fill="none" stroke={paleta.sombra} strokeWidth="1.4" opacity="0.55">
          <path d="M 116 376 q 8 8 18 6" />
          <path d="M 244 376 q -8 8 -18 6" />
          <path d="M 104 404 q 8 6 16 2" />
          <path d="M 256 404 q -8 6 -16 2" />
        </g>
        <Pe c={p.peD.c} rot={p.peD.rot} paleta={paletaExtremidades} id={id} {...(ajuste.cor === 'acrocianose' && { cor: paletaExtremidades.base })} />
        <Pe c={p.peE.c} rot={p.peE.rot} paleta={paletaExtremidades} id={id} {...(ajuste.cor === 'acrocianose' && { cor: paletaExtremidades.base })} />

        {/* tronco */}
        <path d={TRONCO} fill={paleta.sombra} opacity="0.5" transform="translate(2 3)" filter={`url(#${id('borrar-leve')})`} />
        <path d={TRONCO} fill={`url(#${id('volume')})`} />
        {/* barriguinha mais clara e costelas suaves */}
        <ellipse cx="174" cy="282" rx="40" ry="34" fill={paleta.luz} opacity="0.35" filter={`url(#${id('borrar')})`} />
        <ellipse cx="168" cy="222" rx="34" ry="20" fill={paleta.luz} opacity="0.3" filter={`url(#${id('borrar')})`} />
        {ajuste.tiragem && (
          <g fill="none" strokeLinecap="round">
            {/* afundamento abaixo das costelas e do esterno: faixa escura com borda clara acima */}
            <path d="M 136 258 Q 180 284 224 258" stroke={paleta.sombra} strokeWidth="9" opacity="0.4" filter={`url(#${id('borrar')})`} />
            <path d="M 138 252 Q 180 276 222 252" stroke={paleta.luz} strokeWidth="3" opacity="0.5" filter={`url(#${id('borrar-leve')})`} />
            <ellipse cx="180" cy="250" rx="9" ry="6" fill={paleta.sombra} opacity="0.4" filter={`url(#${id('borrar-leve')})`} />
            {[212, 226, 240].map((y) => (
              <g key={y} stroke={paleta.sombra} strokeWidth="2.2" opacity="0.35" filter={`url(#${id('borrar-leve')})`}>
                <path d={`M 134 ${y} q 12 4 24 2`} />
                <path d={`M 226 ${y} q -12 4 -24 2`} />
              </g>
            ))}
          </g>
        )}
        {/* mamilos */}
        {[152, 208].map((x) => (
          <g key={x}>
            {ajuste.mamas === 'ingurgitadas' && (
              <>
                <ellipse cx={x + 1} cy={240} rx={15} ry={8} fill={paleta.sombra} opacity="0.35" filter={`url(#${id('borrar')})`} />
                <circle cx={x - 1} cy={230} r={13} fill={paleta.luz} opacity="0.6" filter={`url(#${id('borrar')})`} />
              </>
            )}
            <ellipse cx={x} cy={232} rx={ajuste.mamas === 'ingurgitadas' ? 7 : 5} ry={ajuste.mamas === 'ingurgitadas' ? 6.5 : 4.5} fill={misturar(paleta.sombra, paleta.labio, 0.4)} opacity="0.8" />
            <circle cx={x} cy={232} r={1.6} fill={paleta.contorno} opacity="0.7" />
          </g>
        ))}

        {/* braços e mãos */}
        {[p.bracoD, p.antebracoD, p.bracoE, p.antebracoE].map((mb, i) => (
          <MembroComVolume key={i} mb={mb} paleta={paleta} id={id} />
        ))}
        {/* prega do cotovelo e do punho */}
        <g fill="none" stroke={paleta.sombra} strokeWidth="1.3" opacity="0.6">
          <path d={`M ${p.bracoD.b.x - 6} ${p.bracoD.b.y - 6} q 6 6 12 2`} />
          <path d={`M ${p.bracoE.b.x + 6} ${p.bracoE.b.y - 6} q -6 6 -12 2`} />
        </g>
        <Mao c={p.maoD.c} rot={p.maoD.rot} {...(p.maoD.aberta && { aberta: true })} paleta={paletaExtremidades} id={id} {...(ajuste.cor === 'acrocianose' && { cor: paletaExtremidades.base })} />
        <Mao c={p.maoE.c} rot={p.maoE.rot} paleta={paletaExtremidades} id={id} {...(ajuste.cor === 'acrocianose' && { cor: paletaExtremidades.base })} />

        {/* cabeça */}
        <ellipse cx={180} cy={186} rx={42} ry={9} fill={paleta.sombra} opacity="0.5" filter={`url(#${id('borrar')})`} />
        {[
          { x: 111, s: 1 },
          { x: 249, s: -1 },
        ].map(({ x, s }) => (
          <g key={x}>
            <ellipse cx={x} cy={114} rx={10} ry={17} fill={`url(#${id('volume-suave')})`} stroke={paleta.contorno} strokeOpacity="0.35" />
            <path d={`M ${x + 4 * s} 102 q ${-6 * s} 10 ${-1 * s} 24`} fill="none" stroke={paleta.sombra} strokeWidth="1.6" opacity="0.6" />
          </g>
        ))}
        <ellipse cx={CABECA.cx} cy={CABECA.cy} rx={CABECA.rx} ry={CABECA.ry} fill={`url(#${id('volume')})`} />
        {/* cabelo */}
        <path
          d="M 116 86 C 118 48, 156 30, 182 30 C 214 30, 246 50, 246 88 C 236 66, 212 54, 182 54 C 152 54, 128 66, 116 86 Z"
          fill={paleta.cabelo}
          opacity={tom === 'claro' ? 0.55 : 0.85}
          filter={`url(#${id('borrar-leve')})`}
        />
        <g fill="none" stroke={paleta.cabelo} strokeWidth="1.2" opacity={tom === 'claro' ? 0.5 : 0.8}>
          {[130, 146, 162, 178, 194, 210, 226].map((x, i) => (
            <path key={x} d={tom === 'negro' ? `M ${x} ${58 - (i % 2) * 4} q 4 -6 8 0 q 4 6 8 0` : `M ${x} ${60 - (i % 3) * 3} q 6 -10 12 -4`} />
          ))}
        </g>
        {/* bochechas */}
        <circle cx={146} cy={136} r={18} fill={`url(#${id('rubor')})`} />
        <circle cx={214} cy={136} r={18} fill={`url(#${id('rubor')})`} />
        {/* pálpebras (dormindo), sobrancelhas, nariz, boca */}
        <g fill="none" strokeLinecap="round">
          <ellipse cx={159} cy={106} rx={14} ry={7} fill={paleta.luz} opacity="0.45" stroke="none" />
          <ellipse cx={201} cy={106} rx={14} ry={7} fill={paleta.luz} opacity="0.45" stroke="none" />
          <path d="M 146 112 Q 159 120 172 112" stroke={paleta.contorno} strokeWidth="2.2" />
          <path d="M 188 112 Q 201 120 214 112" stroke={paleta.contorno} strokeWidth="2.2" />
          {[150, 156, 162, 168].map((x) => (
            <path key={x} d={`M ${x} ${116 - (x === 150 || x === 168 ? 1 : 0)} l -1 3`} stroke={paleta.contorno} strokeWidth="1" opacity="0.7" />
          ))}
          {[192, 198, 204, 210].map((x) => (
            <path key={x} d={`M ${x} ${116 - (x === 192 || x === 210 ? 1 : 0)} l 1 3`} stroke={paleta.contorno} strokeWidth="1" opacity="0.7" />
          ))}
          <path d="M 145 96 Q 158 91 170 95" stroke={paleta.sombra} strokeWidth="2" opacity="0.45" />
          <path d="M 190 95 Q 202 91 215 96" stroke={paleta.sombra} strokeWidth="2" opacity="0.45" />
        </g>
        <ellipse cx={180} cy={130} rx={9} ry={7} fill={paleta.luz} opacity="0.6" />
        <path d="M 170 136 Q 180 142 190 136" fill="none" stroke={paleta.sombra} strokeWidth="1.6" opacity="0.7" />
        <ellipse cx={175} cy={136} rx={2.4} ry={1.6} fill={paleta.contorno} opacity="0.8" />
        <ellipse cx={185} cy={136} rx={2.4} ry={1.6} fill={paleta.contorno} opacity="0.8" />
        <path d="M 168 151 Q 174 147 180 149 Q 186 147 192 151 Q 186 156 180 156 Q 174 156 168 151 Z" fill={paleta.labio} />
        <path d="M 169 151 Q 180 153 191 151" fill="none" stroke={paleta.contorno} strokeWidth="1" opacity="0.6" />
        <ellipse cx={180} cy={168} rx={14} ry={5} fill={paleta.luz} opacity="0.35" />
      </g>

      {/* ---- achados por cima da pele ---- */}
      {ajuste.cor === 'cutis-marmorata' && (
        <g filter={`url(#${id('marmore')})`}>
          <Silhueta pose={p} partes={PARTES_DA_ZONA[5].filter((n) => n !== 'cabeca')} cor="#8a5aa0" opacidade={tom === 'negro' ? 0.3 : 0.42} mistura="multiply" clipTroncoId={id} />
        </g>
      )}
      {zona && (
        <Silhueta pose={p} partes={PARTES_DA_ZONA[zona]} cor={corIctericia} opacidade={forcaIctericia} mistura="multiply" clipTroncoId={id} />
      )}
      {ajuste.eritemaToxico && (
        <g>
          {manchas(34, 7).map((s, i) => (
            <g key={i}>
              <ellipse cx={s.x} cy={s.y} rx={3.5 + s.w * 4.5} ry={3 + s.w * 4} fill="#d9473f" opacity={tom === 'negro' ? 0.22 : 0.3} filter={`url(#${id('borrar')})`} />
              <circle cx={s.x} cy={s.y} r={1.1} fill="#fff6d8" opacity="0.9" />
            </g>
          ))}
        </g>
      )}
      {ajuste.petequias && (
        <g fill="#8e1a2a">
          {manchas(120, 31).map((s, i) => (
            <circle key={i} cx={s.x + s.w * 4} cy={s.y} r={0.8 + s.w * 0.9} opacity="0.85" />
          ))}
        </g>
      )}
      {ajuste.claviculaDireita === 'fratura' && (
        <g>
          <ellipse cx={142} cy={192} rx={16} ry={8} fill={paleta.luz} opacity="0.7" filter={`url(#${id('borrar-leve')})`} />
          <ellipse cx={142} cy={194} rx={15} ry={8} fill="#7a4e9a" opacity="0.22" filter={`url(#${id('borrar')})`} />
          <path d="M 128 194 Q 142 186 156 192" fill="none" stroke={paleta.sombra} strokeWidth="1.5" opacity="0.7" />
        </g>
      )}
      {/* luz geral (de cima à esquerda) */}
      <Silhueta pose={p} partes={PARTES_DA_ZONA[5]} cor={`url(#${id('luz-global')})`} opacidade={0.2} mistura="soft-light" clipTroncoId={id} />

      {/* umbigo e fralda */}
      {ajuste.umbigo === 'onfalite' && <circle cx={UMBIGO.x} cy={UMBIGO.y + 4} r={30} fill={`url(#${id('onfalite')})`} />}
      {ajuste.umbigo === 'hernia' && (
        <g>
          <circle cx={UMBIGO.x} cy={UMBIGO.y + 2} r={17} fill={paleta.luz} opacity="0.75" filter={`url(#${id('borrar-leve')})`} />
          <circle cx={UMBIGO.x + 3} cy={UMBIGO.y + 6} r={17} fill="none" stroke={paleta.sombra} strokeWidth="2.5" opacity="0.45" filter={`url(#${id('borrar-leve')})`} />
        </g>
      )}
      <g>
        <path d="M 174 290 Q 171 302 175 313 L 186 313 Q 190 302 186 290 Q 180 285 174 290 Z" fill="#e9dfb3" stroke="#b9a86c" strokeWidth="1" />
        <path d="M 177 292 q -1 10 1 19" stroke="#a7b6d6" strokeWidth="2" fill="none" opacity="0.8" />
        <path d="M 183 292 q 1 10 -1 19" stroke="#c99aa5" strokeWidth="1.6" fill="none" opacity="0.8" />
        <rect x={160} y={306} width={40} height={10} rx={3} fill="#cbb6ee" stroke="#8f72c4" />
        <path d="M 166 306 v 10 M 172 306 v 10 M 188 306 v 10 M 194 306 v 10" stroke="#a58ad6" strokeWidth="1.2" />
      </g>
      <path d="M 116 322 C 150 314, 210 314, 244 322 L 250 352 C 238 398, 122 398, 110 352 Z" fill={`url(#${id('fralda')})`} stroke="#cdbfe3" strokeWidth="1.5" />
      <path d="M 118 324 C 150 317, 210 317, 242 324" fill="none" stroke="#b99be6" strokeWidth="4" strokeLinecap="round" />
      <rect x={104} y={328} width={22} height={14} rx={4} fill="#d8c7f2" stroke="#9b74d4" />
      <rect x={234} y={328} width={22} height={14} rx={4} fill="#d8c7f2" stroke="#9b74d4" />
      <g fill="none" stroke="#d7cbe8" strokeWidth="1.5">
        <path d="M 140 344 q 10 30 34 40" />
        <path d="M 220 344 q -10 30 -34 40" />
      </g>

      {/* zonas de Kramer */}
      {zonasKramer && (
        <g fill="none" stroke="#4b2580" strokeDasharray="5 4" strokeWidth="1.6" opacity="0.8">
          <path d="M 96 184 L 264 184" />
          <path d="M 110 298 L 250 298" />
          <path d="M 70 400 L 290 400" />
          <g fontSize="11" fontWeight="700" fill="#4b2580" stroke="none">
            <text x="284" y="70">Zona 1</text>
            <text x="284" y="240">Zona 2</text>
            <text x="284" y="350">Zona 3</text>
            <text x="20" y="250">Zona 4</text>
            <text x="20" y="470">Zona 5 (mãos e pés)</text>
          </g>
        </g>
      )}

      {/* regiões clicáveis do exame */}
      {regioes?.map((r) => (
        <g
          key={r.id}
          role="button"
          tabIndex={0}
          aria-label={`Examinar: ${r.nome}`}
          className={`regiao-clicavel ${regiaoAtiva === r.id ? 'ativa' : ''}`}
          onClick={() => aoEscolherRegiao?.(r.id)}
          onKeyDown={tecla(r.id)}
        >
          <circle cx={r.x} cy={r.y} r={r.r} />
          <circle cx={r.x} cy={r.y} r={4} className="regiao-ponto" />
        </g>
      ))}
    </svg>
  );
}
