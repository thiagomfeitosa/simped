// SimPed como programa de computador (Mac/Windows/Linux), com Electron.
// Abre o arquivo único dist-arquivo/SimPed.html (gerado por "npm run arquivo-unico") numa janela própria.
// Tudo funciona sem internet; os dados (configurações, casos, histórico) ficam no computador.

const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'SimPed',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  janela.loadFile(path.join(__dirname, '..', 'dist-arquivo', 'SimPed.html'));
  // links para fora do app abrem no navegador do computador;
  // a "janela do professor" (o próprio app com ?papel=professor) abre como outra janela do SimPed
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('file:') && url.includes('papel=professor')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1200,
          height: 850,
          title: 'SimPed — professor',
          autoHideMenuBar: true,
          webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
        },
      };
    }
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
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
