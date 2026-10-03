/**
 * Paciente da RCP visto de lado, deitado de barriga para cima, cabeça à esquerda (o lado direito
 * do paciente fica virado para quem olha). O contorno do peito é recalculado a cada quadro:
 * a compressão afunda o esterno de verdade e a ventilação sobe o tórax.
 * Sem circulação: pele pálida/cianótica e lábios roxos; com retorno da circulação: corado.
 */

import type { TomDePele } from '../../neonatal/exame';
import { lerp, type Ponto } from '../formas';
import { misturar, type PaletaPele, paletaComTinta, PALETAS } from '../pele';
import { arred, curva } from './caminhos';
import { type CorpoPaciente, PX_CM, ROSTOS } from './geometria';

export interface PropsPacienteRcp {
  corpo: CorpoPaciente;
  pele: TomDePele;
  rce: boolean;
  viaAerea: 'mascara' | 'tubo';
  acesso?: 'periferico' | 'intraosseo';
  /** Pás adesivas do desfibrilador no tórax. */
  pas: boolean;
  /** Eletrodos do monitor (padrão: sim). */
  eletrodos?: boolean;
  id: (nome: string) => string;
}

/** Paleta do paciente: corado com circulação; pálido e cianótico sem. */
export function paletaDoPaciente(tom: TomDePele, rce: boolean): PaletaPele {
  if (rce) return PALETAS[tom];
  const c = paletaComTinta(tom, 'cianose');
  const cinza = tom === 'claro' ? 0.12 : tom === 'moreno' ? 0.1 : 0.06;
  return { ...c, base: misturar(c.base, '#cfd2dc', cinza), luz: misturar(c.luz, '#e4e6ee', cinza), rubor: misturar(c.rubor, c.base, 0.7) };
}

/** Pontos da cabeça (contorno) no mundo. */
function contornoCabeca(corpo: CorpoPaciente): Ponto[] {
  const { P } = corpo;
  const R = ROSTOS[P.rosto];
  return R.contorno.map(([u, v], i) => corpo.em(u * P.cabeca, (v + (R.ajusteNariz.find((a) => a[0] === i)?.[1] ?? 0) * P.nariz) * P.profCabeca));
}

type Perfil = readonly (readonly [number, number])[];

/** Pontos de um lado de um segmento (a → b), afastados da linha do osso pelo perfil (s, meia-grossura em px). */
function lado(a: Ponto, b: Ponto, perfil: Perfil, sinal: 1 | -1, de = 0, ate = 1): Ponto[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // normal "para cima" na tela (y para baixo)
  const nx = dy / len;
  const ny = -dx / len;
  return perfil
    .filter(([t]) => t >= de && t <= ate)
    .map(([t, w]) => ({ x: a.x + dx * t + nx * w * sinal, y: a.y + dy * t + ny * w * sinal }));
}

/** Silhueta da perna (coxa, perna, pé) — pontos de cima do quadril aos dedos e de baixo do calcanhar ao quadril. */
function silhuetaPerna(corpo: CorpoPaciente): { cima: Ponto[]; baixo: Ponto[]; pe: Ponto[] } {
  const { P, perna } = corpo;
  const k = PX_CM;
  const C = P.coxa * k;
  const Pp = P.perna * k;
  const pe = P.pe * k;
  const coxaCima: Perfil = [[0.15, C * 0.44], [0.4, C * 0.47], [0.75, C * 0.4], [0.97, Pp * 0.56]];
  const coxaBaixo: Perfil = [[0, C * 0.5], [0.45, C * 0.49], [0.8, C * 0.42], [1, Pp * 0.46]];
  const canelaCima: Perfil = [[0.06, Pp * 0.55], [0.16, Pp * 0.47], [0.5, Pp * 0.42], [0.85, Pp * 0.33]];
  const canelaBaixo: Perfil = [[0.08, Pp * 0.52], [0.3, Pp * 0.62], [0.62, Pp * 0.48], [0.92, Pp * 0.36]];
  const cima = [...lado(perna.quadril, perna.joelho, coxaCima, 1), ...lado(perna.joelho, perna.tornozelo, canelaCima, 1)];
  const baixo = [...lado(perna.joelho, perna.tornozelo, canelaBaixo, -1).reverse(), ...lado(perna.quadril, perna.joelho, coxaBaixo, -1).reverse()];
  // pé de lado: dorso virado para a cabeça, planta para o fim da maca
  const t = perna.tornozelo;
  const fx = (perna.ponta.x - t.x) / (P.pe * 0.82 * k);
  const fy = (perna.ponta.y - t.y) / (P.pe * 0.82 * k);
  const dorso = { x: fy, y: -fx };
  const q = (u: number, v: number) => ({ x: t.x + fx * u * pe + dorso.x * v * pe, y: t.y + fy * u * pe + dorso.y * v * pe });
  const pePts = [q(0.08, 0.15), q(0.42, 0.12), q(0.74, 0.075), q(0.86, 0.02), q(0.82, -0.06), q(0.55, -0.1), q(0.2, -0.14), q(-0.04, -0.13), q(-0.1, -0.04)];
  return { cima, baixo, pe: pePts };
}

/** Silhueta do braço do lado de cá (ombro ao ponta dos dedos, mão espalmada no colchão). */
function silhuetaBraco(corpo: CorpoPaciente): Ponto[] {
  const { braco, P } = corpo;
  const g = P.grossuraBraco * PX_CM;
  const cima = [
    ...lado(braco.ombro, braco.cotovelo, [[0, g * 0.6], [0.3, g * 0.54], [0.75, g * 0.44], [1, g * 0.42]], 1),
    ...lado(braco.cotovelo, braco.punho, [[0.15, g * 0.46], [0.4, g * 0.45], [0.85, g * 0.33]], 1),
    ...lado(braco.punho, braco.ponta, [[0.05, g * 0.3], [0.35, g * 0.33], [0.75, g * 0.24], [1, g * 0.08]], 1),
  ];
  const baixo = [
    ...lado(braco.punho, braco.ponta, [[0.1, g * 0.27], [0.6, g * 0.2], [0.95, g * 0.08]], -1).reverse(),
    ...lado(braco.cotovelo, braco.punho, [[0.1, g * 0.4], [0.35, g * 0.42], [0.9, g * 0.29]], -1).reverse(),
    ...lado(braco.ombro, braco.cotovelo, [[0.15, g * 0.5], [0.8, g * 0.42]], -1).reverse(),
  ];
  const d = { x: braco.cotovelo.x - braco.ombro.x, y: braco.cotovelo.y - braco.ombro.y };
  const l = Math.hypot(d.x, d.y) || 1;
  const capa = { x: braco.ombro.x - (d.x / l) * g * 0.55, y: braco.ombro.y - (d.y / l) * g * 0.55 - g * 0.15 };
  return [capa, ...cima, ...baixo];
}

export function PacienteRcp({ corpo, pele, rce, viaAerea, acesso, pas, eletrodos = true, id }: PropsPacienteRcp) {
  const { P, em } = corpo;
  const k = PX_CM;
  const pal = paletaDoPaciente(pele, rce);
  const R = ROSTOS[P.rosto];
  const bebe = P.rosto === 'bebe';
  const rosto = (f: readonly [number, number]) => em(f[0] * P.cabeca, f[1] * P.profCabeca);
  const topoY = em(0, Math.max(P.profCabeca, P.apTorax) * 1.05).y;
  const baseY = em(0, 0).y;

  // ---- corpo inteiro numa silhueta só: frente do tronco → perna → pé → panturrilha → costas ----
  const xIni = P.cabeca * 0.97;
  const frente: Ponto[] = [];
  const N = 30;
  for (let i = 0; i <= N; i++) {
    const x = lerp(xIni, P.pube, i / N);
    frente.push(em(x, corpo.alturaTronco(x)));
  }
  const pernaS = silhuetaPerna(corpo);
  const costas: Ponto[] = [
    em(P.pube - P.coxa * 0.45, P.coxa * 0.06),
    em(P.umbigo, 0),
    em((P.ombro + P.mamilos) / 2, 0),
    em(P.ombro - 0.2, P.apTorax * 0.08),
    em(P.cabeca * 0.8, P.profCabeca * 0.12),
  ];
  const silhueta = `${curva([...frente, ...pernaS.cima, ...pernaS.pe, ...pernaS.baixo, ...costas])} Z`;
  const pernaSo = `${curva([...pernaS.cima, ...pernaS.pe, ...pernaS.baixo], true)}`;
  const longe = `translate(${arred(Math.max(0.8, P.perna * 0.12) * k)} ${arred(-Math.max(0.8, P.perna * 0.14) * k)})`;
  const braco = curva(silhuetaBraco(corpo), true);

  // ---- cabeça ----
  const cab = contornoCabeca(corpo);
  const cabeca = curva(cab, true);
  const centroCab = em(P.cabeca * 0.5, P.profCabeca * 0.45);
  const fora = (p: Ponto, f: number) => ({ x: centroCab.x + (p.x - centroCab.x) * f, y: centroCab.y + (p.y - centroCab.y) * f });
  // cabelo: da nuca, por trás da cabeça, até a testa; volta pela linha do cabelo
  const nCont = cab.length;
  const cabeloFora = [cab[nCont - 1]!, cab[0]!, cab[1]!, cab[2]!, cab[3]!, cab[4]!, cab[5]!].map((p) => fora(p, bebe ? 1.015 : 1.05));
  const cabeloDentro = R.linhaCabelo.map(rosto);
  const cabelo = `${curva(cabeloFora)} ${curva(cabeloDentro, false, true)} Z`;

  const olho = rosto(R.olho);
  const sobr = rosto(R.sobrancelha);
  const orelha = rosto(R.orelha);
  const narina = rosto(R.narina);
  const boch = rosto(R.bochecha);
  const tamCab = P.cabeca * k;
  // lábios: traço grosso no contorno, do lábio de cima ao de baixo
  const labios = curva(cab.slice(R.iLabios[0], R.iLabios[1] + 1).map((p) => ({ x: p.x, y: p.y + tamCab * 0.012 })));
  // contorno visível da cabeça: da nuca, por trás, até o queixo (sem marcar o pescoço)
  const contornoCab = curva([cab[nCont - 1]!, ...cab.slice(0, R.iQueixo + 1)]);
  // olho fechado de perfil (deitado: a fenda fica "em pé") e sobrancelha
  const u = (f: number) => f * P.cabeca * k;
  const v = (f: number) => f * P.profCabeca * k;

  // ---- detalhes do tronco ----
  const naFrente = (x: number, abaixo = 0) => em(x, corpo.alturaTronco(x) - abaixo);
  const mamilo = naFrente(P.mamilos, P.apTorax * 0.06);
  const umbigo = naFrente(P.umbigo, 0);
  // costelas e clavícula (bem leves) no flanco
  const costelas = [0.3, 0.52, 0.74].map((t) => {
    const x = lerp(P.ombro + 2, P.xifoide + 1, t);
    const a = naFrente(x - 1, P.apTorax * 0.18);
    const b = naFrente(x + 1.8, P.apTorax * 0.42);
    return `M ${arred(a.x)} ${arred(a.y)} Q ${arred(a.x + 2.4)} ${arred((a.y + b.y) / 2)} ${arred(b.x)} ${arred(b.y)}`;
  });
  const clav0 = naFrente(P.ombro - 0.2, P.apTorax * 0.08);
  const clav1 = naFrente(P.ombro + (P.mamilos - P.ombro) * 0.35, P.apTorax * 0.2);

  // roupa: bermuda (criança/adolescente) ou fralda (bebês)
  const xRoupa0 = P.umbigo + (P.pube - P.umbigo) * (bebe ? 0.32 : 0.3);
  const xRoupa1 = bebe ? P.pube + (P.joelho - P.pube) * 0.16 : P.pube + (P.joelho - P.pube) * 0.4;
  const roupa0 = em(xRoupa0, 0).x;
  const roupa1 = em(xRoupa1, 0).x;
  const corRoupa = bebe ? '#f3f6fb' : P.comprimento > 140 ? '#2e4a72' : '#2f7f86';

  // eletrodos: um abaixo da clavícula direita (lado de cá) e um no abdome
  const eletrodosPts = [naFrente(P.ombro + (P.mamilos - P.ombro) * 0.35, P.apTorax * 0.3), naFrente(P.xifoide + (P.umbigo - P.xifoide) * 0.55, P.apAbdome * 0.3)];
  const rEle = Math.max(1.5, P.apTorax * 0.07 * k);

  const tubo = viaAerea === 'tubo';
  const gb = P.grossuraBraco * k;
  const escalaAcesso = Math.max(1, gb / 6);
  const hubPeriferico = { x: corpo.periferico.x + 2.2, y: corpo.periferico.y - 0.4 };
  const contorno = { stroke: pal.contorno, strokeOpacity: 0.5, strokeWidth: 0.7 };

  return (
    <g className="rcp-paciente">
      <defs>
        <linearGradient id={id('pac-pele')} gradientUnits="userSpaceOnUse" x1="0" y1={arred(topoY)} x2="0" y2={arred(baseY)}>
          <stop offset="0" stopColor={pal.luz} />
          <stop offset="0.5" stopColor={pal.base} />
          <stop offset="1" stopColor={pal.sombra} />
        </linearGradient>
        <linearGradient id={id('pac-longe')} gradientUnits="userSpaceOnUse" x1="0" y1={arred(topoY)} x2="0" y2={arred(baseY)}>
          <stop offset="0" stopColor={misturar(pal.base, pal.sombra, 0.45)} />
          <stop offset="1" stopColor={pal.sombra} />
        </linearGradient>
        <radialGradient id={id('pac-rubor')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={pal.rubor} stopOpacity={rce ? 0.6 : 0.2} />
          <stop offset="1" stopColor={pal.rubor} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('pac-sombra')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#2b2140" stopOpacity="0.3" />
          <stop offset="1" stopColor="#2b2140" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('pac-roupa')}>
          <rect x={arred(roupa0)} y={arred(topoY - 60)} width={arred(roupa1 - roupa0)} height="200" />
        </clipPath>
      </defs>

      {/* sombra no colchão */}
      <ellipse cx={arred(em(P.comprimento * 0.47, 0).x)} cy={arred(baseY + 0.5)} rx={arred(P.comprimento * k * 0.55)} ry={arred(Math.max(2.5, P.apTorax * k * 0.22))} fill={`url(#${id('pac-sombra')})`} />

      {/* perna do outro lado (um pouco atrás e mais escura) */}
      <path d={pernaSo} transform={longe} fill={`url(#${id('pac-longe')})`} {...contorno} />

      {/* corpo */}
      <path d={silhueta} fill={`url(#${id('pac-pele')})`} {...contorno} />
      {/* luz ao longo da frente do corpo */}
      <path d={curva(frente.slice(3, 26).map((p) => ({ x: p.x, y: p.y + 1.1 })))} fill="none" stroke={pal.luz} strokeWidth={arred(Math.max(0.9, P.apTorax * k * 0.06))} strokeLinecap="round" opacity="0.6" />
      <path d={curva(pernaS.cima.slice(1, -1).map((p) => ({ x: p.x, y: p.y + 1 })))} fill="none" stroke={pal.luz} strokeWidth={arred(Math.max(0.8, P.perna * k * 0.08))} strokeLinecap="round" opacity="0.5" />
      <g fill="none" stroke={pal.sombra} strokeOpacity="0.35" strokeWidth="0.6" strokeLinecap="round">
        {!bebe && costelas.map((d, i) => <path key={i} d={d} />)}
        <path d={`M ${arred(clav0.x)} ${arred(clav0.y)} Q ${arred((clav0.x + clav1.x) / 2)} ${arred(clav0.y - 0.6)} ${arred(clav1.x)} ${arred(clav1.y)}`} />
        {/* joelho */}
        <path d={`M ${arred(corpo.perna.joelho.x - P.perna * k * 0.15)} ${arred(corpo.perna.joelho.y - P.perna * k * 0.25)} q ${arred(P.perna * k * 0.2)} ${arred(-P.perna * k * 0.12)} ${arred(P.perna * k * 0.35)} 0`} />
      </g>
      <ellipse cx={arred(mamilo.x)} cy={arred(mamilo.y)} rx={arred(Math.max(0.8, P.apTorax * 0.045 * k))} ry={arred(Math.max(0.55, P.apTorax * 0.028 * k))} fill={misturar(pal.sombra, pal.labio, 0.5)} opacity="0.7" />

      {/* bermuda ou fralda */}
      <g clipPath={`url(#${id('pac-roupa')})`}>
        <path d={silhueta} fill={corRoupa} {...contorno} />
        <path d={pernaSo} transform={longe} fill={misturar(corRoupa, '#000', 0.15)} />
        <path d={silhueta} fill={`url(#${id('pac-sombra')})`} opacity="0.4" />
      </g>
      {bebe ? (
        <rect x={arred(roupa0 + 1.2)} y={arred(naFrente(xRoupa0 + 1).y + 1.6)} width={arred(Math.max(2.4, P.apAbdome * k * 0.3))} height={arred(Math.max(1.8, P.apAbdome * k * 0.2))} rx="0.6" fill="#9fc3ee" />
      ) : (
        <path d={`M ${arred(roupa0)} ${arred(naFrente(xRoupa0).y + 0.6)} Q ${arred(roupa0 - 1)} ${arred((naFrente(xRoupa0).y + baseY) / 2)} ${arred(roupa0)} ${arred(baseY - 0.5)}`} stroke="#00000044" strokeWidth="1" fill="none" />
      )}

      {/* umbigo (no RN, coto umbilical com clampe) */}
      {P.comprimento <= 55 ? (
        <g>
          <path d={`M ${arred(umbigo.x)} ${arred(umbigo.y + 0.8)} q 0.4 -2.8 2.4 -3.8`} stroke="#d8cfa6" strokeWidth="1.9" strokeLinecap="round" fill="none" />
          <rect x={arred(umbigo.x + 1.1)} y={arred(umbigo.y - 4.6)} width="3.4" height="1.4" rx="0.5" fill="#3d7fd6" transform={`rotate(-30 ${arred(umbigo.x + 2.8)} ${arred(umbigo.y - 3.9)})`} />
        </g>
      ) : (
        <path d={`M ${arred(umbigo.x - 0.9)} ${arred(umbigo.y + 0.7)} q 0.9 1 1.8 0`} stroke={pal.sombra} strokeWidth="0.8" fill="none" />
      )}

      {/* eletrodos do monitor (o fio desce pelo lado e segue pelo colchão) */}
      {eletrodos &&
        eletrodosPts.map((p, i) => (
          <g key={i}>
            <path d={`M ${arred(p.x)} ${arred(p.y)} C ${arred(p.x + 1)} ${arred(p.y + 5)}, ${arred(p.x + 4)} ${arred(baseY - 1)}, ${arred(p.x + 10)} ${arred(baseY - 0.6)}`} stroke="#7d879a" strokeWidth="0.7" fill="none" />
            <ellipse cx={arred(p.x)} cy={arred(p.y)} rx={arred(rEle)} ry={arred(rEle * 0.8)} fill="#f8fafc" stroke="#b6bfcc" strokeWidth="0.5" />
            <circle cx={arred(p.x)} cy={arred(p.y)} r={arred(rEle * 0.35)} fill="#9aa3b2" />
          </g>
        ))}

      {/* pás adesivas do desfibrilador */}
      {pas && <Pas corpo={corpo} />}

      {/* cabeça */}
      <path d={cabeca} fill={`url(#${id('pac-pele')})`} />
      <path d={contornoCab} fill="none" {...contorno} />
      <path d={cabelo} fill={pal.cabelo} opacity={bebe ? 0.32 : 0.96} />
      {!bebe && <path d={curva(cabeloFora.slice(2, 6).map((p) => fora(p, 0.975)))} stroke={misturar(pal.cabelo, '#ffffff', 0.25)} strokeWidth="0.9" fill="none" opacity="0.5" />}
      <ellipse cx={arred(boch.x)} cy={arred(boch.y)} rx={arred(tamCab * 0.15)} ry={arred(tamCab * 0.1)} fill={`url(#${id('pac-rubor')})`} />
      {/* orelha */}
      <ellipse cx={arred(orelha.x)} cy={arred(orelha.y)} rx={arred(u(0.1))} ry={arred(v(0.075))} fill={misturar(pal.base, pal.sombra, 0.15)} stroke={pal.contorno} strokeOpacity="0.4" strokeWidth="0.5" />
      <path d={`M ${arred(orelha.x - u(0.06))} ${arred(orelha.y + v(0.02))} Q ${arred(orelha.x)} ${arred(orelha.y - v(0.07))} ${arred(orelha.x + u(0.07))} ${arred(orelha.y)}`} stroke={pal.sombra} strokeOpacity="0.7" strokeWidth="0.5" fill="none" />
      <ellipse cx={arred(orelha.x + u(0.01))} cy={arred(orelha.y + v(0.015))} rx={arred(u(0.03))} ry={arred(v(0.025))} fill={pal.sombra} opacity="0.5" />
      <path d={`M ${arred(olho.x)} ${arred(olho.y - v(0.05))} Q ${arred(olho.x + u(0.02))} ${arred(olho.y)} ${arred(olho.x + u(0.005))} ${arred(olho.y + v(0.05))}`} stroke={misturar(pal.contorno, '#1d1b24', 0.45)} strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <g stroke={misturar(pal.contorno, '#1d1b24', 0.45)} strokeWidth="0.4" strokeLinecap="round">
        {[-0.03, 0, 0.03].map((d) => (
          <line key={d} x1={arred(olho.x + u(0.017))} y1={arred(olho.y + v(d))} x2={arred(olho.x + u(0.045))} y2={arred(olho.y + v(d * 1.3) + 0.3)} />
        ))}
      </g>
      <path d={`M ${arred(sobr.x + u(0.01))} ${arred(sobr.y - v(0.06))} Q ${arred(sobr.x - u(0.02))} ${arred(sobr.y)} ${arred(sobr.x)} ${arred(sobr.y + v(0.06))}`} stroke={pal.cabelo} strokeWidth={bebe ? 0.45 : 0.9} fill="none" strokeLinecap="round" opacity={bebe ? 0.4 : 0.85} />
      <ellipse cx={arred(narina.x)} cy={arred(narina.y)} rx={arred(u(0.02))} ry={arred(v(0.014))} fill={pal.sombra} />
      {!tubo && <path d={labios} stroke={pal.labio} strokeWidth={arred(Math.max(0.8, tamCab * 0.042))} strokeLinecap="round" strokeLinejoin="round" fill="none" />}

      {/* tubo traqueal na boca, com fixação */}
      {tubo && <TuboNaBoca corpo={corpo} labio={pal.labio} />}

      {/* braço do lado de cá */}
      <path d={braco} fill={`url(#${id('pac-pele')})`} {...contorno} />
      <path d={`M ${arred(corpo.braco.ponta.x - gb * 0.9)} ${arred(corpo.braco.ponta.y - gb * 0.12)} l ${arred(gb * 0.7)} ${arred(gb * 0.02)} M ${arred(corpo.braco.ponta.x - gb * 0.95)} ${arred(corpo.braco.ponta.y + gb * 0.06)} l ${arred(gb * 0.75)} 0`} stroke={pal.sombra} strokeOpacity="0.45" strokeWidth="0.45" />

      {/* acessos */}
      {acesso === 'periferico' && <CateterPeriferico em={corpo.periferico} hub={hubPeriferico} escala={escalaAcesso} />}
      {acesso === 'intraosseo' && <AgulhaIO em={corpo.tibia} escala={Math.max(1, (P.perna * k) / 9)} />}
    </g>
  );
}

/** Onde a seringa encaixa (canhão do cateter ou da agulha IO). */
export function pontoDeInjecao(corpo: CorpoPaciente, acesso: 'periferico' | 'intraosseo' | undefined): Ponto {
  if (acesso === 'intraosseo') return { x: corpo.tibia.x, y: corpo.tibia.y - Math.max(1, (corpo.P.perna * PX_CM) / 9) * 6.4 };
  return { x: corpo.periferico.x + 2.2 + 3.8 * Math.max(1, (corpo.P.grossuraBraco * PX_CM) / 6), y: corpo.periferico.y - 0.4 };
}

function TuboNaBoca({ corpo, labio }: { corpo: CorpoPaciente; labio: string }) {
  const b = corpo.boca;
  const t = corpo.tuboTopo;
  const w = Math.max(1.8, corpo.P.profCabeca * PX_CM * 0.09);
  return (
    <g>
      <path d={`M ${arred(b.x - 0.8)} ${arred(b.y + 1)} Q ${arred(b.x - 1.6)} ${arred((b.y + t.y) / 2)} ${arred(t.x)} ${arred(t.y + w)}`} stroke="#dfeef5" strokeWidth={arred(w)} fill="none" strokeLinecap="round" />
      <path d={`M ${arred(b.x - 0.8)} ${arred(b.y + 1)} Q ${arred(b.x - 1.6)} ${arred((b.y + t.y) / 2)} ${arred(t.x)} ${arred(t.y + w)}`} stroke="#9fb7c4" strokeWidth="0.5" fill="none" />
      {/* marca de profundidade e fixação */}
      <path d={`M ${arred(b.x - 3)} ${arred(b.y - 0.5)} l ${arred(6)} 0`} stroke={labio} strokeWidth="1.2" strokeLinecap="round" />
      <rect x={arred(b.x - w * 1.6)} y={arred(b.y - w * 1.4)} width={arred(w * 3.2)} height={arred(w * 0.9)} rx="0.6" fill="#f1e6cf" stroke="#cdbf9f" strokeWidth="0.4" />
      <rect x={arred(t.x - w * 0.75)} y={arred(t.y - w * 0.6)} width={arred(w * 1.5)} height={arred(w * 1.8)} rx="0.6" fill="#ffffff" stroke="#8aa1b1" strokeWidth="0.5" />
      <rect x={arred(t.x - w * 0.6)} y={arred(t.y - w * 1.3)} width={arred(w * 1.2)} height={arred(w * 0.8)} rx="0.4" fill="#5b8fc9" />
    </g>
  );
}

function Pas({ corpo }: { corpo: CorpoPaciente }) {
  const { P, em } = corpo;
  const k = PX_CM;
  const faixa = (x0: number, x1: number) => {
    const pts: Ponto[] = [];
    for (let i = 0; i <= 6; i++) {
      const x = lerp(x0, x1, i / 6);
      pts.push(em(x, corpo.alturaTronco(x) + 0.25));
    }
    return curva(pts);
  };
  const pa = (d: string, cabo: Ponto) => (
    <g>
      <path d={`M ${arred(cabo.x)} ${arred(cabo.y)} C ${arred(cabo.x - 2)} ${arred(cabo.y - 6)}, ${arred(cabo.x + 6)} ${arred(cabo.y - 8)}, ${arred(cabo.x + 10)} ${arred(cabo.y - 4)}`} stroke="#3a3f4a" strokeWidth="0.9" fill="none" />
      <path d={d} stroke="#ffffff" strokeWidth={arred(Math.max(1.8, P.apTorax * k * 0.11))} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#e5484d" strokeWidth="0.5" fill="none" strokeDasharray="1.4 1.1" />
    </g>
  );
  const ponto = (x: number) => em(x, corpo.alturaTronco(x) + 0.3);
  if (P.rosto === 'bebe') {
    // anteroposterior: uma na frente do tórax (vista de lado, colada no contorno) e outra sob as costas
    const xa = P.ombro + 0.8;
    const xb = P.xifoide - 0.4;
    const tras = em((xa + xb) / 2, 0);
    const largura = (xb - xa) * k;
    return (
      <g>
        {pa(faixa(xa, xb), ponto((xa + xb) / 2))}
        <rect x={arred(tras.x - largura / 2)} y={arred(tras.y - 1.4)} width={arred(largura)} height="1.8" rx="0.6" fill="#ffffff" stroke="#c7ced8" strokeWidth="0.4" />
      </g>
    );
  }
  // anterolateral: abaixo da clavícula direita e no ápice (lado esquerdo, mais embaixo)
  const a0 = P.ombro + 0.8;
  const a1 = P.ombro + (P.mamilos - P.ombro) * 0.75;
  const b0 = P.xifoide - 1;
  const b1 = P.xifoide + (P.umbigo - P.xifoide) * 0.3;
  return (
    <g>
      {pa(faixa(a0, a1), ponto((a0 + a1) / 2))}
      {pa(faixa(b0, b1), ponto((b0 + b1) / 2))}
    </g>
  );
}

function CateterPeriferico({ em, hub, escala }: { em: Ponto; hub: Ponto; escala: number }) {
  const s = escala;
  return (
    <g>
      {/* curativo transparente */}
      <rect x={arred(em.x - 3.2 * s)} y={arred(em.y - 2.2 * s)} width={arred(6.4 * s)} height={arred(4.4 * s)} rx={arred(1 * s)} fill="#ffffff" opacity="0.45" stroke="#d6dde6" strokeWidth="0.4" />
      {/* cânula apontando para o cotovelo e canhão colorido */}
      <path d={`M ${arred(em.x - 2.4 * s)} ${arred(em.y + 0.3)} L ${arred(hub.x)} ${arred(hub.y)}`} stroke="#e9eef3" strokeWidth={arred(0.9 * s)} strokeLinecap="round" />
      <rect x={arred(hub.x - 0.2)} y={arred(hub.y - 1.1 * s)} width={arred(2.6 * s)} height={arred(2.2 * s)} rx="0.5" fill="#3f8ee0" stroke="#2a6bb0" strokeWidth="0.4" />
      <rect x={arred(hub.x + 2.4 * s)} y={arred(hub.y - 0.7 * s)} width={arred(1.4 * s)} height={arred(1.4 * s)} rx="0.3" fill="#f4f6f8" stroke="#a5afbb" strokeWidth="0.3" />
    </g>
  );
}

function AgulhaIO({ em, escala }: { em: Ponto; escala: number }) {
  const s = escala;
  return (
    <g>
      {/* estabilizador na pele, haste e canhão */}
      <rect x={arred(em.x - 2.6 * s)} y={arred(em.y - 0.9 * s)} width={arred(5.2 * s)} height={arred(1.2 * s)} rx="0.5" fill="#f2c94c" stroke="#b08c1e" strokeWidth="0.3" />
      <path d={`M ${arred(em.x)} ${arred(em.y - 0.6 * s)} L ${arred(em.x)} ${arred(em.y - 4 * s)}`} stroke="#9aa3ad" strokeWidth={arred(0.9 * s)} />
      <rect x={arred(em.x - 1.2 * s)} y={arred(em.y - 6.4 * s)} width={arred(2.4 * s)} height={arred(2.6 * s)} rx="0.5" fill="#d9467a" stroke="#9e2a55" strokeWidth="0.3" />
    </g>
  );
}
