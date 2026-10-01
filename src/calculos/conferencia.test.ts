// Números ilustrativos para testar a matemática: NÃO são doses clínicas.
import { describe, expect, it } from 'vitest';
import { prepararSeringaBic } from './bic';
import { conferirSeringaBic, conferirValor } from './conferencia';

describe('conferir a resposta do aluno', () => {
  it('aceita a resposta exata', () => {
    expect(conferirValor(0.875, 0.875).correto).toBe(true);
  });

  it('aceita arredondamento dentro da margem padrão de 1% (0,88 para 0,875)', () => {
    expect(conferirValor(0.88, 0.875).correto).toBe(true);
  });

  it('recusa erro maior que a margem (0,9 para 0,875) e mostra a diferença', () => {
    const resultado = conferirValor(0.9, 0.875);
    expect(resultado.correto).toBe(false);
    expect(resultado.diferenca).toBeCloseTo(0.025, 10);
  });

  it('não se confunde com "sobras" do computador (12 − 0,3 = 11,7) mesmo sem margem', () => {
    expect(conferirValor(11.7, 12 - 0.3, { relativa: 0, absoluta: 0 }).correto).toBe(true);
  });

  it('aceita margem absoluta (até 0,05 mL de diferença)', () => {
    expect(conferirValor(11.75, 11.7, { relativa: 0, absoluta: 0.05 }).correto).toBe(true);
    expect(conferirValor(11.8, 11.7, { relativa: 0, absoluta: 0.05 }).correto).toBe(false);
  });

  it('recusa resposta em branco', () => {
    expect(conferirValor(Number.NaN, 1).correto).toBe(false);
  });
});

describe('conferir a seringa da BIC (12 mL)', () => {
  const gabarito = prepararSeringaBic({ volumeMedicacaoMl: 0.3, volumeFinalMl: 12, quantidadeDeDroga: 6 });
  if (!gabarito.aplicavel) throw new Error('gabarito deveria ser aplicável');

  it('tudo certo: 0,3 mL + 11,7 mL, concentração 0,5', () => {
    const conferencia = conferirSeringaBic(
      { volumeMedicacaoMl: 0.3, volumeSoroMl: 11.7, concentracaoFinal: 0.5 },
      gabarito,
    );
    expect(conferencia.tudoCerto).toBe(true);
  });

  it('aluno completou com 12 mL de SF em vez de 11,7: erra o SF e a soma', () => {
    const conferencia = conferirSeringaBic({ volumeMedicacaoMl: 0.3, volumeSoroMl: 12 }, gabarito);
    expect(conferencia.volumeMedicacao.correto).toBe(true);
    expect(conferencia.volumeSoro.correto).toBe(false);
    expect(conferencia.somaIgualVolumeFinal.correto).toBe(false);
    expect(conferencia.tudoCerto).toBe(false);
  });

  it('aluno errou a concentração final', () => {
    const conferencia = conferirSeringaBic(
      { volumeMedicacaoMl: 0.3, volumeSoroMl: 11.7, concentracaoFinal: 5 },
      gabarito,
    );
    expect(conferencia.concentracaoFinal?.correto).toBe(false);
    expect(conferencia.tudoCerto).toBe(false);
  });
});
