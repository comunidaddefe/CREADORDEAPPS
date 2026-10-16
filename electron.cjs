const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');
const { fork, spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

// Desactivar aceleración por hardware para evitar fallos de GPU en Windows
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');

let serverProcess = null;
const SERVER_PORT = process.env.PORT || 3000;
const HEALTH_URL = `http://127.0.0.1:${SERVER_PORT}/health`;
const INTERNAL_SESSION_KEY = crypto.randomUUID();

function waitForServer(url, timeoutMs = 20000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      });

      req.on('error', () => {
        retry();
      });

      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Servidor backend no respondio en el tiempo limite (${timeoutMs}ms)`));
      } else {
        setTimeout(check, 300);
      }
    };

    check();
  });
}

function startBackendProcess() {
  const env = {
    ...process.env,
    PORT: String(SERVER_PORT),
    NODE_ENV: 'production',
    APP_INTERNAL_SECRET: INTERNAL_SESSION_KEY,
    ELECTRON_RUN_AS_NODE: '1',
  };

  const bundledServerJs = fs.existsSync(path.join(__dirname, 'server.cjs'))
    ? path.join(__dirname, 'server.cjs')
    : path.join(__dirname, 'dist-server', 'server.cjs');
  const typescriptServer = path.join(__dirname, 'server.ts');

  if (fs.existsSync(bundledServerJs)) {
    // En producción empaquetada: ejecutar con el propio runtime embebido de Electron
    serverProcess = fork(bundledServerJs, [], {
      env,
      stdio: 'ignore',
      execPath: process.execPath,
    });
  } else {
    // En desarrollo: invocar tsx local o npx
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    serverProcess = spawn(npxCmd, ['tsx', typescriptServer], {
      env,
      stdio: 'ignore',
      detached: false,
    });
  }
}

function createWindow(targetUrl) {
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

  // Inyectar la clave interna ÚNICAMENTE si la petición proviene del webContents legítimo de la ventana principal
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const isTargetServer = details.url.startsWith(`http://127.0.0.1:${SERVER_PORT}`) || 
                           details.url.startsWith(`http://localhost:${SERVER_PORT}`);
    const isFromMainWindow = mainWindow && details.webContentsId === mainWindow.webContents.id;

    if (isTargetServer && isFromMainWindow) {
      details.requestHeaders['X-App-Internal-Key'] = INTERNAL_SESSION_KEY;
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  mainWindow.loadURL(targetUrl);

  // Abrir enlaces externos en el navegador predeterminado de Windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    createWindow(devUrl);
  } else {
    try {
      startBackendProcess();
      await waitForServer(HEALTH_URL);
      createWindow(`http://127.0.0.1:${SERVER_PORT}`);
    } catch (err) {
      console.error('Fallo critico al iniciar el backend local:', err);
      app.quit();
      return;
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(devUrl || `http://127.0.0.1:${SERVER_PORT}`);
    }
  });
});

function cleanupServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    serverProcess = null;
  }
}

app.on('before-quit', cleanupServer);

app.on('window-all-closed', () => {
  cleanupServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});