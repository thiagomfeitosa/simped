import { expect, test } from '@playwright/test';
import { abaVisivel, abrir, irPara } from './ajuda';

/** B16 — variações automáticas dos casos (peso, idade e apresentação sorteados). */

test('variar o caso muda o peso e deixa uma ampola de gentamicina; volta ao original', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  const tela = abaVisivel(page);
  await page.getByLabel('Caso clínico').selectOption('caso02-sepse-neonatal');
  await expect(tela.locator('.ficha').first()).toContainText('3,000 kg');
  await expect(tela.getByRole('note', { name: 'Variação do caso' })).toHaveCount(0);

  await tela.getByRole('button', { name: '🎲 Variar o caso' }).click();
  const faixa = tela.getByRole('note', { name: 'Variação do caso' });
  await expect(faixa).toContainText('no caso original: 3 kg');
  await expect(faixa).toContainText('Farmácia hoje — Gentamicina');
  await expect(tela.locator('.ficha').first()).not.toContainText('3,000 kg');

  // a farmácia de hoje tem uma ampola só de gentamicina
  const secao5 = tela.locator('.secao').filter({ hasText: '5. Antibióticos' });
  await secao5.getByRole('button', { name: '+ medicação' }).click();
  await tela.getByLabel('Item 1 — medicação').selectOption({ label: 'Gentamicina' });
  const opcoes = await tela.getByLabel('Item 1 — apresentação').locator('option').allTextContents();
  expect(opcoes.filter((o) => /Ampola/.test(o))).toHaveLength(1);

  page.once('dialog', (d) => d.accept());
  await faixa.getByRole('button', { name: 'Voltar ao caso original' }).click();
  await expect(tela.getByRole('note', { name: 'Variação do caso' })).toHaveCount(0);
  await expect(tela.locator('.ficha').first()).toContainText('3,000 kg');
  expect(erros).toEqual([]);
});

test('o caso variado continua igual depois de fechar o app (B13)', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  const tela = abaVisivel(page);
  await page.getByLabel('Caso clínico').selectOption('caso06-asma-grave');
  await tela.getByRole('button', { name: '🎲 Variar o caso' }).click();
  const texto = await tela.getByRole('note', { name: 'Variação do caso' }).locator('p').innerText();
  await tela.getByRole('region', { name: 'Rascunho de cálculos' }).locator('textarea').fill('peso x 2');

  await page.reload();
  const pergunta = page.getByRole('dialog', { name: 'Continuar o caso' });
  await expect(pergunta).toContainText('variado');
  await pergunta.getByRole('button', { name: /Continuar o caso/ }).click();
  await expect(abaVisivel(page).getByRole('note', { name: 'Variação do caso' }).locator('p')).toHaveText(texto);
  expect(erros).toEqual([]);
});

test('Configurações: "variar os casos sempre" sorteia ao abrir um caso', async ({ page }) => {
  const erros = await abrir(page, 'configuracoes');
  await abaVisivel(page).getByLabel(/Variar os casos sempre/).check();
  await irPara(page, /Prescrever/);
  await page.getByLabel('Caso clínico').selectOption('caso08-meningite-choque');
  await expect(abaVisivel(page).getByRole('note', { name: 'Variação do caso' })).toContainText('no caso original: 16 kg');
  expect(erros).toEqual([]);
});

test('professor (outra janela) sorteia uma variação para o aluno', async ({ page, context }) => {
  const erros = await abrir(page, 'prescrever');
  await abaVisivel(page).getByLabel('Caso clínico').selectOption('caso12-pcr-fv');
  const janelaProf = await context.newPage();
  await janelaProf.goto('./?papel=professor#professor');
  const prof = janelaProf.locator('#raiz > div:not([hidden])');
  await expect(prof.getByText('Conectado à janela do aluno')).toBeVisible();
  janelaProf.once('dialog', (d) => d.accept());
  await prof.getByRole('button', { name: '🎲 Variar o caso do aluno' }).click();
  // aparece na janela do aluno e volta para a do professor
  await expect(abaVisivel(page).getByRole('note', { name: 'Variação do caso' })).toContainText('no caso original: 25 kg');
  await expect(prof.getByLabel('Paciente agora')).toContainText('Variação: Peso');
  expect(erros).toEqual([]);
});
