import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProjectFiles } from '../src/server/project-validation.ts';
import { extractBalancedJson, extractCode } from '../src/server/extraction.ts';

test('Path Validation - blocks path traversal and forbidden characters', () => {
  const traversal = validateProjectFiles([
    { path: '../secret.txt', content: 'hello' }
  ]);
  assert.equal(traversal.valid, false);

  const deepTraversal = validateProjectFiles([
    { path: 'src/modules/../../etc/passwd', content: 'root:x' }
  ]);
  assert.equal(deepTraversal.valid, false);

  const absoluteWindows = validateProjectFiles([
    { path: 'C:\\Windows\\System32\\cmd.exe', content: 'bin' }
  ]);
  assert.equal(absoluteWindows.valid, false);

  const absoluteUnix = validateProjectFiles([
    { path: '/etc/shadow', content: 'secret' }
  ]);
  assert.equal(absoluteUnix.valid, false);

  const reservedWindowsNul = validateProjectFiles([
    { path: 'src/nul.json', content: '{}' }
  ]);
  assert.equal(reservedWindowsNul.valid, false);

  const reservedWindowsCom = validateProjectFiles([
    { path: 'com1.txt', content: 'test' }
  ]);
  assert.equal(reservedWindowsCom.valid, false);

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

test('Path Validation - rejects oversized file payloads (> 1MB)', () => {
  const oversizedContent = 'a'.repeat(1024 * 1024 + 1);
  const result = validateProjectFiles([
    { path: 'src/bigfile.bin', content: oversizedContent }
  ]);
  assert.equal(result.valid, false);
  assert.match(result.error || '', /exceeds the maximum size limit/i);
});

test('Extraction - extractBalancedJson parses properly and catches unclosed delimiters', () => {
  const raw = '```json\n{"app": "test", "files": []}\n```';
  const parsed = extractBalancedJson(raw, '{', '}');
  assert.equal(parsed, '{"app": "test", "files": []}');

  const rawArray = 'Prefix text ```json\n[{"id": 1}, {"id": 2}]\n``` suffix';
  const parsedArray = extractBalancedJson(rawArray, '[', ']');
  assert.equal(parsedArray, '[{"id": 1}, {"id": 2}]');

  const withEscapedBraces = '{"message": "contains \\"}\\" escaped brace"}';
  const parsedEscaped = extractBalancedJson(withEscapedBraces, '{', '}');
  assert.equal(parsedEscaped, withEscapedBraces);

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