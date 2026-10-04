import { expect, type Locator, type Page, test } from '@playwright/test';
import { abaVisivel, abrir, esperarAba } from './ajuda';

/** Animação da RCP: a cena que todos veem (cada membro na sua tela, o professor e o telão). */

/** Avatar de um papel na cena (o desenho marca cada um com data-papel e data-acao). */
function avatar(cena: Locator, papel: string): Locator {
  return cena.locator(`[data-papel="${papel}"]`).first();
}

async function compressaoNaCena(cena: Locator): Promise<number> {
  return Number((await cena.getAttribute('data-compressao')) ?? '0');
}

/** Começa o código pelo botão (a 1ª tela faz todos os papéis). */
async function iniciar(page: Page) {
  await abaVisivel(page).getByRole('button', { name: /Iniciar o código/ }).click();
}

test('a cena aparece ao iniciar e o Espaço afunda o tórax na hora; esconder fica lembrado', async ({ page }) => {
  await page.clock.install();
  const erros = await abrir(page, 'parada');
  const aba = abaVisivel(page);
  await aba.getByLabel('Nome: Compressões 1').fill('Bruno');
  // antes do código não há cena (a página fica limpa)
  await expect(aba.getByRole('region', { name: 'Cena da RCP' })).toHaveCount(0);
  await iniciar(page);
  const cena = aba.getByRole('region', { name: 'Cena da RCP' });
  await expect(cena).toBeVisible();
  await expect(cena.locator('.cena-rcp-legenda')).toContainText('Aguardando a 1ª compressão');

  // relógio de teste parado: cada quadro só anda quando o teste manda
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.keyboard.press('Space');
  await page.clock.runFor(80);
  await expect(avatar(cena, 'compressor-1')).toHaveAttribute('data-acao', 'comprimindo');
  await expect.poll(() => compressaoNaCena(cena)).toBeGreaterThan(0);
  await expect(cena.locator('.cena-rcp-legenda')).toContainText('Bruno comprime');
  // o tórax volta todo (retorno total)
  await page.clock.runFor(500);
  await expect.poll(() => compressaoNaCena(cena)).toBe(0);
  await page.clock.resume();

  // esconder a cena: só o botão para mostrar de volta, e a escolha fica guardada nesta tela
  await cena.getByRole('button', { name: 'Esconder a cena' }).click();
  await expect(aba.getByRole('button', { name: /Mostrar a cena da RCP/ })).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('simped.parada.cena'))).toBe('0');
  await aba.getByRole('button', { name: /Mostrar a cena da RCP/ }).click();
  await expect(aba.getByRole('region', { name: 'Cena da RCP' }).locator('.cena-rcp-legenda')).toBeVisible();
  expect(erros).toEqual([]);
});

test('escolher o avatar de um papel muda a prévia (e vale para todas as telas)', async ({ page }) => {
  const erros = await abrir(page, 'parada');
  const aba = abaVisivel(page);
  await aba.getByRole('button', { name: 'Avatar de Compressões 1' }).click();
  const escolha = aba.getByRole('group', { name: 'Avatar: Compressões 1' });
  const previa = escolha.locator('.previa-avatar');
  await expect(previa).toHaveAttribute('data-pele', 'negro');
  await escolha.getByRole('group', { name: 'Pele' }).getByRole('button', { name: 'Pele clara' }).click();
  await expect(previa).toHaveAttribute('data-pele', 'claro');
  await escolha.getByRole('group', { name: 'Cabelo' }).getByRole('button', { name: 'Longo' }).click();
  await expect(previa).toHaveAttribute('data-cabelo', 'longo');
  await escolha.getByRole('group', { name: 'Cor da roupa' }).getByRole('button', { name: 'Laranja' }).click();
  await expect(previa).toHaveAttribute('data-roupa', '#c2410c');
  await expect(escolha.getByRole('group', { name: 'Pele' }).getByRole('button', { name: 'Pele clara' })).toHaveAttribute('aria-pressed', 'true');

  // a outra tela (janela) recebe a escolha pela sala
  const colega = await page.context().newPage();
  await colega.goto('./#parada');
  await esperarAba(colega);
  await abaVisivel(colega).getByRole('button', { name: 'Avatar de Compressões 1' }).click();
  await expect(abaVisivel(colega).getByRole('group', { name: 'Avatar: Compressões 1' }).locator('.previa-avatar')).toHaveAttribute('data-pele', 'claro');

  // voltar ao padrão do papel
  await escolha.getByRole('button', { name: 'Voltar ao padrão' }).click();
  await expect(previa).toHaveAttribute('data-pele', 'negro');
  expect(erros).toEqual([]);
});

test('só assistir (professor ou telão): vê a compressão, a carga e o choque feitos na outra tela', async ({ page, context }) => {
  const erros = await abrir(page, 'parada');
  const aba = abaVisivel(page);
  await aba.getByRole('radio', { name: /Escolar em fibrilação/ }).check({ force: true });
  await aba.getByLabel('Nome: Compressões 1').fill('Bruno');
  await aba.getByLabel('Nome: Monitor e desfibrilador').fill('Dani');

  // a janela de quem assiste (como a que a aba Professor abre)
  const telao = await context.newPage();
  const errosTelao: string[] = [];
  telao.on('pageerror', (e) => errosTelao.push(e.message));
  await telao.goto('./?assistir=parada#parada');
  await esperarAba(telao);
  const t = abaVisivel(telao);
  await expect(t.getByText('👀 Só assistindo')).toBeVisible();
  await expect(t.getByText('Esperando a equipe começar')).toBeVisible();
  await expect(t.getByRole('list', { name: 'Quem é quem' })).toContainText('Bruno');
  await expect(t.getByRole('button', { name: /Iniciar o código/ })).toHaveCount(0);
  // quem só assiste não faz papel: a equipe continua toda na 1ª tela
  await expect(aba.getByText('👀 1 só assistindo.')).toBeVisible();
  await expect(aba.getByText('📍 Tela 2')).toHaveCount(0);

  await iniciar(page);
  const cena = t.getByRole('region', { name: 'Cena da RCP' });
  await expect(cena).toBeVisible();
  await expect(t.getByRole('region', { name: 'Números da RCP' })).toBeVisible();
  await expect(t.getByLabel('Registro do código')).toContainText('Código iniciado');
  // sem teclas nem painéis de papel na tela de quem assiste
  await expect(t.getByRole('region', { name: 'RCP', exact: true })).toHaveCount(0);
  await expect(t.getByRole('navigation', { name: 'Papéis nesta tela' })).toHaveCount(0);

  // compressões na 1ª tela → o avatar de Bruno comprime na tela de quem assiste
  await expect(async () => {
    await page.keyboard.press('Space');
    await expect(avatar(cena, 'compressor-1')).toHaveAttribute('data-acao', 'comprimindo', { timeout: 400 });
  }).toPass({ timeout: 10_000 });
  await expect(cena.locator('.cena-rcp-legenda')).toContainText('Bruno comprime');
  // o tórax afunda e volta em ~0,3 s: aperta de novo até a outra tela pegar o afundamento
  await expect(async () => {
    await page.keyboard.press('Space');
    await expect.poll(() => compressaoNaCena(cena), { intervals: [10], timeout: 500 }).toBeGreaterThan(0);
  }).toPass({ timeout: 10_000 });

  // carga: todos de mãos ao alto; choque: aparece na tela de quem assiste
  const papeis = aba.getByRole('navigation', { name: 'Papéis nesta tela' });
  await papeis.getByRole('button', { name: /Monitor/ }).click();
  await aba.getByLabel('Energia do choque (J)').fill('40');
  await aba.getByRole('button', { name: 'Carregar' }).click();
  await expect(cena.locator('.cena-rcp-legenda')).toContainText('Afastem-se');
  await expect(avatar(cena, 'compressor-1')).toHaveAttribute('data-acao', 'maos-ao-alto');
  await aba.getByRole('button', { name: /^⚡ Chocar/ }).click();
  await expect(cena.locator('.cena-rcp-legenda')).not.toContainText('Afastem-se');
  await expect(t.getByLabel('Registro do código')).toContainText('Choque de 40 J');

  // depois do código: o debriefing de todos; sair do modo volta à tela normal
  await aba.getByRole('button', { name: /Encerrar o código/ }).click();
  await expect(t.getByRole('region', { name: 'Debriefing' })).toBeVisible();
  await t.getByRole('button', { name: 'Sair do modo só assistir' }).click();
  await expect(t.getByText('👀 Só assistindo')).toHaveCount(0);
  expect(new URL(telao.url()).searchParams.get('assistir')).toBeNull();
  expect(erros).toEqual([]);
  expect(errosTelao).toEqual([]);
});

test('aba Professor abre a janela que só assiste à parada', async ({ page, context }) => {
  const erros = await abrir(page, 'professor');
  const janela = context.waitForEvent('page');
  await abaVisivel(page).getByRole('region', { name: 'Parada ao vivo' }).getByRole('button', { name: /Assistir ao código/ }).click();
  const nova = await janela;
  await nova.waitForLoadState();
  expect(new URL(nova.url()).searchParams.get('assistir')).toBe('parada');
  expect(new URL(nova.url()).searchParams.get('papel')).toBeNull();
  await esperarAba(nova);
  await expect(abaVisivel(nova).getByText('Esperando a equipe começar')).toBeVisible();
  expect(erros).toEqual([]);
});

test('a janela que só assiste não mexe na sessão do aluno (sem "continuar", folha do professor intacta)', async ({ page, context }) => {
  const erros = await abrir(page, 'prescrever');
  await abaVisivel(page).locator('.secao').filter({ hasText: '3. Dieta' }).getByRole('button', { name: '+ item em texto' }).click();
  await abaVisivel(page).getByLabel('Item 1 — Dieta').fill('Dieta geral para a idade');
  // janela do professor (B15) vê a folha do aluno
  const prof = await context.newPage();
  await prof.goto('./?papel=professor#professor');
  await esperarAba(prof);
  await expect(abaVisivel(prof).getByLabel('Folha do aluno ao vivo')).toContainText('Dieta geral para a idade');
  // o professor abre o telão da parada
  const janela = context.waitForEvent('page');
  await abaVisivel(prof).getByRole('region', { name: 'Parada ao vivo' }).getByRole('button', { name: /Assistir ao código/ }).click();
  const telao = await janela;
  await telao.waitForLoadState();
  await esperarAba(telao);
  await expect(abaVisivel(telao).getByText('Esperando a equipe começar')).toBeVisible();
  await telao.waitForTimeout(600);
  // o telão não pergunta "continuar" (não é dono da sessão) e a folha do professor continua com a dieta
  await expect(telao.getByRole('dialog', { name: 'Continuar o caso' })).toHaveCount(0);
  await expect(abaVisivel(prof).getByLabel('Folha do aluno ao vivo')).toContainText('Dieta geral para a idade');
  expect(await page.evaluate(() => window.localStorage.getItem('simped.sessao-em-andamento'))).toContain('Dieta geral para a idade');
  expect(erros).toEqual([]);
});

test('rever o código no debriefing: a cena em qualquer momento', async ({ page }) => {
  const erros = await abrir(page, 'parada');
  const aba = abaVisivel(page);
  await iniciar(page);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(600);
  await aba.getByRole('button', { name: /Encerrar o código/ }).click();

  const rever = aba.locator('details.rever-codigo');
  await expect(rever).not.toHaveAttribute('open', '');
  await rever.locator('summary').click();
  const regiao = aba.getByRole('region', { name: 'Rever o código' });
  await expect(regiao).toBeVisible();
  await expect(regiao.locator('.cena-rcp-legenda')).toContainText('Aguardando a 1ª compressão');
  const controle = regiao.getByLabel('Momento do código');
  const fim = Number(await controle.getAttribute('max'));
  expect(fim).toBeGreaterThan(0.5);
  // no fim: código encerrado
  await controle.fill(String(fim));
  await expect(regiao.locator('.cena-rcp-legenda')).toContainText('Código encerrado');
  // tocar do começo: o tempo anda sozinho
  await controle.fill('0');
  await regiao.getByRole('button', { name: '4×' }).click();
  await regiao.getByRole('button', { name: 'Tocar' }).click();
  await expect.poll(async () => Number(await regiao.getAttribute('data-tempo'))).toBeGreaterThan(0.3);
  await expect(regiao.getByRole('button', { name: 'Tocar' })).toBeVisible({ timeout: 10_000 });
  expect(erros).toEqual([]);
});

test.describe('celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('a cena e a escolha do avatar não fazem a página rolar de lado', async ({ page }) => {
    const erros = await abrir(page, 'parada');
    const aba = abaVisivel(page);
    await aba.getByRole('button', { name: 'Avatar de Ventilação e via aérea' }).click();
    const rolagem = () => page.evaluate(() => document.documentElement.scrollWidth);
    expect(await rolagem()).toBeLessThanOrEqual(390);
    await iniciar(page);
    await expect(aba.getByRole('region', { name: 'Cena da RCP' })).toBeVisible();
    await page.waitForTimeout(400);
    expect(await rolagem()).toBeLessThanOrEqual(390);
    expect(erros).toEqual([]);
  });
});
