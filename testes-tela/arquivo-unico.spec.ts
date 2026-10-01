import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';

/** O SimPed.html de "dois cliques" (npm run arquivo-unico) abre sem servidor e sem internet. */
const arquivo = join(import.meta.dirname, '..', 'dist-arquivo', 'SimPed.html');

test('o arquivo único abre com dois cliques (sem servidor)', async ({ page }) => {
  test.skip(!existsSync(arquivo), 'Gere antes com "npm run arquivo-unico".');
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto(`${pathToFileURL(arquivo).href}#prescrever`);
  await expect(page.getByRole('heading', { name: 'Prescrever' })).toBeVisible();
  await page.getByRole('link', { name: /Passo a passo/ }).click();
  await expect(page.getByRole('button', { name: /Avançar/ })).toBeVisible();
  expect(erros).toEqual([]);
});
