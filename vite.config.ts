import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Caminhos relativos: permite abrir o app depois empacotado no Electron/Capacitor (offline).
  base: './',
});
