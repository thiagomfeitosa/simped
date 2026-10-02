import { expect, test } from '@playwright/test';
import { abaVisivel, abrir, esperarAba } from './ajuda';

test('código de parada: FV com choques, adrenalina e amiodarona até o retorno da circulação', async ({ page }) => {
  const erros = await abrir(page, 'parada');
  const aba = abaVisivel(page);
  await aba.getByRole('radio', { name: /Escolar em fibrilação/ }).check({ force: true });
  await aba.getByRole('button', { name: /Iniciar o código/ }).click();
  await aba.getByRole('button', { name: /Pausar relógio/ }).click();
  const papeis = aba.getByRole('navigation', { name: 'Papéis nesta tela' });
  await expect(aba.getByLabel('Próxima ação')).toContainText('Chocar agora: 40 J');

  const chocar = async (j: string) => {
    await papeis.getByRole('button', { name: /Monitor/ }).click();
    await aba.getByLabel('Energia do choque (J)').fill(j);
    await aba.getByRole('button', { name: 'Carregar' }).click();
    await aba.getByRole('button', { name: /^⚡ Chocar/ }).click();
  };
  const checar = async () => {
    await papeis.getByRole('button', { name: /Monitor/ }).click();
    await aba.getByRole('button', { name: /Checar ritmo/ }).click();
  };
  const dar = async (droga: RegExp, rotulo: string, ml: string) => {
    await papeis.getByRole('button', { name: /Medicação/ }).click();
    await aba.getByRole('group', { name: 'Drogas e fluidos' }).getByRole('button', { name: droga }).click();
    await aba.getByLabel(rotulo).fill(ml);
    await aba.getByLabel('Flush de SF (mL)').fill('5');
    await aba.getByRole('button', { name: /Administrar/ }).click();
  };

  await chocar('40');
  await expect(aba.getByRole('status').filter({ hasText: '40 J confere' })).toBeVisible();
  await checar();
  await chocar('80');
  await dar(/Adrenalina/, 'mL de Adrenalina 1:10.000', '2');
  await checar();
  await chocar('80');
  await dar(/Amiodarona/, 'mL de Amiodarona', '2');
  await checar();
  await expect(aba.getByLabel('Ritmo no monitor')).toContainText('sinusal');
  await expect(aba.getByLabel('Registro do código')).toContainText('Choque de 40 J');
  await expect(aba.getByLabel('Registro do código')).toContainText('Adrenalina 1:10.000 — 1ª dose: 2 mL + flush de 5 mL de SF');
  await aba.getByRole('button', { name: /Encerrar o código/ }).click();
  const avaliacao = aba.getByLabel('Avaliação do código');
  await expect(avaliacao).toContainText('Amiodarona depois do 3º choque');
  await expect(aba.getByRole('heading', { name: /✔ Retorno da circulação/ })).toBeVisible();
  expect(erros).toEqual([]);
});

test('compressões pela barra de espaço e ventilações pela seta: ritmo, série 15:2 e qualidade no fim', async ({ page }) => {
  await page.clock.install();
  const erros = await abrir(page, 'parada');
  const aba = abaVisivel(page);
  await aba.getByRole('button', { name: /Iniciar o código/ }).click();
  const rcp = aba.getByRole('region', { name: 'RCP' });
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Space');
    await page.clock.runFor(540);
  }
  // o relógio de teste também anda sozinho: a frequência fica perto de 111/min (a conta exata está em src/parada/rcp.test.ts)
  await expect(rcp.getByLabel('Frequência das compressões', { exact: true })).toHaveText(/^\d+\/min$/);
  await expect(rcp.getByLabel('Série de compressões')).toHaveText('Série 15/15');
  await expect(rcp).toContainText('Agora: 2 ventilação');
  await page.keyboard.press('ArrowUp');
  await page.clock.runFor(1000);
  await page.keyboard.press('ArrowUp');
  await expect(rcp.getByLabel('Ventilações na pausa')).toHaveText('2/2');
  await aba.getByRole('button', { name: /Encerrar o código/ }).click();
  const q = aba.getByRole('region', { name: 'Qualidade da RCP' });
  await expect(q).toContainText('Compressões: 15');
  await expect(q).toContainText(/Frequência média: \d+\/min/);
  expect(erros).toEqual([]);
});

test('equipe: ordem do líder com "entendido", aviso do tempo e anotação; cada um na sua tela', async ({ page, context }) => {
  const erros = await abrir(page, 'parada');
  const aba = abaVisivel(page);
  await aba.getByLabel('Nome: Líder').fill('Ana');
  await aba.getByLabel('Nome: Acesso e medicações').fill('Carlos');

  // tela do colega (outra janela do mesmo computador)
  const colega = await context.newPage();
  await colega.goto('./#parada');
  await esperarAba(colega);
  const abaColega = abaVisivel(colega);
  await expect(abaColega.getByLabel('Nome: Líder')).toHaveValue('Ana');
  await abaColega.getByRole('button', { name: 'Fazer Acesso e medicações nesta tela' }).click();
  await expect(aba.getByText('📍 Tela 2')).toBeVisible();

  await aba.getByRole('button', { name: /Iniciar o código/ }).click();
  await expect(abaColega.getByRole('region', { name: 'Painel: Medicação' })).toBeVisible();
  await expect(abaColega.getByRole('navigation', { name: 'Papéis nesta tela' })).toHaveCount(0);

  // o líder (1ª tela) manda a adrenalina; o colega confirma e aplica
  await aba.getByRole('navigation', { name: 'Papéis nesta tela' }).getByRole('button', { name: /Líder/ }).click();
  await aba.getByLabel('Detalhe da ordem').fill('0,8 mL');
  await aba.getByRole('button', { name: /^Adrenalina/ }).click();
  await abaColega.getByRole('button', { name: '✔ Entendido' }).click();
  await abaColega.getByLabel('mL de Adrenalina 1:10.000').fill('0,8');
  await abaColega.getByLabel('Flush de SF (mL)').fill('5');
  await abaColega.getByLabel('Elevar o membro').check();
  await abaColega.getByRole('button', { name: /Administrar/ }).click();
  await expect(aba.getByLabel('Registro do código')).toContainText('1ª dose: 0,8 mL + flush de 5 mL de SF + elevação do membro — Carlos (Acesso e medicações)');

  // tempo e anotação (na 1ª tela)
  const papeis = aba.getByRole('navigation', { name: 'Papéis nesta tela' });
  await papeis.getByRole('button', { name: /Tempo/ }).click();
  await aba.getByRole('button', { name: /Avisar: hora da adrenalina/ }).click();
  await expect(abaColega.getByLabel('Recados da equipe')).toContainText('Hora da adrenalina');
  await papeis.getByRole('button', { name: /Anotação/ }).click();
  await aba.getByRole('button', { name: '✍ Anotar' }).first().click();
  await expect(aba.getByLabel('Folha do código')).toContainText('anotado');

  await aba.getByRole('button', { name: /Encerrar o código/ }).click();
  const equipe = abaColega.getByRole('region', { name: 'Equipe' });
  await expect(equipe).toContainText('Ordens do líder confirmadas (alça fechada): 1 de 1');
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
  await expect(briefing).not.toHaveAttribute('open', '');
  await briefing.locator('summary').click();
  await aba.getByLabel('Nome: Líder').fill('Dra. Ana');
  await aba.getByRole('region', { name: 'Conferência do briefing' }).getByLabel(/Papéis distribuídos/).check();
  await expect(briefing.locator('summary')).toContainText('(1/9)');
  await aba.getByRole('button', { name: /Iniciar o código/ }).click();
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
  await aba.getByRole('button', { name: /Novo código/ }).click();
  await expect(aba.getByLabel('Nome: Líder')).toHaveValue('Dra. Ana');
  expect(erros).toEqual([]);
});
