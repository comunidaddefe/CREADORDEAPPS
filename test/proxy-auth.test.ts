import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequireProxyAuth } from '../src/server/middleware/proxy-auth.js';

function createMockContext(headers: Record<string, string | undefined>) {
  let statusCode = 200;
  let jsonPayload: unknown = null;
  let nextCalled = false;

  const req = {
    header: (name: string) => headers[name.toLowerCase()] ?? headers[name],
    headers,
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

  const next = () => {
    nextCalled = true;
  };

  return {
    req: req as any,
    res: res as any,
    next,
    getStatus: () => statusCode,
    getJson: () => jsonPayload as Record<string, unknown> | null,
    isNextCalled: () => nextCalled,
  };
}

test('Proxy Auth Middleware - Bloqueo 403 cuando no se provee cabecera de autenticacion', () => {
  const secret = 'super-secret-token-123';
  const middleware = createRequireProxyAuth(secret);
  const ctx = createMockContext({});

  middleware(ctx.req, ctx.res, ctx.next);

  assert.equal(ctx.isNextCalled(), false);
  assert.equal(ctx.getStatus(), 403);
  assert.equal(ctx.getJson()?.code, 'ERR_UNAUTHORIZED_PROXY_ACCESS');
});

test('Proxy Auth Middleware - Bloqueo 403 cuando la clave interna es incorrecta', () => {
  const secret = 'super-secret-token-123';
  const middleware = createRequireProxyAuth(secret);
  const ctx = createMockContext({ 'x-app-internal-key': 'clave-falsa' });

  middleware(ctx.req, ctx.res, ctx.next);

  assert.equal(ctx.isNextCalled(), false);
  assert.equal(ctx.getStatus(), 403);
  assert.equal(ctx.getJson()?.code, 'ERR_UNAUTHORIZED_PROXY_ACCESS');
});

test('Proxy Auth Middleware - Autorizacion exitosa con X-App-Internal-Key valida', () => {
  const secret = 'super-secret-token-123';
  const middleware = createRequireProxyAuth(secret);
  const ctx = createMockContext({ 'x-app-internal-key': secret });

  middleware(ctx.req, ctx.res, ctx.next);

  assert.equal(ctx.isNextCalled(), true);
  assert.equal(ctx.getStatus(), 200);
  assert.equal(ctx.getJson(), null);
});

test('Proxy Auth Middleware - Autorizacion exitosa mediante esquema Bearer Token', () => {
  const secret = 'token-con-formato-bearer';
  const middleware = createRequireProxyAuth(secret);
  const ctx = createMockContext({ authorization: `Bearer ${secret}` });

  middleware(ctx.req, ctx.res, ctx.next);

  assert.equal(ctx.isNextCalled(), true);
  assert.equal(ctx.getStatus(), 200);
  assert.equal(ctx.getJson(), null);
});

test('Proxy Auth Middleware - Autoriza navegador del mismo origen permitido', () => {
  const middleware = createRequireProxyAuth('', new Set(['http://127.0.0.1:3000']));
  const ctx = createMockContext({
    origin: 'http://127.0.0.1:3000',
    'sec-fetch-site': 'same-origin',
    host: '127.0.0.1:3000',
  });

  middleware(ctx.req, ctx.res, ctx.next);

  assert.equal(ctx.isNextCalled(), true);
  assert.equal(ctx.getStatus(), 200);
});

test('Proxy Auth Middleware - Sigue bloqueando navegador de origen externo', () => {
  const middleware = createRequireProxyAuth('', new Set(['http://127.0.0.1:3000']));
  const ctx = createMockContext({
    origin: 'https://malicious.example',
    'sec-fetch-site': 'cross-site',
    host: '127.0.0.1:3000',
  });

  middleware(ctx.req, ctx.res, ctx.next);

  assert.equal(ctx.isNextCalled(), false);
  assert.equal(ctx.getStatus(), 403);
});