import { icons } from '../icons';
import type { TemplateDef } from './types';

/** Field values of the URL template. */
export type UrlValues = { url: string };

/**
 * True if the input starts with a URI scheme. `localhost:8080` and `example.com:8080` are
 * host:port, not schemes: a scheme must be followed by `//`, or contain no dot and not be
 * followed by a digit (`mailto:`, `tel:`, `geo:` …).
 */
function hasScheme(s: string): boolean {
  const m = /^([a-z][a-z0-9+.-]*):(.?.?)/i.exec(s);
  if (!m) return false;
  const [, scheme = '', after = ''] = m;
  if (after === '//') return true;
  return !scheme.includes('.') && !/^\d/.test(after);
}

/** The URL as it is encoded: trimmed, with `https://` added when no scheme is given. */
export function normalizeUrl(input: string): string {
  const s = input.trim();
  if (s === '') return '';
  return hasScheme(s) ? s : `https://${s}`;
}

/** URL template: one field, `https://` added when there is no scheme. */
export const url: TemplateDef<UrlValues> = {
  id: 'url',
  icon: icons.link,
  empty: () => ({ url: '' }),
  isEmpty: (v) => v.url.trim() === '',
  validate: (v) => {
    const s = normalizeUrl(v.url);
    if (s === '') return [];
    let ok = !/\s/.test(s);
    if (ok) {
      try {
        const u = new URL(s);
        if ((u.protocol === 'http:' || u.protocol === 'https:') && !u.hostname.includes('.')) {
          ok = u.hostname === 'localhost' || /^\[.*\]$/.test(u.hostname);
        }
      } catch {
        ok = false;
      }
    }
    return ok ? [] : [{ field: 'url', key: 'invalidUrl' }];
  },
  encode: (v) => normalizeUrl(v.url),
};
