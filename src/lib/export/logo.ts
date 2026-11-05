import { loadImage } from './png';

/** Accepted logo file types. */
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'] as const;

/** Side length of the converted logo in pixels: enough for a sharp 2048 px export. */
const LOGO_PX = 384;

/**
 * Converts an uploaded image (PNG, JPG, WebP or SVG) to a square PNG data URL, the image
 * centered and scaled to fit. Re-encoding through a canvas means an SVG can't carry
 * scripts into the export, and the exported SVG stays self-contained.
 */
export async function logoToPng(file: Blob): Promise<string> {
  if (!(LOGO_TYPES as readonly string[]).includes(file.type)) throw new Error('Unsupported type');
  const img = await loadImage(file);
  // SVGs without width/height report 0; treat them as square.
  const w = img.naturalWidth || LOGO_PX;
  const h = img.naturalHeight || LOGO_PX;
  const scale = LOGO_PX / Math.max(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = LOGO_PX;
  canvas.height = LOGO_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  const dw = w * scale;
  const dh = h * scale;
  ctx.drawImage(img, (LOGO_PX - dw) / 2, (LOGO_PX - dh) / 2, dw, dh);
  return canvas.toDataURL('image/png');
}
