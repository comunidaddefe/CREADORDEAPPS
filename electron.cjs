const { app, BrowserWindow, shell, session, dialog } = require('electron');
const path = require('path');
const { fork, spawn } = require('child_process');
const http = require('http');
const net = require('net');
const crypto = require('crypto');
const fs = require('fs');

// Desactivar aceleración por hardware para evitar fallos de GPU en Windows
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');

let serverProcess = null;
let serverPort = null;
let logStream = null;
let isIntentionalShutdown = false;
const INTERNAL_SESSION_KEY = crypto.randomUUID();
const APP_INSTANCE_ID = crypto.randomUUID();

const PROTECTED_API_ROUTES = new Set([
  '/api/data',
  '/api/generate-dashboard',
  '/api/export-code',
  '/api/generate-project',
  '/api/interview',
  '/generate',
  '/export',
]);

function findFreePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findFreePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    server.listen(startPort, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

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

function startBackendProcess(port) {
  const logDir = app.getPath('userData');
  const logFile = path.join(logDir, 'backend.log');
  logStream = fs.createWriteStream(logFile, { flags: 'a' });

  const env = {
    ...process.env,
    PORT: String(port),
    HOST: '127.0.0.1',
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
      stdio: ['ignore', 'pipe', 'pipe'],
      execPath: process.execPath,
    });
  } else {
    // En desarrollo: invocar tsx local o npx
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    serverProcess = spawn(npxCmd, ['tsx', typescriptServer], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });
  }

  if (serverProcess.stdout) serverProcess.stdout.pipe(logStream);
  if (serverProcess.stderr) serverProcess.stderr.pipe(logStream);

  serverProcess.on('error', (err) => {
    console.error('[Electron Container] Fallo en proceso servidor hijo:', err);
  });
  serverProcess.on('exit', (code, signal) => {
    if (!isIntentionalShutdown && code !== 0 && code !== null) {
      dialog.showErrorBox(
        'Fallo del Motor Backend',
        `El proceso de servicio local termino de forma inesperada (Codigo: ${code}, Signal: ${signal}). Revisa ${logFile} para diagnostico.`
      );
    }
  });
}

function createWindow(targetUrl, port) {
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

  // Content Security Policy estricta para mitigar riesgos de inyección XSS (sin unsafe-inline en scripts)
  const isDev = Boolean(process.env.ELECTRON_START_URL);
  const scriptCsp = isDev ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'";
  const connectCsp = isDev
    ? `connect-src 'self' http://127.0.0.1:${port} ws://127.0.0.1:* ws://localhost:*`
    : `connect-src 'self' http://127.0.0.1:${port}`;
  const prodCsp = [
    "default-src 'self'",
    scriptCsp,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    connectCsp,
    "object-src 'none'",
    "base-uri 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; ');

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [prodCsp]
      }
    });
  });

  // Validación estructural de URL, filtrado de tipo (solo xhr/fetch) y verificación de rutas autorizadas
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    try {
      const parsed = new URL(details.url);
      const isTargetServer = parsed.protocol === 'http:' &&
        (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') &&
        parsed.port === String(port);
      const isFromMainWindow = mainWindow && details.webContentsId === mainWindow.webContents.id;
      const isAllowedResourceType = ['xhr', 'fetch'].includes(details.resourceType);
      const isProtectedPath = PROTECTED_API_ROUTES.has(parsed.pathname) ||
        parsed.pathname.startsWith('/api/solusol/') ||
        parsed.pathname.startsWith('/api/agent/');

      if (isTargetServer && isFromMainWindow && isAllowedResourceType && isProtectedPath) {
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
    serverPort = Number(process.env.PORT) || 3000;
    createWindow(devUrl, serverPort);
  } else {
    try {
      serverPort = await findFreePort(3000);
      startBackendProcess(serverPort);
      await waitForServer(`http://127.0.0.1:${serverPort}/health`, APP_INSTANCE_ID);
      createWindow(`http://127.0.0.1:${serverPort}`, serverPort);
    } catch (err) {
      console.error('Fallo critico al iniciar el backend local:', err);
      app.quit();
      return;
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(devUrl || `http://127.0.0.1:${serverPort}`, serverPort);
    }
  });
});

function cleanupServer() {
  isIntentionalShutdown = true;
  if (serverProcess && !serverProcess.killed) {
    const pid = serverProcess.pid;
    if (process.platform === 'win32' && pid) {
      try {
        spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
      } catch {
        serverProcess.kill();
      }
    } else {
      serverProcess.kill('SIGTERM');
    }
    serverProcess = null;
  }
  if (logStream) {
    try { logStream.end(); } catch {}
    logStream = null;
  }
}

app.on('before-quit', cleanupServer);

app.on('window-all-closed', () => {
  cleanupServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});