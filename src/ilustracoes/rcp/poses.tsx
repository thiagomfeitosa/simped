/**
 * Onde fica cada avatar e como está o corpo dele (mãos, olhar, objetos) para a ação da cena.
 * Sem tela própria: devolve a pose que o AvatarRcp desenha.
 */

import type { AvatarNaCena, CenaRcp, LugarNaCena } from '../../parada/cena';
import { lerp, type Ponto } from '../formas';
import { esqueleto, type FormaMao, type MaoPose, maoSolta, type PoseAvatar } from './AvatarRcp';
import { ANTEBRACO_AVATAR, alcanceCompressao, BRACO_AVATAR, type CorpoPaciente, desvioDoCompressor, DISTANCIA_LADO_A_LADO, type LayoutFaixa, type LugarGeo, OMBRO_AVATAR } from './geometria';
import { pontoDeInjecao } from './PacienteRcp';
import { BolsaValvulaMascara, Caneta, CateterNaMao, Cronometro, FuradeiraIO, geoBolsa, geoSeringa, Laringoscopio, Prancheta, Seringa, TuboNaMao } from './Pecas';

export interface Mundo {
  layout: LayoutFaixa;
  /** Paciente agora e em repouso (sem compressão: os lugares não pulam a cada compressão). */
  corpo: CorpoPaciente;
  repouso: CorpoPaciente;
  cena: CenaRcp;
}

export interface AvatarPosto {
  av: AvatarNaCena;
  lugar: LugarGeo;
  pose: PoseAvatar;
}

/** Recuo do punho até o ponto de contato da mão (a mão fica entre os dois). */
const RECUO = 8;
const ALCANCE = BRACO_AVATAR + ANTEBRACO_AVATAR;

/** Acesso usado quando a cena ainda não diz qual (bebês: intraósseo; maiores: periférico). */
export function acessoDaCena(m: Mundo): 'periferico' | 'intraosseo' {
  return m.cena.acesso ?? (m.cena.faixa === 'rn' || m.cena.faixa === 'lactente' ? 'intraosseo' : 'periferico');
}

/** Contato da mão no mundo para a punção (antes do acesso existir). */
function sitioDoAcesso(m: Mundo): Ponto {
  return acessoDaCena(m) === 'intraosseo' ? m.corpo.tibia : m.corpo.periferico;
}

/** Lugar de cada um no mundo (com o compressor na altura certa para a técnica). */
export function lugarDe(lugar: LugarNaCena, m: Mundo, repetido: number): LugarGeo {
  const L = m.layout.lugares[lugar];
  const base: LugarGeo = { ...L };
  if (lugar === 'torax') {
    const t = m.repouso.torax;
    const tec = m.cena.tecnica;
    const punho = t.y - (tec === 'dois-polegares' ? 2.5 : 7);
    base.x = t.x + desvioDoCompressor(tec);
    // articulação do ombro fica 4 abaixo do alto do ombro (tudo na escala do avatar)
    base.y = punho + (OMBRO_AVATAR - 4 - alcanceCompressao(tec)) * base.escala;
  }
  if (lugar === 'acesso') {
    const s = acessoDaCena(m) === 'intraosseo' ? m.repouso.tibia : m.repouso.periferico;
    base.x = Math.max(s.x + 8, lugarDe('torax', m, 0).x + DISTANCIA_LADO_A_LADO);
  }
  // o 2º compressor fica sempre depois de quem pega o acesso (sem encostar)
  if (lugar === 'espera' && L.x > m.layout.lugares.torax.x) base.x = Math.max(L.x, lugarDe('acesso', m, 0).x + DISTANCIA_LADO_A_LADO - 4);
  if (repetido > 0) base.x += repetido * 34 * (lugar === 'pes' || lugar === 'desfibrilador' ? 1 : -1);
  return base;
}

interface Intencao {
  /** Ponto que a mão toca (local). */
  contato: Ponto;
  forma: FormaMao;
  cotovelo: 1 | -1;
  /** O punho fica exatamente no contato (mão de frente no tórax, mãos para o alto). */
  direto?: boolean;
  angulo?: number;
  recuo?: number;
}

function resolver(i: Intencao, ombro: Ponto): MaoPose {
  if (i.direto) return { alvo: i.contato, forma: i.forma, cotovelo: i.cotovelo, ...(i.angulo !== undefined && { angulo: i.angulo }) };
  const dx = i.contato.x - ombro.x;
  const dy = i.contato.y - ombro.y;
  const d = Math.hypot(dx, dy) || 1;
  const r = i.recuo ?? RECUO;
  return {
    alvo: { x: i.contato.x - (dx / d) * r, y: i.contato.y - (dy / d) * r },
    forma: i.forma,
    cotovelo: i.cotovelo,
    angulo: i.angulo ?? (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

/** Monta a pose do avatar para a ação dele. */
export function poseDe(av: AvatarNaCena, L: LugarGeo, m: Mundo): PoseAvatar {
  const { corpo, layout, cena } = m;
  const e = L.escala;
  const loc = (p: Ponto): Ponto => ({ x: (p.x - L.x) / e, y: (p.y - L.y) / e });
  /** Objetos desenhados no mundo, dentro do grupo do avatar. */
  const noMundo = (filhos: React.ReactNode) => <g transform={`scale(${1 / e}) translate(${-L.x} ${-L.y})`}>{filhos}</g>;
  const atrasDaMaca = L.camada === 'atras';
  const luvas = L.camada === 'atras' || L.camada === 'cabeceira' || L.camada === 'frente';
  const pose: PoseAvatar = {
    giro: L.giro,
    giroCabeca: L.giro,
    olharBaixo: 0.15,
    corpo: { x: 0, y: 0 },
    inclina: { x: 0, y: 0 },
    falando: !!av.balao,
    luvas,
  };
  let A: Intencao | undefined;
  let B: Intencao | undefined;
  let soltaAtras = atrasDaMaca;
  /** A mão B fica nas costas (técnica de uma mão). */
  let maoNasCostas = false;
  let curvar = L.camada === 'cabeceira' || L.camada === 'frente' || av.lugar === 'acesso';
  /** Curvatura mínima do tronco (quem trabalha na cabeceira se debruça sobre o rosto). */
  let inclinaMin: Ponto | undefined;
  const fase = Math.min(1, Math.max(0, av.fase));
  const olharMonitor = () => Math.sign(layout.carrinho.tela.x - L.x) * 0.75;

  switch (av.acao) {
    case 'comprimindo':
    case 'maos-no-torax': {
      const t = loc(corpo.torax);
      pose.corpo = { x: 0, y: (corpo.torax.y - m.repouso.torax.y) / e };
      pose.olharBaixo = 1;
      pose.giro = 0;
      pose.giroCabeca = 0;
      curvar = false;
      if (cena.tecnica === 'duas-maos') {
        // uma mão sobre a outra, dedos entrelaçados, no terço inferior do esterno
        A = { contato: { x: t.x - 0.6, y: t.y - 7 }, forma: 'apoiada', cotovelo: 1, direto: true, angulo: 180 };
        B = { contato: { x: t.x + 0.6, y: t.y - 8.6 }, forma: 'apoiada', cotovelo: -1, direto: true, angulo: 0 };
      } else if (cena.tecnica === 'uma-mao') {
        // uma mão no esterno; a outra nas costas (fora do paciente)
        A = { contato: { x: t.x, y: t.y - 7 }, forma: 'apoiada', cotovelo: 1, direto: true, angulo: 180 };
        maoNasCostas = true;
      } else {
        // polegares lado a lado no esterno; o dorso das mãos e os dedos descem pelo flanco (envolvem o tórax)
        A = { contato: { x: t.x - 6.4, y: t.y - 1.4 }, forma: 'envolvendo', cotovelo: 1, direto: true, angulo: 0 };
        B = { contato: { x: t.x + 6.4, y: t.y - 1.2 }, forma: 'envolvendo', cotovelo: -1, direto: true, angulo: 180 };
      }
      break;
    }
    case 'ventilando':
    case 'segurando-mascara': {
      const tubo = cena.viaAerea === 'tubo';
      const conexao = tubo ? corpo.tuboTopo : corpo.mascaraTopo;
      const bolsa = geoBolsa(conexao, layout.bolsa, av.acao === 'ventilando' ? fase : 0);
      // com tubo, segura o tubo perto da conexão (a boca e a fixação ficam à vista); com máscara, a mão em "C" em cima da máscara
      const pegaMascara = tubo ? { x: corpo.tuboTopo.x + 0.5, y: lerp(corpo.tuboTopo.y, corpo.boca.y, 0.3) } : { x: corpo.mascara.x + 1, y: corpo.mascaraTopo.y + 2 };
      const longe = L.giro >= 0 ? 'B' : 'A';
      const mascara: Intencao = { contato: loc(pegaMascara), forma: 'fechada', cotovelo: 1, recuo: 6 };
      const aperta: Intencao = { contato: loc({ x: bolsa.pega.x, y: bolsa.pega.y + 1 }), forma: 'fechada', cotovelo: 1, recuo: 6 };
      if (longe === 'B') [B, A] = [mascara, aperta];
      else [A, B] = [mascara, aperta];
      pose.olharBaixo = 0.7;
      inclinaMin = { x: 12, y: 13 };
      pose.objetos = noMundo(<BolsaValvulaMascara geo={bolsa} {...(!tubo && { mascara: { base: corpo.mascaraBase, topo: corpo.mascaraTopo } })} oxigenio={layout.oxigenio} />);
      break;
    }
    case 'intubando': {
      const t = layout.bolsa * 0.95;
      const ponta = { x: corpo.boca.x + 1.5, y: corpo.boca.y + 1.5 };
      const ang = -72;
      const r = (ang * Math.PI) / 180;
      const cabo = { x: ponta.x + Math.cos(r) * t * 0.86, y: ponta.y + Math.sin(r) * t * 0.86 };
      const tuboPonta = { x: corpo.boca.x - 1.5, y: corpo.boca.y - 2 - (1 - fase) * 9 };
      const tuboFim = { x: tuboPonta.x - t * 0.5, y: tuboPonta.y - t * 0.22 };
      B = { contato: loc(cabo), forma: 'fechada', cotovelo: 1, recuo: 5 };
      A = { contato: loc(tuboFim), forma: 'fechada', cotovelo: 1, recuo: 5 };
      pose.olharBaixo = 0.9;
      pose.giroCabeca = Math.max(L.giro, 0.75);
      inclinaMin = { x: 15, y: 17 };
      pose.objetos = noMundo(
        <>
          <Laringoscopio ponta={ponta} angulo={ang} tamanho={t} />
          <TuboNaMao ponta={tuboPonta} fim={tuboFim} />
        </>,
      );
      break;
    }
    case 'puncionando': {
      const s = sitioDoAcesso(m);
      if (acessoDaCena(m) === 'intraosseo') {
        const tam = Math.max(13, layout.bolsa * 0.6);
        const ponta = { x: s.x, y: s.y - (1 - fase) * 5 };
        A = { contato: loc({ x: ponta.x + 1, y: ponta.y - tam * 0.72 }), forma: 'fechada', cotovelo: -1, recuo: 4 };
        B = { contato: loc({ x: s.x + 9, y: s.y - 1 }), forma: 'aberta', cotovelo: -1, recuo: 7 };
        pose.objetos = noMundo(<FuradeiraIO ponta={ponta} tamanho={tam} />);
      } else {
        const ponta = { x: s.x - 0.5 - fase * 2.5, y: s.y + fase * 0.6 };
        const pega = { x: ponta.x + 9.5, y: ponta.y - 3.5 };
        A = { contato: loc(pega), forma: 'fechada', cotovelo: -1, recuo: 4 };
        // a outra mão firma o membro (punho nos maiores, pé nos bebês)
        const firma = corpo.P.rosto === 'bebe' ? { x: corpo.perna.ponta.x - 2, y: corpo.perna.ponta.y + 2 } : { x: corpo.braco.punho.x + 3, y: corpo.braco.punho.y - 1 };
        B = { contato: loc(firma), forma: 'aberta', cotovelo: -1, recuo: 7 };
        pose.objetos = noMundo(<CateterNaMao ponta={ponta} angulo={-160} />);
      }
      pose.olharBaixo = 1;
      pose.giroCabeca = Math.min(L.giro, -0.8);
      break;
    }
    case 'injetando': {
      const io = acessoDaCena(m) === 'intraosseo';
      const p = pontoDeInjecao(corpo, acessoDaCena(m));
      const ang = io ? -66 : -30;
      const comp = Math.max(20, layout.bolsa * 0.75);
      const geo = geoSeringa(p, ang, comp, fase);
      const meio = { x: lerp(p.x, geo.aba.x, 0.55), y: lerp(p.y, geo.aba.y, 0.55) };
      A = { contato: loc(meio), forma: 'fechada', cotovelo: -1, recuo: 5 };
      B = { contato: loc(geo.embolo), forma: 'fechada', cotovelo: -1, recuo: 5 };
      pose.olharBaixo = 1;
      pose.giroCabeca = Math.min(L.giro, -0.8);
      pose.objetos = noMundo(<Seringa geo={geo} largura={Math.max(4, comp * 0.2)} />);
      break;
    }
    case 'carregando':
    case 'chocando': {
      const c = layout.carrinho;
      const botao = av.acao === 'carregando' ? c.botaoCarga : { x: c.botaoChoque.x, y: c.botaoChoque.y + 0.8 };
      const longe = L.giro < 0 ? 'A' : 'B';
      const dedo: Intencao = { contato: loc(botao), forma: 'apontando', cotovelo: -1, recuo: 14 };
      if (longe === 'A') A = dedo;
      else B = dedo;
      pose.giroCabeca = av.acao === 'carregando' ? -0.9 : -0.8;
      pose.olharBaixo = 0.25;
      break;
    }
    case 'maos-ao-alto': {
      const sk = esqueleto(pose);
      A = { contato: { x: sk.tc - sk.sw - 7, y: -OMBRO_AVATAR - 32 + pose.corpo.y }, forma: 'aberta', cotovelo: -1, direto: true, angulo: -98 };
      B = { contato: { x: sk.tc + sk.sw + 7, y: -OMBRO_AVATAR - 32 + pose.corpo.y }, forma: 'aberta', cotovelo: 1, direto: true, angulo: -82 };
      pose.olharBaixo = 0;
      soltaAtras = false;
      curvar = false;
      break;
    }
    case 'olhando-monitor':
      pose.giroCabeca = olharMonitor();
      pose.olharBaixo = 0;
      break;
    case 'cronometrando': {
      const sk = esqueleto(pose);
      // segura com a mão do lado de cá, na frente do peito, e olha para ele
      const s = Math.sign(L.giro || 1);
      const centro = { x: sk.tc + s * 9, y: -152 };
      const segura: Intencao = { contato: { x: centro.x - s * 1, y: centro.y + 5.5 }, forma: 'fechada', cotovelo: s > 0 ? 1 : -1, recuo: 8 };
      if (s > 0) A = segura;
      else B = segura;
      pose.olharBaixo = 0.8;
      pose.giroCabeca = L.giro * 0.5;
      pose.objetos = <Cronometro centro={centro} r={5.4} />;
      break;
    }
    case 'anotando': {
      const sk = esqueleto(pose);
      const centro = { x: sk.tc + L.giro * 8, y: -128 };
      const caneta = { x: centro.x - 2 + Math.sin(fase * 12) * 2.5, y: centro.y + 1 };
      B = { contato: { x: centro.x + 7, y: centro.y + 5 }, forma: 'fechada', cotovelo: -1, recuo: 6 };
      A = { contato: { x: caneta.x + 3, y: caneta.y + 2 }, forma: 'fechada', cotovelo: 1, recuo: 6 };
      pose.olharBaixo = 1;
      pose.giroCabeca = L.giro * 0.6;
      pose.objetos = (
        <>
          <Prancheta centro={centro} angulo={-8} tamanho={22} />
          <Caneta ponta={caneta} angulo={-50} />
        </>
      );
      break;
    }
    case 'parado':
    default:
      if (av.balao && av.papel === 'lider') {
        const sk = esqueleto(pose);
        const longe = L.giro <= 0 ? 'A' : 'B';
        const s = longe === 'A' ? -1 : 1;
        const aponta: Intencao = { contato: { x: sk.tc + s * 46, y: -170 }, forma: 'apontando', cotovelo: s < 0 ? -1 : 1, recuo: 13 };
        if (longe === 'A') A = aponta;
        else B = aponta;
        pose.olharBaixo = 0.1;
      }
      break;
  }

  // tronco curvado quando a mão não alcança (quem ventila, quem pega o acesso)
  const sk0 = esqueleto(pose);
  if (curvar) {
    let soma = { x: 0, y: 0 };
    let falta = 0;
    for (const [i, ombro] of [
      [A, sk0.ombroA],
      [B, sk0.ombroB],
    ] as const) {
      if (!i || i.direto) continue;
      const dx = i.contato.x - ombro.x;
      const dy = i.contato.y - ombro.y;
      const d = Math.hypot(dx, dy);
      const sobra = d - ALCANCE * 0.86 + (i.recuo ?? RECUO) * 0.3;
      if (sobra > falta) falta = sobra;
      soma = { x: soma.x + dx / d, y: soma.y + dy / d };
    }
    if (falta > 0) {
      const n = Math.hypot(soma.x, soma.y) || 1;
      const k = Math.min(30, falta);
      pose.inclina = { x: (soma.x / n) * k, y: (soma.y / n) * k * 0.9 };
    }
  }
  if (inclinaMin && Math.hypot(pose.inclina.x, pose.inclina.y) < Math.hypot(inclinaMin.x, inclinaMin.y)) pose.inclina = inclinaMin;
  const sk = esqueleto(pose);
  if (A) pose.maoA = resolver(A, sk.ombroA);
  if (B) pose.maoB = resolver(B, sk.ombroB);
  if (maoNasCostas) pose.maoB = { alvo: { x: sk.tc + 4, y: sk.cintura.y + 6 }, forma: 'fechada', cotovelo: -1, nasCostas: true };
  // mão parada de quem está atrás da maca fica atrás (não aparece por cima do paciente)
  if (soltaAtras) {
    if (!pose.maoA) pose.maoA = { ...maoSolta(pose, 'A'), atras: true };
    if (!pose.maoB) pose.maoB = { ...maoSolta(pose, 'B'), atras: true };
  }
  return pose;
}
