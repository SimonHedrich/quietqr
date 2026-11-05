import { encode, QrCodeDataType } from 'uqr';

/** QR error-correction level. */
export type Ecl = 'L' | 'M' | 'Q' | 'H';

/** An encoded QR symbol, without quiet zone. */
export interface QrMatrix {
  /** Modules per side (21 for version 1, +4 per version). */
  size: number;
  /** QR version, 1–40. */
  version: number;
  /** Error-correction level the symbol was encoded with. */
  ecl: Ecl;
  /** `modules[y][x]` is true for a dark module. */
  modules: boolean[][];
  /** `kind[y][x]` tells what a module belongs to. */
  kind: ModuleKind[][];
}

/** What a module is part of; the renderer and the logo excavation need to tell them apart. */
export type ModuleKind = 'data' | 'finder' | 'timing' | 'alignment' | 'format';

/** Thrown when the text doesn't fit into a version-40 symbol at the requested level. */
export class CapacityError extends Error {
  constructor() {
    super('Data exceeds QR code capacity');
    this.name = 'CapacityError';
  }
}

const KIND: Record<number, ModuleKind> = {
  [QrCodeDataType.Data]: 'data',
  [QrCodeDataType.Function]: 'format',
  [QrCodeDataType.Position]: 'finder',
  [QrCodeDataType.Timing]: 'timing',
  [QrCodeDataType.Alignment]: 'alignment',
};

/**
 * Replaces lone UTF-16 surrogates with U+FFFD. The encoder converts text to UTF-8 via
 * `encodeURI`, which throws on lone surrogates (e.g. half an emoji pasted from somewhere).
 */
export function toWellFormed(text: string): string {
  return text.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
    '�',
  );
}

/**
 * Encodes text into a QR matrix at exactly the given error-correction level (never boosted),
 * choosing the smallest version from `minVersion` on that fits. Throws {@link CapacityError}
 * if it doesn't fit.
 */
export function encodeQr(text: string, ecl: Ecl, minVersion = 1, maxVersion = 40): QrMatrix {
  let qr;
  try {
    qr = encode(toWellFormed(text), {
      ecc: ecl,
      border: 0,
      boostEcc: false,
      minVersion,
      maxVersion,
    });
  } catch (e) {
    if (e instanceof Error && /too long/i.test(e.message)) throw new CapacityError();
    throw e;
  }
  return {
    size: qr.size,
    version: qr.version,
    ecl,
    modules: qr.data,
    kind: qr.types.map((row) => row.map((t) => KIND[t] ?? 'data')),
  };
}

const LEVELS: readonly Ecl[] = ['L', 'M', 'Q', 'H'];

/**
 * Encodes at `minEcl` or higher: first the smallest version that fits at `minEcl`, then the
 * highest level that still fits into that same version. A higher level costs nothing here,
 * because the space would otherwise be filled with padding. Throws {@link CapacityError} if
 * the text doesn't fit at `minEcl`.
 */
export function encodeRaised(text: string, minEcl: Ecl, minVersion = 1): QrMatrix {
  const base = encodeQr(text, minEcl, minVersion);
  const higher = LEVELS.slice(LEVELS.indexOf(minEcl) + 1).reverse();
  for (const ecl of higher) {
    try {
      return encodeQr(text, ecl, base.version, base.version);
    } catch (e) {
      if (!(e instanceof CapacityError)) throw e;
    }
  }
  return base;
}
