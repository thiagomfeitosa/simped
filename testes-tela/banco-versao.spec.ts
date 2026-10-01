import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { lerXlsx } from '../src/importacao/xlsx';
import { abaVisivel, abrir, irPara } from './ajuda';

test('B8: medicações A1–A50 no banco, sem dose', async ({ page }) => {
  const erros = await abrir(page, 'banco');
  const banco = abaVisivel(page);
  await expect(banco.locator('.relatorio-numeros strong').first()).toHaveText('90');
  await banco.getByLabel('Buscar medicação').fill('midazolam');
  await banco.locator('.med-banco summary', { hasText: 'Midazolam' }).click();
  const med = banco.locator('.med-banco', { hasText: 'Midazolam' });
  await expect(med).toContainText('Ampola 5 mg/mL, 3 mL (15 mg)');
  await expect(med.locator('li', { hasText: 'Crise convulsiva' })).toContainText('Dose ainda não cadastrada (A VALIDAR)');
  expect(erros).toEqual([]);
});

test('B8: planilha gerada pelo app, com todas as medicações, e lida de volta', async ({ page }) => {
  const erros = await abrir(page, 'banco');
  const banco = abaVisivel(page);
  const [download] = await Promise.all([page.waitForEvent('download'), banco.getByRole('button', { name: /Baixar planilha para preencher/ }).click()]);
  expect(download.suggestedFilename()).toBe('apresentacoes-formulario.xlsx');
  const caminho = await download.path();
  const abas = await lerXlsx(new Uint8Array(readFileSync(caminho)));
  const linhas = abas.find((a) => a.nome === 'Apresentações')!.linhas.filter((l) => l[1]);
  expect(linhas).toHaveLength(92);
  expect(linhas.map((l) => l[0])).toContain('A50');

  // a mesma planilha (em branco) entra na importação: todas as linhas "ainda não preenchidas"
  await banco.locator('input[type=file][accept^=".xlsx"]').setInputFiles(caminho);
  await expect(banco.getByText('90 linha(s) ainda não preenchida(s) não aparecem.')).toBeVisible();
  expect(erros).toEqual([]);
});

test('B7: versão do banco, histórico e mudanças deste computador até o relatório', async ({ page }) => {
  const erros = await abrir(page, 'banco');
  const banco = abaVisivel(page);
  const versao = banco.getByRole('region', { name: 'Versão do banco' });
  await expect(versao).toContainText(/Versão \d+ de \d\d\/\d\d\/\d{4}/);
  await expect(versao).toContainText('Este computador usa exatamente o banco do projeto');
  await versao.getByText(/Histórico de mudanças/).click();
  await versao.locator('summary', { hasText: /B8: entram as 49 medicações/ }).click();
  await expect(versao).toContainText('Midazolam');

  // conferir uma apresentação neste computador: o banco passa a ter "mudanças deste computador"
  await banco.getByLabel('Buscar medicação').fill('naloxona');
  await banco.locator('.med-banco summary', { hasText: 'Naloxona' }).click();
  const item = banco.locator('.med-banco li', { hasText: 'Ampola 0,4 mg/mL' });
  await item.getByRole('button', { name: 'Conferir' }).click();
  const form = banco.getByRole('group', { name: 'Conferir item' });
  await form.getByPlaceholder('Ex.: 345 ou tabela 2').fill('1 (teste)');
  await form.getByRole('button', { name: /marcar CONFERIDO/ }).click();
  await expect(versao).toContainText('mudanças que ainda não entraram no projeto');
  await versao.getByText(/Ver as mudanças deste computador \(1\)/).click();
  await expect(versao).toContainText('Apresentação alterada');

  // o relatório do caso diz com qual banco o aluno treinou
  await irPara(page, /Prescrever/);
  await page.getByRole('button', { name: /Relatório/ }).click();
  const relatorio = page.getByRole('dialog', { name: 'Relatório do caso' });
  await expect(relatorio).toContainText(/Banco de medicações: versão \d+ \+ mudanças deste computador \(código [0-9a-f]{8}\)/);
  expect(erros).toEqual([]);
});
