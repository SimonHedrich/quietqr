import type { Ecl } from './encode';

/**
 * Byte-mode capacity of a version-40 symbol per error-correction level (ISO/IEC 18004,
 * table 7). The encoder may pack digits and upper-case text more densely, so this is a
 * conservative maximum; the real limit is whatever the encoder accepts.
 */
export const MAX_BYTES: Readonly<Record<Ecl, number>> = { L: 2953, M: 2331, Q: 1663, H: 1273 };

/** How much of the code's capacity a payload uses. */
export interface Capacity {
  /** Payload size in UTF-8 bytes (equals the character count for ASCII). */
  used: number;
  /** Maximum bytes at the given level. */
  max: number;
}

const encoder = new TextEncoder();

/** Returns the payload's UTF-8 size and the maximum for the given error-correction level. */
export function capacity(payload: string, ecl: Ecl): Capacity {
  return { used: encoder.encode(payload).length, max: MAX_BYTES[ecl] };
}
