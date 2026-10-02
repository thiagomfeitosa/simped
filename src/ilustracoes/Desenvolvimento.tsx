/**
 * Marcos do desenvolvimento: criança articulada (vista de lado) em cada pose do motor grosso
 * — de bruços levantando a cabeça, apoio nos antebraços, rolar, sentar, andar com apoio, andar,
 * chutar, pular, arremessar, ficar num pé só — e pequenos desenhos do motor fino
 * (segurar, pinça, torre de cubos, copiar linha e círculo).
 */

import { useId } from 'react';
import type { TomDePele } from '../neonatal/exame';
import { FiltrosPele } from './FiltrosPele';
import { capsula, type Ponto } from './formas';
import { idSvg, misturar, PALETAS } from './pele';

interface Pose {
  cabeca: Ponto;
  raioCabeca: number;
  /** Para onde o rosto olha (1 = direita, −1 = esquerda). */
  olha: 1 | -1;
  ombro: Ponto;
  quadril: Ponto;
  /** Braço e perna do lado de perto: [articulação do meio, ponta]. */
  braco: [Ponto, Ponto];
  braco2: [Ponto, Ponto];
  perna: [Ponto, Ponto];
  perna2: [Ponto, Ponto];
  larguraTronco: number;
  roupa: 'fralda' | 'roupa';
  extra?: 'mesa' | 'bola-pe' | 'bola-mao' | 'brinquedo' | 'sombra-alta';
}

const P = (x: number, y: number): Ponto => ({ x, y });

const POSES: Record<string, Pose> = {
  'prono-cabeca': { cabeca: P(52, 112), raioCabeca: 18, olha: -1, ombro: P(74, 126), quadril: P(122, 128), braco: [P(70, 136), P(56, 138)], braco2: [P(78, 134), P(64, 137)], perna: [P(146, 134), P(170, 132)], perna2: [P(150, 130), P(174, 128)], larguraTronco: 30, roupa: 'fralda' },
  'prono-antebracos': { cabeca: P(52, 88), raioCabeca: 18, olha: -1, ombro: P(76, 112), quadril: P(124, 130), braco: [P(72, 136), P(48, 137)], braco2: [P(80, 134), P(56, 135)], perna: [P(150, 134), P(176, 133)], perna2: [P(154, 131), P(180, 130)], larguraTronco: 30, roupa: 'fralda', extra: 'brinquedo' },
  rolar: { cabeca: P(60, 100), raioCabeca: 18, olha: -1, ombro: P(82, 112), quadril: P(124, 124), braco: [P(70, 96), P(56, 80)], braco2: [P(84, 134), P(70, 138)], perna: [P(132, 100), P(110, 96)], perna2: [P(150, 134), P(172, 134)], larguraTronco: 30, roupa: 'fralda' },
  sentar: { cabeca: P(98, 54), raioCabeca: 19, olha: 1, ombro: P(98, 80), quadril: P(96, 124), braco: [P(108, 98), P(124, 106)], braco2: [P(92, 100), P(104, 112)], perna: [P(124, 132), P(150, 132)], perna2: [P(120, 136), P(146, 136)], larguraTronco: 30, roupa: 'fralda', extra: 'brinquedo' },
  'andar-apoio': { cabeca: P(96, 36), raioCabeca: 17, olha: 1, ombro: P(98, 60), quadril: P(98, 98), braco: [P(116, 66), P(134, 76)], braco2: [P(112, 72), P(130, 80)], perna: [P(102, 118), P(100, 140)], perna2: [P(92, 118), P(88, 140)], larguraTronco: 28, roupa: 'fralda', extra: 'mesa' },
  andar: { cabeca: P(98, 34), raioCabeca: 16, olha: 1, ombro: P(98, 58), quadril: P(98, 96), braco: [P(116, 52), P(122, 38)], braco2: [P(82, 54), P(76, 40)], perna: [P(108, 118), P(116, 140)], perna2: [P(90, 118), P(82, 140)], larguraTronco: 26, roupa: 'roupa' },
  chutar: { cabeca: P(92, 32), raioCabeca: 15, olha: 1, ombro: P(94, 56), quadril: P(96, 94), braco: [P(112, 66), P(118, 82)], braco2: [P(78, 64), P(70, 78)], perna: [P(114, 112), P(132, 126)], perna2: [P(94, 118), P(92, 140)], larguraTronco: 24, roupa: 'roupa', extra: 'bola-pe' },
  pular: { cabeca: P(100, 26), raioCabeca: 15, olha: 1, ombro: P(100, 50), quadril: P(100, 86), braco: [P(116, 40), P(122, 26)], braco2: [P(84, 40), P(78, 26)], perna: [P(110, 104), P(104, 122)], perna2: [P(92, 104), P(86, 122)], larguraTronco: 24, roupa: 'roupa', extra: 'sombra-alta' },
  arremessar: { cabeca: P(96, 30), raioCabeca: 15, olha: 1, ombro: P(96, 54), quadril: P(98, 92), braco: [P(84, 38), P(78, 20)], braco2: [P(112, 64), P(126, 70)], perna: [P(110, 116), P(116, 140)], perna2: [P(90, 116), P(84, 140)], larguraTronco: 24, roupa: 'roupa', extra: 'bola-mao' },
  'um-pe': { cabeca: P(100, 28), raioCabeca: 15, olha: 1, ombro: P(100, 52), quadril: P(100, 90), braco: [P(122, 58), P(142, 56)], braco2: [P(78, 58), P(58, 56)], perna: [P(116, 104), P(110, 124)], perna2: [P(100, 116), P(100, 140)], larguraTronco: 24, roupa: 'roupa' },
};

/** Desenhos que existem (pose ou atividade). */
export const DESENHOS_DNPM = [...Object.keys(POSES), 'flexao', 'segurar', 'pinca', 'torre', 'desenho-linha', 'desenho-circulo'] as const;

function FiguraCrianca({ pose, tom, id }: { pose: Pose; tom: TomDePele; id: (n: string) => string }) {
  const p = PALETAS[tom];
  const roupa = '#9b74d4';
  const roupaEscura = '#6d3fb2';
  const membro = (a: Ponto, b: Ponto, w1: number, w2: number, longe = false) => (
    <g opacity={longe ? 0.85 : 1}>
      <path d={capsula(a, b, w1 + 1.4, w2 + 1.4)} fill={p.sombra} opacity="0.5" />
      <path d={capsula(a, b, w1, w2)} fill={longe ? misturar(p.base, p.sombra, 0.35) : `url(#${id('volume-suave')})`} />
    </g>
  );
  const pernaW = pose.roupa === 'fralda' ? 15 : 12;
  return (
    <g>
      {/* lado de longe */}
      {membro(pose.quadril, pose.perna2[0], pernaW, pernaW - 2, true)}
      {membro(pose.perna2[0], pose.perna2[1], pernaW - 3, pernaW - 5, true)}
      {membro(pose.ombro, pose.braco2[0], 10, 9, true)}
      {membro(pose.braco2[0], pose.braco2[1], 9, 7.5, true)}
      {/* tronco com roupa */}
      <path d={capsula(pose.ombro, pose.quadril, pose.larguraTronco, pose.larguraTronco + 2)} fill={pose.roupa === 'roupa' ? roupa : `url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.25" />
      {pose.roupa === 'fralda' && <circle cx={pose.quadril.x} cy={pose.quadril.y} r={pose.larguraTronco / 2 + 3} fill="#fbf8ff" stroke="#cdbfe3" />}
      {/* lado de perto */}
      {membro(pose.quadril, pose.perna[0], pernaW, pernaW - 2)}
      {membro(pose.perna[0], pose.perna[1], pernaW - 3, pernaW - 5)}
      {pose.roupa === 'roupa' && <path d={capsula(pose.quadril, { x: (pose.quadril.x + pose.perna[0].x) / 2, y: (pose.quadril.y + pose.perna[0].y) / 2 }, pernaW + 3, pernaW + 2)} fill={roupaEscura} />}
      <ellipse cx={pose.perna[1].x + 3} cy={pose.perna[1].y} rx={8} ry={4.5} fill={pose.roupa === 'roupa' ? '#ffffff' : p.base} stroke={p.contorno} strokeOpacity="0.4" />
      {membro(pose.ombro, pose.braco[0], 10, 9)}
      {membro(pose.braco[0], pose.braco[1], 9, 7.5)}
      <circle cx={pose.braco[1].x} cy={pose.braco[1].y} r={5.5} fill={`url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.3" />
      {/* cabeça de perfil */}
      <circle cx={pose.cabeca.x} cy={pose.cabeca.y} r={pose.raioCabeca} fill={`url(#${id('volume')})`} stroke={p.contorno} strokeOpacity="0.3" />
      <path d={`M ${pose.cabeca.x - pose.raioCabeca * 0.9} ${pose.cabeca.y - pose.raioCabeca * 0.25} A ${pose.raioCabeca} ${pose.raioCabeca} 0 0 1 ${pose.cabeca.x + pose.raioCabeca * 0.9} ${pose.cabeca.y - pose.raioCabeca * 0.25} Q ${pose.cabeca.x} ${pose.cabeca.y - pose.raioCabeca * 0.6} ${pose.cabeca.x - pose.raioCabeca * 0.9} ${pose.cabeca.y - pose.raioCabeca * 0.25} Z`} fill={p.cabelo} opacity="0.85" />
      <circle cx={pose.cabeca.x + pose.olha * pose.raioCabeca * 0.45} cy={pose.cabeca.y} r={1.9} fill="#1a1010" />
      <circle cx={pose.cabeca.x - pose.olha * pose.raioCabeca * 0.15} cy={pose.cabeca.y + 2} r={4} fill={p.base} stroke={p.contorno} strokeOpacity="0.4" />
      <circle cx={pose.cabeca.x + pose.olha * pose.raioCabeca * 0.98} cy={pose.cabeca.y + pose.raioCabeca * 0.18} r={2.8} fill={p.base} />
      <path d={`M ${pose.cabeca.x + pose.olha * pose.raioCabeca * 0.55} ${pose.cabeca.y + pose.raioCabeca * 0.5} q ${pose.olha * 3} 2 ${pose.olha * 6} 0`} stroke={p.labio} strokeWidth="1.6" fill="none" />
    </g>
  );
}

export function DesenhoDnpm({ desenho, tom = 'claro' }: { desenho: string; tom?: TomDePele }) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const pose = POSES[desenho];
  let conteudo;
  if (pose) {
    conteudo = (
      <g>
        <rect width="200" height="160" fill="#f6f1fc" />
        <rect x="0" y="140" width="200" height="20" fill="#e3d6f5" />
        {pose.extra === 'mesa' && (
          <g>
            <rect x="128" y="70" width="64" height="10" rx="3" fill="#b88a5c" />
            <rect x="182" y="80" width="8" height="60" fill="#9a7048" />
          </g>
        )}
        {pose.extra === 'brinquedo' && <circle cx={desenho === 'sentar' ? 134 : 26} cy={desenho === 'sentar' ? 104 : 128} r={8} fill="#f0a63a" stroke="#c07a1a" />}
        {pose.extra === 'bola-pe' && <circle cx="146" cy="128" r="10" fill="#ef7d1a" stroke="#b85a10" />}
        {pose.extra === 'bola-mao' && <circle cx="74" cy="14" r="7" fill="#ef7d1a" stroke="#b85a10" />}
        <ellipse cx={pose.quadril.x} cy="141" rx={pose.extra === 'sombra-alta' ? 20 : 34} ry="4" fill="#4b2580" opacity="0.18" />
        <FiguraCrianca pose={pose} tom={tom} id={id} />
        {pose.extra === 'sombra-alta' && <path d="M 80 132 l 40 0" stroke="#4b2580" strokeDasharray="3 3" opacity="0.5" />}
      </g>
    );
  } else if (desenho === 'flexao') {
    // bebê de barriga para cima, todo fletido (visto de cima)
    const m = (a: Ponto, b: Ponto, w: number) => <path d={capsula(a, b, w, w * 0.85)} fill={`url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.3" />;
    conteudo = (
      <g>
        <rect width="200" height="160" fill="#efe6fa" />
        {m(P(88, 104), P(68, 118), 14)}
        {m(P(68, 118), P(84, 132), 12)}
        {m(P(112, 104), P(132, 118), 14)}
        {m(P(132, 118), P(116, 132), 12)}
        <path d={capsula(P(100, 66), P(100, 104), 40, 34)} fill={`url(#${id('volume-suave')})`} />
        <circle cx="100" cy="106" r="15" fill="#fbf8ff" stroke="#cdbfe3" />
        {m(P(84, 70), P(66, 82), 11)}
        {m(P(66, 82), P(74, 58), 10)}
        {m(P(116, 70), P(134, 82), 11)}
        {m(P(134, 82), P(126, 58), 10)}
        <circle cx="100" cy="44" r="20" fill={`url(#${id('volume')})`} />
        <path d="M 92 44 q 3 2 6 0 M 102 44 q 3 2 6 0" stroke={p.contorno} strokeWidth="1.4" fill="none" />
      </g>
    );
  } else if (desenho === 'segurar' || desenho === 'pinca') {
    const pinca = desenho === 'pinca';
    conteudo = (
      <g>
        <rect width="200" height="160" fill="#efe6fa" />
        <path d={capsula(P(20, 120), P(90, 96), 34, 28)} fill={`url(#${id('volume-suave')})`} />
        <ellipse cx="104" cy="92" rx="28" ry="22" fill={`url(#${id('volume')})`} />
        {pinca ? (
          <g>
            <path d={capsula(P(118, 84), P(150, 66), 11, 9)} fill={`url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.4" />
            <path d={capsula(P(116, 100), P(150, 76), 12, 10)} fill={`url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.4" />
            <circle cx="156" cy="70" r="5" fill="#ef7d1a" />
          </g>
        ) : (
          <g>
            <rect x="120" y="70" width="10" height="56" rx="5" fill="#b99be6" />
            <circle cx="125" cy="58" r="18" fill="#d8c7f2" stroke="#9b74d4" strokeWidth="3" />
            <path d={capsula(P(112, 80), P(132, 92), 12, 10)} fill={`url(#${id('volume-suave')})`} />
          </g>
        )}
      </g>
    );
  } else if (desenho === 'torre') {
    const cores = ['#ef7d1a', '#6d3fb2', '#22935a', '#e3a326', '#3a86d4', '#d0427a'];
    conteudo = (
      <g>
        <rect width="200" height="160" fill="#efe6fa" />
        <rect x="0" y="140" width="200" height="20" fill="#e3d6f5" />
        {cores.map((c, i) => (
          <g key={c}>
            <rect x={80 + (i % 2) * 2} y={116 - i * 22} width="40" height="22" rx="3" fill={c} stroke="#00000033" />
            <rect x={84 + (i % 2) * 2} y={119 - i * 22} width="12" height="6" rx="2" fill="#ffffff55" />
          </g>
        ))}
      </g>
    );
  } else if (desenho === 'desenho-linha' || desenho === 'desenho-circulo') {
    conteudo = (
      <g>
        <rect width="200" height="160" fill="#efe6fa" />
        <rect x="40" y="16" width="120" height="128" fill="#fff" stroke="#d8c7f2" transform="rotate(-3 100 80)" />
        {desenho === 'desenho-linha' ? (
          <path d="M 98 40 q 3 40 -1 80" stroke="#6d3fb2" strokeWidth="5" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M 100 40 C 140 38, 146 108, 100 116 C 58 118, 56 46, 104 44" stroke="#6d3fb2" strokeWidth="5" strokeLinecap="round" fill="none" />
        )}
        <rect x="140" y="112" width="44" height="10" rx="4" fill="#ef7d1a" transform="rotate(-30 160 116)" />
      </g>
    );
  } else {
    conteudo = <rect width="200" height="160" fill="#efe6fa" />;
  }
  return (
    <svg viewBox="0 0 200 160" className="ilustracao desenho-dnpm" aria-hidden="true">
      <FiltrosPele id={id} paleta={p} />
      {conteudo}
    </svg>
  );
}
