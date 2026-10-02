import { expect, test } from '@playwright/test';
import { abrir, abrirListaDeRoteiros } from './ajuda';

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
    await abrirListaDeRoteiros(page);
    await botoes.nth(i).click();
    await expect(botoes.nth(i)).toHaveAttribute('aria-pressed', 'true');
    // a lista se recolhe e o caso escolhido aparece no resumo
    await expect(page.locator('.escolha-roteiro-caixa')).not.toHaveAttribute('open', '');
    await page.getByRole('button', { name: /Avançar/ }).click();
  }
  expect(erros).toEqual([]);
});

test('percorre todas as etapas de todos os roteiros sem erro', async ({ page }) => {
  test.setTimeout(180_000);
  const erros = await abrir(page, 'passo-a-passo');
  const botoes = page.locator('.roteiro-botao');
  const total = await botoes.count();
  expect(total).toBeGreaterThanOrEqual(11);
  const avancar = page.getByRole('button', { name: /Avançar/ });
  for (let i = 0; i < total; i++) {
    await abrirListaDeRoteiros(page);
    await botoes.nth(i).click();
    for (let k = 0; k < 60 && (await avancar.isEnabled()); k++) await avancar.click();
    await expect(avancar).toBeDisabled();
    await expect(page.getByText('Prescrição com os cálculos').first()).toBeVisible();
  }
  expect(erros).toEqual([]);
});

test('rediluição: a seringa de reserva aparece e a folha mostra as três concentrações', async ({ page }) => {
  const erros = await abrir(page, 'passo-a-passo');
  await page.locator('.roteiro-botao', { hasText: 'Rediluição' }).click();
  await page.locator('.seta-texto', { hasText: /^Aspirar$/ }).click();
  await expect(page.locator('.bancada').getByText('Rediluição', { exact: true })).toBeVisible();
  await expect(page.locator('.folha')).toContainText('rediluir 1 mL + AD 9 mL = 10 mL (50.000 UI/mL)');
  expect(erros).toEqual([]);
});
