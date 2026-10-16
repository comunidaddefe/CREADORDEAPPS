import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProjectFiles } from './src/server/project-validation.ts';
import { extractBalancedJson, extractCode } from './src/server/extraction.ts';

test('Path Validation - blocks path traversal and forbidden characters', () => {
  const traversal = validateProjectFiles([
    { path: '../secret.txt', content: 'hello' }
  ]);
  assert.equal(traversal.valid, false);

  const reservedWindows = validateProjectFiles([
    { path: 'src/CON.txt', content: 'hello' }
  ]);
  assert.equal(reservedWindows.valid, false);

  const validProject = validateProjectFiles([
    { path: 'src/index.ts', content: 'console.log("ok");' },
    { path: 'package.json', content: '{}' }
  ]);
  assert.equal(validProject.valid, true);
});

test('Extraction - extractBalancedJson parses properly and catches unclosed delimiters', () => {
  const raw = '```json\n{"app": "test", "files": []}\n```';
  const parsed = extractBalancedJson(raw, '{', '}');
  assert.equal(parsed, '{"app": "test", "files": []}');

  assert.throws(
    () => {
      extractBalancedJson('{"app": "broken"', '{', '}');
    },
    { name: 'SyntaxError' }
  );
});

test('Extraction - extractCode retrieves raw code inside markdown blocks', () => {
  const md = '```typescript\nconst x: number = 42;\n```';
  const extracted = extractCode(md);
  assert.equal(extracted, 'const x: number = 42;');
});