import type express from 'express';
import { sendError } from '../middleware/error-handler.js';
import { extractBalancedJson, extractCode, validateProjectFiles } from '../index.js';
import { queryOllama } from '../services/ollama.service.js';
import type { SoluSolService } from '../services/solusol.service.js';
import type { SantiagoService } from '../services/santiago.service.js';

interface UploadedReference {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export const SUPPORTED_STACKS = [
  'html', 'php', 'tsx', 'go', 'json',
  'javascript', 'typescript', 'html_css', 'vue', 'svelte',
  'csharp', 'rust', 'cpp', 'c', 'zig', 'nim',
  'java', 'kotlin', 'swift', 'dart',
  'python', 'ruby', 'perl', 'lua', 'bash', 'powershell',
  'elixir', 'erlang', 'scala', 'clojure', 'haskell', 'fsharp', 'ocaml',
  'r', 'julia', 'sql', 'yaml', 'solidity'
] as const;

export const createGenerationController = (
  solusolService: SoluSolService,
  santiagoService: SantiagoService
) => {
  const getReferences = (req: express.Request): UploadedReference[] => {
    const files = (req as express.Request & { files?: UploadedReference[] }).files;
    return Array.isArray(files) ? files : [];
  };

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
When image or video references are attached, use them to understand the product, visual style, and workflows. Treat them as references, not as verified facts.
Every object in the array must follow this schema:
{
  "id": "string",
  "type": "stat" | "bar_chart" | "line_chart" | "table" | "list",
  "gridPosition": { "colSpan": 1 to 12 },
  "props": { "title": "string", "data_source": "string", "value": "string (optional)" }
}`;

    const references = getReferences(req);
    if (references.length > 0 && provider === 'ollama') {
      return sendError(res, 400, 'ERR_MULTIMODAL_PROVIDER_REQUIRED', 'Las referencias visuales deben enviarse a SoluSol.', traceId);
    }
    const referencePayload = references.map((reference) => ({
      name: reference.originalname,
      mimeType: reference.mimetype,
      dataBase64: reference.buffer.toString('base64'),
    }));

    if (provider === 'ollama') {
      try {
        const data = await queryOllama({
          model,
          system: systemInstruction,
          prompt: `Create a dashboard layout array for: "${prompt}". Return ONLY valid JSON array.`,
          format: 'json',
          timeoutMs: 60000,
        });
        const rawText = extractBalancedJson(data.response || '[]', '[', ']');
        const dashboardLayout = JSON.parse(rawText);
        if (!Array.isArray(dashboardLayout)) {
          return sendError(res, 502, 'ERR_MALFORMED_LLM_OUTPUT', 'LLM did not produce a valid layout array.', traceId);
        }
        const sanitized = dashboardLayout.map((item: any, index: number) => ({
          id: String(item.id || `widget_${index}`),
          type: ['stat', 'bar_chart', 'line_chart', 'table', 'list'].includes(item.type) ? item.type : 'stat',
          gridPosition: { colSpan: Math.max(1, Math.min(12, Number(item.gridPosition?.colSpan) || 4)) },
          props: {
            title: String(item.props?.title || 'Metric'),
            data_source: String(item.props?.data_source || 'system.node_uptime'),
            value: item.props?.value ? String(item.props.value) : undefined,
          },
        }));
        return res.json(sanitized);
      } catch (error: any) {
        return sendError(res, 503, 'ERR_OLLAMA_OFFLINE', 'Ollama error or unreachable: ' + error.message, traceId);
      }
    }

    try {
      const upstreamRes = await solusolService.post(
        'api/generate-dashboard',
        { prompt, stack, systemInstruction, ...(referencePayload.length > 0 ? { references: referencePayload } : {}) },
        traceId,
        30000
      );
      if (!upstreamRes.ok) {
        throw new Error(`SoluSol returned ${upstreamRes.status}`);
      }
      const data = await upstreamRes.json();
      const dashboardLayout = Array.isArray(data) ? data : data.layout;
      if (!Array.isArray(dashboardLayout)) {
        return sendError(res, 502, 'ERR_SCHEMA_VALIDATION_FAILED', 'SoluSol API did not return a valid layout array.', traceId);
      }
      return res.json(dashboardLayout);
    } catch {
      return sendError(res, 502, 'ERR_UPSTREAM_UNREACHABLE', 'Failed to generate dashboard layout via SoluSol API.', traceId);
    }
  };

  const handleExportCode = async (req: express.Request, res: express.Response) => {
    const traceId = (req as any).traceId;
    const { layout, stack = 'typescript', provider = 'solusol', model = 'llama3.2' } = req.body || {};

    if (!SUPPORTED_STACKS.includes(stack as any)) {
      return sendError(res, 400, 'ERR_UNSUPPORTED_STACK', `Invalid stack "${stack}". Allowed stacks: ${SUPPORTED_STACKS.join(', ')}`, traceId);
    }

    if (!layout || !Array.isArray(layout) || layout.length === 0) {
      return sendError(res, 400, 'ERR_SCHEMA_VALIDATION_FAILED', 'Field "layout" must be a non-empty array of widgets.', traceId);
    }

    const systemInstruction = `You are a Principal Software Architect generating native, production-grade code for: "${stack}".
Follow 'Zero AI Design' policy: clean, human-readable code. No synthetic comments or stubs.`;

    if (provider === 'ollama') {
      try {
        const data = await queryOllama({
          model,
          system: systemInstruction,
          prompt: `Convert this layout into ${stack} code:\n${JSON.stringify(layout, null, 2)}`,
          timeoutMs: 60000,
        });
        const code = extractCode(data.response || '');
        return res.json({ code, stack, provider: 'ollama', model });
      } catch {
        return sendError(res, 503, 'ERR_OLLAMA_OFFLINE', 'Ollama is unreachable.', traceId);
      }
    }

    try {
      const upstreamRes = await solusolService.post(
        'api/export-code',
        { layout, stack, systemInstruction },
        traceId,
        45000
      );
      if (!upstreamRes.ok) throw new Error(`SoluSol returned ${upstreamRes.status}`);
      const data = await upstreamRes.json();
      const code = typeof data === 'string' ? extractCode(data) : extractCode(data.code || '');
      return res.json({ code, stack, provider: 'solusol' });
    } catch {
      return sendError(res, 502, 'ERR_UPSTREAM_UNREACHABLE', 'Failed to synthesize code via api.solusol.net', traceId);
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
Generate a complete, production-grade multi-file project for stack: "${stack}".
When image or video references are attached, use them as inspiration for the product concept, layout, and visual details. Do not claim details that are not visible.
Return ONLY a valid JSON object matching:
{ "appName": "string", "description": "string", "runCommand": "string", "files": [{ "path": "string", "content": "string" }], "readme": "string" }`;

    const references = getReferences(req);
    if (references.length > 0 && provider === 'ollama') {
      return sendError(res, 400, 'ERR_MULTIMODAL_PROVIDER_REQUIRED', 'Las referencias visuales requieren el proveedor SoluSol.', traceId);
    }
    const referencePayload = references.map((reference) => ({
      name: reference.originalname,
      mimeType: reference.mimetype,
      dataBase64: reference.buffer.toString('base64'),
    }));

    if (provider === 'ollama') {
      try {
        const data = await queryOllama({
          model,
          system: systemInstruction,
          prompt: `Create a runnable project in ${stack} for: "${prompt}". Return ONLY valid JSON object.`,
          format: 'json',
          timeoutMs: 90000,
        });
        const rawText = extractBalancedJson(data.response || '{}', '{', '}');
        const projectData = JSON.parse(rawText);
        const validation = validateProjectFiles(projectData.files);
        if (!validation.valid) {
          return sendError(res, 502, 'ERR_INVALID_GENERATED_PROJECT', validation.error || 'Project failed safety validation.', traceId);
        }
        projectData.stack = stack;
        return res.json(projectData);
      } catch (error: any) {
        return sendError(res, 503, 'ERR_OLLAMA_OFFLINE', 'Ollama is unreachable or timed out: ' + error.message, traceId);
      }
    }

    if (provider === 'solusol' && referencePayload.length === 0 && santiagoService.isConfigured) {
      try {
        const santiagoRes = await santiagoService.post(
          'api/generate-project',
          { prompt, stack, systemInstruction },
          traceId,
          45000
        );
        if (santiagoRes.ok) {
          const data = await santiagoRes.json();
          const validation = validateProjectFiles(data.files);
          if (!validation.valid) {
            return sendError(res, 502, 'ERR_INVALID_GENERATED_PROJECT', validation.error || 'Project failed safety validation.', traceId);
          }
          data.stack = stack;
          return res.json(data);
        }
      } catch {}
    }

    try {
      const upstreamRes = await solusolService.post(
        'api/generate-project',
        { prompt, stack, systemInstruction, ...(referencePayload.length > 0 ? { references: referencePayload } : {}) },
        traceId,
        45000
      );
      if (upstreamRes.ok) {
        const data = await upstreamRes.json();
        const validation = validateProjectFiles(data.files);
        if (!validation.valid) {
          return sendError(res, 502, 'ERR_INVALID_GENERATED_PROJECT', validation.error || 'Project failed safety validation.', traceId);
        }
        data.stack = stack;
        return res.json(data);
      }
      throw new Error(`SoluSol returned ${upstreamRes.status}`);
    } catch {
      return sendError(res, 502, 'ERR_UPSTREAM_UNREACHABLE', 'Failed to generate project via upstream API.', traceId);
    }
  };

  return { handleGenerateLayout, handleExportCode, handleGenerateProject };
};