/**
 * Papel desta janela (B15): aluno (padrão), professor (aberta com ?papel=professor) ou
 * janela extra da Parada (telão que só assiste, ?assistir=parada, ou tela de um colega, ?janela=parada).
 * Arquivo leve, separado do ContextoSessao, para a barra do topo não precisar baixar a sessão inteira (B20).
 */

/**
 * B15: esta janela é a do aluno (dona da sessão do Prescrever), a do professor (espelho que manda ações)
 * ou uma janela extra da Parada (espelho também: não grava nem substitui a sessão do aluno).
 */
export type Papel = 'aluno' | 'professor' | 'parada';

export function papelDaJanela(): Papel {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get('papel') === 'professor') return 'professor';
    if (p.get('assistir') === 'parada' || p.get('janela') === 'parada') return 'parada';
    return 'aluno';
  } catch {
    return 'aluno';
  }
}
