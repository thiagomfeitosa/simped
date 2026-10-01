// Caso fictício só para testar o motor: os números não têm significado clínico.
import { describe, expect, it } from 'vitest';
import type { CasoClinico } from '../casos/tipos';
import { acrescentarEvento, aplicarEvento, type EventoPaciente, iniciarPaciente, reproduzirEventos } from './paciente';

const caso: CasoClinico = {
  id: 'teste',
  titulo: 'Teste',
  inicio: '2026-10-01T08:00',
  paciente: {
    nome: 'X',
    nascimento: '2025-09-01T08:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3200,
    pesoKg: 10,
    sexo: 'M',
    leito: '1',
  },
  queixa: '',
  historia: '',
  exameFisico: '',
  sinaisIniciais: { fc: 100, fr: 30, spo2: 95, paSistolica: 90, paDiastolica: 50, temperaturaC: 38, glicemiaMgDl: 80 },
  evolucaoNatural: [{ sinal: 'temperaturaC', alvo: 40, atrasoMin: 0, duracaoMin: 100 }],
  respostas: [
    {
      medicacaoId: 'droga-x',
      mudancas: [{ sinal: 'temperaturaC', alvo: 37, atrasoMin: 10, duracaoMin: 20 }],
      status: 'A_VALIDAR',
    },
    {
      medicacaoId: 'droga-imediata',
      mudancas: [{ sinal: 'spo2', alvo: 99, atrasoMin: 0, duracaoMin: 0 }],
      status: 'A_VALIDAR',
    },
  ],
};

describe('motor do paciente', () => {
  it('começa com os sinais iniciais do caso', () => {
    const p = iniciarPaciente(caso);
    expect(p.tempoMin).toBe(0);
    expect(p.sinais.temperaturaC).toBe(38);
  });

  it('evolução natural: a febre sobe em linha reta (38 → 40 em 100 min; após 50 min = 39)', () => {
    const p = aplicarEvento(iniciarPaciente(caso), { tipo: 'tempoPassou', minutos: 50 }, caso);
    expect(p.tempoMin).toBe(50);
    expect(p.sinais.temperaturaC).toBeCloseTo(39, 10);
  });

  it('depois do fim da mudança o sinal fica parado no alvo', () => {
    const p = aplicarEvento(iniciarPaciente(caso), { tipo: 'tempoPassou', minutos: 300 }, caso);
    expect(p.sinais.temperaturaC).toBe(40);
    expect(p.mudancas).toEqual([]);
  });

  it('medicação: nada muda durante o atraso; depois leva o sinal ao alvo e interrompe a febre subindo', () => {
    let p = iniciarPaciente(caso);
    p = aplicarEvento(p, { tipo: 'medicacaoAdministrada', medicacaoId: 'droga-x', descricao: 'Droga X' }, caso);
    p = aplicarEvento(p, { tipo: 'tempoPassou', minutos: 10 }, caso);
    expect(p.sinais.temperaturaC).toBeCloseTo(38.2, 10); // ainda só a evolução natural (10 min)

    p = aplicarEvento(p, { tipo: 'tempoPassou', minutos: 10 }, caso);
    expect(p.sinais.temperaturaC).toBeCloseTo(37.6, 10); // metade do caminho de 38,2 até 37

    p = aplicarEvento(p, { tipo: 'tempoPassou', minutos: 60 }, caso);
    expect(p.sinais.temperaturaC).toBe(37); // a febre não volta a subir sozinha
  });

  it('mudança imediata (duração 0) aparece na hora', () => {
    const p = aplicarEvento(
      iniciarPaciente(caso),
      { tipo: 'medicacaoAdministrada', medicacaoId: 'droga-imediata', descricao: 'Imediata' },
      caso,
    );
    expect(p.sinais.spo2).toBe(99);
  });

  it('medicação sem efeito definido no caso fica registrada e não muda nada', () => {
    const antes = iniciarPaciente(caso);
    const depois = aplicarEvento(antes, { tipo: 'medicacaoAdministrada', medicacaoId: 'outra', descricao: 'Outra' }, caso);
    expect(depois.sinais).toEqual(antes.sinais);
    expect(depois.registro.at(-1)?.descricao).toContain('sem efeito definido');
  });

  it('professor altera um sinal e cancela a mudança em andamento naquele sinal', () => {
    let p = iniciarPaciente(caso);
    p = aplicarEvento(p, { tipo: 'professorAlterouSinais', sinais: { temperaturaC: 36.5, fc: 160 } }, caso);
    p = aplicarEvento(p, { tipo: 'tempoPassou', minutos: 60 }, caso);
    expect(p.sinais.temperaturaC).toBe(36.5);
    expect(p.sinais.fc).toBe(160);
    expect(p.registro.at(-1)?.descricao).toContain('Professor');
  });

  it('a mesma lista de eventos sempre gera o mesmo paciente', () => {
    const eventos = [
      { tipo: 'tempoPassou', minutos: 15 },
      { tipo: 'medicacaoAdministrada', medicacaoId: 'droga-x', descricao: 'Droga X' },
      { tipo: 'tempoPassou', minutos: 40 },
    ] as const;
    expect(reproduzirEventos(caso, eventos)).toEqual(reproduzirEventos(caso, eventos));
    expect(reproduzirEventos(caso, eventos).tempoMin).toBe(55);
  });
});

describe('acrescentarEvento', () => {
  it('junta "tempo passou" seguidos sem mudar o paciente', () => {
    let lista: EventoPaciente[] = [];
    for (let i = 0; i < 30; i++) lista = acrescentarEvento(lista, { tipo: 'tempoPassou', minutos: 1 });
    expect(lista).toEqual([{ tipo: 'tempoPassou', minutos: 30 }]);
    const separado = Array.from({ length: 30 }, () => ({ tipo: 'tempoPassou', minutos: 1 }) as EventoPaciente);
    expect(reproduzirEventos(caso, lista).sinais).toEqual(reproduzirEventos(caso, separado).sinais);
  });
  it('não junta eventos de outro tipo', () => {
    let lista: EventoPaciente[] = [];
    lista = acrescentarEvento(lista, { tipo: 'tempoPassou', minutos: 5 });
    lista = acrescentarEvento(lista, { tipo: 'medicacaoAdministrada', medicacaoId: 'droga-x', descricao: 'X' });
    lista = acrescentarEvento(lista, { tipo: 'tempoPassou', minutos: 5 });
    expect(lista).toHaveLength(3);
  });
});

describe('anotação', () => {
  it('entra na linha do tempo e não muda os sinais', () => {
    const antes = reproduzirEventos(caso, [{ tipo: 'tempoPassou', minutos: 10 }]);
    const depois = reproduzirEventos(caso, [
      { tipo: 'tempoPassou', minutos: 10 },
      { tipo: 'anotacao', descricao: 'Pedido: hemograma' },
    ]);
    expect(depois.sinais).toEqual(antes.sinais);
    expect(depois.registro.at(-1)).toEqual({ tempoMin: 10, descricao: 'Pedido: hemograma' });
  });
});

describe('B10: ritmo, padrão respiratório, TEC e Glasgow', () => {
  const casoRitmo: CasoClinico = {
    ...casoBaseRitmo(),
    sinaisIniciais: { fc: 260, fr: 50, spo2: 96, paSistolica: 80, paDiastolica: 50, temperaturaC: 36.8, glicemiaMgDl: 90, tecS: 3 },
    estadoInicial: { ritmo: 'tsv', padraoRespiratorio: 'taquipneia' },
    respostas: [
      {
        medicacaoId: 'adenosina',
        mudancas: [{ sinal: 'fc', alvo: 140, atrasoMin: 0, duracaoMin: 1 }],
        mudancasDeEstado: [{ campo: 'ritmo', valor: 'sinusal', atrasoMin: 0 }],
        status: 'A_VALIDAR',
      },
    ],
  };

  it('começa com o estado do caso e os valores padrão', () => {
    const p = iniciarPaciente(casoRitmo);
    expect(p.clinico).toEqual({ ritmo: 'tsv', padraoRespiratorio: 'taquipneia' });
    expect(p.sinais.tecS).toBe(3);
    expect(p.sinais.glasgow).toBe(15);
  });

  it('a medicação troca o ritmo (dose certa)', () => {
    const p = reproduzirEventos(casoRitmo, [{ tipo: 'medicacaoAdministrada', medicacaoId: 'adenosina', descricao: 'x', avaliacao: { nivel: 'certa' } }]);
    expect(p.clinico.ritmo).toBe('sinusal');
  });

  it('B9: subdose dá efeito parcial e não troca o ritmo', () => {
    const p = reproduzirEventos(casoRitmo, [
      { tipo: 'medicacaoAdministrada', medicacaoId: 'adenosina', descricao: 'x', avaliacao: { nivel: 'subdose', fracao: 0.5 } },
      { tipo: 'tempoPassou', minutos: 5 },
    ]);
    expect(p.clinico.ritmo).toBe('tsv');
    expect(p.sinais.fc).toBe(200); // metade do caminho de 260 até 140
    expect(p.registro.at(-1)!.descricao).toContain('efeito parcial');
  });

  it('B9: sobredose dá o efeito do caso + o adverso da tabela (adenosina: assistolia transitória)', () => {
    let p = reproduzirEventos(casoRitmo, [{ tipo: 'medicacaoAdministrada', medicacaoId: 'adenosina', descricao: 'x', avaliacao: { nivel: 'sobredose' } }]);
    expect(p.clinico.ritmo).toBe('assistolia');
    expect(p.registro.at(-1)!.descricao).toContain('efeito adverso');
    p = aplicarEvento(p, { tipo: 'tempoPassou', minutos: 1 }, casoRitmo);
    expect(p.clinico.ritmo).toBe('sinusal');
  });

  it('variação relativa (soma) e limites físicos', () => {
    const caso: CasoClinico = {
      ...casoRitmo,
      respostas: [{ medicacaoId: 'x', mudancas: [{ sinal: 'glasgow', alvo: -20, atrasoMin: 0, duracaoMin: 0, modo: 'soma' }], status: 'A_VALIDAR' }],
    };
    const p = reproduzirEventos(caso, [{ tipo: 'medicacaoAdministrada', medicacaoId: 'x', descricao: 'x' }]);
    expect(p.sinais.glasgow).toBe(3);
  });

  it('professor troca o ritmo e a complicação muda o padrão respiratório', () => {
    let p = reproduzirEventos(casoRitmo, [{ tipo: 'professorAlterouSinais', sinais: { fc: 0 }, clinico: { ritmo: 'fv' } }]);
    expect(p.clinico.ritmo).toBe('fv');
    p = aplicarEvento(p, { tipo: 'complicacao', nome: 'Apneia', mudancas: [{ sinal: 'spo2', alvo: 70, duracaoMin: 3 }], clinico: { padraoRespiratorio: 'apneia' } }, casoRitmo);
    expect(p.clinico.padraoRespiratorio).toBe('apneia');
    p = aplicarEvento(p, { tipo: 'tempoPassou', minutos: 3 }, casoRitmo);
    expect(p.sinais.spo2).toBe(70);
  });

  it('evolução do estado ao longo do tempo', () => {
    const caso: CasoClinico = { ...casoRitmo, evolucaoDoEstado: [{ campo: 'padraoRespiratorio', valor: 'gasping', atrasoMin: 10 }] };
    expect(reproduzirEventos(caso, [{ tipo: 'tempoPassou', minutos: 9 }]).clinico.padraoRespiratorio).toBe('taquipneia');
    expect(reproduzirEventos(caso, [{ tipo: 'tempoPassou', minutos: 10 }]).clinico.padraoRespiratorio).toBe('gasping');
  });
});

function casoBaseRitmo(): CasoClinico {
  return { ...caso, evolucaoNatural: [], respostas: [] };
}
