import { describe, expect, test } from 'vitest';
import { CapacityError, encodeQr, toWellFormed } from './encode';
import { capacity, MAX_BYTES } from './capacity';
import { LOGO_MIN_VERSION, logoArea, protectedModulesIn } from './logo';
import { renderSvg } from './render';

const base = { shape: 'square', fg: '#000000', bg: '#ffffff', transparent: false } as const;

describe('encodeQr', () => {
  test('uses exactly the requested level and the smallest version', () => {
    const qr = encodeQr('https://example.com', 'M');
    expect(qr.ecl).toBe('M');
    expect(qr.version).toBe(2);
    expect(qr.size).toBe(25);
    expect(qr.modules).toHaveLength(25);
    expect(qr.kind[0]?.[0]).toBe('finder');
    expect(qr.kind[6]?.[10]).toBe('timing');
  });

  test('throws CapacityError when too long', () => {
    expect(() => encodeQr('x'.repeat(MAX_BYTES.H + 1), 'H')).toThrow(CapacityError);
    expect(() => encodeQr('x'.repeat(MAX_BYTES.H), 'H')).not.toThrow();
  });

  test('replaces lone surrogates instead of throwing', () => {
    expect(toWellFormed('a\uD83Db')).toBe('a�b');
    expect(toWellFormed('👋')).toBe('👋');
    expect(() => encodeQr('broken \uD83D', 'M')).not.toThrow();
  });
});

test('capacity counts UTF-8 bytes', () => {
  expect(capacity('abc', 'M')).toEqual({ used: 3, max: 2331 });
  expect(capacity('ä', 'H')).toEqual({ used: 2, max: 1273 });
});

describe('logoArea', () => {
  test('is centered, odd-sized, about 20 % plus padding', () => {
    for (let v = LOGO_MIN_VERSION; v <= 40; v++) {
      const size = 17 + 4 * v;
      const { cleared, logo } = logoArea(size);
      expect(cleared.size % 2).toBe(1);
      expect(cleared.x * 2 + cleared.size).toBe(size);
      expect(logo.size).toBe(cleared.size - 2);
      expect(logo.size / size).toBeGreaterThan(0.15);
      expect(logo.size / size).toBeLessThan(0.25);
    }
  });

  test('never covers finder, timing or format modules', () => {
    for (let len = 1; len < 1200; len += 37) {
      const qr = encodeQr('x'.repeat(len), 'H', LOGO_MIN_VERSION);
      expect(protectedModulesIn(qr, logoArea(qr.size).cleared)).toBe(0);
    }
  });
});

describe('renderSvg', () => {
  const qr = encodeQr('hello', 'M');

  test('has a viewBox including the 4-module quiet zone', () => {
    const svg = renderSvg(qr, base);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 29 29">/);
    expect(svg).toContain('<rect width="29" height="29" fill="#ffffff"/>');
  });

  test('omits the background when transparent', () => {
    expect(renderSvg(qr, { ...base, transparent: true })).not.toContain('<rect');
  });

  test('sets pixel dimensions when asked', () => {
    expect(renderSvg(qr, { ...base, pixelSize: 10 })).toContain('width="290" height="290"');
  });

  test('rejects invalid colors and logos', () => {
    expect(() => renderSvg(qr, { ...base, fg: 'red' as `#${string}` })).toThrow();
    expect(() => renderSvg(qr, { ...base, fg: '#000000"/><script>' as `#${string}` })).toThrow();
    expect(() => renderSvg(qr, { ...base, logo: 'data:image/svg+xml;base64,AAAA' })).toThrow();
    expect(() => renderSvg(qr, { ...base, logo: 'javascript:alert(1)' })).toThrow();
  });

  test('embeds the logo as an image', () => {
    const svg = renderSvg(qr, { ...base, logo: 'data:image/png;base64,iVBORw0KGgo=' });
    expect(svg).toContain('<image x="12" y="12" width="5" height="5"');
  });

  test('square shape merges runs into one path without float noise', () => {
    const svg = renderSvg(qr, base);
    expect(svg.match(/<path/g)).toHaveLength(2);
    expect(svg).not.toMatch(/\d\.\d{4,}/);
  });

  test('every shape renders', () => {
    for (const shape of ['square', 'rounded', 'dots'] as const)
      expect(renderSvg(qr, { ...base, shape })).toContain('</svg>');
  });
});
