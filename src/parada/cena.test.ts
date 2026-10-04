import { describe, expect, it } from 'vitest';
import { CENARIOS_PARADA, type CenarioParada } from '../dados/parada-a-validar';
import { PAPEIS_EQUIPE } from '../dados/parada-briefing-a-validar';
import { TEMPOS_CENA as T } from '../dados/parada-cena-a-validar';
import { afundamento, aparenciaDoMembro, aparenciaPadrao, type CenaRcp, type EntradaCena, faixaDoPaciente, montarCena } from './cena';
import { estadoDaParada, type EventoParada } from './parada';
import { estadoRcp, type MarcaRcp } from './rcp';
import { aparenciaValida, type Membro } from './sala';

const cenario = (id: string) => CENARIOS_PARADA.find((c) => c.id === id)!;
const semNomes: Record<string, Membro> = Object.fromEntries(PAPEIS_EQUIPE.map((p) => [p.id, { nome: '' }]));
const INICIAR: EventoParada = { id: 'i', tipo: 'iniciar', tS: 0, por: 'lider' };

/** Entrada como a tela monta (estado e RCP calculados no mesmo tS). */
function entrada(o: {
  tS: number;
  cenario?: CenarioParada;
  eventos?: EventoParada[];
  marcas?: MarcaRcp[];
  membros?: Record<string, Membro>;
  teclas?: boolean;
  compressorDaVez?: 'compressor-1' | 'compressor-2';
  pausado?: boolean;
}): EntradaCena {
  const c = o.cenario ?? cenario('fv-escolar');
  const eventos = o.eventos ?? [INICIAR];
  const marcas = o.marcas ?? [];
  const estado = estadoDaParada(c, eventos, o.tS);
  const relacao = c.relacaoCompressaoVentilacao ?? 15;
  const recomecosS = eventos.filter((e) => e.tipo === 'checarRitmo' || e.tipo === 'choque').map((e) => e.tS);
  const rcp = o.teclas === false ? null : estadoRcp(marcas, { relacao, recomecosS, ...(estado.viaAvancadaS !== undefined && { viaAvancadaS: estado.viaAvancadaS }) }, o.tS);
  return { cenario: c, eventos, marcas, tS: o.tS, membros: { ...semNomes, ...o.membros }, estado, rcp, relacao, compressorDaVez: o.compressorDaVez ?? 'compressor-1', pausado: o.pausado ?? false };
}

const cena = (o: Parameters<typeof entrada>[0]) => montarCena(entrada(o));
const avatar = (c: CenaRcp, papel: string) => c.avatares.find((a) => a.papel === papel);
const comp = (tS: number, por = 'compressor-1'): MarcaRcp => ({ id: `c-${por}-${tS}`, tipo: 'compressao', tS, por });
const vent = (tS: number): MarcaRcp => ({ id: `v-${tS}`, tipo: 'ventilacao', tS, por: 'via-aerea' });
/** Compressões a cada `intervalo` s a partir de `de`. */
const corrida = (de: number, quantas: number, intervalo: number, por = 'compressor-1') => Array.from({ length: quantas }, (_, i) => comp(de + i * intervalo, por));

describe('paciente: faixa, técnica e pele (A VALIDAR)', () => {
  it('lactente, criança e adolescente pelos cenários', () => {
    expect(cena({ tS: 1, cenario: cenario('assistolia-lactente') })).toMatchObject({ faixa: 'lactente', tecnica: 'dois-polegares', pelePaciente: 'claro' });
    expect(cena({ tS: 1, cenario: cenario('fv-escolar') })).toMatchObject({ faixa: 'crianca', tecnica: 'uma-mao', pelePaciente: 'negro' });
    expect(cena({ tS: 1, cenario: cenario('aesp-trauma') })).toMatchObject({ faixa: 'adolescente', tecnica: 'duas-maos', pelePaciente: 'moreno' });
  });
  it('RN abaixo de 28 dias; adolescente a partir de 12 anos ou com 30:2', () => {
    const base = cenario('fv-escolar');
    expect(faixaDoPaciente({ ...base, idadeAnos: 10 / 365 })).toBe('rn');
    expect(faixaDoPaciente({ ...base, idadeAnos: 40 / 365 })).toBe('lactente');
    expect(faixaDoPaciente({ ...base, idadeAnos: 11 })).toBe('crianca');
    expect(faixaDoPaciente({ ...base, idadeAnos: 12 })).toBe('adolescente');
    expect(faixaDoPaciente({ ...base, idadeAnos: 10, relacaoCompressaoVentilacao: 30 })).toBe('adolescente');
    const { pele: _pele, ...semPele } = base;
    expect(cena({ tS: 1, cenario: { ...semPele, idadeAnos: 10 / 365 } })).toMatchObject({ faixa: 'rn', tecnica: 'dois-polegares', pelePaciente: 'moreno' });
  });
});

describe('compressões pelas teclas', () => {
  it('o tórax desce e volta pela marca, na hora', () => {
    const marcas = [comp(10)];
    const em = (t: number) => cena({ tS: t, marcas }).compressao;
    expect(em(10)).toBe(0);
    expect(em(10 + T.descidaCompressaoS / 2)).toBeCloseTo(0.5);
    expect(em(10 + T.descidaCompressaoS)).toBeCloseTo(1);
    expect(em(10 + T.descidaCompressaoS + T.subidaCompressaoS / 2)).toBeCloseTo(0.5);
    expect(em(10.5)).toBe(0);
    expect(afundamento(-1)).toBe(0);
  });
  it('parado antes da 1ª compressão; comprimindo logo depois; mãos paradas no tórax na pausa', () => {
    const marcas = [comp(10)];
    expect(avatar(cena({ tS: 5, marcas }), 'compressor-1')).toMatchObject({ lugar: 'torax', acao: 'parado' });
    expect(avatar(cena({ tS: 10.06, marcas }), 'compressor-1')).toMatchObject({ acao: 'comprimindo', fase: expect.closeTo(0.5, 5) });
    expect(avatar(cena({ tS: 11, marcas }), 'compressor-1')?.acao).toBe('comprimindo');
    expect(avatar(cena({ tS: 12, marcas }), 'compressor-1')?.acao).toBe('maos-no-torax');
  });
  it('ritmo do avatar e legenda com frequência e série', () => {
    const boa = cena({ tS: 12.8, marcas: corrida(10, 6, 0.55), membros: { 'compressor-1': { nome: 'Ana' } } });
    expect(avatar(boa, 'compressor-1')).toMatchObject({ nome: 'Ana', ritmo: 'boa' });
    expect(boa.legenda).toBe('Ana comprime — 109/min (no ritmo) · série 6/15');
    const rapida = cena({ tS: 12.05, marcas: corrida(10, 6, 0.4) });
    expect(avatar(rapida, 'compressor-1')?.ritmo).toBe('rapida');
    expect(rapida.legenda).toContain('(rápido)');
  });
  it('quem apertou fica no tórax na hora (troca); depois de 3 s volta o compressor da vez', () => {
    const marcas = [comp(10, 'compressor-2')];
    const agora = cena({ tS: 10.5, marcas, compressorDaVez: 'compressor-1' });
    expect(avatar(agora, 'compressor-2')).toMatchObject({ lugar: 'torax', acao: 'comprimindo', nome: 'Compressões 2' });
    expect(avatar(agora, 'compressor-1')).toMatchObject({ lugar: 'espera', acao: 'parado' });
    const depois = cena({ tS: 10 + T.compressorNoToraxS + 0.5, marcas, compressorDaVez: 'compressor-1' });
    expect(avatar(depois, 'compressor-1')?.lugar).toBe('torax');
    expect(avatar(depois, 'compressor-2')?.lugar).toBe('espera');
  });
  it('ventilação: a bolsa aperta e o tórax sobe por ~1 s', () => {
    const marcas = [...corrida(10, 15, 0.55), vent(19), vent(20.2)];
    const meio = cena({ tS: 19.5, marcas, membros: { 'via-aerea': { nome: 'Bruno' } } });
    expect(meio.expansao).toBeCloseTo(1);
    expect(avatar(meio, 'via-aerea')).toMatchObject({ lugar: 'cabeca', acao: 'ventilando', fase: expect.closeTo(1, 5) });
    expect(meio.legenda).toContain('Bruno ventila');
    const depois = cena({ tS: 21.5, marcas });
    expect(depois.expansao).toBe(0);
    expect(avatar(depois, 'via-aerea')?.acao).toBe('segurando-mascara');
  });
  it('15:2: logo depois da 15ª compressão é pausa (ninguém "comprime e ventila" ao mesmo tempo)', () => {
    // 15ª compressão em 17,7 s; a 1ª ventilação vem 0,3 s depois (dentro do tempo em que ainda contaria como comprimindo)
    const serie = corrida(10, 15, 0.55);
    const membros = { 'compressor-1': { nome: 'Bruno' }, 'via-aerea': { nome: 'Carla' } };
    // o último aperto ainda aparece inteiro
    expect(avatar(cena({ tS: 17.75, marcas: serie, membros }), 'compressor-1')?.acao).toBe('comprimindo');
    // terminou o aperto: mãos paradas no tórax, à espera das ventilações
    const espera = cena({ tS: 18.1, marcas: serie, membros });
    expect(avatar(espera, 'compressor-1')?.acao).toBe('maos-no-torax');
    expect(espera.legenda).toBe('Pausa: 2 ventilações');
    // ventilando: a legenda mostra a pausa e quem ventila, sem "comprime"
    const ventilando = cena({ tS: 18.3, marcas: [...serie, vent(18)], membros });
    expect(avatar(ventilando, 'compressor-1')?.acao).toBe('maos-no-torax');
    expect(ventilando.legenda).toBe('Pausa: 2 ventilações · Carla ventila');
    expect(ventilando.legenda).not.toContain('comprime');
  });
  it('revendo um código longo (milhares de marcas) em qualquer tempo', () => {
    const marcas = corrida(0, 10_000, 0.5);
    expect(cena({ tS: 1000 + T.descidaCompressaoS / 2, marcas }).compressao).toBeCloseTo(0.5);
    expect(cena({ tS: 1000 + T.descidaCompressaoS, marcas }).compressao).toBeCloseTo(1);
  });
});

describe('RCP automática (sem teclas)', () => {
  const periodo = 60 / T.automaticaPorMin;
  it('séries de 15 compressões a 110/min e pausa com 2 ventilações', () => {
    const inicio = cena({ tS: periodo / 10, teclas: false });
    expect(inicio.compressao).toBeGreaterThan(0);
    expect(avatar(inicio, 'compressor-1')?.acao).toBe('comprimindo');
    expect(inicio.legenda).toBe('Compressões 1 comprime — 110/min · série 1/15');
    expect(cena({ tS: 14.5 * periodo, teclas: false }).legenda).toContain('série 15/15');
    const pausa = cena({ tS: 15 * periodo + 0.8, teclas: false });
    expect(pausa.compressao).toBe(0);
    expect(pausa.expansao).toBeGreaterThan(0.9);
    expect(avatar(pausa, 'compressor-1')?.acao).toBe('maos-no-torax');
    expect(avatar(pausa, 'via-aerea')?.acao).toBe('ventilando');
    expect(pausa.legenda).toContain('Pausa: 2 ventilações');
    const volta = cena({ tS: 15 * periodo + T.pausaVentilacoesS + periodo / 10, teclas: false });
    expect(volta.legenda).toContain('série 1/15');
    // adolescente: 30 por série
    expect(cena({ tS: 15 * periodo + 0.8, teclas: false, cenario: cenario('aesp-trauma') }).legenda).toContain('série 17/30');
  });
  it('com via aérea avançada: intubação, depois tubo e compressões contínuas', () => {
    const eventos: EventoParada[] = [INICIAR, { id: 'v', tipo: 'viaAerea', tS: 30, descricao: 'Intubação (tubo com cuff nº 5)', por: 'via-aerea' }];
    const intubando = cena({ tS: 32, eventos, teclas: false });
    expect(avatar(intubando, 'via-aerea')).toMatchObject({ acao: 'intubando', fase: expect.closeTo(2 / T.intubandoS, 5) });
    expect(intubando.viaAerea).toBe('mascara');
    expect(intubando.legenda).toContain('intuba');
    const depois = cena({ tS: 30 + T.intubandoS + 1, eventos, teclas: false });
    expect(depois.viaAerea).toBe('tubo');
    expect(depois.legenda).toContain('contínuas');
    // ventilação a cada 2,5 s sem parar as compressões
    const tV = 30 + 3 * T.ventilacaoComViaCadaS + T.ventilacaoS / 2;
    expect(avatar(cena({ tS: tV, eventos, teclas: false }), 'via-aerea')?.acao).toBe('ventilando');
  });
  it('relógio pausado: congela sem compressões', () => {
    const c = cena({ tS: periodo / 10, teclas: false, pausado: true });
    expect(c.compressao).toBe(0);
    expect(avatar(c, 'compressor-1')?.acao).toBe('maos-no-torax');
    expect(c.legenda).toBe('⏸ Relógio pausado');
  });
  it('o 2º compressor da vez vai para o tórax mesmo sem nome', () => {
    const c = cena({ tS: 5, teclas: false, compressorDaVez: 'compressor-2' });
    expect(avatar(c, 'compressor-2')?.lugar).toBe('torax');
    expect(avatar(c, 'compressor-1')?.lugar).toBe('espera');
  });
});

describe('checagem de ritmo, carga e choque', () => {
  const eventos: EventoParada[] = [
    INICIAR,
    { id: 'k', tipo: 'checarRitmo', tS: 120, por: 'lider' },
    { id: 'c', tipo: 'carga', tS: 123, joules: 40, por: 'monitor' },
    { id: 's', tipo: 'choque', tS: 125, joules: 40, por: 'monitor' },
  ];
  it('checagem: pausa, todos olham o monitor e quem checou fala', () => {
    const c = cena({ tS: 121, eventos: eventos.slice(0, 2), teclas: false });
    expect(c.checandoRitmo).toBe(true);
    expect(c.compressao).toBe(0);
    expect(c.avatares.every((a) => a.acao === 'olhando-monitor')).toBe(true);
    expect(avatar(c, 'lider')?.balao).toBe('Checando o ritmo…');
    expect(c.legenda).toBe('🔍 Checagem de ritmo');
    expect(cena({ tS: 120 + T.checagemS + 0.5, eventos: eventos.slice(0, 2), teclas: false }).checandoRitmo).toBe(false);
  });
  it('checagem com teclas: dura até a próxima compressão (no máximo 10 s)', () => {
    const marcas = [comp(119.5), comp(126)];
    const ev = eventos.slice(0, 2);
    expect(cena({ tS: 125, eventos: ev, marcas }).checandoRitmo).toBe(true);
    expect(cena({ tS: 126.1, eventos: ev, marcas }).checandoRitmo).toBe(false);
    expect(cena({ tS: 129, eventos: ev, marcas: [comp(119.5)] }).checandoRitmo).toBe(true);
    expect(cena({ tS: 120 + T.checagemMaximaS + 0.1, eventos: ev, marcas: [comp(119.5)] }).checandoRitmo).toBe(false);
  });
  it('carregado: "afastem-se", mãos ao alto e o tórax parado', () => {
    const c = cena({ tS: 124, eventos, teclas: false, marcas: [] });
    expect(c).toMatchObject({ carregado: true, checandoRitmo: false, compressao: 0, choque: 0 });
    expect(avatar(c, 'monitor')).toMatchObject({ lugar: 'desfibrilador', acao: 'carregando', balao: 'Carregando 40\u00a0J… Afastem-se!' });
    expect(c.avatares.filter((a) => a.papel !== 'monitor').every((a) => a.acao === 'maos-ao-alto')).toBe(true);
    expect(c.legenda).toBe('⚡ Afastem-se: desfibrilador carregado');
    // com teclas, mesmo apertando a compressão, a cena mostra todos afastados
    const comTeclas = cena({ tS: 124.1, eventos, marcas: [comp(124)] });
    expect(comTeclas.compressao).toBe(0);
    expect(avatar(comTeclas, 'compressor-1')?.acao).toBe('maos-ao-alto');
  });
  it('choque: clarão que cai a 0 em ~0,6 s; depois a RCP volta', () => {
    const c = cena({ tS: 125 + T.choqueS / 2, eventos, teclas: false });
    expect(c.choque).toBeCloseTo(0.5);
    expect(c.carregado).toBe(false);
    expect(avatar(c, 'monitor')).toMatchObject({ acao: 'chocando', balao: 'Choque!' });
    expect(avatar(c, 'via-aerea')?.acao).toBe('maos-ao-alto');
    expect(c.legenda).toBe('⚡ Choque de 40\u00a0J');
    const depois = cena({ tS: 125 + T.choqueS + 0.06, eventos, teclas: false });
    expect(depois.choque).toBe(0);
    expect(avatar(depois, 'compressor-1')?.acao).toBe('comprimindo');
  });
  it('carga de 0 J cancela', () => {
    const ev: EventoParada[] = [INICIAR, { id: 'c', tipo: 'carga', tS: 50, joules: 40 }, { id: 'x', tipo: 'carga', tS: 52, joules: 0 }];
    expect(cena({ tS: 51, eventos: ev, teclas: false }).carregado).toBe(true);
    expect(cena({ tS: 52.5, eventos: ev, teclas: false }).carregado).toBe(false);
  });
});

describe('equipe: balões e ações', () => {
  const membros = { medicacao: { nome: 'Carlos' } };
  it('começar, ordem do líder e "entendido" de quem recebeu', () => {
    const eventos: EventoParada[] = [
      INICIAR,
      { id: 'o1', tipo: 'ordem', tS: 50, para: 'medicacao', texto: 'Adrenalina 2 mL', por: 'lider' },
      { id: 'e1', tipo: 'entendido', tS: 52, ordemId: 'o1', por: 'medicacao' },
      { id: 'o2', tipo: 'ordem', tS: 60, para: 'via-aerea', texto: 'Intubar', por: 'lider' },
      { id: 'e2', tipo: 'entendido', tS: 61, ordemId: 'o2' },
    ];
    expect(avatar(cena({ tS: 1, eventos, teclas: false }), 'lider')?.balao).toBe('Começar RCP!');
    expect(avatar(cena({ tS: 51, eventos, membros, teclas: false }), 'lider')?.balao).toBe('Carlos: Adrenalina 2 mL');
    const resposta = cena({ tS: 53, eventos, membros, teclas: false });
    expect(avatar(resposta, 'medicacao')?.balao).toBe('Entendido!');
    expect(avatar(cena({ tS: 50 + T.balaoS + 0.1, eventos, teclas: false }), 'lider')?.balao).toBeUndefined();
    // "entendido" sem autor: vai para quem recebeu a ordem
    expect(avatar(cena({ tS: 62, eventos, teclas: false }), 'via-aerea')?.balao).toBe('Entendido!');
  });
  it('droga, fluido e acesso: medicação injeta e fala a dose', () => {
    const eventos: EventoParada[] = [
      INICIAR,
      { id: 'a', tipo: 'acesso', tS: 40, descricao: 'Acesso intraósseo (IO)', por: 'medicacao' },
      { id: 'd', tipo: 'droga', tS: 70, drogaId: 'adrenalina', volumeMl: 2, por: 'medicacao' },
      { id: 'f', tipo: 'fluido', tS: 90, volumeMl: 400, por: 'medicacao' },
    ];
    const puncao = cena({ tS: 41, eventos, membros, teclas: false });
    expect(avatar(puncao, 'medicacao')).toMatchObject({ lugar: 'acesso', acao: 'puncionando', fase: expect.closeTo(1 / T.acaoCurtaS, 5) });
    expect(puncao.acesso).toBeUndefined();
    expect(puncao.legenda).toContain('🩸 Carlos: acesso intraósseo');
    expect(cena({ tS: 40 + T.acaoCurtaS, eventos, teclas: false }).acesso).toBe('intraosseo');
    const droga = cena({ tS: 71, eventos, membros, teclas: false });
    expect(avatar(droga, 'medicacao')).toMatchObject({ acao: 'injetando', balao: 'Adrenalina 1:10.000 — 2\u00a0mL' });
    expect(droga.legenda).toContain('💉 Carlos: Adrenalina 1:10.000 — 2\u00a0mL');
    expect(avatar(cena({ tS: 91, eventos, teclas: false }), 'medicacao')?.balao).toBe('SF 0,9% 400\u00a0mL');
    expect(avatar(cena({ tS: 70 + T.acaoCurtaS + 0.1, eventos, teclas: false }), 'medicacao')?.acao).toBe('parado');
    const periferico: EventoParada[] = [INICIAR, { id: 'a', tipo: 'acesso', tS: 10, descricao: 'Acesso venoso periférico' }];
    expect(cena({ tS: 20, eventos: periferico, teclas: false }).acesso).toBe('periferico');
  });
  it('aviso do tempo e anotação trazem os papéis opcionais para a cena', () => {
    const essenciais = ['lider', 'compressor-1', 'via-aerea', 'medicacao', 'monitor'];
    expect(cena({ tS: 5, teclas: false }).avatares.map((a) => a.papel)).toEqual(essenciais);
    const eventos: EventoParada[] = [INICIAR, { id: 'av', tipo: 'aviso', tS: 60, aviso: 'adrenalina', por: 'tempo' }, { id: 'n', tipo: 'anotacao', tS: 61, texto: 'pupilas', por: 'registro' }];
    const c = cena({ tS: 61.5, eventos, teclas: false });
    expect(avatar(c, 'tempo')).toMatchObject({ lugar: 'tempo', acao: 'cronometrando', balao: 'Hora da adrenalina!' });
    expect(avatar(c, 'registro')).toMatchObject({ lugar: 'registro', acao: 'anotando', fase: expect.closeTo(0.25, 5) });
    expect(avatar(c, 'registro')?.balao).toBeUndefined();
    expect(avatar(cena({ tS: 59, eventos, teclas: false }), 'tempo')).toBeUndefined();
    expect(avatar(cena({ tS: 70, eventos, teclas: false }), 'registro')).toMatchObject({ acao: 'anotando', fase: 0 });
    // com nome: aparece desde o início, com o nome
    const comNome = cena({ tS: 5, teclas: false, membros: { 'compressor-2': { nome: 'Bia' } } });
    expect(avatar(comNome, 'compressor-2')).toMatchObject({ nome: 'Bia', lugar: 'espera' });
  });
  it('retorno da circulação: "Temos pulso!" e a RCP automática para', () => {
    const lactente = cenario('assistolia-lactente');
    const eventos: EventoParada[] = [
      INICIAR,
      { id: 'd1', tipo: 'droga', tS: 10, drogaId: 'adrenalina', volumeMl: 0.8 },
      { id: 'd2', tipo: 'droga', tS: 200, drogaId: 'adrenalina', volumeMl: 0.8 },
      { id: 'k', tipo: 'checarRitmo', tS: 240, por: 'monitor' },
    ];
    const c = cena({ tS: 242, eventos, cenario: lactente, teclas: false });
    expect(c.rce).toBe(true);
    expect(avatar(c, 'lider')?.balao).toBe('Temos pulso!');
    const depois = cena({ tS: 250, eventos, cenario: lactente, teclas: false });
    expect(depois.compressao).toBe(0);
    expect(avatar(depois, 'compressor-1')?.acao).toBe('parado');
    expect(depois.legenda).toBe('✔ Retorno da circulação');
    expect(cena({ tS: 239, eventos, cenario: lactente, teclas: false }).rce).toBe(false);
  });
  it('antes de começar e depois de encerrar: todos parados', () => {
    const antes = cena({ tS: 3, eventos: [], teclas: false });
    expect(antes.ativo).toBe(false);
    expect(antes.avatares.every((a) => a.acao === 'parado' && a.balao === undefined)).toBe(true);
    expect(antes.legenda).toBe('Aguardando o início do código');
    const fim = cena({ tS: 30, eventos: [INICIAR, { id: 'f', tipo: 'encerrar', tS: 20 }], teclas: false });
    expect(fim).toMatchObject({ ativo: false, compressao: 0, legenda: 'Código encerrado' });
  });
});

describe('aparência e determinismo', () => {
  it('cada papel tem uma aparência padrão válida, diferente das outras e com os 3 tons', () => {
    const todas = PAPEIS_EQUIPE.map((p) => aparenciaPadrao(p.id));
    expect(todas.every(aparenciaValida)).toBe(true);
    expect(new Set(todas.map((a) => JSON.stringify(a))).size).toBe(todas.length);
    expect(new Set(todas.map((a) => a.pele))).toEqual(new Set(['claro', 'moreno', 'negro']));
    expect(aparenciaPadrao('lider')).toEqual(aparenciaPadrao('lider'));
    expect(aparenciaValida(aparenciaPadrao('papel-novo'))).toBe(true);
    const escolhida = { pele: 'negro', cabelo: 'longo', roupa: '#be185d' } as const;
    expect(aparenciaDoMembro('lider', { nome: 'Ana', avatar: escolhida })).toEqual(escolhida);
    expect(avatar(cena({ tS: 1, membros: { lider: { nome: 'Ana', avatar: escolhida } } }), 'lider')?.aparencia).toEqual(escolhida);
  });
  it('mesma entrada, mesma cena (em qualquer tela e ao rever)', () => {
    const eventos: EventoParada[] = [INICIAR, { id: 'k', tipo: 'checarRitmo', tS: 20, por: 'monitor' }, { id: 'd', tipo: 'droga', tS: 22, drogaId: 'adrenalina', volumeMl: 2 }];
    const marcas = [...corrida(1, 15, 0.55), vent(10), vent(11.2), ...corrida(12.5, 10, 0.5, 'compressor-2')];
    for (const tS of [0.5, 5.03, 10.4, 14.77, 21, 23.3]) {
      const a = montarCena(entrada({ tS, eventos, marcas }));
      const b = montarCena(entrada({ tS, eventos: eventos.map((e) => ({ ...e })), marcas: marcas.map((m) => ({ ...m })) }));
      expect(b).toEqual(a);
      const e = entrada({ tS, eventos, marcas });
      expect(montarCena(e)).toEqual(montarCena(e));
    }
  });
});
