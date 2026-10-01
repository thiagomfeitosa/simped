import { describe, expect, it } from 'vitest';
import { casoDemonstracao } from '../casos/demonstracao';
import { reproduzirEventos } from '../motor/paciente';
import { camposVazios } from '../prescricao/itemMedicacao';
import {
  type AcaoSessao,
  descreverRegistro,
  fazerNaSessao,
  iniciarSessao,
  guardarSessao,
  lerSessaoGuardada,
  registrar,
  type RegistroSessao,
  reproduzirSessao,
  temTrabalho,
} from './sessao';

const T0 = new Date('2026-10-01T10:00:00Z');

/** Registra várias ações seguidas, com o minuto do caso tirado do próprio estado. */
function jogar(acoes: (AcaoSessao | [AcaoSessao, 'professor'])[]): RegistroSessao[] {
  let registros: RegistroSessao[] = [];
  acoes.forEach((x, i) => {
    const [acao, autor] = Array.isArray(x) ? x : [x, 'aluno' as const];
    const minutoCaso = reproduzirSessao(registros).minutoCaso;
    registros = registrar(registros, acao, { horaReal: new Date(T0.getTime() + i * 1000), minutoCaso, autor });
  });
  return registros;
}

describe('registro da sessão', () => {
  it('reconstrói folha, paciente, exames, balanço e receita a partir dos registros', () => {
    const registros = jogar([
      { tipo: 'prescricao', acao: { tipo: 'adicionarMedicacao', secao: 'medicacoes' } },
      { tipo: 'prescricao', acao: { tipo: 'editarMedicacao', secao: 'medicacoes', id: 1, campos: { ...camposVazios('dipirona'), dose: '4' } } },
      { tipo: 'prescricao', acao: { tipo: 'editarMedicacao', secao: 'medicacoes', id: 1, campos: { ...camposVazios('dipirona'), dose: '400' } } },
      { tipo: 'tempo', minutos: 5 },
      { tipo: 'administrar', medicacaoId: 'dipirona', descricao: 'Dipirona 400 mg EV' },
      { tipo: 'pedirExame', exameId: 'hemograma', nome: 'Hemograma' },
      { tipo: 'balanco', registro: { tipo: 'saida', descricao: 'Vômito', volumeMl: 50 } },
      { tipo: 'administrar', medicacaoId: 'soro', descricao: 'SG 5%', vazaoMlH: 40 },
      { tipo: 'receitaAdicionar' },
      { tipo: 'rascunho', texto: '16 x' },
      { tipo: 'rascunho', texto: '16 x 25 = 400' },
    ]);
    const s = reproduzirSessao(registros);
    expect(s.minutoCaso).toBe(5);
    expect(s.prescricao.itens.medicacoes).toHaveLength(1);
    expect(s.prescricao.itens.exames.map((i) => i.tipo === 'texto' && i.texto)).toEqual(['Hemograma']);
    expect(s.pedidos).toEqual([{ id: 1, exameId: 'hemograma', pedidoNoMinuto: 5 }]);
    expect(s.registrosBalanco[0]).toMatchObject({ id: 1, minuto: 5, volumeMl: 50 });
    expect(s.infusoes[0]).toMatchObject({ inicioMin: 5, vazaoMlH: 40 });
    expect(s.receita).toHaveLength(1);
    expect(s.rascunho).toBe('16 x 25 = 400');
    const paciente = reproduzirEventos(casoDemonstracao, s.eventosPaciente);
    expect(paciente.tempoMin).toBe(5);
    expect(paciente.registro.map((r) => r.descricao)).toContain('Administrado: Dipirona 400 mg EV');
  });

  it('junta digitação e edições seguidas do mesmo item num registro só', () => {
    const registros = jogar([
      { tipo: 'prescricao', acao: { tipo: 'adicionar', secao: 'dieta' } },
      { tipo: 'prescricao', acao: { tipo: 'editar', secao: 'dieta', id: 1, texto: 'L' } },
      { tipo: 'prescricao', acao: { tipo: 'editar', secao: 'dieta', id: 1, texto: 'LM' } },
      { tipo: 'prescricao', acao: { tipo: 'editar', secao: 'dieta', id: 1, texto: 'LM livre demanda' } },
      { tipo: 'tempo', minutos: 1 },
      { tipo: 'tempo', minutos: 1 },
      { tipo: 'tempo', minutos: 3 },
    ]);
    expect(registros).toHaveLength(3);
    expect(registros.map((r) => r.n)).toEqual([1, 2, 3]);
    expect(descreverRegistro(registros[1]!)).toBe('Escreveu em dieta: LM livre demanda');
    expect(descreverRegistro(registros[2]!)).toBe('Relógio do caso: +5 min');
    expect(reproduzirSessao(registros).minutoCaso).toBe(5);
  });

  it('cada registro guarda o minuto do caso em que aconteceu', () => {
    const registros = jogar([{ tipo: 'tempo', minutos: 30 }, { tipo: 'administrar', medicacaoId: 'dipirona', descricao: 'x' }]);
    expect(registros[1]!.minutoCaso).toBe(30);
  });

  it('rever o caso: o estado em qualquer ponto da lista', () => {
    const registros = jogar([
      { tipo: 'prescricao', acao: { tipo: 'adicionar', secao: 'dieta', texto: 'Jejum' } },
      { tipo: 'tempo', minutos: 60 },
      { tipo: 'prescricao', acao: { tipo: 'remover', secao: 'dieta', id: 1 } },
    ]);
    expect(reproduzirSessao(registros, 1).prescricao.itens.dieta).toHaveLength(1);
    expect(reproduzirSessao(registros, 3).prescricao.itens.dieta).toHaveLength(0);
  });

  it('professor: sinais, complicação e mensagem entram no paciente e não se juntam com o aluno', () => {
    const registros = jogar([
      { tipo: 'tempo', minutos: 1 },
      [{ tipo: 'tempo', minutos: 1 }, 'professor'],
      [{ tipo: 'professorSinais', sinais: { spo2: 85 }, motivo: 'dessaturou' }, 'professor'],
      [{ tipo: 'complicacao', id: 'febre', nome: 'Febre alta', mudancas: [{ sinal: 'temperaturaC', alvo: 40, duracaoMin: 10 }] }, 'professor'],
      [{ tipo: 'mensagem', texto: 'A mãe diz que ele convulsionou' }, 'professor'],
      { tipo: 'tempo', minutos: 10 },
    ]);
    expect(registros.filter((r) => r.acao.tipo === 'tempo')).toHaveLength(3);
    const s = reproduzirSessao(registros);
    expect(s.mensagens).toEqual([{ minutoCaso: 2, texto: 'A mãe diz que ele convulsionou' }]);
    const p = reproduzirEventos(casoDemonstracao, s.eventosPaciente);
    expect(p.sinais.spo2).toBe(85);
    expect(p.sinais.temperaturaC).toBe(40);
    expect(p.registro.map((r) => r.descricao)).toContain('Complicação: Febre alta');
    expect(descreverRegistro(registros[2]!)).toBe('Professor alterou SpO₂ 85 (dessaturou)');
  });

  it('salvar e continuar: grava e lê de volta; recusa lixo', () => {
    const registros = jogar([{ tipo: 'prescricao', acao: { tipo: 'adicionar', secao: 'dieta', texto: 'Jejum' } }]);
    const guardada = guardarSessao('demonstracao', 'Caso de demonstração', registros, T0);
    const lida = lerSessaoGuardada(JSON.stringify(guardada));
    expect(lida?.casoId).toBe('demonstracao');
    expect(reproduzirSessao(lida!.registros).prescricao.itens.dieta).toHaveLength(1);
    expect(lerSessaoGuardada('lixo')).toBeNull();
    expect(lerSessaoGuardada(JSON.stringify({ versao: 2 }))).toBeNull();
    expect(lerSessaoGuardada(null)).toBeNull();
  });

  it('B16: a variação sorteada vai junto com a sessão guardada', () => {
    const registros = jogar([{ tipo: 'rascunho', texto: '20 kg x 2' }]);
    const variacao = { semente: 5, pesoKg: 20.3, pesoNascerG: 3300, idadeDias: -12, apresentacoes: { gentamicina: ['a'] } };
    const lida = lerSessaoGuardada(JSON.stringify(guardarSessao('caso06-asma-grave', 'Asma', registros, T0, variacao)));
    expect(lida?.variacao).toEqual(variacao);
    expect(lerSessaoGuardada(JSON.stringify(guardarSessao('caso06-asma-grave', 'Asma', registros, T0)))?.variacao).toBeUndefined();
    // variação estragada: não continua (as contas mudariam de peso)
    expect(lerSessaoGuardada(JSON.stringify({ ...guardarSessao('x', 'x', registros, T0), variacao: { pesoKg: 'muito' } }))).toBeNull();
  });

  it('fazer passo a passo dá o mesmo estado que reproduzir a lista inteira', () => {
    const acoes: AcaoSessao[] = [
      { tipo: 'prescricao', acao: { tipo: 'adicionar', secao: 'dieta' } },
      { tipo: 'prescricao', acao: { tipo: 'editar', secao: 'dieta', id: 1, texto: 'Je' } },
      { tipo: 'prescricao', acao: { tipo: 'editar', secao: 'dieta', id: 1, texto: 'Jejum' } },
      { tipo: 'tempo', minutos: 2 },
      { tipo: 'tempo', minutos: 0.5 },
      { tipo: 'tempo', minutos: 3 },
      { tipo: 'pedirExame', exameId: 'pcr', nome: 'PCR' },
      { tipo: 'rascunho', texto: 'a' },
      { tipo: 'rascunho', texto: 'ab' },
    ];
    let sessao = iniciarSessao();
    acoes.forEach((a, i) => (sessao = fazerNaSessao(sessao, a, new Date(T0.getTime() + i))));
    expect(sessao.estado).toEqual(reproduzirSessao(sessao.registros));
    expect(sessao.estado.minutoCaso).toBe(5);
    expect(iniciarSessao(sessao.registros).estado).toEqual(sessao.estado);
  });

  it('só o relógio andando não conta como trabalho', () => {
    expect(temTrabalho(jogar([{ tipo: 'tempo', minutos: 5 }]))).toBe(false);
    expect(temTrabalho(jogar([{ tipo: 'rascunho', texto: 'a' }]))).toBe(true);
  });
});
