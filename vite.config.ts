import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { Plugin } from 'vite';
import { CSP_META } from './src/csp';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/**
 * Adds the CSP as a <meta> tag to the built index.html, for hosts that can't send headers
 * (GitHub Pages). Not in dev: Vite's dev server injects inline styles for hot reloading.
 */
function cspMeta(): Plugin {
  return {
    name: 'quietqr-csp-meta',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP_META },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig({
  // Relative base: the same build works at `/` (Docker) and at `/quietqr/` (GitHub Pages).
  base: './',
  plugins: [svelte(), cspMeta()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    // Inline nothing as data: URLs; keeps the CSP simple and assets cacheable.
    assetsInlineLimit: 0,
  },
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
  },
});
