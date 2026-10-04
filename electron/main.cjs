// SimPed como programa de computador (Mac/Windows/Linux), com Electron.
// Abre o arquivo único dist-arquivo/SimPed.html (gerado por "npm run arquivo-unico") numa janela própria.
// Tudo funciona sem internet; os dados (configurações, casos, histórico) ficam no computador.

const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { fileURLToPath } = require('node:url');

const ARQUIVO = path.resolve(__dirname, '..', 'dist-arquivo', 'SimPed.html');
const PREFERENCIAS = { contextIsolation: true, sandbox: true, nodeIntegration: false };
/** Marcas que o próprio app põe no endereço ao abrir outra janela (e só estas, com estes valores). */
const MARCAS = { papel: 'professor', assistir: 'parada', janela: 'parada' };

/** Endereço do próprio SimPed (o mesmo arquivo, só com as marcas conhecidas)? */
function enderecoDoApp(endereco) {
  try {
    const u = new URL(endereco);
    if (u.protocol !== 'file:') return false;
    const caminho = path.resolve(fileURLToPath(u));
    const igual = process.platform === 'win32' ? caminho.toLowerCase() === ARQUIVO.toLowerCase() : caminho === ARQUIVO;
    return igual && [...u.searchParams].every(([chave, valor]) => MARCAS[chave] === valor);
  } catch {
    return false;
  }
}

/**
 * Quem abre janela (a principal e TODAS as outras): links para fora do app abrem no navegador do computador;
 * o próprio app abre como outra janela do SimPed: a "janela do professor" (?papel=professor),
 * o telão que só assiste à parada (?janela=parada&assistir=parada) e a tela de um colega na parada (?janela=parada).
 */
function abrirJanela({ url }) {
  if (enderecoDoApp(url)) {
    const professor = new URL(url).searchParams.get('papel') === 'professor';
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: professor ? 1200 : 1280,
        height: professor ? 850 : 860,
        title: professor ? 'SimPed — professor' : 'SimPed — parada',
        autoHideMenuBar: true,
        webPreferences: PREFERENCIAS,
      },
    };
  }
  if (/^https?:/.test(url)) shell.openExternal(url);
  return { action: 'deny' };
}

// vale para as janelas filhas também (a do professor abre o telão; o telão abre links do catálogo de fontes)
app.on('web-contents-created', (_evento, conteudo) => conteudo.setWindowOpenHandler(abrirJanela));

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'SimPed',
    autoHideMenuBar: true,
    webPreferences: PREFERENCIAS,
  });
  janela.loadFile(ARQUIVO);
  return janela;
}

app.whenReady().then(() => {
  criarJanela();
  // no Mac, clicar no ícone do Dock reabre a janela
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
