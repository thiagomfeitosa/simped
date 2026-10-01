import { expect, test } from '@playwright/test';
import { abrir, irPara } from './ajuda';

test('erro numa aba mostra mensagem amigável e o resto continua funcionando', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await abrir(page, 'configuracoes');
  await page.getByRole('button', { name: 'Testar a tela de erro' }).click();
  const alerta = page.getByRole('alert').filter({ hasText: 'Algo deu errado' });
  await expect(alerta).toBeVisible();
  await expect(alerta).toContainText('Configurações');

  await alerta.getByRole('button', { name: /Copiar relato/ }).click();
  await expect(alerta.getByText(/✔ Copiado/)).toBeVisible();
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiado).toContain('Relato de problema do SimPed');
  expect(copiado).toContain('Erro de teste');
  expect(copiado).toContain('Aba: configuracoes');

  // as outras abas continuam funcionando
  await irPara(page, /Calculadoras/);
  await expect(page.getByRole('heading', { name: /Calculadoras/ })).toBeVisible();

  // "Tentar de novo" devolve a tela
  await irPara(page, /Configurações/);
  await alerta.getByRole('button', { name: /Tentar de novo/ }).click();
  await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible();
});

test('Relatar problema copia aba, caso e a descrição', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await abrir(page, 'prescrever');
  await page.getByRole('button', { name: /Relatar problema/ }).click();
  const caixa = page.getByRole('dialog', { name: 'Relatar problema' });
  await caixa.getByRole('textbox').first().fill('A conta da BIC saiu estranha');
  await caixa.getByRole('button', { name: 'Copiar relato' }).click();
  await expect(caixa.getByText(/✔ Copiado/)).toBeVisible();
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiado).toContain('A conta da BIC saiu estranha');
  expect(copiado).toContain('Aba: prescrever');
  expect(copiado).toContain('Caso do Prescrever:');
  await caixa.getByRole('button', { name: 'Fechar' }).click();
  await expect(caixa).toHaveCount(0);
});
