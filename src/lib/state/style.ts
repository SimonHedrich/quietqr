import { parseHex } from '../color';
import { DEFAULT_STYLE, ECL_CHOICES, SHAPES, type Style } from '../style';

/** localStorage key for the style. Only the style is ever stored; never content or the logo. */
export const STYLE_KEY = 'quietqr.style';

/**
 * Builds a valid style from untrusted data (localStorage or a link hash). Every field that
 * is missing or invalid falls back to the default, so a bad value can't reach the renderer.
 */
export function sanitizeStyle(data: unknown): Style {
  const d = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
  const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;
  return {
    shape: pick(d.shape, SHAPES, DEFAULT_STYLE.shape),
    fg: (typeof d.fg === 'string' && parseHex(d.fg)) || DEFAULT_STYLE.fg,
    bg: (typeof d.bg === 'string' && parseHex(d.bg)) || DEFAULT_STYLE.bg,
    transparent: typeof d.transparent === 'boolean' ? d.transparent : DEFAULT_STYLE.transparent,
    ecl: pick(d.ecl, ECL_CHOICES, DEFAULT_STYLE.ecl),
  };
}

/** Parses a stored style; the default style if there is none or it's not valid JSON. */
export function parseStoredStyle(json: string | null): Style {
  if (json === null) return { ...DEFAULT_STYLE };
  try {
    return sanitizeStyle(JSON.parse(json));
  } catch {
    return { ...DEFAULT_STYLE };
  }
}

/** Serializes a style for storage, field by field, so nothing else can sneak in. */
export function serializeStyle(style: Style): string {
  const { shape, fg, bg, transparent, ecl } = style;
  return JSON.stringify({ shape, fg, bg, transparent, ecl });
}
