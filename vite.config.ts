import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { montarServiceWorker } from './src/pwa/montarServiceWorker';

const pacote = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/** Todos os arquivos de uma pasta (com subpastas), com caminho relativo usando "/". */
function listarArquivos(pasta: string, raiz = pasta): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? listarArquivos(caminho, raiz) : [relative(raiz, caminho).split(sep).join('/')];
  });
}

/**
 * B18 — no fim do "vite build", escreve dist/sw.js (service worker) com a lista de TODOS os arquivos gerados,
 * para o app instalado abrir sem internet. Modelo em src/pwa/sw-modelo.js.
 */
function serviceWorker(): Plugin {
  let pasta = 'dist';
  return {
    name: 'simped-service-worker',
    apply: 'build',
    configResolved(config) {
      pasta = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const modelo = readFileSync(new URL('./src/pwa/sw-modelo.js', import.meta.url), 'utf8');
      const arquivos = listarArquivos(pasta).map((caminho) => ({ caminho, conteudo: readFileSync(join(pasta, caminho)) }));
      writeFileSync(join(pasta, 'sw.js'), montarServiceWorker(modelo, arquivos));
    },
  };
}

// base relativa: o app abre direto do arquivo, sem servidor (offline e, depois, Electron),
// e também numa subpasta de um site (ex.: GitHub Pages, B18)
export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
  // planilhas .xlsx podem ser importadas como arquivo (usado nos testes do importador)
  assetsInclude: ['**/*.xlsx'],
  // versão do app e dia em que foi gerado (aparecem no "Relatar problema")
  define: {
    __VERSAO__: JSON.stringify(`${pacote.version} (gerado em ${new Date().toISOString().slice(0, 10)})`),
  },
  test: {
    // os testes de tela (Playwright) ficam em testes-tela/ e rodam com "npm run teste-tela"
    exclude: ['**/node_modules/**', 'testes-tela/**'],
  },
});
