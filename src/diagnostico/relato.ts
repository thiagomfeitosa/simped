/**
 * "Relatar problema" (B3): junta o que aconteceu (aba, caso, erro, navegador) num texto
 * para o usuário colar na conversa com o assistente. Sem tela: dá para testar sozinho.
 *
 * Não entra nada do conteúdo guardado pelo aluno (folha, rascunho): só nomes e tamanhos.
 */

export interface ErroGuardado {
  /** Data e hora (ISO) em que o erro aconteceu. */
  quando: string;
  mensagem: string;
  /** Onde no código (pilha), resumida. */
  pilha?: string;
  /** Em qual parte da tela (componente) o erro aconteceu. */
  componente?: string;
  origem: 'tela' | 'janela' | 'promessa';
}

const MAXIMO_ERROS = 5;
const erros: ErroGuardado[] = [];
const contexto = new Map<string, string>();

/** Guarda um erro (só os últimos 5) para entrar no relato. */
export function guardarErro(erro: unknown, origem: ErroGuardado['origem'], componente?: string): ErroGuardado {
  const e = erro instanceof Error ? erro : new Error(String(erro));
  const guardado: ErroGuardado = {
    quando: new Date().toISOString(),
    mensagem: e.message || e.name,
    origem,
    ...(e.stack && { pilha: resumirPilha(e.stack) }),
    ...(componente && { componente: resumirPilha(componente, 6) }),
  };
  erros.push(guardado);
  if (erros.length > MAXIMO_ERROS) erros.shift();
  return guardado;
}

export function errosGuardados(): readonly ErroGuardado[] {
  return [...erros];
}

/** As telas avisam o que está aberto (ex.: definirContexto('Caso', 'Sepse neonatal')). Vazio apaga. */
export function definirContexto(nome: string, valor: string): void {
  if (valor) contexto.set(nome, valor);
  else contexto.delete(nome);
}

export function contextoAtual(): Record<string, string> {
  return Object.fromEntries(contexto);
}

/** Primeiras linhas de uma pilha de erro (o resto raramente ajuda e polui o relato). */
export function resumirPilha(pilha: string, linhas = 8): string {
  return pilha
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, linhas)
    .join('\n');
}

export interface DadosRelato {
  quando: Date;
  versao: string;
  aba: string;
  navegador: string;
  tela?: string;
  /** O que está aberto (caso, roteiro...), vindo de definirContexto. */
  contexto?: Record<string, string>;
  erros: readonly ErroGuardado[];
  /** Nome e tamanho de cada dado guardado no computador (sem o conteúdo). */
  armazenamento?: Record<string, number>;
  /** O que o usuário escreveu ("estava fazendo..."). */
  descricao?: string;
}

/** Texto do relato, pronto para colar na conversa. */
export function montarRelato(d: DadosRelato): string {
  const linhas = [
    '=== Relato de problema do SimPed ===',
    `Quando: ${d.quando.toLocaleString('pt-BR')}`,
    `Versão: ${d.versao}`,
    `Aba: ${d.aba || '(início)'}`,
  ];
  for (const [nome, valor] of Object.entries(d.contexto ?? {})) linhas.push(`${nome}: ${valor}`);
  if (d.tela) linhas.push(`Tela: ${d.tela}`);
  linhas.push(`Navegador: ${d.navegador}`);
  if (d.descricao?.trim()) linhas.push('', 'O que eu estava fazendo:', d.descricao.trim());
  linhas.push('');
  if (d.erros.length === 0) {
    linhas.push('Erros: nenhum erro registrado nesta sessão.');
  } else {
    linhas.push(`Erros (${d.erros.length}, do mais antigo ao mais recente):`);
    d.erros.forEach((e, i) => {
      linhas.push(`${i + 1}. [${e.origem}] ${e.mensagem} (${new Date(e.quando).toLocaleTimeString('pt-BR')})`);
      if (e.pilha) linhas.push(indentar(e.pilha));
      if (e.componente) linhas.push('   Componente:', indentar(e.componente));
    });
  }
  const guardados = Object.entries(d.armazenamento ?? {});
  if (guardados.length > 0) {
    linhas.push('', 'Dados guardados no computador (tamanho):');
    for (const [chave, tamanho] of guardados) linhas.push(`- ${chave}: ${tamanho} caracteres`);
  }
  linhas.push('=== fim do relato ===');
  return linhas.join('\n');
}

function indentar(texto: string): string {
  return texto
    .split('\n')
    .map((l) => `   ${l}`)
    .join('\n');
}
