import { expect, test } from '@playwright/test';
import { abaVisivel, abrir } from './ajuda';

test('código de parada: FV com choques, adrenalina e amiodarona até o retorno da circulação', async ({ page }) => {
  const erros = await abrir(page, 'parada');
  const aba = abaVisivel(page);
  await aba.getByLabel('Cenário da parada').selectOption('fv-escolar');
  await aba.getByRole('button', { name: /Iniciar o código/ }).click();
  await aba.getByRole('button', { name: /Pausar relógio/ }).click();
  await expect(aba.getByLabel('Próxima ação')).toContainText('Chocar agora: 40 J');

  const chocar = async (j: string) => {
    await aba.getByLabel('Energia do choque (J)').fill(j);
    await aba.getByRole('button', { name: 'Carregar e chocar' }).click();
  };
  const dar = async (rotulo: string, ml: string) => {
    await aba.getByLabel(rotulo).fill(ml);
    await aba.getByLabel(rotulo).press('Enter');
  };

  await chocar('40');
  await expect(aba.getByRole('status').first()).toContainText('40 J confere');
  await aba.getByRole('button', { name: /Checar ritmo/ }).click();
  await chocar('80');
  await dar('mL de Adrenalina 1:10.000', '2');
  await aba.getByRole('button', { name: /Checar ritmo/ }).click();
  await chocar('80');
  await dar('mL de Amiodarona', '2');
  await aba.getByRole('button', { name: /Checar ritmo/ }).click();
  await expect(aba.getByLabel('Ritmo no monitor')).toContainText('sinusal');
  await aba.getByRole('button', { name: /Encerrar o código/ }).click();
  const avaliacao = aba.getByLabel('Avaliação do código');
  await expect(avaliacao).toContainText('Retorno da circulação');
  await expect(avaliacao).toContainText('Amiodarona depois do 3º choque');
  await expect(aba.getByLabel('Registro do código')).toContainText('Choque de 40 J');
  expect(erros).toEqual([]);
});

test('folha de emergência por peso: no código de parada e nas calculadoras (peso estimado)', async ({ page }) => {
  const erros = await abrir(page, 'parada');
  await abaVisivel(page).getByRole('button', { name: /Folha de emergência/ }).click();
  const folha = page.getByRole('dialog', { name: 'Folha de emergência' });
  await expect(folha).toContainText('Folha de emergência — 8 kg');
  await expect(folha).toContainText('Adrenalina 1:10.000');
  await folha.getByRole('button', { name: 'Fechar' }).click();

  await page.goto('./#calculadoras');
  const calc = abaVisivel(page).getByRole('region', { name: 'Peso estimado e folha de emergência' });
  await expect(calc).toContainText('APLS: 14 kg');
  await calc.getByRole('button', { name: /Folha de emergência para 14 kg/ }).click();
  await expect(page.getByRole('dialog', { name: 'Folha de emergência' })).toContainText('1º: 28 J');
  expect(erros).toEqual([]);
});
