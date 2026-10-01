import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { abaVisivel } from './ajuda';

/**
 * B18 — App instalável (PWA). Roda na versão de SITE (build de verdade servido em :5180, ver playwright.config.ts),
 * porque o service worker não liga no "npm run dev".
 */

const SITE = 'http://localhost:5180/';
const SW = join(import.meta.dirname, '..', 'dist-site-teste', 'sw.js');

test.describe.configure({ mode: 'serial' });
test.use({ baseURL: SITE });

test('manifesto e ícones do app', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifesto = (await (await request.get(new URL(href!, page.url()).href)).json()) as {
    short_name: string;
    display: string;
    start_url: string;
    icons: { src: string; sizes: string; purpose: string }[];
  };
  expect(manifesto.short_name).toBe('SimPed');
  expect(manifesto.display).toBe('standalone');
  expect(manifesto.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(manifesto.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  for (const icone of [...manifesto.icons.map((i) => i.src), 'icones/apple-touch-icon.png']) {
    const resposta = await request.get(new URL(icone, SITE).href);
    expect(resposta.ok(), icone).toBe(true);
    expect(resposta.headers()['content-type'], icone).toMatch(/^image\//);
  }
});

test('guarda o app no aparelho e abre sem internet', async ({ page, context }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./#configuracoes');
  await expect(abaVisivel(page).getByRole('region', { name: 'Instalar como app' })).toContainText('Guardado neste aparelho');
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Modo do SimPed' })).toBeVisible();
    await page.goto('./#prescrever');
    await expect(abaVisivel(page).getByRole('heading', { name: 'Prescrever' })).toBeVisible();
    // a janela do professor (outro endereço) também abre sem internet
    await page.goto('./?papel=professor#professor');
    await expect(page.getByText('Janela do professor')).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
  expect(erros).toEqual([]);
});

test('versão nova do site: avisa e troca só quando o usuário clica', async ({ page }) => {
  await page.goto('./#passo-a-passo');
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await expect(page.getByRole('status', { name: 'Nova versão do SimPed' })).toHaveCount(0);

  const original = readFileSync(SW, 'utf8');
  try {
    // "publica" uma versão nova: muda a versão dentro do sw.js
    writeFileSync(SW, original.replace(/const VERSAO = "[0-9a-f]+";/, 'const VERSAO = "versao-nova-de-teste";'));
    await page.evaluate(async () => {
      const registro = await navigator.serviceWorker.getRegistration();
      await registro?.update();
    });
    const aviso = page.getByRole('status', { name: 'Nova versão do SimPed' });
    await expect(aviso).toBeVisible();
    await Promise.all([page.waitForEvent('load'), aviso.getByRole('button', { name: 'Atualizar agora' }).click()]);
    await expect(page.getByRole('navigation', { name: 'Modo do SimPed' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => caches.keys())).toEqual(['simped-versao-nova-de-teste']);
    await expect(page.getByRole('status', { name: 'Nova versão do SimPed' })).toHaveCount(0);
  } finally {
    writeFileSync(SW, original);
  }
});
