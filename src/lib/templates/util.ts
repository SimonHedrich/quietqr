/** True if every string value of the object is blank (booleans are ignored). */
export function allBlank(values: Record<string, string | boolean>): boolean {
  return Object.values(values).every((v) => typeof v !== 'string' || v.trim() === '');
}

/** Normalizes line breaks to CRLF. */
export function crlf(text: string): string {
  return text.replace(/\r\n|\r|\n/g, '\r\n');
}

/**
 * Normalizes a phone number for `tel:` and `SMSTO:`: keeps a leading `+`, digits, `*` and
 * `#`; drops spaces, dashes, dots, slashes and parentheses.
 */
export function normalizePhone(input: string): string {
  const s = input.trim();
  const plus = s.startsWith('+') ? '+' : '';
  return plus + s.replace(/[^0-9*#]/g, '');
}

/** True for something that looks like a dialable phone number (at least 3 digits, only phone characters). */
export function isPhone(input: string): boolean {
  const s = input.trim();
  return /^\+?[0-9*#\-.()/ ]+$/.test(s) && (s.match(/[0-9]/g)?.length ?? 0) >= 3;
}

/** A pragmatic e-mail check: one `@`, something on both sides, a dot in the domain, no spaces. */
export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}
