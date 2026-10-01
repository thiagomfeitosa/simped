/**
 * Banco de medicações usado pelo app: os exemplos já usados nos testes + as medicações do rascunho
 * + a ampliação A1–A50 (B8, sem doses). Tudo "A VALIDAR" até o usuário conferir (CLAUDE.md, "Segurança clínica").
 *
 * Por cima, entram as conferências já gravadas no projeto (validacoes-conferidas.json),
 * feitas pelo usuário no modo validação da aba Banco (B5).
 */

import { MEDICACOES_AMPLIACAO } from './ampliacao-a-validar';
import { MEDICACOES_EXEMPLO } from './exemplos-a-validar';
import { MEDICACOES_RASCUNHO } from './rascunho-a-validar';
import type { Medicacao } from './tipos';
import { aplicarValidacoes, lerValidacoes } from './validacoes';
import conferidasDoProjeto from './validacoes-conferidas.json';

/** Banco sem nenhuma conferência (como saiu do rascunho). */
export const BANCO_RASCUNHO: readonly Medicacao[] = [...MEDICACOES_EXEMPLO, ...MEDICACOES_RASCUNHO, ...MEDICACOES_AMPLIACAO];

/** Conferências gravadas no projeto (valem para todos os computadores). */
export const VALIDACOES_DO_PROJETO = lerValidacoes(conferidasDoProjeto);

export const BANCO_MEDICACOES: readonly Medicacao[] = aplicarValidacoes(BANCO_RASCUNHO, VALIDACOES_DO_PROJETO);
