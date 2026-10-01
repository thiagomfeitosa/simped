/* SimPed — service worker (B18).
   Gerado no "vite build" a partir de src/pwa/sw-modelo.js (não editar o dist/sw.js).
   Guarda o app inteiro no aparelho na primeira visita: depois ele abre sem internet.
   Versão nova do site = lista nova de arquivos = este arquivo muda = o navegador baixa tudo de novo
   e o app mostra "Nova versão disponível" (só troca quando o usuário clicar). */

const VERSAO = '__VERSAO__';
const ARQUIVOS = [] /* __ARQUIVOS__ */;
const CACHE = `simped-${VERSAO}`;
const INDICE = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', (evento) => {
  // cache: 'reload' = baixa do servidor, sem usar cópia velha do navegador
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARQUIVOS.map((a) => new Request(a, { cache: 'reload' })))));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      for (const nome of await caches.keys()) {
        if (nome.startsWith('simped-') && nome !== CACHE) await caches.delete(nome);
      }
      await self.clients.claim();
    })(),
  );
});

// o app pede para trocar de versão quando o usuário clica em "Atualizar"
self.addEventListener('message', (evento) => {
  if (evento.data === 'atualizar') self.skipWaiting();
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return;
  // abrir o app (qualquer endereço, ex.: ?papel=professor#professor): sempre a página guardada
  if (pedido.mode === 'navigate') {
    evento.respondWith(caches.match(INDICE, { ignoreVary: true }).then((guardada) => guardada || fetch(pedido)));
    return;
  }
  // ignoreVary: o servidor pode mandar "Vary: Origin"; os scripts do app pedem com Origin e a cópia foi guardada sem
  evento.respondWith(caches.match(pedido, { ignoreSearch: true, ignoreVary: true }).then((guardado) => guardado || fetch(pedido)));
});
