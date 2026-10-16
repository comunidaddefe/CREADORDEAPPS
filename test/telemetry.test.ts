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