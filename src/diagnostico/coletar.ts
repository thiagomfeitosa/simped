/**
 * Lado do navegador do "Relatar problema": junta aba, navegador e dados guardados,
 * captura erros fora das telas e copia o texto.
 */

import { contextoAtual, type DadosRelato, errosGuardados, guardarErro, montarRelato } from './relato';

/** Tamanho de cada dado do SimPed guardado no navegador (sem o conteúdo). */
function tamanhosGuardados(): Record<string, number> {
  const tamanhos: Record<string, number> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const chave = window.localStorage.key(i);
      if (chave?.startsWith('simped')) tamanhos[chave] = window.localStorage.getItem(chave)?.length ?? 0;
    }
  } catch {
    // sem acesso ao armazenamento: o relato sai sem essa parte
  }
  return tamanhos;
}

export function relatoAtual(extra: Partial<DadosRelato> = {}): string {
  return montarRelato({
    quando: new Date(),
    versao: typeof __VERSAO__ === 'string' ? __VERSAO__ : 'desconhecida',
    aba: window.location.hash.slice(1),
    navegador: window.navigator.userAgent,
    tela: `${window.innerWidth}×${window.innerHeight}`,
    contexto: contextoAtual(),
    erros: errosGuardados(),
    armazenamento: tamanhosGuardados(),
    ...extra,
  });
}

/** Erros fora do React (ex.: dentro de um setTimeout) também entram no relato. */
export function instalarCapturaDeErros(): void {
  window.addEventListener('error', (e) => guardarErro(e.error ?? e.message, 'janela'));
  window.addEventListener('unhandledrejection', (e) => guardarErro(e.reason, 'promessa'));
}

/** Copia para a área de transferência; se o navegador não deixar, usa o jeito antigo. Devolve se deu certo. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await window.navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = texto;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}
