/**
 * Desenhos de cada opção dos escores de maturidade (Capurro e New Ballard), como nas tabelas
 * clássicas: pele, orelha, mama, mamilo, pregas plantares, lanugo, sinal do xale/cachecol,
 * cabeça na tração, postura, janela quadrada, retração do braço, ângulo poplíteo e calcanhar–orelha.
 * Cada desenho recebe o critério e a posição da opção (0 = menos madura).
 * Genitais: só descrição em texto (sem desenho), de propósito.
 */

import { type ReactNode, useId } from 'react';
import type { TomDePele } from '../neonatal/exame';
import { FiltrosPele } from './FiltrosPele';
import { arco, capsula, lerp, type Ponto, polar } from './formas';
import { idSvg, misturar, PALETAS, pontosFixos } from './pele';

const W = 160;
const H = 120;

interface PropsCriterio {
  criterioId: string;
  /** Posição da opção (0 = menos madura). */
  indice: number;
  /** Quantas opções o critério tem. */
  total: number;
  tom?: TomDePele;
}

/** Os critérios que têm desenho. */
export function temDesenho(criterioId: string): boolean {
  return !criterioId.startsWith('genitais');
}

export function IlustracaoCriterio({ criterioId, indice, total, tom = 'claro' }: PropsCriterio) {
  const id = idSvg(useId());
  const p = PALETAS[tom];
  const n = total > 1 ? indice / (total - 1) : 0;
  let conteudo: ReactNode = null;
  const membro = (a: Ponto, b: Ponto, w1: number, w2 = w1) => (
    <g>
      <path d={capsula(a, b, w1 + 1.5, w2 + 1.5)} fill={p.sombra} opacity="0.5" />
      <path d={capsula(a, b, w1, w2)} fill={`url(#${id('volume-suave')})`} />
    </g>
  );
  const anguloTexto = (c: Ponto, texto: string) => (
    <text x={c.x} y={c.y} fontSize="11" fontWeight="700" fill="#4b2580" textAnchor="middle">
      {texto}
    </text>
  );

  switch (criterioId) {
    case 'textura-pele':
    case 'pele': {
      // de vermelha/translúcida com veias (0) a apergaminhada/rachada/enrugada (1)
      const base = n < 0.35 ? misturar('#e66f77', p.base, n / 0.35) : misturar(p.base, misturar('#eadcc0', p.base, tom === 'claro' ? 0.1 : 0.55), Math.min(1, (n - 0.35) / 0.65));
      const r = pontosFixos(9, 120);
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill={base} filter={`url(#${id('textura')})`} />
          <rect x="10" y="10" width="140" height="100" rx="12" fill={`url(#${id('brilho')})`} opacity={1 - n} />
          {n < 0.6 && (
            <g fill="none" stroke="#7a4fb0" strokeWidth={1.6 - n} opacity={Math.max(0, 0.8 - n * 1.3)}>
              <path d="M 20 30 C 50 40, 70 30, 100 50 S 130 60, 145 90" />
              <path d="M 70 34 C 80 60, 60 80, 64 104" />
              <path d="M 100 50 C 110 40, 130 36, 146 30" />
            </g>
          )}
          {n >= 0.4 &&
            Array.from({ length: Math.round(4 + n * 10) }, (_, i) => (
              <path key={i} d={`M ${20 + r[i]! * 110} ${20 + r[i + 30]! * 80} q 6 -4 12 0 q -4 5 -12 0 Z`} fill="#fff" opacity={0.25 + n * 0.3} />
            ))}
          {n >= 0.6 && (
            <g fill="none" stroke={misturar(p.contorno, '#5a3a20', 0.3)} strokeWidth={0.8 + (n - 0.6) * 4} strokeLinecap="round" opacity="0.8">
              <path d="M 22 54 l 18 6 l 14 -4 l 20 10" />
              <path d="M 80 24 l 6 18 l -4 14 l 10 16" />
              {n >= 0.8 && <path d="M 100 80 l 16 -6 l 12 8 l 16 -4 M 30 92 l 22 -8 l 14 6" />}
            </g>
          )}
          {n >= 0.95 && (
            <g fill="none" stroke={p.sombra} strokeWidth="1" opacity="0.6">
              {[30, 42, 54, 66, 78, 90].map((y) => (
                <path key={y} d={`M 16 ${y} q 30 -6 60 0 t 66 0`} />
              ))}
            </g>
          )}
        </g>
      );
      break;
    }
    case 'forma-orelha':
    case 'olhos-orelhas': {
      const ballard = criterioId === 'olhos-orelhas';
      if (ballard && indice <= 1) {
        // pálpebras fundidas (−2 firmemente; −1 frouxamente)
        conteudo = (
          <g>
            <rect x="10" y="10" width="140" height="100" rx="12" fill={`url(#${id('volume-suave')})`} filter={`url(#${id('textura')})`} />
            <ellipse cx="80" cy="62" rx="44" ry="20" fill={p.luz} opacity="0.5" />
            <path d="M 38 64 Q 80 74 122 64" fill="none" stroke={p.contorno} strokeWidth={indice === 0 ? 0.8 : 2} opacity={indice === 0 ? 0.35 : 0.8} strokeDasharray={indice === 0 ? '0' : '6 4'} />
          </g>
        );
        break;
      }
      // curvatura da borda (hélice): 0 plana → 1 toda encurvada
      const c = ballard ? (indice - 2) / 4 : n;
      const dobrada = ballard && indice === 2;
      const fimHelice = lerp(0, 1, c);
      const helice = `M 64 92 C 46 80, 42 40, 62 22 C 80 8, 112 14, 118 40 C 124 64, 108 74, 100 96`;
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill="#f6f1fc" />
          <g filter={`url(#${id('textura')})`} transform={dobrada ? 'rotate(18 80 60)' : undefined}>
            <path d="M 60 100 C 34 86, 34 30, 60 16 C 84 2, 126 12, 126 44 C 126 74, 108 84, 100 104 Z" fill={`url(#${id('volume')})`} stroke={p.contorno} strokeOpacity="0.4" />
            {fimHelice > 0 && <path d={helice} fill="none" stroke={p.sombra} strokeWidth={4 + c * 3} strokeLinecap="round" pathLength={1} strokeDasharray={`${fimHelice} 1`} opacity="0.75" />}
            {fimHelice > 0 && <path d={helice} fill="none" stroke={p.luz} strokeWidth={1.6} strokeLinecap="round" pathLength={1} strokeDasharray={`${fimHelice} 1`} transform="translate(-2 -2)" />}
            <path d="M 84 52 C 74 60, 76 76, 90 78" fill="none" stroke={p.sombra} strokeWidth="3" opacity={0.3 + c * 0.4} />
            <ellipse cx="92" cy="66" rx="6" ry="8" fill={p.contorno} opacity="0.35" />
          </g>
          {dobrada && (
            <text x="80" y="114" fontSize="9" textAnchor="middle" fill="#4b2580">
              fica dobrada
            </text>
          )}
        </g>
      );
      break;
    }
    case 'glandula-mamaria': {
      const mm = [0, 4, 7.5, 12][indice] ?? 0;
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill="#f6f1fc" />
          <path d="M 10 40 C 40 36, 50 34, 60 40 L 60 110 L 10 110 Z" fill={`url(#${id('volume-suave')})`} />
          <path d={`M 60 40 C 60 40, 60 ${74 - mm * 2.4}, 60 ${74 - mm * 2.4} C ${60 + mm * 2.6} ${74 - mm * 2}, ${60 + mm * 2.6} ${74 + mm * 2}, 60 ${74 + mm * 2.4} L 60 110`} fill={`url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.4" />
          <path d="M 60 40 L 60 110" stroke={p.contorno} strokeOpacity="0.25" />
          {mm > 0 && <ellipse cx={60 + mm * 0.9} cy={74} rx={mm * 1.3} ry={mm * 2.1} fill={p.sombra} opacity="0.35" />}
          {/* régua em mm */}
          <g stroke="#4b2580" strokeWidth="1">
            <path d="M 104 40 L 104 108" />
            {Array.from({ length: 14 }, (_, i) => (
              <path key={i} d={`M 104 ${44 + i * 4.8} l ${i % 5 === 0 ? 8 : 4} 0`} />
            ))}
          </g>
          <text x="120" y="78" fontSize="11" fontWeight="700" fill="#4b2580">
            {mm === 0 ? '—' : mm === 7.5 ? '5–10' : mm > 10 ? '>10' : '<5'}
          </text>
          <text x="120" y="90" fontSize="9" fill="#4b2580">
            mm
          </text>
        </g>
      );
      break;
    }
    case 'formacao-mamilo':
    case 'mamas': {
      const ballard = criterioId === 'mamas';
      const areola = ballard ? [0, 6, 14, 16, 20, 26][indice]! : [0, 12, 20, 22][indice]!;
      const pontilhada = ballard ? indice >= 3 : indice >= 2;
      const elevada = ballard ? indice >= 4 : indice >= 3;
      const broto = ballard ? [0, 0, 0, 2, 4, 8][indice]! : 0;
      const r = pontosFixos(4, 60);
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill={`url(#${id('volume-suave')})`} filter={`url(#${id('textura')})`} />
          {broto > 0 && <circle cx="80" cy="60" r={areola + broto} fill={p.luz} opacity="0.55" filter={`url(#${id('borrar')})`} />}
          {elevada && <circle cx="81" cy="62" r={areola + 2} fill={p.sombra} opacity="0.5" />}
          {areola > 0 && <circle cx="80" cy="60" r={areola} fill={misturar(p.base, p.labio, 0.45)} />}
          {pontilhada && areola > 0 && Array.from({ length: 22 }, (_, i) => <circle key={i} cx={80 + (r[i]! - 0.5) * areola * 1.5} cy={60 + (r[i + 30]! - 0.5) * areola * 1.5} r={0.9} fill={p.contorno} opacity="0.5" />)}
          <circle cx="80" cy="60" r={ballard && indice === 0 ? 0 : 3} fill={misturar(p.contorno, p.labio, 0.3)} opacity={ballard && indice === 1 ? 0.4 : 0.85} />
          {areola >= 20 && (
            <g stroke="#4b2580" strokeWidth="1" fill="none">
              <path d={`M ${80 - areola} ${60 + areola + 6} L ${80 + areola} ${60 + areola + 6}`} />
              <text x="80" y={60 + areola + 16} fontSize="9" textAnchor="middle" fill="#4b2580" stroke="none">
                {ballard ? `${broto + 2} mm` : '> 7,5 mm'}
              </text>
            </g>
          )}
        </g>
      );
      break;
    }
    case 'pregas-plantares':
    case 'superficie-plantar': {
      const ballard = criterioId === 'superficie-plantar';
      // comprimento do pé (Ballard −2/−1: pé curto) e até onde vão as pregas
      const curto = ballard && indice <= 1;
      const comp = curto ? (indice === 0 ? 64 : 76) : 90;
      const marcas = ballard ? (indice === 3 ? 0.5 : 0) : indice === 1 ? 0.5 : indice === 2 ? 0.5 : 0;
      const sulcos = ballard ? [0, 0, 0, 0, 0.12, 0.66, 1][indice]! : [0, 0, 0.33, 0.5, 0.8][indice]!;
      const y0 = 108;
      const topo = y0 - comp;
      const linhas = (fracao: number, forte: boolean) =>
        Array.from({ length: Math.max(1, Math.round(fracao * 9)) }, (_, i) => {
          const y = topo + 16 + i * ((comp - 20) / 9);
          return <path key={`${forte}-${i}`} d={`M ${60 + (i % 2) * 3} ${y} q 20 ${forte ? -4 : -2} 40 ${(i % 3) - 1}`} stroke={forte ? p.contorno : '#d0606a'} strokeWidth={forte ? 1.6 : 1} opacity={forte ? 0.8 : 0.5} fill="none" />;
        });
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill="#f6f1fc" />
          <path d={`M 62 ${y0} C 52 ${y0 - comp * 0.4}, 52 ${topo + 20}, 64 ${topo + 6} C 74 ${topo - 4}, 96 ${topo - 4}, 104 ${topo + 8} C 112 ${topo + 26}, 104 ${y0 - comp * 0.4}, 96 ${y0} Z`} fill={`url(#${id('volume-suave')})`} stroke={p.contorno} strokeOpacity="0.4" filter={`url(#${id('textura')})`} />
          {marcas > 0 && linhas(marcas, false)}
          {sulcos > 0 && (indice === 4 && ballard ? <path d={`M 62 ${topo + 18} q 20 -4 40 0`} stroke={p.contorno} strokeWidth="1.8" fill="none" /> : linhas(sulcos, true))}
          {curto && (
            <g stroke="#4b2580" strokeWidth="1" fill="none">
              <path d={`M 120 ${y0} L 120 ${topo}`} />
              <path d={`M 116 ${y0} l 8 0 M 116 ${topo} l 8 0`} />
              <text x="126" y={(y0 + topo) / 2 + 3} fontSize="9" fill="#4b2580" stroke="none">
                {indice === 0 ? '<40' : '40–50'}
              </text>
              <text x="126" y={(y0 + topo) / 2 + 13} fontSize="9" fill="#4b2580" stroke="none">
                mm
              </text>
            </g>
          )}
        </g>
      );
      break;
    }
    case 'lanugo': {
      const densidade = [0, 30, 140, 70, 40, 14][indice]!;
      const careca = indice >= 4;
      const r = pontosFixos(13, 600);
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill={`url(#${id('volume-suave')})`} filter={`url(#${id('textura')})`} />
          <path d="M 80 14 L 80 106" stroke={p.sombra} strokeWidth="3" opacity="0.3" />
          <g stroke={misturar(p.cabelo, p.base, 0.35)} strokeWidth={indice === 2 ? 0.9 : 0.6} strokeLinecap="round" fill="none" opacity="0.85">
            {Array.from({ length: densidade }, (_, i) => {
              const x = 14 + r[i]! * 132;
              const y = 14 + r[i + 200]! * 92;
              if (careca && Math.hypot(x - 80, y - 60) < (indice === 5 ? 60 : 32)) return null;
              return <path key={i} d={`M ${x} ${y} q 2 -3 ${3 + r[i + 400]! * 3} -6`} />;
            })}
          </g>
        </g>
      );
      break;
    }
    case 'sinal-xale':
    case 'sinal-cachecol': {
      // tórax de frente: linhas de referência e o braço direito (à esquerda de quem olha) cruzando o peito
      const linhas = { axOposta: 122, mamOposta: 106, media: 80, mamMesma: 54, axMesma: 38 };
      const xs = criterioId === 'sinal-xale' ? [linhas.axOposta, (linhas.axOposta + linhas.media) / 2, linhas.media, (linhas.media + linhas.axMesma) / 2] : [134, linhas.axOposta, linhas.mamOposta, linhas.media, linhas.mamMesma, linhas.axMesma];
      const cotovelo = { x: xs[indice] ?? linhas.media, y: criterioId === 'sinal-cachecol' && indice === 0 ? 40 : 66 };
      const ombro = { x: 34, y: 42 };
      const mao = { x: Math.min(138, cotovelo.x + 26), y: 30 };
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill="#f6f1fc" />
          <path d="M 30 36 C 40 26, 120 26, 130 36 C 138 60, 136 96, 128 112 L 32 112 C 24 96, 22 60, 30 36 Z" fill={`url(#${id('volume-suave')})`} filter={`url(#${id('textura')})`} />
          <ellipse cx="80" cy="12" rx="30" ry="16" fill={`url(#${id('volume')})`} />
          <g stroke="#4b2580" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.7">
            {Object.values(linhas).map((x) => (
              <path key={x} d={`M ${x} 30 L ${x} 112`} />
            ))}
          </g>
          {[54, 106].map((x) => (
            <circle key={x} cx={x} cy={56} r={2.6} fill={misturar(p.sombra, p.labio, 0.4)} />
          ))}
          {membro(ombro, cotovelo, 15, 13)}
          {membro(cotovelo, mao, 13, 11)}
          <circle cx={mao.x} cy={mao.y} r={7} fill={`url(#${id('volume-suave')})`} />
          <circle cx={cotovelo.x} cy={cotovelo.y} r={4} fill="#c2413b" />
        </g>
      );
      break;
    }
    case 'posicao-cabeca': {
      // tração para sentar, de lado: ângulo cervicotorácico posterior
      const angulo = [270, 225, 180, 150][indice]!;
      const quadril = { x: 34, y: 100 };
      const ombro = { x: 78, y: 56 };
      const direcaoTronco = (Math.atan2(ombro.y - quadril.y, ombro.x - quadril.x) * 180) / Math.PI;
      // 180° = cabeça na linha do tronco; 270° = caída para trás
      const direcaoCabeca = direcaoTronco - (angulo - 180);
      const cabeca = polar(ombro, 22, direcaoCabeca);
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill="#f6f1fc" />
          {membro(quadril, ombro, 30, 26)}
          {membro(quadril, { x: 96, y: 104 }, 18, 14)}
          {membro(ombro, { x: 128, y: 30 }, 11, 9)}
          <circle cx={cabeca.x} cy={cabeca.y} r={17} fill={`url(#${id('volume')})`} stroke={p.contorno} strokeOpacity="0.3" />
          <path d={arco(ombro, 30, direcaoCabeca, direcaoTronco + 180)} fill="none" stroke="#4b2580" strokeWidth="1.4" />
          {anguloTexto({ x: 120, y: 100 }, angulo === 225 ? '180–270°' : angulo === 150 ? '< 180°' : `${angulo}°`)}
          <circle cx="132" cy="28" r="6" fill="#e9dff7" stroke="#9b74d4" />
        </g>
      );
      break;
    }
    case 'postura': {
      // de barriga para cima, visto de cima: 0 estendido → 4 todo fletido
      const t = n;
      const ombroD = { x: 64, y: 46 };
      const ombroE = { x: 96, y: 46 };
      const quadrilD = { x: 68, y: 82 };
      const quadrilE = { x: 92, y: 82 };
      const bracoFlex = indice >= 3 ? (indice === 3 ? 0.45 : 1) : 0;
      const pernaFlex = [0, 0.3, 0.6, 0.85, 1][indice]!;
      const cotD = polar(ombroD, 18, lerp(120, 160, bracoFlex));
      const maoD = polar(cotD, 16, lerp(110, 260, bracoFlex));
      const cotE = { x: 160 - cotD.x, y: cotD.y };
      const maoE = { x: 160 - maoD.x, y: maoD.y };
      const joelhoD = polar(quadrilD, 20, lerp(100, 160, pernaFlex));
      const peD = polar(joelhoD, 18, lerp(95, 30, pernaFlex));
      const joelhoE = { x: 160 - joelhoD.x, y: joelhoD.y };
      const peE = { x: 160 - peD.x, y: peD.y };
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill="#f6f1fc" />
          {membro(quadrilD, joelhoD, 12, 10)}
          {membro(joelhoD, peD, 10, 8)}
          {membro(quadrilE, joelhoE, 12, 10)}
          {membro(joelhoE, peE, 10, 8)}
          <path d={capsula({ x: 80, y: 46 }, { x: 80, y: 84 }, 36, 30)} fill={`url(#${id('volume-suave')})`} />
          {membro(ombroD, cotD, 10, 9)}
          {membro(cotD, maoD, 9, 8)}
          {membro(ombroE, cotE, 10, 9)}
          {membro(cotE, maoE, 9, 8)}
          <circle cx="80" cy="30" r="15" fill={`url(#${id('volume')})`} />
          <text x="150" y="20" fontSize="8" textAnchor="end" fill="#4b2580" opacity={t > 0 ? 0 : 1}>
            estendido
          </text>
        </g>
      );
      break;
    }
    case 'janela-quadrada': {
      const angulo = [110, 90, 60, 45, 30, 4][indice]!;
      const punho = { x: 96, y: 92 };
      const antebraco = { x: 22, y: 92 };
      // 90° = mão para cima; 0° = mão encostada no antebraço; > 90° = não chega a 90
      const dedos = polar(punho, 44, angulo - 180);
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill="#f6f1fc" />
          {membro(antebraco, punho, 18, 15)}
          {membro(punho, dedos, 16, 12)}
          <path d={arco(punho, 22, 180, 180 + angulo)} fill="none" stroke="#4b2580" strokeWidth="1.4" />
          {anguloTexto({ x: 128, y: 30 }, angulo > 90 ? '> 90°' : `${angulo < 10 ? 0 : angulo}°`)}
        </g>
      );
      break;
    }
    case 'retracao-braco': {
      const angulo = [180, 160, 125, 100, 80][indice]!;
      const ombro = { x: 26, y: 70 };
      const cotovelo = { x: 78, y: 70 };
      const mao = polar(cotovelo, 46, angulo - 180);
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill="#f6f1fc" />
          {membro(ombro, cotovelo, 17, 15)}
          {membro(cotovelo, mao, 15, 12)}
          <circle cx={mao.x} cy={mao.y} r={7} fill={`url(#${id('volume-suave')})`} />
          <path d={arco(cotovelo, 18, 180 + 0.01, 360 - (180 - angulo) - 0.01)} fill="none" stroke="#4b2580" strokeWidth="1.4" />
          {anguloTexto({ x: 120, y: 104 }, ['180°', '140–180°', '110–140°', '90–110°', '< 90°'][indice]!)}
        </g>
      );
      break;
    }
    case 'angulo-popliteo': {
      const angulo = [180, 160, 140, 120, 100, 90, 75][indice]!;
      const quadril = { x: 36, y: 104 };
      const joelho = { x: 36, y: 64 };
      // a coxa aponta para cima; 180° = perna esticada na linha da coxa; 90° = perna na horizontal
      const pe = polar(joelho, 44, 90 - angulo);
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill="#f6f1fc" />
          <rect x="10" y="100" width="140" height="10" fill="#e3d6f5" />
          {membro(quadril, joelho, 20, 16)}
          {membro(joelho, pe, 15, 11)}
          <path d={arco(joelho, 18, 90 - angulo, 90)} fill="none" stroke="#4b2580" strokeWidth="1.4" />
          {anguloTexto({ x: 118, y: 104 }, angulo === 75 ? '< 90°' : `${angulo}°`)}
        </g>
      );
      break;
    }
    case 'calcanhar-orelha': {
      // corpo de frente; o calcanhar sobe até: orelha, nariz, queixo, linha mamilar, umbigo, prega inguinal
      const alvos = [
        { x: 104, y: 22, nome: 'orelha' },
        { x: 84, y: 26, nome: 'nariz' },
        { x: 84, y: 38, nome: 'queixo' },
        { x: 84, y: 56, nome: 'mamilos' },
        { x: 84, y: 76, nome: 'umbigo' },
        { x: 88, y: 90, nome: 'virilha' },
      ];
      const alvo = alvos[indice]!;
      const quadril = { x: 90, y: 96 };
      const joelho = { x: lerp(126, 116, n), y: lerp(40, 92, n) };
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill="#f6f1fc" />
          <path d={capsula({ x: 80, y: 46 }, { x: 80, y: 96 }, 40, 34)} fill={`url(#${id('volume-suave')})`} />
          <circle cx="80" cy="26" r="16" fill={`url(#${id('volume')})`} />
          {membro({ x: 70, y: 96 }, { x: 64, y: 112 }, 12, 10)}
          {membro(quadril, joelho, 13, 11)}
          {membro(joelho, alvo, 11, 9)}
          <circle cx={alvo.x} cy={alvo.y} r={4} fill="#c2413b" />
          <text x="18" y="104" fontSize="9" fill="#4b2580">
            {alvo.nome}
          </text>
        </g>
      );
      break;
    }
    default:
      conteudo = (
        <g>
          <rect x="10" y="10" width="140" height="100" rx="12" fill="#f6f1fc" stroke="#d8c7f2" />
          <text x="80" y="64" fontSize="10" textAnchor="middle" fill="#5e5670">
            descrição em texto
          </text>
        </g>
      );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ilustracao criterio-desenho" aria-hidden="true">
      <FiltrosPele id={id} paleta={p} />
      {conteudo}
    </svg>
  );
}
