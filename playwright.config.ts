import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * Testes de tela (B1): abrem o SimPed num navegador automático e clicam como o aluno.
 * Rodar com "npm run teste-tela". Os testes ficam em testes-tela/.
 *
 * Navegador: usa o Chromium do Playwright ("npx playwright install chromium", uma vez só).
 * Se houver um Chromium já instalado no computador/servidor, dá para apontar com SIMPED_CHROMIUM.
 */
const chromiumLocal = process.env.SIMPED_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

export default defineConfig({
  testDir: 'testes-tela',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'relatorio-teste-tela' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5179/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...(chromiumLocal && { launchOptions: { executablePath: chromiumLocal } }) },
    },
  ],
  webServer: [
    {
      command: 'npx vite --port 5179 --strictPort',
      url: 'http://localhost:5179/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    // B18: versão de site (build de verdade, com service worker), para os testes do app instalável (pwa.spec.ts)
    {
      command: 'npx vite build --outDir dist-site-teste --emptyOutDir --logLevel warn && npx vite preview --outDir dist-site-teste --port 5180 --strictPort',
      url: 'http://localhost:5180/',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
