import test from 'node:test';
import assert from 'node:assert/strict';
import type { SoluSolService } from '../src/server/services/solusol.service.js';
import type { SantiagoService } from '../src/server/services/santiago.service.js';
import { createGenerationController } from '../src/server/controllers/generation.controller.js';

test('Generation Controller - Reenvía referencias al endpoint SoluSol existente', async () => {
  let requestedPath = '';
  let requestBody: Record<string, unknown> = {};
  const solusol = {
    post: async (path: string, body: Record<string, unknown>) => {
      requestedPath = path;
      requestBody = body;
      return new Response(JSON.stringify({
        appName: 'Producto',
        description: 'Proyecto generado',
        runCommand: 'npm run dev',
        files: [{ path: 'index.html', content: '<main>Producto</main>' }],
        readme: '# Producto',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  } as unknown as SoluSolService;
  const santiago = { isConfigured: false } as SantiagoService;
  const { handleGenerateProject } = createGenerationController(solusol, santiago);

  let responseBody: Record<string, unknown> = {};
  let responseStatus = 200;
  const req = {
    body: { prompt: 'Diseña un producto basado en estas referencias', stack: 'html', provider: 'solusol' },
    files: [{
      originalname: 'producto.png',
      mimetype: 'image/png',
      buffer: Buffer.from('reference bytes'),
    }],
  };
  const res = {
    status: (status: number) => {
      responseStatus = status;
      return res;
    },
    json: (body: Record<string, unknown>) => {
      responseBody = body;
      return res;
    },
  };

  await handleGenerateProject(req as any, res as any);

  assert.equal(requestedPath, 'api/generate-project');
  assert.deepEqual(requestBody.references, [{
    name: 'producto.png',
    mimeType: 'image/png',
    dataBase64: Buffer.from('reference bytes').toString('base64'),
  }]);
  assert.equal(responseStatus, 200);
  assert.equal(responseBody.stack, 'html');
});