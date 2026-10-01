import { expect, test } from '@playwright/test';
import { abaVisivel, abrir, irPara } from './ajuda';

test('conferir uma dose no Banco faz o Prescrever corrigir com ela', async ({ page }) => {
  const erros = await abrir(page, 'banco');
  const banco = abaVisivel(page);
  await expect(banco.getByText('regras de dose conferidas')).toBeVisible();
  await expect(banco.locator('.relatorio-numeros strong').nth(2)).toHaveText(/^0\//);

  await banco.getByLabel('Buscar medicação').fill('dipirona');
  await banco.locator('.med-banco summary', { hasText: 'Dipirona' }).click();
  const regra = banco.locator('.med-banco li', { hasText: 'Febre/dor (crianca)' });
  await expect(regra).toContainText('documento provável: Tratado de Pediatria');
  await regra.getByRole('button', { name: 'Conferir' }).click();

  const form = banco.getByRole('group', { name: 'Conferir item' });
  // sem página não deixa marcar CONFERIDO
  await form.getByRole('button', { name: /marcar CONFERIDO/ }).click();
  await expect(form.getByText('informe a página')).toBeVisible();
  await form.getByPlaceholder('Ex.: 345 ou tabela 2').fill('999 (teste)');
  await form.getByLabel('Quem conferiu').fill('Teste automático');
  await form.getByRole('button', { name: /marcar CONFERIDO/ }).click();
  await expect(form).toHaveCount(0);
  await expect(regra).toContainText('✔ CONFERIDO');
  await expect(regra).toContainText('SBP — Tratado de Pediatria');
  await expect(banco.locator('.relatorio-numeros strong').nth(2)).toHaveText(/^1\//);

  // no Prescrever, a dose agora é conferida de verdade
  await irPara(page, /Prescrever/);
  const aba = abaVisivel(page);
  await aba.locator('.secao').filter({ hasText: '6. Demais medicações' }).getByRole('button', { name: '+ medicação' }).click();
  await aba.getByLabel('Item 1 — medicação').selectOption({ label: 'Dipirona' });
  await aba.getByLabel('Item 1 — apresentação').selectOption({ index: 1 });
  await aba.getByLabel('Item 1 — indicação').selectOption('Febre/dor');
  await aba.getByLabel('Item 1 — dose', { exact: true }).fill('400');
  await aba.getByLabel('Item 1 — unidade da dose').selectOption('mg');
  await aba.getByLabel('Item 1 — via').selectOption('EV');
  await aba.locator('.item-med').getByRole('button', { name: 'Conferir' }).click();
  const conferencia = aba.getByLabel('Conferência do item 1');
  await expect(conferencia).toContainText('De onde vem a dose de referência: SBP — Tratado de Pediatria');
  await expect(conferencia.locator('.sit-certo').first()).toBeVisible();

  // a conferência continua depois de recarregar (fica guardada no computador)
  await page.reload();
  await irPara(page, /Banco/);
  await expect(abaVisivel(page).locator('.relatorio-numeros strong').nth(2)).toHaveText(/^1\//);
  expect(erros).toEqual([]);
});

test('catálogo de fontes: cadastrar um documento novo', async ({ page }) => {
  const erros = await abrir(page, 'banco');
  const catalogo = abaVisivel(page).getByRole('region', { name: 'Catálogo de fontes' });
  await expect(catalogo).toContainText('Tratado de Pediatria');
  await catalogo.getByRole('button', { name: '+ Novo documento' }).click();
  const form = catalogo.getByRole('group', { name: 'Editar documento' });
  await form.getByPlaceholder('EX.: SBP-NEO-2024').fill('sbp neo teste');
  await form.getByLabel('Título').fill('Documento de teste da neonatologia');
  await form.getByRole('button', { name: 'Salvar documento' }).click();
  await expect(catalogo).toContainText('SBP-NEO-TESTE');
  await expect(catalogo).toContainText('cadastrado no app');
  expect(erros).toEqual([]);
});
