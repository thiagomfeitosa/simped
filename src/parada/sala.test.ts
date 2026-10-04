import { describe, expect, it } from 'vitest';
import { PAPEIS_EQUIPE } from '../dados/parada-briefing-a-validar';
import type { EventoParada } from './parada';
import {
  acrescentar,
  briefingDaSala,
  CHAVES,
  cenarioDaSala,
  compressorDaVez,
  continuarRelogio,
  donoDoPapel,
  entrarNaSala,
  membrosDaSala,
  mesclarSalas,
  mudarCampo,
  mudarVelocidade,
  novaSala,
  observadoresDaSala,
  ordemDasTelas,
  papeisDaTela,
  pausarRelogio,
  RELOGIO_PARADO,
  recomecarSala,
  relogioDaSala,
  salaValida,
  tempoDoRelogio,
} from './sala';

const ev = (id: string, tS: number): EventoParada => ({ id, tipo: 'checarRitmo', tS });

describe('relógio do código (igual em todas as telas)', () => {
  it('anda em tempo real, pausa e acelera', () => {
    let r = continuarRelogio(RELOGIO_PARADO, 1000);
    expect(tempoDoRelogio(r, 11_000)).toBe(10);
    r = pausarRelogio(r, 11_000);
    expect(tempoDoRelogio(r, 99_000)).toBe(10);
    r = mudarVelocidade(continuarRelogio(r, 20_000), 2, 20_000);
    expect(tempoDoRelogio(r, 25_000)).toBe(20);
  });
});

describe('sala entre telas', () => {
  it('nome de cada papel: duas telas mudando papéis diferentes ao mesmo tempo não se apagam', () => {
    const base = novaSala('A', 0);
    const b = entrarNaSala(base, 'B', 5);
    const naA = mudarCampo(b, CHAVES.membro('lider'), { nome: 'Ana' }, 'A', 100);
    const naB = mudarCampo(b, CHAVES.membro('medicacao'), { nome: 'Carlos', tela: 'B' }, 'B', 101);
    const juntas = mesclarSalas(naA, naB);
    expect(mesclarSalas(naB, naA)).toEqual(juntas);
    const membros = membrosDaSala(juntas);
    expect(membros.lider).toEqual({ nome: 'Ana' });
    expect(membros.medicacao).toEqual({ nome: 'Carlos', tela: 'B' });
  });
  it('mesmo campo: vale a mudança mais recente', () => {
    const s = novaSala('A', 0);
    const a = mudarCampo(s, CHAVES.cenario, 'fv-escolar', 'A', 100);
    const b = mudarCampo(s, CHAVES.cenario, 'aesp-trauma', 'B', 200);
    expect(cenarioDaSala(mesclarSalas(a, b), 'x')).toBe('aesp-trauma');
    expect(cenarioDaSala(novaSala('A', 0), 'padrao')).toBe('padrao');
  });
  it('eventos de várias telas se juntam sem repetir, em ordem de tempo', () => {
    const s = novaSala('A', 0);
    const a = acrescentar(s, { eventos: [ev('1', 10), ev('3', 30)] }, 1);
    const b = acrescentar(s, { eventos: [ev('2', 20), ev('3', 30)] }, 2);
    expect(mesclarSalas(a, b).eventos.map((e) => e.id)).toEqual(['1', '2', '3']);
  });
  it('sala nova e intocada cede para a sala de outra tela; recomeçar vence a rodada antiga', () => {
    const antiga = mudarCampo(novaSala('A', 0), CHAVES.membro('lider'), { nome: 'Ana' }, 'A', 100);
    const nova = novaSala('B', 500);
    const adotada = mesclarSalas(nova, antiga);
    expect(adotada.geracao).toBe(antiga.geracao);
    expect(Object.keys(adotada.telas).sort()).toEqual(['A', 'B']);
    const recomecada = recomecarSala(acrescentar(antiga, { eventos: [ev('1', 1)] }, 100), 'A', 900);
    expect(recomecada.eventos).toEqual([]);
    expect(membrosDaSala(recomecada).lider?.nome).toBe('Ana');
    expect(mesclarSalas(antiga, recomecada).geracao).toBe(recomecada.geracao);
  });
  it('briefing e relógio pela sala; sala de formato estranho é recusada', () => {
    let s = mudarCampo(novaSala('A', 0), CHAVES.briefing('peso'), true, 'A', 1);
    s = mudarCampo(s, CHAVES.briefing('papeis'), false, 'A', 2);
    expect([...briefingDaSala(s)]).toEqual(['peso']);
    expect(relogioDaSala(s)).toEqual(RELOGIO_PARADO);
    expect(salaValida(s)).toBe(true);
    expect(salaValida({ geracao: 1 })).toBe(false);
    expect(salaValida(null)).toBe(false);
  });
});

describe('papéis em cada tela', () => {
  const s0 = entrarNaSala(novaSala('A', 0), 'B', 10);
  it('sem escolha, todos os papéis ficam na primeira tela aberta', () => {
    const vivas = new Set(['A', 'B']);
    expect(papeisDaTela(s0, 'A', vivas)).toHaveLength(8);
    expect(papeisDaTela(s0, 'B', vivas)).toEqual([]);
  });
  it('papel escolhido em outra tela vai para lá; se a tela fechar, volta para a primeira', () => {
    const s = mudarCampo(s0, CHAVES.membro('medicacao'), { nome: 'Carlos', tela: 'B' }, 'B', 20);
    expect(donoDoPapel(s, 'medicacao', new Set(['A', 'B']))).toBe('B');
    expect(papeisDaTela(s, 'B', new Set(['A', 'B']))).toEqual(['medicacao']);
    expect(donoDoPapel(s, 'medicacao', new Set(['A']))).toBe('A');
  });
  it('compressores revezam a cada ciclo quando o 2º tem nome', () => {
    const vivas = new Set(['A']);
    expect(compressorDaVez(s0, 2, vivas)).toBe('compressor-1');
    const s = mudarCampo(s0, CHAVES.membro('compressor-2'), { nome: 'Bia' }, 'A', 30);
    expect([1, 2, 3].map((c) => compressorDaVez(s, c, vivas))).toEqual(['compressor-1', 'compressor-2', 'compressor-1']);
  });
});

describe('telas que só assistem (professor, telão)', () => {
  // A abriu primeiro e virou telão; B e C são da equipe
  const base = entrarNaSala(entrarNaSala(novaSala('A', 0), 'B', 10), 'C', 20);
  const s = mudarCampo(base, CHAVES.observador('A'), true, 'A', 30);
  const vivas = new Set(['A', 'B', 'C']);
  it('ficam fora da ordem das telas da equipe', () => {
    expect([...observadoresDaSala(s)]).toEqual(['A']);
    expect(ordemDasTelas(s)).toEqual(['B', 'C']);
    expect(ordemDasTelas(s, new Set(['A', 'C']))).toEqual(['C']);
    expect(ordemDasTelas(base)).toEqual(['A', 'B', 'C']);
    // marca antiga (false): volta no lugar de entrada
    expect(ordemDasTelas(mudarCampo(s, CHAVES.observador('A'), false, 'A', 40))).toEqual(['A', 'B', 'C']);
  });
  it('quem deixa de assistir volta no FIM da fila e não toma os papéis da equipe', () => {
    const voltou = mudarCampo(s, CHAVES.observador('A'), 40, 'A', 40);
    expect([...observadoresDaSala(voltou)]).toEqual([]);
    expect(ordemDasTelas(voltou)).toEqual(['B', 'C', 'A']);
    expect(PAPEIS_EQUIPE.every((p) => donoDoPapel(voltou, p.id, vivas) === 'B')).toBe(true);
    // sozinha na sala, faz todos os papéis
    expect(papeisDaTela(voltou, 'A', new Set(['A']))).toHaveLength(8);
  });
  it('nunca fazem papel: sem escolha, os papéis vão para a 1ª tela da equipe', () => {
    expect(PAPEIS_EQUIPE.every((p) => donoDoPapel(s, p.id, vivas) === 'B')).toBe(true);
    expect(papeisDaTela(s, 'A', vivas)).toEqual([]);
    expect(papeisDaTela(s, 'B', vivas)).toHaveLength(8);
  });
  it('papel escolhido numa tela que virou telão vai para a equipe', () => {
    const escolhida = mudarCampo(base, CHAVES.membro('lider'), { nome: 'Ana', tela: 'A' }, 'A', 25);
    expect(donoDoPapel(escolhida, 'lider', vivas)).toBe('A');
    const virouTelao = mudarCampo(escolhida, CHAVES.observador('A'), true, 'A', 30);
    expect(donoDoPapel(virouTelao, 'lider', vivas)).toBe('B');
    // só telões abertos: ninguém faz o papel
    expect(donoDoPapel(virouTelao, 'lider', new Set(['A']))).toBeUndefined();
  });
  it('recomeçar o código mantém quem só assiste', () => {
    const recomecada = recomecarSala(acrescentar(s, { eventos: [ev('1', 1)] }, 50), 'B', 900);
    expect(recomecada.eventos).toEqual([]);
    expect([...observadoresDaSala(recomecada)]).toEqual(['A']);
    expect(ordemDasTelas(recomecada)).toEqual(['B', 'C']);
  });
});
