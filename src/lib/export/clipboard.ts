/** True if the browser can put a PNG on the clipboard (`ClipboardItem` + `clipboard.write`). */
export function canCopyImage(): boolean {
  return (
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function' &&
    (typeof ClipboardItem.supports !== 'function' || ClipboardItem.supports('image/png'))
  );
}

/**
 * Copies a PNG to the clipboard. Takes a promise so the clipboard write starts inside the
 * click handler (Safari requires that) while the PNG is still being rendered.
 */
export async function copyPng(png: Promise<Blob>): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}

/** Copies text to the clipboard. */
export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
