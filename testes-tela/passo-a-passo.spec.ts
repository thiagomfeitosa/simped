import { expect, test } from '@playwright/test';
import { abrir } from './ajuda';

test('percorre um roteiro inteiro até a prescrição com os cálculos', async ({ page }) => {
  const erros = await abrir(page, 'passo-a-passo');
  const avancar = page.getByRole('button', { name: /Avançar/ });
  // avança até o botão ficar desabilitado (última etapa)
  for (let i = 0; i < 60 && (await avancar.isEnabled()); i++) await avancar.click();
  await expect(avancar).toBeDisabled();
  await expect(page.getByText('Prescrição com os cálculos').first()).toBeVisible();
  expect(erros).toEqual([]);
});

test('todos os roteiros abrem', async ({ page }) => {
  const erros = await abrir(page, 'passo-a-passo');
  const botoes = page.locator('.roteiro-botao');
  const total = await botoes.count();
  expect(total).toBeGreaterThanOrEqual(6);
  for (let i = 0; i < total; i++) {
    await botoes.nth(i).click();
    await expect(botoes.nth(i)).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /Avançar/ }).click();
  }
  expect(erros).toEqual([]);
});
