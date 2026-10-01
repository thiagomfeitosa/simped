/**
 * Banco de medicações usado pelo app: os exemplos já usados nos testes + as medicações do rascunho.
 * Tudo "A VALIDAR" até o usuário conferir (CLAUDE.md, "Segurança clínica").
 */

import { MEDICACOES_EXEMPLO } from './exemplos-a-validar';
import { MEDICACOES_RASCUNHO } from './rascunho-a-validar';
import type { Medicacao } from './tipos';

export const BANCO_MEDICACOES: readonly Medicacao[] = [...MEDICACOES_EXEMPLO, ...MEDICACOES_RASCUNHO];
