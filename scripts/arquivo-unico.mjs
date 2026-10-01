// Junta o app inteiro (HTML + JS + CSS) num único arquivo: dist-arquivo/SimPed.html.
// Esse arquivo abre com dois cliques em qualquer navegador, sem internet e sem instalar nada.
// Uso: npm run arquivo-unico   (roda o "vite build" antes)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');
let html = readFileSync(join(dist, 'index.html'), 'utf8');

// <script type="module" crossorigin src="./assets/x.js"></script> → script embutido
html = html.replace(/<script\b[^>]*\bsrc="\.\/([^"]+\.js)"[^>]*><\/script>/g, (_, caminho) => {
  // "</script" dentro do código fecharia a tag antes da hora
  const js = readFileSync(join(dist, caminho), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${js}</script>`;
});

// <link rel="stylesheet" crossorigin href="./assets/x.css"> → estilo embutido
html = html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="\.\/([^"]+\.css)"[^>]*>/g, (_, caminho) => {
  return `<style>${readFileSync(join(dist, caminho), 'utf8')}</style>`;
});

// B18: peças do app instalável (manifesto, ícones, service worker) só servem no site; aqui sairiam com erro
html = html.replace(/[ \t]*<!--[^>]*B18[^>]*-->\n?/g, '').replace(/[ \t]*<(link|meta)\b[^>]*\bdata-pwa\b[^>]*>\n?/g, '');

if (/\bdata-pwa\b|manifest\.webmanifest/.test(html)) {
  console.error('Sobrou alguma peça do app instalável (data-pwa) no arquivo único.');
  process.exit(1);
}

if (/\b(src|href)="\.\/assets\//.test(html)) {
  console.error('Sobrou algum arquivo em ./assets que não foi embutido. Confira o dist/index.html.');
  process.exit(1);
}

const saida = join(raiz, 'dist-arquivo');
mkdirSync(saida, { recursive: true });
writeFileSync(join(saida, 'SimPed.html'), html);
console.log(`Pronto: dist-arquivo/SimPed.html (${Math.round(html.length / 1024)} KB). Abra com dois cliques.`);
