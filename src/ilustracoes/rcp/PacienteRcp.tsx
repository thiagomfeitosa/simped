/**
 * Paciente da RCP visto de lado e um pouco de cima (3/4), deitado de barriga para cima, cabeça à
 * esquerda (o lado direito do paciente fica virado para quem olha). É o protagonista da cena:
 * desenhado maior que o real, com contorno marcado e roupa clara para não sumir entre a equipe.
 * O contorno do peito é recalculado a cada quadro: a compressão afunda o esterno de verdade
 * (com a sombra da mão afundando) e a ventilação sobe o tórax.
 * Sem circulação: pele pálida/arroxeada e lábios roxos; com retorno da circulação: corado.
 */

import type { TomDePele } from '../../neonatal/exame';
import { capsula, lerp, type Ponto } from '../formas';
import { misturar, type PaletaPele, paletaComTinta, PALETAS } from '../pele';
import { arred, curva } from './caminhos';
import { type CorpoPaciente, PROFUNDIDADE, ROSTOS } from './geometria';

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
  /** Marcas de movimento dos lados das mãos quando alguém comprime (padrão: sim). */
  marcas?: boolean;
  id: (nome: string) => string;
}

/** Paleta do paciente: corado com circulação; pálido e arroxeado sem (sem ficar cinza). */
export function paletaDoPaciente(tom: TomDePele, rce: boolean): PaletaPele {
  if (rce) return PALETAS[tom];
  const c = paletaComTinta(tom, 'cianose');
  const p = PALETAS[tom];
  // menos tinta que a cianose do exame: o paciente continua com cara de pele (pálida), não de estátua
  const pouco = tom === 'claro' ? 0.45 : tom === 'moreno' ? 0.4 : 0.35;
  return {
    ...c,
    base: misturar(p.base, c.base, pouco + 0.1),
    luz: misturar(p.luz, c.luz, pouco),
    sombra: misturar(p.sombra, c.sombra, pouco + 0.15),
    rubor: misturar(c.rubor, c.base, 0.6),
  };
}

/** Pontos da cabeça (contorno) no mundo. */
function contornoCabeca(corpo: CorpoPaciente): Ponto[] {
  const { P } = corpo;
  const R = ROSTOS[P.rosto];
  return R.contorno.map(([u, v], i) => corpo.naCabeca(u, v + (R.ajusteNariz.find((a) => a[0] === i)?.[1] ?? 0) * P.nariz));
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
  const { P, perna, k } = corpo;
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

/** Silhueta de um braço deitado (ombro ao ponta dos dedos, mão espalmada no colchão). */
function silhuetaBraco(braco: CorpoPaciente['braco'], g: number): Ponto[] {
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

/** Braço em partes (cápsulas): o contorno de todas por baixo e o recheio por cima, sem emenda no cotovelo. */
function partesBraco(b: CorpoPaciente['braco'], g: number, dobrado: boolean): string[] {
  if (!dobrado) return [curva(silhuetaBraco(b, g), true)];
  return [capsula(b.ombro, b.cotovelo, g * 1.08, g * 0.9), capsula(b.cotovelo, b.punho, g * 0.92, g * 0.74), capsula(b.punho, b.ponta, g * 0.86, g * 0.66)];
}

function Braco({ partes, fill, traco, cor, halo = false }: { partes: string[]; fill: string; traco: number; cor: string; halo?: boolean }) {
  return (
    <g>
      {partes.map((d, i) => (
        <path key={`c${i}`} d={d} fill="none" stroke={halo ? '#ffffff' : cor} strokeOpacity={halo ? 0.9 : 0.85} strokeWidth={arred(traco * (halo ? 4 : 2))} strokeLinejoin="round" />
      ))}
      {!halo && partes.map((d, i) => <path key={`r${i}`} d={d} fill={fill} />)}
    </g>
  );
}

export function PacienteRcp({ corpo, pele, rce, viaAerea, acesso, pas, eletrodos = true, marcas = true, id }: PropsPacienteRcp) {
  const { P, em, k } = corpo;
  const pal = paletaDoPaciente(pele, rce);
  const R = ROSTOS[P.rosto];
  const bebe = P.rosto === 'bebe';
  const rosto = (f: readonly [number, number]) => corpo.naCabeca(f[0], f[1]);
  const topoY = em(0, Math.max(P.profCabeca, P.apTorax) * 1.05).y;
  const baseY = em(P.umbigo, corpo.baseTronco(P.umbigo)).y;

  // ---- corpo inteiro numa silhueta só: frente do tronco → perna → pé → panturrilha → costas ----
  const xIni = P.cabeca * 0.97;
  const frente: Ponto[] = [];
  const N = 32;
  for (let i = 0; i <= N; i++) {
    const x = lerp(xIni, P.pube, i / N);
    frente.push(em(x, corpo.alturaTronco(x)));
  }
  const pernaS = silhuetaPerna(corpo);
  const zPerna = -corpo.sobePernaLonge / 2 / (PROFUNDIDADE * k);
  const costas: Ponto[] = [
    em(P.pube - P.coxa * 0.45, P.coxa * 0.04, zPerna),
    em(P.umbigo, corpo.baseTronco(P.umbigo)),
    em(P.xifoide, corpo.baseTronco(P.xifoide)),
    em((P.ombro + P.mamilos) / 2, corpo.baseTronco((P.ombro + P.mamilos) / 2)),
    em(P.ombro - 0.2, corpo.baseTronco(P.ombro) * 0.85),
    corpo.naCabeca(0.86, 0.12),
  ];
  const silhueta = `${curva([...frente, ...pernaS.cima, ...pernaS.pe, ...pernaS.baixo, ...costas])} Z`;
  const pernaSo = `${curva([...pernaS.cima, ...pernaS.pe, ...pernaS.baixo], true)}`;
  const longe = `translate(${arred(P.perna * k * 0.06)} ${arred(-corpo.sobePernaLonge)})`;
  const gb = P.grossuraBraco * k;
  const braco = partesBraco(corpo.braco, gb, bebe);
  const bracoLonge = partesBraco(corpo.bracoLonge, gb * 0.95, bebe);

  // ---- cabeça ----
  const cab = contornoCabeca(corpo);
  const cabeca = curva(cab, true);
  const centroCab = corpo.naCabeca(0.5, 0.45);
  const fora = (p: Ponto, f: number) => ({ x: centroCab.x + (p.x - centroCab.x) * f, y: centroCab.y + (p.y - centroCab.y) * f });
  // cabelo: da nuca, por trás da cabeça, até a testa; volta pela linha do cabelo
  const nCont = cab.length;
  const cabeloFora = [cab[nCont - 1]!, cab[0]!, cab[1]!, cab[2]!, cab[3]!, cab[4]!, cab[5]!].map((p) => fora(p, bebe ? 1.012 : 1.05));
  const cabeloDentro = R.linhaCabelo.map(rosto);
  const cabelo = `${curva(cabeloFora)} ${curva(cabeloDentro, false, true)} Z`;

  const olho = rosto(R.olho);
  const sobr = rosto(R.sobrancelha);
  const orelha = rosto(R.orelha);
  const narina = rosto(R.narina);
  const boch = rosto(R.bochecha);
  const tamCab = P.cabeca * k;
  // lábios: traço grosso no contorno, do lábio de cima ao de baixo
  const labios = curva(cab.slice(R.iLabios[0], R.iLabios[1] + 1).map((p) => ({ x: p.x, y: p.y + tamCab * 0.014 })));
  // contorno visível da cabeça: da nuca, por trás, até o queixo (sem marcar o pescoço)
  const contornoCab = curva([cab[nCont - 1]!, ...cab.slice(0, R.iQueixo + 1)]);
  const u = (f: number) => f * P.cabeca * k;
  const v = (f: number) => f * P.profCabeca * k;
  const corTraco = misturar(pal.contorno, '#1d1b24', 0.5);

  // ---- detalhes do tronco ----
  const naFrente = (x: number, abaixo = 0) => em(x, corpo.alturaTronco(x) - abaixo);
  const mamilo = naFrente(P.mamilos, P.apTorax * 0.07);
  const umbigo = naFrente(P.umbigo, P.apAbdome * 0.04);
  // costelas e clavícula (bem leves) no flanco
  const costelas = [0.3, 0.52, 0.74].map((t) => {
    const x = lerp(P.ombro + 2, P.xifoide + 1, t);
    const a = naFrente(x - 1, P.apTorax * 0.2);
    const b = naFrente(x + 1.8, P.apTorax * 0.46);
    return `M ${arred(a.x)} ${arred(a.y)} Q ${arred(a.x + 0.3 * k)} ${arred((a.y + b.y) / 2)} ${arred(b.x)} ${arred(b.y)}`;
  });
  const clav0 = naFrente(P.ombro - 0.2, P.apTorax * 0.1);
  const clav1 = naFrente(P.ombro + (P.mamilos - P.ombro) * 0.35, P.apTorax * 0.22);

  // roupa clara (destaca do lençol e da equipe): fralda nos bebês, bermuda nos maiores
  const xRoupa0 = P.umbigo + (P.pube - P.umbigo) * (bebe ? 0.3 : 0.28);
  const xRoupa1 = bebe ? P.pube + (P.joelho - P.pube) * 0.17 : P.pube + (P.joelho - P.pube) * 0.4;
  const roupa0 = em(xRoupa0, 0).x;
  const roupa1 = em(xRoupa1, 0).x;
  const corRoupa = bebe ? '#ffffff' : P.comprimento > 140 ? '#cfe0f5' : '#bfe3f2';
  const bordaRoupa = bebe ? '#9fb4cf' : '#6f93b8';

  // eletrodos: um abaixo da clavícula direita (lado de cá) e um no abdome
  const eletrodosPts = [naFrente(P.ombro + (P.mamilos - P.ombro) * 0.3, P.apTorax * 0.28), naFrente(P.xifoide + (P.umbigo - P.xifoide) * 0.6, P.apAbdome * 0.3)];
  const rEle = Math.max(1.8, P.apTorax * 0.065 * k);

  const tubo = viaAerea === 'tubo';
  const escalaAcesso = Math.max(1, gb / 6);
  const hubPeriferico = { x: corpo.periferico.x + 2.2, y: corpo.periferico.y - 0.4 };
  const traco = Math.max(0.7, k * 0.5);
  const contorno = { stroke: pal.contorno, strokeOpacity: 0.85, strokeWidth: arred(traco), strokeLinejoin: 'round' as const };
  // compressão: sombra da mão afundando o peito
  const funda = corpo.afundaCm / (P.apTorax * 0.38);

  return (
    <g className="rcp-paciente">
      <defs>
        <linearGradient id={id('pac-pele')} gradientUnits="userSpaceOnUse" x1="0" y1={arred(topoY)} x2="0" y2={arred(baseY)}>
          <stop offset="0" stopColor={pal.luz} />
          <stop offset="0.55" stopColor={pal.base} />
          <stop offset="1" stopColor={misturar(pal.base, pal.sombra, 0.7)} />
        </linearGradient>
        <linearGradient id={id('pac-longe')} gradientUnits="userSpaceOnUse" x1="0" y1={arred(topoY)} x2="0" y2={arred(baseY)}>
          <stop offset="0" stopColor={misturar(pal.base, pal.sombra, 0.35)} />
          <stop offset="1" stopColor={pal.sombra} />
        </linearGradient>
        <radialGradient id={id('pac-rubor')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={pal.rubor} stopOpacity={rce ? 0.6 : 0.2} />
          <stop offset="1" stopColor={pal.rubor} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('pac-sombra')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#2b2140" stopOpacity="0.32" />
          <stop offset="1" stopColor="#2b2140" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('pac-afunda')} cx="50%" cy="35%" r="50%">
          <stop offset="0" stopColor={pal.sombra} stopOpacity="0.9" />
          <stop offset="1" stopColor={pal.sombra} stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('pac-roupa')}>
          <rect x={arred(roupa0)} y={arred(topoY - 80)} width={arred(roupa1 - roupa0)} height="300" />
        </clipPath>
        <clipPath id={id('pac-corpo')}>
          <path d={silhueta} />
        </clipPath>
      </defs>

      {/* sombra no colchão */}
      <ellipse cx={arred(em(P.comprimento * 0.47, 0).x)} cy={arred(baseY - 0.5)} rx={arred(P.comprimento * k * 0.56)} ry={arred(Math.max(3, P.apTorax * k * 0.3))} fill={`url(#${id('pac-sombra')})`} />

      {/* halo claro em volta (o paciente não se mistura com quem está atrás) */}
      <g fill="none" stroke="#ffffff" strokeOpacity="0.9" strokeWidth={arred(traco * 4)} strokeLinejoin="round">
        <path d={pernaSo} transform={longe} />
        {bracoLonge.map((d, i) => (
          <path key={i} d={d} />
        ))}
        <path d={silhueta} />
        <path d={cabeca} />
      </g>

      {/* braço e perna do outro lado (atrás do corpo, mais escuros) */}
      <Braco partes={bracoLonge} fill={`url(#${id('pac-longe')})`} traco={traco} cor={pal.contorno} />
      <path d={pernaSo} transform={longe} fill={`url(#${id('pac-longe')})`} {...contorno} />

      {/* corpo */}
      <path d={silhueta} fill={`url(#${id('pac-pele')})`} {...contorno} />
      <g clipPath={`url(#${id('pac-corpo')})`}>
        {/* luz ao longo da frente do corpo */}
        <path d={curva(frente.slice(2, 28).map((p) => ({ x: p.x, y: p.y + traco * 1.6 })))} fill="none" stroke={pal.luz} strokeWidth={arred(Math.max(1, P.apTorax * k * 0.09))} strokeLinecap="round" opacity="0.75" />
        {/* afundamento: sombra embaixo da mão */}
        {funda > 0.02 && (
          <ellipse
            cx={arred(corpo.torax.x)}
            cy={arred(corpo.torax.y + P.apTorax * k * 0.12)}
            rx={arred(P.apTorax * k * 0.55)}
            ry={arred(P.apTorax * k * 0.28)}
            fill={`url(#${id('pac-afunda')})`}
            opacity={arred(Math.min(1, funda) * 0.85)}
          />
        )}
      </g>
      {/* marcas de movimento dos lados das mãos enquanto o tórax afunda (ajudam a ver a compressão na tela pequena) */}
      {marcas && funda > 0.25 && (
        <g stroke="#4b2580" strokeWidth={arred(Math.max(1, traco * 1.3))} strokeLinecap="round" fill="none" opacity={arred(Math.min(1, funda) * 0.75)}>
          {[-1, 1].map((lado) =>
            [0.78, 1.02].map((d) => {
              const x = corpo.torax.x + lado * P.apTorax * k * d;
              const y = em((x - em(0, 0).x) / k, corpo.alturaTronco((x - em(0, 0).x) / k)).y - 3;
              return <path key={`${lado}${d}`} d={`M ${arred(x)} ${arred(y - P.apTorax * k * 0.3)} q ${arred(lado * 1.2)} ${arred(P.apTorax * k * 0.12)} 0 ${arred(P.apTorax * k * 0.24)}`} />;
            }),
          )}
        </g>
      )}
      <path d={curva(pernaS.cima.slice(1, -1).map((p) => ({ x: p.x, y: p.y + traco * 1.4 })))} fill="none" stroke={pal.luz} strokeWidth={arred(Math.max(0.8, P.perna * k * 0.1))} strokeLinecap="round" opacity="0.55" />
      <g fill="none" stroke={pal.sombra} strokeOpacity="0.5" strokeWidth={arred(traco * 0.8)} strokeLinecap="round">
        {!bebe && costelas.map((d, i) => <path key={i} d={d} />)}
        <path d={`M ${arred(clav0.x)} ${arred(clav0.y)} Q ${arred((clav0.x + clav1.x) / 2)} ${arred(clav0.y - 0.6)} ${arred(clav1.x)} ${arred(clav1.y)}`} />
        {/* joelho */}
        <path d={`M ${arred(corpo.perna.joelho.x - P.perna * k * 0.15)} ${arred(corpo.perna.joelho.y - P.perna * k * 0.25)} q ${arred(P.perna * k * 0.2)} ${arred(-P.perna * k * 0.12)} ${arred(P.perna * k * 0.35)} 0`} />
      </g>
      <ellipse cx={arred(mamilo.x)} cy={arred(mamilo.y)} rx={arred(Math.max(0.9, P.apTorax * 0.05 * k))} ry={arred(Math.max(0.6, P.apTorax * 0.03 * k))} fill={misturar(pal.sombra, pal.labio, 0.5)} opacity="0.75" />

      {/* fralda ou bermuda */}
      <g clipPath={`url(#${id('pac-roupa')})`}>
        <path d={silhueta} fill={corRoupa} stroke={bordaRoupa} strokeWidth={arred(traco)} strokeLinejoin="round" />
        <path d={pernaSo} transform={longe} fill={misturar(corRoupa, '#5b6b86', 0.22)} stroke={bordaRoupa} strokeWidth={arred(traco)} />
        <path d={curva(frente.slice(26).map((p) => ({ x: p.x, y: p.y + traco * 1.6 })))} fill="none" stroke="#ffffff" strokeWidth={arred(traco * 2)} strokeLinecap="round" opacity="0.8" />
      </g>
      {bebe ? (
        <g>
          {/* fita adesiva da fralda */}
          <rect x={arred(roupa0 + traco * 1.5)} y={arred(naFrente(xRoupa0 + 1).y + traco * 2)} width={arred(Math.max(2.6, P.apAbdome * k * 0.32))} height={arred(Math.max(2, P.apAbdome * k * 0.22))} rx="0.8" fill="#8cc4f2" stroke="#5b9bd5" strokeWidth="0.4" />
          <path d={`M ${arred(roupa0)} ${arred(naFrente(xRoupa0).y + traco)} Q ${arred(roupa0 - traco)} ${arred((naFrente(xRoupa0).y + baseY) / 2)} ${arred(roupa0 + traco)} ${arred(baseY - traco)}`} stroke={bordaRoupa} strokeWidth={arred(traco)} fill="none" />
        </g>
      ) : (
        <path d={`M ${arred(roupa0)} ${arred(naFrente(xRoupa0).y + traco)} Q ${arred(roupa0 - traco)} ${arred((naFrente(xRoupa0).y + baseY) / 2)} ${arred(roupa0 + traco)} ${arred(baseY - traco)}`} stroke={bordaRoupa} strokeWidth={arred(traco * 1.4)} fill="none" />
      )}

      {/* umbigo (no RN, coto umbilical com clampe) */}
      {P.comprimento <= 55 ? (
        <g>
          <path d={`M ${arred(umbigo.x)} ${arred(umbigo.y + 1)} q ${arred(0.2 * k)} ${arred(-1.4 * k)} ${arred(1.1 * k)} ${arred(-1.8 * k)}`} stroke="#d8cfa6" strokeWidth={arred(0.9 * k)} strokeLinecap="round" fill="none" />
          <rect x={arred(umbigo.x + 0.5 * k)} y={arred(umbigo.y - 2.3 * k)} width={arred(1.6 * k)} height={arred(0.65 * k)} rx="0.5" fill="#3d7fd6" transform={`rotate(-30 ${arred(umbigo.x + 1.3 * k)} ${arred(umbigo.y - 2 * k)})`} />
        </g>
      ) : (
        <path d={`M ${arred(umbigo.x - 0.5 * k)} ${arred(umbigo.y + 0.3 * k)} q ${arred(0.5 * k)} ${arred(0.55 * k)} ${arred(1 * k)} 0`} stroke={pal.sombra} strokeWidth={arred(traco * 0.9)} fill="none" />
      )}

      {/* eletrodos do monitor (o fio desce pelo lado e segue pelo colchão) */}
      {eletrodos &&
        eletrodosPts.map((p, i) => (
          <g key={i}>
            <path d={`M ${arred(p.x)} ${arred(p.y)} C ${arred(p.x + 1)} ${arred(p.y + 5)}, ${arred(p.x + 4)} ${arred(baseY - 1)}, ${arred(p.x + 12)} ${arred(baseY + 1)}`} stroke="#6b7486" strokeWidth="0.8" fill="none" />
            <ellipse cx={arred(p.x)} cy={arred(p.y)} rx={arred(rEle)} ry={arred(rEle * 0.8)} fill="#f8fafc" stroke="#8b95a6" strokeWidth="0.5" />
            <circle cx={arred(p.x)} cy={arred(p.y)} r={arred(rEle * 0.38)} fill="#7e8899" />
          </g>
        ))}

      {/* pás adesivas do desfibrilador */}
      {pas && <Pas corpo={corpo} />}

      {/* cabeça */}
      <path d={cabeca} fill={`url(#${id('pac-pele')})`} />
      <path d={contornoCab} fill="none" {...contorno} />
      {bebe ? (
        // bebê: cabelo ralo — uma sombra leve e fios finos e compridos no alto e atrás da cabeça
        <g>
          <path d={cabelo} fill={pal.cabelo} opacity="0.16" />
          <g stroke={pal.cabelo} strokeWidth={arred(traco * 0.5)} strokeLinecap="round" fill="none" opacity="0.55">
            {/* fios deitados ao longo da cabeça (seguem o contorno, um pouco para dentro) */}
            {[0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82].map((t) => {
              const i = Math.min(4, Math.floor(t * 4));
              const f = t * 4 - i;
              const a = lerpPonto(cab[i + 1]!, cab[i + 2]!, f);
              const b = lerpPonto(cab[i + 1]!, cab[i + 2]!, Math.min(1, f + 0.5));
              const dentro = (p: Ponto, q: number) => lerpPonto(p, centroCab, q);
              const ini = dentro(a, 0.06);
              const fim = dentro(b, 0.1);
              const meio = dentro(lerpPonto(a, b, 0.5), 0.02);
              return <path key={t} d={`M ${arred(ini.x)} ${arred(ini.y)} Q ${arred(meio.x)} ${arred(meio.y)} ${arred(fim.x)} ${arred(fim.y)}`} />;
            })}
          </g>
        </g>
      ) : (
        <g>
          <path d={cabelo} fill={pal.cabelo} opacity="0.96" />
          <path d={curva(cabeloFora.slice(2, 6).map((p) => fora(p, 0.975)))} stroke={misturar(pal.cabelo, '#ffffff', 0.25)} strokeWidth="0.9" fill="none" opacity="0.5" />
        </g>
      )}
      <ellipse cx={arred(boch.x)} cy={arred(boch.y)} rx={arred(tamCab * 0.16)} ry={arred(tamCab * 0.11)} fill={`url(#${id('pac-rubor')})`} />
      {/* orelha (de lado: comprida ao longo do corpo, a concha abre para o rosto) */}
      <ellipse cx={arred(orelha.x)} cy={arred(orelha.y)} rx={arred(u(0.1))} ry={arred(v(0.075))} fill={misturar(pal.base, pal.sombra, 0.12)} stroke={pal.contorno} strokeOpacity="0.8" strokeWidth={arred(traco * 0.8)} />
      <path d={`M ${arred(orelha.x - u(0.065))} ${arred(orelha.y - v(0.02))} Q ${arred(orelha.x - u(0.01))} ${arred(orelha.y + v(0.075))} ${arred(orelha.x + u(0.06))} ${arred(orelha.y - v(0.015))}`} stroke={pal.sombra} strokeWidth={arred(traco * 0.75)} fill="none" strokeLinecap="round" />
      <circle cx={arred(orelha.x + u(0.005))} cy={arred(orelha.y + v(0.005))} r={arred(u(0.022))} fill={pal.sombra} opacity="0.7" />
      {/* olho fechado (pálpebra com cílios) e sobrancelha */}
      <path d={`M ${arred(olho.x - u(0.055))} ${arred(olho.y - v(0.01))} Q ${arred(olho.x)} ${arred(olho.y + v(0.05))} ${arred(olho.x + u(0.055))} ${arred(olho.y - v(0.01))}`} stroke={corTraco} strokeWidth={arred(traco * 1.1)} fill="none" strokeLinecap="round" />
      <g stroke={corTraco} strokeWidth={arred(traco * 0.5)} strokeLinecap="round" opacity="0.75">
        {[-0.03, 0.005, 0.04].map((d) => (
          <line key={d} x1={arred(olho.x + u(d))} y1={arred(olho.y + v(0.035))} x2={arred(olho.x + u(d * 1.3))} y2={arred(olho.y + v(0.07))} />
        ))}
      </g>
      <path d={`M ${arred(sobr.x - u(0.06))} ${arred(sobr.y + v(0.01))} Q ${arred(sobr.x)} ${arred(sobr.y - v(0.035))} ${arred(sobr.x + u(0.06))} ${arred(sobr.y + v(0.005))}`} stroke={pal.cabelo} strokeWidth={arred(traco * (bebe ? 0.7 : 1.3))} fill="none" strokeLinecap="round" opacity={bebe ? 0.55 : 0.9} />
      <ellipse cx={arred(narina.x)} cy={arred(narina.y)} rx={arred(u(0.022))} ry={arred(v(0.016))} fill={pal.sombra} />
      {!tubo && <path d={labios} stroke={pal.labio} strokeWidth={arred(Math.max(0.9, tamCab * 0.05))} strokeLinecap="round" strokeLinejoin="round" fill="none" />}

      {/* tubo traqueal saindo da boca, com fixação */}
      {tubo && <TuboNaBoca corpo={corpo} labio={pal.labio} />}

      {/* braço do lado de cá (na frente do corpo, sobre o colchão) */}
      <Braco partes={braco} fill={`url(#${id('pac-pele')})`} traco={traco} cor={pal.contorno} />
      {!bebe && <path d={`M ${arred(corpo.braco.ponta.x - gb * 0.9)} ${arred(corpo.braco.ponta.y - gb * 0.12)} l ${arred(gb * 0.7)} ${arred(gb * 0.02)} M ${arred(corpo.braco.ponta.x - gb * 0.95)} ${arred(corpo.braco.ponta.y + gb * 0.06)} l ${arred(gb * 0.75)} 0`} stroke={pal.sombra} strokeOpacity="0.6" strokeWidth={arred(traco * 0.6)} />}

      {/* acessos */}
      {acesso === 'periferico' && <CateterPeriferico em={corpo.periferico} hub={hubPeriferico} escala={escalaAcesso} />}
      {acesso === 'intraosseo' && <AgulhaIO em={corpo.tibia} escala={Math.max(1, (P.perna * k) / 9)} />}
    </g>
  );
}

function lerpPonto(a: Ponto, b: Ponto, t: number): Ponto {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

/** Onde a seringa encaixa (canhão do cateter ou da agulha IO). */
export function pontoDeInjecao(corpo: CorpoPaciente, acesso: 'periferico' | 'intraosseo' | undefined): Ponto {
  if (acesso === 'intraosseo') return { x: corpo.tibia.x, y: corpo.tibia.y - Math.max(1, (corpo.P.perna * corpo.k) / 9) * 6.4 };
  return { x: corpo.periferico.x + 2.2 + 3.8 * Math.max(1, (corpo.P.grossuraBraco * corpo.k) / 6), y: corpo.periferico.y - 0.4 };
}

/** Tubo traqueal saindo da boca (entre os lábios), subindo e entortando para a cabeceira, com fita na bochecha. */
function TuboNaBoca({ corpo, labio }: { corpo: CorpoPaciente; labio: string }) {
  const { P, k } = corpo;
  const b = corpo.boca;
  const t = corpo.tuboTopo;
  const w = Math.max(2, P.profCabeca * k * 0.085);
  const d = `M ${arred(b.x)} ${arred(b.y + w * 0.5)} C ${arred(b.x + w * 0.2)} ${arred(b.y - (b.y - t.y) * 0.55)}, ${arred(t.x + w * 0.4)} ${arred(t.y + w * 2.6)}, ${arred(t.x)} ${arred(t.y + w * 1.3)}`;
  // fita: do tubo, pelo lábio de cima, até a bochecha
  const bochecha = corpo.naCabeca(ROSTOS[P.rosto].bochecha[0] - 0.04, ROSTOS[P.rosto].bochecha[1] + 0.02);
  const fita0 = { x: b.x + w * 0.4, y: b.y - w * 0.15 };
  return (
    <g className="rcp-tubo">
      {/* lábios abertos em volta do tubo */}
      <ellipse cx={arred(b.x)} cy={arred(b.y + w * 0.1)} rx={arred(w * 0.95)} ry={arred(w * 0.5)} fill={labio} />
      <path d={d} stroke="#5f7d92" strokeWidth={arred(w + 0.9)} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#e8f4fa" strokeWidth={arred(w)} fill="none" strokeLinecap="round" />
      {/* linha radiopaca azul */}
      <path d={d} stroke="#3d7fd6" strokeWidth={arred(Math.max(0.4, w * 0.18))} fill="none" transform={`translate(${arred(w * 0.22)} 0)`} />
      {/* marca da profundidade (cm) na altura dos lábios */}
      <path d={`M ${arred(b.x - w * 0.6)} ${arred(b.y - w * 0.7)} l ${arred(w * 1.2)} 0`} stroke="#1d1b24" strokeWidth={arred(Math.max(0.5, w * 0.22))} strokeLinecap="round" />
      {/* fita de fixação na bochecha */}
      <path d={`M ${arred(fita0.x)} ${arred(fita0.y)} L ${arred(bochecha.x)} ${arred(bochecha.y)}`} stroke="#f3e7cc" strokeWidth={arred(w * 1.1)} strokeLinecap="butt" />
      <path d={`M ${arred(fita0.x)} ${arred(fita0.y)} L ${arred(bochecha.x)} ${arred(bochecha.y)}`} stroke="#c9b894" strokeWidth="0.4" strokeDasharray="1 1.4" />
      {/* conector de 15 mm onde a bolsa encaixa */}
      <rect x={arred(t.x - w * 0.8)} y={arred(t.y - w * 0.1)} width={arred(w * 1.6)} height={arred(w * 1.6)} rx="0.6" fill="#ffffff" stroke="#7d93a3" strokeWidth="0.5" />
      <rect x={arred(t.x - w * 0.62)} y={arred(t.y - w * 1)} width={arred(w * 1.24)} height={arred(w * 1)} rx="0.5" fill="#5b8fc9" stroke="#3e6d9f" strokeWidth="0.4" />
    </g>
  );
}

/** Pás adesivas: placas brancas coladas no peito (vistas um pouco de cima), com o cabo. */
function Pas({ corpo }: { corpo: CorpoPaciente }) {
  const { P, em, k } = corpo;
  const placa = (x0: number, x1: number, fundo: number) => {
    const cima: Ponto[] = [];
    const baixo: Ponto[] = [];
    for (let i = 0; i <= 6; i++) {
      const x = lerp(x0, x1, i / 6);
      const h = corpo.alturaTronco(x);
      cima.push(em(x, h + 0.25));
      baixo.push(em(x, h - fundo));
    }
    return `${curva(cima)} ${curva(baixo.reverse(), false, true)} Z`;
  };
  const pa = (x0: number, x1: number, fundo: number) => {
    const meio = em((x0 + x1) / 2, corpo.alturaTronco((x0 + x1) / 2) - fundo * 0.5);
    const raio = Math.min((x1 - x0) * k * 0.18, fundo * k * 0.3);
    return (
      <g>
        <path d={placa(x0, x1, fundo)} fill="#ffffff" stroke="#9aa6b5" strokeWidth="0.6" strokeLinejoin="round" />
        <path d={placa(x0 + (x1 - x0) * 0.12, x1 - (x1 - x0) * 0.12, fundo * 0.72)} fill="none" stroke="#e5484d" strokeWidth="0.6" strokeDasharray="1.6 1" transform={`translate(0 ${arred(fundo * k * 0.1)})`} />
        <path d={`M ${arred(meio.x - raio * 0.4)} ${arred(meio.y - raio)} l ${arred(-raio * 0.5)} ${arred(raio)} h ${arred(raio * 0.6)} l ${arred(-raio * 0.3)} ${arred(raio)} l ${arred(raio * 0.8)} ${arred(-raio * 1.2)} h ${arred(-raio * 0.6)} z`} fill="#e5484d" />
      </g>
    );
  };
  if (P.rosto === 'bebe') {
    // anteroposterior: uma na frente do tórax e outra embaixo das costas (aparece entre as costas e o colchão)
    const xa = P.ombro + 0.6;
    const xb = P.xifoide - 0.2;
    const fundo = P.apTorax * 0.5;
    const tras0 = em(xa, corpo.baseTronco(xa) - 0.15);
    const tras1 = em(xb, corpo.baseTronco(xb) - 0.15);
    return (
      <g className="rcp-pas">
        <path d={`M ${arred(tras0.x)} ${arred(tras0.y)} L ${arred(tras1.x)} ${arred(tras1.y)}`} stroke="#ffffff" strokeWidth={arred(Math.max(1.6, 0.7 * k))} strokeLinecap="round" />
        <path d={`M ${arred(tras0.x)} ${arred(tras0.y)} L ${arred(tras1.x)} ${arred(tras1.y)}`} stroke="#e5484d" strokeWidth="0.4" strokeDasharray="1.2 1" />
        {pa(xa, xb, fundo)}
      </g>
    );
  }
  // anterolateral: abaixo da clavícula direita (lado de cá) e no ápice (lado de lá, mais embaixo)
  return (
    <g className="rcp-pas">
      {pa(P.ombro + 0.6, P.ombro + (P.mamilos - P.ombro) * 0.85, P.apTorax * 0.45)}
      {pa(P.xifoide - (P.xifoide - P.mamilos) * 0.2, P.xifoide + (P.umbigo - P.xifoide) * 0.35, P.apTorax * 0.32)}
    </g>
  );
}

function CateterPeriferico({ em, hub, escala }: { em: Ponto; hub: Ponto; escala: number }) {
  const s = escala;
  return (
    <g>
      {/* curativo transparente */}
      <rect x={arred(em.x - 3.2 * s)} y={arred(em.y - 2.2 * s)} width={arred(6.4 * s)} height={arred(4.4 * s)} rx={arred(1 * s)} fill="#ffffff" opacity="0.5" stroke="#c9d2de" strokeWidth="0.4" />
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
