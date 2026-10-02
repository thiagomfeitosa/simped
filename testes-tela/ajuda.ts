import { expect, type Page } from '@playwright/test';

/**
 * Abre o app numa aba (ex.: 'prescrever') com o armazenamento limpo
 * e passa a vigiar erros do navegador: qualquer erro faz o teste falhar no fim.
 */
export async function abrir(page: Page, aba = ''): Promise<string[]> {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(`erro na página: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') erros.push(`console: ${m.text()}`);
  });
  await page.goto(`./${aba ? `#${aba}` : ''}`);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Modo do SimPed' })).toBeVisible();
  await esperarAba(page);
  return erros;
}

/** B20: cada aba é baixada na primeira vez que abre; espera o conteúdo dela chegar. */
export async function esperarAba(page: Page): Promise<void> {
  await expect(page.locator('#raiz > div:not([hidden]) > :not(.carregando-aba)').first()).toBeVisible();
}

/** Troca de aba pela barra do topo. */
export async function irPara(page: Page, rotulo: string | RegExp): Promise<void> {
  await page.getByRole('navigation', { name: 'Modo do SimPed' }).getByRole('link', { name: rotulo }).click();
  await esperarAba(page);
}

/** A aba visível (as outras ficam escondidas, mas abertas: procurar nelas confunde os testes). */
export function abaVisivel(page: Page) {
  return page.locator('#raiz > div:not([hidden])');
}

/** Passo a passo: abre a lista de casos (ela se recolhe depois de cada escolha). */
export async function abrirListaDeRoteiros(page: Page): Promise<void> {
  const caixa = page.locator('.escolha-roteiro-caixa');
  if (!(await caixa.evaluate((el) => (el as HTMLDetailsElement).open))) await caixa.locator('summary').click();
}
