import { describe, expect, test } from 'vitest';
import { roundTrip } from '../../../tests/scan/helpers';
import { normalizeUrl, url } from './url';

describe('url template', () => {
  test('adds https:// only when there is no scheme', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
    expect(normalizeUrl('  example.com/a?b=c  ')).toBe('https://example.com/a?b=c');
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeUrl('HTTPS://EXAMPLE.COM')).toBe('HTTPS://EXAMPLE.COM');
    expect(normalizeUrl('mailto:a@example.com')).toBe('mailto:a@example.com');
    expect(normalizeUrl('tel:+49123')).toBe('tel:+49123');
    expect(normalizeUrl('localhost:8080')).toBe('https://localhost:8080');
    expect(normalizeUrl('example.com:8080/x')).toBe('https://example.com:8080/x');
    expect(normalizeUrl('')).toBe('');
  });

  test('empty and validation', () => {
    expect(url.isEmpty(url.empty())).toBe(true);
    expect(url.isEmpty({ url: '   ' })).toBe(true);
    expect(url.validate({ url: '' })).toEqual([]);
    expect(url.validate({ url: 'example.com' })).toEqual([]);
    expect(url.validate({ url: 'localhost:3000' })).toEqual([]);
    expect(url.validate({ url: 'not a url' })).toEqual([{ field: 'url', key: 'invalidUrl' }]);
    expect(url.validate({ url: 'foo' })).toEqual([{ field: 'url', key: 'invalidUrl' }]);
  });

  test('special characters and unicode are kept as typed', () => {
    expect(url.encode({ url: 'https://example.com/ä?q=a&b=ü#x' })).toBe(
      'https://example.com/ä?q=a&b=ü#x',
    );
    expect(url.encode({ url: 'münchen.de' })).toBe('https://münchen.de');
  });

  test('scans', async () => {
    const payload = url.encode({ url: 'example.com/path?q=1' });
    expect(await roundTrip(payload, 'M')).toBe(payload);
  });
});
