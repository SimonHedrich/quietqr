import { contrastRatio, luminance, type Hex } from '../color';
import type { Ecl } from './encode';

/** Scannability problems shown as a calm notice under the preview. */
export type WarningId = 'lowContrast' | 'inverted' | 'logoTooLarge' | 'dense';

/** Result of {@link analyze}. Warnings never block export; the error replaces the preview. */
export interface Analysis {
  warnings: WarningId[];
  error?: 'overCapacity';
}

/** What the analysis looks at. */
export interface AnalysisInput {
  fg: Hex;
  bg: Hex;
  transparent: boolean;
  hasLogo: boolean;
  /** The encoded version, or null when the payload didn't fit. */
  version: number | null;
  ecl: Ecl;
}

/**
 * Minimum contrast ratio between foreground and background. WCAG's 3:1 for graphics. The
 * scan tests decode clean renders down to ~1.3:1, but cameras face glare, print and poor
 * light, so there is no evidence to go lower.
 */
export const MIN_CONTRAST = 3;

/**
 * Versions above this count as very dense. Version 20 is 97 modules (105 with the quiet
 * zone): printed 5 cm wide, a module is under 0.5 mm, about the practical minimum for
 * phone cameras. A full contact card with a logo (level H) is about version 16 and should
 * not warn; only unusually long payloads do.
 */
export const DENSE_VERSION = 20;

/**
 * Levels that tolerate the logo. With a logo, L and M failed to decode for longer payloads
 * in the scan tests; Q and H always passed.
 */
const LOGO_SAFE: readonly Ecl[] = ['Q', 'H'];

/** Assumed backdrop for a transparent code: it usually ends up on white paper or a light page. */
const TRANSPARENT_BACKDROP: Hex = '#ffffff';

/** Checks a style and encoding result for things that make a code hard to scan. */
export function analyze(input: AnalysisInput): Analysis {
  if (input.version === null) return { warnings: [], error: 'overCapacity' };
  const bg = input.transparent ? TRANSPARENT_BACKDROP : input.bg;
  const warnings: WarningId[] = [];
  if (contrastRatio(input.fg, bg) < MIN_CONTRAST) warnings.push('lowContrast');
  if (luminance(input.fg) > luminance(bg)) warnings.push('inverted');
  if (input.hasLogo && !LOGO_SAFE.includes(input.ecl)) warnings.push('logoTooLarge');
  if (input.version > DENSE_VERSION) warnings.push('dense');
  return { warnings };
}
