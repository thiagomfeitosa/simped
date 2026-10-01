import { expect, type Page, test } from '@playwright/test';
import { abaVisivel, abrir } from './ajuda';

async function darDipirona(page: Page, doseMg: string) {
  const aba = abaVisivel(page);
  await aba.locator('.secao').filter({ hasText: '6. Demais medicações' }).getByRole('button', { name: '+ medicação' }).click();
  const n = await aba.locator('.item-med').count();
  const item = `Item ${n}`;
  await aba.getByLabel(`${item} — medicação`).selectOption({ label: 'Dipirona' });
  await aba.getByLabel(`${item} — apresentação`).selectOption({ index: 1 });
  await aba.getByLabel(`${item} — indicação`).selectOption('Febre/dor');
  await aba.getByLabel(`${item} — dose`, { exact: true }).fill(doseMg);
  await aba.getByLabel(`${item} — unidade da dose`).selectOption('mg');
  await aba.getByLabel(`${item} — volume (mL)`).fill('1');
  await aba.getByLabel(`${item} — via`).selectOption('EV');
  await aba.getByLabel(`${item} — intervalo`).selectOption('dose-unica');
  await aba.locator('.item-med').nth(n - 1).getByRole('button', { name: 'Administrar' }).click();
}

test('B9: subdose dá efeito parcial; dose alta dá efeito adverso', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  await darDipirona(page, '80'); // 5 mg/kg em 16 kg
  await expect(abaVisivel(page).locator('.linha-do-tempo')).toContainText('efeito parcial');
  await darDipirona(page, '800'); // 50 mg/kg
  await expect(abaVisivel(page).locator('.linha-do-tempo')).toContainText('efeito adverso');
  await expect(abaVisivel(page).locator('.linha-do-tempo')).toContainText('Hipotensão');
  expect(erros).toEqual([]);
});

test('B10/B11: PCR em FV mostra o ritmo, "---" e a beira do leito', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  await abaVisivel(page).getByLabel('Caso clínico').selectOption('caso12-pcr-fv');
  const aba = abaVisivel(page);
  await expect(aba.getByLabel('Ritmo no monitor')).toContainText('Fibrilação ventricular');
  await expect(aba.locator('.vital.cor-fc .vital-valor')).toHaveText('---');
  await expect(aba.locator('.monitor-alarmes')).toContainText('FV — SEM PULSO');
  const beira = aba.getByLabel('Exame à beira do leito');
  await expect(beira).toContainText('3');
  await expect(beira).toContainText('Ventilação assistida');
  expect(erros).toEqual([]);
});

test('B10: TSV no monitor; o modo prova esconde o nome do ritmo', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  await abaVisivel(page).getByLabel('Caso clínico').selectOption('caso11-tsv');
  await expect(abaVisivel(page).getByLabel('Ritmo no monitor')).toContainText('Taquicardia supraventricular');
  await page.getByRole('link', { name: /Configurações/ }).click();
  await abaVisivel(page).getByText('Prova', { exact: true }).click();
  await page.getByRole('link', { name: /Prescrever/ }).click();
  await expect(abaVisivel(page).getByLabel('Ritmo no monitor')).toContainText('reconheça pelo traçado');
  expect(erros).toEqual([]);
});
