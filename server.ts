import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export const SUPPORTED_STACKS = [
  'javascript', 'typescript', 'html_css', 'php', 'ruby',
  'java', 'csharp', 'go', 'rust', 'elixir', 'scala',
  'python', 'r', 'julia',
  'dart', 'swift', 'kotlin',
  'cpp', 'c', 'zig',
  'haskell', 'erlang', 'lua', 'perl', 'bash'
] as const;

export type SupportedStack = typeof SUPPORTED_STACKS[number];

const app = express();
app.use(express.json());

// Middleware CORS para integración en microservicios y API Gateways
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check para el balanceador / gateway
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'appcraft-engine', version: '1.0.0' });
});

// Telemetría verídica: origen explícito, unidades y estados LIVE, DEMO, NO_DATA, ERROR
app.get('/api/data', (req, res) => {
  const rawSource = req.query.source;
  const rawType = req.query.type;

  if (!rawSource || !rawType || typeof rawSource !== 'string' || typeof rawType !== 'string') {
    return res.status(400).json({
      origin: 'system.gateway',
      status: 'ERROR',
      unit: 'none',
      updatedAt: new Date().toISOString(),
      description: 'Query parameters "source" and "type" must be non-empty strings.',
    });
  }

  const source = rawSource.trim();
  const type = rawType.trim();
  const updatedAt = new Date().toISOString();
  const uptime = process.uptime();
  const mem = process.memoryUsage();

  // Telemetría genuina de sistema Node.js
  const isSystemSource = source.startsWith('system.') || source.startsWith('runtime.') || source.startsWith('process.');

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

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
  });
};

const extractJsonArray = (text: string): string => {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const target = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
  const arrayMatch = target.match(/\[[\s\S]*\]/);
  return arrayMatch ? arrayMatch[0].trim() : target;
};

const extractCode = (text: string): string => {
  const codeBlockMatch = text.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)\s*```/);
  return codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
};

// Generación de layout canónico (disponible en /generate y /api/generate-dashboard)
const handleGenerateLayout = async (req: express.Request, res: express.Response) => {
  const { prompt, stack = 'typescript' } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Field "prompt" is required and must be a non-empty string.' });
  }

  if (!SUPPORTED_STACKS.includes(stack as any)) {
    return res.status(400).json({ error: `Unsupported stack "${stack}". Supported stacks: ${SUPPORTED_STACKS.join(', ')}` });
  }
  
  const systemInstruction = `You are an expert dashboard architect specializing in multi-stack applications (${stack}).
  Return a clean JSON array representing the dashboard layout components based on user requirements.
  Every object in the array must follow this schema:
  {
    "id": "string (uuid-like or slug)",
    "type": "stat" | "bar_chart" | "line_chart" | "table" | "list",
    "props": {
      "title": "string",
      "data_source": "string",
      "value": "string (optional for stat)"
    }
  }`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = extractJsonArray(response.text || '[]');
    const dashboardLayout = JSON.parse(rawText);
    if (!Array.isArray(dashboardLayout)) {
      return res.status(502).json({ error: 'LLM did not return a valid layout array.' });
    }
    res.json(dashboardLayout);
  } catch (error: any) {
    console.error('Error generating layout:', error);
    res.status(500).json({ 
      error: 'Failed to generate dashboard layout', 
      details: error.message || error 
    });
  }
};

app.post('/generate', handleGenerateLayout);
app.post('/api/generate-dashboard', handleGenerateLayout);

// Síntesis a código nativo políglota (disponible en /export y /api/export-code)
const handleExportCode = async (req: express.Request, res: express.Response) => {
  const { layout, stack = 'typescript', provider = 'gemini', model = 'llama3.2' } = req.body;

  if (!SUPPORTED_STACKS.includes(stack as any)) {
    return res.status(400).json({
      error: `Invalid stack "${stack}". Allowed stacks: ${SUPPORTED_STACKS.join(', ')}`
    });
  }

  if (!layout || !Array.isArray(layout) || layout.length === 0) {
    return res.status(400).json({ error: 'Field "layout" must be a non-empty array of widgets.' });
  }

  const VALID_COMPONENT_TYPES = ['stat', 'bar_chart', 'line_chart', 'table', 'list'];
  const isInvalidWidget = layout.some(
    (w) =>
      !w ||
      typeof w.id !== 'string' ||
      !VALID_COMPONENT_TYPES.includes(w.type) ||
      !w.props ||
      typeof w.props.title !== 'string' ||
      typeof w.props.data_source !== 'string'
  );
  if (isInvalidWidget) {
    return res.status(400).json({
      error: 'Each widget in layout must contain valid "id", "type" (stat|bar_chart|line_chart|table|list), and "props" (title, data_source).',
    });
  }

  const systemInstruction = `You are a Principal Software Architect generating native, production-grade code for the language/stack: "${stack}".
Follow the 'Zero AI Design' policy strictly:
1. Editorial Integrity: Clean, human-readable code. No fake comments, no placeholder illusions.
2. Native-Native Idioms: Use canonical paradigms for ${stack} (e.g. Pythonic for Python, Go channels/structs for Go, Rust ownership patterns for Rust, Flutter widgets for Dart).
3. Zero Broken Assets: Render fallback containers for dynamic data/charts and enforce tabular numbers on metrics.
Convert the provided dashboard layout JSON specification into a complete, idiomatic application file.`;

  if (provider === 'ollama') {
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

      const data = await ollamaResponse.json();
      const code = extractCode(data.response || '');
      return res.json({ code, stack, provider: 'ollama', model });
    } catch (error) {
      return res.status(503).json({
        error: 'Ollama is unreachable. Ensure Ollama is running on http://localhost:11434.',
      });
    }
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify(layout, null, 2),
      config: {
        systemInstruction,
      },
    });

    const code = extractCode(response.text || '');
    res.json({ code, stack, provider: 'gemini' });
  } catch (error: any) {
    console.error('Error synthesizing target code:', error);
    res.status(500).json({ 
      error: 'Failed to synthesize code for target stack with Gemini',
      details: error.message || error
    });
  }
};

app.post('/export', handleExportCode);
app.post('/api/export-code', handleExportCode);

// Configuración de Vite o Estáticos según el entorno
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
  const clientDist = path.resolve(process.cwd(), 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}


const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`[AppCraft Engine] Microservice active on port ${PORT}`);
});
