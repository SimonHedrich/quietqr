import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Resvg } from '@resvg/resvg-js';
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
import type { Ecl } from '../../src/lib/qr/encode';
import { encodeQr } from '../../src/lib/qr/encode';
import { LOGO_MIN_VERSION } from '../../src/lib/qr/logo';
import { renderSvg, type RenderOptions } from '../../src/lib/qr/render';

const require = createRequire(import.meta.url);

// Load the decoder's wasm from node_modules; the default would fetch it from a CDN.
prepareZXingModule({
  overrides: {
    wasmBinary: readFileSync(require.resolve('zxing-wasm/reader/zxing_reader.wasm'))
      .buffer as ArrayBuffer,
  },
  fireImmediately: true,
});

/** Rasterizes an SVG string to RGBA pixels, `width` px wide, on a white page. */
export function rasterize(svg: string, width: number) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: width }, background: '#ffffff' });
  const img = r.render();
  return {
    data: new Uint8ClampedArray(img.pixels),
    width: img.width,
    height: img.height,
    colorSpace: 'srgb' as const,
  };
}

/** Rasterizes an SVG to PNG bytes. */
export function toPng(svg: string, width: number): Buffer {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

/** Decodes the first QR code in an SVG; returns its text or null. */
export async function decodeSvg(svg: string, width = 600): Promise<string | null> {
  const results = await readBarcodes(rasterize(svg, width) as ImageData, {
    formats: ['QRCode'],
    tryHarder: true,
    maxNumberOfSymbols: 1,
  });
  return results[0]?.text ?? null;
}

/** Encodes, renders and decodes a payload; returns the decoded text or null. */
export async function roundTrip(
  payload: string,
  ecl: Ecl,
  opts: Partial<RenderOptions> = {},
): Promise<string | null> {
  const qr = encodeQr(payload, ecl, opts.logo ? LOGO_MIN_VERSION : 1);
  const svg = renderSvg(qr, {
    shape: 'square',
    fg: '#1f2328',
    bg: '#ffffff',
    transparent: false,
    ...opts,
  });
  // About 8 px per module, like a phone camera seeing a code at arm's length.
  return decodeSvg(svg, (qr.size + 8) * 8);
}

/** Deterministic pseudo-random generator (mulberry32) for reproducible test images. */
export function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A logo test image as a PNG data URL: `solid` is a dark rounded square, `noisy` a grid of
 * random dark and light cells (the worst case for a decoder).
 */
export function testLogo(kind: 'solid' | 'noisy'): string {
  let body: string;
  if (kind === 'solid') {
    body = '<rect width="64" height="64" rx="12" fill="#e5533d"/>';
  } else {
    const rand = rng(42);
    body = '<rect width="64" height="64" fill="#fff"/>';
    for (let y = 0; y < 64; y += 4)
      for (let x = 0; x < 64; x += 4)
        if (rand() < 0.5) body += `<rect x="${x}" y="${y}" width="4" height="4" fill="#000"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`;
  return 'data:image/png;base64,' + toPng(svg, 128).toString('base64');
}
