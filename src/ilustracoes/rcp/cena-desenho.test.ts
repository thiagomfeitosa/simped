import { describe, expect, it } from 'vitest';
import type { AvatarNaCena, CenaRcp, FaixaPaciente, LugarNaCena } from '../../parada/cena';
import { rotulosDaCena } from '../../telas/parada/CenaRcp';
import { ALTURA_AVATAR, ANTEBRACO_AVATAR, BRACO_AVATAR, cameraDaCena, corpoDoPaciente, LARGURA_CENA, layoutDaFaixa, naTela, nomeCurto, quebrarTexto } from './geometria';
import { esqueleto } from './AvatarRcp';
import { lugarDe, type Mundo, poseDe } from './poses';
import { arrumarRotulos, batem, type Caixa, caminhoBalao, dentroDoQuadro, ladoDaPonta, pontaDoBalao, segmentoBate } from './rotulos';

/** Desenho da cena da RCP: o paciente aparece grande, as mãos tocam o tórax e nomes/balões não se atropelam. */

const FAIXAS: FaixaPaciente[] = ['rn', 'lactente', 'crianca', 'adolescente'];
const TECNICA = { rn: 'dois-polegares', lactente: 'dois-polegares', crianca: 'uma-mao', adolescente: 'duas-maos' } as const;
const LUGARES: [string, LugarNaCena][] = [
  ['lider', 'pes'],
  ['compressor-1', 'torax'],
  ['compressor-2', 'espera'],
  ['via-aerea', 'cabeca'],
  ['medicacao', 'acesso'],
  ['monitor', 'desfibrilador'],
  ['tempo', 'tempo'],
  ['registro', 'registro'],
];

function cena(faixa: FaixaPaciente, compressao: number, mudar: Record<string, Partial<AvatarNaCena>> = {}): CenaRcp {
  return {
    faixa,
    tecnica: TECNICA[faixa],
    pelePaciente: 'moreno',
    compressao,
    expansao: 0,
    viaAerea: 'mascara',
    rce: false,
    choque: 0,
    carregado: false,
    checandoRitmo: false,
    ativo: true,
    legenda: '',
    avatares: LUGARES.map(([papel, lugar]) => ({ papel, nome: papel, lugar, acao: papel === 'compressor-1' ? 'comprimindo' : 'parado', fase: compressao, aparencia: { pele: 'claro', cabelo: 'curto', roupa: '#2f6fb3' }, ...mudar[papel] })),
  };
}

function mundo(c: CenaRcp): Mundo {
  return { layout: layoutDaFaixa(c.faixa), corpo: corpoDoPaciente(c.faixa, c.compressao, c.expansao, c.choque), repouso: corpoDoPaciente(c.faixa), cena: c };
}

describe('mãos de quem comprime', () => {
  for (const faixa of FAIXAS) {
    it(`${faixa}: as mãos ficam no tórax (no ponto da compressão) e acompanham o afundamento`, () => {
      for (const compressao of [0, 1]) {
        const c = cena(faixa, compressao);
        const m = mundo(c);
        const av = c.avatares.find((a) => a.papel === 'compressor-1')!;
        const L = lugarDe('torax', m, 0);
        const pose = poseDe(av, L, m);
        const noMundo = (p: { x: number; y: number }) => ({ x: L.x + p.x * L.escala, y: L.y + p.y * L.escala });
        const sk = esqueleto(pose);
        const t = m.corpo.torax;
        let noTorax = 0;
        for (const [mao, ombro] of [
          [pose.maoA, sk.ombroA],
          [pose.maoB, sk.ombroB],
        ] as const) {
          if (!mao || mao.atras || mao.nasCostas) continue;
          const punho = noMundo(mao.alvo);
          // perto do ponto da compressão (a mão tem ~13 de tamanho)
          expect(Math.abs(punho.x - t.x)).toBeLessThan(9);
          expect(Math.abs(punho.y - t.y)).toBeLessThan(10);
          // o braço alcança sem esticar além do possível
          expect(Math.hypot(mao.alvo.x - ombro.x, mao.alvo.y - ombro.y)).toBeLessThanOrEqual(BRACO_AVATAR + ANTEBRACO_AVATAR + 0.5);
          noTorax++;
        }
        // uma mão na criança; as duas no adolescente (uma sobre a outra) e nos bebês (dois polegares)
        expect(noTorax).toBe(TECNICA[faixa] === 'uma-mao' ? 1 : 2);
      }
    });
  }

  it('o tórax afunda de verdade na compressão (cerca de 1/3 do diâmetro, um pouco exagerado no desenho)', () => {
    for (const faixa of FAIXAS) {
      const solto = corpoDoPaciente(faixa, 0);
      const fundo = corpoDoPaciente(faixa, 1);
      const ap = solto.P.apTorax * solto.k;
      expect(fundo.torax.y - solto.torax.y).toBeGreaterThan(ap * 0.3);
      expect(fundo.torax.y - solto.torax.y).toBeLessThan(ap * 0.45);
    }
  });
});

describe('enquadramento', () => {
  for (const faixa of FAIXAS) {
    it(`${faixa}: o paciente é o protagonista (ocupa boa parte da largura) e todos cabem no quadro`, () => {
      const c = cena(faixa, 0);
      const m = mundo(c);
      const cam = cameraDaCena(faixa, c.avatares.map((a) => a.lugar));
      const cabeca = naTela(cam, m.corpo.em(0, 0));
      const pe = naTela(cam, m.corpo.perna.ponta);
      expect((pe.x - cabeca.x) / LARGURA_CENA).toBeGreaterThan(0.25);
      for (const a of c.avatares) {
        const L = lugarDe(a.lugar, m, 0);
        const p = naTela(cam, { x: L.x, y: L.y - 200 * L.escala });
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(LARGURA_CENA);
        expect(p.y).toBeGreaterThan(0);
      }
    });
  }
});

describe('nomes e balões', () => {
  const paciente: Caixa = { x: 250, y: 220, w: 300, h: 70 };
  for (const fonte of [12.5, 19]) {
    it(`não se atropelam, não saem do quadro e o balão não cobre o paciente (letra ${fonte})`, () => {
      // cabeças lado a lado, algumas bem juntas, todos falando
      const xs = [40, 120, 175, 300, 360, 470, 520, 640, 700, 760];
      const pedidos = xs.map((x, i) => ({
        papel: `p${i}`,
        ancora: { x, y: 120 + (i % 3) * 12 },
        nome: `Pessoa ${i}`,
        ...(i % 2 === 0 && { balao: i % 4 ? 'Adrenalina 0,8 mL feita!' : '2 minutos: checar o ritmo e trocar!' }),
        prioridade: i === 3 ? 0 : 2,
      }));
      const cabecas = pedidos.map((p) => ({ x: p.ancora.x - 16, y: p.ancora.y, w: 32, h: 40 }));
      const { rotulos, baloes } = arrumarRotulos(pedidos.slice(0, fonte > 15 ? 6 : 10), cabecas.slice(0, fonte > 15 ? 6 : 10), paciente, fonte);
      expect(baloes.length).toBeGreaterThanOrEqual(3);
      const caixas = [...rotulos.map((r) => r.caixa), ...baloes.map((b) => b.caixa)];
      for (const c of caixas) expect(dentroDoQuadro(c)).toBe(true);
      for (let i = 0; i < caixas.length; i++) for (let j = i + 1; j < caixas.length; j++) expect(batem(caixas[i]!, caixas[j]!, 0)).toBe(false);
      for (const b of baloes) expect(batem(b.caixa, paciente, 0)).toBe(false);
    });
  }
});

describe('ponta do balão', () => {
  it('sai do lado de quem fala: de cima quando a etiqueta está acima do balão', () => {
    const balao = { x: 500, y: 165, w: 160, h: 50 };
    expect(ladoDaPonta(balao, { x: 635, y: 52 })).toBe('cima');
    expect(ladoDaPonta(balao, { x: 560, y: 260 })).toBe('baixo');
    expect(ladoDaPonta(balao, { x: 480, y: 190 })).toBe('esquerda');
    expect(ladoDaPonta(balao, { x: 690, y: 190 })).toBe('direita');
    // a ponta de cima sobe até perto do alvo (antes ela descia, para longe de quem fala)
    expect(caminhoBalao(balao, { x: 635, y: 52 })).toContain('L 635 53');
  });
  it('quem fala encostado no alto do quadro (letra grande): a ponta aponta para a sua etiqueta e o balão não cobre o próprio rosto', () => {
    const paciente: Caixa = { x: 200, y: 230, w: 400, h: 70 };
    const fonte = 19.4;
    const xs = [60, 180, 300, 420, 540, 660, 750];
    const pedidos = xs.map((x, i) => ({ papel: `p${i}`, ancora: { x, y: 34 }, nome: `Nome ${i}`, ...(i === 6 && { balao: 'Hora da adrenalina!' }), prioridade: 2 }));
    const cabecas = pedidos.map((p) => ({ x: p.ancora.x - 20, y: p.ancora.y, w: 40, h: 50 }));
    const { rotulos, baloes } = arrumarRotulos(pedidos, cabecas, paciente, fonte);
    const b = baloes[0]!;
    const et = rotulos.find((r) => r.papel === b.papel)!.caixa;
    expect(batem(b.caixa, cabecas[6]!, 0)).toBe(false);
    const lado = ladoDaPonta(b.caixa, b.alvo);
    if (lado === 'cima') expect(b.alvo.y).toBeLessThanOrEqual(b.caixa.y);
    if (lado === 'baixo') expect(b.alvo.y).toBeGreaterThanOrEqual(b.caixa.y + b.caixa.h);
    // a ponta aponta para a etiqueta de quem fala ou para o queixo dele
    const pertoDaEtiqueta = b.alvo.x >= et.x - 1 && b.alvo.x <= et.x + et.w + 1;
    const noQueixo = Math.abs(b.alvo.y - (cabecas[6]!.y + cabecas[6]!.h)) < 1;
    expect(pertoDaEtiqueta || noQueixo).toBe(true);
  });
});

describe('equipe completa no celular (letra grande)', () => {
  const NOMES: Record<string, string> = { lider: 'Ana', 'compressor-1': 'Bruno', 'compressor-2': 'Maria', 'via-aerea': 'Carla', medicacao: 'Daniela', monitor: 'Eduardo', tempo: 'Felipe', registro: 'Gabriela' };
  const comNomes = (faixa: FaixaPaciente, mudar: Record<string, Partial<AvatarNaCena>>): CenaRcp => {
    const c = cena(faixa, 0, mudar);
    return { ...c, avatares: c.avatares.map((a) => ({ ...a, nome: NOMES[a.papel]!, acao: mudar[a.papel]?.acao ?? (a.papel === 'compressor-1' ? 'maos-no-torax' : 'parado') })) };
  };
  // os momentos mais cheios: aviso do tempo + checagem; aviso + carga; ordem do líder + "entendido" + aviso
  const MOMENTOS: [string, Record<string, Partial<AvatarNaCena>>][] = [
    ['aviso e checagem', { tempo: { balao: '2 minutos: checar o ritmo e trocar!' }, monitor: { balao: 'Checando o ritmo…', acao: 'olhando-monitor' } }],
    ['aviso e carga', { tempo: { balao: '2 minutos: checar o ritmo e trocar!' }, monitor: { balao: 'Carregando 40\u00a0J… Afastem-se!', acao: 'carregando' } }],
    ['três falas', { lider: { balao: 'Eduardo: Chocar' }, monitor: { balao: 'Entendido!' }, tempo: { balao: 'Hora da adrenalina!' } }],
  ];
  for (const faixa of FAIXAS) {
    for (const [momento, mudar] of MOMENTOS) {
      it(`${faixa}, ${momento}: nenhum balão encosta num nome nem em outro balão, e a ponta é curta, larga e à vista`, () => {
        const { rotulos, baloes, paciente } = rotulosDaCena(comNomes(faixa, mudar), 19.4);
        expect(baloes).toHaveLength(Object.keys(mudar).length);
        for (const b of baloes) {
          expect(dentroDoQuadro(b.caixa)).toBe(true);
          expect(batem(b.caixa, paciente, 0)).toBe(false);
          for (const r of rotulos) expect(batem(b.caixa, r.caixa, 0), `${b.papel} × nome de ${r.papel}`).toBe(false);
          const pt = pontaDoBalao(b.caixa, b.alvo);
          // perto de quem fala (antes chegava a 170; um avatar tem ~60 de largura aqui) e nunca uma agulha
          expect(pt.comprimento).toBeLessThan(60);
          expect(pt.meia * 2).toBeGreaterThanOrEqual(Math.min(10, pt.comprimento * 0.3));
          for (const o of baloes) {
            if (o === b) continue;
            expect(batem(b.caixa, o.caixa, 0), `${b.papel} × balão de ${o.papel}`).toBe(false);
            // a ponta não passa por baixo (nem por cima) do balão de outro
            expect(segmentoBate(pt.base, pt.ponta, o.caixa, 0), `ponta de ${b.papel} × balão de ${o.papel}`).toBe(false);
          }
        }
      });
    }
  }
});

describe('ponta comprida', () => {
  it('sai do lado que fica de frente para quem fala e a base alarga com o comprimento', () => {
    const balao = { x: 100, y: 100, w: 160, h: 40 };
    // quem fala bem à direita e um pouco abaixo: a ponta sai do lado direito (antes saía de baixo, quase deitada)
    const alvo = { x: 330, y: 150 };
    expect(ladoDaPonta(balao, alvo)).toBe('direita');
    const pt = pontaDoBalao(balao, alvo);
    expect(pt.meia).toBeGreaterThan(5);
    const curta = pontaDoBalao(balao, { x: 180, y: 150 });
    expect(curta.lado).toBe('baixo');
    expect(curta.meia).toBe(5);
    expect(caminhoBalao(balao, alvo)).toContain('L 328 150');
  });
});

describe('textos', () => {
  it('a dose não se separa da unidade na quebra de linha', () => {
    // "2" cabia no fim da 1ª linha e "mL" ia para a 2ª
    expect(quebrarTexto('Daniela: Adrenalina: 2 mL', 21)).toEqual(['Daniela: Adrenalina:', '2 mL']);
    expect(quebrarTexto('Carregando 40\u00a0J… Afastem-se!', 14)).toEqual(['Carregando', '40\u00a0J…', 'Afastem-se!']);
    expect(quebrarTexto('2 minutos: checar o ritmo e trocar!', 17)).toEqual(['2 minutos: checar', 'o ritmo e trocar!']);
  });
  it('nome composto que não cabe fica com as palavras inteiras (sem cortar no meio)', () => {
    expect(nomeCurto('Ana Beatriz', 9)).toBe('Ana');
    expect(nomeCurto('Maria Eduarda', 9)).toBe('Maria');
    expect(nomeCurto('Ana Beatriz Souza', 13)).toBe('Ana Beatriz');
    expect(nomeCurto('Maria de Fátima', 9)).toBe('Maria');
    expect(nomeCurto('Bruno', 9)).toBe('Bruno');
    // só corta quando nem o primeiro nome cabe
    expect(nomeCurto('Bartholomeu', 9)).toBe('Bartholo…');
  });
});

describe('carrinho', () => {
  for (const faixa of FAIXAS) {
    it(`${faixa}: a cabeça do líder (nos pés do leito) não tapa a tela do desfibrilador`, () => {
      const L = layoutDaFaixa(faixa);
      const lider = L.lugares.pes;
      const cabeca = { x: lider.x - 16 * lider.escala, y: lider.y - (ALTURA_AVATAR + 1) * lider.escala, w: 32 * lider.escala, h: 45 * lider.escala };
      const e = L.carrinho.escala;
      const tela = { x: L.carrinho.tela.x - 20 * e, y: L.carrinho.tela.y - 12 * e, w: 40 * e, h: 24 * e };
      expect(batem(cabeca, tela, 0)).toBe(false);
    });
  }
});
