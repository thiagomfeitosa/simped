/**
 * B18 — App instalável (PWA): registra o service worker (abre sem internet), guarda o pedido de
 * instalação do navegador (botão "📲 Instalar") e avisa quando há versão nova do site.
 *
 * Só funciona na versão de site (https:// ou localhost) gerada pelo "vite build". Não liga:
 * - no "npm run dev" (as telas mudam a cada salvamento; guardar cópia atrapalharia);
 * - no arquivo único SimPed.html e no Electron (abrem do próprio computador, já funcionam sem internet).
 */

import { useSyncExternalStore } from 'react';

/** Evento do Chrome/Edge/Android que permite mostrar o botão "Instalar" do próprio app. */
interface PedidoDeInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface EstadoPwa {
  /** O navegador deixou instalar pelo botão do app (Chrome, Edge, Android). */
  podeInstalar: boolean;
  /** Aberto como app instalado (sem a barra do navegador). */
  instalado: boolean;
  /** Guardado no aparelho para abrir sem internet? */
  semInternet: 'nao-se-aplica' | 'preparando' | 'pronto' | 'falhou';
  /** Há uma versão nova do site esperando o usuário clicar em "Atualizar". */
  novaVersao: boolean;
}

let estado: EstadoPwa = { podeInstalar: false, instalado: false, semInternet: 'nao-se-aplica', novaVersao: false };
let pedido: PedidoDeInstalacao | null = null;
let registro: ServiceWorkerRegistration | null = null;
let atualizando = false;
let iniciado = false;
const ouvintes = new Set<() => void>();

function mudar(parte: Partial<EstadoPwa>): void {
  estado = { ...estado, ...parte };
  ouvintes.forEach((f) => f());
}

export function abertoComoApp(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

/** Esta página pode usar service worker? (site gerado pelo build, aberto por http/https, com o manifesto do app) */
export function usaServiceWorker(): boolean {
  return (
    import.meta.env.PROD &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    /^https?:$/.test(window.location.protocol) &&
    document.querySelector('link[rel="manifest"]') !== null
  );
}

function acompanhar(sw: ServiceWorker | null): void {
  sw?.addEventListener('statechange', () => {
    if (sw.state !== 'installed') return;
    // havia uma versão controlando a página: esta é nova e espera o "Atualizar"; senão, é a 1ª vez
    if (navigator.serviceWorker.controller) mudar({ novaVersao: true });
    else mudar({ semInternet: 'pronto' });
  });
}

async function registrar(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.register('./sw.js');
    registro = reg;
    if (reg.waiting && navigator.serviceWorker.controller) mudar({ novaVersao: true });
    mudar({ semInternet: reg.active ? 'pronto' : 'preparando' });
    acompanhar(reg.installing);
    reg.addEventListener('updatefound', () => acompanhar(reg.installing));
    // aberto por muito tempo (ex.: tablet da sala): procura versão nova de hora em hora
    window.setInterval(() => void reg.update().catch(() => {}), 60 * 60 * 1000);
  } catch {
    mudar({ semInternet: 'falhou' });
  }
}

/** Liga tudo (chamado uma vez, em src/main.tsx, antes de desenhar o app). */
export function iniciarPwa(): void {
  if (iniciado || typeof window === 'undefined') return;
  iniciado = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // o app mostra o próprio botão "Instalar"
    pedido = e as PedidoDeInstalacao;
    mudar({ podeInstalar: true });
  });
  window.addEventListener('appinstalled', () => {
    pedido = null;
    mudar({ podeInstalar: false, instalado: true });
  });
  mudar({ instalado: abertoComoApp() });
  if (!usaServiceWorker()) return;
  // troca de versão pedida pelo usuário: recarrega com a nova (na 1ª instalação não recarrega)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (atualizando) window.location.reload();
  });
  void registrar();
}

/** Abre a janela de instalação do navegador. Devolve true se o usuário aceitou. */
export async function instalar(): Promise<boolean> {
  if (!pedido) return false;
  const p = pedido;
  pedido = null;
  mudar({ podeInstalar: false });
  await p.prompt();
  const { outcome } = await p.userChoice;
  return outcome === 'accepted';
}

/** Troca para a versão nova (a página recarrega; o que está guardado no aparelho continua). */
export function atualizarAgora(): void {
  const esperando = registro?.waiting;
  if (!esperando) return;
  atualizando = true;
  esperando.postMessage('atualizar');
}

export type Aparelho = 'iphone-ipad' | 'mac-safari' | 'android' | 'computador';

export function aparelho(agente: string = navigator.userAgent, pontosDeToque: number = navigator.maxTouchPoints ?? 0): Aparelho {
  // iPad recente se apresenta como Mac, mas tem tela de toque
  if (/iPhone|iPad|iPod/.test(agente) || (/Macintosh/.test(agente) && pontosDeToque > 1)) return 'iphone-ipad';
  if (/Android/.test(agente)) return 'android';
  if (/Macintosh/.test(agente) && /Safari/.test(agente) && !/Chrome|Chromium|Edg|Firefox/.test(agente)) return 'mac-safari';
  return 'computador';
}

/** Como instalar em cada aparelho, quando o navegador não oferece o botão. */
export const COMO_INSTALAR: Record<Aparelho, string> = {
  'iphone-ipad': 'No Safari, toque em Compartilhar (quadrado com seta para cima) → “Adicionar à Tela de Início” → Adicionar.',
  'mac-safari': 'No Safari, menu Arquivo → “Adicionar ao Dock…” → Adicionar.',
  android: 'No Chrome, toque no menu ⋮ → “Instalar app” (ou “Adicionar à tela inicial”).',
  computador: 'No Chrome ou no Edge, clique no ícone de instalar no fim da barra de endereço (monitor com seta) → Instalar.',
};

function inscrever(f: () => void): () => void {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

/** Estado do app instalável para as telas (atualiza sozinho). */
export function usePwa(): EstadoPwa {
  return useSyncExternalStore(inscrever, () => estado);
}
