/**
 * Atalhos para escrever os arquivos de caso com menos repetição.
 * Tudo que vem dos casos é "A VALIDAR" até o usuário conferir.
 */

import type { CondutaEsperada, MudancaDeEstado, MudancaDeSinal, NomeSinal, PadraoRespiratorio, RespostaAMedicacao, Ritmo } from './tipos';

/** O sinal vai até `alvo`, começando depois de `atrasoMin` e levando `duracaoMin`. */
export function muda(sinal: NomeSinal, alvo: number, atrasoMin: number, duracaoMin: number): MudancaDeSinal {
  return { sinal, alvo, atrasoMin, duracaoMin };
}

export function resposta(
  medicacaoId: string,
  mudancas: MudancaDeSinal[],
  observacao?: string,
  extra: Partial<RespostaAMedicacao> = {},
): RespostaAMedicacao {
  return { medicacaoId, mudancas, status: 'A_VALIDAR', ...(observacao && { observacao }), ...extra };
}

/** Troca de ritmo depois de `atrasoMin` minutos. */
export function ritmo(valor: Ritmo, atrasoMin: number): MudancaDeEstado {
  return { campo: 'ritmo', valor, atrasoMin };
}

/** Troca de padrão respiratório depois de `atrasoMin` minutos. */
export function respiracao(valor: PadraoRespiratorio, atrasoMin: number): MudancaDeEstado {
  return { campo: 'padraoRespiratorio', valor, atrasoMin };
}

export function conduta(
  id: string,
  descricao: string,
  tipo: CondutaEsperada['tipo'],
  alvos: string[],
  extra: Partial<CondutaEsperada> = {},
): CondutaEsperada {
  return { id, descricao, tipo, alvos, status: 'A_VALIDAR', ...extra };
}

/** Início padrão dos casos (o relógio do caso parte daqui). */
export const INICIO_PADRAO = '2026-10-01T08:00';
