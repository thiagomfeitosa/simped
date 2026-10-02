import { expect, test } from '@playwright/test';
import { abaVisivel, abrir } from './ajuda';

test('Capurro somático: marcar os 5 sinais dá a IG e a conta', async ({ page }) => {
  const erros = await abrir(page, 'recem-nascido');
  const aba = abaVisivel(page);
  await expect(aba.getByRole('heading', { name: /Recém-nascido/ })).toBeVisible();
  const marcar = async (criterio: string, opcao: RegExp) => {
    await aba.getByRole('radiogroup', { name: `Opções — ${criterio}` }).getByRole('radio', { name: opcao }).click();
  };
  await marcar('Textura da pele', /Grossa, rugas superficiais/);
  await marcar('Forma da orelha', /parcialmente encurvado em toda/);
  await marcar('Glândula mamária', /Entre 5 e 10 mm/);
  await marcar('Formação do mamilo', /borda não levantada/);
  const resultado = aba.getByRole('status', { name: 'Resultado da idade gestacional' });
  await expect(resultado).toContainText('Faltam: Pregas plantares');
  await marcar('Pregas plantares', /^Sulcos na metade anterior/);
  await expect(resultado).toContainText('66 pontos');
  await expect(resultado).toContainText('38 semanas e 4 dias');
  await expect(resultado).toContainText('204 + 66 = 270 dias');
  await expect(resultado).toContainText('Termo precoce');

  // a IG do exame aparece na parte "Idade gestacional", junto com a DUM
  await aba.getByRole('group', { name: 'Parte da aba Recém-nascido' }).getByRole('button', { name: /Idade gestacional/ }).click();
  await aba.getByLabel('DUM').fill('2026-01-01');
  await aba.getByLabel('Data de referência').fill('2026-09-08');
  const ig = aba.getByRole('status', { name: 'Resultado da idade gestacional' }).last();
  await expect(ig).toContainText('Pela DUM: 35 semanas e 5 dias');
  await expect(ig).toContainText('Pelo exame do RN (Capurro somático): 38 semanas e 4 dias');
  expect(erros).toEqual([]);
});

test('New Ballard: genitais pelo sexo e treino de reconhecer', async ({ page }) => {
  const erros = await abrir(page, 'recem-nascido');
  const aba = abaVisivel(page);
  await aba.getByRole('group', { name: 'Método' }).getByRole('button', { name: 'New Ballard' }).click();
  await expect(aba.getByRole('region', { name: 'Genitais (masculino)' })).toBeVisible();
  await aba.getByLabel('Sexo do RN').selectOption('feminino');
  await expect(aba.getByRole('region', { name: 'Genitais (feminino)' })).toBeVisible();
  await expect(aba.getByRole('region', { name: 'Genitais (masculino)' })).toHaveCount(0);
  await aba.getByRole('button', { name: /Treino: reconhecer/ }).click();
  await expect(aba.getByText(/cada cartão mostra o desenho/)).toBeVisible();
  expect(erros).toEqual([]);
});

test('exame no alojamento conjunto: classificar regiões e ver o resumo', async ({ page }) => {
  const erros = await abrir(page, 'recem-nascido');
  const aba = abaVisivel(page);
  await aba.getByRole('button', { name: /Exame no alojamento conjunto/ }).click();
  await expect(aba.getByRole('img', { name: /RN de \d+ horas de vida/ })).toBeVisible();
  const roteiro = aba.getByRole('navigation', { name: 'Roteiro do exame' });
  // examina a pele clicando no ponto do desenho, e a cabeça pela lista
  await aba.getByRole('button', { name: 'Examinar: Pele' }).click();
  await expect(aba.getByRole('heading', { name: /Pele/ })).toBeVisible();
  await aba.getByRole('group', { name: 'Como você classifica?' }).getByRole('button', { name: /^Normal/ }).click();
  await expect(aba.getByText(/✔ Certo\.|✘ Esperado/)).toBeVisible();
  await roteiro.getByRole('button', { name: /Cabeça e fontanelas/ }).click();
  await aba.getByRole('group', { name: 'Como você classifica?' }).getByRole('button', { name: /^Alterado/ }).click();
  await roteiro.getByRole('button', { name: /Resumo \(2\/13\)/ }).click();
  await expect(aba.getByRole('status', { name: 'Resumo do exame' })).toContainText('classificações certas');

  // teste do coraçãozinho
  await aba.getByLabel('SpO₂ mão direita').fill('98');
  await aba.getByLabel('SpO₂ pé').fill('94');
  await expect(aba.getByRole('region', { name: 'Teste do coraçãozinho' })).toContainText('repetir em 1 hora');
  expect(erros).toEqual([]);
});

test('atlas do RN: filtros, busca e zonas de Kramer', async ({ page }) => {
  const erros = await abrir(page, 'recem-nascido');
  const aba = abaVisivel(page);
  await aba.getByRole('button', { name: /Atlas do RN/ }).click();
  await aba.getByRole('group', { name: 'Tipo de achado' }).getByRole('button', { name: 'Urgentes' }).click();
  await expect(aba.getByRole('article', { name: 'Onfalite' })).toBeVisible();
  await expect(aba.getByRole('article', { name: 'Eritema tóxico neonatal' })).toHaveCount(0);
  await aba.getByRole('group', { name: 'Tipo de achado' }).getByRole('button', { name: 'Todos' }).click();
  await aba.getByLabel('Buscar no atlas').fill('cefalo');
  await expect(aba.getByRole('article', { name: 'Cefalo-hematoma' })).toBeVisible();
  await aba.getByLabel('Zona de Kramer').fill('5');
  await expect(aba.getByRole('img', { name: 'RN com icterícia até a zona 5 de Kramer' })).toBeVisible();
  // tom de pele
  await aba.getByRole('button', { name: 'Pele negra' }).click();
  await expect(aba.getByRole('button', { name: 'Pele negra' })).toHaveAttribute('aria-pressed', 'true');
  expect(erros).toEqual([]);
});

test('Apgar e Silverman-Andersen somam e classificam', async ({ page }) => {
  const erros = await abrir(page, 'recem-nascido');
  const aba = abaVisivel(page);
  await aba.getByRole('button', { name: /Apgar e Silverman/ }).click();
  for (const item of ['Frequência cardíaca', 'Respiração', 'Tônus muscular', 'Irritabilidade reflexa']) {
    await aba.getByRole('button', { name: new RegExp(`^${item}: .*\\(2\\)$`) }).click();
  }
  await aba.getByRole('button', { name: /^Cor: Corpo róseo, extremidades cianóticas \(1\)$/ }).click();
  await expect(aba.getByRole('status', { name: 'Resultado Apgar' })).toContainText('9 — Tranquilizador');
  expect(erros).toEqual([]);
});
