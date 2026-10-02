import { describe, expect, it } from 'vitest';
import { caso01 } from '../casos/clinicos/caso01-hipoglicemia-rn';
import { caso10 } from '../casos/clinicos/caso10-cetoacidose';
import { caso15 } from '../casos/clinicos/caso15-hiponatremia';
import { casoDemonstracao } from '../casos/demonstracao';
import { COMPLICACOES } from '../dados/complicacoes';
import { resultadoDoPedido } from '../exames/exames';
import { excessoDeBases, labInicial, phHendersonHasselbalch, valoresNaColeta } from './laboratorio';
import { type EventoPaciente, iniciarPaciente, reproduzirEventos } from './paciente';

const convulsao = COMPLICACOES.find((c) => c.id === 'convulsao')!;
const eventoConvulsao: EventoPaciente = { tipo: 'complicacao', nome: convulsao.nome, mudancas: convulsao.mudancas };

describe('química do ácido-base', () => {
  it('Henderson-Hasselbalch: HCO₃⁻ 24 e pCO₂ 40 → pH ≈ 7,39', () => {
    expect(phHendersonHasselbalch(24, 40)).toBeCloseTo(7.39, 2);
  });
  it('BE ≈ 0 no normal e muito negativo na acidose metabólica', () => {
    expect(excessoDeBases(24.4, 7.4)).toBeCloseTo(0, 5);
    expect(excessoDeBases(6, 7.05)).toBeLessThan(-20);
  });
});

describe('exames ligados ao paciente (Fase 2)', () => {
  it('sem nada acontecer, o exame é exatamente o do arquivo do caso', () => {
    const inicio = iniciarPaciente(caso10);
    expect(valoresNaColeta('gasometria-venosa', caso10, inicio)).toEqual(caso10.resultadosExames!['gasometria-venosa']!.valores);
    expect(valoresNaColeta('eletrolitos', caso10, inicio)).toEqual(caso10.resultadosExames!.eletrolitos!.valores);
  });

  it('o laboratório começa nos exames da admissão; o que falta parte do normal', () => {
    const lab = labInicial(caso10);
    expect(lab.hco3).toBe(6);
    expect(lab.k).toBe(5.2);
    expect(labInicial(casoDemonstracao).lactato).toBe(2.8);
    expect(labInicial(casoDemonstracao).bhb).toBe(0.2); // o caso não traz cetonemia: parte do normal
  });

  it('cetoacidose: depois de horas de insulina o HCO₃⁻ e o pH sobem, o potássio e a cetonemia caem', () => {
    const eventos: EventoPaciente[] = [
      { tipo: 'medicacaoAdministrada', medicacaoId: 'insulina-regular', descricao: 'Insulina 0,1 UI/kg/h' },
      { tipo: 'tempoPassou', minutos: 6 * 60 },
    ];
    const depois = reproduzirEventos(caso10, eventos);
    const gaso = valoresNaColeta('gasometria-venosa', caso10, depois);
    const antes = caso10.resultadosExames!['gasometria-venosa']!.valores!;
    expect(gaso.hco3!).toBeGreaterThan(antes.hco3!);
    expect(gaso.ph!).toBeGreaterThan(antes.ph!);
    expect(gaso.be!).toBeGreaterThan(antes.be!);
    const ele = valoresNaColeta('eletrolitos', caso10, depois);
    expect(ele.k!).toBeLessThan(caso10.resultadosExames!.eletrolitos!.valores!.k!);
    expect(valoresNaColeta('cetonemia', caso10, depois).bhb!).toBeLessThan(6.5);
    // a glicose sérica acompanha a glicemia capilar do paciente
    expect(valoresNaColeta('glicemia', caso10, depois).glicose!).toBeLessThan(480);
  });

  it('bicarbonato: o HCO₃⁻ sobe em minutos e o pH melhora (efeito geral, A VALIDAR)', () => {
    const eventos: EventoPaciente[] = [
      { tipo: 'medicacaoAdministrada', medicacaoId: 'bicarbonato-sodio', descricao: 'Bicarbonato de sódio' },
      { tipo: 'tempoPassou', minutos: 20 },
    ];
    const gaso = valoresNaColeta('gasometria-venosa', caso10, reproduzirEventos(caso10, eventos));
    expect(gaso.hco3).toBeCloseTo(11, 5);
    expect(gaso.ph!).toBeGreaterThan(7.05);
  });

  it('convulsão: acidose mista na gasometria do caso (lactato e pCO₂ sobem, HCO₃⁻ e pH caem)', () => {
    const antes = casoDemonstracao.resultadosExames!['gasometria-venosa']!.valores!;
    const depois = reproduzirEventos(casoDemonstracao, [eventoConvulsao, { tipo: 'tempoPassou', minutos: 10 }]);
    const gaso = valoresNaColeta('gasometria-venosa', casoDemonstracao, depois);
    expect(gaso.lactato!).toBeGreaterThan(antes.lactato!);
    expect(gaso.pco2!).toBeGreaterThan(antes.pco2!);
    expect(gaso.hco3!).toBeLessThan(antes.hco3!);
    expect(gaso.ph!).toBeLessThan(antes.ph!);
  });

  it('convulsão num caso sem gasometria: o exame passa a existir, partindo do normal (A VALIDAR)', () => {
    expect(valoresNaColeta('gasometria-arterial', caso01, iniciarPaciente(caso01))).toEqual({});
    const depois = reproduzirEventos(caso01, [eventoConvulsao, { tipo: 'tempoPassou', minutos: 10 }]);
    const gaso = valoresNaColeta('gasometria-arterial', caso01, depois);
    expect(gaso).toMatchObject({ lactato: 5, pco2: 55, hco3: 19 });
    expect(gaso.ph!).toBeLessThan(7.25);
  });

  it('hiponatremia: o sódio dos eletrólitos sobe com o NaCl 3% (118 → 122)', () => {
    const depois = reproduzirEventos(caso15, [
      { tipo: 'medicacaoAdministrada', medicacaoId: 'nacl3', descricao: 'NaCl 3%' },
      { tipo: 'tempoPassou', minutos: 20 },
    ]);
    expect(valoresNaColeta('eletrolitos', caso15, depois).na).toBe(122);
  });

  it('o resultado é o do minuto da COLETA, não o de agora', () => {
    const eventos: EventoPaciente[] = [
      { tipo: 'anotacao', descricao: 'Exame pedido: Gasometria venosa' },
      { tipo: 'medicacaoAdministrada', medicacaoId: 'bicarbonato-sodio', descricao: 'Bicarbonato' },
      { tipo: 'tempoPassou', minutos: 30 },
    ];
    const pedido = { id: 1, exameId: 'gasometria-venosa', pedidoNoMinuto: 0, eventosAte: 1 };
    const naColeta = reproduzirEventos(caso10, eventos.slice(0, pedido.eventosAte));
    const r = resultadoDoPedido(pedido, caso10, 30, naColeta)!;
    expect(r.linhas.find((l) => l.analito.id === 'hco3')!.valor).toBe(6);
  });
});
