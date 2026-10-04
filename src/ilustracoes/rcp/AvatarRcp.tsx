/**
 * Avatar de um membro da equipe (de pé, de frente ou de 3/4), com pijama cirúrgico na cor escolhida,
 * pele e cabelo da aparência. Os braços têm cotovelo calculado até o alvo de cada mão
 * (geometria.cotoveloAte). Coordenadas locais: origem no meio dos pés, y para cima negativo.
 *
 * "A" é o braço do lado esquerdo da tela e "B" o do lado direito (independe de para onde a pessoa olha).
 */

import type { ReactNode } from 'react';
import type { AparenciaAvatar } from '../../parada/cena';
import { capsula, type Ponto } from '../formas';
import { misturar, PALETAS, type PaletaPele } from '../pele';
import { arred, curva } from './caminhos';
import { ANTEBRACO_AVATAR, BRACO_AVATAR, cotoveloAte, MAO_AVATAR, MEIO_OMBRO, OMBRO_AVATAR } from './geometria';

export type FormaMao = 'solta' | 'fechada' | 'aberta' | 'apoiada' | 'envolvendo' | 'apontando';

export interface MaoPose {
  /** Punho (coordenadas locais). */
  alvo: Ponto;
  forma: FormaMao;
  /** Para que lado o cotovelo dobra (1 = sentido horário a partir da linha ombro → mão). */
  cotovelo: 1 | -1;
  /** Ângulo da mão (graus); sem = segue o antebraço. */
  angulo?: number;
  /** Braço solto de quem está atrás da maca: desenhado com o corpo (fica atrás do leito). */
  atras?: boolean;
  /** Mão nas costas: o braço é desenhado antes do tronco (quase todo escondido atrás dele). */
  nasCostas?: boolean;
}

export interface PoseAvatar {
  /** Corpo virado: -1 esquerda, 0 de frente, 1 direita. */
  giro: number;
  /** Cabeça virada (olhar), mesma escala. */
  giroCabeca: number;
  /** Olhando para baixo (0 a 1). */
  olharBaixo: number;
  /** Corpo inteiro deslocado agora (ex.: compressor descendo com o tórax). */
  corpo: Ponto;
  /** Ombros e cabeça deslocados em relação ao quadril (tronco curvado). */
  inclina: Ponto;
  maoA?: MaoPose;
  maoB?: MaoPose;
  falando: boolean;
  /** Luvas de procedimento. */
  luvas: boolean;
  /** Objetos que a pessoa segura (desenhados antes das mãos). */
  objetos?: ReactNode;
}

export const POSE_PARADA: PoseAvatar = { giro: 0, giroCabeca: 0, olharBaixo: 0, corpo: { x: 0, y: 0 }, inclina: { x: 0, y: 0 }, falando: false, luvas: false };

const COR_LUVA = '#7b9fe6';

/** Pontos do esqueleto com a pose (coordenadas locais). */
export function esqueleto(pose: PoseAvatar) {
  const g = pose.giro;
  const tc = g * 3 + pose.corpo.x;
  const sw = MEIO_OMBRO * (1 - 0.28 * Math.abs(g));
  const oy = -OMBRO_AVATAR + pose.corpo.y;
  const inc = pose.inclina;
  return {
    tc,
    sw,
    /** Articulação do ombro (dentro da manga) e canto do ombro no contorno do tronco. */
    ombroA: { x: tc - sw + 2.5 + inc.x, y: oy + 4 + inc.y },
    ombroB: { x: tc + sw - 2.5 + inc.x, y: oy + 4 + inc.y },
    cantoA: { x: tc - sw + inc.x, y: oy + inc.y },
    cantoB: { x: tc + sw + inc.x, y: oy + inc.y },
    cabeca: { x: tc + g * 3 + inc.x * 1.08, y: oy - 23 + inc.y * 1.05 },
    pescoco: { x: tc + g * 2 + inc.x, y: oy - 6 + inc.y },
    cintura: { x: tc + inc.x * 0.45, y: -120 + pose.corpo.y + inc.y * 0.4 },
    quadril: { x: tc, y: -98 + pose.corpo.y },
  };
}

/** Mão parada ao lado do corpo. */
export function maoSolta(pose: PoseAvatar, lado: 'A' | 'B'): MaoPose {
  const e = esqueleto(pose);
  const s = lado === 'A' ? -1 : 1;
  return { alvo: { x: e.tc + s * (e.sw + 2) + pose.giro * 4, y: -94 + pose.corpo.y }, forma: 'solta', cotovelo: lado === 'A' ? 1 : -1 };
}

export interface PropsAvatarRcp {
  aparencia: AparenciaAvatar;
  pose: PoseAvatar;
  /** 'corpo' = sem os braços da frente; 'bracos' = só braços, mãos e objetos (para quem fica atrás da maca). */
  camada?: 'tudo' | 'corpo' | 'bracos';
  id: (nome: string) => string;
}

export function AvatarRcp({ aparencia, pose, camada = 'tudo', id }: PropsAvatarRcp) {
  const pal = PALETAS[aparencia.pele];
  const e = esqueleto(pose);
  const g = pose.giro;
  const longe: 'A' | 'B' | null = g > 0.15 ? 'B' : g < -0.15 ? 'A' : null;
  const maoA = pose.maoA ?? maoSolta(pose, 'A');
  const maoB = pose.maoB ?? maoSolta(pose, 'B');
  const roupa = aparencia.roupa;
  const branco = luminancia(roupa) > 0.85;
  const roupaEscura = misturar(roupa, '#1d1b24', branco ? 0.16 : 0.22);

  const braco = (lado: 'A' | 'B', parte: 'tudo' | 'braco' | 'mao') => {
    const m = lado === 'A' ? maoA : maoB;
    const ombro = lado === 'A' ? e.ombroA : e.ombroB;
    return <Braco key={`${lado}-${parte}`} ombro={ombro} mao={m} pal={pal} roupa={roupa} luvas={pose.luvas} parte={parte} distante={lado === longe} id={id} />;
  };
  const lados = (['A', 'B'] as const).map((l) => {
    const m = l === 'A' ? maoA : maoB;
    return { l, atras: !!m.atras || !!m.nasCostas, longe: l === longe || !!m.nasCostas };
  });

  const corpo = (
    <>
      {/* sombra no chão */}
      <ellipse cx={arred(e.tc)} cy="-1" rx="24" ry="4.5" fill="#2b2140" opacity="0.16" />
      <CabeloAtras aparencia={aparencia} centro={e.cabeca} giro={pose.giroCabeca} pal={pal} />
      {lados.filter((x) => x.longe).map((x) => braco(x.l, x.atras ? 'tudo' : 'braco'))}
      <Pernas tc={e.tc - pose.corpo.x} g={g} roupa={roupaEscura} corpoY={pose.corpo.y} branco={branco} />
      <Tronco e={e} g={g} roupa={roupa} roupaEscura={roupaEscura} branco={branco} id={id} />
      <Cabeca aparencia={aparencia} centro={e.cabeca} pescoco={e.pescoco} giro={pose.giroCabeca} olharBaixo={pose.olharBaixo} falando={pose.falando} id={id} />
      {lados.filter((x) => x.atras && !x.longe).map((x) => braco(x.l, 'tudo'))}
    </>
  );
  const bracos = (
    <>
      {lados.filter((x) => !x.atras && !x.longe).map((x) => braco(x.l, 'braco'))}
      {pose.objetos}
      {lados.filter((x) => !x.atras).map((x) => braco(x.l, 'mao'))}
    </>
  );
  if (camada === 'corpo') return <g>{corpo}</g>;
  if (camada === 'bracos') return <g>{bracos}</g>;
  return (
    <g>
      {corpo}
      {bracos}
    </g>
  );
}

function luminancia(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---- Partes do corpo ------------------------------------------------------------------------

function Pernas({ tc, g, roupa, corpoY, branco }: { tc: number; g: number; roupa: string; corpoY: number; branco: boolean }) {
  const dx = g * 2;
  const pernas = [-1, 1].map((s) => {
    const q = { x: tc + s * 8.5, y: -100 + corpoY };
    const j = { x: tc + s * 8.2 + dx, y: -52 };
    const t = { x: tc + s * 7.4 + dx * 1.6, y: -9 };
    return { s, q, j, t };
  });
  return (
    <g>
      {pernas.map(({ s, q, j, t }) => (
        <g key={s} fill={s === (g > 0 ? 1 : -1) && Math.abs(g) > 0.15 ? misturar(roupa, '#000', 0.1) : roupa}>
          <path d={capsula(q, j, 17.5, 13.5)} />
          <path d={capsula(j, t, 13.5, 11)} />
        </g>
      ))}
      {/* jaleco branco vai até o joelho */}
      {branco && <path d={`M ${tc - 20} ${-104 + corpoY} L ${tc + 20} ${-104 + corpoY} L ${tc + 22} -62 L ${tc - 22} -62 Z`} fill="#f4f6f9" stroke="#c9cfd8" strokeWidth="0.6" />}
      {pernas.map(({ s, t }) => (
        <g key={`p${s}`}>
          <path d={`M ${arred(t.x - 8 + g * 3)} -1 Q ${arred(t.x - 8 + g * 3)} -10 ${arred(t.x + g * 3)} -10 Q ${arred(t.x + 9 + g * 3)} -10 ${arred(t.x + 9 + g * 4)} -1 Z`} fill="#eef1f5" stroke="#a6aebb" strokeWidth="0.6" />
          <rect x={arred(t.x - 8.4 + g * 3)} y="-2.4" width="17.6" height="2.6" rx="1.2" fill="#8d97a6" />
        </g>
      ))}
    </g>
  );
}

function Tronco({ e, g, roupa, roupaEscura, branco, id }: { e: ReturnType<typeof esqueleto>; g: number; roupa: string; roupaEscura: string; branco: boolean; id: (n: string) => string }) {
  const { cantoA: a, cantoB: b, cintura: c, quadril: q, pescoco: p } = e;
  const cw = 17 * (1 - 0.18 * Math.abs(g));
  const qw = 19 * (1 - 0.15 * Math.abs(g));
  const pts: Ponto[] = [
    { x: p.x - 6, y: p.y + 0.5 },
    { x: a.x + 6, y: a.y - 0.8 },
    { x: a.x + 0.2, y: a.y + 4 },
    { x: a.x + 3, y: a.y + 21 },
    { x: c.x - cw, y: c.y },
    { x: q.x - qw, y: q.y + 2 },
    { x: q.x + qw, y: q.y + 2 },
    { x: c.x + cw, y: c.y },
    { x: b.x - 3, y: b.y + 21 },
    { x: b.x - 0.2, y: b.y + 4 },
    { x: b.x - 6, y: b.y - 0.8 },
    { x: p.x + 6, y: p.y + 0.5 },
  ];
  const d = curva(pts, true, false, 0.7);
  const decote = `M ${arred(p.x - 6.5)} ${arred(p.y + 1)} L ${arred(p.x + g * 2)} ${arred(p.y + 13)} L ${arred(p.x + 6.5)} ${arred(p.y + 1)} Z`;
  // bolso e crachá
  const bolso = { x: (p.x + b.x) / 2 + 1 + g * 2, y: p.y + 20 };
  const cracha = { x: (p.x + a.x) / 2 - 1 + g * 2, y: p.y + 18 };
  return (
    <g>
      <path d={d} fill={roupa} stroke={roupaEscura} strokeWidth="0.7" />
      <path d={d} fill={`url(#${id('dobra-roupa')})`} />
      <path d={decote} fill={roupaEscura} />
      {branco ? (
        <g stroke="#c9cfd8" strokeWidth="0.8" fill="none">
          <path d={`M ${arred(p.x - 6.5)} ${arred(p.y + 1)} L ${arred(p.x - 2 + g * 2)} ${arred(c.y)} M ${arred(p.x + 6.5)} ${arred(p.y + 1)} L ${arred(p.x + 2 + g * 2)} ${arred(c.y)}`} />
        </g>
      ) : (
        <rect x={arred(bolso.x - 4.5)} y={arred(bolso.y)} width="9" height="7.5" rx="1" fill="none" stroke={roupaEscura} strokeWidth="0.7" />
      )}
      <rect x={arred(bolso.x + 1)} y={arred(bolso.y - 4)} width="1.4" height="6" rx="0.6" fill="#2f5fb3" />
      <rect x={arred(cracha.x - 4)} y={arred(cracha.y)} width="8" height="10" rx="1.2" fill="#ffffff" stroke="#c9cfd8" strokeWidth="0.4" />
      <rect x={arred(cracha.x - 4)} y={arred(cracha.y)} width="8" height="3" rx="1.2" fill="#6d3fb2" />
    </g>
  );
}

function Braco({ ombro, mao, pal, roupa, luvas, parte, distante, id }: { ombro: Ponto; mao: MaoPose; pal: PaletaPele; roupa: string; luvas: boolean; parte: 'tudo' | 'braco' | 'mao'; distante: boolean; id: (n: string) => string }) {
  const { cotovelo, punho } = cotoveloAte(ombro, mao.alvo, BRACO_AVATAR, ANTEBRACO_AVATAR, mao.cotovelo);
  const manga = { x: ombro.x + (cotovelo.x - ombro.x) * 0.4, y: ombro.y + (cotovelo.y - ombro.y) * 0.4 };
  const pele = distante ? misturar(pal.base, pal.sombra, 0.35) : pal.base;
  const angAntebraco = (Math.atan2(punho.y - cotovelo.y, punho.x - cotovelo.x) * 180) / Math.PI;
  const ang = mao.angulo ?? angAntebraco;
  const corMao = luvas ? COR_LUVA : pele;
  return (
    <g>
      {parte !== 'mao' && (
        <>
          <path d={capsula(ombro, cotovelo, 7.2, 6.4)} fill={pele} stroke={pal.contorno} strokeOpacity="0.35" strokeWidth="0.5" />
          <path d={capsula(cotovelo, punho, 6.4, 5.2)} fill={pele} stroke={pal.contorno} strokeOpacity="0.35" strokeWidth="0.5" />
          <path d={capsula(cotovelo, punho, 6.4, 5.2)} fill={`url(#${id('volume-braco')})`} />
          {/* manga curta */}
          <path d={manguinha(ombro, manga)} fill={distante ? misturar(roupa, '#000', 0.1) : roupa} stroke={misturar(roupa, '#000', 0.25)} strokeWidth="0.6" />
          <path d={manguinha(ombro, manga)} fill={`url(#${id('volume-braco')})`} />
          {luvas && <path d={capsula({ x: punho.x - (punho.x - cotovelo.x) * 0.14, y: punho.y - (punho.y - cotovelo.y) * 0.14 }, punho, 5.8, 5.6)} fill={COR_LUVA} />}
        </>
      )}
      {parte !== 'braco' && <Mao punho={punho} angulo={ang} forma={mao.forma} cor={corMao} contorno={luvas ? '#4f73b8' : pal.contorno} />}
    </g>
  );
}

/** Manga curta: arredondada no ombro e um pouco aberta na barra. */
function manguinha(ombro: Ponto, fim: Ponto): string {
  const dx = fim.x - ombro.x;
  const dy = fim.y - ombro.y;
  const l = Math.hypot(dx, dy) || 1;
  const n = { x: -dy / l, y: dx / l };
  const r0 = 4.9;
  const r1 = 5.6;
  const p = (b: Ponto, s: number, r: number) => `${arred(b.x + n.x * r * s)} ${arred(b.y + n.y * r * s)}`;
  const topo = { x: ombro.x - (dx / l) * r0, y: ombro.y - (dy / l) * r0 };
  return `M ${p(ombro, 1, r0)} Q ${p(topo, 1, r0)} ${arred(topo.x)} ${arred(topo.y)} Q ${p(topo, -1, r0)} ${p(ombro, -1, r0)} L ${p(fim, -1, r1)} Q ${arred(fim.x + (dx / l) * 1.2)} ${arred(fim.y + (dy / l) * 1.2)} ${p(fim, 1, r1)} Z`;
}

/** Mão no punho, apontando para `angulo` (graus). */
export function Mao({ punho, angulo, forma, cor, contorno }: { punho: Ponto; angulo: number; forma: FormaMao; cor: string; contorno: string }) {
  const t = `translate(${arred(punho.x)} ${arred(punho.y)}) rotate(${arred(angulo)})`;
  const L = MAO_AVATAR;
  const traco = { stroke: contorno, strokeOpacity: 0.5, strokeWidth: 0.5 };
  if (forma === 'apoiada') {
    // de frente, mão espalmada no tórax (região tenar e hipotenar no esterno): dorso, nós dos dedos e as pontas viradas para quem olha
    const s = Math.cos((angulo * Math.PI) / 180) >= 0 ? 1 : -1;
    return (
      <g transform={`translate(${arred(punho.x)} ${arred(punho.y)})`}>
        <path d={capsula({ x: s * 5.2, y: 1.6 }, { x: s * 8.4, y: 4.8 }, 2.7, 2.2)} fill={cor} {...traco} />
        <path d="M -6.2 0.4 C -6.7 3.4, -6 6, -4.6 7.1 L 4.6 7.1 C 6 6, 6.7 3.4, 6.2 0.4 C 4 -1, -4 -1, -6.2 0.4 Z" fill={cor} {...traco} />
        {[-4.1, -1.38, 1.38, 4.1].map((x) => (
          <ellipse key={x} cx={x} cy="7.3" rx="1.45" ry="1.15" fill={cor} {...traco} />
        ))}
        <path d="M -4.6 3.7 Q 0 5 4.6 3.7" fill="none" stroke={contorno} strokeOpacity="0.45" strokeWidth="0.55" />
      </g>
    );
  }
  if (forma === 'envolvendo') {
    // dois polegares: dorso da mão no flanco do tórax, dedos descendo (envolvem o tórax) e o polegar por cima do esterno, apontando para o meio
    const s = Math.cos((angulo * Math.PI) / 180) >= 0 ? 1 : -1;
    return (
      <g transform={`translate(${arred(punho.x)} ${arred(punho.y)})`}>
        <path d="M -4.4 -0.6 C -5 2.6, -4.9 5.6, -4.3 7.4 L 4.3 7.4 C 4.9 5.6, 5 2.6, 4.4 -0.6 Z" fill={cor} {...traco} />
        {[-3.2, -1.07, 1.07, 3.2].map((x, i) => (
          <path key={x} d={capsula({ x, y: 6.4 }, { x: x * 1.05, y: i === 0 || i === 3 ? 11.2 : 12.4 }, 2.3, 2)} fill={cor} {...traco} />
        ))}
        <path d={capsula({ x: s * 1.6, y: -0.6 }, { x: s * 7.2, y: -1.2 }, 3.1, 2.5)} fill={cor} {...traco} />
        <path d={`M ${arred(s * 6.2)} -2.1 l ${arred(s * 0.9)} 0.5`} stroke={contorno} strokeOpacity="0.5" strokeWidth="0.5" />
      </g>
    );
  }
  if (forma === 'aberta') {
    return (
      <g transform={t}>
        <ellipse cx={L * 0.36} cy="0" rx={L * 0.36} ry={L * 0.3} fill={cor} {...traco} />
        {[-2.4, -0.8, 0.8, 2.4].map((y, i) => (
          <path key={y} d={capsula({ x: L * 0.6, y: y * 0.85 }, { x: L * (i === 0 ? 0.94 : i === 3 ? 0.9 : 1.02), y: y * 0.95 }, 1.9, 1.7)} fill={cor} {...traco} />
        ))}
        <path d={capsula({ x: L * 0.3, y: -L * 0.22 }, { x: L * 0.58, y: -L * 0.46 }, 2.4, 2)} fill={cor} {...traco} />
      </g>
    );
  }
  if (forma === 'apontando') {
    return (
      <g transform={t}>
        <ellipse cx={L * 0.34} cy="0" rx={L * 0.34} ry={L * 0.28} fill={cor} {...traco} />
        <path d={capsula({ x: L * 0.55, y: -0.8 }, { x: L * 1.12, y: -1 }, 2.2, 1.8)} fill={cor} {...traco} />
      </g>
    );
  }
  // fechada / solta: mão em concha com o polegar
  return (
    <g transform={t}>
      <ellipse cx={L * 0.38} cy="0" rx={L * 0.4} ry={L * (forma === 'solta' ? 0.27 : 0.33)} fill={cor} {...traco} />
      <path d={capsula({ x: L * 0.25, y: -L * 0.2 }, { x: L * 0.55, y: -L * 0.32 }, 2.6, 2.1)} fill={cor} {...traco} />
    </g>
  );
}

// ---- Cabeça, rosto e cabelo -------------------------------------------------------------------

const RX = 12.4;
const RY = 15;

export function Cabeca({
  aparencia,
  centro: c,
  pescoco,
  giro,
  olharBaixo,
  falando,
  id,
}: {
  aparencia: AparenciaAvatar;
  centro: Ponto;
  pescoco: Ponto;
  giro: number;
  olharBaixo: number;
  falando: boolean;
  id: (n: string) => string;
}) {
  const pal = PALETAS[aparencia.pele];
  const gc = Math.max(-1, Math.min(1, giro));
  const fx = gc * 4.6;
  const ob = Math.max(0, Math.min(1, olharBaixo));
  const olhoY = c.y + 1.2 + ob * 1.4;
  const abertura = 1.5 * (1 - ob * 0.55);
  const olhos = [-1, 1].map((s) => {
    const longe = Math.sign(gc) === -s && Math.abs(gc) > 0.15;
    return { s, x: c.x + fx + s * 4.7 * (1 - 0.3 * Math.abs(gc)), rx: longe ? 1.5 : 2.1 };
  });
  const orelhas = [-1, 1].filter((s) => !(Math.abs(gc) > 0.25 && Math.sign(gc) === s));
  return (
    <g>
      {/* pescoço */}
      <path d={capsula({ x: (c.x + pescoco.x) / 2, y: c.y + 9 }, pescoco, 10, 11)} fill={misturar(pal.base, pal.sombra, 0.35)} />
      {/* orelhas */}
      {orelhas.map((s) => (
        <ellipse key={s} cx={arred(c.x + s * (RX - 0.4) + gc * 4)} cy={arred(c.y + 1.5)} rx="2.6" ry="4" fill={pal.base} stroke={pal.contorno} strokeOpacity="0.5" strokeWidth="0.5" />
      ))}
      {/* rosto: crânio + bochecha do lado para onde olha */}
      <ellipse cx={arred(c.x)} cy={arred(c.y)} rx={RX} ry={RY} fill={`url(#${id(`volume-${aparencia.pele}`)})`} stroke={pal.contorno} strokeOpacity="0.45" strokeWidth="0.6" />
      {Math.abs(gc) > 0.2 && <ellipse cx={arred(c.x + gc * 4.2)} cy={arred(c.y + 4.5)} rx="9.4" ry="10" fill={pal.base} />}
      <ellipse cx={arred(c.x + fx * 0.9 - 6.5)} cy={arred(c.y + 6)} rx="3.4" ry="2.2" fill={pal.rubor} opacity="0.3" />
      <ellipse cx={arred(c.x + fx * 0.9 + 6.5)} cy={arred(c.y + 6)} rx="3.4" ry="2.2" fill={pal.rubor} opacity="0.3" />
      {/* olhos */}
      {olhos.map((o) => (
        <g key={o.s}>
          <ellipse cx={arred(o.x)} cy={arred(olhoY)} rx={o.rx} ry={arred(abertura)} fill="#fbfbfd" />
          <circle cx={arred(o.x + gc * 0.7)} cy={arred(olhoY + ob * 0.4)} r={arred(Math.min(1.25, abertura * 0.85))} fill="#2a1d14" />
          <path d={`M ${arred(o.x - o.rx - 0.3)} ${arred(olhoY - abertura * 0.4)} Q ${arred(o.x)} ${arred(olhoY - abertura - 0.6)} ${arred(o.x + o.rx + 0.3)} ${arred(olhoY - abertura * 0.4)}`} stroke="#2a1d14" strokeWidth="0.7" fill="none" />
          <path d={`M ${arred(o.x - o.rx)} ${arred(olhoY - 4.6)} Q ${arred(o.x)} ${arred(olhoY - 6)} ${arred(o.x + o.rx + 0.4)} ${arred(olhoY - 4.8)}`} stroke={pal.cabelo} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* nariz */}
      {Math.abs(gc) > 0.2 ? (
        <path d={`M ${arred(c.x + fx * 1.25)} ${arred(c.y + 1)} L ${arred(c.x + fx * 1.25 + gc * 2.6)} ${arred(c.y + 6.6)} L ${arred(c.x + fx * 1.1)} ${arred(c.y + 7.4)}`} fill={pal.base} stroke={pal.contorno} strokeOpacity="0.6" strokeWidth="0.6" strokeLinejoin="round" />
      ) : (
        <path d={`M ${arred(c.x + fx - 1.6)} ${arred(c.y + 6.8)} Q ${arred(c.x + fx)} ${arred(c.y + 8)} ${arred(c.x + fx + 1.6)} ${arred(c.y + 6.8)}`} stroke={pal.sombra} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      )}
      {/* boca */}
      {falando ? (
        <ellipse cx={arred(c.x + fx * 1.05)} cy={arred(c.y + 10.6)} rx="2.3" ry="1.7" fill="#7a2730" stroke={pal.labio} strokeWidth="0.6" />
      ) : (
        <path d={`M ${arred(c.x + fx * 1.05 - 2.4)} ${arred(c.y + 10.4)} Q ${arred(c.x + fx * 1.05)} ${arred(c.y + 11.4)} ${arred(c.x + fx * 1.05 + 2.4)} ${arred(c.y + 10.4)}`} stroke={pal.labio} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      )}
      <CabeloFrente aparencia={aparencia} centro={c} giro={gc} cor={pal.cabelo} />
    </g>
  );
}

/** Parte do cabelo que fica atrás da cabeça e do corpo (longo, preso). */
function CabeloAtras({ aparencia, centro: c, giro, pal }: { aparencia: AparenciaAvatar; centro: Ponto; giro: number; pal: PaletaPele }) {
  if (aparencia.cabelo === 'longo') {
    const x = c.x - giro * 2;
    return <path d={`M ${arred(x - 14.5)} ${arred(c.y - 6)} Q ${arred(x - 18)} ${arred(c.y + 16)} ${arred(x - 15)} ${arred(c.y + 27)} L ${arred(x + 15)} ${arred(c.y + 27)} Q ${arred(x + 18)} ${arred(c.y + 16)} ${arred(x + 14.5)} ${arred(c.y - 6)} Z`} fill={misturar(pal.cabelo, '#000', 0.15)} />;
  }
  if (aparencia.cabelo === 'preso') {
    // coque no alto, atrás da cabeça
    const x = c.x - giro * 9;
    return (
      <g fill={pal.cabelo}>
        <circle cx={arred(x)} cy={arred(c.y - 14.5)} r="5.6" />
        <circle cx={arred(x - 1.5)} cy={arred(c.y - 16)} r="1.6" fill={misturar(pal.cabelo, '#ffffff', 0.25)} opacity="0.5" />
      </g>
    );
  }
  return null;
}

function CabeloFrente({ aparencia, centro: c, giro: gc, cor }: { aparencia: AparenciaAvatar; centro: Ponto; giro: number; cor: string }) {
  const fx = gc * 4;
  const brilho = misturar(cor, '#ffffff', 0.28);
  // calota: das têmporas, por cima da cabeça, voltando pela linha do cabelo (franja)
  const calota = (folga: number, topo: number, franja: number, tempora = 1) =>
    `M ${arred(c.x - RX - folga)} ${arred(c.y + tempora)} C ${arred(c.x - RX - folga)} ${arred(c.y - RY - topo)}, ${arred(c.x + RX + folga)} ${arred(c.y - RY - topo)}, ${arred(c.x + RX + folga)} ${arred(c.y + tempora)} ` +
    `L ${arred(c.x + RX - 1.2)} ${arred(c.y - 3)} Q ${arred(c.x + fx + 6)} ${arred(c.y - franja - 1)} ${arred(c.x + fx)} ${arred(c.y - franja)} Q ${arred(c.x + fx - 7)} ${arred(c.y - franja + 1)} ${arred(c.x - RX + 1.2)} ${arred(c.y - 3)} Z`;
  switch (aparencia.cabelo) {
    case 'raspado':
      return <path d={calota(0.3, 3.6, 10.5, -2)} fill={cor} opacity="0.55" />;
    case 'curto':
      return (
        <g>
          <path d={calota(1.4, 5.6, 8.6)} fill={cor} />
          <path d={`M ${arred(c.x - 7 + fx * 0.5)} ${arred(c.y - 12)} Q ${arred(c.x + fx * 0.5)} ${arred(c.y - 15.5)} ${arred(c.x + 6 + fx * 0.5)} ${arred(c.y - 13)}`} stroke={brilho} strokeWidth="1" fill="none" opacity="0.35" />
        </g>
      );
    case 'cacheado': {
      const cachos: Ponto[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (1.02 + (i / 12) * 0.96);
        cachos.push({ x: c.x + Math.cos(a) * (RX + 3.2), y: c.y - 2 + Math.sin(a) * (RY + 3.4) });
      }
      cachos.push({ x: c.x - RX - 2.4, y: c.y + 4 }, { x: c.x + RX + 2.4, y: c.y + 4 });
      return (
        <g fill={cor}>
          <path d={calota(3, 7, 8.4, 3)} />
          {cachos.map((p, i) => (
            <circle key={i} cx={arred(p.x)} cy={arred(p.y)} r={i % 2 ? 4 : 4.6} />
          ))}
          {cachos.slice(2, 11).map((p, i) => (
            <circle key={`b${i}`} cx={arred(p.x + 0.8)} cy={arred(p.y - 0.8)} r="1.3" fill={brilho} opacity="0.35" />
          ))}
        </g>
      );
    }
    case 'longo':
      return (
        <g fill={cor}>
          <path d={calota(1.6, 5, 9.5, 2)} />
          {/* mechas dos lados do rosto (a do lado para onde olha some atrás do rosto) */}
          {[-1, 1]
            .filter((s) => !(Math.abs(gc) > 0.3 && Math.sign(gc) === s))
            .map((s) => {
              const x = c.x + s * (RX + 1.6) + gc * 3;
              return <path key={s} d={`M ${arred(x)} ${arred(c.y - 1)} Q ${arred(x + s * 1)} ${arred(c.y + 14)} ${arred(x - s * 2.4)} ${arred(c.y + 22)} L ${arred(x - s * 4.4)} ${arred(c.y + 4)} Z`} />;
            })}
          <path d={`M ${arred(c.x - 8 + fx * 0.5)} ${arred(c.y - 12.5)} Q ${arred(c.x + fx * 0.5)} ${arred(c.y - 16.5)} ${arred(c.x + 7 + fx * 0.5)} ${arred(c.y - 13.5)}`} stroke={brilho} strokeWidth="1" fill="none" opacity="0.45" />
        </g>
      );
    case 'preso':
      return (
        <g fill={cor}>
          <path d={calota(0.9, 4.4, 11.5, 0)} />
          <path d={`M ${arred(c.x - 6 + fx * 0.5)} ${arred(c.y - 12.5)} Q ${arred(c.x + fx * 0.5)} ${arred(c.y - 15.5)} ${arred(c.x + 6 + fx * 0.5)} ${arred(c.y - 12.8)}`} stroke={brilho} strokeWidth="0.9" fill="none" opacity="0.45" />
        </g>
      );
    default:
      return null;
  }
}

/** Gradientes do avatar (volume da pele nos 3 tons e dobra da roupa). */
export function DefsAvatar({ id }: { id: (n: string) => string }) {
  return (
    <defs>
      {(Object.keys(PALETAS) as (keyof typeof PALETAS)[]).map((t) => (
        <radialGradient key={t} id={id(`volume-${t}`)} cx="40%" cy="36%" r="72%">
          <stop offset="0" stopColor={PALETAS[t].luz} />
          <stop offset="0.6" stopColor={PALETAS[t].base} />
          <stop offset="1" stopColor={PALETAS[t].sombra} />
        </radialGradient>
      ))}
      <linearGradient id={id('dobra-roupa')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.2" />
        <stop offset="0.3" stopColor="#000" stopOpacity="0" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0.12" />
        <stop offset="0.8" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.24" />
      </linearGradient>
      <linearGradient id={id('volume-braco')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.14" />
      </linearGradient>
    </defs>
  );
}
