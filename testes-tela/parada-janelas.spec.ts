import { expect, type Page, test } from '@playwright/test';
import { abaVisivel, abrir, esperarAba, irPara } from './ajuda';

/**
 * Janelas da Parada: o papel da janela (aluno, professor, janela extra da Parada) vem só da marca posta
 * ao abrir a janela (?papel=professor, ?janela=parada) e nunca do "só assistir", que liga e desliga na tela.
 */

const SESSAO = 'simped.sessao-em-andamento';

/** Põe um item de dieta na folha do Prescrever (a sessão do aluno passa a ficar guardada). */
async function dietaDoAluno(page: Page, texto = 'Dieta do aluno') {
  await abaVisivel(page).locator('.secao').filter({ hasText: '3. Dieta' }).getByRole('button', { name: '+ item em texto' }).click();
  await abaVisivel(page).getByLabel('Item 1 — Dieta').fill(texto);
  await expect.poll(() => page.evaluate((c) => window.localStorage.getItem(c), SESSAO)).toContain(texto);
}

test('o telão que sai do "só assistir" e recarrega continua só espelho (não pergunta "continuar" nem apaga a sessão do aluno)', async ({ page, context }) => {
  const erros = await abrir(page, 'prescrever');
  await dietaDoAluno(page);
  // a janela que a aba Professor abre
  const telao = await context.newPage();
  await telao.goto('./?janela=parada&assistir=parada#parada');
  await esperarAba(telao);
  await abaVisivel(telao).getByRole('button', { name: 'Sair do modo só assistir' }).click();
  expect(new URL(telao.url()).searchParams.get('janela')).toBe('parada');
  await telao.reload();
  await esperarAba(telao);
  await telao.waitForTimeout(600);
  await expect(telao.getByRole('dialog', { name: 'Continuar o caso' })).toHaveCount(0);
  expect(await telao.evaluate((c) => window.localStorage.getItem(c), SESSAO)).toContain('Dieta do aluno');
  expect(erros).toEqual([]);
});

test('"só assistir" na janela do aluno e recarregar: ela continua dona da sessão (o Prescrever funciona e oferece continuar)', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  await dietaDoAluno(page);
  await irPara(page, /Parada/);
  await abaVisivel(page).getByRole('button', { name: /Só assistir/ }).click();
  expect(new URL(page.url()).searchParams.get('assistir')).toBe('parada');
  await page.reload();
  await esperarAba(page);
  // continua a janela do aluno: pergunta se quer continuar o caso
  const dialogo = page.getByRole('dialog', { name: 'Continuar o caso' });
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole('button', { name: /Continuar o caso/ }).click();
  // o Prescrever responde normalmente
  await irPara(page, /Prescrever/);
  await expect(abaVisivel(page).getByLabel('Item 1 — Dieta')).toHaveValue('Dieta do aluno');
  await abaVisivel(page).locator('.secao').filter({ hasText: '3. Dieta' }).getByRole('button', { name: '+ item em texto' }).click();
  await expect(abaVisivel(page).getByLabel('Item 2 — Dieta')).toBeVisible();
  // e a Parada lembra o "só assistir"
  await irPara(page, /Parada/);
  await expect(abaVisivel(page).getByText('👀 Só assistindo')).toBeVisible();
  expect(erros).toEqual([]);
});

test('a tela de um colega (?janela=parada) só mostra a sessão do aluno: o Prescrever dela não mexe na folha nem troca o caso', async ({ page, context }) => {
  const erros = await abrir(page, 'prescrever');
  await dietaDoAluno(page);
  const casoDoAluno = await abaVisivel(page).getByLabel('Caso clínico').inputValue();
  const colega = await context.newPage();
  await colega.goto('./?janela=parada#prescrever');
  await esperarAba(colega);
  const aba = abaVisivel(colega);
  await expect(colega.getByText(/Janela da Parada/)).toBeVisible();
  await expect(aba.getByLabel('Item 1 — Dieta')).toHaveValue('Dieta do aluno');
  // "+ item em texto" não cria nada (nem aqui nem na janela do aluno)
  await aba.locator('.secao').filter({ hasText: '3. Dieta' }).getByRole('button', { name: '+ item em texto' }).click();
  await colega.waitForTimeout(400);
  await expect(aba.getByLabel('Item 2 — Dieta')).toHaveCount(0);
  await expect(abaVisivel(page).getByLabel('Item 2 — Dieta')).toHaveCount(0);
  // trocar o caso no menu não recomeça a sessão do aluno
  colega.on('dialog', (d) => void d.accept());
  const menu = aba.getByLabel('Caso clínico');
  const outro = await menu.locator('option').evaluateAll((os, atual) => os.map((o) => (o as HTMLOptionElement).value).find((v) => v && v !== atual), casoDoAluno);
  await menu.selectOption(outro!);
  await colega.waitForTimeout(600);
  await expect(abaVisivel(page).getByLabel('Caso clínico')).toHaveValue(casoDoAluno);
  await expect(abaVisivel(page).getByLabel('Item 1 — Dieta')).toHaveValue('Dieta do aluno');
  expect(await page.evaluate((c) => window.localStorage.getItem(c), SESSAO)).toContain('Dieta do aluno');
  // na Parada, a faixa não aparece (a tela é para o código)
  await irPara(colega, /Parada/);
  await expect(colega.getByText(/Janela da Parada/)).toHaveCount(0);
  expect(erros).toEqual([]);
});

test('no Preparar, ligar e desligar o "só assistir" devolve os papéis à tela', async ({ page, context }) => {
  const erros = await abrir(page, 'parada');
  const colega = await context.newPage();
  await colega.goto('./?janela=parada#parada');
  await esperarAba(colega);
  const aba = abaVisivel(page);
  await expect(aba.getByText('2 telas abertas.')).toBeVisible();
  await expect(aba.locator('.papel-equipe.meu')).toHaveCount(8);
  await aba.getByRole('button', { name: /Só assistir/ }).click();
  await expect(abaVisivel(colega).locator('.papel-equipe.meu')).toHaveCount(8);
  await aba.getByRole('button', { name: 'Sair do modo só assistir' }).click();
  // antes do código começar, volta ao lugar de entrada (a 1ª tela) com todos os papéis
  await expect(aba.locator('.papel-equipe.meu')).toHaveCount(8);
  await expect(abaVisivel(colega).locator('.papel-equipe.meu')).toHaveCount(0);
  expect(erros).toEqual([]);
});

test('a tela de um colega aberta da janela do professor não vira janela do professor', async ({ page, context }) => {
  await page.goto('./?papel=professor#parada');
  await esperarAba(page);
  const janela = context.waitForEvent('page');
  await abaVisivel(page).getByRole('button', { name: /Abrir a tela de um colega/ }).click();
  const nova = await janela;
  await nova.waitForLoadState();
  const consulta = new URL(nova.url()).searchParams;
  expect(consulta.get('janela')).toBe('parada');
  expect(consulta.get('papel')).toBeNull();
  await esperarAba(nova);
  await expect(nova.locator('.banner-professor:not(.banner-janela-parada)')).toHaveCount(0);
});
