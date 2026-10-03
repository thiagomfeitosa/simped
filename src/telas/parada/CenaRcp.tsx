/**
 * Desenho da cena da RCP (SVG feito à mão, sem bibliotecas): sala vista de lado, paciente na maca
 * (ou no berço aquecido, no RN) e a equipe em volta, cada um fazendo o que a cena diz.
 * Sem relógio próprio: quem chama monta a cena a cada quadro (src/parada/cena.ts → montarCena).
 * Peças do desenho: src/ilustracoes/rcp/.
 */

import { type ReactNode, useId } from 'react';
import type { AparenciaAvatar, CenaRcp, FaixaPaciente, LugarNaCena } from '../../parada/cena';
import type { FaixaRitmo } from '../../parada/rcp';
import type { Ponto } from '../../ilustracoes/formas';
import { idSvg, PALETAS } from '../../ilustracoes/pele';
import { AvatarRcp, Cabeca, DefsAvatar } from '../../ilustracoes/rcp/AvatarRcp';
import { arred } from '../../ilustracoes/rcp/caminhos';
import { ALTURA_AVATAR, ALTURA_CENA, corpoDoPaciente, LARGURA_CENA, type LayoutFaixa, layoutDaFaixa, type LugarGeo, naTela, nomeCurto, quebrarTexto } from '../../ilustracoes/rcp/geometria';
import { PacienteRcp } from '../../ilustracoes/rcp/PacienteRcp';
import {
  Berco,
  BercoFundo,
  BolsaValvulaMascara,
  Cabos,
  Carrinho,
  FundoSala,
  geoBolsa,
  geoSeringa,
  Laringoscopio,
  Maca,
  PasAdesivas,
  Seringa,
} from '../../ilustracoes/rcp/Pecas';
import { type AvatarPosto, lugarDe, type Mundo, poseDe } from '../../ilustracoes/rcp/poses';

export interface PropsDesenhoCena {
  cena: CenaRcp;
  /** 'normal' = faixa no painel do código; 'grande' = tela de quem só assiste (professor, telão). */
  tamanho?: 'normal' | 'grande';
}

// ---- Montagem do mundo ----------------------------------------------------------------------

const REPOUSO = new Map<FaixaPaciente, ReturnType<typeof corpoDoPaciente>>();
function repousoDe(faixa: FaixaPaciente) {
  let r = REPOUSO.get(faixa);
  if (!r) REPOUSO.set(faixa, (r = corpoDoPaciente(faixa)));
  return r;
}

function montarMundo(cena: CenaRcp): { mundo: Mundo; postos: AvatarPosto[] } {
  const layout = layoutDaFaixa(cena.faixa);
  const mundo: Mundo = { layout, corpo: corpoDoPaciente(cena.faixa, cena.compressao, cena.expansao, cena.choque), repouso: repousoDe(cena.faixa), cena };
  const vistos = new Map<LugarNaCena, number>();
  const postos = cena.avatares.map((av) => {
    const n = vistos.get(av.lugar) ?? 0;
    vistos.set(av.lugar, n + 1);
    const lugar = lugarDe(av.lugar, mundo, n);
    return { av, lugar, pose: poseDe(av, lugar, mundo) };
  });
  return { mundo, postos };
}

/** Degrau de quem comprime (fica atrás da maca, mais alto para os braços ficarem esticados). */
function Degrau({ x, y, chao }: { x: number; y: number; chao: number }) {
  return (
    <g aria-hidden="true">
      <rect x={arred(x - 27)} y={arred(y - 1)} width="54" height={arred(chao - y + 1)} rx="2" fill="#8d97a6" />
      <rect x={arred(x - 27)} y={arred(y - 1)} width="54" height="3" rx="1.5" fill="#b8c0cc" />
    </g>
  );
}

const transformDoLugar = (L: LugarGeo) => `translate(${arred(L.x)}px, ${arred(L.y)}px) scale(${L.escala})`;

/** Um avatar (ou só uma camada dele) no lugar, com a troca de lugar suave (CSS). */
function Posto({ p, camada, id }: { p: AvatarPosto; camada: 'tudo' | 'corpo' | 'bracos'; id: (n: string) => string }) {
  const principal = camada !== 'bracos';
  return (
    <g
      className="rcp-avatar"
      style={{ transform: transformDoLugar(p.lugar) }}
      {...(principal ? { 'data-papel': p.av.papel, 'data-acao': p.av.acao } : { 'data-camada': 'bracos' })}
    >
      <AvatarRcp aparencia={p.av.aparencia} pose={p.pose} camada={camada} id={id} />
    </g>
  );
}

/** Tudo o que fica no mundo (sem câmera), na ordem de profundidade. `so` = papéis a mostrar. */
export function CamadasMundo({ cena, id, so, fundo = true }: { cena: CenaRcp; id: (n: string) => string; so?: readonly string[]; fundo?: boolean }) {
  const { mundo, postos: todos } = montarMundo(cena);
  const postos = so ? todos.filter((p) => so.includes(p.av.papel)) : todos;
  const { layout, corpo } = mundo;
  const em = (c: LugarGeo['camada']) => postos.filter((p) => p.lugar.camada === c);
  const berco = layout.leito.tipo === 'berco';
  const P = corpo.P;
  const prancha = berco ? undefined : { x0: corpo.em(P.ombro - 3, 0).x, x1: corpo.em(P.pube, 0).x };
  const fimDosFios = corpo.em(P.xifoide + (P.umbigo - P.xifoide) * 0.55, 0);
  return (
    <g>
      {fundo && <FundoSala layout={layout} id={id} />}
      {fundo && berco && <BercoFundo leito={layout.leito} id={id} />}
      {em('fundo').map((p) => (
        <Posto key={p.av.papel} p={p} camada="tudo" id={id} />
      ))}
      {fundo && <Carrinho layout={layout} carregado={cena.carregado} choque={cena.choque} comprimindo={cena.compressao} rce={cena.rce} />}
      {em('atras').map((p) => (
        <g key={p.av.papel}>
          {p.av.lugar === 'torax' && p.lugar.y < 314 && <Degrau x={p.lugar.x} y={p.lugar.y} chao={318} />}
          <Posto p={p} camada="corpo" id={id} />
        </g>
      ))}
      {em('cabeceira').map((p) => (
        <Posto key={p.av.papel} p={p} camada="corpo" id={id} />
      ))}
      {berco ? <Berco leito={layout.leito} /> : <Maca leito={layout.leito} {...(prancha && { prancha })} />}
      <PacienteRcp corpo={corpo} pele={cena.pelePaciente} rce={cena.rce} viaAerea={cena.viaAerea} {...(cena.acesso && { acesso: cena.acesso })} pas={cena.carregado || cena.choque > 0} id={id} />
      {fundo && <Cabos layout={layout} de={{ x: fimDosFios.x + 10, y: fimDosFios.y - 0.6 }} />}
      {em('atras').map((p) => (
        <Posto key={`${p.av.papel}-b`} p={p} camada="bracos" id={id} />
      ))}
      {em('cabeceira').map((p) => (
        <Posto key={`${p.av.papel}-b`} p={p} camada="bracos" id={id} />
      ))}
      {[...em('pes'), ...em('carrinho'), ...em('frente')].map((p) => (
        <Posto key={p.av.papel} p={p} camada="tudo" id={id} />
      ))}
    </g>
  );
}

// ---- Nomes e balões (em cima de tudo, tamanho de tela fixo) ------------------------------------

const COR_RITMO: Record<FaixaRitmo, string> = { boa: '#22935a', lenta: '#ef7d1a', rapida: '#ef7d1a' };
const TEXTO_RITMO: Record<FaixaRitmo, string> = { boa: '✓', lenta: '▼ lento', rapida: '▲ rápido' };

/** Topo da cabeça do avatar (mundo), para a etiqueta. */
function topoDaCabeca(L: LugarGeo): Ponto {
  return { x: L.x, y: L.y - (ALTURA_AVATAR + 4) * L.escala };
}

interface Etiqueta {
  papel: string;
  x: number;
  y: number;
  nome: string;
  ritmo?: FaixaRitmo;
  balao?: string;
  lider: boolean;
}

function larguraTexto(texto: string, tamanho: number): number {
  return texto.length * tamanho * 0.56;
}

/** Balões que não se encostam: se bater num já posto, sobe. */
function posicionarBaloes(etqs: Etiqueta[]): { e: Etiqueta; x: number; y: number; w: number; h: number; linhas: string[] }[] {
  const r: { e: Etiqueta; x: number; y: number; w: number; h: number; linhas: string[] }[] = [];
  // as etiquetas dos nomes também são obstáculos
  const nomes = etqs.map((e) => {
    const w = Math.max(30, larguraTexto(e.nome, 11.5) + 14);
    return { x: e.x - w / 2, y: e.y - 17, w, h: 17 };
  });
  const comBalao = etqs.filter((e) => e.balao).sort((a, b) => (a.lider === b.lider ? a.x - b.x : a.lider ? -1 : 1));
  for (const e of comBalao) {
    const linhas = quebrarTexto(e.balao!, 22, 3);
    const w = Math.min(190, Math.max(...linhas.map((l) => larguraTexto(l, 11.5))) + 16);
    const h = linhas.length * 13.5 + 9;
    const x = Math.min(LARGURA_CENA - w - 4, Math.max(4, e.x - w / 2));
    let y = e.y - 22 - h;
    for (let i = 0; i < 6; i++) {
      const bate = [...r, ...nomes].find((o) => x < o.x + o.w + 4 && x + w + 4 > o.x && y < o.y + o.h + 3 && y + h + 3 > o.y);
      if (!bate) break;
      y = bate.y - h - 5;
    }
    r.push({ e, x, y: Math.max(2, y), w, h, linhas });
  }
  return r;
}

function Etiquetas({ postos, layout }: { postos: AvatarPosto[]; layout: LayoutFaixa }) {
  const etqs: Etiqueta[] = postos.map(({ av, lugar }) => {
    const t = naTela(layout.camera, topoDaCabeca(lugar));
    const nome = nomeCurto(av.nome) + (av.ritmo ? ` ${TEXTO_RITMO[av.ritmo]}` : '');
    return { papel: av.papel, x: t.x, y: t.y, nome, ...(av.ritmo && { ritmo: av.ritmo }), ...(av.balao && { balao: av.balao }), lider: av.papel === 'lider' };
  });
  const baloes = posicionarBaloes(etqs);
  return (
    <g className="rcp-etiquetas">
      {etqs.map((e) => {
        const w = Math.max(30, larguraTexto(e.nome, 11.5) + 14);
        const cor = e.ritmo ? COR_RITMO[e.ritmo] : '#b99be6';
        return (
          <g key={e.papel} className="rcp-etiqueta" style={{ transform: `translate(${arred(e.x)}px, ${arred(e.y)}px)` }} data-etiqueta={e.papel} {...(e.ritmo && { 'data-ritmo': e.ritmo })}>
            <rect x={-w / 2} y={-17} width={w} height={17} rx={8.5} fill="#ffffff" fillOpacity="0.94" stroke={cor} strokeWidth={e.ritmo ? 2.2 : 1.3} />
            <text x="0" y="-4.6" textAnchor="middle" className="rcp-nome" {...(e.ritmo && e.ritmo !== 'boa' && { fill: '#b45309' })}>
              {e.nome}
            </text>
          </g>
        );
      })}
      {baloes.map(({ e, x, y, w, h, linhas }) => {
        const cauda = Math.min(x + w - 10, Math.max(x + 10, e.x));
        return (
          <g key={`b-${e.papel}`} className={`rcp-balao${e.lider ? ' rcp-balao--lider' : ''}`} data-balao={e.papel}>
            <path
              d={`M ${arred(x + 8)} ${arred(y)} H ${arred(x + w - 8)} Q ${arred(x + w)} ${arred(y)} ${arred(x + w)} ${arred(y + 8)} V ${arred(y + h - 8)} Q ${arred(x + w)} ${arred(y + h)} ${arred(x + w - 8)} ${arred(y + h)} H ${arred(cauda + 5)} L ${arred(e.x)} ${arred(e.y - 19)} L ${arred(cauda - 5)} ${arred(y + h)} H ${arred(x + 8)} Q ${arred(x)} ${arred(y + h)} ${arred(x)} ${arred(y + h - 8)} V ${arred(y + 8)} Q ${arred(x)} ${arred(y)} ${arred(x + 8)} ${arred(y)} Z`}
            />
            <text x={arred(x + w / 2)} y={arred(y + 15)} textAnchor="middle">
              {linhas.map((l, i) => (
                <tspan key={i} x={arred(x + w / 2)} dy={i ? 13.5 : 0}>
                  {l}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Avisos por cima da cena: clarão do choque, "afastem-se" e checagem de ritmo. */
function Avisos({ cena }: { cena: CenaRcp }) {
  return (
    <g className="rcp-avisos">
      {cena.choque > 0 && <rect className="rcp-clarao" x="0" y="0" width={LARGURA_CENA} height={ALTURA_CENA} fill="#ffffff" opacity={arred(Math.min(1, cena.choque) * 0.7)} />}
      {cena.carregado && (
        <g className="rcp-afastem" transform={`translate(${LARGURA_CENA / 2} ${ALTURA_CENA - 34})`}>
          <rect x="-112" y="-17" width="224" height="34" rx="9" fill="#c2413b" stroke="#ffd23f" strokeWidth="3" />
          <text x="0" y="7" textAnchor="middle">
            ⚡ AFASTEM-SE
          </text>
        </g>
      )}
      {cena.checandoRitmo && (
        <g className="rcp-checagem" transform={`translate(${LARGURA_CENA / 2} ${ALTURA_CENA - (cena.carregado ? 76 : 34)})`}>
          <rect x="-96" y="-15" width="192" height="30" rx="15" fill="#2e1450" fillOpacity="0.9" stroke="#b99be6" strokeWidth="1.5" />
          <text x="0" y="5.5" textAnchor="middle">
            🔍 Checagem de ritmo
          </text>
        </g>
      )}
    </g>
  );
}

/** Gradientes comuns da cena (pele dos avatares, dobras da roupa). */
function DefsCena({ id }: { id: (n: string) => string }) {
  return <DefsAvatar id={id} />;
}

// ---- Componentes públicos -------------------------------------------------------------------

/** Desenha a cena da RCP (sem relógio próprio: quem chama monta a cena a cada quadro). */
export function DesenhoCenaRcp({ cena, tamanho = 'normal' }: PropsDesenhoCena) {
  const id = idSvg(useId());
  const layout = layoutDaFaixa(cena.faixa);
  const cam = layout.camera;
  const { postos } = montarMundo(cena);
  return (
    <figure className={`cena-rcp cena-rcp--${tamanho}${cena.ativo ? '' : ' cena-rcp--parada'}`}>
      <svg
        viewBox={`0 0 ${LARGURA_CENA} ${ALTURA_CENA}`}
        role="img"
        aria-label={`Animação da RCP: ${cena.legenda}`}
        data-compressao={cena.compressao.toFixed(2)}
        data-faixa={cena.faixa}
        preserveAspectRatio="xMidYMid meet"
      >
        <DefsCena id={id} />
        <g transform={`scale(${arred(cam.zoom * 1000) / 1000}) translate(${arred(-cam.x)} ${arred(-cam.y)})`}>
          <CamadasMundo cena={cena} id={id} />
        </g>
        <Etiquetas postos={postos} layout={layout} />
        <Avisos cena={cena} />
      </svg>
      <figcaption className="cena-rcp-legenda">{cena.legenda}</figcaption>
    </figure>
  );
}

/** Rosto e ombros do avatar (para escolher a aparência no "Preparar"). */
export function MiniAvatar({ aparencia, tamanho = 56, rotulo }: { aparencia: AparenciaAvatar; tamanho?: number; rotulo?: string }) {
  const id = idSvg(useId());
  const pal = PALETAS[aparencia.pele];
  return (
    <svg className="mini-avatar" viewBox="-30 -214 60 66" width={tamanho} height={tamanho * 1.1} role="img" aria-label={rotulo ?? 'Avatar'}>
      <DefsAvatar id={id} />
      <circle cx="0" cy="-181" r="30" fill="#f6f1fc" />
      {/* ombros com o pijama */}
      <path d="M -27 -150 C -26 -164, -17 -168, -6 -170 L 6 -170 C 17 -168, 26 -164, 27 -150 Z" fill={aparencia.roupa} stroke="#00000026" strokeWidth="0.6" />
      <path d="M -6 -170 L 0 -160 L 6 -170 Z" fill="#00000033" />
      <Cabeca aparencia={aparencia} centro={{ x: 0, y: -189 }} pescoco={{ x: 0, y: -170 }} giro={0} olharBaixo={0} falando={false} id={id} />
      <circle cx="0" cy="-181" r="29.5" fill="none" stroke={pal.contorno} strokeOpacity="0.15" />
    </svg>
  );
}

// ---- Peças avulsas (cada uma no seu <svg>, para o catálogo de imagens) ---------------------------

/** Pedaço do mundo (recorte em coordenadas do mundo), sem câmera. */
export function RecorteCena({ cena, recorte, so, fundo = true, rotulo }: { cena: CenaRcp; recorte: { x: number; y: number; w: number; h: number }; so?: readonly string[]; fundo?: boolean; rotulo: string }) {
  const id = idSvg(useId());
  return (
    <svg className="cena-rcp-recorte" viewBox={`${recorte.x} ${recorte.y} ${recorte.w} ${recorte.h}`} role="img" aria-label={rotulo}>
      <DefsCena id={id} />
      <CamadasMundo cena={cena} id={id} {...(so && { so })} fundo={fundo} />
    </svg>
  );
}

/** Recorte em volta do paciente (com o leito). */
export function recortePaciente(faixa: FaixaPaciente): { x: number; y: number; w: number; h: number } {
  const L = layoutDaFaixa(faixa);
  const c = repousoDe(faixa);
  const x0 = L.leito.x0 - 12;
  const x1 = Math.max(c.perna.ponta.x, c.braco.ponta.x) + 16;
  const topo = c.em(0, c.P.profCabeca * 1.5).y - 6;
  return { x: x0, y: topo, w: Math.max(x1 - x0, 90), h: L.leito.topo + 26 - topo };
}

/** Recorte em volta de um lugar (avatar inteiro e o que ele alcança). */
export function recorteDoLugar(cena: CenaRcp, papel: string, margem = 40): { x: number; y: number; w: number; h: number } {
  const { postos, mundo } = montarMundo(cena);
  const p = postos.find((x) => x.av.papel === papel);
  if (!p) return { x: 0, y: 0, w: LARGURA_CENA, h: ALTURA_CENA };
  const L = p.lugar;
  const alvoX = [L.x - 40 * L.escala, L.x + 40 * L.escala];
  if (p.lugar.camada === 'cabeceira' || p.lugar.camada === 'frente' || p.lugar.camada === 'carrinho' || p.lugar.camada === 'atras') alvoX.push(mundo.corpo.torax.x, mundo.corpo.boca.x);
  if (p.lugar.camada === 'carrinho') alvoX.push(mundo.layout.carrinho.x - 40);
  if (p.lugar.camada === 'frente') alvoX.push(mundo.corpo.tibia.x);
  const x0 = Math.min(...alvoX.filter((x) => Math.abs(x - L.x) < 140)) - margem / 2;
  const x1 = Math.max(...alvoX.filter((x) => Math.abs(x - L.x) < 140)) + margem / 2;
  const topo = L.y - (ALTURA_AVATAR + 12) * L.escala;
  const baixo = Math.min(ALTURA_CENA, L.y + 8);
  return { x: x0, y: topo, w: x1 - x0, h: baixo - topo };
}

function SvgPeca({ viewBox, rotulo, children }: { viewBox: string; rotulo: string; children: ReactNode }) {
  return (
    <svg className="cena-rcp-peca" viewBox={viewBox} role="img" aria-label={rotulo}>
      {children}
    </svg>
  );
}

/** Fundo da sala sozinho (parede, chão, relógio, régua de gases). */
export function PecaFundoSala({ faixa = 'crianca' }: { faixa?: FaixaPaciente }) {
  const id = idSvg(useId());
  const L = layoutDaFaixa(faixa);
  return (
    <SvgPeca viewBox={`0 0 ${LARGURA_CENA} ${ALTURA_CENA}`} rotulo="Fundo da sala de emergência">
      <FundoSala layout={L} id={id} />
    </SvgPeca>
  );
}

/** Maca (ou berço aquecido no RN) vazia. */
export function PecaLeito({ faixa = 'crianca' }: { faixa?: FaixaPaciente }) {
  const id = idSvg(useId());
  const L = layoutDaFaixa(faixa);
  const berco = L.leito.tipo === 'berco';
  const x = L.leito.x0 - 24;
  const w = L.leito.x1 - L.leito.x0 + 48;
  const topo = berco ? 58 : L.leito.topo - 30;
  return (
    <SvgPeca viewBox={`${x} ${topo} ${w} ${L.leito.chao + 6 - topo}`} rotulo={berco ? 'Berço de calor radiante' : 'Maca'}>
      {berco && <BercoFundo leito={L.leito} id={id} />}
      {berco ? <Berco leito={L.leito} /> : <Maca leito={L.leito} />}
    </SvgPeca>
  );
}

/** Carrinho de parada com monitor/desfibrilador. */
export function PecaCarrinho({ carregado = false }: { carregado?: boolean }) {
  const L = layoutDaFaixa('crianca');
  const c = L.carrinho;
  return (
    <SvgPeca viewBox={`${c.x - 48} ${c.topo - 52} 104 ${c.chao - c.topo + 60}`} rotulo="Carrinho de parada com monitor e desfibrilador">
      <Carrinho layout={L} carregado={carregado} choque={0} comprimindo={0.5} rce={false} />
    </SvgPeca>
  );
}

/** Bolsa-válvula-máscara (com a máscara) e a extensão de oxigênio. */
export function PecaBolsa({ aperto = 0, faixa = 'crianca' }: { aperto?: number; faixa?: FaixaPaciente }) {
  const L = layoutDaFaixa(faixa);
  const topo = { x: 70, y: 40 };
  const g = geoBolsa(topo, L.bolsa * 1.6, aperto);
  return (
    <SvgPeca viewBox="0 0 100 70" rotulo="Bolsa-válvula-máscara">
      <BolsaValvulaMascara geo={g} mascara={{ base: [{ x: 58, y: 62 }, { x: 86, y: 60 }], topo: { x: 70, y: 41 } }} />
    </SvgPeca>
  );
}

export function PecaSeringa({ empurrado = 0.3 }: { empurrado?: number }) {
  return (
    <SvgPeca viewBox="0 0 70 24" rotulo="Seringa">
      <Seringa geo={geoSeringa({ x: 6, y: 12 }, 0, 44, empurrado)} largura={8} />
    </SvgPeca>
  );
}

export function PecaPas() {
  return (
    <SvgPeca viewBox="0 0 120 96" rotulo="Pás adesivas do desfibrilador">
      <PasAdesivas />
    </SvgPeca>
  );
}

export function PecaLaringoscopio() {
  return (
    <SvgPeca viewBox="0 -30 60 36" rotulo="Laringoscópio">
      <Laringoscopio ponta={{ x: 4, y: 0 }} angulo={0} tamanho={48} />
    </SvgPeca>
  );
}

/** Exemplos de aparência (um de cada cabelo) para o catálogo. */
export const CABELOS_EXEMPLO: { arquivo: string; titulo: string; aparencia: AparenciaAvatar }[] = [
  { arquivo: 'cabelo-curto', titulo: 'cabelo curto, pele clara, pijama azul', aparencia: { pele: 'claro', cabelo: 'curto', roupa: '#2f6fb3' } },
  { arquivo: 'cabelo-raspado', titulo: 'cabelo raspado, pele negra, pijama cinza', aparencia: { pele: 'negro', cabelo: 'raspado', roupa: '#475569' } },
  { arquivo: 'cabelo-cacheado', titulo: 'cabelo cacheado, pele negra, pijama verde', aparencia: { pele: 'negro', cabelo: 'cacheado', roupa: '#1f8a70' } },
  { arquivo: 'cabelo-longo', titulo: 'cabelo longo, pele clara, pijama rosa', aparencia: { pele: 'claro', cabelo: 'longo', roupa: '#be185d' } },
  { arquivo: 'cabelo-preso', titulo: 'cabelo preso, pele parda, pijama roxo', aparencia: { pele: 'moreno', cabelo: 'preso', roupa: '#6b3fa0' } },
  { arquivo: 'jaleco-branco', titulo: 'jaleco branco, pele parda, cabelo curto', aparencia: { pele: 'moreno', cabelo: 'curto', roupa: '#f1f5f9' } },
];
