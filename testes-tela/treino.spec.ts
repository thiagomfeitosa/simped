import { expect, test } from '@playwright/test';
import { abaVisivel, abrir } from './ajuda';

test('caça-erros: marcar, conferir e ver no caderno de erros', async ({ page }) => {
  const erros = await abrir(page, 'treino');
  const aba = abaVisivel(page);
  await aba.getByRole('button', { name: /Caça-erros/ }).first().click();
  await aba.getByLabel('Folha do caça-erros').selectOption('hipercalemia');
  // marca a primeira linha marcável e escolhe um tipo
  await aba.locator('.botao-marcar').first().click();
  await aba.locator('.tipos-erro input').first().check();
  await aba.getByRole('button', { name: /^Conferir/ }).click();
  const resultado = aba.getByRole('status', { name: 'Resultado do caça-erros' });
  await expect(resultado).toContainText('erros achados');
  // toda folha tem de 3 a 4 erros explicados (achados ou que passaram batido)
  const explicacoes = await aba.locator('.explicacao-caca li').count();
  expect(explicacoes).toBeGreaterThanOrEqual(3);
  expect(explicacoes).toBeLessThanOrEqual(4);

  // o caderno registrou os erros e oferece o treino dirigido
  await aba.getByRole('button', { name: /Caderno de erros/ }).click();
  await expect(aba.getByLabel('Situação por assunto')).toBeVisible();
  await aba.getByRole('button', { name: /Treinar meus pontos fracos/ }).click();
  await expect(aba.locator('.exercicio').getByText('🎯 treino dirigido')).toBeVisible();
  await expect(aba.getByLabel(/Treino dirigido/)).toBeChecked();
  expect(erros).toEqual([]);
});

test('contas: os tipos novos (vazão, unidade, rediluição) aparecem e o acerto vai para o caderno', async ({ page }) => {
  const erros = await abrir(page, 'treino');
  const aba = abaVisivel(page);
  for (const tipo of ['Vazão (volume ÷ tempo)', 'Unidades (g, mg, mcg)', 'Rediluição (volume a aspirar)']) {
    await expect(aba.getByLabel(tipo)).toBeVisible();
  }
  await aba.getByLabel('Sua resposta').fill('1');
  await aba.getByRole('button', { name: 'Conferir' }).click();
  await aba.getByRole('button', { name: /Caderno de erros/ }).click();
  await expect(aba.getByLabel('Situação por assunto')).toBeVisible();
  expect(erros).toEqual([]);
});
