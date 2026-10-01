import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// base relativa: o app abre direto do arquivo, sem servidor (offline e, depois, Electron)
export default defineConfig({
  base: './',
  plugins: [react()],
  // planilhas .xlsx podem ser importadas como arquivo (usado nos testes do importador)
  assetsInclude: ['**/*.xlsx'],
});
