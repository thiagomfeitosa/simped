import { expect, test } from '@playwright/test';
import { abrir, irPara } from './ajuda';

const ABAS: { rotulo: RegExp; titulo: RegExp }[] = [
  { rotulo: /Passo a passo/, titulo: /Passo a passo/i },
  { rotulo: /Prescrever/, titulo: /^Prescrever$/ },
  { rotulo: /Parada/, titulo: /Código de parada/ },
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

test('B20: cada aba só é montada quando aberta e depois continua aberta', async ({ page }) => {
  const erros = await abrir(page, 'passo-a-passo');
  // a aba Treino ainda não foi aberta: o conteúdo dela não existe na página
  await expect(page.locator('#raiz > div.modo-prescrever h1', { hasText: /Treino/i })).toHaveCount(0);
  await irPara(page, /Treino/);
  await expect(page.locator('#raiz > div:not([hidden]) h1', { hasText: /Treino/i })).toBeVisible();
  // volta ao passo a passo: a aba Treino continua montada (escondida), nada se perde
  await irPara(page, /Passo a passo/);
  await expect(page.locator('#raiz > div[hidden] h1', { hasText: /Treino/i })).toHaveCount(1);
  expect(erros).toEqual([]);
});

test('B20: abrir direto numa aba de prática (sem passar pelo passo a passo)', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  await expect(page.locator('#raiz > div:not([hidden]) h1', { hasText: /^Prescrever$/ })).toBeVisible();
  expect(erros).toEqual([]);
});
