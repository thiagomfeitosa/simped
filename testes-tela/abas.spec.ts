import { expect, test } from '@playwright/test';
import { abrir, irPara } from './ajuda';

const ABAS: { rotulo: RegExp; titulo: RegExp }[] = [
  { rotulo: /Passo a passo/, titulo: /Passo a passo/i },
  { rotulo: /Prescrever/, titulo: /^Prescrever$/ },
  { rotulo: /Treino/, titulo: /Treino/i },
  { rotulo: /Calculadoras/, titulo: /Calculadoras/i },
  { rotulo: /Casos/, titulo: /casos/i },
  { rotulo: /Banco/, titulo: /Banco/i },
  { rotulo: /Configurações/, titulo: /Configurações/i },
];

test('abre todas as abas sem erro', async ({ page }) => {
  const erros = await abrir(page);
  for (const aba of ABAS) {
    await irPara(page, aba.rotulo);
    await expect(page.locator('div:not([hidden]) > * h1, div:not([hidden]) h1').filter({ hasText: aba.titulo }).first()).toBeVisible();
    await expect(page.getByText(/Algo deu errado/)).toHaveCount(0);
  }
  expect(erros).toEqual([]);
});

test('a aba fica no endereço (recarregar mantém a aba)', async ({ page }) => {
  await abrir(page, 'banco');
  await expect(page.getByRole('link', { name: /Banco/ })).toHaveAttribute('aria-current', 'page');
  await page.reload();
  await expect(page.getByRole('link', { name: /Banco/ })).toHaveAttribute('aria-current', 'page');
});
