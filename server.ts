import 'dotenv/config';

if (process.argv.includes('--production') || process.argv.includes('--prod')) {
  process.env.NODE_ENV = 'production';
}

import express from 'express';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'node:fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { ALLOWED_SOLUSOL_ROUTES, ALLOWED_AGENT_ROUTES } from './src/server/index.js';
import { rateLimiter } from './src/server/middleware/rate-limiter.js';
import { concurrencyGuard } from './src/server/middleware/concurrency-guard.js';
import { createRequireProxyAuth } from './src/server/middleware/proxy-auth.js';
import { traceContext } from './src/server/middleware/trace-context.js';
import { sendError, errorHandler } from './src/server/middleware/error-handler.js';
import { SoluSolService } from './src/server/services/solusol.service.js';
import { SantiagoService } from './src/server/services/santiago.service.js';
import { createTelemetryController } from './src/server/controllers/telemetry.controller.js';
import { createGenerationController, SUPPORTED_STACKS } from './src/server/controllers/generation.controller.js';
import { createInterviewController } from './src/server/controllers/interview.controller.js';

export { SUPPORTED_STACKS, concurrencyGuard };

export type SupportedStack = typeof SUPPORTED_STACKS[number];

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(traceContext);

const INTERNAL_API_SECRET = process.env.APP_INTERNAL_SECRET || '';
const APP_INSTANCE_ID = process.env.APP_INSTANCE_ID || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

const SOLUSOL_BASE_URL = (process.env.SOLUSOL_API_URL || 'https://api.solusol.net').replace(/\/+$/, '');
const SOLUSOL_API_KEY = process.env.SOLUSOL_API_KEY || '';
const SANTIAGO_AGENT_URL = (process.env.SANTIAGO_AGENT_URL || 'https://santiago.solusol.net').replace(/\/+$/, '');
const SANTIAGO_API_KEY = process.env.SANTIAGO_API_KEY || '';

const solusolService = new SoluSolService({ baseUrl: SOLUSOL_BASE_URL, apiKey: SOLUSOL_API_KEY });
const santiagoService = new SantiagoService({ baseUrl: SANTIAGO_AGENT_URL, apiKey: SANTIAGO_API_KEY });

const MAX_REFERENCE_FILES = 4;
const MAX_REFERENCE_FILE_BYTES = 6 * 1024 * 1024;
const MAX_REFERENCE_TOTAL_BYTES = 12 * 1024 * 1024;
const ALLOWED_REFERENCE_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm',
]);
const referenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_REFERENCE_FILES, fileSize: MAX_REFERENCE_FILE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_REFERENCE_MIME_TYPES.has(file.mimetype)) {
      callback(new Error('Unsupported reference media type.'));
      return;
    }
    callback(null, true);
  },
}).array('media', MAX_REFERENCE_FILES);

const parseReferenceMedia: express.RequestHandler = (req, res, next) => {
  referenceUpload(req, res, (error) => {
    const traceId = (req as any).traceId;
    if (error) {
      const tooLarge = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE';
      return sendError(
        res,
        tooLarge ? 413 : 400,
        tooLarge ? 'ERR_REFERENCE_TOO_LARGE' : 'ERR_INVALID_REFERENCE_MEDIA',
        tooLarge
          ? 'Cada referencia debe pesar 6 MB o menos.'
          : 'Usa hasta 4 imágenes JPEG, PNG, WebP o videos MP4/WebM.',
        traceId
      );
    }

    const files = Array.isArray((req as any).files) ? (req as any).files as Express.Multer.File[] : [];
    void (async () => {
      const totalBytes = files.reduce((total, file) => total + file.size, 0);
      if (totalBytes > MAX_REFERENCE_TOTAL_BYTES) {
        return sendError(res, 413, 'ERR_REFERENCE_TOTAL_TOO_LARGE', 'El total de referencias no puede superar 12 MB.', traceId);
      }

      for (const file of files) {
        const detected = await fileTypeFromBuffer(file.buffer);
        if (!detected || detected.mime !== file.mimetype || !ALLOWED_REFERENCE_MIME_TYPES.has(detected.mime)) {
          return sendError(res, 400, 'ERR_INVALID_REFERENCE_SIGNATURE', 'El contenido del archivo no coincide con una imagen o video permitido.', traceId);
        }
      }
      next();
    })().catch(() => sendError(res, 400, 'ERR_INVALID_REFERENCE_MEDIA', 'No se pudo validar una de las referencias.', traceId));
  });
};

// Configuración de CORS
const defaultAllowedOrigins = IS_PRODUCTION
  ? ['https://apps.solusol.net']
  : [
      'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000',
      `http://localhost:${Number(process.env.PORT) || 3000}`,
      `http://127.0.0.1:${Number(process.env.PORT) || 3000}`,
    ];
const configuredOrigin = process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim()) : [];
const allowedOrigins = new Set([...defaultAllowedOrigins, ...configuredOrigin]);
const requireProxyAuth = createRequireProxyAuth(INTERNAL_API_SECRET, allowedOrigins);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Health Check
app.get('/health', (req, res) => {
  const traceId = (req as any).traceId || randomUUID();
  res.json({ status: 'ok', service: 'appcraft-engine', version: '1.0.0', instanceId: APP_INSTANCE_ID, traceId, timestamp: new Date().toISOString() });
});

// Proxy transparente hacia api.solusol.net
app.all('/api/solusol/*', rateLimiter, requireProxyAuth, async (req, res) => {
  const traceId = (req as any).traceId;
  const targetPath = req.path.replace(/^\/api\/solusol\/?/, '').replace(/\/+$/, '');

  const allowedMethods = ALLOWED_SOLUSOL_ROUTES.get(targetPath);
  if (!allowedMethods) {
    return sendError(res, 403, 'ERR_FORBIDDEN_PROXY_ROUTE', `Ruta upstream no permitida en SoluSol: /${targetPath}`, traceId);
  }
  if (!allowedMethods.has(req.method)) {
    return sendError(res, 405, 'ERR_METHOD_NOT_ALLOWED', `Metodo ${req.method} no permitido en /${targetPath}`, traceId);
  }

  const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const targetUrl = `${SOLUSOL_BASE_URL}/${targetPath}${queryString}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'X-Trace-Id': traceId,
        ...(SOLUSOL_API_KEY ? { Authorization: `Bearer ${SOLUSOL_API_KEY}` } : {}),
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      signal: AbortSignal.timeout(10000),
    });

    const contentType = upstreamRes.headers.get('content-type') || 'application/json';
    res.status(upstreamRes.status).contentType(contentType);
    const data = await upstreamRes.text();
    res.send(data);
  } catch (error: any) {
    return sendError(res, 502, 'ERR_UPSTREAM_UNREACHABLE', 'Upstream SoluSol service unreachable.', traceId);
  }
});

// Proxy transparente hacia Santiago Autonomous Agent
app.all('/api/agent/*', rateLimiter, requireProxyAuth, async (req, res) => {
  const traceId = (req as any).traceId;
  const targetPath = req.path.replace(/^\/api\/agent\/?/, '').replace(/\/+$/, '');

  const allowedMethods = ALLOWED_AGENT_ROUTES.get(targetPath);
  if (!allowedMethods) {
    return sendError(res, 403, 'ERR_FORBIDDEN_PROXY_ROUTE', `Ruta upstream no permitida en Santiago Agent: /${targetPath}`, traceId);
  }
  if (!allowedMethods.has(req.method)) {
    return sendError(res, 405, 'ERR_METHOD_NOT_ALLOWED', `Metodo ${req.method} no permitido en /${targetPath}`, traceId);
  }

  const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const targetUrl = `${SANTIAGO_AGENT_URL}/${targetPath}${queryString}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'X-Trace-Id': traceId,
        ...(SANTIAGO_API_KEY ? { Authorization: `Bearer ${SANTIAGO_API_KEY}` } : {}),
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      signal: AbortSignal.timeout(15000),
    });

    const contentType = upstreamRes.headers.get('content-type') || 'application/json';
    res.status(upstreamRes.status).contentType(contentType);
    const data = await upstreamRes.text();
    res.send(data);
  } catch (error: any) {
    return sendError(res, 502, 'ERR_SANTIAGO_UNREACHABLE', 'Upstream Santiago agent unreachable.', traceId);
  }
});

// Controladores desacoplados de negocio y telemetría
const handleTelemetry = createTelemetryController(SOLUSOL_BASE_URL, SOLUSOL_API_KEY);
const { handleGenerateLayout, handleExportCode, handleGenerateProject } =
  createGenerationController(solusolService, santiagoService);
const handleInterview = createInterviewController(santiagoService);

app.get('/api/data', rateLimiter, requireProxyAuth, handleTelemetry);
app.post('/api/generate-project', rateLimiter, concurrencyGuard, requireProxyAuth, parseReferenceMedia, handleGenerateProject);
app.post('/api/interview', rateLimiter, concurrencyGuard, requireProxyAuth, handleInterview);
app.post('/export', rateLimiter, concurrencyGuard, requireProxyAuth, handleExportCode);
app.post('/api/export-code', rateLimiter, concurrencyGuard, requireProxyAuth, handleExportCode);
app.post('/generate', rateLimiter, concurrencyGuard, requireProxyAuth, parseReferenceMedia, handleGenerateLayout);
app.post('/api/generate-dashboard', rateLimiter, concurrencyGuard, requireProxyAuth, parseReferenceMedia, handleGenerateLayout);

// Middleware global de captura de excepciones (Zero Trust Sanitization)
app.use(errorHandler);

// Configuración de Vite o Estáticos según el entorno
async function startServer() {
  if (!IS_PRODUCTION) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        watch: {
          usePolling: true,
          interval: 100,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const baseDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
    const candidatePaths = [
      path.resolve(baseDir, 'dist'),
      path.resolve(baseDir, '..', 'dist'),
      path.resolve(process.cwd(), 'dist'),
    ];
    const clientDist = candidatePaths.find((p) => fs.existsSync(path.join(p, 'index.html')));
    if (!clientDist) {
      throw new Error('[AppCraft Engine] Frontend bundle not found: missing dist/index.html');
    }
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  const HOST = process.env.HOST || '127.0.0.1';
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, HOST, () => {
    console.log(`[AppCraft Engine] Microservice active on http://${HOST}:${PORT}`);
  });
}

const isTestExecution = process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('test'));
if (!isTestExecution) {
  startServer().catch((err) => {
    console.error('[AppCraft Engine] Fatal startup error:', err);
    process.exit(1);
  });
}
