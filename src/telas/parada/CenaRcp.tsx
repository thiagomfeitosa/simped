/**
 * Desenho da cena da RCP (SVG feito à mão, sem bibliotecas): sala vista de lado e um pouco de cima
 * (3/4), em plano médio — o paciente (maior que o real, é o protagonista) na maca ou no berço aquecido
 * (RN), e a equipe em volta, cada um fazendo o que a cena diz. A câmera enquadra quem está presente.
 * Nomes e balões são arrumados para não se atropelarem (src/ilustracoes/rcp/rotulos.ts) e a letra
 * cresce quando a cena encolhe (celular).
 * Sem relógio próprio: quem chama monta a cena a cada quadro (src/parada/cena.ts → montarCena).
 * Peças do desenho: src/ilustracoes/rcp/.
 */

import { type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react';
import type { AparenciaAvatar, CenaRcp, FaixaPaciente, LugarNaCena } from '../../parada/cena';
import type { FaixaRitmo } from '../../parada/rcp';
import type { Ponto } from '../../ilustracoes/formas';
import { idSvg, PALETAS } from '../../ilustracoes/pele';
import { AvatarRcp, Cabeca, DefsAvatar } from '../../ilustracoes/rcp/AvatarRcp';
import { arred } from '../../ilustracoes/rcp/caminhos';
import { ALTURA_AVATAR, ALTURA_CENA, type Camera, cameraDaCena, corpoDoPaciente, LARGURA_CENA, layoutDaFaixa, type LugarGeo, naTela, nomeCurto } from '../../ilustracoes/rcp/geometria';
import { PacienteRcp } from '../../ilustracoes/rcp/PacienteRcp';
import { arrumarRotulos, type Caixa, caminhoBalao, medidas, type PedidoRotulo } from '../../ilustracoes/rcp/rotulos';
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
  const xFios = P.xifoide + (P.umbigo - P.xifoide) * 0.6;
  const fimDosFios = corpo.em(xFios, corpo.baseTronco(xFios));
  return (
    <g>
      {fundo && <FundoSala layout={layout} id={id} />}
      {fundo && berco && <BercoFundo leito={layout.leito} id={id} />}
      {em('fundo').map((p) => (
        <Posto key={p.av.papel} p={p} camada="tudo" id={id} />
      ))}
      {fundo && <Carrinho layout={layout} carregado={cena.carregado} choque={cena.choque} comprimindo={cena.compressao} rce={cena.rce} />}
      {/* quem cuida do monitor fica ao lado do carrinho, ao fundo (atrás de quem está nos pés do leito) */}
      {em('carrinho').map((p) => (
        <Posto key={p.av.papel} p={p} camada="tudo" id={id} />
      ))}
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
      {fundo && <Cabos layout={layout} de={{ x: fimDosFios.x + 12, y: fimDosFios.y + 1 }} />}
      <PacienteRcp corpo={corpo} pele={cena.pelePaciente} rce={cena.rce} viaAerea={cena.viaAerea} {...(cena.acesso && { acesso: cena.acesso })} pas={cena.carregado || cena.choque > 0} marcas={postos.some((p) => p.av.acao === 'comprimindo')} id={id} />
      {em('atras').map((p) => (
        <Posto key={`${p.av.papel}-b`} p={p} camada="bracos" id={id} />
      ))}
      {em('cabeceira').map((p) => (
        <Posto key={`${p.av.papel}-b`} p={p} camada="bracos" id={id} />
      ))}
      {[...em('pes'), ...em('frente')].map((p) => (
        <Posto key={p.av.papel} p={p} camada="tudo" id={id} />
      ))}
    </g>
  );
}

// ---- Nomes e balões (em cima de tudo, tamanho de tela fixo) ------------------------------------

const COR_RITMO: Record<FaixaRitmo, string> = { boa: '#22935a', lenta: '#ef7d1a', rapida: '#ef7d1a' };
const TEXTO_RITMO: Record<FaixaRitmo, string> = { boa: '✓', lenta: '▼ lento', rapida: '▲ rápido' };
const SIMBOLO_RITMO: Record<FaixaRitmo, string> = { boa: '✓', lenta: '▼', rapida: '▲' };

/** Tamanho da letra dos nomes e balões (unidades do viewBox) para a largura em que a cena aparece. */
export function fonteDaCena(larguraPx: number): number {
  // a cena encolhe com a tela: a letra cresce no desenho para continuar legível (≈ 9 px na tela no celular)
  return 12.5 * Math.min(1.55, Math.max(1, 640 / Math.max(1, larguraPx)));
}

/** Nome do papel encurtado para a etiqueta (quando o aluno não pôs o nome dele). */
const PAPEL_CURTO: Record<string, string> = { 'Ventilação e via aérea': 'Via aérea', 'Acesso e medicações': 'Medicação', 'Monitor e desfibrilador': 'Monitor' };
/** No celular (letra maior), mais curto ainda. */
const PAPEL_CURTISSIMO: Record<string, string> = { 'Compressões 1': 'Compr. 1', 'Compressões 2': 'Compr. 2' };

/** Caixa (na tela) de cada cabeça e do paciente, para os balões não cobrirem ninguém. */
function obstaculos(postos: AvatarPosto[], mundo: Mundo, camera: Camera): { cabecas: Caixa[]; paciente: Caixa } {
  const caixa = (a: Ponto, b: Ponto): Caixa => {
    const p = naTela(camera, a);
    const q = naTela(camera, b);
    return { x: Math.min(p.x, q.x), y: Math.min(p.y, q.y), w: Math.abs(q.x - p.x), h: Math.abs(q.y - p.y) };
  };
  const cabecas = postos.map(({ lugar: L }) => caixa({ x: L.x - 16 * L.escala, y: L.y - (ALTURA_AVATAR + 1) * L.escala }, { x: L.x + 16 * L.escala, y: L.y - (ALTURA_AVATAR - 44) * L.escala }));
  const c = mundo.repouso;
  const topo = Math.min(c.tuboTopo.y, c.naCabeca(0.5, 1).y, c.em(c.P.mamilos, c.P.apTorax * 1.1).y);
  const paciente = caixa({ x: c.em(0, 0).x - 2, y: topo - 4 }, { x: Math.max(c.perna.ponta.x, c.braco.ponta.x) + 2, y: mundo.layout.leito.topo + mundo.layout.leito.meiaProf * 0.5 });
  return { cabecas, paciente };
}

function Etiquetas({ postos, mundo, camera, fonte }: { postos: AvatarPosto[]; mundo: Mundo; camera: Camera; fonte: number }) {
  const compacto = fonte > 15;
  const pedidos: PedidoRotulo[] = postos.map(({ av, lugar }) => ({
    papel: av.papel,
    ancora: naTela(camera, { x: lugar.x, y: lugar.y - (ALTURA_AVATAR + 1) * lugar.escala }),
    nome: nomeCurto((compacto ? PAPEL_CURTISSIMO[av.nome] : undefined) ?? PAPEL_CURTO[av.nome] ?? av.nome, compacto ? 9 : 13) + (av.ritmo ? ` ${(compacto ? SIMBOLO_RITMO : TEXTO_RITMO)[av.ritmo]}` : ''),
    ...(av.balao && { balao: av.balao }),
    prioridade: av.lugar === 'torax' ? 0 : av.papel === 'lider' ? 1 : 2,
  }));
  const { cabecas, paciente } = obstaculos(postos, mundo, camera);
  const { rotulos, baloes } = arrumarRotulos(pedidos, cabecas, paciente, fonte);
  const M = medidas(fonte);
  return (
    <g className="rcp-etiquetas" style={{ fontSize: `${arred(fonte)}px` }}>
      {rotulos.map((r) => {
        const av = postos.find((p) => p.av.papel === r.papel)!.av;
        const cor = av.ritmo ? COR_RITMO[av.ritmo] : '#9b7bd4';
        const { x, y, w, h } = r.caixa;
        const nome = pedidos.find((p) => p.papel === r.papel)!.nome;
        return (
          <g key={r.papel} className="rcp-etiqueta" style={{ transform: `translate(${arred(x)}px, ${arred(y)}px)` }} data-etiqueta={r.papel} {...(av.ritmo && { 'data-ritmo': av.ritmo })}>
            {r.deslocado && <line x1={arred(w / 2)} y1={arred(h)} x2={arred(r.ancora.x - x)} y2={arred(r.ancora.y - y)} stroke={cor} strokeWidth="1" strokeDasharray="2 2" />}
            <rect x="0" y="0" width={arred(w)} height={arred(h)} rx={arred(h / 2)} fill="#ffffff" fillOpacity="0.95" stroke={cor} strokeWidth={av.ritmo ? 2.2 : 1.3} />
            <text x={arred(w / 2)} y={arred(h * 0.72)} textAnchor="middle" className="rcp-nome" {...(av.ritmo && av.ritmo !== 'boa' && { fill: '#b45309' })}>
              {nome}
            </text>
          </g>
        );
      })}
      {baloes.map((b) => {
        const { x, y, w } = b.caixa;
        return (
          <g key={`b-${b.papel}`} className={`rcp-balao${b.papel === 'lider' ? ' rcp-balao--lider' : ''}`} data-balao={b.papel}>
            <path d={caminhoBalao(b.caixa, b.alvo)} />
            <text x={arred(x + w / 2)} y={arred(y + M.folgaBalao * 0.5 + fonte)} textAnchor="middle">
              {b.linhas.map((l, i) => (
                <tspan key={i} x={arred(x + w / 2)} dy={i ? arred(M.linhaBalao) : 0}>
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

/** Avisos por cima da cena: clarão do choque, "afastem-se" e checagem de ritmo (crescem com a letra no celular). */
function Avisos({ cena, escala }: { cena: CenaRcp; escala: number }) {
  const e = arred(escala * 100) / 100;
  const yAfastem = ALTURA_CENA - 6 - 17 * e;
  return (
    <g className="rcp-avisos">
      {cena.choque > 0 && <rect className="rcp-clarao" x="0" y="0" width={LARGURA_CENA} height={ALTURA_CENA} fill="#ffffff" opacity={arred(Math.min(1, cena.choque) * 0.7)} />}
      {cena.carregado && (
        <g className="rcp-afastem" transform={`translate(${LARGURA_CENA / 2} ${arred(yAfastem)}) scale(${e})`}>
          <rect x="-112" y="-17" width="224" height="34" rx="9" fill="#c2413b" stroke="#ffd23f" strokeWidth="3" />
          <text x="0" y="7" textAnchor="middle">
            ⚡ AFASTEM-SE
          </text>
        </g>
      )}
      {cena.checandoRitmo && (
        <g className="rcp-checagem" transform={`translate(${LARGURA_CENA / 2} ${arred(cena.carregado ? yAfastem - 42 * e : ALTURA_CENA - 6 - 15 * e)}) scale(${e})`}>
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
  const ref = useRef<SVGSVGElement>(null);
  const largura = useLargura(ref);
  const { mundo, postos } = montarMundo(cena);
  const cam = cameraDaCena(cena.faixa, postos.map((p) => p.av.lugar));
  return (
    <figure className={`cena-rcp cena-rcp--${tamanho}${cena.ativo ? '' : ' cena-rcp--parada'}`}>
      <svg
        ref={ref}
        viewBox={`0 0 ${LARGURA_CENA} ${ALTURA_CENA}`}
        role="img"
        aria-label={`Animação da RCP: ${cena.legenda}`}
        data-compressao={cena.compressao.toFixed(2)}
        data-faixa={cena.faixa}
        preserveAspectRatio="xMidYMid meet"
      >
        <DefsCena id={id} />
        <g className="rcp-camera" style={{ transform: `scale(${arred(cam.zoom * 1000) / 1000}) translate(${arred(-cam.x)}px, ${arred(-cam.y)}px)` }}>
          <CamadasMundo cena={cena} id={id} />
        </g>
        <Etiquetas postos={postos} mundo={mundo} camera={cam} fonte={fonteDaCena(largura)} />
        <Avisos cena={cena} escala={fonteDaCena(largura) / 12.5} />
      </svg>
      <figcaption className="cena-rcp-legenda">{cena.legenda}</figcaption>
    </figure>
  );
}

/** Largura em que o desenho aparece na tela (px), para a letra dos nomes continuar legível quando encolhe. */
function useLargura(ref: { current: SVGSVGElement | null }): number {
  const [largura, setLargura] = useState(LARGURA_CENA);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setLargura((antes) => (Math.abs(antes - w) > 4 ? w : antes));
    };
    medir();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return largura;
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
  const x0 = L.leito.x0 - 8;
  const x1 = Math.max(c.perna.ponta.x, c.braco.ponta.x, L.leito.x0 + 40) + 14;
  const topo = Math.min(c.naCabeca(0.5, 1).y, c.tuboTopo.y) - 10;
  return { x: x0, y: topo, w: Math.max(x1 - x0, 90), h: L.leito.topo + L.leito.meiaProf + 18 - topo };
}

/** Recorte em volta de um lugar (avatar inteiro e o que ele alcança). */
export function recorteDoLugar(cena: CenaRcp, papel: string, margem = 30): { x: number; y: number; w: number; h: number } {
  const { postos, mundo } = montarMundo(cena);
  const p = postos.find((x) => x.av.papel === papel);
  if (!p) return { x: 0, y: 0, w: LARGURA_CENA, h: ALTURA_CENA };
  const L = p.lugar;
  const c = mundo.corpo;
  const xs = [L.x - 36 * L.escala, L.x + 36 * L.escala];
  // quem mexe no paciente: o recorte pega o paciente inteiro (ou o pedaço onde mexe)
  if (L.camada !== 'fundo' && L.camada !== 'carrinho' && L.camada !== 'pes') xs.push(Math.max(c.em(0, 0).x, L.x - 120), Math.min(c.perna.ponta.x, L.x + 120));
  if (L.camada === 'carrinho') xs.push(mundo.layout.carrinho.x - mundo.layout.carrinho.largura / 2 - 6);
  const x0 = Math.min(...xs) - margem / 2;
  const x1 = Math.max(...xs) + margem / 2;
  const topo = Math.min(L.y - (ALTURA_AVATAR + 12) * L.escala, p.av.acao === 'maos-ao-alto' ? L.y - (ALTURA_AVATAR + 40) * L.escala : Infinity);
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
  const topo = berco ? 58 : L.leito.topo - L.leito.meiaProf - 20;
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
  const e = c.escala;
  return (
    <SvgPeca viewBox={`${arred(c.x - 48 * e)} ${arred(c.topo - 52 * e)} ${arred(104 * e)} ${arred(c.chao - c.topo + 60 * e)}`} rotulo="Carrinho de parada com monitor e desfibrilador">
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
