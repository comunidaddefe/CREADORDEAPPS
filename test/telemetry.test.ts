import test from 'node:test';
import assert from 'node:assert/strict';
import { createTelemetryController } from '../src/server/controllers/telemetry.controller.js';

function createMockHttp(query: Record<string, string | undefined>) {
  let statusCode = 200;
  let jsonPayload: unknown = null;

  const req = {
    query,
  };

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (payload: unknown) => {
      jsonPayload = payload;
      return res;
    },
  };

  return {
    req: req as any,
    res: res as any,
    getStatus: () => statusCode,
    getJson: () => jsonPayload as Record<string, unknown>,
  };
}

test('Telemetry Controller - Retorna 400 cuando faltan source o type', async () => {
  const controller = createTelemetryController('https://api.solusol.net');
  const ctx = createMockHttp({});

  await controller(ctx.req, ctx.res);

  assert.equal(ctx.getStatus(), 400);
  assert.equal(ctx.getJson().code, 'ERR_INVALID_QUERY_PARAMS');
});

test('Telemetry Controller - Resuelve metrica de sistema Node.js (stat)', async () => {
  const controller = createTelemetryController('https://api.solusol.net');
  const ctx = createMockHttp({ source: 'system.node_uptime', type: 'stat' });

  await controller(ctx.req, ctx.res);

  assert.equal(ctx.getStatus(), 200);
  const data = ctx.getJson();
  assert.equal(data.origin, 'system.node_runtime');
  assert.equal(data.status, 'LIVE');
  assert.equal(data.unit, 'seconds');
  assert.match(String(data.value), /^\d+s$/);
});

test('Telemetry Controller - Resuelve tabla de proceso de Node.js (table)', async () => {
  const controller = createTelemetryController('https://api.solusol.net');
  const ctx = createMockHttp({ source: 'system.node_runtime', type: 'table' });

  await controller(ctx.req, ctx.res);

  assert.equal(ctx.getStatus(), 200);
  const data = ctx.getJson();
  assert.equal(data.origin, 'system.node_runtime');
  assert.equal(data.status, 'LIVE');
  assert.equal(Array.isArray(data.rows), true);
  assert.ok((data.rows as Array<{ key: string }>).some((r) => r.key === 'Node Version'));
});

test('Telemetry Controller - Retorna estado DEMO para fuentes desconocidas', async () => {
  const controller = createTelemetryController('https://api.solusol.net');
  const ctx = createMockHttp({ source: 'custom.unregistered_metric', type: 'stat' });

  await controller(ctx.req, ctx.res);

  assert.equal(ctx.getStatus(), 200);
  const data = ctx.getJson();
  assert.equal(data.origin, 'demo.mock_provider');
  assert.equal(data.status, 'DEMO');
  assert.equal(data.unit, 'USD');
});

test('Telemetry Controller - No simula datos SoluSol cuando falta la clave', async () => {
  const controller = createTelemetryController('https://api.solusol.net');
  const ctx = createMockHttp({ source: 'solusol.telemetry.power', type: 'stat' });

  await controller(ctx.req, ctx.res);

  assert.equal(ctx.getStatus(), 200);
  assert.equal(ctx.getJson().status, 'ERROR');
  assert.match(String(ctx.getJson().description), /SOLUSOL_API_KEY/);
});

test('Telemetry Controller - Consulta el endpoint protegido con Bearer y normaliza la métrica', async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = '';
  let authorization = '';
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    authorization = new Headers(init?.headers).get('Authorization') || '';
    return new Response(JSON.stringify({ data: { value: '42 kW', unit: 'kW' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const controller = createTelemetryController('https://api.solusol.net', 'test-token');
    const ctx = createMockHttp({ source: 'solusol.telemetry.power', type: 'stat' });
    await controller(ctx.req, ctx.res);

    assert.equal(new URL(requestUrl).pathname, '/api/v1/admin/telemetry');
    assert.equal(new URL(requestUrl).searchParams.get('source'), 'telemetry.power');
    assert.equal(new URL(requestUrl).searchParams.get('type'), 'stat');
    assert.equal(authorization, 'Bearer test-token');
    assert.equal(ctx.getJson().status, 'LIVE');
    assert.equal(ctx.getJson().value, '42 kW');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Telemetry Controller - Expone rechazo de credenciales sin fallback demo', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('Unauthorized', { status: 401 });

  try {
    const controller = createTelemetryController('https://api.solusol.net', 'invalid-token');
    const ctx = createMockHttp({ source: 'solusol.telemetry.power', type: 'stat' });
    await controller(ctx.req, ctx.res);

    assert.equal(ctx.getJson().status, 'ERROR');
    assert.match(String(ctx.getJson().description), /401/);
    assert.equal(ctx.getJson().value, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Telemetry Controller - No declara LIVE si el esquema no contiene datos de métrica', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ data: { status: 'healthy' } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  try {
    const controller = createTelemetryController('https://api.solusol.net', 'test-token');
    const ctx = createMockHttp({ source: 'solusol.telemetry.power', type: 'stat' });
    await controller(ctx.req, ctx.res);

    assert.equal(ctx.getJson().status, 'ERROR');
    assert.match(String(ctx.getJson().description), /formato/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});