import { describe, expect, it } from 'vitest';
import { ESCORES_RN } from '../dados/neonatal/escores-a-validar';
import { ACHADOS_RN, REGIOES_EXAME_RN, SINAIS_ALTERADOS_RN } from '../dados/neonatal/exame-rn-a-validar';
import { criarSorteio } from '../estudo/treino';
import {
  achadosSorteaveis,
  ajusteDoCorpo,
  avaliarSinais,
  classificacaoEsperada,
  conferirExame,
  gerarRnVirtual,
  interpretarCoracaozinho,
  type RnVirtual,
  somarEscore,
} from './exame';

describe('dados do exame do RN (A VALIDAR)', () => {
  it('cada achado aponta para uma região do roteiro e tem conduta', () => {
    const regioes = new Set(REGIOES_EXAME_RN.map((r) => r.id));
    for (const a of ACHADOS_RN) {
      expect(regioes.has(a.regiao), a.id).toBe(true);
      expect(a.conduta.length, a.id).toBeGreaterThan(10);
      expect(a.status).toBe('A_VALIDAR');
    }
    expect(new Set(ACHADOS_RN.map((a) => a.id)).size).toBe(ACHADOS_RN.length);
  });

  it('achados de genitália respeitam o sexo', () => {
    expect(achadosSorteaveis('genitalia', 'feminino').map((a) => a.id)).not.toContain('hidrocele');
    expect(achadosSorteaveis('genitalia', 'masculino').map((a) => a.id)).not.toContain('pseudomenstruacao');
  });
});

describe('RN virtual', () => {
  it('é sempre o mesmo para a mesma semente', () => {
    expect(gerarRnVirtual(criarSorteio(42), 42)).toEqual(gerarRnVirtual(criarSorteio(42), 42));
  });

  it('em 300 sorteios: nunca dois achados que mudam a cor do corpo, no máximo 4 achados, sinais coerentes', () => {
    for (let semente = 1; semente <= 300; semente++) {
      const rn = gerarRnVirtual(criarSorteio(semente), semente);
      const achados = Object.values(rn.achados).filter(Boolean).map((id) => ACHADOS_RN.find((a) => a.id === id)!);
      expect(achados.length).toBeLessThanOrEqual(4);
      expect(achados.filter((a) => a.corpo?.cor || a.corpo?.ictericiaZona).length).toBeLessThanOrEqual(1);
      for (const a of achados) {
        expect(a.soNoAtlas).toBeFalsy();
        if (a.sexo) expect(a.sexo).toBe(rn.sexo);
        if (a.horasDeVida !== undefined) expect(rn.horasDeVida).toBe(a.horasDeVida);
      }
      expect(avaliarSinais(rn.sinais).length > 0).toBe(!!rn.sinalAlterado || rn.achados.torax === 'desconforto-respiratorio');
    }
  });

  it('com chance 1 todas as regiões até o máximo ganham achado', () => {
    const rn = gerarRnVirtual(criarSorteio(7), 7, { chance: 1, maximoAchados: 20 });
    const comAchado = Object.values(rn.achados).filter(Boolean).length;
    expect(comAchado).toBeGreaterThanOrEqual(REGIOES_EXAME_RN.length - 2);
  });

  it('confere as respostas e acusa urgência não percebida', () => {
    const rn: RnVirtual = {
      semente: 0,
      tom: 'claro',
      sexo: 'masculino',
      horasDeVida: 30,
      sinais: { fc: 140, fr: 50, temperatura: 36.8 },
      achados: { pele: 'eritema-toxico', cabeca: null, abdome: 'onfalite' },
    };
    expect(classificacaoEsperada(rn, 'pele')).toBe('variacao');
    expect(classificacaoEsperada(rn, 'cabeca')).toBe('normal');
    const c = conferirExame(rn, { pele: 'variacao', cabeca: 'normal', abdome: 'variacao', 'sinais-vitais': 'normal' });
    expect(c.respondidas).toBe(4);
    expect(c.acertos).toBe(3);
    expect(c.urgenciasPerdidas).toEqual(['Onfalite']);
    expect(ajusteDoCorpo(rn)).toEqual({ eritemaToxico: true, umbigo: 'onfalite' });
  });

  it('sinal vital alterado conta como região alterada', () => {
    const febre = SINAIS_ALTERADOS_RN.find((s) => s.id === 'febre')!;
    const rn: RnVirtual = { semente: 0, tom: 'negro', sexo: 'feminino', horasDeVida: 40, sinais: { fc: 150, fr: 50, temperatura: febre.temperatura! }, sinalAlterado: 'febre', achados: {} };
    expect(classificacaoEsperada(rn, 'sinais-vitais')).toBe('alterado');
    expect(avaliarSinais(rn.sinais)).toEqual(['T 38,1 °C acima de 37,5']);
  });
});

describe('teste do coraçãozinho', () => {
  it('normal, repetir e alterado', () => {
    expect(interpretarCoracaozinho(98, 97, 1).resultado).toBe('normal');
    expect(interpretarCoracaozinho(98, 95, 1).resultado).toBe('repetir'); // diferença de 3%
    expect(interpretarCoracaozinho(94, 94, 1).resultado).toBe('repetir');
    expect(interpretarCoracaozinho(97, 93, 2)).toEqual({ resultado: 'alterado', texto: expect.stringMatching(/ecocardiograma/) });
  });
});

describe('escores', () => {
  const apgar = ESCORES_RN.find((e) => e.id === 'apgar')!;
  const silverman = ESCORES_RN.find((e) => e.id === 'silverman')!;

  it('Apgar soma de 0 a 10 com a faixa', () => {
    const r = somarEscore(apgar, { fc: 2, respiracao: 2, tonus: 2, irritabilidade: 2, cor: 1 });
    expect(r).toEqual({ pontos: 9, completo: true, faixa: expect.objectContaining({ tom: 'normal' }) });
    expect(somarEscore(apgar, { fc: 1, respiracao: 1 }).completo).toBe(false);
  });

  it('Silverman: 0 sem desconforto, 5 moderado', () => {
    expect(somarEscore(silverman, { toracoabdominal: 0, tiragem: 0, xifoide: 0, 'asa-nasal': 0, gemido: 0 }).faixa?.texto).toBe('Sem desconforto respiratório');
    expect(somarEscore(silverman, { toracoabdominal: 1, tiragem: 1, xifoide: 1, 'asa-nasal': 1, gemido: 1 }).faixa?.texto).toBe('Desconforto moderado');
  });

  it('as faixas cobrem todas as notas possíveis', () => {
    for (const e of ESCORES_RN) {
      const max = e.criterios.reduce((s, c) => s + Math.max(...c.opcoes.map((o) => o.pontos)), 0);
      for (let p = 0; p <= max; p++) expect(e.faixas.some((f) => p >= f.de && p <= f.ate), `${e.id} ${p}`).toBe(true);
    }
  });
});
