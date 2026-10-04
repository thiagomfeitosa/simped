/**
 * Papel desta janela (B15): aluno (padrão), professor (aberta com ?papel=professor) ou
 * janela extra da Parada (?janela=parada: o telão que a aba Professor abre ou a tela de um colega).
 * O papel vem só de marcas que o app põe ao ABRIR a janela e nunca troca durante o uso: o "só assistir"
 * (?assistir=parada) liga e desliga na própria tela e não muda de quem é a sessão.
 * Arquivo leve, separado do ContextoSessao, para a barra do topo não precisar baixar a sessão inteira (B20).
 */

/**
 * B15: esta janela é a do aluno (dona da sessão do Prescrever), a do professor (espelho que manda ações)
 * ou uma janela extra da Parada (espelho só de leitura: não grava, não manda ações nem troca o caso do aluno).
 */
export type Papel = 'aluno' | 'professor' | 'parada';

export function papelDaJanela(): Papel {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get('papel') === 'professor') return 'professor';
    // ?assistir=parada sozinho não conta: a janela do aluno também pode só assistir (e recarregar)
    if (p.get('janela') === 'parada') return 'parada';
    return 'aluno';
  } catch {
    return 'aluno';
  }
}
