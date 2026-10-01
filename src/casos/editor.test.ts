import { describe, expect, it } from 'vitest';
import { BANCO_MEDICACOES } from '../dados/medicacoes';
import { caso06 } from './clinicos/caso06-asma-grave';
import { casoVazio, copiarCaso, idDoTitulo, lerCasoDeJson } from './editor';
import { verificarCaso } from './index';

describe('editor de casos', () => {
  it('caso em branco já passa no verificador', () => {
    expect(verificarCaso(casoVazio(), BANCO_MEDICACOES)).toEqual([]);
  });

  it('id a partir do título, sem acento e com prefixo', () => {
    expect(idDoTitulo('Bronquiolite grave!')).toBe('meu-bronquiolite-grave');
    expect(idDoTitulo('   ')).toBe('meu-caso');
  });

  it('cópia de um caso do app vira caso do usuário, sem mexer no original', () => {
    const copia = copiarCaso(caso06);
    // B16: a cópia leva os limites da variação do caso original
    expect(copia.variacao?.pesoKg).toEqual({ min: 18, max: 27 });
    expect(copia.id).toBe('meu-crise-de-asma-grave-copia');
    expect(copia.grupo).toBe('Meus casos');
    copia.paciente.pesoKg = 99;
    expect(caso06.paciente.pesoKg).toBe(22);
  });

  it('abre arquivo .json: ida e volta', () => {
    const texto = JSON.stringify(copiarCaso(caso06));
    const { caso, problemas } = lerCasoDeJson(texto, BANCO_MEDICACOES);
    expect(problemas).toEqual([]);
    expect(caso?.titulo).toBe('Crise de asma grave (cópia)');
  });

  it('arquivo de caso do app ganha id de caso do usuário', () => {
    const { caso } = lerCasoDeJson(JSON.stringify(caso06), BANCO_MEDICACOES);
    expect(caso?.id.startsWith('meu-')).toBe(true);
  });

  it('arquivo inválido ou incompleto', () => {
    expect(lerCasoDeJson('{ruim', BANCO_MEDICACOES).problemas[0]).toMatch(/não é um .json/);
    expect(lerCasoDeJson('{"titulo":"x"}', BANCO_MEDICACOES).problemas[0]).toMatch(/inicio, paciente, sinaisIniciais/);
  });

  it('aponta problemas (medicação que não existe)', () => {
    const caso = { ...casoVazio(), respostas: [{ medicacaoId: 'nao-existe', mudancas: [], status: 'A_VALIDAR' as const }] };
    expect(lerCasoDeJson(JSON.stringify(caso), BANCO_MEDICACOES).problemas.join(' ')).toMatch(/nao-existe/);
  });
});
