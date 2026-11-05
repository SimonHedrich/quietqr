import { isHex, type Hex } from '../color';
import type { Shape } from '../style';
import type { QrMatrix } from './encode';
import { inArea, logoArea, type Area } from './logo';

/** Quiet zone in modules on every side. Fixed by design. */
export const QUIET_ZONE = 4;

/** Everything the renderer needs besides the matrix. */
export interface RenderOptions {
  shape: Shape;
  fg: Hex;
  bg: Hex;
  /** Omit the background rectangle. */
  transparent: boolean;
  /** Logo as a `data:image/png;base64,…` URL produced by our own canvas code. */
  logo?: string | undefined;
  /** If set, the SVG gets `width`/`height` of `pixelSize × modules`. */
  pixelSize?: number | undefined;
}

const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;

/** Formats a coordinate compactly (no float noise, no trailing zeros). */
function n(v: number): string {
  return String(Math.round(v * 1000) / 1000);
}

/** A rounded square as path data. */
function roundedSquare(x: number, y: number, s: number, r: number): string {
  const e = s - 2 * r;
  return (
    `M${n(x + r)} ${n(y)}h${n(e)}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(r)}v${n(e)}` +
    `a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(r)}h${n(-e)}a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(-r)}` +
    `v${n(-e)}a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(-r)}z`
  );
}

/** A circle as path data, centered at (cx, cy). */
function circle(cx: number, cy: number, r: number): string {
  return `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0`;
}

/** Path data for the three finder patterns (draw with `fill-rule="evenodd"`). */
function finderPath(size: number, shape: Shape): string {
  const corners = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ] as const;
  return corners
    .map(([cx, cy]) => {
      const x = cx + QUIET_ZONE;
      const y = cy + QUIET_ZONE;
      switch (shape) {
        case 'square':
          return `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
        case 'rounded':
          return (
            roundedSquare(x, y, 7, 2) +
            roundedSquare(x + 1, y + 1, 5, 1.25) +
            roundedSquare(x + 2, y + 2, 3, 0.9)
          );
        case 'dots':
          return (
            circle(x + 3.5, y + 3.5, 3.5) +
            circle(x + 3.5, y + 3.5, 2.5) +
            circle(x + 3.5, y + 3.5, 1.5)
          );
      }
    })
    .join('');
}

/** Dot radius for the `dots` shape, in modules. */
export const DOT_RADIUS = 0.4;
/** Corner radius for the `rounded` shape, in modules (0.5 makes a lone module a circle). */
export const CORNER_RADIUS = 0.5;

/** Path data for all non-finder dark modules. */
function modulePath(qr: QrMatrix, shape: Shape, cleared: Area | null): string {
  const { size } = qr;
  const on = (x: number, y: number): boolean =>
    qr.modules[y]?.[x] === true &&
    qr.kind[y]?.[x] !== 'finder' &&
    !(cleared && inArea(cleared, x, y));

  const parts: string[] = [];
  for (let y = 0; y < size; y++) {
    let runStart = -1;
    const flush = (end: number) => {
      if (runStart >= 0)
        parts.push(
          `M${runStart + QUIET_ZONE} ${y + QUIET_ZONE}h${end - runStart}v1h${runStart - end}z`,
        );
      runStart = -1;
    };
    for (let x = 0; x < size; x++) {
      if (!on(x, y)) {
        flush(x);
        continue;
      }
      const px = x + QUIET_ZONE;
      const py = y + QUIET_ZONE;
      if (shape === 'dots') {
        parts.push(circle(px + 0.5, py + 0.5, DOT_RADIUS));
        continue;
      }
      if (shape === 'rounded') {
        const t = on(x, y - 1);
        const r = on(x + 1, y);
        const b = on(x, y + 1);
        const l = on(x - 1, y);
        const R = CORNER_RADIUS;
        const tl = !t && !l ? R : 0;
        const tr = !t && !r ? R : 0;
        const br = !b && !r ? R : 0;
        const bl = !b && !l ? R : 0;
        if (tl || tr || br || bl) {
          flush(x);
          parts.push(roundedModule(px, py, tl, tr, br, bl));
          continue;
        }
      }
      if (runStart < 0) runStart = x;
    }
    flush(size);
  }
  return parts.join('');
}

/** A unit square with individually rounded corners. */
function roundedModule(
  x: number,
  y: number,
  tl: number,
  tr: number,
  br: number,
  bl: number,
): string {
  const arc = (r: number, dx: number, dy: number) =>
    r ? `a${n(r)} ${n(r)} 0 0 1 ${n(dx)} ${n(dy)}` : '';
  return (
    `M${n(x + tl)} ${y}h${n(1 - tl - tr)}${arc(tr, tr, tr)}v${n(1 - tr - br)}${arc(br, -br, br)}` +
    `h${n(-(1 - br - bl))}${arc(bl, -bl, -bl)}v${n(-(1 - bl - tl))}${arc(tl, tl, -tl)}z`
  );
}

/**
 * Renders a QR matrix as a minimal, self-contained SVG string. The preview, the SVG download
 * and the PNG export all use this output. Colors must be validated `#rrggbb` and the logo a
 * PNG data URL; anything else throws, so user input can never inject markup.
 */
export function renderSvg(qr: QrMatrix, opts: RenderOptions): string {
  if (!isHex(opts.fg) || !isHex(opts.bg)) throw new Error('Invalid color');
  if (opts.logo !== undefined && !PNG_DATA_URL.test(opts.logo)) throw new Error('Invalid logo');

  const total = qr.size + 2 * QUIET_ZONE;
  const area = opts.logo ? logoArea(qr.size) : null;
  const dims = opts.pixelSize
    ? ` width="${total * opts.pixelSize}" height="${total * opts.pixelSize}"`
    : '';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}"${dims}>`;
  if (!opts.transparent) svg += `<rect width="${total}" height="${total}" fill="${opts.bg}"/>`;
  svg += `<path fill="${opts.fg}" fill-rule="evenodd" d="${finderPath(qr.size, opts.shape)}"/>`;
  svg += `<path fill="${opts.fg}" d="${modulePath(qr, opts.shape, area?.cleared ?? null)}"/>`;
  if (area && opts.logo) {
    const { x, y, size } = area.logo;
    svg +=
      `<image x="${x + QUIET_ZONE}" y="${y + QUIET_ZONE}" width="${size}" height="${size}" ` +
      `preserveAspectRatio="xMidYMid meet" href="${opts.logo}"/>`;
  }
  return svg + '</svg>';
}
