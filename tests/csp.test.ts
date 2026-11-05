import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { CSP_HEADER } from '../src/csp';

test('docker/sws.toml sends the same CSP as src/csp.ts', () => {
  const toml = readFileSync(new URL('../docker/sws.toml', import.meta.url), 'utf8');
  const line = toml.split('\n').find((l) => l.startsWith('Content-Security-Policy'));
  expect(line).toBe(`Content-Security-Policy = "${CSP_HEADER}"`);
});
