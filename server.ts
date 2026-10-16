import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'path';
import { randomUUID } from 'node:crypto';

export const SUPPORTED_STACKS = [
  'html', 'php', 'tsx', 'go', 'json',
  'javascript', 'typescript', 'html_css', 'vue', 'svelte',
  'csharp', 'rust', 'cpp', 'c', 'zig', 'nim',
  'java', 'kotlin', 'swift', 'dart',
  'python', 'ruby', 'perl', 'lua', 'bash', 'powershell',
  'elixir', 'erlang', 'scala', 'clojure', 'haskell', 'fsharp', 'ocaml',
  'r', 'julia', 'sql', 'yaml', 'solidity'
] as const;

export type SupportedStack = typeof SUPPORTED_STACKS[number];

const app = express();
app.use(express.json());

// Inyección y propagación de trazabilidad distribuida (Trace Context)
app.use((req, res, next) => {
  const incomingTraceId = req.header('X-Trace-Id');
  const traceId = typeof incomingTraceId === 'string' && incomingTraceId.trim() ? incomingTraceId.trim() : randomUUID();
  (req as any).traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
});

// Middleware CORS restringido
const defaultAllowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];
const configuredOrigin = process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim()) : [];
const allowedOrigins = new Set([...defaultAllowedOrigins, ...configuredOrigin]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  } else if (!origin) {
    // Peticiones same-origin o herramientas directas: no inyectar cabeceras CORS innecesarias
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const INTERNAL_API_SECRET = process.env.APP_INTERNAL_SECRET || '';

/**
 * Middleware de autorización real para rutas sensibles y proxies (Zero Trust).
 * Fail-closed: si no hay secreto configurado o no coincide la clave interna, se bloquea la solicitud.
 */
const requireProxyAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const traceId = (req as any).traceId;
  const providedAuth = req.header('X-App-Internal-Key') || req.header('Authorization')?.replace(/^Bearer\s+/i, '');

  if (!INTERNAL_API_SECRET || !providedAuth || providedAuth !== INTERNAL_API_SECRET) {
    return sendError(res, 403, 'ERR_UNAUTHORIZED_PROXY_ACCESS', 'Acceso no autorizado al servicio proxy. Requiere clave de sesion valida.', traceId);
  }
  next();
};

const SOLUSOL_BASE_URL = (process.env.SOLUSOL_API_URL || 'https://api.solusol.net').replace(/\/+$/, '');
const SOLUSOL_API_KEY = process.env.SOLUSOL_API_KEY || '';
const SANTIAGO_AGENT_URL = (process.env.SANTIAGO_AGENT_URL || 'https://santiago.solusol.net').replace(/\/+$/, '');
const SANTIAGO_API_KEY = process.env.SANTIAGO_API_KEY || '';

interface StandardErrorResponse {
  error: string;
  code: string;
  traceId: string;
  timestamp: string;
}

const sendError = (
  res: express.Response,
  status: number,
  code: string,
  message: string,
  traceId?: string
) => {
  const payload: StandardErrorResponse = {
    error: message,
    code,
    traceId: traceId || randomUUID(),
    timestamp: new Date().toISOString(),
  };
  return res.status(status).json(payload);
};

// Health check para el balanceador / gateway
app.get('/health', (req, res) => {
  const traceId = (req as any).traceId || randomUUID();
  res.json({ status: 'ok', service: 'appcraft-engine', version: '1.0.0', traceId, timestamp: new Date().toISOString() });
});

// Telemetría verídica: origen explícito, unidades y estados LIVE, DEMO, NO_DATA, ERROR
app.get('/api/data', async (req, res) => {
  const traceId = (req as any).traceId;
  const rawSource = req.query.source;
  const rawType = req.query.type;

  if (!rawSource || !rawType || typeof rawSource !== 'string' || typeof rawType !== 'string') {
    return sendError(
      res,
      400,
      'ERR_INVALID_QUERY_PARAMS',
      'Query parameters "source" and "type" must be non-empty strings.',
      traceId
    );
  }

  const source = rawSource.trim();
  const type = rawType.trim();
  const updatedAt = new Date().toISOString();
  const uptime = process.uptime();
  const mem = process.memoryUsage();

  // Telemetría genuina de sistema Node.js
  const isSystemSource = source.startsWith('system.') || source.startsWith('runtime.') || source.startsWith('process.');

  // Integración Upstream con api.solusol.net
  if (source.startsWith('solusol.') || source.startsWith('solusol/')) {
    const subPath = source.replace(/^solusol[./]/, '');
    try {
      const solusolRes = await fetch(`${SOLUSOL_BASE_URL}/telemetry?source=${encodeURIComponent(subPath)}&type=${encodeURIComponent(type)}`, {
        signal: AbortSignal.timeout(5000),
        headers: {
          Accept: 'application/json',
          'X-Trace-Id': traceId,
          ...(SOLUSOL_API_KEY ? { Authorization: `Bearer ${SOLUSOL_API_KEY}` } : {}),
        },
      });

      if (solusolRes.ok) {
        const payload = await solusolRes.json();
        return res.json({
          origin: 'solusol.cloud',
          status: 'LIVE',
          updatedAt,
          ...payload,
        });
      }
    } catch (err: any) {
      return res.json({
        origin: 'solusol.cloud',
        status: 'ERROR',
        unit: 'none',
        updatedAt,
        description: `Error connecting to upstream api.solusol.net: ${err.message || 'Timeout'}`,
      });
    }
  }

  if (isSystemSource) {
    if (type === 'stat') {
      const isUptime = source.includes('uptime');
      return res.json({
        origin: 'system.node_runtime',
        status: 'LIVE',
        unit: isUptime ? 'seconds' : 'MB',
        value: isUptime ? `${Math.floor(uptime)}s` : `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        updatedAt,
        description: isUptime ? 'Node.js process uptime' : 'V8 heap memory usage',
      });
    }

    if (type === 'table') {
      return res.json({
        origin: 'system.node_runtime',
        status: 'LIVE',
        unit: 'process_attributes',
        rows: [
          { key: 'Node Version', value: process.version },
          { key: 'Process Architecture', value: process.arch },
          { key: 'Platform OS', value: process.platform },
          { key: 'PID', value: String(process.pid) },
          { key: 'V8 Heap Total', value: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB` },
          { key: 'Process Uptime', value: `${Math.floor(uptime)}s` },
        ],
        updatedAt,
        description: 'Authentic Node.js process runtime properties',
      });
    }
  }

  // Fuentes no conectadas: declaradas explícitamente como DEMO o NO_DATA sin inventar métricas
  if (type === 'stat') {
    return res.json({
      origin: 'demo.mock_provider',
      status: 'DEMO',
      unit: 'USD',
      value: '$0.00',
      updatedAt,
      description: `No active collector connected for source: "${source}".`,
    });
  }

  if (type === 'bar_chart') {
    return res.json({
      origin: 'demo.mock_provider',
      status: 'DEMO',
      unit: 'ratio_index',
      series: [],
      updatedAt,
      description: `Metric connector inactive for source: "${source}".`,
    });
  }

  if (type === 'line_chart') {
    return res.json({
      origin: 'demo.mock_provider',
      status: 'NO_DATA',
      unit: 'datapoints',
      points: [],
      updatedAt,
      description: `No active timeseries stream for source: "${source}".`,
    });
  }

  if (type === 'table') {
    return res.json({
      origin: 'demo.mock_provider',
      status: 'NO_DATA',
      unit: 'tabular_records',
      rows: [],
      updatedAt,
      description: `No data records available for table: "${source}".`,
    });
  }

  return res.json({
    origin: 'demo.mock_provider',
    status: 'NO_DATA',
    unit: 'event_stream',
    items: [],
    updatedAt,
    description: `No events in queue for feed: "${source}".`,
  });
});

// Proxy transparente hacia api.solusol.net
app.all('/api/solusol/*', requireProxyAuth, async (req, res) => {
  const traceId = (req as any).traceId;
  const targetPath = req.path.replace(/^\/api\/solusol\/?/, '');
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

// Proxy transparente hacia santiago.solusol.net (Santiago Autonomous Agent)
app.all('/api/agent/*', requireProxyAuth, async (req, res) => {
  const traceId = (req as any).traceId;
  const targetPath = req.path.replace(/^\/api\/agent\/?/, '');
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

/**
 * Extractor determinista por balanceo de caracteres delimitadores.
 * Resuelve de raíz fallos cuando el LLM emite texto o markdown antes/después del payload.
 */
export const extractBalancedJson = (
  raw: string,
  openChar: '{' | '[' | '(' = '{',
  closeChar: '}' | ']' | ')' = '}'
): string => {
  const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const startIndex = cleaned.indexOf(openChar);
  if (startIndex === -1) return cleaned;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) {
        return cleaned.slice(startIndex, i + 1);
      }
    }
  }

  if (depth !== 0) {
    throw new SyntaxError(`'${openChar}' was never closed`);
  }

  return cleaned.slice(startIndex);
};

export const extractCode = (text: string): string => {
  const codeBlockMatch = text.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)\s*```/);
  return codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
};

// Generación de layout canónico (disponible en /generate y /api/generate-dashboard)
const handleGenerateLayout = async (req: express.Request, res: express.Response) => {
  const traceId = (req as any).traceId;
  const { prompt, stack = 'typescript', provider = 'solusol', model = 'llama3.2' } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return sendError(res, 400, 'ERR_PROMPT_EMPTY', 'Field "prompt" is required and must be a non-empty string.', traceId);
  }

  if (!SUPPORTED_STACKS.includes(stack as any)) {
    return sendError(res, 400, 'ERR_UNSUPPORTED_STACK', `Unsupported stack "${stack}". Supported stacks: ${SUPPORTED_STACKS.join(', ')}`, traceId);
  }
  
  const systemInstruction = `You are an expert dashboard architect specializing in multi-stack applications (${stack}).
  Return a clean JSON array representing the dashboard layout components based on user requirements.
  Every object in the array must follow this schema:
  {
    "id": "string (uuid-like or slug)",
    "type": "stat" | "bar_chart" | "line_chart" | "table" | "list",
    "gridPosition": {
      "colSpan": 1 to 12
    },
    "props": {
      "title": "string",
      "data_source": "string",
      "value": "string (optional for stat)"
    }
  }`;

  if (provider === 'ollama') {
    let data: any;
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        signal: AbortSignal.timeout(60000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          system: systemInstruction,
          prompt: `Create a dashboard layout array for: "${prompt}". Return ONLY valid JSON array.`,
          stream: false,
          format: 'json',
        }),
      });

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama error: ${ollamaResponse.statusText}`);
      }

      data = await ollamaResponse.json();
    } catch (error: any) {
      return sendError(res, 503, 'ERR_OLLAMA_OFFLINE', 'Ollama is unreachable. Ensure Ollama is running on http://localhost:11434.', traceId);
    }
    try {
      const rawText = extractBalancedJson(data.response || '[]', '[', ']');
      const dashboardLayout = JSON.parse(rawText);
      if (!Array.isArray(dashboardLayout)) {
        return sendError(res, 502, 'ERR_MALFORMED_LLM_OUTPUT', 'LLM did not produce a valid layout array.', traceId);
      }
      const sanitized = dashboardLayout.map((item: any, index: number) => ({
        id: String(item.id || `widget_${index}`),
        type: ['stat', 'bar_chart', 'line_chart', 'table', 'list'].includes(item.type) ? item.type : 'stat',
        gridPosition: {
          colSpan: Math.max(1, Math.min(12, Number(item.gridPosition?.colSpan) || 4)),
        },
        props: {
          title: String(item.props?.title || 'Metric'),
          data_source: String(item.props?.data_source || 'system.node_uptime'),
          value: item.props?.value ? String(item.props.value) : undefined,
        },
      }));
      return res.json(sanitized);
    } catch (error: any) {
      return sendError(res, 502, 'ERR_MALFORMED_LLM_OUTPUT', `Malformed LLM output: ${error.message}`, traceId);
    }
  }

  // Motor de IA Cloud: api.solusol.net
  try {
    const upstreamRes = await fetch(`${SOLUSOL_BASE_URL}/api/generate-dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-Id': traceId,
        ...(SOLUSOL_API_KEY ? { Authorization: `Bearer ${SOLUSOL_API_KEY}` } : {}),
      },
      body: JSON.stringify({ prompt, stack, systemInstruction }),
      signal: AbortSignal.timeout(30000),
    });

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      throw new Error(`api.solusol.net returned ${upstreamRes.status}: ${errorText}`);
    }

    const data = await upstreamRes.json();
    const dashboardLayout = Array.isArray(data) ? data : data.layout;
    if (!Array.isArray(dashboardLayout)) {
      return sendError(res, 502, 'ERR_SCHEMA_VALIDATION_FAILED', 'SoluSol API did not return a valid layout array.', traceId);
    }
    const sanitized = dashboardLayout.map((item: any, index: number) => ({
      id: String(item.id || `widget_${index}`),
      type: ['stat', 'bar_chart', 'line_chart', 'table', 'list'].includes(item.type) ? item.type : 'stat',
      gridPosition: {
        colSpan: Math.max(1, Math.min(12, Number(item.gridPosition?.colSpan) || 4)),
      },
      props: {
        title: String(item.props?.title || 'Metric'),
        data_source: String(item.props?.data_source || 'system.node_uptime'),
        value: item.props?.value ? String(item.props.value) : undefined,
      },
    }));
    return res.json(sanitized);
  } catch (error: any) {
    console.error('Error generating layout with SoluSol:', error);
    return sendError(res, 502, 'ERR_UPSTREAM_UNREACHABLE', 'Failed to generate dashboard layout via SoluSol API.', traceId);
  }
};

app.post('/generate', handleGenerateLayout);
app.post('/api/generate-dashboard', handleGenerateLayout);

// Síntesis a código nativo políglota (disponible en /export y /api/export-code)
const handleExportCode = async (req: express.Request, res: express.Response) => {
  const traceId = (req as any).traceId;
  const { layout, stack = 'typescript', provider = 'solusol', model = 'llama3.2' } = req.body || {};

  if (!SUPPORTED_STACKS.includes(stack as any)) {
    return sendError(res, 400, 'ERR_UNSUPPORTED_STACK', `Invalid stack "${stack}". Allowed stacks: ${SUPPORTED_STACKS.join(', ')}`, traceId);
  }

  if (!layout || !Array.isArray(layout) || layout.length === 0) {
    return sendError(res, 400, 'ERR_SCHEMA_VALIDATION_FAILED', 'Field "layout" must be a non-empty array of widgets.', traceId);
  }

  const VALID_COMPONENT_TYPES = ['stat', 'bar_chart', 'line_chart', 'table', 'list'];
  const isInvalidWidget = layout.some(
    (w: any) =>
      !w ||
      typeof w.id !== 'string' ||
      !VALID_COMPONENT_TYPES.includes(w.type) ||
      !w.props ||
      typeof w.props.title !== 'string' ||
      typeof w.props.data_source !== 'string'
  );
  if (isInvalidWidget) {
    return sendError(res, 400, 'ERR_SCHEMA_VALIDATION_FAILED', 'Each widget in layout must contain valid "id", "type", and "props".', traceId);
  }

  const systemInstruction = `You are a Principal Software Architect generating native, production-grade code for the language/stack: "${stack}".
Follow the 'Zero AI Design' policy strictly:
1. Editorial Integrity: Clean, human-readable code. No fake comments, no placeholder illusions.
2. Native-Native Idioms: Use canonical paradigms for ${stack} (e.g. Pythonic for Python, Go channels/structs for Go, Rust ownership patterns for Rust, Flutter widgets for Dart).
3. Zero Broken Assets: Render fallback containers for dynamic data/charts and enforce tabular numbers on metrics.
Convert the provided dashboard layout JSON specification into a complete, idiomatic application file.`;

  if (provider === 'ollama') {
    let data: any;
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        signal: AbortSignal.timeout(60000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          system: systemInstruction,
          prompt: `Convert this dashboard layout specification into ${stack} code:\n${JSON.stringify(layout, null, 2)}`,
          stream: false,
        }),
      });

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama error: ${ollamaResponse.statusText}`);
      }

      data = await ollamaResponse.json();
    } catch (error) {
      return sendError(res, 503, 'ERR_OLLAMA_OFFLINE', 'Ollama is unreachable. Ensure Ollama is running on http://localhost:11434.', traceId);
    }
    const code = extractCode(data.response || '');
    return res.json({ code, stack, provider: 'ollama', model });
  }

  // Motor de Síntesis Cloud: api.solusol.net
  try {
    const upstreamRes = await fetch(`${SOLUSOL_BASE_URL}/api/export-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-Id': traceId,
        ...(SOLUSOL_API_KEY ? { Authorization: `Bearer ${SOLUSOL_API_KEY}` } : {}),
      },
      body: JSON.stringify({ layout, stack, systemInstruction }),
      signal: AbortSignal.timeout(45000),
    });

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      throw new Error(`api.solusol.net returned ${upstreamRes.status}: ${errorText}`);
    }

    const data = await upstreamRes.json();
    const code = typeof data === 'string' ? extractCode(data) : extractCode(data.code || '');
    return res.json({ code, stack, provider: 'solusol' });
  } catch (error: any) {
    console.error('Error synthesizing code with SoluSol:', error);
    return sendError(res, 502, 'ERR_UPSTREAM_UNREACHABLE', 'Failed to synthesize code for target stack via api.solusol.net', traceId);
  }
};

const handleGenerateProject = async (req: express.Request, res: express.Response) => {
  const traceId = (req as any).traceId;
  const { prompt, stack = 'csharp', provider = 'solusol', model = 'llama3.2' } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return sendError(res, 400, 'ERR_PROMPT_EMPTY', 'Field "prompt" is required and must be a non-empty string.', traceId);
  }

  if (!SUPPORTED_STACKS.includes(stack as any)) {
    return sendError(res, 400, 'ERR_UNSUPPORTED_STACK', `Invalid stack "${stack}". Allowed stacks: ${SUPPORTED_STACKS.join(', ')}`, traceId);
  }

  const systemInstruction = `You are a Principal Software Architect.
Generate a complete, production-grade, compilable multi-file project for the requested native or desktop application in stack: "${stack}".
Zero AI Design Policy:
1. No placeholder comments, no fake "// TODO". Write complete functional implementation.
2. Provide all essential files required to compile and run.
3. Provide the exact compilation/run terminal command.
Return ONLY a valid JSON object matching this schema:
{
  "appName": "string",
  "description": "string",
  "runCommand": "string",
  "files": [
    { "path": "string", "content": "string" }
  ],
  "readme": "string"
}`;

  if (provider === 'ollama') {
    let data: any;
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        signal: AbortSignal.timeout(90000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          system: systemInstruction,
          prompt: `Create a runnable project in ${stack} for: "${prompt}". Return ONLY valid JSON object.`,
          stream: false,
          format: 'json',
        }),
      });

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama error: ${ollamaResponse.statusText}`);
      }

      data = await ollamaResponse.json();
    } catch (error: any) {
      return sendError(res, 503, 'ERR_OLLAMA_OFFLINE', 'Ollama is unreachable or timed out.', traceId);
    }
    try {
      const rawText = extractBalancedJson(data.response || '{}', '{', '}');
      const projectData = JSON.parse(rawText);
      if (!projectData.appName || !Array.isArray(projectData.files)) {
        throw new Error('Malformed project schema from LLM.');
      }
      projectData.stack = stack;
      return res.json(projectData);
    } catch (error: any) {
      return sendError(res, 502, 'ERR_MALFORMED_LLM_OUTPUT', `Malformed project schema from LLM: ${error.message}`, traceId);
    }
  }

  // Santiago Agent Orchestrator Upstream (santiago.solusol.net)
  if (provider === 'solusol' && SANTIAGO_AGENT_URL) {
    try {
      const santiagoRes = await fetch(`${SANTIAGO_AGENT_URL}/api/generate-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-Id': traceId,
          ...(SANTIAGO_API_KEY ? { Authorization: `Bearer ${SANTIAGO_API_KEY}` } : {}),
        },
        body: JSON.stringify({ prompt, stack, systemInstruction }),
        signal: AbortSignal.timeout(45000),
      });
      if (santiagoRes.ok) {
        const data = await santiagoRes.json();
        if (!data.appName || !Array.isArray(data.files)) {
          throw new Error('Malformed project schema received from Santiago Agent.');
        }
        data.stack = stack;
        return res.json(data);
      }
    } catch (err: any) {
      console.warn('Santiago Agent unreachable for project generation, attempting SoluSol Base URL:', err.message);
    }
  }

  // Fallback / SoluSol Cloud
  try {
    const upstreamRes = await fetch(`${SOLUSOL_BASE_URL}/api/generate-project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-Id': traceId,
        ...(SOLUSOL_API_KEY ? { Authorization: `Bearer ${SOLUSOL_API_KEY}` } : {}),
      },
      body: JSON.stringify({ prompt, stack, systemInstruction }),
      signal: AbortSignal.timeout(45000),
    });
    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      if (!data.appName || !Array.isArray(data.files)) {
        throw new Error('Malformed project schema received from SoluSol API.');
      }
      data.stack = stack;
      return res.json(data);
    }
    const errorText = await upstreamRes.text();
    throw new Error(`SoluSol API returned ${upstreamRes.status}: ${errorText}`);
  } catch (error: any) {
    return sendError(res, 502, 'ERR_UPSTREAM_UNREACHABLE', 'Failed to generate project via upstream API.', traceId);
  }
};

app.post('/api/generate-project', handleGenerateProject);

const handleInterview = async (req: express.Request, res: express.Response) => {
  const traceId = (req as any).traceId;
  const { message, history = [], stack = 'typescript', provider = 'solusol', model = 'llama3.2' } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return sendError(res, 400, 'ERR_PROMPT_EMPTY', 'Field "message" is required and must be a non-empty string.', traceId);
  }

  if (!SUPPORTED_STACKS.includes(stack as any)) {
    return sendError(res, 400, 'ERR_UNSUPPORTED_STACK', `Invalid stack "${stack}". Allowed stacks: ${SUPPORTED_STACKS.join(', ')}`, traceId);
  }

  const systemInstruction = `You are Santiago, a Principal Software Architect who interviews users step-by-step to scope and build their dream applications.
When a user proposes an app idea (like an internet radio website, desktop watcher, SaaS, etc.):
1. Acknowledge the idea enthusiastically with strong domain competence.
2. Ask 2-3 high-impact clarifying questions (audio streaming protocol, persistent player, schedule grid, live chat, theme, etc.).
3. Provide structured multi-choice options for each question so the user can click them easily.
4. If the user provided enough details or says "construyela", set "isReadyToBuild": true and provide a refinedPrompt summarizing all features.
Return ONLY valid JSON matching this schema:
{
  "reply": "string (friendly Spanish conversational explanation)",
  "questions": ["string", "string"],
  "options": [
    { "question": "string", "choices": ["Opción 1", "Opción 2", "Opción 3"] }
  ],
  "isReadyToBuild": boolean,
  "refinedPrompt": "string (detailed specification ready to generate the app)"
}`;

  if (provider === 'ollama') {
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        signal: AbortSignal.timeout(60000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          system: systemInstruction,
          prompt: `User history: ${JSON.stringify(history)}\nUser input: "${message}". Target stack: "${stack}". Return ONLY valid JSON.`,
          stream: false,
          format: 'json',
        }),
      });

      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json();
        const rawText = extractBalancedJson(data.response || '{}', '{', '}');
        const parsed = JSON.parse(rawText);
        return res.json(parsed);
      }
    } catch (error: any) {
      console.warn('Ollama interview fallback:', error.message);
    }
  }

  // Santiago Agent Orchestrator Upstream (santiago.solusol.net)
  if (provider === 'solusol' && SANTIAGO_AGENT_URL) {
    try {
      const santiagoRes = await fetch(`${SANTIAGO_AGENT_URL}/api/interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-Id': traceId,
          ...(SANTIAGO_API_KEY ? { Authorization: `Bearer ${SANTIAGO_API_KEY}` } : {}),
        },
        body: JSON.stringify({ message, history, stack, systemInstruction }),
        signal: AbortSignal.timeout(20000),
      });
      if (santiagoRes.ok) {
        const data = await santiagoRes.json();
        return res.json(data);
      }
    } catch (err: any) {
      console.warn('Santiago Agent unreachable, using local architectural heuristic:', err.message);
    }
  }

  // Heurística de fallback contextual para ideas comunes (como radio web, monitores, etc.)
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('radio') || lowerMsg.includes('musica') || lowerMsg.includes('audio') || lowerMsg.includes('stream')) {
    return res.json({
      reply: '¡Me encanta la idea de la radio por internet! Para que la aplicación quede lista para emitir, definamos estos 3 detalles clave:',
      questions: [
        '¿Cómo transmitirás el audio?',
        '¿Qué módulos necesita la interfaz?',
        '¿Qué estilo visual prefieres?'
      ],
      options: [
        { question: 'Fuente de Audio', choices: ['Icecast / Shoutcast (Stream en Vivo)', 'Audio HLS / Stream M3U8', 'Lista de Reproducción MP3'] },
        { question: 'Módulos de la Web', choices: ['Reproductor Sticky + Ahora Sonando', 'Parrilla Semanal de Locutores', 'Chat / Mensajes de Oyentes'] },
        { question: 'Tema Visual', choices: ['Oscuro Neón (Cabina DJ)', 'Minimalista Moderno', 'Retro Vintage Radio'] }
      ],
      isReadyToBuild: false,
      refinedPrompt: `Sitio web de radio por internet en ${stack} con reproductor de audio continuo sin cortes, visualizador de ondas sonoras, metadata del tema actual (Ahora sonando), parrilla de locutores y chat en vivo.`
    });
  }

  return res.json({
    reply: `Entendido: quieres desarrollar "${message}". Para afinar la arquitectura en ${stack}, indícame tus preferencias:`,
    questions: [
      '¿Cuál será la fuente de datos principal?',
      '¿Qué componentes interactivos debe tener la pantalla?',
      '¿Cómo debe actualizarse la información?'
    ],
    options: [
      { question: 'Fuente de Datos', choices: ['API REST / JSON', 'WebSockets en Vivo', 'Archivos Locales'] },
      { question: 'Componentes', choices: ['Dashboard de Métricas', 'Tablas y Filtros', 'Formularios y Acciones'] },
      { question: 'Actualización', choices: ['Tiempo Real (Polling/SSE)', 'Bajo Demanda (Botón Recargar)'] }
    ],
    isReadyToBuild: false,
    refinedPrompt: `Aplicación en ${stack} para: ${message} con arquitectura modular, componentes desacoplados y estados de contingencia.`
  });
};

app.post('/api/interview', handleInterview);
app.post('/export', handleExportCode);
app.post('/api/export-code', handleExportCode);

// Middleware global de captura de excepciones (Zero Trust Sanitization)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const traceId = (req as any).traceId || randomUUID();
  const statusCode = typeof err.status === 'number' ? err.status : 500;
  return sendError(res, statusCode, err.code || 'ERR_INTERNAL_ERROR', err.message || 'Internal server error occurred.', traceId);
});

// Configuración de Vite o Estáticos según el entorno
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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
    const clientDist = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
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

startServer().catch((err) => {
  console.error('[AppCraft Engine] Fatal startup error:', err);
  process.exit(1);
});
