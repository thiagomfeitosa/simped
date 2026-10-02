import { expect, type Page, test } from '@playwright/test';
import { abaVisivel, abrir } from './ajuda';

/** B17 — Tablet e celular: a página nunca rola de lado e o Prescrever mostra um painel por vez. */

const ABAS = ['passo-a-passo', 'prescrever', 'parada', 'treino', 'calculadoras', 'casos', 'banco', 'professor', 'configuracoes'];

const APARELHOS = [
  { nome: 'celular', viewport: { width: 390, height: 844 } },
  { nome: 'celular pequeno', viewport: { width: 360, height: 740 } },
  { nome: 'iPad em pé', viewport: { width: 820, height: 1180 } },
];

/** No celular, conteúdo largo demais faz o navegador "afastar" a página: a largura útil cresce além da tela. */
async function semRolagemLateral(page: Page, onde: string) {
  const largura = page.viewportSize()!.width;
  const medida = await page.evaluate(() => ({ util: window.innerWidth, conteudo: document.documentElement.scrollWidth }));
  expect(medida.util, `${onde}: a página ficou mais larga que a tela`).toBe(largura);
  expect(medida.conteudo, `${onde}: a página rola de lado`).toBeLessThanOrEqual(largura);
}

for (const aparelho of APARELHOS) {
  test.describe(aparelho.nome, () => {
    test.use({ viewport: aparelho.viewport, isMobile: true, hasTouch: true });

    test('nenhuma aba rola de lado', async ({ page }) => {
      const erros = await abrir(page, 'passo-a-passo');
      for (const aba of ABAS) {
        await page.evaluate((h) => (window.location.hash = h), aba);
        await expect(page.getByRole('navigation', { name: 'Modo do SimPed' }).locator('[aria-current="page"]')).toHaveAttribute('href', `#${aba}`);
        await page.waitForTimeout(400); // animações de entrada
        await semRolagemLateral(page, aba);
      }
      // passo a passo andando algumas etapas (animações deslizando)
      await page.evaluate(() => (window.location.hash = 'passo-a-passo'));
      for (let i = 0; i < 4; i++) await page.getByRole('button', { name: /Avançar/ }).click();
      await semRolagemLateral(page, 'passo a passo, etapa 5');
      expect(erros).toEqual([]);
    });
  });
}

test.describe('Prescrever no celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('um painel por vez; trocar de painel não perde nada', async ({ page }) => {
    const erros = await abrir(page, 'prescrever');
    const tela = abaVisivel(page);
    const paineis = tela.getByRole('navigation', { name: 'Painéis do caso' });
    await expect(paineis).toBeVisible();
    await expect(paineis.getByLabel('Sinais agora')).toContainText('FC 120');

    // começa no paciente
    await expect(tela.getByRole('complementary', { name: 'Paciente' })).toBeVisible();
    await expect(tela.locator('.coluna-documento')).toBeHidden();

    // folha
    await paineis.getByRole('button', { name: /Folha/ }).click();
    await expect(tela.getByRole('complementary', { name: 'Paciente' })).toBeHidden();
    await tela.locator('.secao').filter({ hasText: '3. Dieta' }).getByRole('button', { name: '+ item em texto' }).click();
    await tela.getByLabel('Item 1 — Dieta').fill('Dieta livre');
    await semRolagemLateral(page, 'folha');

    // horários e exames, depois rascunho
    await paineis.getByRole('button', { name: /Horários e exames/ }).click();
    await expect(tela.getByLabel('Exame a pedir')).toBeVisible();
    await expect(tela.getByRole('region', { name: 'Rascunho de cálculos' })).toBeHidden();
    await paineis.getByRole('button', { name: /Rascunho/ }).click();
    await tela.getByRole('region', { name: 'Rascunho de cálculos' }).locator('textarea').fill('16 x 10');
    await expect(tela.getByLabel('Exame a pedir')).toBeHidden();

    // de volta à folha: o que foi escrito continua lá
    await paineis.getByRole('button', { name: /Folha/ }).click();
    await expect(tela.getByLabel('Item 1 — Dieta')).toHaveValue('Dieta livre');
    expect(erros).toEqual([]);
  });

  test('botões e abas do tamanho do dedo', async ({ page }) => {
    const erros = await abrir(page, 'prescrever');
    const altura = async (alvo: ReturnType<Page['locator']>) => (await alvo.boundingBox())!.height;
    expect(await altura(page.getByRole('navigation', { name: 'Modo do SimPed' }).getByRole('link', { name: /Prescrever/ }))).toBeGreaterThanOrEqual(44);
    expect(await altura(abaVisivel(page).getByRole('navigation', { name: 'Painéis do caso' }).getByRole('button', { name: /Folha/ }))).toBeGreaterThanOrEqual(40);
    expect(await altura(abaVisivel(page).getByLabel('Caso clínico'))).toBeGreaterThanOrEqual(40);
    expect(erros).toEqual([]);
  });
});

test('computador: sem barra de painéis, as três colunas lado a lado', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  const tela = abaVisivel(page);
  await expect(tela.getByRole('navigation', { name: 'Painéis do caso' })).toBeHidden();
  await expect(tela.getByRole('complementary', { name: 'Paciente' })).toBeVisible();
  await expect(tela.locator('.coluna-documento')).toBeVisible();
  await expect(tela.getByRole('region', { name: 'Rascunho de cálculos' })).toBeVisible();
  expect(erros).toEqual([]);
});
