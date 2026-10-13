const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Desactivar aceleración por hardware para evitar fallos de GPU en Windows
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'AppCraft AI Builder - Windows Edition',
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const targetUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  mainWindow.loadURL(targetUrl);

  // Abrir enlaces externos en el navegador predeterminado de Windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});