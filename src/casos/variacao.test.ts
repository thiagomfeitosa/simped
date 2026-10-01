import { describe, expect, it } from 'vitest';
import { BANCO_MEDICACOES } from '../dados/medicacoes/index';
import { lerDataHora } from '../paciente/variaveis';
import { CASOS, verificarCaso } from './index';
import type { CasoClinico } from './tipos';
import {
  aplicarVariacao,
  arredondarPeso,
  bancoComVariacao,
  criarSorteio,
  descreverVariacao,
  ehVariacao,
  limitesDoCaso,
  sortearVariacao,
  verificarLimites,
} from './variacao';
import { LIMITES_VARIACAO } from './variacoes-a-validar';

const DIA_MS = 24 * 60 * 60 * 1000;
const caso = (id: string) => CASOS.find((c) => c.id === id)!;

describe('B16 — sorteio com semente', () => {
  it('a mesma semente dá sempre a mesma sequência', () => {
    const a = criarSorteio(42);
    const b = criarSorteio(42);
    const sa = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(sa);
    expect(sa.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(criarSorteio(43)()).not.toBe(sa[0]);
  });

  it('a mesma semente dá a mesma variação', () => {
    const c = caso('caso06-asma-grave');
    expect(sortearVariacao(c, BANCO_MEDICACOES, 7)).toEqual(sortearVariacao(c, BANCO_MEDICACOES, 7));
  });

  it('arredonda como a balança', () => {
    expect(arredondarPeso(3.4567)).toBe(3.46);
    expect(arredondarPeso(22.36)).toBe(22.4);
  });
});

describe('B16 — limites dos casos (arquivo de dados)', () => {
  it('todo caso do app tem limites, e os limites são válidos', () => {
    for (const c of CASOS) {
      expect(LIMITES_VARIACAO[c.id], `${c.id} sem limites em variacoes-a-validar.ts`).toBeDefined();
      expect(verificarLimites(c)).toEqual([]);
    }
  });

  it('não há limites para caso que não existe', () => {
    for (const id of Object.keys(LIMITES_VARIACAO)) expect(CASOS.some((c) => c.id === id), id).toBe(true);
  });

  it('caso sem limites próprios: peso ±10% e idade fixa', () => {
    const meu: CasoClinico = { ...caso('demonstracao'), id: 'meu-caso' };
    const l = limitesDoCaso(meu);
    expect(l.pesoKg).toEqual({ min: 14.4, max: 17.6 });
    expect(l.idadeDias).toBeUndefined();
    expect(l.status).toBe('A_VALIDAR');
    // o caso do editor pode trazer os próprios limites
    expect(limitesDoCaso({ ...meu, variacao: { pesoKg: { min: 15, max: 17 }, status: 'A_VALIDAR' } }).pesoKg).toEqual({ min: 15, max: 17 });
  });

  it('o verificador acha limites errados', () => {
    const c = caso('caso06-asma-grave');
    expect(verificarLimites(c, { pesoKg: { min: 25, max: 30 }, status: 'A_VALIDAR' })[0]).toMatch(/fora de 25–30/);
    expect(verificarLimites(c, { pesoKg: { min: 30, max: 25 }, status: 'A_VALIDAR' })[0]).toMatch(/inválido/);
    const rn = caso('caso01-hipoglicemia-rn');
    const problemas = verificarLimites(rn, { pesoKg: { min: 4, max: 4.6 }, idadeDias: { maisNovo: 1, maisVelho: 0 }, status: 'A_VALIDAR' });
    expect(problemas[0]).toMatch(/nascer depois do início/);
    expect(verificarCaso({ ...c, variacao: { pesoKg: { min: 1, max: 2 }, status: 'A_VALIDAR' } }, BANCO_MEDICACOES).join()).toMatch(/variação/);
    // caso lido de um .json estragado: avisa e, no sorteio, usa os limites do arquivo (ou o padrão)
    const estragado = { ...c, variacao: { pesoKg: 'muito' } } as unknown as CasoClinico;
    expect(verificarCaso(estragado, BANCO_MEDICACOES).join()).toMatch(/formato errado/);
    expect(limitesDoCaso(estragado).pesoKg).toEqual({ min: 18, max: 27 });
  });
});

describe('B16 — variação de todos os casos (200 sorteios cada)', () => {
  it('fica dentro dos limites e o caso continua íntegro', () => {
    for (const c of CASOS) {
      const l = limitesDoCaso(c);
      const idade = l.idadeDias ?? { maisNovo: 0, maisVelho: 0 };
      for (let semente = 1; semente <= 200; semente++) {
        const v = sortearVariacao(c, BANCO_MEDICACOES, semente);
        expect(v.pesoKg).toBeGreaterThanOrEqual(l.pesoKg.min);
        expect(v.pesoKg).toBeLessThanOrEqual(l.pesoKg.max);
        expect(v.pesoKg, `${c.id} semente ${semente}: peso igual ao original`).not.toBe(c.paciente.pesoKg);
        expect(v.idadeDias).toBeGreaterThanOrEqual(-idade.maisNovo);
        expect(v.idadeDias).toBeLessThanOrEqual(idade.maisVelho);
        const variado = aplicarVariacao(c, v);
        expect(verificarCaso(variado, BANCO_MEDICACOES), `${c.id} semente ${semente}`).toEqual([]);
        expect(lerDataHora(variado.paciente.nascimento).getTime()).toBeLessThan(lerDataHora(c.inicio).getTime());
        // farmácia: cada medicação continua com pelo menos uma apresentação, todas do banco
        for (const [id, ids] of Object.entries(v.apresentacoes)) {
          const med = BANCO_MEDICACOES.find((m) => m.id === id)!;
          expect(ids.length).toBeGreaterThan(0);
          expect(ids.every((i) => med.apresentacoes.some((a) => a.id === i))).toBe(true);
        }
      }
    }
  });

  it('peso ao nascer acompanha o peso só no período neonatal; estatura acompanha o peso', () => {
    const rn = caso('caso02-sepse-neonatal');
    const v = sortearVariacao(rn, BANCO_MEDICACOES, 3);
    const razao = v.pesoKg / rn.paciente.pesoKg;
    expect(v.pesoNascerG).toBeCloseTo(rn.paciente.pesoNascerG * razao, -1);
    expect(v.pesoNascerG % 5).toBe(0);
    const crianca = caso('caso06-asma-grave');
    const w = sortearVariacao(crianca, BANCO_MEDICACOES, 3);
    expect(w.pesoNascerG).toBe(crianca.paciente.pesoNascerG);
    expect(w.estaturaCm).toBe(Math.round(122 * Math.cbrt(w.pesoKg / 22)));
  });

  it('o nascimento anda conforme a idade sorteada', () => {
    const c = caso('caso06-asma-grave');
    const variado = aplicarVariacao(c, { semente: 1, pesoKg: 20, pesoNascerG: 3300, idadeDias: 10, apresentacoes: {} });
    expect(lerDataHora(c.paciente.nascimento).getTime() - lerDataHora(variado.paciente.nascimento).getTime()).toBe(10 * DIA_MS);
    expect(variado.paciente.pesoKg).toBe(20);
    expect(variado.paciente.estaturaCm).toBeUndefined();
    expect(variado.sinaisIniciais).toBe(c.sinaisIniciais);
    expect(aplicarVariacao(c, null)).toBe(c);
  });
});

describe('B16 — apresentação da farmácia', () => {
  it('gentamicina: sobra uma ampola só, e cada uma aparece em algum sorteio', () => {
    const c = caso('caso02-sepse-neonatal');
    const gentamicina = BANCO_MEDICACOES.find((m) => m.id === 'gentamicina')!;
    const vistas = new Set<string>();
    for (let s = 1; s <= 80; s++) {
      const v = sortearVariacao(c, BANCO_MEDICACOES, s);
      const ids = v.apresentacoes.gentamicina!;
      const ampolas = gentamicina.apresentacoes.filter((a) => a.forma === 'ampola' && ids.includes(a.id));
      expect(ampolas).toHaveLength(1);
      vistas.add(ampolas[0]!.id);
      const banco = bancoComVariacao(BANCO_MEDICACOES, v);
      expect(banco.find((m) => m.id === 'gentamicina')!.apresentacoes.map((a) => a.id)).toEqual(ids);
    }
    expect(vistas.size).toBe(gentamicina.apresentacoes.filter((a) => a.forma === 'ampola').length);
  });

  it('soros e comprimidos não entram no sorteio; dá para desligar o sorteio no caso', () => {
    const c = caso('caso02-sepse-neonatal');
    const v = sortearVariacao(c, BANCO_MEDICACOES, 5);
    expect(v.apresentacoes.sf09).toBeUndefined();
    const sem = sortearVariacao({ ...c, variacao: { ...limitesDoCaso(c), apresentacoes: false } }, BANCO_MEDICACOES, 5);
    expect(sem.apresentacoes).toEqual({});
  });

  it('banco sem variação fica igual; apresentação que sumiu do banco não esvazia a medicação', () => {
    expect(bancoComVariacao(BANCO_MEDICACOES, null)).toBe(BANCO_MEDICACOES);
    const banco = bancoComVariacao(BANCO_MEDICACOES, { semente: 1, pesoKg: 3, pesoNascerG: 3000, idadeDias: 0, apresentacoes: { gentamicina: ['nao-existe'] } });
    expect(banco.find((m) => m.id === 'gentamicina')!.apresentacoes.length).toBeGreaterThan(1);
  });

  it('descreve a variação para o aluno', () => {
    const c = caso('caso02-sepse-neonatal');
    const v = sortearVariacao(c, BANCO_MEDICACOES, 11);
    const texto = descreverVariacao(c, v, BANCO_MEDICACOES).join(' · ');
    expect(texto).toMatch(/^Peso .* kg \(no caso original: 3 kg\)/);
    expect(texto).toMatch(/Farmácia hoje — Gentamicina/i);
    const idade = descreverVariacao(caso('caso06-asma-grave'), { semente: 1, pesoKg: 20, pesoNascerG: 3300, idadeDias: -95, apresentacoes: {} }, BANCO_MEDICACOES);
    expect(idade[1]).toBe('3 meses mais novo(a) que no original');
  });
});

describe('B16 — variação guardada', () => {
  it('reconhece uma variação e recusa lixo', () => {
    const v = sortearVariacao(caso('caso06-asma-grave'), BANCO_MEDICACOES, 9);
    expect(ehVariacao(JSON.parse(JSON.stringify(v)))).toBe(true);
    expect(ehVariacao(null)).toBe(false);
    expect(ehVariacao({ ...v, pesoKg: -1 })).toBe(false);
    expect(ehVariacao({ ...v, apresentacoes: { x: [1] } })).toBe(false);
  });
});
