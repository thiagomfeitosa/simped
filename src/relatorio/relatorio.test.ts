import { describe, expect, it } from 'vitest';
import { caso02 } from '../casos/clinicos/caso02-sepse-neonatal';
import { BANCO_MEDICACOES } from '../dados/medicacoes';
import { dataBrasileira, VERSAO_ATUAL } from '../dados/medicacoes/versao';
import type { EventoPaciente } from '../motor/paciente';
import { pacienteNoMinuto } from '../paciente/atual';
import { prescricaoVazia, reduzirPrescricao } from '../prescricao/estado';
import { camposVazios } from '../prescricao/itemMedicacao';
import { administracoes, gerarRelatorio, lerHistorico, resumoParaHistorico } from './relatorio';

const paciente = pacienteNoMinuto(caso02, 0);

function folhaSepse() {
  let e = prescricaoVazia();
  e = reduzirPrescricao(e, { tipo: 'adicionar', secao: 'oxigenoterapia', texto: 'O2 em capuz' });
  e = reduzirPrescricao(e, {
    tipo: 'adicionarMedicacao',
    secao: 'volemia',
    campos: { ...camposVazios('sf09'), apresentacaoId: 'bolsa-100', dose: '30', unidadeDose: 'mL', volumeMl: '30', via: 'EV', intervalo: 'dose-unica' },
  });
  e = reduzirPrescricao(e, {
    tipo: 'adicionarMedicacao',
    secao: 'antimicrobianos',
    // volume errado de propósito (o certo é 1,5 mL com 500 mg em 5 mL)
    campos: { ...camposVazios('ampicilina'), apresentacaoId: 'fa-500', dose: '150', unidadeDose: 'mg', reconstituicaoMl: '5', volumeMl: '2', via: 'EV', intervalo: 12 },
  });
  return e;
}

describe('administrações a partir dos eventos', () => {
  it('soma o tempo até cada dose', () => {
    const eventos: EventoPaciente[] = [
      { tipo: 'tempoPassou', minutos: 10 },
      { tipo: 'medicacaoAdministrada', medicacaoId: 'sf09', descricao: 'SF' },
      { tipo: 'tempoPassou', minutos: 45 },
      { tipo: 'medicacaoAdministrada', medicacaoId: 'ampicilina', descricao: 'Amp' },
    ];
    expect(administracoes(eventos).map((a) => [a.medicacaoId, a.minuto])).toEqual([
      ['sf09', 10],
      ['ampicilina', 55],
    ]);
  });
});

describe('relatório do caso 2 (sepse neonatal)', () => {
  const base = {
    caso: caso02,
    prescricao: folhaSepse(),
    receita: [],
    medicacoes: BANCO_MEDICACOES,
    paciente,
  };

  it('hemocultura depois do antibiótico não conta; volume errado aparece nos erros', () => {
    const r = gerarRelatorio({
      ...base,
      eventos: [
        { tipo: 'tempoPassou', minutos: 10 },
        { tipo: 'medicacaoAdministrada', medicacaoId: 'sf09', descricao: 'SF' },
        { tipo: 'tempoPassou', minutos: 20 },
        { tipo: 'medicacaoAdministrada', medicacaoId: 'ampicilina', descricao: 'Amp' },
        { tipo: 'tempoPassou', minutos: 60 },
      ],
      pedidos: [{ id: 1, exameId: 'hemocultura', pedidoNoMinuto: 40 }],
      agoraMin: 90,
    });
    const porId = Object.fromEntries(r.condutas.map((c) => [c.conduta.id, c]));
    expect(porId.o2?.feita).toBe(true);
    expect(porId.expansao).toMatchObject({ feita: true, noPrazo: true, minuto: 10 });
    expect(porId.ampicilina).toMatchObject({ feita: true, noPrazo: true, minuto: 30 });
    expect(porId.hemocultura?.feita).toBe(false);
    expect(porId.hemocultura?.texto).toMatch(/DEPOIS da 1ª dose/);
    expect(porId.gentamicina?.feita).toBe(false);
    expect(r.primeiraDose?.medicacaoId).toBe('sf09');
    expect(r.errosPorTipo.volume).toBe(1);
    expect(r.acertosPorTipo.volume).toBe(1);
    expect(r.itensDeMedicacao).toBe(2);
    expect(r.caso.hipotese).toBe('Sepse neonatal precoce.');
  });

  it('dose fora do prazo vale meio ponto', () => {
    const r = gerarRelatorio({
      ...base,
      eventos: [
        { tipo: 'tempoPassou', minutos: 90 },
        { tipo: 'medicacaoAdministrada', medicacaoId: 'ampicilina', descricao: 'Amp' },
      ],
      pedidos: [{ id: 1, exameId: 'hemocultura', pedidoNoMinuto: 5 }],
      agoraMin: 90,
    });
    const amp = r.condutas.find((c) => c.conduta.id === 'ampicilina')!;
    expect(amp).toMatchObject({ feita: true, noPrazo: false });
    expect(r.condutas.find((c) => c.conduta.id === 'hemocultura')?.feita).toBe(true);
    expect(r.aproveitamento).toBeGreaterThan(0);
    expect(r.aproveitamento).toBeLessThan(100);
  });

  it('diz com qual versão do banco o aluno treinou (B7)', () => {
    const r = gerarRelatorio({ ...base, eventos: [], pedidos: [], agoraMin: 0 });
    expect(r.banco).toEqual({ texto: `versão ${VERSAO_ATUAL.versao} de ${dataBrasileira(VERSAO_ATUAL.data)}`, versao: VERSAO_ATUAL.versao, codigo: VERSAO_ATUAL.codigo, local: false });
    const comLocal = gerarRelatorio({ ...base, medicacoes: BANCO_MEDICACOES.map((m) => (m.id === 'ampicilina' ? { ...m, alertas: ['local'] } : m)), eventos: [], pedidos: [], agoraMin: 0 });
    expect(comLocal.banco.local).toBe(true);
    expect(comLocal.banco.texto).toContain('mudanças deste computador');
  });

  it('histórico: resumo e leitura segura', () => {
    const r = gerarRelatorio({ ...base, eventos: [], pedidos: [], agoraMin: 0 });
    const resumo = resumoParaHistorico(r, new Date('2026-10-01T12:00:00Z'));
    expect(resumo).toMatchObject({ casoId: 'caso02-sepse-neonatal', erros: 1, banco: `versão ${VERSAO_ATUAL.versao} de ${dataBrasileira(VERSAO_ATUAL.data)}` });
    expect(lerHistorico(JSON.stringify([resumo, { lixo: 1 }]))).toEqual([resumo]);
    expect(lerHistorico('não é json')).toEqual([]);
  });
});
