/**
 * B18 — Monta o service worker (dist/sw.js) no fim do "vite build" (plugin em vite.config.ts).
 * Sem tela e sem Node: recebe o modelo (src/pwa/sw-modelo.js) e os arquivos gerados, devolve o código.
 * A versão é uma "impressão digital" do conteúdo: qualquer mudança no app muda a versão.
 */

export interface ArquivoGerado {
  /** Caminho dentro da pasta gerada, com "/" (ex.: "assets/index-abc.js"). */
  caminho: string;
  conteudo: Uint8Array;
}

/** Arquivos que não entram na lista do que fica guardado no aparelho. */
export function guardarNoAparelho(caminho: string): boolean {
  return caminho !== 'sw.js' && !caminho.endsWith('.map') && !caminho.startsWith('.');
}

/** Impressão digital (FNV-1a de 32 bits, duas vezes com sementes diferentes): 16 letras/números. */
export function impressaoDigital(arquivos: readonly ArquivoGerado[]): string {
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ 0x5bd1e995;
  const misturar = (byte: number) => {
    a = Math.imul(a ^ byte, 0x01000193) >>> 0;
    b = Math.imul(b ^ byte, 0x5bd1e995) >>> 0;
  };
  for (const arq of [...arquivos].sort((x, y) => x.caminho.localeCompare(y.caminho))) {
    for (const ch of new TextEncoder().encode(arq.caminho)) misturar(ch);
    misturar(0);
    for (const byte of arq.conteudo) misturar(byte);
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

/** Código do service worker com a versão e a lista de arquivos no lugar das marcas do modelo. */
export function montarServiceWorker(modelo: string, arquivos: readonly ArquivoGerado[]): string {
  if (!modelo.includes("'__VERSAO__'") || !modelo.includes('[] /* __ARQUIVOS__ */')) {
    throw new Error('Modelo do service worker sem as marcas __VERSAO__ e __ARQUIVOS__.');
  }
  const guardados = arquivos.filter((a) => guardarNoAparelho(a.caminho));
  const lista = guardados.map((a) => `./${a.caminho}`).sort();
  return modelo.replace("'__VERSAO__'", JSON.stringify(impressaoDigital(guardados))).replace('[] /* __ARQUIVOS__ */', JSON.stringify(lista, null, 2));
}
