import { DEFAULT_STYLE, type Style } from '../style';
import { getTemplate, isTemplateId } from '../templates/registry';
import type { FieldValues, TemplateId } from '../templates/types';
import { sanitizeStyle, serializeStyle } from './style';

/** What a shared link carries: one template's values and the style. Never the logo. */
export interface SharedState {
  template: TemplateId;
  values: FieldValues;
  style: Style;
}

/** Hash prefix with the format version. A new format gets `#v2=` and its own decoder. */
const PREFIX = '#v1=';

/** UTF-8 → base64url without padding. */
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** base64url → UTF-8; throws on malformed input. */
function fromBase64Url(data: string): string {
  if (!/^[A-Za-z0-9_-]*$/.test(data)) throw new Error('not base64url');
  const bin = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/**
 * Keeps only the template's own fields with the right types; anything else in the data
 * is dropped, missing fields get their empty value.
 */
function sanitizeValues(template: TemplateId, data: unknown): FieldValues {
  const empty = getTemplate(template).empty();
  const d = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
  const out: FieldValues = { ...empty };
  for (const [key, fallback] of Object.entries(empty)) {
    const value = d[key];
    if (typeof value === typeof fallback) out[key] = value as string | boolean;
  }
  return out;
}

/**
 * Encodes the shared state as a compact URL hash: `#v1=<base64url(JSON)>`. Values and style
 * fields that are still at their default are left out to keep the link short.
 */
export function encodeHash(state: SharedState): string {
  const empty = getTemplate(state.template).empty();
  const values: FieldValues = {};
  for (const [key, value] of Object.entries(state.values)) {
    if (key in empty && value !== empty[key]) values[key] = value;
  }
  const style: Partial<Style> = {};
  for (const [key, value] of Object.entries(JSON.parse(serializeStyle(state.style)) as Style)) {
    if (value !== DEFAULT_STYLE[key as keyof Style]) Object.assign(style, { [key]: value });
  }
  const json = JSON.stringify({ t: state.template, v: values, s: style });
  return PREFIX + toBase64Url(json);
}

/**
 * Decodes a URL hash written by {@link encodeHash}. Returns null for anything else: no
 * hash, an unknown version, garbage, or an unknown template. Values and style are
 * sanitized, so a crafted link can't inject anything.
 */
export function decodeHash(hash: string): SharedState | null {
  if (!hash.startsWith(PREFIX)) return null;
  try {
    const data = JSON.parse(fromBase64Url(hash.slice(PREFIX.length))) as unknown;
    if (typeof data !== 'object' || data === null) return null;
    const { t, v, s } = data as Record<string, unknown>;
    if (!isTemplateId(t)) return null;
    return { template: t, values: sanitizeValues(t, v), style: sanitizeStyle(s) };
  } catch {
    return null;
  }
}
