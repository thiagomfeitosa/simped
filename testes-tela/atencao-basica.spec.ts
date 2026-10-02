import { expect, test } from '@playwright/test';
import { abaVisivel, abrir } from './ajuda';

test('receitas: a conta da amoxicilina na otite é conferida e vira a receita pronta', async ({ page }) => {
  const erros = await abrir(page, 'atencao-basica');
  const aba = abaVisivel(page);
  await expect(aba.getByRole('heading', { name: /Atenção básica/ })).toBeVisible();
  await aba.getByLabel('Problema comum').selectOption('oma');
  await expect(aba.getByRole('region', { name: 'Caso' })).toContainText('14 kg');
  const receita = aba.getByRole('region', { name: 'Receita para calcular' });
  await receita.getByLabel('Dose por tomada de Amoxicilina (mg)').fill('300');
  await receita.getByLabel('Quanto medir de Amoxicilina (mL)').fill('6');
  await receita.getByRole('button', { name: 'Conferir conta' }).first().click();
  await expect(receita.getByRole('status').first()).toContainText('Confira a conta');
  await expect(receita.getByRole('status').first()).toContainText('50 mg/kg/dia × 14 kg = 700 mg por dia');
  await receita.getByLabel('Dose por tomada de Amoxicilina (mg)').fill('233,3');
  await receita.getByLabel('Quanto medir de Amoxicilina (mL)').fill('4,7');
  await receita.getByRole('button', { name: 'Conferir conta' }).first().click();
  await expect(receita.getByRole('status').first()).toContainText('Conta certa');
  await aba.getByRole('button', { name: /Ver a receita pronta/ }).click();
  await expect(aba.getByRole('region', { name: 'Receita pronta' })).toContainText('Dar 4,67 mL (233,3 mg) por via oral, de 8/8 h');
  expect(erros).toEqual([]);
});

test('exame físico: atlas de otoscopia e quiz', async ({ page }) => {
  const erros = await abrir(page, 'atencao-basica');
  const aba = abaVisivel(page);
  await aba.getByRole('button', { name: /Exame físico/ }).click();
  await expect(aba.getByRole('article', { name: 'Otite média aguda' })).toBeVisible();
  await aba.getByRole('group', { name: 'Sistema' }).getByRole('button', { name: /Pele e exantemas/ }).click();
  await expect(aba.getByRole('article', { name: 'Varicela (catapora)' })).toBeVisible();
  await aba.getByRole('button', { name: /O que é isto/ }).click();
  await aba.getByRole('group', { name: 'Alternativas' }).getByRole('button').first().click();
  await expect(aba.getByRole('region', { name: 'O que é isto?' }).getByRole('status')).toContainText(/Certo|É /);
  expect(erros).toEqual([]);
});

test('vacinas: carteira mostra o que aplicar hoje e o treino confere', async ({ page }) => {
  const erros = await abrir(page, 'atencao-basica');
  const aba = abaVisivel(page);
  await aba.getByRole('button', { name: /^💉 Vacinas$/ }).click();
  await expect(aba.getByRole('region', { name: 'Vacinas: 2 meses' })).toContainText('Rotavírus humano');
  await aba.getByRole('button', { name: /Carteira da criança/ }).click();
  const carteira = aba.getByRole('region', { name: 'Carteira de vacinação' });
  await expect(carteira.getByRole('row', { name: /Pentavalente.*2ª dose.*Aplicar hoje/ })).toBeVisible();
  await aba.getByLabel('Idade em meses').fill('5');
  await expect(carteira.getByRole('row', { name: /Rotavírus humano — 2ª dose.*Atrasada/ })).toBeVisible();
  await aba.getByRole('button', { name: /Treino: o que aplicar hoje/ }).click();
  await aba.getByRole('region', { name: 'Treino de vacinas' }).getByRole('button', { name: 'Conferir' }).click();
  await expect(aba.getByRole('status', { name: 'Resultado do treino de vacinas' })).toBeVisible();
  expect(erros).toEqual([]);
});

test('desenvolvimento: marcos presentes classificam como na Caderneta', async ({ page }) => {
  const erros = await abrir(page, 'atencao-basica');
  const aba = abaVisivel(page);
  await aba.getByRole('button', { name: /Desenvolvimento/ }).first().click();
  const marcos = aba.getByRole('region', { name: 'Marcos da faixa' });
  const resultado = aba.getByRole('status', { name: 'Resultado do desenvolvimento' });
  // 7 meses: faixa 6 a 9 meses
  for (const m of ['Brinca de esconde-achou', 'Transfere objetos de uma mão para a outra', 'Duplica sílabas', 'Senta sem apoio']) {
    await marcos.locator('.cartao-marco', { hasText: m }).getByLabel('Presente').check();
  }
  await expect(resultado).toContainText('Desenvolvimento adequado');
  await marcos.locator('.cartao-marco', { hasText: 'Senta sem apoio' }).getByLabel('Presente').uncheck();
  await expect(resultado).toContainText('Provável atraso');
  await expect(marcos.getByText(/Faltou marco: veja a faixa anterior/)).toBeVisible();
  for (const m of ['Busca ativa de objetos', 'Leva objetos à boca', 'Localiza o som', 'Muda de posição ativamente']) {
    await marcos.locator('.cartao-marco', { hasText: m }).getByLabel('Presente').check();
  }
  await expect(resultado).toContainText('Alerta para o desenvolvimento');
  await aba.getByRole('button', { name: /Linha do tempo dos marcos/ }).click();
  await expect(aba.getByRole('region', { name: 'Reflexos primitivos' })).toContainText('Moro');
  expect(erros).toEqual([]);
});

test('consulta de puericultura e hebiatria', async ({ page }) => {
  const erros = await abrir(page, 'atencao-basica');
  const aba = abaVisivel(page);
  await aba.getByRole('button', { name: /Consulta de puericultura/ }).click();
  await aba.getByRole('group', { name: 'Consulta' }).getByRole('button', { name: '6 meses' }).click();
  await expect(aba.getByRole('region', { name: 'Orientar' })).toContainText('Introdução alimentar');
  await aba.getByRole('button', { name: /Hebiatria/ }).click();
  await aba.getByLabel('PA sistólica').fill('142');
  await aba.getByLabel('PA diastólica').fill('70');
  await expect(aba.getByRole('status', { name: 'Classificação da PA' })).toHaveText('Hipertensão estágio 2');
  await aba.getByText('Casa (Home)').click();
  await aba.getByLabel('Anotações: Casa (Home)').fill('Mora com a mãe e a avó');
  await expect(aba.getByRole('region', { name: 'Estadiamento de Tanner' })).toContainText('Broto mamário');
  expect(erros).toEqual([]);
});
