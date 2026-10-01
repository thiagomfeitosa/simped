import { describe, expect, it } from 'vitest';
import { podeCorrigirAluno, verificarBanco } from './consulta';
import { dipirona } from './exemplos-a-validar';
import { BANCO_MEDICACOES } from './index';
import {
  aplicarValidacoes,
  arquivoDeValidacoes,
  historicoDoAlvo,
  juntarHistoricos,
  lerValidacoes,
  registrarValidacao,
  textoDaRegraCompleta,
  type Validacao,
  verificarValidacao,
} from './validacoes';

const regra = dipirona.regras[0]!;
const ap = dipirona.apresentacoes[0]!;

function conferida(extra: Partial<Validacao> = {}): Validacao {
  return {
    alvo: { tipo: 'regra', medicacaoId: 'dipirona', itemId: regra.id },
    status: 'CONFERIDO',
    fonte: { codigo: 'SBP', documentoId: 'SBP-TRATADO', pagina: '123' },
    quem: 'Usuário',
    quando: '2026-10-01T10:00:00.000Z',
    valorAnterior: textoDaRegraCompleta(regra),
    ...extra,
  };
}

describe('modo validação', () => {
  it('CONFERIDO exige documento e página', () => {
    expect(verificarValidacao(conferida(), [dipirona])).toEqual([]);
    expect(verificarValidacao(conferida({ fonte: { codigo: 'SBP' } }), [dipirona])).toHaveLength(2);
    // só anotar (A VALIDAR) não exige nada
    expect(verificarValidacao(conferida({ status: 'A_VALIDAR', fonte: { codigo: 'SBP' } }), [dipirona])).toEqual([]);
  });

  it('acusa item inexistente e correção absurda', () => {
    expect(verificarValidacao(conferida({ alvo: { tipo: 'regra', medicacaoId: 'dipirona', itemId: 'xx' } }), [dipirona])[0]).toContain('não existe');
    const errada = conferida({ correcaoRegra: { dose: { tipo: 'porKg', min: 20, max: 10, unidade: 'mg', por: 'dose' } } });
    expect(verificarValidacao(errada, [dipirona]).join(' ')).toContain('mínima corrigida está maior');
    const zero = conferida({ alvo: { tipo: 'apresentacao', medicacaoId: 'dipirona', itemId: ap.id }, correcaoApresentacao: { volumeMl: 0 } });
    expect(verificarValidacao(zero, [dipirona]).join(' ')).toContain('volume corrigido');
  });

  it('aplica a conferência: status, fonte e valor corrigido; a regra passa a corrigir o aluno', () => {
    const v = conferida({ correcaoRegra: { dose: { tipo: 'porKg', min: 15, max: 25, unidade: 'mg', por: 'dose' } } });
    const [med] = aplicarValidacoes([dipirona], [v]);
    const r = med!.regras[0]!;
    expect(r.status).toBe('CONFERIDO');
    expect(r.fonte.documentoId).toBe('SBP-TRATADO');
    expect(r.dose).toEqual({ tipo: 'porKg', min: 15, max: 25, unidade: 'mg', por: 'dose' });
    expect(podeCorrigirAluno(r)).toBe(true);
    // o resto da medicação não muda
    expect(med!.regras[1]).toBe(dipirona.regras[1]);
    expect(verificarBanco([med!])).toEqual([]);
  });

  it('vale o registro mais recente, e o histórico guarda todos', () => {
    let h = registrarValidacao([], conferida());
    h = registrarValidacao(h, conferida({ status: 'A_VALIDAR', quando: '2026-10-02T10:00:00.000Z', nota: 'desfeito' }));
    expect(aplicarValidacoes([dipirona], h)[0]!.regras[0]!.status).toBe('A_VALIDAR');
    expect(historicoDoAlvo(h, conferida().alvo)).toHaveLength(2);
  });

  it('dose máxima apagada continua apagada depois de salvar em arquivo', () => {
    const comMaxima = dipirona.regras.find((r) => r.doseMaxima)!;
    const v = conferida({ alvo: { tipo: 'regra', medicacaoId: 'dipirona', itemId: comMaxima.id }, correcaoRegra: { doseMaxima: null } });
    const relido = lerValidacoes(arquivoDeValidacoes([v], new Date()));
    const r = aplicarValidacoes([dipirona], relido)[0]!.regras.find((x) => x.id === comMaxima.id)!;
    expect(r.doseMaxima).toBeUndefined();
  });

  it('apresentação conferida', () => {
    const v = conferida({ alvo: { tipo: 'apresentacao', medicacaoId: 'dipirona', itemId: ap.id }, correcaoApresentacao: { descricao: 'Ampola 500 mg/mL, 2 mL (Santa Casa)' } });
    const [med] = aplicarValidacoes([dipirona], [v]);
    expect(med!.apresentacoes[0]!.status).toBe('CONFERIDO');
    expect(med!.apresentacoes[0]!.descricao).toContain('Santa Casa');
  });

  it('arquivo .json: escreve e lê de volta; ignora lixo', () => {
    const texto = arquivoDeValidacoes([conferida()], new Date('2026-10-01T12:00:00Z'));
    expect(lerValidacoes(texto)).toHaveLength(1);
    expect(lerValidacoes(JSON.stringify([conferida(), { alvo: 1 }]))).toHaveLength(1);
    expect(lerValidacoes('não é json')).toEqual([]);
    expect(lerValidacoes(null)).toEqual([]);
  });

  it('juntar históricos não repete o mesmo registro', () => {
    const a = [conferida()];
    const b = [conferida(), conferida({ quando: '2026-10-03T10:00:00.000Z' })];
    expect(juntarHistoricos(a, b)).toHaveLength(2);
  });

  it('o banco do projeto continua íntegro com as validações do projeto aplicadas', () => {
    expect(verificarBanco(BANCO_MEDICACOES)).toEqual([]);
  });
});
