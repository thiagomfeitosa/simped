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

test('briefing antes e debriefing depois do código (números, anotações e arquivo)', async ({ page }) => {
  const erros = await abrir(page, 'parada');
  const aba = abaVisivel(page);
  const briefing = aba.locator('details.briefing');
  await expect(briefing).toHaveAttribute('open', '');
  await aba.getByLabel('Nome: Líder').fill('Dra. Ana');
  await aba.getByRole('region', { name: 'Conferência do briefing' }).getByLabel(/Papéis distribuídos/).check();
  await expect(briefing.locator('summary')).toContainText('(1/9)');
  await aba.getByRole('button', { name: /Iniciar o código/ }).click();
  await expect(briefing).not.toHaveAttribute('open', '');
  await aba.getByRole('button', { name: /Pausar relógio/ }).click();
  await aba.getByRole('button', { name: /Encerrar o código/ }).click();
  const debriefing = aba.getByRole('region', { name: 'Debriefing' });
  await expect(debriefing.getByRole('list', { name: 'Números do código' })).toContainText('Tempo total de código');
  await expect(debriefing).toContainText('1ª adrenalina: não dada');
  await debriefing.getByLabel('3. Análise (plus/delta)').fill('+ RCP começou rápido; Δ faltou adrenalina');
  await debriefing.getByLabel('Comunicação em alça fechada: 3').check();
  const download = page.waitForEvent('download');
  await debriefing.getByRole('button', { name: /Baixar o debriefing/ }).click();
  const arquivo = await download;
  expect(arquivo.suggestedFilename()).toMatch(/^debriefing-.*\.txt$/);
  expect(erros).toEqual([]);
});
