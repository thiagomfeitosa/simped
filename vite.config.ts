import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const pacote = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// base relativa: o app abre direto do arquivo, sem servidor (offline e, depois, Electron)
export default defineConfig({
  base: './',
  plugins: [react()],
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
