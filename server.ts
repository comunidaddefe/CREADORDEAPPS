import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

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

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Generación de layout canónico (disponible en /generate y /api/generate-dashboard)
const handleGenerateLayout = async (req: express.Request, res: express.Response) => {
  const { prompt, stack = 'react' } = req.body;
  
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
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const dashboardLayout = JSON.parse(response.text || '[]');
    res.json(dashboardLayout);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate dashboard layout' });
  }
};

app.post('/generate', handleGenerateLayout);
app.post('/api/generate-dashboard', handleGenerateLayout);

// Síntesis a código nativo políglota (disponible en /export y /api/export-code)
const handleExportCode = async (req: express.Request, res: express.Response) => {
  const { layout, stack = 'typescript', provider = 'gemini', model = 'llama3.2' } = req.body;

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
      let code = data.response || '';
      if (code.startsWith('```')) {
        code = code.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }
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
      model: 'gemini-3.8-flash',
      contents: JSON.stringify(layout, null, 2),
      config: {
        systemInstruction,
      },
    });

    let code = response.text || '';
    if (code.startsWith('```')) {
      code = code.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
    }

    res.json({ code, stack, provider: 'gemini' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to synthesize code for target stack with Gemini' });
  }
};

app.post('/export', handleExportCode);
app.post('/api/export-code', handleExportCode);

app.post('/api/ollama-generate', async (req, res) => {
  const { prompt, model = 'llama3.2', system } = req.body;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: false,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Ollama returned ${response.statusText}` });
    }
    const data = await response.json();
    res.json({ response: data.response });
  } catch (error) {
    res.status(500).json({ error: 'Ollama not reachable at http://localhost:11434' });
  }
});

import { createServer } from 'vite';

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

if (process.env.NODE_ENV !== 'production') {
  app.use(vite.middlewares);
}


const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`[AppCraft Engine] Microservice active on port ${PORT}`);
});
