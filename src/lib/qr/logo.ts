import type { QrMatrix } from './encode';

/** A square area in module coordinates (symbol space, quiet zone not included). */
export interface Area {
  x: number;
  y: number;
  /** Side length in modules. */
  size: number;
}

/** Logo width as a share of the symbol width. */
export const LOGO_RATIO = 0.2;
/** Empty modules between the logo and the surrounding modules, per side. */
export const LOGO_PADDING = 1;

/**
 * Smallest version to encode at when a logo is present. In version 1 (21 modules) the gap
 * between the finder patterns is too small for a useful logo, so it would cover format info.
 */
export const LOGO_MIN_VERSION = 2;

/** Rounds to the nearest odd integer, so an area can sit exactly in the middle of an odd grid. */
function nearestOdd(n: number): number {
  return 2 * Math.round((n - 1) / 2) + 1;
}

/**
 * The area cleared for a logo: centered, about {@link LOGO_RATIO} of the symbol wide plus
 * {@link LOGO_PADDING} on each side, snapped to whole modules. It never reaches finder,
 * timing or format modules, as long as the symbol is at least {@link LOGO_MIN_VERSION}. From version 7 on, a central alignment
 * pattern sits exactly in the middle and is covered; decoders estimate it from the others,
 * which the scan tests confirm.
 */
export function logoArea(size: number): { cleared: Area; logo: Area } {
  const clearedSize = nearestOdd(size * LOGO_RATIO + 2 * LOGO_PADDING);
  const start = (size - clearedSize) / 2;
  const cleared = { x: start, y: start, size: clearedSize };
  const logo = {
    x: start + LOGO_PADDING,
    y: start + LOGO_PADDING,
    size: clearedSize - 2 * LOGO_PADDING,
  };
  return { cleared, logo };
}

/** True if the module at (x, y) lies inside the area. */
export function inArea(a: Area, x: number, y: number): boolean {
  return x >= a.x && x < a.x + a.size && y >= a.y && y < a.y + a.size;
}

/**
 * Counts the function-pattern modules (finder, timing, format) inside the area. Used by
 * tests to prove the excavation leaves them alone.
 */
export function protectedModulesIn(qr: QrMatrix, a: Area): number {
  let n = 0;
  for (let y = a.y; y < a.y + a.size; y++) {
    for (let x = a.x; x < a.x + a.size; x++) {
      const k = qr.kind[y]?.[x];
      if (k === 'finder' || k === 'timing' || k === 'format') n++;
    }
  }
  return n;
}
