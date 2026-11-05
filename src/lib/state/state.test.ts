import { describe, expect, test } from 'vitest';
import { DEFAULT_STYLE, type Style } from '../style';
import { decodeHash, encodeHash } from './hash';
import { parseStoredStyle, sanitizeStyle, serializeStyle } from './style';

const style: Style = { shape: 'dots', fg: '#1e3a8a', bg: '#eff6ff', transparent: true, ecl: 'Q' };

describe('style persistence', () => {
  test('round trip', () => {
    expect(parseStoredStyle(serializeStyle(style))).toEqual(style);
  });

  test('missing, broken or hostile data falls back to defaults', () => {
    expect(parseStoredStyle(null)).toEqual(DEFAULT_STYLE);
    expect(parseStoredStyle('{nope')).toEqual(DEFAULT_STYLE);
    expect(parseStoredStyle('null')).toEqual(DEFAULT_STYLE);
    expect(
      sanitizeStyle({
        shape: 'star',
        fg: '#000"/><script>',
        bg: 'red',
        transparent: 'yes',
        ecl: 'X',
      }),
    ).toEqual(DEFAULT_STYLE);
    expect(sanitizeStyle({ fg: '#ABC' }).fg).toBe('#aabbcc');
  });

  test('serializes only style fields', () => {
    const extra = { ...style, content: 'secret' } as Style;
    expect(serializeStyle(extra)).not.toContain('secret');
  });
});

describe('link hash', () => {
  test('round trip with unicode and special characters', () => {
    const values = { ssid: 'Café ☕;"\\', password: 'pä$$:wörd', security: 'WEP', hidden: true };
    const hash = encodeHash({ template: 'wifi', values, style });
    expect(hash).toMatch(/^#v1=[A-Za-z0-9_-]+$/);
    expect(decodeHash(hash)).toEqual({ template: 'wifi', values, style });
  });

  test('leaves out empty values and fills them back in', () => {
    const hash = encodeHash({
      template: 'contact',
      values: { firstName: 'Ada' },
      style: DEFAULT_STYLE,
    });
    const decoded = decodeHash(hash);
    expect(decoded?.values.firstName).toBe('Ada');
    expect(decoded?.values.note).toBe('');
    expect(hash.length).toBeLessThan(140);
  });

  test('unknown version, garbage and bad data are ignored', () => {
    expect(decodeHash('')).toBeNull();
    expect(decodeHash('#')).toBeNull();
    expect(decodeHash('#v2=abc')).toBeNull();
    expect(decodeHash('#v1=')).toBeNull();
    expect(decodeHash('#v1=!!!')).toBeNull();
    expect(decodeHash('#v1=' + btoa('not json'))).toBeNull();
    expect(decodeHash('#v1=' + btoa(JSON.stringify({ t: 'nope', v: {} })))).toBeNull();
    expect(decodeHash('#v1=' + btoa('\xff\xfe'))).toBeNull(); // invalid UTF-8
  });

  test('drops unknown fields and wrong types', () => {
    const json = JSON.stringify({ t: 'url', v: { url: 5, evil: 'x' }, s: { fg: 'nope' } });
    const decoded = decodeHash('#v1=' + btoa(json).replace(/=+$/, ''));
    expect(decoded).toEqual({ template: 'url', values: { url: '' }, style: DEFAULT_STYLE });
  });
});
