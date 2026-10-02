import { describe, expect, it } from 'vitest';
import { CENARIOS_PARADA, DROGAS_PARADA } from '../dados/parada-a-validar';
import { avaliarParada, doseDaDroga, energiaDoChoque, estadoDaParada, type EventoParada, tuboEndotraqueal, volumeDoBolus } from './parada';

const cenario = (id: string) => CENARIOS_PARADA.find((c) => c.id === id)!;
const droga = (id: string) => DROGAS_PARADA.find((d) => d.id === id)!;

describe('contas do carrinho (A VALIDAR)', () => {
  it('adrenalina 0,01 mg/kg da 1:10.000: 20 kg → 0,2 mg = 2 mL; teto de 1 mg', () => {
    expect(doseDaDroga(droga('adrenalina'), 20)).toMatchObject({ dose: 0.2, volumeMl: 2, limitada: false });
    expect(doseDaDroga(droga('adrenalina'), 120)).toMatchObject({ dose: 1, volumeMl: 10, limitada: true });
  });
  it('amiodarona 5 mg/kg (máx. 300 mg) da ampola de 50 mg/mL', () => {
    expect(doseDaDroga(droga('amiodarona'), 20)).toMatchObject({ dose: 100, volumeMl: 2 });
    expect(doseDaDroga(droga('amiodarona'), 70).dose).toBe(300);
  });
  it('choque: 2 J/kg, depois 4 J/kg, sem passar da dose de adulto', () => {
    expect([1, 2, 3].map((n) => energiaDoChoque(n, 20))).toEqual([40, 80, 80]);
    expect(energiaDoChoque(2, 70)).toBe(200);
  });
  it('bolus de SF e tubo pela idade', () => {
    expect(volumeDoBolus(45)).toBe(900);
    expect(tuboEndotraqueal(6)).toEqual({ comCuff: 5, semCuff: 5.5, profundidadeCm: 15 });
    expect(tuboEndotraqueal(0.5).comCuff).toBe(3);
  });
});

describe('estado do código', () => {
  const fv = cenario('fv-escolar');
  it('FV: começa pedindo choque; depois da checagem com FV, pede choque de novo', () => {
    const ev: EventoParada[] = [{ tipo: 'iniciar', tS: 0 }];
    expect(estadoDaParada(fv, ev, 5).proximaAcao).toContain('Chocar agora: 40 J');
    ev.push({ tipo: 'choque', tS: 10, joules: 40 });
    expect(estadoDaParada(fv, ev, 20).chocarAgora).toBe(false);
    ev.push({ tipo: 'checarRitmo', tS: 125 });
    const e = estadoDaParada(fv, ev, 126);
    expect(e.ritmo).toBe('fv');
    expect(e.ciclo.numero).toBe(2);
    expect(e.proximaAcao).toContain('80 J');
  });

  it('FV: volta (RCE) na checagem depois de 3 choques, adrenalina e amiodarona', () => {
    const ev: EventoParada[] = [
      { tipo: 'iniciar', tS: 0 },
      { tipo: 'choque', tS: 10, joules: 40 },
      { tipo: 'checarRitmo', tS: 130 },
      { tipo: 'choque', tS: 135, joules: 80 },
      { tipo: 'droga', tS: 150, drogaId: 'adrenalina', volumeMl: 2 },
      { tipo: 'checarRitmo', tS: 255 },
      { tipo: 'choque', tS: 260, joules: 80 },
      { tipo: 'droga', tS: 270, drogaId: 'amiodarona', volumeMl: 2 },
      { tipo: 'checarRitmo', tS: 380 },
      { tipo: 'encerrar', tS: 400 },
    ];
    const e = estadoDaParada(fv, ev, 390);
    expect(e.rce).toBe(true);
    expect(e.ritmo).toBe('sinusal');
    const av = avaliarParada(fv, ev);
    expect(av.rce).toBe(true);
    expect(av.itens.every((i) => i.ok)).toBe(true);
  });

  it('assistolia: pede adrenalina já; choque em assistolia e dose errada aparecem na avaliação', () => {
    const a = cenario('assistolia-lactente');
    const ev: EventoParada[] = [{ tipo: 'iniciar', tS: 0 }];
    expect(estadoDaParada(a, ev, 10).proximaAcao).toContain('Adrenalina agora');
    ev.push({ tipo: 'choque', tS: 20, joules: 16 }, { tipo: 'droga', tS: 40, drogaId: 'adrenalina', volumeMl: 8 }, { tipo: 'encerrar', tS: 60 });
    const av = avaliarParada(a, ev);
    expect(av.itens.find((i) => i.texto.includes('NÃO chocável'))?.ok).toBe(false);
    expect(av.itens.find((i) => i.texto.startsWith('Adrenalina 1:10.000'))).toMatchObject({ ok: false });
    expect(av.rce).toBe(false);
  });

  it('AESP por hipovolemia: sem o SF não volta; com SF + adrenalina volta', () => {
    const c = cenario('aesp-trauma');
    const base: EventoParada[] = [{ tipo: 'iniciar', tS: 0 }, { tipo: 'droga', tS: 30, drogaId: 'adrenalina', volumeMl: 4.5 }];
    expect(estadoDaParada(c, [...base, { tipo: 'checarRitmo', tS: 120 }], 121).rce).toBe(false);
    const com = [...base, { tipo: 'fluido' as const, tS: 60, volumeMl: 900 }, { tipo: 'checarRitmo' as const, tS: 120 }];
    expect(estadoDaParada(c, com, 121).rce).toBe(true);
    expect(avaliarParada(c, com).itens.find((i) => i.texto.includes('Causa reversível'))?.ok).toBe(true);
  });

  it('intervalo entre adrenalinas fora de 3–5 min é apontado', () => {
    const a = cenario('assistolia-lactente');
    const ev: EventoParada[] = [
      { tipo: 'iniciar', tS: 0 },
      { tipo: 'droga', tS: 30, drogaId: 'adrenalina', volumeMl: 0.8 },
      { tipo: 'droga', tS: 90, drogaId: 'adrenalina', volumeMl: 0.8 },
    ];
    expect(avaliarParada(a, ev).itens.find((i) => i.texto.startsWith('Intervalo'))).toMatchObject({ ok: false });
  });
});
