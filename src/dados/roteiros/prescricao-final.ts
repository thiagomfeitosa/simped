/**
 * Etapa final, igual em todos os roteiros: a folha completa com os cálculos
 * de cada item escritos logo abaixo dele. É acrescentada automaticamente
 * (ver index.ts) — os roteiros não precisam escrevê-la.
 */
import type { Etapa, Roteiro } from './tipos';

export const ID_ETAPA_FINAL = 'prescricao-com-calculos';

export const ETAPA_PRESCRICAO_FINAL: Etapa = {
  id: ID_ETAPA_FINAL,
  secao: 'final',
  curto: 'Folha + contas',
  titulo: 'A prescrição completa, com os cálculos',
  explicacao: [
    'Esta é a folha pronta, do jeito que vai para o prontuário — mas com as contas de cada item escritas logo abaixo dele, como no rascunho.',
    'Use para revisar: cada número da prescrição tem de "sair" de uma conta. Clique em "ver etapa" para voltar à explicação de qualquer conta.',
  ],
  cena: { tipo: 'prescricao-final' },
};

export function comPrescricaoFinal(roteiro: Roteiro): Roteiro {
  if (roteiro.etapas.some((e) => e.id === ID_ETAPA_FINAL)) return roteiro;
  return { ...roteiro, etapas: [...roteiro.etapas, ETAPA_PRESCRICAO_FINAL] };
}
