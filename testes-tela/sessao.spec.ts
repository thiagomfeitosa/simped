import { expect, type Page, test } from '@playwright/test';
import { abaVisivel, abrir, irPara } from './ajuda';

async function trabalharNoCaso(page: Page) {
  const aba = abaVisivel(page);
  await aba.locator('.secao').filter({ hasText: '3. Dieta' }).getByRole('button', { name: '+ item em texto' }).click();
  await aba.getByLabel('Item 1 — Dieta').fill('Dieta geral para a idade');
  await aba.getByLabel('Exame a pedir').selectOption({ label: 'Hemograma' });
  await aba.getByRole('button', { name: 'Pedir' }).click();
  await aba.getByRole('button', { name: '+15 min' }).click();
  await aba.getByRole('region', { name: 'Rascunho de cálculos' }).getByRole('textbox').fill('16 kg x 25 = 400 mg');
}

test('rever o caso: lista tudo e mostra a folha de cada momento', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  await trabalharNoCaso(page);
  await abaVisivel(page).getByRole('button', { name: /Rever o caso/ }).click();
  const revisao = page.getByRole('dialog', { name: 'Rever o caso' });
  const lista = revisao.getByLabel('Tudo o que aconteceu');
  await expect(lista).toContainText('Escreveu em dieta: Dieta geral para a idade');
  await expect(lista).toContainText('Pediu exame: Hemograma');
  await expect(lista).toContainText('Relógio do caso: +15 min');
  await expect(lista).toContainText('Escreveu no rascunho');
  // volta ao começo: a folha ainda estava em branco
  await revisao.getByRole('button', { name: 'Voltar ao início' }).click();
  await expect(revisao.getByLabel('Folha do aluno')).toContainText('Folha ainda em branco');
  // passo 2: a dieta já escrita
  await revisao.getByRole('button', { name: 'Próximo passo' }).click();
  await revisao.getByRole('button', { name: 'Próximo passo' }).click();
  await expect(revisao.getByLabel('Folha do aluno')).toContainText('Dieta geral para a idade');
  await revisao.getByRole('button', { name: 'Fechar' }).click();
  expect(erros).toEqual([]);
});

test('salvar e continuar: fechar o app no meio e voltar de onde parou', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  await trabalharNoCaso(page);
  await expect(abaVisivel(page).locator('.relogio')).toContainText('00:15');

  // "fecha" e abre de novo, em outra aba do app
  await page.goto('./#calculadoras');
  await page.reload();
  const pergunta = page.getByRole('dialog', { name: 'Continuar o caso' });
  await expect(pergunta).toContainText('Caso de demonstração');
  await expect(pergunta).toContainText('00:15');
  await pergunta.getByRole('button', { name: /Continuar o caso/ }).click();

  const aba = abaVisivel(page);
  await expect(page.getByRole('link', { name: /Prescrever/ })).toHaveAttribute('aria-current', 'page');
  await expect(aba.locator('.relogio')).toContainText('00:15');
  await expect(aba.getByLabel('Item 1 — Dieta')).toHaveValue('Dieta geral para a idade');
  await expect(aba.getByRole('region', { name: 'Rascunho de cálculos' }).getByRole('textbox')).toHaveValue('16 kg x 25 = 400 mg');
  await expect(aba.locator('.lista-exames')).toContainText('Hemograma');

  // começar do zero apaga
  await page.reload();
  await page.getByRole('dialog', { name: 'Continuar o caso' }).getByRole('button', { name: 'Começar do zero' }).click();
  await irPara(page, /Prescrever/);
  await expect(abaVisivel(page).locator('.relogio')).toContainText('00:00');
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Continuar o caso' })).toHaveCount(0);
  expect(erros).toEqual([]);
});

test('recomeçar o caso volta tudo ao início', async ({ page }) => {
  await abrir(page, 'prescrever');
  await trabalharNoCaso(page);
  page.once('dialog', (d) => void d.accept());
  await abaVisivel(page).getByRole('button', { name: /Recomeçar/ }).click();
  await expect(abaVisivel(page).locator('.relogio')).toContainText('00:00');
  await expect(abaVisivel(page).getByLabel('Item 1 — Dieta')).toHaveCount(0);
});
