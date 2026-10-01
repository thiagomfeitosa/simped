/**
 * Papel desta janela (B15): aluno (padrão) ou professor (aberta com ?papel=professor).
 * Arquivo leve, separado do ContextoSessao, para a barra do topo não precisar baixar a sessão inteira (B20).
 */

/** B15: esta janela é a do aluno (dona da sessão) ou a do professor (espelho que manda ações)? */
export type Papel = 'aluno' | 'professor';

export function papelDaJanela(): Papel {
  try {
    return new URLSearchParams(window.location.search).get('papel') === 'professor' ? 'professor' : 'aluno';
  } catch {
    return 'aluno';
  }
}
