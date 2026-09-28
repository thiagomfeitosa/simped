import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Caminhos relativos: permite abrir o app empacotado (Electron/Capacitor) sem servidor.
  base: './',
  plugins: [react()],
});
