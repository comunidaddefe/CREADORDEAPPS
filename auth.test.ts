import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_SOLUSOL_ROUTES, ALLOWED_AGENT_ROUTES } from './src/server/proxy-policy.ts';

test('Proxy Security Policy - SoluSol allowed endpoints and methods', () => {
  assert.equal(ALLOWED_SOLUSOL_ROUTES.has('telemetry'), true);
  assert.equal(ALLOWED_SOLUSOL_ROUTES.get('telemetry')?.has('GET'), true);
  assert.equal(ALLOWED_SOLUSOL_ROUTES.get('telemetry')?.has('POST'), false);

  assert.equal(ALLOWED_SOLUSOL_ROUTES.has('api/generate-project'), true);
  assert.equal(ALLOWED_SOLUSOL_ROUTES.get('api/generate-project')?.has('POST'), true);
  assert.equal(ALLOWED_SOLUSOL_ROUTES.get('api/generate-project')?.has('GET'), false);

  assert.equal(ALLOWED_SOLUSOL_ROUTES.has('forbidden/endpoint'), false);
});

test('Proxy Security Policy - Santiago Agent allowed endpoints and methods', () => {
  assert.equal(ALLOWED_AGENT_ROUTES.has('api/interview'), true);
  assert.equal(ALLOWED_AGENT_ROUTES.get('api/interview')?.has('POST'), true);
  assert.equal(ALLOWED_AGENT_ROUTES.get('api/interview')?.has('GET'), false);

  assert.equal(ALLOWED_AGENT_ROUTES.has('api/generate-project'), true);
  assert.equal(ALLOWED_AGENT_ROUTES.get('api/generate-project')?.has('POST'), true);
  assert.equal(ALLOWED_AGENT_ROUTES.get('api/generate-project')?.has('DELETE'), false);

  assert.equal(ALLOWED_AGENT_ROUTES.has('admin/shell'), false);
});