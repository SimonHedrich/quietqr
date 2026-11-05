import type { Hex } from './color';
import type { Ecl } from './qr/encode';

/** Module and finder shape. */
export type Shape = 'square' | 'rounded' | 'dots';

/** Error-correction choice: automatic or a fixed level. */
export type EclChoice = 'auto' | Ecl;

/** The user's style settings. Persisted to localStorage; never contains content or the logo. */
export interface Style {
  shape: Shape;
  fg: Hex;
  bg: Hex;
  transparent: boolean;
  ecl: EclChoice;
}

/** All shapes in display order. */
export const SHAPES: readonly Shape[] = ['square', 'rounded', 'dots'];

/** All error-correction choices in display order. */
export const ECL_CHOICES: readonly EclChoice[] = ['auto', 'L', 'M', 'Q', 'H'];

/** Recovery capacity per level, as shown in the UI. */
export const ECL_PERCENT: Readonly<Record<Ecl, number>> = { L: 7, M: 15, Q: 25, H: 30 };

/**
 * Curated foreground presets: dark, saturated enough to look like a choice, and each one
 * at least 7:1 against every background preset (tested).
 */
export const FG_PRESETS: readonly Hex[] = [
  '#1f2328',
  '#1e3a8a',
  '#14532d',
  '#7f1d1d',
  '#4c1d95',
  '#713f12',
];

/** Curated background presets: white and light tints that work with every foreground preset. */
export const BG_PRESETS: readonly Hex[] = [
  '#ffffff',
  '#f6f8fa',
  '#fdf6e3',
  '#eff6ff',
  '#f0fdf4',
  '#fdf2f8',
];

/** The style on first load. */
export const DEFAULT_STYLE: Readonly<Style> = {
  shape: 'square',
  fg: '#1f2328',
  bg: '#ffffff',
  transparent: false,
  ecl: 'auto',
};

/** Resolves the error-correction choice: Auto means M (15 %) without a logo, H (30 %) with one. */
export function resolveEcl(choice: EclChoice, hasLogo: boolean): Ecl {
  if (choice !== 'auto') return choice;
  return hasLogo ? 'H' : 'M';
}
