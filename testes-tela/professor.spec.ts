import { expect, test } from '@playwright/test';
import { abaVisivel, abrir, irPara } from './ajuda';

test('B14: professor muda sinais, dispara complicação, manda mensagem e vê a folha', async ({ page }) => {
  const erros = await abrir(page, 'prescrever');
  // o aluno escreve na folha
  await abaVisivel(page).locator('.secao').filter({ hasText: '3. Dieta' }).getByRole('button', { name: '+ item em texto' }).click();
  await abaVisivel(page).getByLabel('Item 1 — Dieta').fill('Jejum por ora');

  await irPara(page, /Professor/);
  const prof = abaVisivel(page);
  await expect(prof.getByLabel('Folha do aluno ao vivo')).toContainText('Jejum por ora');

  // altera FC e ritmo
  const sinais = prof.getByRole('region', { name: 'Alterar sinais' });
  await sinais.getByLabel('FC (bpm)').fill('45');
  await sinais.getByLabel('Ritmo').selectOption('bav-total');
  await sinais.getByRole('button', { name: 'Aplicar agora' }).click();
  await expect(prof.getByLabel('Ritmo no monitor')).toContainText('Bloqueio AV total');

  // complicação + mensagem sugerida
  await prof.getByRole('button', { name: /Convulsão/ }).click();
  await prof.getByLabel('Texto da mensagem').fill('A mãe chegou com a caderneta de vacinas.');
  await prof.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(prof.getByLabel('Últimas ações')).toContainText('Professor disparou complicação: Convulsão');

  // o aluno vê tudo no Prescrever
  await irPara(page, /Prescrever/);
  const aluno = abaVisivel(page);
  await expect(aluno.getByLabel('Mensagem do professor')).toContainText('caderneta de vacinas');
  await expect(aluno.locator('.linha-do-tempo')).toContainText('Complicação: Convulsão');
  await expect(aluno.getByLabel('Exame à beira do leito')).toContainText('Gasping');
  expect(erros).toEqual([]);
});

test('B15: professor e aluno em duas janelas', async ({ page, context }) => {
  const erros = await abrir(page, 'prescrever');
  await abaVisivel(page).getByLabel('Caso clínico').selectOption('caso11-tsv');

  const janelaProf = await context.newPage();
  await janelaProf.goto('./?papel=professor#professor');
  const prof = janelaProf.locator('#raiz > div:not([hidden])');
  await expect(janelaProf.getByText('Janela do professor')).toBeVisible();
  await expect(prof.getByText('Conectado à janela do aluno')).toBeVisible();
  await expect(prof.getByLabel('Paciente agora')).toContainText('Taquicardia supraventricular');

  // aluno escreve: aparece na janela do professor
  await abaVisivel(page).locator('.secao').filter({ hasText: '8. Orientações' }).getByRole('button', { name: '+ item em texto' }).click();
  await abaVisivel(page).getByLabel('Item 1 — Orientações / cuidados').fill('Monitorização contínua');
  await expect(prof.getByLabel('Folha do aluno ao vivo')).toContainText('Monitorização contínua');

  // professor dispara PCR: aparece na janela do aluno
  await prof.getByRole('button', { name: /PCR em FV/ }).click();
  await expect(abaVisivel(page).getByLabel('Ritmo no monitor')).toContainText('Fibrilação ventricular');
  await expect(abaVisivel(page).locator('.linha-do-tempo')).toContainText('Complicação: PCR em FV');

  // professor manda mensagem
  await prof.getByLabel('Texto da mensagem').fill('Chame ajuda e comece a RCP.');
  await prof.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(abaVisivel(page).getByLabel('Mensagem do professor')).toContainText('Chame ajuda');
  expect(erros).toEqual([]);
});
