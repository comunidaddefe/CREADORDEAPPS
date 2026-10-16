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
const INTERNAL_SESSION_KEY = crypto.randomUUID();
const APP_INSTANCE_ID = crypto.randomUUID();
const HEALTH_URL = `http://127.0.0.1:${SERVER_PORT}/health`;

function waitForServer(url, expectedInstanceId, timeoutMs = 20000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const body = JSON.parse(rawData);
              if (body.service === 'appcraft-engine' && body.instanceId === expectedInstanceId) {
                return resolve();
              }
            } catch {}
          }
          retry();
        });
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
    APP_INSTANCE_ID: APP_INSTANCE_ID,
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

  serverProcess.on('error', (err) => {
    console.error('[Electron Container] Fallo en proceso servidor hijo:', err);
  });
  serverProcess.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[Electron Container] Servidor hijo termino anormalmente con codigo ${code}, signal: ${signal}`);
    }
  });
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

  // Content Security Policy restrictiva para mitigar riesgos de inyección XSS
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' http://127.0.0.1:* http://localhost:*; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://127.0.0.1:* http://localhost:* https://api.solusol.net https://santiago.solusol.net;"
        ]
      }
    });
  });

  // Validación estructural estricta de URL y filtrado de origen para inyección del secreto de sesión
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    try {
      const parsed = new URL(details.url);
      const isTargetServer = parsed.protocol === 'http:' &&
        (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') &&
        parsed.port === String(SERVER_PORT);
      const isFromMainWindow = mainWindow && details.webContentsId === mainWindow.webContents.id;
      const isAllowedResourceType = ['mainFrame', 'subFrame', 'xhr', 'fetch'].includes(details.resourceType);

      if (isTargetServer && isFromMainWindow && isAllowedResourceType) {
        details.requestHeaders['X-App-Internal-Key'] = INTERNAL_SESSION_KEY;
      }
    } catch {}
    callback({ requestHeaders: details.requestHeaders });
  });

  mainWindow.loadURL(targetUrl);

  // Restricción estricta de protocolos permitidos al abrir enlaces externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        shell.openExternal(url);
      }
    } catch {}
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
      await waitForServer(HEALTH_URL, APP_INSTANCE_ID);
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