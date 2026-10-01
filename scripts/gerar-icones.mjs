// B18: desenha os ícones do SimPed instalado (celular, tablet, computador) a partir de um desenho só.
// Gera public/icones/*.svg e *.png. Uso (só quando o desenho mudar): node scripts/gerar-icones.mjs
// Usa o navegador dos testes de tela (Playwright) para transformar o desenho em PNG.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const pasta = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icones');
mkdirSync(pasta, { recursive: true });

/** Seringa branca com líquido laranja, na diagonal, sobre fundo azul do app. */
function desenho({ cantos, escala }) {
  const seringa = `
    <g transform="translate(256 256) scale(${escala}) rotate(-45) translate(-256 -256)">
      <rect x="92" y="200" width="22" height="112" rx="7" fill="#fff"/>
      <rect x="112" y="244" width="64" height="24" rx="4" fill="#fff"/>
      <rect x="166" y="190" width="18" height="132" rx="6" fill="#fff"/>
      <rect x="184" y="212" width="170" height="88" rx="12" fill="none" stroke="#fff" stroke-width="14"/>
      <rect x="250" y="223" width="97" height="66" rx="4" fill="#ef7d1a"/>
      <g stroke="#fff" stroke-width="7" stroke-linecap="round">
        <line x1="222" y1="212" x2="222" y2="240"/>
        <line x1="252" y1="212" x2="252" y2="232"/>
        <line x1="282" y1="212" x2="282" y2="240"/>
        <line x1="312" y1="212" x2="312" y2="232"/>
      </g>
      <rect x="354" y="238" width="30" height="36" rx="5" fill="#fff"/>
      <rect x="384" y="251" width="74" height="10" rx="5" fill="#fff"/>
    </g>
    <path transform="translate(256 256) scale(${escala}) translate(-256 -256)" d="M412 150 C428 174 436 188 436 200 a24 24 0 0 1 -48 0 C388 188 396 174 412 150 Z" fill="#ef7d1a" stroke="#fff" stroke-width="6"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f6fb5"/>
      <stop offset="1" stop-color="#0a4f82"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${cantos}" fill="url(#fundo)"/>${seringa}
</svg>
`;
}

const ICONES = [
  // ícone comum (cantos redondos, fundo transparente fora deles)
  { arquivo: 'simped.svg', svg: desenho({ cantos: 112, escala: 1 }) },
  { arquivo: 'icone-192.png', tamanho: 192, svg: desenho({ cantos: 42, escala: 1 }) },
  { arquivo: 'icone-512.png', tamanho: 512, svg: desenho({ cantos: 112, escala: 1 }) },
  // "maskable": o celular recorta o ícone no formato dele (círculo, gota...): fundo inteiro e desenho no meio
  { arquivo: 'icone-mascara-512.png', tamanho: 512, svg: desenho({ cantos: 0, escala: 0.72 }) },
  // iPhone/iPad: fundo inteiro (o próprio iOS arredonda os cantos)
  { arquivo: 'apple-touch-icon.png', tamanho: 180, svg: desenho({ cantos: 0, escala: 0.86 }) },
];

const chromiumLocal = process.env.SIMPED_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const navegador = await chromium.launch(chromiumLocal ? { executablePath: chromiumLocal } : {});
const pagina = await navegador.newPage();
for (const icone of ICONES) {
  if (!icone.tamanho) {
    writeFileSync(join(pasta, icone.arquivo), icone.svg);
    continue;
  }
  await pagina.setViewportSize({ width: icone.tamanho, height: icone.tamanho });
  const svg = icone.svg.replace('<svg ', `<svg width="${icone.tamanho}" height="${icone.tamanho}" `);
  await pagina.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await pagina.screenshot({ path: join(pasta, icone.arquivo), omitBackground: true });
}
await navegador.close();
console.log(`Ícones gerados em public/icones/ (${ICONES.length} arquivos).`);
