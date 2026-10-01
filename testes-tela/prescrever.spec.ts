import { expect, type Page, test } from '@playwright/test';
import { abrir } from './ajuda';

/** Escreve a dipirona do caso de demonstração na seção 6 (os números não precisam estar certos). */
async function prescreverDipirona(page: Page) {
  const secao6 = page.locator('.secao').filter({ hasText: '6. Demais medicações' });
  await secao6.getByRole('button', { name: '+ medicação' }).click();
  await page.getByLabel('Item 1 — medicação').selectOption({ label: 'Dipirona' });
  await page.getByLabel('Item 1 — apresentação').selectOption({ index: 1 });
  await page.getByLabel('Item 1 — dose', { exact: true }).fill('400');
  await page.getByLabel('Item 1 — unidade da dose').selectOption('mg');
  await page.getByLabel('Item 1 — volume (mL)').fill('0,8');
  await page.getByLabel('Item 1 — via').selectOption('EV');
  await page.getByLabel('Item 1 — intervalo').selectOption('dose-unica');
}

test('prescreve, administra e o paciente reage; relatório abre', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  await expect(page.getByLabel('Caso clínico')).toHaveValue('demonstracao');
  await prescreverDipirona(page);
  await expect(page.locator('.item-med-texto')).toContainText('Dipirona');

  await page.locator('.item-med').getByRole('button', { name: 'Conferir' }).click();
  await expect(page.getByLabel('Conferência do item 1')).toBeVisible();

  await page.getByRole('button', { name: 'Administrar' }).click();
  await expect(page.locator('.linha-do-tempo')).toContainText('Administrado: Dipirona');

  // o tempo passa e a temperatura cai (efeito fictício do caso de demonstração)
  await page.getByRole('button', { name: '+60 min' }).click();
  await page.getByRole('button', { name: '+60 min' }).click();
  await expect(page.locator('.relogio')).toContainText('02:00');

  await page.getByRole('button', { name: /Relatório/ }).click();
  const relatorio = page.getByRole('dialog', { name: 'Relatório do caso' });
  await expect(relatorio).toBeVisible();
  await relatorio.getByRole('button', { name: 'Fechar' }).click();
  expect(erros).toEqual([]);
});

test('pede exame e o resultado chega com o relógio', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  await page.getByLabel('Exame a pedir').selectOption({ label: 'Hemograma' });
  await page.getByRole('button', { name: 'Pedir' }).click();
  await expect(page.locator('.lista-exames')).toContainText('Aguardando');
  await page.getByRole('button', { name: '+1 dia' }).click();
  await expect(page.locator('.lista-exames')).not.toContainText('Aguardando');
  expect(erros).toEqual([]);
});

test('todos os casos abrem', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  const opcoes = await page.getByLabel('Caso clínico').locator('option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  expect(opcoes.length).toBeGreaterThanOrEqual(17);
  for (const id of opcoes) {
    await page.getByLabel('Caso clínico').selectOption(id);
    await expect(page.getByLabel('Caso clínico')).toHaveValue(id);
    await expect(page.getByText(/Algo deu errado/)).toHaveCount(0);
  }
  expect(erros).toEqual([]);
});
