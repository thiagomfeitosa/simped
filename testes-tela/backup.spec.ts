import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { abaVisivel, abrir } from './ajuda';

test('B4: salvar backup, apagar tudo e restaurar', async ({ page }, info) => {
  const erros = await abrir(page, 'configuracoes');
  const aba = abaVisivel(page);
  const painel = aba.getByRole('region', { name: 'Backup e restauração' });

  // muda uma configuração (fica guardada neste computador)
  await aba.getByRole('radio', { name: /Prova/ }).check();
  await page.reload();
  await expect(painel.getByRole('list', { name: 'Guardado agora' })).toContainText('Configurações');

  const [download] = await Promise.all([page.waitForEvent('download'), painel.getByRole('button', { name: /Salvar backup/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/^simped-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const caminho = await download.path();
  const backup = JSON.parse(readFileSync(caminho, 'utf8'));
  expect(backup.formato).toBe('simped-backup');
  expect(backup.dados['simped.configuracoes']).toContain('"modo":"prova"');

  // "outro computador": tudo apagado
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(aba.getByRole('radio', { name: /Treino/ })).toBeChecked();

  // arquivo errado: avisa e não mexe em nada
  const errado = info.outputPath('nao-e-backup.json');
  writeFileSync(errado, '{"validacoes":[]}');
  await painel.getByLabel('Arquivo de backup').setInputFiles(errado);
  await expect(painel).toContainText('O arquivo não é um backup do SimPed.');

  await painel.getByLabel('Arquivo de backup').setInputFiles(caminho);
  const confirmar = painel.getByRole('group', { name: 'Restaurar backup' });
  await expect(confirmar).toContainText('Configurações');
  await confirmar.getByRole('button', { name: 'Restaurar agora' }).click();
  await expect(aba.getByRole('radio', { name: /Prova/ })).toBeChecked();
  expect(erros).toEqual([]);
});
