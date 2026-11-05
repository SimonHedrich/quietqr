/** A validated `#rrggbb` color (lower case). */
export type Hex = `#${string}`;

const HEX_RE = /^#[0-9a-f]{6}$/;

/** True if the value is a `#rrggbb` color in lower case, the only form the renderer accepts. */
export function isHex(value: string): value is Hex {
  return HEX_RE.test(value);
}

/**
 * Parses user input like `#ABC`, `abc`, `#aabbcc` or ` AABBCC ` into a lower-case `#rrggbb`.
 * Returns `null` for anything else.
 */
export function parseHex(input: string): Hex | null {
  let s = input.trim().toLowerCase();
  if (s.startsWith('#')) s = s.slice(1);
  if (/^[0-9a-f]{3}$/.test(s)) s = [...s].map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/.test(s)) return null;
  return `#${s}`;
}

/** Relative luminance (WCAG 2.x) of a `#rrggbb` color, 0 (black) to 1 (white). */
export function luminance(hex: Hex): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio between two colors, 1 to 21. */
export function contrastRatio(a: Hex, b: Hex): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
