import { describe, expect, it } from 'vitest';
import { MEDICACOES_EXEMPLO } from '../dados/medicacoes/exemplos-a-validar';
import { alertasDaFolha, normalizar } from './alertas';
import { type EstadoPrescricao, prescricaoVazia, reduzirPrescricao } from './estado';
import { camposVazios } from './itemMedicacao';
import { soroVazio } from './soro';

const variaveis = (idadeDias: number) => ({
  idadeHoras: idadeDias * 24,
  idadeDias,
  idadeMeses: Math.floor(idadeDias / 30),
  idadeAnos: Math.floor(idadeDias / 365),
  igNascerSemanas: 39,
  idadePosMenstrualSemanas: 39 + idadeDias / 7,
  pesoKg: 3,
});

function folha(...medicacoes: string[]): EstadoPrescricao {
  let e = prescricaoVazia();
  for (const id of medicacoes) {
    e = reduzirPrescricao(e, { tipo: 'adicionarMedicacao', secao: 'medicacoes', campos: camposVazios(id) });
  }
  return e;
}

describe('normalizar', () => {
  it('tira acento, maiúscula e plural', () => {
    expect(normalizar('Penicilinas')).toBe('penicilina');
    expect(normalizar('Betalactâmicos')).toBe('betalactamico');
    expect(normalizar(' Dipirona ')).toBe('dipirona');
  });
});

describe('alertas da folha', () => {
  it('alergia direta pelo nome', () => {
    const a = alertasDaFolha(folha('dipirona'), MEDICACOES_EXEMPLO, { alergias: ['Dipirona'], paraRegra: variaveis(400) });
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ tipo: 'alergia', gravidade: 'alta', itemIds: [1] });
  });

  it('alergia pela classe (penicilinas → penicilina cristalina)', () => {
    const a = alertasDaFolha(folha('penicilina-cristalina'), MEDICACOES_EXEMPLO, { alergias: ['penicilina'], paraRegra: variaveis(3) });
    expect(a[0]?.gravidade).toBe('alta');
  });

  it('reatividade cruzada penicilina → cefalosporina (A VALIDAR)', () => {
    const a = alertasDaFolha(folha('ceftriaxona'), MEDICACOES_EXEMPLO, { alergias: ['Penicilinas'], paraRegra: variaveis(400) });
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ tipo: 'alergia', gravidade: 'media', status: 'A_VALIDAR' });
  });

  it('medicação repetida', () => {
    const a = alertasDaFolha(folha('dipirona', 'dipirona'), MEDICACOES_EXEMPLO, { paraRegra: variaveis(400) });
    expect(a).toEqual([expect.objectContaining({ tipo: 'repetida', itemIds: [1, 2] })]);
  });

  it('ceftriaxona + cálcio do soro: alerta só no RN < 28 dias', () => {
    let e = folha('ceftriaxona');
    e = reduzirPrescricao(e, {
      tipo: 'adicionarSoro',
      secao: 'volemia',
      campos: { ...soroVazio(), componentes: [{ solucaoId: 'sg10', volumeMl: '100' }, { solucaoId: 'gluconato-ca10', volumeMl: '2' }] },
    });
    const rn = alertasDaFolha(e, MEDICACOES_EXEMPLO, { paraRegra: variaveis(10) });
    expect(rn).toEqual([expect.objectContaining({ tipo: 'interacao', gravidade: 'alta', itemIds: [1, 2] })]);
    expect(alertasDaFolha(e, MEDICACOES_EXEMPLO, { paraRegra: variaveis(40) })).toEqual([]);
  });

  it('sem nada de errado, sem alerta', () => {
    expect(alertasDaFolha(folha('dipirona', 'ceftriaxona'), MEDICACOES_EXEMPLO, { alergias: [], paraRegra: variaveis(400) })).toEqual([]);
  });
});
