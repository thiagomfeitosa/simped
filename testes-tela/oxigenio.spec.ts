import { expect, test } from '@playwright/test';
import { abaVisivel, abrir } from './ajuda';

test('oxigenoterapia: o cateter nasal sobe a SpO₂ da criança com asma e a gasometria arterial mostra a pO₂', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  const aba = abaVisivel(page);
  await aba.getByLabel('Caso clínico').selectOption('caso06-asma-grave');
  const spo2 = () => aba.getByLabel('Sinais agora');
  await expect(spo2()).toContainText('SpO₂ 89%');

  const o2 = aba.getByLabel('Oxigênio');
  await o2.getByLabel('Dispositivo de O₂').selectOption('cateter');
  await o2.getByLabel('Fluxo de O₂ (L/min)').fill('2');
  await o2.getByRole('button', { name: 'Instalar' }).click();
  await expect(o2).toContainText('Cateter nasal 2 L/min (FiO₂ ≈ 29%)');
  await expect(spo2()).not.toContainText('SpO₂ 89%');
  await expect(aba.locator('.linha-do-tempo')).toContainText('Oxigênio: Cateter nasal 2 L/min');

  await aba.getByLabel('Exame a pedir').selectOption({ label: 'Gasometria arterial' });
  await aba.getByRole('button', { name: 'Pedir' }).click();
  await aba.getByRole('button', { name: '+15 min' }).click();
  await expect(aba.locator('.lista-exames li').first()).toContainText('pO₂');
  expect(erros).toEqual([]);
});

test('oxigenoterapia: em apneia a máscara não adianta e a bolsa ventila', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  await page.goto('./#professor');
  await abaVisivel(page).getByRole('button', { name: /Apneia/ }).click();
  await page.goto('./#prescrever');
  const o2 = abaVisivel(page).getByLabel('Oxigênio');
  await o2.getByLabel('Dispositivo de O₂').selectOption('mascara-reservatorio');
  await o2.getByRole('button', { name: 'Instalar' }).click();
  await expect(o2.getByRole('alert')).toContainText('O₂ sozinho não adianta');
  await o2.getByLabel('Dispositivo de O₂').selectOption('bolsa');
  await o2.getByRole('button', { name: 'Instalar' }).click();
  await expect(o2.getByRole('alert')).toHaveCount(0);
  await expect(abaVisivel(page).getByLabel('Exame à beira do leito')).toContainText('Ventilação assistida');
  expect(erros).toEqual([]);
});
