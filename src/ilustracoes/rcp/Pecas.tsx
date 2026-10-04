/**
 * Peças da cena da RCP: fundo da sala, maca, berço aquecido, carrinho de parada com
 * monitor/desfibrilador e os objetos que a equipe segura (bolsa-válvula-máscara, seringa,
 * laringoscópio, prancheta, cronômetro, furadeira intraóssea).
 * Todas em coordenadas do mundo (viewBox 800 × 380). Cores que imitam os objetos reais.
 */

import { memo } from 'react';
import type { Ponto } from '../formas';
import { arred, curva, girar } from './caminhos';
import { HORIZONTE, LARGURA_CENA, type LayoutFaixa, type Leito } from './geometria';

// ---- Fundo da sala ------------------------------------------------------------------------

export const FundoSala = memo(function FundoSala({ layout, id }: { layout: LayoutFaixa; id: (n: string) => string }) {
  const L = LARGURA_CENA * 1.4;
  const x0 = -100;
  // relógio na parede, em cima do carrinho (sempre à vista, qualquer que seja o enquadramento)
  const relogio = { x: layout.carrinho.x - 6, y: layout.carrinho.topo - 78 };
  const o2 = layout.oxigenio;
  return (
    <g className="rcp-fundo" aria-hidden="true">
      <defs>
        <linearGradient id={id('parede')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efeaf6" />
          <stop offset="1" stopColor="#e2dbee" />
        </linearGradient>
        <linearGradient id={id('chao')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d5cfe0" />
          <stop offset="1" stopColor="#c3bbd2" />
        </linearGradient>
        <radialGradient id={id('luz-parede')} cx="50%" cy="35%" r="55%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={x0} y={-60} width={L} height={HORIZONTE + 60} fill={`url(#${id('parede')})`} />
      <ellipse cx={(layout.leito.x0 + layout.leito.x1) / 2} cy={110} rx={300} ry={150} fill={`url(#${id('luz-parede')})`} />
      {/* faixa de proteção da parede e rodapé */}
      <rect x={x0} y={186} width={L} height={9} fill="#d9d0e8" />
      <rect x={x0} y={186} width={L} height={2} fill="#ffffff" opacity="0.6" />
      <rect x={x0} y={HORIZONTE - 8} width={L} height={8} fill="#cfc4e0" />
      {/* chão com juntas do piso */}
      <rect x={x0} y={HORIZONTE} width={L} height={200} fill={`url(#${id('chao')})`} />
      <g stroke="#b9afcb" strokeWidth="0.8" opacity="0.7">
        {[262, 284, 314, 352].map((y) => (
          <line key={y} x1={x0} y1={y} x2={x0 + L} y2={y} />
        ))}
        {Array.from({ length: 14 }, (_, i) => {
          const x = x0 + i * 90;
          return <line key={i} x1={x} y1={HORIZONTE} x2={x + (x - 400) * 0.6} y2={400} />;
        })}
      </g>
      {/* relógio de parede */}
      <g transform={`translate(${relogio.x} ${relogio.y})`}>
        <circle r="17" fill="#ffffff" stroke="#4b2580" strokeWidth="2.6" />
        <circle r="17" fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="5" transform="translate(1 1.5)" />
        {Array.from({ length: 12 }, (_, i) => {
          const p = girar({ x: 0, y: -13.5 }, { x: 0, y: 0 }, i * 30);
          const q = girar({ x: 0, y: -15.5 }, { x: 0, y: 0 }, i * 30);
          return <line key={i} x1={arred(p.x)} y1={arred(p.y)} x2={arred(q.x)} y2={arred(q.y)} stroke="#2e1450" strokeWidth={i % 3 ? 0.8 : 1.6} />;
        })}
        <line x1="0" y1="0" x2="-6" y2="-6.5" stroke="#2e1450" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="0" y1="0" x2="8" y2="-9.5" stroke="#2e1450" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="0" y1="2" x2="3" y2="12" stroke="#c2413b" strokeWidth="0.7" />
        <circle r="1.4" fill="#2e1450" />
      </g>
      {/* régua de gases: fluxômetro de oxigênio (verde), ar comprimido e vácuo */}
      <g transform={`translate(${o2.x} ${o2.y})`}>
        <rect x="-26" y="-10" width="52" height="20" rx="3" fill="#cfd5de" stroke="#9aa4b2" strokeWidth="0.8" />
        <rect x="-21" y="-4" width="8" height="8" rx="1.5" fill="#2f9e5b" />
        <rect x="-5" y="-4" width="8" height="8" rx="1.5" fill="#f0f2f5" stroke="#9aa4b2" strokeWidth="0.6" />
        <rect x="11" y="-4" width="8" height="8" rx="1.5" fill="#f2d14c" />
        {/* fluxômetro com a bolinha */}
        <rect x="-20" y="4" width="6" height="20" rx="2" fill="#e6f4ec" stroke="#2f9e5b" strokeWidth="1" />
        <circle cx="-17" cy="12" r="1.6" fill="#2f9e5b" />
        <rect x="-21" y="23" width="8" height="4" rx="1" fill="#2f9e5b" />
      </g>
    </g>
  );
});

// ---- Maca e berço aquecido ----------------------------------------------------------------

export const Maca = memo(function Maca({ leito, prancha }: { leito: Leito; prancha?: { x0: number; x1: number } }) {
  const { x0, x1, topo, meiaProf: m, chao } = leito;
  const meio = (x0 + x1) / 2;
  // colchão visto um pouco de cima: faixa de cima (lençol) da borda de lá (topo − m) à de cá (topo + m) e a lateral azul
  const perto = topo + m;
  const longe = topo - m;
  const esp = 12;
  const armacao = perto + esp + 2;
  return (
    <g className="rcp-maca" aria-hidden="true">
      {/* base fechada (carenagem com bandeja), rodas */}
      <path d={`M ${x0 + 14} ${chao - 16} L ${x1 - 14} ${chao - 16} L ${x1 - 22} ${armacao + 6} L ${x0 + 22} ${armacao + 6} Z`} fill="#b7bfcb" />
      <path d={`M ${x0 + 14} ${chao - 16} L ${x1 - 14} ${chao - 16} L ${x1 - 16} ${chao - 30} L ${x0 + 16} ${chao - 30} Z`} fill="#9ea7b5" />
      <rect x={x0 + 30} y={armacao + 20} width={x1 - x0 - 60} height={14} rx={3} fill="#c9d0da" stroke="#a2abb8" strokeWidth="0.8" />
      <rect x={x0 + 8} y={chao - 20} width={x1 - x0 - 16} height={8} rx={4} fill="#7c8696" />
      <rect x={x0 + 8} y={armacao} width={x1 - x0 - 16} height={8} rx={3} fill="#6f7a8c" />
      {[x0 + 26, x1 - 26].map((x) => (
        <g key={x}>
          <circle cx={x} cy={chao - 6} r={7} fill="#2f3440" />
          <circle cx={x} cy={chao - 6} r={2.6} fill="#9aa4b2" />
        </g>
      ))}
      {/* grade lateral abaixada */}
      <rect x={x0 + 30} y={armacao + 11} width={x1 - x0 - 60} height={4} rx={2} fill="#c3cad5" stroke="#8d97a6" strokeWidth="0.6" />
      {/* lateral do colchão e lençol por cima */}
      <rect x={x0} y={perto - 4} width={x1 - x0} height={esp + 4} rx={6} fill="#56769d" />
      <rect x={x0} y={longe} width={x1 - x0} height={2 * m + 3} rx={7} fill="#e8ebf3" />
      <rect x={x0 + 1} y={longe} width={x1 - x0 - 2} height={2 * m} rx={7} fill="#f8f9fc" />
      <path d={`M ${x0 + 8} ${perto - 0.5} Q ${meio} ${perto + 2} ${x1 - 8} ${perto - 0.5}`} stroke="#d7dce8" strokeWidth="1.2" fill="none" />
      {prancha && (
        <g>
          <rect x={prancha.x0} y={topo - m * 0.62} width={prancha.x1 - prancha.x0} height={m * 1.24} rx={2} fill="#f0a24a" stroke="#c77a1c" strokeWidth="0.6" />
          <rect x={prancha.x0} y={topo + m * 0.62 - 1} width={prancha.x1 - prancha.x0} height={3} rx={1.2} fill="#c77a1c" />
        </g>
      )}
    </g>
  );
});

/** Berço de calor radiante (RN): base, colchão baixo e a coluna com a fonte de calor por cima. */
export const BercoFundo = memo(function BercoFundo({ leito, id }: { leito: Leito; id: (n: string) => string }) {
  const { x0, x1 } = leito;
  const xc = x1 + 6;
  const longe = leito.topo - leito.meiaProf;
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={id('calor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a3c" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ff9a3c" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* luz quente sobre o colchão */}
      <path d={`M ${x0 + 4} 78 L ${x1 - 4} 78 L ${x1 + 10} ${longe} L ${x0 - 10} ${longe} Z`} fill={`url(#${id('calor')})`} />
      {/* coluna e cúpula de calor */}
      <rect x={xc - 4} y={70} width={9} height={leito.chao - 80} fill="#d4d9e1" stroke="#a6aebb" strokeWidth="0.6" />
      <rect x={xc - 10} y={150} width={20} height={26} rx={3} fill="#eef1f5" stroke="#a6aebb" strokeWidth="0.6" />
      <rect x={xc - 7} y={154} width={14} height={8} rx={1.5} fill="#1d2b3a" />
      <text x={xc} y={160.5} textAnchor="middle" fontSize="5" fill="#7cf29b" fontFamily="monospace">36,5</text>
      <path d={`M ${x0 - 6} 66 L ${xc + 6} 66 L ${xc + 6} 80 L ${x0 - 6} 80 Q ${x0 - 12} 73 ${x0 - 6} 66 Z`} fill="#eef1f5" stroke="#a6aebb" strokeWidth="0.8" />
      <rect x={x0 + 4} y={78} width={x1 - x0 - 8} height={3} rx={1.5} fill="#ff8a3d" opacity="0.85" />
    </g>
  );
});

export const Berco = memo(function Berco({ leito }: { leito: Leito }) {
  const { x0, x1, topo, meiaProf: m, chao } = leito;
  const meio = (x0 + x1) / 2;
  const perto = topo + m;
  const longe = topo - m;
  return (
    <g className="rcp-berco" aria-hidden="true">
      {/* gabinete fechado até perto do chão (gavetas) e rodas */}
      <rect x={x0 - 2} y={perto + 10} width={x1 - x0 + 4} height={chao - perto - 26} rx={4} fill="#dfe3ea" stroke="#b5bdc9" strokeWidth="0.8" />
      <rect x={x0 + 6} y={perto + 31} width={x1 - x0 - 12} height={13} rx={2} fill="#e9ecf1" stroke="#c3cad5" strokeWidth="0.6" />
      <rect x={x0 + 6} y={perto + 50} width={x1 - x0 - 12} height={13} rx={2} fill="#e9ecf1" stroke="#c3cad5" strokeWidth="0.6" />
      {[perto + 36, perto + 55].map((y) => (
        <rect key={y} x={meio - 8} y={y} width={16} height={3} rx={1.5} fill="#a6aebb" />
      ))}
      <rect x={x0 + 4} y={chao - 18} width={x1 - x0 - 8} height={8} rx={3} fill="#8d97a6" />
      {[x0 + 16, x1 - 16].map((x) => (
        <circle key={x} cx={x} cy={chao - 6} r={6} fill="#2f3440" />
      ))}
      {/* bandeja, colchão (faixa de cima vista de 3/4) e painel de acrílico abaixado (na RCP fica aberto) */}
      <rect x={x0 - 6} y={perto + 2} width={x1 - x0 + 12} height={12} rx={3} fill="#d4d9e1" stroke="#a6aebb" strokeWidth="0.6" />
      <rect x={x0} y={perto - 3} width={x1 - x0} height={8} rx={4} fill="#79afdc" />
      <rect x={x0} y={longe} width={x1 - x0} height={2 * m + 1} rx={6} fill="#cfe5f6" />
      <rect x={x0 + 1} y={longe} width={x1 - x0 - 2} height={2 * m - 1.5} rx={6} fill="#f3f8fc" />
      <rect x={x0 + 4} y={perto + 8} width={x1 - x0 - 8} height={13} rx={2} fill="#dff1fb" fillOpacity="0.4" stroke="#ffffff" strokeWidth="0.8" />
    </g>
  );
});

// ---- Carrinho de parada com monitor/desfibrilador ---------------------------------------------

export function Carrinho({ layout, carregado, choque, comprimindo, rce }: { layout: LayoutFaixa; carregado: boolean; choque: number; comprimindo: number; rce: boolean }) {
  const c = layout.carrinho;
  // desenho em coordenadas locais (meio da base no chão), na escala do carrinho (mais ao fundo = menor)
  const T = -116;
  const w = 70;
  const gavetas = [0, 1, 2, 3, 4];
  const carga = { x: 20, y: T - 26 };
  const choqueB = { x: 20, y: T - 14 };
  // traçado da tela: artefato da compressão (sobe e desce com o tórax) ou complexos regulares com RCE
  const tela = { x: -30, y: T - 37, w: 40, h: 24 };
  const pts: Ponto[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const base = tela.y + tela.h * 0.62;
    let y = base;
    if (rce) {
      const f = (t * 3) % 1;
      y = base - (f > 0.45 && f < 0.52 ? tela.h * 0.42 : f > 0.52 && f < 0.56 ? -tela.h * 0.12 : 0);
    } else y = base - Math.sin(t * Math.PI * 4 + comprimindo * 2) * tela.h * 0.18 * (0.4 + comprimindo);
    pts.push({ x: tela.x + 2 + t * (tela.w - 4), y });
  }
  return (
    <g className="rcp-carrinho" aria-hidden="true" transform={`translate(${arred(c.x)} ${arred(c.chao)}) scale(${arred(c.escala * 100) / 100})`}>
      <ellipse cx={0} cy={1} rx={w * 0.62} ry={4} fill="#2b2140" opacity="0.18" />
      {/* cilindro de O₂ ao lado */}
      <rect x={w / 2 - 2} y={T + 22} width={10} height={64} rx={5} fill="#2f9e5b" />
      <rect x={w / 2} y={T + 16} width={6} height={8} rx={1.5} fill="#b8c0cc" />
      {/* corpo vermelho com gavetas */}
      <rect x={-w / 2} y={T} width={w} height={-T - 12} rx={4} fill="#c8282e" />
      <rect x={-w / 2} y={T} width={w} height={6} rx={3} fill="#9aa4b2" />
      {gavetas.map((i) => {
        const y = T + 10 + i * 17;
        return (
          <g key={i}>
            <rect x={-w / 2 + 4} y={y} width={w - 8} height={14} rx={2} fill="#e85d5d" stroke="#9e1c22" strokeWidth="0.8" />
            <rect x={-9} y={y + 5} width={18} height={3.4} rx={1.7} fill="#f3f4f7" />
          </g>
        );
      })}
      {[-w / 2 + 8, w / 2 - 8].map((xr) => (
        <g key={xr}>
          <circle cx={xr} cy={-6} r={6} fill="#2f3440" />
          <circle cx={xr} cy={-6} r={2.2} fill="#9aa4b2" />
        </g>
      ))}
      {/* monitor/desfibrilador */}
      <rect x={-34} y={T - 42} width={66} height={42} rx={5} fill="#3c4250" />
      <rect x={-34} y={T - 42} width={66} height={5} rx={2.5} fill="#525a6b" />
      <rect x={tela.x} y={tela.y} width={tela.w} height={tela.h} rx={2} fill="#05110b" />
      <path d={curva(pts)} stroke="#45f07a" strokeWidth="1.1" fill="none" />
      {carregado && (
        <text x={tela.x + tela.w / 2} y={tela.y + 7} textAnchor="middle" fontSize="5.2" fontWeight="700" fill="#ffd23f" fontFamily="system-ui, sans-serif">
          CARREGADO
        </text>
      )}
      {/* botões: carga (amarelo) e choque (laranja com raio) */}
      <circle cx={carga.x} cy={carga.y} r={4.2} fill={carregado ? '#ffe066' : '#d9b52c'} stroke="#7a6512" strokeWidth="0.6" />
      {carregado && <circle cx={carga.x} cy={carga.y} r={7} fill="#ffe066" opacity="0.35" />}
      <circle cx={choqueB.x} cy={choqueB.y} r={4.6} fill={choque > 0 ? '#ffd0a0' : carregado ? '#ff7a1a' : '#c9561a'} stroke="#7a2d0c" strokeWidth="0.6" />
      {carregado && <circle className="rcp-botao-pisca" cx={choqueB.x} cy={choqueB.y} r={7.5} fill="#ff7a1a" opacity="0.4" />}
      <path d={`M ${choqueB.x + 0.6} ${choqueB.y - 3} l -2.2 3.2 h 2 l -1 2.8 l 2.6 -3.6 h -2 z`} fill="#fff" />
      <circle cx={20} cy={T - 36} r={2.4} fill="#9aa4b2" />
      {/* saída dos cabos */}
      <rect x={-33} y={T - 11} width={6} height={6} rx={1} fill="#2f3440" />
    </g>
  );
}

/** Cabos do monitor e das pás: saem do peito, correm pela borda de cá do colchão até os pés do leito e sobem ao carrinho. */
export function Cabos({ layout, de }: { layout: LayoutFaixa; de: Ponto }) {
  const c = layout.carrinho;
  const { x1, topo, meiaProf } = layout.leito;
  const borda = topo + meiaProf - 2.5;
  const d = `M ${arred(de.x)} ${arred(de.y)} Q ${arred(de.x + 4)} ${arred(borda)} ${arred(de.x + 14)} ${arred(borda)} L ${arred(x1 - 10)} ${arred(borda + 0.5)} Q ${arred(x1 + 4)} ${arred(borda + 1)} ${arred(x1 + 5)} ${arred(borda + 12)} C ${arred(x1 + 8)} ${arred(borda + 40)}, ${arred(c.saidaCabos.x - 4)} ${arred(c.saidaCabos.y + 50)}, ${arred(c.saidaCabos.x)} ${arred(c.saidaCabos.y)}`;
  return (
    <g aria-hidden="true" fill="none">
      <path d={d} stroke="#3a3f4a" strokeWidth="1.6" strokeLinejoin="round" />
      <path d={d} stroke="#8a94a6" strokeWidth="0.5" transform="translate(0 -0.6)" />
    </g>
  );
}

// ---- Objetos que a equipe segura ------------------------------------------------------------

export interface GeoBolsa {
  /** Conexão da válvula (no alto da máscara ou do tubo). */
  conexao: Ponto;
  /** Centro da bolsa e raios agora (aperto amassa a bolsa). */
  centro: Ponto;
  rx: number;
  ry: number;
  /** Onde a mão aperta (em cima da bolsa) e a ponta de trás (reservatório). */
  pega: Ponto;
  cauda: Ponto;
}

/** Bolsa saindo da válvula para a esquerda (na direção de quem ventila). */
export function geoBolsa(conexao: Ponto, comprimento: number, aperto: number): GeoBolsa {
  const a = Math.min(1, Math.max(0, aperto));
  const rx = comprimento / 2;
  const ry = comprimento * 0.24 * (1 - 0.45 * a);
  const valvula = { x: conexao.x, y: conexao.y - 5 };
  const centro = { x: valvula.x - 5 - rx, y: valvula.y - 1 };
  return { conexao, centro, rx, ry, pega: { x: centro.x + rx * 0.1, y: centro.y - ry + 1 }, cauda: { x: centro.x - rx, y: centro.y } };
}

export function BolsaValvulaMascara({
  geo,
  mascara,
  oxigenio,
}: {
  geo: GeoBolsa;
  /** Máscara no rosto (sem: tubo traqueal). */
  mascara?: { base: [Ponto, Ponto]; topo: Ponto };
  /** Fluxômetro na parede (a extensão de O₂ vai até ele). */
  oxigenio?: Ponto;
}) {
  const { centro, rx, ry, conexao } = geo;
  const valvula = { x: conexao.x, y: conexao.y - 5 };
  const res = { x: geo.cauda.x - rx * 0.55, y: geo.cauda.y + ry * 0.6 };
  return (
    <g className="rcp-bolsa" aria-hidden="true">
      {/* extensão de O₂ até a parede */}
      {oxigenio && <path d={`M ${arred(res.x - rx * 0.4)} ${arred(res.y)} C ${arred(res.x - 30)} ${arred(res.y + 30)}, ${arred(oxigenio.x + 10)} ${arred(oxigenio.y + 70)}, ${arred(oxigenio.x - 17)} ${arred(oxigenio.y + 27)}`} stroke="#bfe6cf" strokeWidth="1.6" fill="none" opacity="0.95" />}
      {/* reservatório */}
      <ellipse cx={arred(res.x)} cy={arred(res.y)} rx={arred(rx * 0.55)} ry={arred(Math.max(2.4, rx * 0.26))} fill="#d7f0e0" opacity="0.8" stroke="#8cc5a3" strokeWidth="0.6" />
      {/* máscara: cúpula transparente com borda escura */}
      {mascara && (
        <g>
          <path
            d={`M ${arred(mascara.base[0].x)} ${arred(mascara.base[0].y)} Q ${arred(mascara.base[0].x)} ${arred(mascara.topo.y)} ${arred(mascara.topo.x)} ${arred(mascara.topo.y)} Q ${arred(mascara.base[1].x + 1)} ${arred(mascara.topo.y + 1)} ${arred(mascara.base[1].x)} ${arred(mascara.base[1].y)} Z`}
            fill="#eaf5fb"
            opacity="0.62"
            stroke="#7da3ba"
            strokeWidth="0.7"
          />
          <path d={`M ${arred(mascara.base[0].x)} ${arred(mascara.base[0].y)} Q ${arred((mascara.base[0].x + mascara.base[1].x) / 2)} ${arred(Math.min(mascara.base[0].y, mascara.base[1].y) + 1)} ${arred(mascara.base[1].x)} ${arred(mascara.base[1].y)}`} stroke="#3b4757" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <rect x={arred(mascara.topo.x - 2.2)} y={arred(conexao.y)} width="4.4" height={arred(Math.max(1, mascara.topo.y - conexao.y + 1))} fill="#d8e2ea" stroke="#7da3ba" strokeWidth="0.5" />
        </g>
      )}
      {/* válvula em cotovelo */}
      <path d={`M ${arred(conexao.x)} ${arred(conexao.y + 1)} L ${arred(valvula.x)} ${arred(valvula.y)} L ${arred(centro.x + rx - 1)} ${arred(centro.y)}`} stroke="#e3e8ee" strokeWidth="4.2" fill="none" strokeLinejoin="round" />
      <path d={`M ${arred(conexao.x)} ${arred(conexao.y + 1)} L ${arred(valvula.x)} ${arred(valvula.y)} L ${arred(centro.x + rx - 1)} ${arred(centro.y)}`} stroke="#8496a8" strokeWidth="0.6" fill="none" strokeLinejoin="round" />
      <circle cx={arred(valvula.x)} cy={arred(valvula.y)} r="2.6" fill="#f2c94c" stroke="#a88a1e" strokeWidth="0.5" />
      {/* bolsa (amassa quando aperta) */}
      <ellipse cx={arred(centro.x)} cy={arred(centro.y)} rx={arred(rx)} ry={arred(ry)} fill="#cfe3f0" stroke="#6f93ad" strokeWidth="0.8" />
      <ellipse cx={arred(centro.x - rx * 0.1)} cy={arred(centro.y - ry * 0.45)} rx={arred(rx * 0.6)} ry={arred(Math.max(0.6, ry * 0.25))} fill="#ffffff" opacity="0.6" />
      <path d={`M ${arred(centro.x - rx * 0.6)} ${arred(centro.y - ry * 0.85)} Q ${arred(centro.x - rx * 0.66)} ${arred(centro.y)} ${arred(centro.x - rx * 0.6)} ${arred(centro.y + ry * 0.85)}`} stroke="#6f93ad" strokeWidth="0.5" fill="none" opacity="0.7" />
    </g>
  );
}

export interface GeoSeringa {
  ponta: Ponto;
  /** Fim do corpo (aba) e fim do êmbolo (onde o polegar empurra). */
  aba: Ponto;
  embolo: Ponto;
}

/** Seringa com a ponta em `ponta`, apontando de `angulo` (graus: direção da ponta para o êmbolo). */
export function geoSeringa(ponta: Ponto, angulo: number, comprimento: number, empurrado: number): GeoSeringa {
  const r = (angulo * Math.PI) / 180;
  const d = { x: Math.cos(r), y: Math.sin(r) };
  const corpo = comprimento * 0.62;
  const haste = comprimento * 0.42 * (1 - Math.min(1, Math.max(0, empurrado))) + comprimento * 0.08;
  const aba = { x: ponta.x + d.x * corpo, y: ponta.y + d.y * corpo };
  return { ponta, aba, embolo: { x: aba.x + d.x * haste, y: aba.y + d.y * haste } };
}

export function Seringa({ geo, largura = 4.4, liquido = '#b58cf2' }: { geo: GeoSeringa; largura?: number; liquido?: string }) {
  const { ponta, aba, embolo } = geo;
  const ang = (Math.atan2(aba.y - ponta.y, aba.x - ponta.x) * 180) / Math.PI;
  const len = Math.hypot(aba.x - ponta.x, aba.y - ponta.y);
  const haste = Math.hypot(embolo.x - aba.x, embolo.y - aba.y);
  const w = largura;
  // líquido: do bico até a borracha do êmbolo (que anda dentro do corpo)
  const borracha = Math.max(len * 0.12, len - (len * 0.72 - haste + len * 0.13));
  return (
    <g transform={`translate(${arred(ponta.x)} ${arred(ponta.y)}) rotate(${arred(ang)})`} aria-hidden="true">
      <rect x="0" y={-w * 0.12} width={len * 0.14} height={w * 0.24} fill="#d8dee6" />
      <rect x={len * 0.12} y={-w / 2} width={len * 0.88} height={w} rx="0.8" fill="#f4f8fb" opacity="0.92" stroke="#8a9aaa" strokeWidth="0.45" />
      <rect x={len * 0.13} y={-w / 2 + 0.6} width={Math.max(0, Math.min(len * 0.86, borracha) - len * 0.13)} height={w - 1.2} fill={liquido} opacity="0.85" />
      {[0.3, 0.45, 0.6, 0.75].map((t) => (
        <line key={t} x1={len * t} y1={-w / 2} x2={len * t} y2={-w / 2 + w * 0.35} stroke="#6b7a8a" strokeWidth="0.35" />
      ))}
      <rect x={Math.min(len * 0.86, borracha)} y={-w / 2 + 0.4} width={1.6} height={w - 0.8} fill="#2f3440" />
      <rect x={len - 0.6} y={-w * 0.95} width="1.4" height={w * 1.9} rx="0.5" fill="#d8dee6" stroke="#8a9aaa" strokeWidth="0.35" />
      <rect x={Math.min(len * 0.86, borracha)} y={-w * 0.14} width={len - Math.min(len * 0.86, borracha) + haste} height={w * 0.28} fill="#e9edf2" stroke="#8a9aaa" strokeWidth="0.3" />
      <rect x={len + haste - 0.4} y={-w * 0.75} width="1.6" height={w * 1.5} rx="0.6" fill="#e9edf2" stroke="#8a9aaa" strokeWidth="0.35" />
    </g>
  );
}

/** Laringoscópio: lâmina curva com a ponta em `ponta`, cabo para cima (ângulo do cabo em graus). */
export function Laringoscopio({ ponta, angulo, tamanho }: { ponta: Ponto; angulo: number; tamanho: number }) {
  const t = tamanho;
  return (
    <g transform={`translate(${arred(ponta.x)} ${arred(ponta.y)}) rotate(${arred(angulo)})`} aria-hidden="true">
      <path d={`M 0 0 Q ${t * 0.3} ${-t * 0.12} ${t * 0.55} ${-t * 0.02} L ${t * 0.58} ${-t * 0.1} Q ${t * 0.3} ${-t * 0.22} -0.4 ${-t * 0.06} Z`} fill="#cfd6df" stroke="#8a94a6" strokeWidth="0.4" />
      <circle cx={t * 0.12} cy={-t * 0.06} r={t * 0.025} fill="#fff7c2" />
      <rect x={t * 0.54} y={-t * 0.13} width={t * 0.62} height={t * 0.17} rx={t * 0.05} fill="#3a3f4a" />
      <g stroke="#626a78" strokeWidth="0.4">
        {[0.62, 0.72, 0.82, 0.92, 1.02].map((u) => (
          <line key={u} x1={t * u} y1={-t * 0.12} x2={t * u} y2={t * 0.03} />
        ))}
      </g>
    </g>
  );
}

/** Tubo traqueal na mão (antes de entrar): da ponta até a conexão. */
export function TuboNaMao({ ponta, fim }: { ponta: Ponto; fim: Ponto }) {
  const meio = { x: (ponta.x + fim.x) / 2 + 3, y: (ponta.y + fim.y) / 2 - 3 };
  return (
    <g aria-hidden="true">
      <path d={`M ${arred(ponta.x)} ${arred(ponta.y)} Q ${arred(meio.x)} ${arred(meio.y)} ${arred(fim.x)} ${arred(fim.y)}`} stroke="#e3f1f7" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d={`M ${arred(ponta.x)} ${arred(ponta.y)} Q ${arred(meio.x)} ${arred(meio.y)} ${arred(fim.x)} ${arred(fim.y)}`} stroke="#9fb7c4" strokeWidth="0.45" fill="none" />
      <circle cx={arred(fim.x)} cy={arred(fim.y)} r="1.5" fill="#5b8fc9" />
    </g>
  );
}

export function Prancheta({ centro, angulo = -8, tamanho = 22 }: { centro: Ponto; angulo?: number; tamanho?: number }) {
  const w = tamanho * 0.78;
  const h = tamanho;
  return (
    <g transform={`translate(${arred(centro.x)} ${arred(centro.y)}) rotate(${angulo})`} aria-hidden="true">
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="1.6" fill="#9a6b3f" stroke="#6f4a28" strokeWidth="0.5" />
      <rect x={-w / 2 + 1.6} y={-h / 2 + 3} width={w - 3.2} height={h - 4.6} fill="#fbfaf6" />
      <g stroke="#9aa6b8" strokeWidth="0.45">
        {[0.3, 0.42, 0.54, 0.66, 0.78].map((t) => (
          <line key={t} x1={-w / 2 + 3} y1={-h / 2 + h * t} x2={w / 2 - 3} y2={-h / 2 + h * t} />
        ))}
      </g>
      <rect x={-w * 0.22} y={-h / 2 - 1} width={w * 0.44} height="3.4" rx="1" fill="#c9cfd8" stroke="#8a94a6" strokeWidth="0.4" />
    </g>
  );
}

export function Caneta({ ponta, angulo = -55 }: { ponta: Ponto; angulo?: number }) {
  return (
    <g transform={`translate(${arred(ponta.x)} ${arred(ponta.y)}) rotate(${angulo})`} aria-hidden="true">
      <rect x="0" y="-0.8" width="11" height="1.6" rx="0.8" fill="#2f5fb3" />
      <path d="M 0 -0.8 L -1.8 0 L 0 0.8 Z" fill="#1d1b24" />
    </g>
  );
}

export function Cronometro({ centro, r = 4.2 }: { centro: Ponto; r?: number }) {
  return (
    <g transform={`translate(${arred(centro.x)} ${arred(centro.y)})`} aria-hidden="true">
      <rect x={-1} y={-r - 2.2} width="2" height="2" fill="#8a94a6" />
      <circle r={r} fill="#f7f8fa" stroke="#4b2580" strokeWidth="1.1" />
      <line x1="0" y1="0" x2={r * 0.45} y2={-r * 0.6} stroke="#c2413b" strokeWidth="0.7" />
    </g>
  );
}

/** Furadeira intraóssea com a agulha para baixo (ponta em `ponta`). */
export function FuradeiraIO({ ponta, tamanho = 16 }: { ponta: Ponto; tamanho?: number }) {
  const t = tamanho;
  return (
    <g transform={`translate(${arred(ponta.x)} ${arred(ponta.y)})`} aria-hidden="true">
      <line x1="0" y1="0" x2="0" y2={-t * 0.3} stroke="#9aa3ad" strokeWidth="0.9" />
      <rect x={-t * 0.12} y={-t * 0.42} width={t * 0.24} height={t * 0.14} rx="0.6" fill="#d9467a" />
      <path d={`M ${-t * 0.2} ${-t * 0.42} L ${t * 0.2} ${-t * 0.42} L ${t * 0.22} ${-t * 0.95} L ${-t * 0.22} ${-t * 0.95} Z`} fill="#c8282e" />
      <path d={`M ${t * 0.22} ${-t * 0.85} L ${t * 0.62} ${-t * 0.82} L ${t * 0.6} ${-t * 0.62} L ${t * 0.2} ${-t * 0.62} Z`} fill="#3a3f4a" />
    </g>
  );
}

/** Cateter de punção periférica na mão (antes de entrar). */
export function CateterNaMao({ ponta, angulo = -160 }: { ponta: Ponto; angulo?: number }) {
  return (
    <g transform={`translate(${arred(ponta.x)} ${arred(ponta.y)}) rotate(${angulo})`} aria-hidden="true">
      <line x1="0" y1="0" x2="-5" y2="0" stroke="#c9d1db" strokeWidth="0.7" />
      <rect x="-9" y="-1.2" width="4.4" height="2.4" rx="0.6" fill="#3f8ee0" />
      <rect x="-12.5" y="-0.9" width="3.6" height="1.8" rx="0.4" fill="#e9eef3" stroke="#a5afbb" strokeWidth="0.3" />
    </g>
  );
}

/** Pás adesivas soltas (para o catálogo): duas placas com o cabo. */
export function PasAdesivas() {
  return (
    <g aria-hidden="true">
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${20 + i * 46} 18) rotate(${i ? 8 : -6})`}>
          <rect x="0" y="0" width="34" height="42" rx="5" fill="#ffffff" stroke="#c4ccd6" strokeWidth="1" />
          <rect x="4" y="4" width="26" height="34" rx="3" fill="#e9eef3" stroke="#e5484d" strokeWidth="1" strokeDasharray="3 2" />
          <path d="M 17 12 l -4 8 h 4 l -2 7 l 6 -9 h -4 z" fill="#e5484d" />
        </g>
      ))}
      <path d="M 37 60 C 40 80, 70 80, 83 64 M 60 76 L 60 92" stroke="#3a3f4a" strokeWidth="2" fill="none" />
    </g>
  );
}
