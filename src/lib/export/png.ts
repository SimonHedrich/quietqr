/** PNG export sizes in pixels. */
export const PNG_SIZES = [512, 1024, 2048] as const;

/** One of {@link PNG_SIZES}. */
export type PngSize = (typeof PNG_SIZES)[number];

/** Loads an image from a blob (object URL, allowed by the CSP as `blob:`). */
export async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Promisified `canvas.toBlob` for PNG. */
export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'),
  );
}

/**
 * Rasterizes the SVG (the same string as the preview) to a square PNG of `size` pixels.
 * A transparent SVG gives a transparent PNG.
 */
export async function svgToPng(svg: string, size: number): Promise<Blob> {
  const img = await loadImage(new Blob([svg], { type: 'image/svg+xml' }));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, size, size);
  return canvasToPng(canvas);
}
