import { expect, test } from '@playwright/test';
import { abaVisivel, abrir, irPara } from './ajuda';

test('Fase 2: a gasometria colhida depois da convulsão mostra a acidose (lactato sobe)', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  const aluno = abaVisivel(page);
  const linhaLactato = () => aluno.locator('.lista-exames li').first().locator('tr', { hasText: 'Lactato' });

  // gasometria da admissão: o valor do arquivo do caso (2,8)
  await aluno.getByLabel('Exame a pedir').selectOption({ label: 'Gasometria venosa' });
  await aluno.getByRole('button', { name: 'Pedir' }).click();
  await aluno.getByRole('button', { name: '+15 min' }).click();
  await expect(linhaLactato()).toContainText('2,8');

  // o professor dispara a convulsão
  await irPara(page, /Professor/);
  const prof = abaVisivel(page);
  await prof.getByRole('button', { name: /Convulsão/ }).click();
  await expect(prof.getByLabel('Exames se colhidos agora')).toContainText('lactato');

  // nova gasometria, colhida depois da convulsão: lactato maior e a leitura guiada continua funcionando
  await irPara(page, /Prescrever/);
  await aluno.getByRole('button', { name: '+5 min' }).click();
  await aluno.getByLabel('Exame a pedir').selectOption({ label: 'Gasometria venosa' });
  await aluno.getByRole('button', { name: 'Pedir' }).click();
  await aluno.getByRole('button', { name: '+15 min' }).click();
  await expect(linhaLactato()).toContainText('6,8');
  // a gasometria antiga continua com o valor do momento em que foi colhida
  await expect(aluno.locator('.lista-exames li').nth(1).locator('tr', { hasText: 'Lactato' })).toContainText('2,8');
  expect(erros).toEqual([]);
});

test('Fase 2: respiração animada e tira de ECG em papel', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  const aluno = abaVisivel(page);
  await aluno.getByLabel('Caso clínico').selectOption('caso10-cetoacidose');
  await expect(aluno.getByLabel('Respiração animada')).toContainText('Kussmaul');
  await aluno.getByRole('button', { name: /Tira de ECG/ }).click();
  const tira = page.getByRole('dialog', { name: 'Tira de ECG' });
  await expect(tira).toContainText('25 mm/s');
  await expect(tira).toContainText('Rafael');
  await tira.getByRole('button', { name: 'Fechar' }).click();
  await expect(tira).toHaveCount(0);
  expect(erros).toEqual([]);
});
