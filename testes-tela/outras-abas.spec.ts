import { expect, test } from '@playwright/test';
import { abaVisivel, abrir } from './ajuda';

test('calculadora de Holliday-Segar responde', async ({ page }) => {
  const erros = await abrir(page, 'calculadoras');
  await expect(page.getByRole('heading', { name: /Calculadoras/ })).toBeVisible();
  await expect(page.locator('.resultado-calc').first()).toBeVisible();
  expect(erros).toEqual([]);
});

test('banco mostra a situação da validação', async ({ page }) => {
  const erros = await abrir(page, 'banco');
  await expect(abaVisivel(page).getByText(/A VALIDAR/).first()).toBeVisible();
  expect(erros).toEqual([]);
});
