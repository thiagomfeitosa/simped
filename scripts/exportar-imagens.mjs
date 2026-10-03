/**
 * Exporta TODAS as ilustrações do app como PNG, uma pasta por parte do app, com o nome de cada imagem
 * dizendo o que ela é (catálogo: src/imagens/catalogo.tsx). Gera também a lista (LISTA.md e lista.csv)
 * e as pastas vazias em imagens/minhas/ onde o usuário coloca as imagens dele com o mesmo nome.
 *
 * Uso: npm run exportar-imagens   (abre a galeria num navegador automático e fotografa cada desenho)
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const RAIZ = new URL('..', import.meta.url).pathname;
const SAIDA = join(RAIZ, 'imagens');
const ORIGINAIS = join(SAIDA, 'originais');
const MINHAS = join(SAIDA, 'minhas');

const NOME_PASTAS = {
  '01-recem-nascido': 'Aba 👶 Recém-nascido',
  '02-atencao-basica': 'Aba 🩺 Atenção básica',
  '03-passo-a-passo': 'Aba Passo a passo',
  '04-prescrever-beira-do-leito': 'Aba Prescrever (beira do leito)',
  '05-parada-animacao-rcp': 'Aba 🚨 Parada (animação da RCP)',
};

const servidor = await createServer({ root: RAIZ, server: { port: 5191, strictPort: true }, logLevel: 'error' });
await servidor.listen();
const executavel = process.env.SIMPED_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const navegador = await chromium.launch(executavel ? { executablePath: executavel } : {});
try {
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await pagina.goto('http://localhost:5191/galeria.html');
  await pagina.waitForSelector('[data-imagem]');
  await pagina.waitForTimeout(3000); // animações de entrada (balança, icterícia...) chegam ao fim
  const catalogo = await pagina.evaluate(() => window.__CATALOGO__);

  rmSync(ORIGINAIS, { recursive: true, force: true });
  for (const item of catalogo) {
    const arquivo = join(ORIGINAIS, `${item.id}.jpg`);
    mkdirSync(dirname(arquivo), { recursive: true });
    mkdirSync(join(MINHAS, dirname(item.id)), { recursive: true });
    const quadro = pagina.locator(`[data-imagem="${item.id}"] .galeria-desenho`);
    const caixa = await quadro.boundingBox();
    item.tamanho = caixa ? `${Math.round(caixa.width * 2)} × ${Math.round(caixa.height * 2)} px` : '';
    // JPEG: ~10× menor que PNG com as texturas de pele; é só a referência (a imagem do usuário pode ser .png, .jpg ou .webp)
    await quadro.screenshot({ path: arquivo, type: 'jpeg', quality: 85 });
  }
  // pastas vazias também vão para o git
  for (const pasta of new Set(catalogo.map((i) => dirname(i.id)))) {
    const guarda = join(MINHAS, pasta, '.gitkeep');
    if (!existsSync(guarda)) writeFileSync(guarda, '');
  }

  // LISTA.md
  const linhas = [
    '# Lista de imagens do SimPed',
    '',
    `Gerada por \`npm run exportar-imagens\` — ${catalogo.length} imagens. **Não edite à mão** (é refeita a cada exportação).`,
    '',
    'Como usar: veja a imagem atual em `originais/<pasta>/<nome>.jpg` e salve a sua com **o mesmo nome e a mesma pasta** dentro de `minhas/` (a sua pode ser .png, .jpg ou .webp). Detalhes em `LEIA-ME.md`.',
    '',
    'Legenda: 🎨 muda com o tom de pele (o original é na pele clara; ver LEIA-ME) · 🎞️ é animada no app.',
    '',
  ];
  let pastaAtual = '';
  for (const item of catalogo) {
    const [pasta] = item.id.split('/');
    const sub = dirname(item.id);
    if (pasta !== pastaAtual) {
      pastaAtual = pasta;
      linhas.push(`## ${pasta} — ${NOME_PASTAS[pasta] ?? ''}`, '');
    }
    const marcas = `${item.variaPelaPele ? ' 🎨' : ''}${item.animada ? ' 🎞️' : ''}`;
    linhas.push(`- **\`${sub.split('/').slice(1).join('/')}/${item.id.split('/').pop()}\`**${marcas} — ${item.titulo}  `);
    linhas.push(`  _Onde:_ ${item.onde}. _Tamanho do original:_ ${item.tamanho}.${item.nota ? `  \n  _Obs.:_ ${item.nota}` : ''}`);
  }
  writeFileSync(join(SAIDA, 'LISTA.md'), `${linhas.join('\n')}\n`);

  // lista.csv (abre no Excel/Numbers; separador ";")
  const csv = (s) => `"${String(s ?? '').replaceAll('"', '""')}"`;
  const tabela = [
    ['pasta', 'nome do arquivo (sem extensão)', 'o que é', 'onde aparece', 'muda com a pele', 'animada', 'tamanho do original', 'observação', 'já troquei?'].map(csv).join(';'),
    ...catalogo.map((i) => [dirname(i.id), i.id.split('/').pop(), i.titulo, i.onde, i.variaPelaPele ? 'sim' : '', i.animada ? 'sim' : '', i.tamanho, i.nota, ''].map(csv).join(';')),
  ];
  writeFileSync(join(SAIDA, 'lista.csv'), `﻿${tabela.join('\r\n')}\r\n`);
  console.log(`✔ ${catalogo.length} imagens em imagens/originais/ (lista em imagens/LISTA.md e imagens/lista.csv)`);
} finally {
  await navegador.close();
  await servidor.close();
}
