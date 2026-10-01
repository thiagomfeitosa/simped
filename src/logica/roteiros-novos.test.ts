/**
 * Roteiros de preparo (rediluição, BIC, infusão contínua) e dos distúrbios
 * hipercalemia, hipocalcemia e hipernatremia: confere os números principais,
 * todos calculados pelo motor de cálculo (valores A VALIDAR).
 */
import { describe, expect, it } from 'vitest';
import { ROTEIROS } from '../dados/roteiros';
import type { Roteiro } from '../dados/roteiros/tipos';
import { montarFolha, montarPrescricaoComCalculos } from './progresso';

const roteiro = (id: string) => ROTEIROS.find((r) => r.id === id)!;
function linhaFinal(r: Roteiro, id: string) {
  const folha = montarFolha(r, r.etapas.length - 1);
  return folha.secoes.flatMap((s) => s.linhas).find((l) => l.id === id)!;
}
const conta = (r: Roteiro, idEtapa: string) => r.etapas.find((e) => e.id === idEtapa)!.conta!;

describe('rediluição + seringa da BIC (penicilina cristalina)', () => {
  const r = roteiro('rediluicao-penicilina');
  it('70.000 UI: direto do frasco daria 0,14 mL; rediluído vira 1,4 mL + 10,6 mL de SF = 12 mL a 24 mL/h', () => {
    expect(conta(r, 'volume-direto').resultado).toContain('0,14 mL');
    expect(conta(r, 'rediluir').resultado).toContain('50.000 UI/mL');
    const peni = linhaFinal(r, 'peni');
    expect(peni.texto).toBe('Penicilina G cristalina — 70.000 UI EV de 12/12 h por 10 dias');
    expect(peni.detalhe).toContain('rediluir 1 mL + AD 9 mL = 10 mL (50.000 UI/mL) → aspirar 1,4 mL + SF 0,9% 10,6 mL = 12 mL · BIC 24 mL/h');
  });
  it('a linha da penicilina "cresce" a cada etapa do preparo', () => {
    const detalhes = ['reconstituir', 'rediluir', 'aspirar-redil', 'bic', 'vazao'].map((id) => r.etapas.find((e) => e.id === id)!.linha!.detalhe!);
    detalhes.slice(1).forEach((d, i) => expect(d.startsWith(detalhes[i]!)).toBe(true));
  });
  it('erro de medida: 7% aspirando direto × 0,7% na rediluição', () => {
    expect(conta(r, 'por-que-rediluir').rascunho).toBe('Erro de 0,01 mL: 7% (0,14 mL) × 0,7% (1,4 mL)');
  });
  it('as contas do preparo ficam embaixo da penicilina na prescrição final', () => {
    const { secoes } = montarPrescricaoComCalculos(r);
    const peni = secoes.find((s) => s.secao === 'antimicrobianos')!.linhas.find((l) => l.linha.id === 'peni')!;
    expect(peni.contas.map((c) => c.idEtapa)).toEqual(['dose', 'reconstituir', 'volume-direto', 'por-que-rediluir', 'rediluir', 'aspirar-redil', 'bic', 'vazao']);
  });
});

describe('infusão contínua (adrenalina)', () => {
  const r = roteiro('infusao-continua-adrenalina');
  it('0,1 mcg/kg/min em 20 kg com 20 mcg/mL = 6 mL/h; conferência de volta dá 0,1', () => {
    expect(conta(r, 'vazao').resultado).toBe('6 mL/h');
    expect(conta(r, 'conferir').resultado).toContain('0,1 mcg/kg/min ✓');
    expect(conta(r, 'titular').resultado).toBe('Cada 0,05 mcg/kg/min = 3 mL/h');
    expect(conta(r, 'duracao').resultado).toBe('≈ 8,3 horas');
    expect(linhaFinal(r, 'adr').detalhe).toContain('Adrenalina 1 mg/mL 1 mL + SF 0,9% 49 mL = 50 mL (20 mcg/mL) · BIC 6 mL/h');
  });
});

describe('hipercalemia', () => {
  const r = roteiro('hipercalemia');
  it('cálcio 14 mL não cabe na seringa de 12 mL → 1:1 = 28 mL a 112 mL/h', () => {
    expect(conta(r, 'calcio-diluir').substituicao).toContain('14 mL > 12 mL ✗');
    expect(linhaFinal(r, 'calcio').detalhe).toBe('+ SF 0,9% 14 mL = 28 mL (50 mg/mL) · em 15 min, BIC 112 mL/h, com monitor');
  });
  it('insulina 1,4 UI: direto 0,014 mL (impossível) → rediluída a 1 UI/mL → 1,4 mL', () => {
    expect(conta(r, 'insulina-dose').resultado).toContain('0,014 mL');
    expect(linhaFinal(r, 'insulina').detalhe).toBe('Rediluir 0,5 mL (50 UI) + SF 0,9% 49,5 mL = 50 mL (1 UI/mL) → aspirar 1,4 mL');
    expect(linhaFinal(r, 'glicose').texto).toBe('Glicose 25% — 28 mL (7 g = 0,5 g/kg) EV');
  });
});

describe('hipocalcemia no RN', () => {
  const r = roteiro('hipocalcemia-rn');
  it('ataque 3,6 mL + 8,4 mL de SF = 12 mL a 48 mL/h; Ca elementar ≈ 33,5 mg', () => {
    expect(linhaFinal(r, 'ataque').detalhe).toContain('3,6 mL + SF 0,9% 8,4 mL = 12 mL (30 mg/mL) · em 15 min, BIC 48 mL/h');
    expect(conta(r, 'elementar').resultado).toBe('≈ 33,5 mg de cálcio elementar');
  });
  it('soro: SG 10% 288 mL + gluconato 14,4 mL a 12,6 mL/h, VIG ≈ 5,6', () => {
    const soro = linhaFinal(r, 'soro');
    expect(soro.texto).toBe('SG 10% 288 mL + Gluconato de cálcio 10% 14,4 mL — EV em 24 h, BIC 12,6 mL/h');
    expect(soro.detalhe).toContain('VIG ≈ 5,6');
  });
});

describe('hipernatremia', () => {
  const r = roteiro('hipernatremia');
  it('água livre 240 mL pelas duas contas; plano de 48 h = 1.800 mL; soro 1:1 com Na ≈ 76 a 37,8 mL/h', () => {
    expect(conta(r, 'agua-livre').resultado).toBe('≈ 240 mL de água livre (regra prática: 240 mL ✓)');
    expect(conta(r, 'plano-48h').resultado).toBe('900 mL por dia');
    const soro = linhaFinal(r, 'soro');
    expect(soro.texto).toBe('SG 5% 450 mL + SF 0,9% 450 mL + KCl 19,1% 7 mL — EV em 24 h, BIC 37,8 mL/h');
    expect(soro.detalhe).toContain('Na⁺ ≈ 76 mEq/L');
  });
});

describe('roteiros novos: segurança clínica', () => {
  const novos = ['rediluicao-penicilina', 'infusao-continua-adrenalina', 'hipercalemia', 'hipocalcemia-rn', 'hipernatremia'].map(roteiro);
  it('toda etapa com dose/limite "A VALIDAR" informa a fonte prevista', () => {
    novos.forEach((r) =>
      r.etapas.filter((e) => e.aValidar && /\b(UI|mg|mEq|mcg)\b|mL\/kg|g\/kg/.test(e.aValidar)).forEach((e) => expect(e.fonte, `${r.id}/${e.id}`).toBeTruthy()),
    );
  });
  it('o roteiro tem pelo menos uma etapa marcada A VALIDAR', () => {
    novos.forEach((r) => expect(r.etapas.some((e) => e.aValidar), r.id).toBe(true));
  });
});
